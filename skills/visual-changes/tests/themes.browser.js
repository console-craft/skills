async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const old = Array.from({ length: 120 }, (_, i) => `export const value${i + 1} = ${i + 1};`).join('\n') + '\n';
  const data = { comparison: { repository: 'test/themes', title: 'Coordinated themes', kind: 'working-tree', mergeBase: '1111111111111111111111111111111111111111', head: '2222222222222222222222222222222222222222' }, files: [
    { path: 'code.ts', status: 'modified', additions: 1, deletions: 1, source: { old, next: old.replace('value60 = 60', 'value60 = 600') } },
    { path: 'extra.ts', status: 'added', additions: 1, deletions: 0, source: { old: null, next: 'export const extra = true;\n' } }
  ], stops: [{ id: 'themes', title: 'Theme every surface', shortTitle: 'Themes', summary: 'Keep the guide and source coherent.', attention: 'Check contrast.', excerpts: [{ id: 'code', path: 'code.ts', side: 'new', start: 59, end: 61 }], relatedFiles: [{ path: 'extra.ts', reason: 'Supporting source gets the same palette.' }], notes: [{ excerptId: 'code', side: 'new', line: 60, title: 'A real source note', body: 'This selected source must survive a theme change.' }] }] };
  const mount = async (payload = data) => {
    const json = JSON.stringify(payload).replaceAll('<', '\\u003c');
    const html = source.replace(/(<script id="tour-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + json + b).replace('<script type="module">', '<script>localStorage.clear()</script><script type="module">');
    await page.route('https://themes.test/tour', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.goto('https://themes.test/tour');
    await page.locator('#engine-status[data-state="loaded"]').waitFor();
  };
  await mount();
  const select = page.getByRole('combobox', { name: 'Theme', exact: true });
  check(await select.count() === 1, 'Header needs an accessible Theme dropdown');
  check((await select.locator('option').allTextContents()).join('|') === 'Gruvware Dark|Gruvware Light|Pierre Dark|Pierre Light|Tokyo Night|Nord|Dracula|Catppuccin Mocha|Gruvbox Light|Gruvbox Dark', 'Dropdown offers both Gruvware variants and all eight existing named themes');
  check(await page.locator('.brand .divider').textContent() === '•', 'Header uses the requested bullet separator');
  check(await select.inputValue() === 'gruvware-dark', 'Fresh guide uses Gruvware Dark as default');
  await page.locator('#collapse-all-diffs').click();
  const primary = page.locator('#excerpts [data-component="source-diff"]').first();
  await primary.locator('[data-code]').first().waitFor();
  await primary.locator('[data-expand-button]').first().click();
  const expandedRows = await primary.locator('[data-code] [data-line]').count();
  await page.evaluate(() => { window.themeNoteScrolls = 0; const reveal = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (...args) { if (this.matches('[data-note-index]')) window.themeNoteScrolls++; return reveal.apply(this, args); }; });
  await page.locator('#notes button').click();
  await page.locator('#mark-read').click();
  await page.locator('#wrap').click();
  const states = [
    ['gruvware-dark', 'dark', 'rgb(42, 41, 40)', 'rgb(212, 190, 152)', 'rgb(42, 41, 40)'],
    ['gruvware-light', 'light', 'rgb(251, 241, 199)', 'rgb(60, 56, 54)', 'rgb(251, 241, 199)'],
    ['pierre-light', 'light', 'rgb(255, 255, 255)', 'rgb(36, 41, 47)', 'rgb(255, 255, 255)'],
    ['tokyo-night', 'dark', 'rgb(26, 27, 38)', 'rgb(192, 202, 245)', 'rgb(26, 27, 38)'],
    ['nord', 'dark', 'rgb(46, 52, 64)', 'rgb(216, 222, 233)', 'rgb(46, 52, 64)'],
    ['dracula', 'dark', 'rgb(40, 42, 54)', 'rgb(248, 248, 242)', 'rgb(40, 42, 54)'],
    ['catppuccin-mocha', 'dark', 'rgb(30, 30, 46)', 'rgb(205, 214, 244)', 'rgb(30, 30, 46)'],
    ['gruvbox-light-medium', 'light', 'rgb(251, 241, 199)', 'rgb(60, 56, 54)', 'rgb(251, 241, 199)'],
    ['gruvbox-dark-medium', 'dark', 'rgb(40, 40, 40)', 'rgb(235, 219, 178)', 'rgb(40, 40, 40)'],
    ['pierre-dark', 'dark', 'rgb(12, 14, 17)', 'rgb(233, 234, 237)', 'rgb(10, 10, 10)']
  ];
  const tokenColors = [];
  const luminance = color => {
    const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  };
  for (const [name, mode, background, foreground, codeBackground] of states) {
    await select.selectOption(name);
    await page.waitForFunction(expected => [...document.querySelectorAll('[data-renderer] diffs-container')].every(host => getComputedStyle(host).backgroundColor === expected), codeBackground);
    check(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor) === background, `${name} changes actual shell background`);
    check(await page.locator('body').evaluate(el => getComputedStyle(el).color) === foreground, `${name} changes actual shell foreground`);
    check(await page.locator('html').evaluate((el, mode) => getComputedStyle(el).colorScheme === mode && el.classList.contains('dark') === (mode === 'dark'), mode), `${name} synchronizes color scheme and Flowbite dark class`);
    check(await primary.locator('[data-code] [data-line]').count() === expandedRows, 'Theme change retains native incremental context');
    check(await page.locator('#notes button').getAttribute('aria-pressed') === 'true' && await primary.locator('[data-code] [data-line="60"][data-selected-line]').count() > 0, 'Theme change retains note ownership and real selected source');
    check(await page.locator('#rail-count').textContent() === '1 / 1 read', 'Changing theme does not change read marks');
    check(await page.evaluate(() => window.themeNoteScrolls) === 1, 'Theme repaint does not replay the active note reveal scroll');
    tokenColors.push(await primary.locator('[data-code] [data-line="60"] span').first().evaluate(el => getComputedStyle(el).color));
    if (mode === 'light' || !['pierre-dark', 'tokyo-night'].includes(name)) {
      for (const selector of ['#stop-summary', '#engine-status', '.source-details dd', '.source-details code', '#rail .rail-title', '#notes .rail-title', '.rail button .rail-sub', '#excerpts [data-note-index="0"]', '#reset-settings', '#theme-select', '#wrap', '[aria-label="File context"] [aria-pressed="true"]', '.file-status', '.stats .additions', '.stats .deletions', '#notes .bullet']) {
        const colors = await page.locator(selector).first().evaluate(el => { let parent = el; while (parent && getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent = parent.parentElement; return { fg: getComputedStyle(el).color, bg: parent ? getComputedStyle(parent).backgroundColor : 'rgb(255, 255, 255)' }; });
        const a = luminance(colors.fg), b = luminance(colors.bg);
        check((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${name} keeps readable text contrast: ${selector}`);
      }
    }
    check(await page.locator('#rail .rail-title').first().evaluate(el => getComputedStyle(el).color) === foreground && await page.locator('#notes .rail-title').first().evaluate(el => getComputedStyle(el).color) === foreground, `${name} keeps stop/note titles in primary text`);
    check(await page.locator('.source-details code').first().evaluate(el => getComputedStyle(el).color !== getComputedStyle(el.parentElement).color), `${name} distinguishes commit hashes from their labels`);
    check(await primary.locator('pre[data-overflow="wrap"]').count() > 0 && await page.locator('#wrap').getAttribute('aria-pressed') === 'true', `${name} retains wrapping while changing theme`);
  }
  check(new Set(tokenColors).size === 10, 'The real syntax-token palette changes for every theme');
  await primary.locator('[data-gutter] [data-column-number="59"]').last().click();
  await select.selectOption('pierre-light');
  await primary.locator('[data-code] [data-line="59"][data-selected-line]').waitFor();
  check(await primary.locator('[data-action="copy-selection"]').textContent() === 'Copy selected new lines 59–59', 'Manual selection and copy action survive a theme change');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://themes.test' });
  await primary.locator('[data-action="copy-selection"]').click();
  check(await page.evaluate(() => navigator.clipboard.readText()) === 'export const value59 = 59;\n', 'Light-theme manual selection still copies exact original source');
  await page.locator('#split').click();
  await select.selectOption('tokyo-night');
  await primary.locator('[data-code][data-additions] [data-line="59"][data-selected-line]').waitFor();
  await primary.locator('[data-action="collapse-diff"]').click();
  await select.selectOption('pierre-light');
  check(await primary.locator('.diff-body').isHidden(), 'Theme changes do not reopen collapsed cards');
  await primary.locator('[data-action="collapse-diff"]').click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#excerpts diffs-container')).backgroundColor === 'rgb(255, 255, 255)');
  await select.selectOption('catppuccin-mocha');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#excerpts diffs-container')).backgroundColor === 'rgb(30, 30, 46)');
  check(await select.evaluate(el => { const css = getComputedStyle(el), context = document.createElement('canvas').getContext('2d'); context.font = css.font; return context.measureText(el.selectedOptions[0].textContent).width <= el.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight); }), 'Long theme name remains readable inside the dropdown');
  for (const width of [1440, 900, 390]) {
    await page.setViewportSize({ width, height: 950 });
    check(await select.isVisible() && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Theme header stays usable without overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  for (const renamed of [false, true]) {
    const payload = JSON.parse(JSON.stringify(data)); payload.comparison.head = 'fallback-' + renamed;
    payload.files = [renamed ? { path: 'code.ts', previousPath: 'before.ts', status: 'renamed', additions: 0, deletions: 0, source: { old: 'unchanged\n', next: 'unchanged\n' } } : { path: 'code.ts', status: 'modified', additions: 1, deletions: 1, patch: 'diff --git a/code.ts b/code.ts\n--- a/code.ts\n+++ b/code.ts\n@@ -42 +42 @@\n-old text\n+new text\n', unavailableReason: 'Complete source unavailable.' }];
    payload.stops[0].excerpts = [{ id: 'code', path: 'code.ts', side: 'new', start: renamed ? 1 : 42, end: renamed ? 1 : 42 }]; payload.stops[0].relatedFiles = []; payload.stops[0].notes = [];
    await mount(payload);
    await page.locator('[data-action="focus-excerpt"]').click();
    await page.locator('[data-code]').first().waitFor();
    for (const [theme, background] of [['gruvware-dark', 'rgb(42, 41, 40)'], ['gruvware-light', 'rgb(251, 241, 199)'], ['tokyo-night', 'rgb(26, 27, 38)']]) {
      await select.selectOption(theme);
      await page.waitForFunction(expected => getComputedStyle(document.querySelector('diffs-container')).backgroundColor === expected, background);
      check(await page.locator('[data-code] [data-selected-line]').count() > 0, 'Patch-only and unchanged File renderers use the selected theme and source range');
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return 'PASS: coordinated ten-theme shell and real syntax, primary/supporting/patch/File renderers, context/notes/manual selections/collapse/read state, readable new palettes and mobile header';
}
