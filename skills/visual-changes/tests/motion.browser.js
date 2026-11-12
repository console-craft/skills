async page => {
  const source = await (await page.request.get('http://localhost:43720/template')).text();
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const old = Array.from({ length: 180 }, (_, i) => `export const oldItem${i + 1} = ${i + 1};`).join('\n') + '\n';
  const next = old.replaceAll('oldItem', 'newItem');
  const data = {
    comparison: { repository: 'test/motion', title: 'Follow a note', kind: 'commit', mergeBase: 'old', head: 'new' },
    files: [{ path: 'long.ts', status: 'modified', additions: 180, deletions: 180, source: { old, next } }],
    stops: [{ id: 'motion', title: 'Motion', shortTitle: 'Motion', summary: 'Follow a distant annotation.', excerpts: [{ id: 'code', path: 'long.ts', side: 'new', start: 1, end: 180 }], notes: [{ excerptId: 'code', side: 'new', line: 150, title: 'Distant line', body: 'Scroll here once.' }] }]
  };
  const html = source.replace(/(<script id="tour-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(data).replaceAll('<', '\\u003c') + b);
  await page.route('https://motion.test/tour', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.setViewportSize({ width: 1440, height: 950 });
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion });
    await page.goto('https://motion.test/tour');
    await page.locator('#engine-status[data-state="loaded"]').waitFor();
    if (await page.locator('#collapse-all-diffs').textContent() === 'Reveal all diffs') await page.locator('#collapse-all-diffs').click();
    await page.locator('[data-code] [data-line="1"]').first().waitFor();
    await page.evaluate(() => {
      const host = document.querySelector('[data-renderer]');
      host.scrollTop = 0;
      window.noteRevealCalls = 0;
      const reveal = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (...args) { if (this.matches('[data-note-index]')) window.noteRevealCalls++; return reveal.apply(this, args); };
      document.addEventListener('click', () => {
        window.noteScrollSamples = [host.scrollTop]; window.noteScrollDone = false;
        let frames = 0, stable = 0;
        const sample = () => {
          const previous = window.noteScrollSamples.at(-1), current = host.scrollTop;
          window.noteScrollSamples.push(current);
          stable = current === previous && current > 100 ? stable + 1 : 0;
          if (++frames >= 120 || stable >= 8) { window.noteScrollDone = true; return; }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }, { once: true, capture: true });
    });
    await page.locator('#notes button').click();
    await page.waitForFunction(() => window.noteScrollDone);
    const samples = await page.evaluate(() => window.noteScrollSamples);
    const final = samples.at(-1), start = samples[0];
    check(final - start > 100, 'Note click really scrolls the source, not only its metadata');
    const intermediate = samples.some(value => value > start + 1 && value < final - 1);
    check(reducedMotion === 'reduce' ? !intermediate : intermediate, reducedMotion === 'reduce' ? 'Reduced motion avoids animated scrolling' : 'Normal note scrolling has intermediate positions instead of an instant jump');
    check(await page.evaluate(() => window.noteRevealCalls) === 1, 'Explicit note click requests one source reveal');
    await page.locator('#split').click();
    await page.locator('[data-code][data-additions] [data-line="150"][data-selected-line]').waitFor();
    check(await page.evaluate(() => window.noteRevealCalls) === 1, 'Renderer updates retain the selected note without replaying its reveal scroll');
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return 'PASS: actual animated note-scroll positions, reduced-motion instant reveal, correct selected line and no repeated note reveal on layout update';
}
