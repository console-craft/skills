async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const data = JSON.parse(source.match(/<script id="tour-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await page.route('https://reset.test/tour', route => route.fulfill({ contentType: 'text/html', body: source }));
  await page.goto('https://reset.test/tour');
  await page.locator('#engine-status[data-state="loaded"]').waitFor();
  const reset = page.getByRole('button', { name: 'Reset guide', exact: true });
  check(await reset.count() === 1, 'Walkthrough needs a native Reset guide button');
  check(await reset.locator('svg[aria-hidden="true"][focusable="false"] path').count() > 0, 'Reset guide includes a decorative inline undo-arrow SVG');
  check(await reset.evaluate(el => el.nextElementSibling?.id === 'previous-icon'), 'Reset is immediately before up/down navigation');
  check(await reset.evaluate(el => el.nextElementSibling.getBoundingClientRect().left - el.getBoundingClientRect().right >= 8), 'Reset has visible breathing room before the arrows');
  await reset.click();
  await page.locator('#mark-read').click();
  await page.locator('#next').click();
  await page.locator('#mark-read').click();
  await page.locator('#collapse-all-diffs').click();
  await page.locator('#excerpts [data-context="full"]').first().click();
  await page.locator('#notes button').first().click();
  await page.locator('#split').click();
  await page.locator('#wrap').click();
  const key = await page.evaluate(() => Object.keys(localStorage).find(key => key.startsWith('visual-changes:') && key !== 'visual-changes:v1:another-walkthrough'));
  check(!!key, 'Fixture has real saved walkthrough settings');
  await page.evaluate(key => {
    sessionStorage.setItem(key, 'current walkthrough session settings');
    for (const store of [localStorage, sessionStorage]) {
      store.setItem('visual-changes:v1:another-walkthrough', 'keep other walkthrough');
      store.setItem('unrelated-app', 'keep unrelated app');
    }
  }, key);
  const defaults = async () => {
    check(await page.locator('#tour').getAttribute('data-stop-id') === 'identity' && await page.evaluate(() => location.hash) === '#identity', 'Reset returns to the first stop and updates its URL');
    check(await page.locator('#unified').getAttribute('aria-pressed') === 'true', 'Reset restores unified layout');
    check(await page.locator('#no-wrap').getAttribute('aria-pressed') === 'true', 'Reset restores No-Wrap');
    check(await page.locator('#rail-count').textContent() === `0 / ${data.stops.length} read`, 'Reset clears every read mark, not only the active stop');
    check(await page.locator('#progress').getAttribute('aria-valuenow') === '0', 'Reset clears read progress');
    check(await page.locator('.diff-body').evaluateAll(els => els.every(el => el.hidden)), 'Reset collapses primary and supporting diffs');
    check(await page.locator('[data-context="hunks"]').evaluateAll(els => els.every(el => el.getAttribute('aria-pressed') === 'true')), 'Reset restores Hunks for every context group');
    check(await page.locator('#notes button[aria-pressed="true"]').count() === 0, 'Reset clears active notes');
    check(await page.locator('[data-field="copy-status"]').evaluateAll(els => els.every(el => !el.textContent)), 'Reset clears clipboard feedback');
  };
  await reset.click();
  await defaults();
  check(await page.evaluate(key => [localStorage, sessionStorage].every(store => store.getItem(key) === null && store.getItem('visual-changes:v1:another-walkthrough') === 'keep other walkthrough' && store.getItem('unrelated-app') === 'keep unrelated app'), key), 'Only this walkthrough key is removed from both stores');
  await page.reload();
  await page.locator('#engine-status[data-state="loaded"]').waitFor();
  await defaults();
  await page.locator('#next').click();
  check(await page.locator('.diff-body').evaluateAll(els => els.every(el => el.hidden)), 'Reset also restores defaults for unmounted stops');
  for (const blocked of ['localStorage', 'sessionStorage']) {
    await page.locator('#split').click();
    await page.locator('#mark-read').click();
    await page.evaluate(({ key, blocked }) => {
      sessionStorage.setItem(key, 'session settings');
      const store = window[blocked];
      Object.defineProperty(window, blocked, { configurable: true, get() { throw new Error('Storage blocked'); } });
      window.restoreResetStorage = () => Object.defineProperty(window, blocked, { configurable: true, value: store });
    }, { key, blocked });
    await reset.click();
    await defaults();
    check(await page.locator('#storage-status').isVisible(), 'Failed storage removal shows a warning while resetting in memory');
    await page.evaluate(() => window.restoreResetStorage());
    check(await page.evaluate(({ key, blocked }) => window[blocked === 'localStorage' ? 'sessionStorage' : 'localStorage'].getItem(key) === null, { key, blocked }), 'Failure of one store does not prevent clearing the other');
    await reset.click();
    check(await page.locator('#storage-status').isHidden(), 'A successful retry clears the reset warning');
  }
  return 'PASS: scoped reset in both stores, other walkthrough/unrelated data preserved, all defaults/read marks restored, reload/unmounted stops, independent storage failures and retry';
}
