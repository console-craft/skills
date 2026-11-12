async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const old = Array.from({ length: 100 }, (_, i) => `export const line${i + 1} = ${i + 1};`).join('\n') + '\n';
  const data = {
    comparison: { repository: 'test/polish', title: 'A clear page heading', kind: 'pull-request', number: 1, mergeBase: '1111111111111111111111111111111111111111', head: '2222222222222222222222222222222222222222' },
    files: [{ path: 'source.ts', status: 'modified', additions: 1, deletions: 1, source: { old, next: old.replace('line80 = 80', 'line80 = 800') } }],
    stops: ['new', 'old'].map(side => ({ id: side, title: 'A smaller stop heading', shortTitle: 'Readable stop title', summary: 'Leave room between this summary and its surrounding sections.', excerpts: [{ id: 'source', path: 'source.ts', side, start: 75, end: 93, caption: 'Explain the change.' }], notes: [{ excerptId: 'source', side, line: 80, title: 'Readable note title', body: 'Keep secondary explanation muted.' }] }))
  };
  const html = source.replace(/(<script id="tour-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(data) + b).replace('<script type="module">', '<script>localStorage.clear()</script><script type="module">');
  await page.route('https://polish.test/tour', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto('https://polish.test/tour');
  await page.locator('#engine-status[data-state="loaded"]').waitFor();
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const geometry = await page.evaluate(() => {
    const reset = document.querySelector('#reset-settings').getBoundingClientRect(), up = document.querySelector('#previous-icon').getBoundingClientRect(), down = document.querySelector('#next-icon').getBoundingClientRect();
    return { arrows: down.left - up.right, reset: up.left - reset.right, stop: parseFloat(getComputedStyle(document.querySelector('#stop-title')).fontSize), page: parseFloat(getComputedStyle(document.querySelector('#change-title')).fontSize) };
  });
  check(geometry.arrows >= 8 && geometry.reset >= 24 && geometry.reset > geometry.arrows, 'Arrow buttons need an 8px gap and Reset a distinct 24px separation');
  check(geometry.stop <= 24 && geometry.page - geometry.stop >= 4, 'Stop heading must sit clearly below the page heading in the type hierarchy');
  await page.locator('.provenance').evaluate(el => { el.open = true; });
  const colors = await page.evaluate(() => {
    const color = selector => getComputedStyle(document.querySelector(selector)).color;
    return { foreground: getComputedStyle(document.body).color, muted: color('.rail-sub'), stop: color('#rail button[aria-current="false"] .rail-title'), note: color('#notes .rail-title'), hash: color('.source-details code'), label: color('[data-field="source-before"]') };
  });
  check(colors.hash !== colors.label, 'Commit hashes need a distinct color from their provenance labels');
  check(colors.stop === colors.foreground && colors.note === colors.foreground && colors.muted !== colors.foreground, 'Inactive stop and note titles must use primary text while descriptions remain muted');
  const spacing = await page.evaluate(() => Object.fromEntries([['.stop-meta', 24], ['#stop-title', 16], ['#stop-summary', 28], ['.stop-stats', 20], ['.layout-controls', 20], ['.code-caption', 12]].map(([selector, minimum]) => [selector, parseFloat(getComputedStyle(document.querySelector(selector)).marginBottom) >= minimum])));
  check(Object.values(spacing).every(Boolean), 'Main-section groups need the requested breathing room: ' + JSON.stringify(spacing));
  for (const [side, revision] of [['new', 'after-change'], ['old', 'before-change']]) {
    await page.locator(`#rail [data-stop-id="${side}"]`).click();
    const focus = page.locator('[data-action="focus-excerpt"]');
    check(await focus.textContent() === 'Focus on lines 75-93', 'Visible focus label must be concise on both source sides');
    const name = await focus.getAttribute('aria-label');
    check(name.includes(revision) && name.includes('75-93') && name.includes('source.ts'), 'Accessible focus name must retain revision, range and source path');
    await focus.click();
    await page.locator('#excerpts [data-code]').first().waitFor();
    check(await page.locator('#excerpts [data-code] [data-selected-line]').count() >= 19, 'Shortening the focus label must not change selected source range');
  }
  for (const width of [1440, 900, 390]) {
    await page.setViewportSize({ width, height: 950 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Polished controls and headings must not overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  if (failures.length) throw new Error(failures.join('; '));
  return 'PASS: separated arrows/reset, distinct hashes, smaller heading, airy spacing, primary stop/note titles, concise focus with accessible source side and correct real selection, three viewports';
}
