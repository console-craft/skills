async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const long = 'a long line with words to wrap '.repeat(60);
  const old = Array.from({ length: 120 }, (_, i) => `export const value${i + 1} = ${i + 1};`).join('\n') + '\n';
  const next = old.replace('value60 = 60', `value60 = "${long}"`);
  const data = { comparison: { repository: 'test/context-wrap', title: 'Explicit source views', kind: 'working-tree', mergeBase: 'old', head: 'new' }, files: [
    { path: 'code.ts', status: 'modified', additions: 1, deletions: 1, source: { old, next } },
    { path: 'extra.ts', status: 'added', additions: 1, deletions: 0, source: { old: null, next: `export const extra = "${long}";\n` } }
  ], stops: [
    { id: 'first', title: 'Explicit source views', shortTitle: 'First', summary: 'Preserve source state while changing presentation.', excerpts: [{ id: 'code', path: 'code.ts', side: 'new', start: 60, end: 60 }], relatedFiles: [{ path: 'extra.ts', reason: 'Lazy supporting renderer.' }], notes: [{ excerptId: 'code', side: 'new', line: 60, title: 'A real source note', body: 'Keep this selection.' }] },
    { id: 'second', title: 'Another stop', shortTitle: 'Second', summary: 'New renderers use the current wrapping choice.', excerpts: [{ id: 'other', path: 'code.ts', side: 'new', start: 60, end: 60 }], notes: [] }
  ] };
  const mount = async (payload = data, options = {}) => {
    let html = source.replace(/(<script id="tour-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(payload).replaceAll('<', '\\u003c') + b);
    if (options.clear) html = html.replace('<script type="module">', '<script>localStorage.clear()</script><script type="module">');
    if (options.blocked) html = html.replace('<script type="module">', '<script>Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error("Blocked"); };</script><script type="module">');
    await page.route('https://context-wrap.test/tour', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.goto('https://context-wrap.test/tour');
    await page.locator('body[data-viewer-state="ready"]').waitFor();
    if (!options.pending) await page.locator('#engine-status[data-state="loaded"]').waitFor();
  };
  await page.setViewportSize({ width: 1000, height: 950 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(data, { clear: true });
  const wrapping = page.getByRole('group', { name: 'Line wrapping', exact: true });
  check(await wrapping.count() === 1, 'Add a Wrap / No-Wrap group beside Unified / Split');
  check((await wrapping.getByRole('button').allTextContents()).join('|') === 'Wrap|No-Wrap', 'Wrapping group has the requested option labels');
  check(await page.locator('#no-wrap').getAttribute('aria-pressed') === 'true', 'Fresh guide defaults to No-Wrap');
  check(await wrapping.evaluate(el => !!(document.querySelector('[aria-label="Diff layout"]').compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)), 'Wrapping group follows the layout group');
  await page.locator('#collapse-all-diffs').click();
  const primary = page.locator('#excerpts [data-component="source-diff"]').first();
  const related = page.locator('#related-list [data-component="source-diff"]').first();
  await primary.locator('[data-code]').first().waitFor();
  const full = primary.getByRole('button', { name: 'Full file', exact: true, includeHidden: true }), hunks = primary.getByRole('button', { name: 'Hunks', exact: true, includeHidden: true });
  check((await primary.getByRole('group', { name: 'File context', exact: true }).getByRole('button').allTextContents()).join('|') === 'Full file|Hunks', 'Per-file context uses the existing segmented-control pattern');
  check(await hunks.getAttribute('aria-pressed') === 'true' && await full.getAttribute('aria-pressed') === 'false', 'Hunks remains the initial per-file context');
  await full.click(); await primary.locator('[data-code] [data-line="120"]').last().waitFor();
  await full.click();
  check(await full.getAttribute('aria-pressed') === 'true' && await primary.locator('[data-code] [data-line="120"]').count() > 0, 'Clicking the active Full file option must not toggle back to Hunks');
  await hunks.click(); await primary.locator('[data-expand-button]').first().waitFor();
  check(await hunks.getAttribute('aria-pressed') === 'true' && await primary.locator('[data-code] [data-line="120"]').count() === 0, 'Hunks restores the real collapsed-hunk view');
  await primary.locator('[data-expand-button]').first().click();
  const rows = await primary.locator('[data-code] [data-line]').count();
  await related.locator('[data-action="collapse-diff"]').click();
  await page.evaluate(() => { window.wrapHost = document.querySelector('#excerpts diffs-container'); window.wrapScrolls = 0; const original = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (...args) { if (this.matches('[data-note-index]')) window.wrapScrolls++; return original.apply(this, args); }; });
  await page.locator('#notes button').click(); await page.locator('#mark-read').click();
  const line = primary.locator('[data-code] [data-line="60"]:not([data-line-type="change-deletion"])').last();
  const singleHeight = await line.evaluate(el => el.getBoundingClientRect().height);
  await page.locator('#wrap').click();
  await page.waitForFunction(height => { const root = document.querySelector('#excerpts diffs-container')?.shadowRoot; return [...root.querySelectorAll('[data-code] [data-line="60"]:not([data-line-type="change-deletion"])')].at(-1)?.getBoundingClientRect().height > height * 2; }, singleHeight);
  check(await primary.locator('[data-code] [data-line]').count() === rows, 'Wrapping retains incremental context rather than rebuilding the diff');
  check(await page.evaluate(() => window.wrapHost === document.querySelector('#excerpts diffs-container') && window.wrapScrolls === 1), 'Wrapping reuses the source host and does not replay note scrolling');
  check(await page.locator('#notes button').getAttribute('aria-pressed') === 'true' && await primary.locator('[data-code] [data-line="60"][data-selected-line]').count() > 0 && await page.locator('#rail-count').textContent() === '1 / 2 read', 'Wrapping preserves note ownership, real selected source and read state');
  check(await related.locator('.diff-body').isHidden(), 'Wrapping must not reopen a collapsed supporting card');
  await related.locator('[data-action="collapse-diff"]').click(); await related.locator('[data-code]').first().waitFor();
  check(await related.locator('[data-code] [data-line="1"]').first().evaluate(el => el.getBoundingClientRect().height) > singleHeight * 2, 'Lazy supporting diffs inherit Wrap');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://context-wrap.test' });
  await primary.locator('[data-action="copy-selection"]').click();
  check(await page.evaluate(() => navigator.clipboard.readText()) === `export const value60 = "${long}";\n`, 'Wrapped-line copying preserves the exact original line, not visual breaks');
  await primary.locator('[data-gutter] [data-column-number="59"]').last().click();
  await page.locator('#no-wrap').focus(); await page.keyboard.press('Space');
  await primary.locator('pre[data-overflow="scroll"]').waitFor();
  await page.locator('#wrap').focus(); await page.keyboard.press('Enter');
  await primary.locator('pre[data-overflow="wrap"]').waitFor();
  check(await primary.locator('[data-code] [data-line="59"][data-selected-line]').count() > 0 && await page.locator('#notes button[aria-pressed="true"]').count() === 0, 'Native keyboard wrapping controls preserve a manual source selection without restoring a superseded note');
  await page.locator('#split').click(); await primary.locator('[data-code][data-additions] [data-line="60"]').waitFor();
  check(await primary.locator('[data-code][data-additions] [data-line="60"]').evaluate(el => el.getBoundingClientRect().height) > singleHeight * 2, 'Split renderers inherit Wrap');
  await full.click(); await primary.locator('[data-code] [data-line="120"]').last().waitFor();
  await page.locator('#no-wrap').click();
  await page.waitForFunction(height => document.querySelector('#excerpts diffs-container')?.shadowRoot?.querySelector('[data-code][data-additions] [data-line="60"]')?.getBoundingClientRect().height === height, singleHeight);
  check(await full.getAttribute('aria-pressed') === 'true', 'Disabling wrapping retains Full file');
  await page.locator('#wrap').click();
  await primary.locator('pre[data-overflow="wrap"]').waitFor();
  const key = await page.evaluate(() => Object.keys(localStorage)[0]);
  await mount();
  check(await page.locator('#wrap').getAttribute('aria-pressed') === 'true' && await full.getAttribute('aria-pressed') === 'true' && await page.locator('#split').getAttribute('aria-pressed') === 'true', 'Reload restores guide wrapping and the existing per-card full/layout state');
  await page.locator('#next').click(); await page.locator('[data-action="focus-excerpt"]').click();
  await primary.locator('[data-code] [data-line="60"]').last().waitFor();
  check(await primary.locator('[data-code] [data-line="60"]').last().evaluate(el => el.getBoundingClientRect().height) > singleHeight * 2, 'Another stop inherits Wrap');
  const other = JSON.parse(JSON.stringify(data)); other.comparison.head = 'other'; await mount(other);
  check(await page.locator('#no-wrap').getAttribute('aria-pressed') === 'true', 'Another comparison has an independent No-Wrap default');
  await mount(); await page.locator('#reset-settings').click();
  check(await page.locator('#no-wrap').getAttribute('aria-pressed') === 'true' && await hunks.getAttribute('aria-pressed') === 'true', 'Reset restores No-Wrap and Hunks');
  for (const overflow of [undefined, '__proto__', 'unknown', {}, ['wrap'], true]) {
    await page.evaluate(({ key, overflow }) => localStorage.setItem(key, JSON.stringify({ overflow, theme: 'pierre-light', layout: 'split', read: ['first'] })), { key, overflow });
    await mount();
    check(await page.locator('#no-wrap').getAttribute('aria-pressed') === 'true' && await page.locator('#theme-select').inputValue() === 'pierre-light' && await page.locator('#split').getAttribute('aria-pressed') === 'true' && await page.locator('#rail-count').textContent() === '1 / 2 read', 'Invalid/missing wrapping defaults safely without discarding existing preferences');
  }
  const partial = JSON.parse(JSON.stringify(data)); partial.comparison.head = 'partial';
  partial.files = [{ path: 'code.ts', status: 'modified', additions: 1, deletions: 1, patch: `diff --git a/code.ts b/code.ts\n--- a/code.ts\n+++ b/code.ts\n@@ -60 +60 @@\n-old text\n+${long}\n`, unavailableReason: 'Full source unavailable.' }];
  partial.stops = [partial.stops[0]]; partial.stops[0].relatedFiles = [];
  await mount(partial); await page.locator('[data-action="focus-excerpt"]').click();
  check(await full.isDisabled() && await hunks.getAttribute('aria-pressed') === 'true', 'Partial patches disable Full file, not the honest Hunks view');
  await page.locator('#wrap').click(); await primary.locator('[data-code] [data-line="60"]').last().waitFor();
  check(await primary.locator('[data-code] [data-line="60"]').last().evaluate(el => el.getBoundingClientRect().height) > singleHeight * 2, 'Partial patch renderers wrap their actual supplied source');
  const unchanged = JSON.parse(JSON.stringify(data)); unchanged.comparison.head = 'unchanged';
  unchanged.files = [{ path: 'code.ts', previousPath: 'before.ts', status: 'renamed', additions: 0, deletions: 0, source: { old: next, next } }];
  unchanged.stops = [unchanged.stops[0]]; unchanged.stops[0].relatedFiles = [];
  await mount(unchanged); await page.locator('#collapse-all-diffs').click(); await full.click();
  await page.locator('#wrap').click(); await primary.locator('[data-code] [data-line="60"]').waitFor();
  check(await primary.locator('[data-code] [data-line="60"]').evaluate(el => el.getBoundingClientRect().height) > singleHeight * 2, 'Unchanged File renderers support Wrap in Full file');
  await hunks.click(); check((await primary.locator('[data-field="source-status"]').textContent()).includes('No textual changes. Select Full file'), 'Unchanged Hunks guidance points to the available Full file control');
  await mount(data, { blocked: true }); await page.locator('#wrap').click(); await page.locator('[data-action="focus-excerpt"]').click();
  await primary.locator('[data-code] [data-line="60"]').last().waitFor();
  check(await page.locator('#wrap').getAttribute('aria-pressed') === 'true' && await primary.locator('[data-code] [data-line="60"]').last().evaluate(el => el.getBoundingClientRect().height) > singleHeight * 2, 'Blocked storage still allows real in-memory wrapping');
  for (const width of [1440, 900, 390]) {
    await page.setViewportSize({ width, height: 950 });
    check(await wrapping.isVisible() && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `New control groups and wrapped source fit ${width}px without page overflow`);
  }
  await page.setViewportSize({ width: 1440, height: 950 }); await page.emulateMedia({ reducedMotion: 'no-preference' });
  return 'PASS: explicit/idempotent Full file/Hunks; real Wrap/No-Wrap in unified/split/supporting/patch/File renderers; retained context/notes/selections/copy/read; persistence/isolation/legacy-invalid/blocked/reset; three viewports';
}
