async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const old = Array.from({ length: 180 }, (_, i) => `export const oldItem${i + 1} = ${i + 1};`).join('\n') + '\n';
  const data = { comparison: { repository: 'test/navigation-scroll', title: 'Start each stop at the top', kind: 'commit', mergeBase: 'old', head: 'new' }, files: [{ path: 'long.ts', status: 'modified', additions: 180, deletions: 180, source: { old, next: old.replaceAll('oldItem', 'newItem') } }], stops: ['first', 'second', 'third'].map(id => ({ id, title: `The ${id} stop`, shortTitle: id, summary: 'A deliberately long explanation keeps each stop scrollable while its renderer mounts. '.repeat(20), excerpts: [{ id: 'code', path: 'long.ts', side: 'new', start: 1, end: 3 }], notes: [] })) };
  const html = source.replace(/(<script id="tour-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(data) + b).replace('<script type="module">', '<script>localStorage.clear()</script><script type="module">');
  await page.route('https://navigation-scroll.test/tour', route => route.fulfill({ contentType: 'text/html', body: html }));
  for (const [width, reducedMotion] of [[1440, 'no-preference'], [900, 'reduce'], [390, 'no-preference']]) {
    await page.setViewportSize({ width, height: 650 }); await page.emulateMedia({ reducedMotion });
    await page.goto('https://navigation-scroll.test/tour'); await page.locator('#engine-status[data-state="loaded"]').waitFor();
    await page.locator('#collapse-all-diffs').click(); await page.locator('#excerpts [data-code]').first().waitFor();
    await page.locator('#mark-read').click(); await page.locator('#wrap').click(); await page.locator('#split').click();
    const down = async () => {
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      check(await page.evaluate(() => scrollY) > 100, 'Navigation starts from a genuinely scrolled page');
    };
    const at = async (id, action) => {
      await page.locator('#excerpts [data-code]').first().waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      check(await page.locator('#tour').getAttribute('data-stop-id') === id && await page.evaluate(() => location.hash) === '#' + id, `${action} still changes to the correct stop and URL`);
      check(await page.evaluate(() => scrollY) === 0, `${action} must return the whole page to the top at ${width}px`);
      check(await page.locator('#stop-title').evaluate(el => document.activeElement === el), 'Navigation retains accessible focus on the new stop heading');
      check(await page.locator('#rail-count').textContent() === '1 / 3 read' && await page.locator('#wrap').getAttribute('aria-pressed') === 'true' && await page.locator('#split').getAttribute('aria-pressed') === 'true', 'Scrolling on navigation does not alter read, wrapping or layout preferences');
    };
    await down(); await page.locator('#next').click(); await at('second', 'Footer Next');
    await down(); await page.locator('#previous').click(); await at('first', 'Footer Previous');
    await down(); await page.locator('#next-icon').click(); await at('second', 'Down arrow');
    await down(); await page.locator('#previous-icon').click(); await at('first', 'Up arrow');
    await down(); await page.locator('#stop-title').evaluate(el => el.focus({ preventScroll: true })); await page.keyboard.press('j'); await at('second', 'j shortcut');
    await down(); await page.locator('#stop-title').evaluate(el => el.focus({ preventScroll: true })); await page.keyboard.press('k'); await at('first', 'k shortcut');
    await down();
    if (width <= 760) await page.locator('#mobile-stop').selectOption('2'); else await page.locator('#rail [data-stop-id="third"]').click();
    await at('third', width <= 760 ? 'Mobile selector' : 'Rail selection');
    await down(); await page.locator('#stop-title').evaluate(el => el.focus({ preventScroll: true }));
    const before = await page.evaluate(() => scrollY); await page.keyboard.press('j');
    check(await page.evaluate(() => scrollY) === before && await page.locator('#tour').getAttribute('data-stop-id') === 'third', 'A bounded/no-op navigation must not cause an unrelated jump');
  }
  await page.setViewportSize({ width: 1440, height: 950 }); await page.emulateMedia({ reducedMotion: 'no-preference' });
  return 'PASS: page-top navigation via footer Previous/Next, arrows, j/k and rail/mobile selector; post-render stability, heading focus, read/wrap/layout retained, no-op bounds, desktop/tablet/mobile and reduced motion';
}
