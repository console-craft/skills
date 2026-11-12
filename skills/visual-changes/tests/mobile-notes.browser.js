async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const old = Array.from({ length: 180 }, (_, i) => `export const oldItem${i + 1} = ${i + 1};`).join('\n') + '\n';
  const data = { comparison: { repository: 'test/mobile-notes', title: 'Bidirectional note navigation', kind: 'commit', mergeBase: 'old', head: 'new' }, files: [{ path: 'long.ts', status: 'modified', additions: 180, deletions: 180, source: { old, next: old.replaceAll('oldItem', 'newItem') } }], stops: [{ id: 'notes', title: 'Follow the note', shortTitle: 'Notes', summary: 'Inline annotations should reveal the actual explanation when notes move below the source.', excerpts: [{ id: 'code', path: 'long.ts', side: 'new', start: 1, end: 180 }], notes: [{ excerptId: 'code', side: 'new', line: 45, title: 'First explanation', body: 'Do not jump to this note when the second annotation was clicked.' }, { excerptId: 'code', side: 'new', line: 90, title: 'The target explanation', body: 'The selected annotation should reveal this complete note.' }] }] };
  const settle = () => page.evaluate(async () => {
    const samples = [scrollY]; let frames = 0, stable = 0;
    await new Promise(resolve => { const sample = () => { const current = scrollY; stable = current === samples.at(-1) ? stable + 1 : 0; samples.push(current); if (++frames >= 180 || stable >= 8) resolve(); else requestAnimationFrame(sample); }; requestAnimationFrame(sample); });
    return samples;
  });
  for (const [width, side, reducedMotion] of [[600, 'new', 'no-preference'], [390, 'new', 'reduce'], [900, 'old', 'no-preference'], [1200, 'old', 'reduce'], [1201, 'new', 'reduce'], [1440, 'new', 'no-preference']]) {
    const payload = JSON.parse(JSON.stringify(data)); payload.stops[0].excerpts[0].side = side; payload.stops[0].notes.forEach(note => { note.side = side; });
    const html = source.replace(/(<script id="tour-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(payload) + b).replace('<script type="module">', '<script>localStorage.clear()</script><script type="module">');
    await page.route('https://mobile-notes.test/tour', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.setViewportSize({ width, height: 800 }); await page.emulateMedia({ reducedMotion });
    await page.goto('https://mobile-notes.test/tour'); await page.locator('#engine-status[data-state="loaded"]').waitFor();
    if (side === 'old') await page.locator('#split').click();
    await page.locator('[data-action="focus-excerpt"]').click();
    const inline = page.locator('#excerpts [data-note-index="1"]'), detail = page.locator('#note-notes-1');
    await inline.waitFor(); await inline.scrollIntoViewIfNeeded();
    const narrow = width <= 1200, initialY = await page.evaluate(() => scrollY);
    if (narrow) check(await detail.evaluate(el => el.getBoundingClientRect().top > innerHeight), `The ${width}px fixture reproduces a note below the visible diff`);
    await page.evaluate(() => {
      window.noteDestinations = [];
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (options) { if (this.matches('[data-note-index]')) window.noteDestinations.push({ id: this.id || 'inline', behavior: options?.behavior }); return original.call(this, options); };
    });
    await inline.click();
    const calls = await page.evaluate(() => window.noteDestinations);
    check(calls.length === 1 && calls[0].id === (narrow ? 'note-notes-1' : 'inline'), `Inline note clicks must reveal the matching explanation below the source at ${width}px, without competing source scrolling`);
    check(calls[0].behavior === (reducedMotion === 'reduce' ? 'instant' : 'smooth'), 'Both navigation directions must honor reduced motion');
    const samples = await settle(), finalY = samples.at(-1);
    check(await detail.getAttribute('aria-pressed') === 'true' && await page.locator('#note-notes-0').getAttribute('aria-pressed') === 'false', 'Only the matching note becomes active');
    check(await page.locator('#excerpts [data-renderer]').getAttribute('data-selected-side') === side && await page.locator('#excerpts [data-code] [data-selected-line]').count() > 0, 'Jumping to an explanation preserves the real old/new source selection');
    check(await page.locator('#rail-count').textContent() === '0 / 1 read', 'Viewing notes must not mark a stop read');
    if (narrow) {
      check(finalY > initialY + 100 && await detail.evaluate(el => { const rect = el.getBoundingClientRect(); return rect.top >= -1 && rect.bottom <= innerHeight + 1; }), 'The page actually scrolls until the full matching explanation is visible');
      check(await detail.evaluate(el => document.activeElement === el), 'Keyboard focus follows the revealed note without an extra automatic scroll');
      check(await inline.getAttribute('aria-controls') === 'note-notes-1', 'Inline annotation controls the matching explanation');
      const intermediate = samples.some(value => value > initialY + 1 && value < finalY - 1);
      check(reducedMotion === 'reduce' ? !intermediate : intermediate, 'Actual page motion is animated normally and instant with reduced motion');
      await detail.click(); await settle();
      check(await inline.evaluate(el => { const rect = el.getBoundingClientRect(); return rect.top >= -1 && rect.bottom <= innerHeight + 1; }), 'Clicking the explanation still returns to its source annotation');
      const before = await page.evaluate(() => window.noteDestinations.length);
      await page.locator('#wrap').click(); await page.locator('#theme-select').selectOption('pierre-light');
      await page.waitForFunction(() => getComputedStyle(document.querySelector('diffs-container')).backgroundColor === 'rgb(255, 255, 255)');
      check(await page.evaluate(() => window.noteDestinations.length) === before, 'Later wrapping/theme updates must not replay either navigation direction');
    } else {
      check(calls[0].id === 'inline' && Math.abs(finalY - initialY) < 100, 'Wide-layout annotation behavior stays source-oriented, not a jump below the page');
    }
  }
  await page.setViewportSize({ width: 1440, height: 950 }); await page.emulateMedia({ reducedMotion: 'no-preference' });
  return 'PASS: narrow inline-note to explanation navigation at mobile/tablet/1200px, desktop 1201px+ unchanged, actual normal/reduced page motion, target/focus/ARIA, old/new selection and reverse navigation, no read marks or repaint replay';
}
