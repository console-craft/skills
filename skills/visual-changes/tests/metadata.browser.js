async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const data = {
    comparison: { repository: 'test/metadata', title: 'Source labels', kind: 'pull-request', number: 7, url: 'https://example.com/pull/7', baseRef: 'main', headRef: 'feat/source-labels', mergeBase: 'a'.repeat(40), head: 'b'.repeat(40), baseTip: 'c'.repeat(40) },
    files: [{ path: 'value.txt', status: 'modified', additions: 1, deletions: 1, source: { old: 'before\n', next: 'after\n' } }],
    stops: [{ id: 'labels', title: 'Labels', shortTitle: 'Labels', summary: 'Show the actual versions.', excerpts: [{ id: 'value', path: 'value.txt', side: 'new', start: 1, end: 1 }], notes: [] }]
  };
  const mount = async comparison => {
    const json = JSON.stringify({ ...data, comparison }).replaceAll('<', '\\u003c');
    const html = source.replace(/(<script id="tour-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + json + b);
    await page.route('https://metadata.test/tour', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.goto('https://metadata.test/tour');
    await page.locator('#engine-status[data-state="loaded"]').waitFor();
    await page.locator('[data-component="comparison-provenance"] summary').click();
  };
  const identity = page.locator('[data-field="comparison-kind"]').locator('..');
  const before = page.locator('[data-field="source-before"]');
  const after = page.locator('[data-field="source-after"]');
  await mount(data.comparison);
  check(await page.locator('[data-component="comparison-provenance"] summary').textContent() === 'Source details', 'Provenance needs a plain Source details heading');
  check(await identity.isVisible() && (await identity.textContent()).replace(/\s+/g, ' ').trim() === 'Pull request #7', 'Only PR guides keep their useful identity/link eyebrow');
  check(await page.locator('[data-field="change-link"]').getAttribute('href') === data.comparison.url, 'PR number remains linked to its real URL');
  check(await before.textContent() === 'Shared starting commit on main · aaaaaaaa', 'PR Before names its shared starting point with a short commit ID');
  check(await after.textContent() === 'feat/source-labels · bbbbbbbb', 'PR After names the head branch and short commit ID');
  check(await page.locator('[data-field="comparison-pins"] dt').allTextContents().then(labels => labels.join('|')) === 'Before:|After:|Captured:', 'Source details uses explicit definition-list labels');
  check(await page.locator('[data-field="captured-row"]').isHidden(), 'PR details do not invent a capture time');
  check(!(await page.locator('[data-field="comparison-pins"]').innerText()).includes('cccccccc'), 'Uncompared base-branch tip does not masquerade as the Before version');
  const embeddedPR = JSON.parse(await page.locator('#tour-data').textContent()).comparison;
  check(embeddedPR.mergeBase === data.comparison.mergeBase && embeddedPR.head === data.comparison.head && embeddedPR.baseTip === data.comparison.baseTip, 'Full comparison identifiers remain intact in inert data');
  const local = { repository: 'test/metadata', title: 'Local snapshot', kind: 'working-tree', baseRef: 'main', label: 'Working tree → HEAD (main)', mergeBase: 'd'.repeat(40), head: 'working-tree SHA-256 ' + 'e'.repeat(64), capturedAt: '2026-11-08T11:18:29.422436+02:00' };
  for (const kind of ['working-tree', 'staged']) {
    await mount({ ...local, kind });
    check(await identity.isHidden(), `${kind} has no redundant comparison-kind eyebrow`);
    check(await before.textContent() === 'Last commit on main · dddddddd', `${kind} Before identifies the last commit`);
    check(await after.textContent() === (kind === 'staged' ? 'Saved snapshot of staged files' : 'Saved snapshot of uncommitted files'), `${kind} After describes a snapshot, not a second commit`);
    const captured = page.locator('[data-field="source-captured"]');
    check(await captured.isVisible() && await captured.getAttribute('datetime') === local.capturedAt && (await captured.textContent()).includes('2026'), 'Known capture time is rendered readably with its original timestamp');
    check(!await page.locator('[data-field="comparison-pins"]').innerText().then(text => text.includes('SHA-256') || text.includes('eeeeeeee')), 'Snapshot fingerprints stay out of the reader-facing details');
  }
  for (const capturedAt of [undefined, 'not-a-date']) {
    await mount({ ...local, capturedAt, baseRef: undefined, mergeBase: undefined });
    check(await page.locator('[data-field="captured-row"]').isHidden(), 'Unknown or invalid capture dates do not become made-up timestamps');
    check(await before.textContent() === 'Last commit', 'Missing branch/commit metadata falls back honestly');
  }
  for (const kind of ['commit', 'branch']) {
    await mount({ ...data.comparison, kind });
    check(await identity.isHidden(), `${kind} also hides the PR-only identity row`);
    check((await before.textContent()).endsWith('aaaaaaaa') && (await after.textContent()).endsWith('bbbbbbbb'), `${kind} still identifies both immutable comparison versions`);
  }
  const hostile = '<img src=x onerror=alert(1)>';
  await mount({ ...data.comparison, baseRef: hostile, headRef: hostile });
  check((await before.textContent()).includes(hostile) && (await after.textContent()).includes(hostile), 'Source descriptions retain literal untrusted branch text');
  check(await page.locator('[data-field="comparison-pins"] img').count() === 0, 'Source metadata is never interpolated as executable HTML');
  await page.setViewportSize({ width: 390, height: 950 });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Labeled source details wrap without mobile page overflow');
  await page.setViewportSize({ width: 1440, height: 950 });
  return 'PASS: PR-only identity/link, labeled before/after, short commits, immutable data retained, working/staged snapshot descriptions, known/missing/invalid timestamps, commit/branch compatibility, hostile text and mobile wrapping';
}
