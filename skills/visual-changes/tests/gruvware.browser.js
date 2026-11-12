async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const data = { comparison: { repository: 'test/gruvware', title: 'Exact Gruvware', kind: 'working-tree', mergeBase: 'old', head: 'new' }, files: [{ path: 'example.ts', status: 'modified', additions: 2, deletions: 2, source: { old: 'export const number = 111; // old\nexport const text = "before";\n', next: 'export const number = 123; // comment\nexport const text = "hello";\n' } }], stops: [{ id: 'gruvware', title: 'Gruvware', shortTitle: 'Gruvware', summary: 'Use the real custom syntax palette.', excerpts: [{ id: 'code', path: 'example.ts', side: 'new', start: 1, end: 2 }], notes: [] }] };
  const html = source.replace(/(<script id="tour-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(data) + b).replace('<script type="module">', '<script>localStorage.clear()</script><script type="module">');
  await page.route('https://gruvware.test/tour', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.goto('https://gruvware.test/tour');
  await page.locator('#engine-status[data-state="loaded"]').waitFor();
  const select = page.getByRole('combobox', { name: 'Theme', exact: true });
  check(await select.inputValue() === 'gruvware-dark', 'Fresh guides must default to Gruvware Dark');
  check(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor) === 'rgb(42, 41, 40)', 'Default page uses the original Gruvware Dark background, not Gruvbox');
  await page.locator('[data-action="focus-excerpt"]').click();
  await page.locator('[data-code]').first().waitFor();
  for (const [theme, background, foreground, keyword, number, string] of [
    ['gruvware-dark', 'rgb(42, 41, 40)', 'rgb(212, 190, 152)', 'rgb(212, 165, 153)', 'rgb(222, 152, 128)', 'rgb(186, 197, 132)'],
    ['gruvware-light', 'rgb(251, 241, 199)', 'rgb(60, 56, 54)', 'rgb(143, 63, 113)', 'rgb(175, 58, 3)', 'rgb(121, 116, 14)']
  ]) {
    await select.selectOption(theme);
    await page.waitForFunction(expected => getComputedStyle(document.querySelector('diffs-container')).backgroundColor === expected, background);
    check(await page.locator('body').evaluate(el => getComputedStyle(el).color) === foreground, 'Page foreground matches the original Gruvware source');
    const lines = page.locator('[data-code] [data-line]:not([data-line-type="change-deletion"])');
    for (const [text, color] of [['export', keyword], ['123', number], ['hello', string]]) {
      check(await lines.getByText(text, { exact: true }).last().evaluate(el => getComputedStyle(el).color) === color, `Actual ${theme} syntax color matches the pinned source: ${text}`);
    }
  }
  await select.selectOption('pierre-dark'); await page.reload();
  await page.locator('#engine-status[data-state="loaded"]').waitFor();
  check(await select.inputValue() === 'gruvware-dark', 'Fixture starts fresh with the new default even though Pierre remains available');
  await select.selectOption('gruvware-light'); await page.locator('#mark-read').click();
  await page.locator('#reset-settings').click();
  check(await select.inputValue() === 'gruvware-dark' && await page.locator('#rail-count').textContent() === '0 / 1 read', 'Reset restores Gruvware Dark and clears read marks');
  return 'PASS: Gruvware default/reset, exact source backgrounds/foregrounds and real keyword/number/string highlighting in both variants';
}
