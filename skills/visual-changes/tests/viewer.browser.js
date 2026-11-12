// Run on a served template: playwright-cli -s=visual-changes-check run-code --filename=skills/visual-changes/tests/viewer.browser.js
async page => {
  const templateUrl = await page.locator("html").getAttribute("data-test-template") || page.url().split("#")[0];
  const source = await (await page.request.get(templateUrl)).text();
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const old = Array.from({ length: 90 }, (_, i) => `export const value${i + 1} = ${i + 1};`).join("\n") + "\n";
  const next = old.replace("value20 = 20", "value20 = 200").replace("value60 = 60", "value60 = 600");
  const fixture = {
    comparison: { repository: "demo/settings", kind: "pull-request", title: "Timeout </script> ${notCode}", url: "https://example.com/pull/7", number: 7, status: "Open", headRef: "feat/<timeout>", baseRef: "main", mergeBase: "a".repeat(40), head: "b".repeat(40) },
    files: [
      { path: "src/config.ts", status: "modified", additions: 2, deletions: 2, source: { old, next } },
      { path: "README.md", status: "added", additions: 1, deletions: 0, source: { old: null, next: "Timeout configuration.\n" } }
    ],
    stops: [
      { id: "configure", category: "Contract", title: "Configure the timeout", shortTitle: "Configure", subline: "Configuration", summary: "A literal <img src=x onerror=alert(1)> explanation.", attention: null,
        excerpts: [{ id: "first", path: "src/config.ts", side: "new", start: 20, end: 20, caption: "First boundary" }, { id: "second", path: "src/config.ts", side: "new", start: 60, end: 60, caption: "Second boundary" }],
        relatedFiles: [{ path: "README.md", reason: "Document the same setting." }], notes: [] },
      { id: "proof", category: "Proof", title: "Check the second boundary", shortTitle: "Proof", subline: "Same file, another idea", summary: "A second stop.", attention: null,
        excerpts: [{ id: "proof", path: "src/config.ts", side: "new", start: 60, end: 60, caption: "Same source" }], relatedFiles: [], notes: [] }
    ]
  };
  const mount = async data => {
    const json = JSON.stringify(data).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
    const tag = `<script id="tour-data" type="application/json">${json}</script>`;
    const populated = source.includes('id="tour-data"') ? source.replace(/<script[^>]*id="tour-data"[^>]*>[\s\S]*?<\/script>/, () => tag) : source.replace('<script type="module">', () => tag + '<script type="module">');
    const html = populated.replace("<html ", `<html data-test-template="${templateUrl}" `).replace('<script type="module">', '<script>localStorage.clear()</script><script type="module">');
    await page.route("https://visual-changes.test/fixture", route => route.fulfill({ contentType: "text/html", body: html }));
    await page.goto("https://visual-changes.test/fixture", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.body.dataset.viewerState === "error" || document.querySelector("#engine-status")?.dataset.state === "loaded");
    if (await page.locator('body[data-viewer-state="ready"]').count()) {
      await page.locator("#collapse-all-diffs").click();
      for (const button of await page.locator('#related-list [data-action="collapse-diff"]').all()) await button.click();
    }
  };
  await mount(fixture);
  await page.locator("#rail button").first().waitFor();
  await page.locator('[data-component="engine-status"] [data-state="loaded"]').waitFor();
  const annotationFailures = [];
  if (await page.locator("#notes-help").count()) annotationFailures.push("Unnecessary note hint remains");
  const statsGap = await page.locator(".rail-stats").first().evaluate(el => el.children[1].getBoundingClientRect().left - el.children[0].getBoundingClientRect().right);
  if (statsGap < 5) annotationFailures.push("File count and change counts need visible spacing");
  await page.emulateMedia({ colorScheme: "light" });
  const lightReadBackground = await page.locator("#mark-read").evaluate(el => getComputedStyle(el).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  const darkReadBackground = await page.locator("#mark-read").evaluate(el => getComputedStyle(el).backgroundColor);
  if (lightReadBackground === "rgb(255, 255, 255)" || lightReadBackground !== darkReadBackground) annotationFailures.push("Dark viewer's read button depends on host color scheme");
  if (!await page.locator("#excerpts .file-glyph svg").count()) annotationFailures.push("Diff card needs an inline file icon");
  if (!await page.locator("#collapse-all-diffs").count()) annotationFailures.push("Missing Collapse/Reveal all diffs control");
  check(annotationFailures.length === 0, annotationFailures.join("; "));
  check((await page.locator(".rail-stats").first().textContent()).includes("2 files +3 −2"), "Statistic text also preserves spaces for copying and reading without flex layout");
  const bulk = page.locator("#collapse-all-diffs");
  check(await bulk.evaluate(el => !!(el.compareDocumentPosition(document.querySelector("#unified")) & Node.DOCUMENT_POSITION_FOLLOWING)), "Bulk collapse precedes unified/split controls");
  await bulk.click();
  check(await bulk.textContent() === "Reveal all diffs", "Bulk label reflects fully collapsed state");
  check(await page.locator('[data-component="source-diff"] .diff-body').evaluateAll(els => els.every(el => el.hidden)), "Bulk collapse hides every primary and supporting diff body");
  check(await page.locator("#related-list details").count() === 0, "Supporting files have no extra disclosure layer");
  await page.locator('#excerpts [data-action="collapse-diff"]').first().click();
  check(await bulk.textContent() === "Collapse all diffs", "Manually reopening one card updates the bulk label");
  await bulk.click();
  await bulk.click();
  await page.locator('#related-list [data-code]').first().waitFor();
  check(await page.locator('[data-component="source-diff"] .diff-body').evaluateAll(els => els.every(el => !el.hidden)), "Bulk uncollapse restores all card bodies");
  check(await page.locator("#related-list .diff-body").evaluateAll(els => els.every(el => !el.hidden)), "Bulk uncollapse opens supporting-file diffs too");
  check(await page.locator("#rail-count").textContent() === "0 / 2 read", "Bulk presentation controls never mark the stop read");
  await page.locator('#related-list [data-action="collapse-diff"]').click();
  const primary = page.locator('#excerpts [data-component="source-diff"]').first();
  await primary.locator("[data-code]").first().waitFor();
  check(!(await primary.locator("[data-code]").allTextContents()).join("").includes("value90"), "Changed-hunk view initially hides unrelated unchanged context");
  check(await primary.locator('[data-context="full"]').count() === 1 && await primary.locator('[data-context="hunks"]').count() === 1, "Each diff needs its own Full file / Hunks group");
  await primary.locator('[data-context="full"]').click();
  await page.waitForFunction(() => document.querySelector('#excerpts [data-renderer]')?.querySelector('diffs-container')?.shadowRoot?.textContent.includes("value90"));
  check((await primary.locator("[data-code]").allTextContents()).join("").includes("value1 = 1"), "Full contents reveals the actual file start");
  await bulk.click();
  await bulk.click();
  check(await primary.locator('[data-context="full"]').getAttribute("aria-pressed") === "true", "Bulk collapse/uncollapse preserves full-contents preference");
  await page.locator('#related-list [data-action="collapse-diff"]').click();
  await primary.locator('[data-action="collapse-diff"]').click();
  check(!await primary.locator('[data-renderer="pierre-diffs"]').isVisible(), "Diff card can collapse without changing its context state");
  await primary.locator('[data-action="collapse-diff"]').click();
  check(await primary.locator('[data-context="full"]').getAttribute("aria-pressed") === "true", "Reopening a card preserves its full-context state");
  await primary.locator('[data-context="hunks"]').click();
  await page.waitForFunction(() => !document.querySelector('#excerpts [data-renderer]')?.querySelector('diffs-container')?.shadowRoot?.textContent.includes("value90"));
  const incremental = primary.locator('[data-expand-button]').first();
  check(await incremental.count() > 0, "Pierre must offer native incremental context expansion");
  const linesBefore = (await primary.locator("[data-code]").allTextContents()).join("").length;
  await incremental.click();
  await page.waitForFunction(length => document.querySelector('#excerpts [data-renderer]')?.querySelector('diffs-container')?.shadowRoot?.querySelector('[data-code]')?.textContent.length > length, linesBefore);
  check(await page.locator("#change-title").textContent() === fixture.comparison.title, "PR title must come from inert JSON, not fictional template data");
  check(await page.locator('[data-field="comparison-range"]').textContent() === "feat/<timeout> → main", "Primary metadata must use readable branches");
  check(await page.locator('[data-field="changed-file-count"]').textContent() === "2 files", "PR file count must deduplicate repeated excerpts/stops");
  check(await page.locator('[data-field="change-additions"]').textContent() === "+3", "PR additions must count each file once");
  check(await page.locator('[data-field="change-deletions"]').textContent() === "−2", "PR deletions must count each file once");
  check((await page.locator('[data-field="stop-stats"]').textContent()).includes("2 files"), "Stop statistics include supporting files, not excerpt count");
  check((await page.locator("#stop-summary").textContent()).includes("<img"), "Summary renders as literal text");
  check(await page.locator("#stop-summary img").count() === 0, "Untrusted summary must not become HTML");
  const related = page.locator('#related-list [data-component="source-diff"]');
  check(await related.count() === 1, "Supporting files need a dedicated expandable group");
  check(await related.locator('.diff-body').evaluate(el => el.hidden), "Supporting file can stay collapsed independently");
  await related.locator('[data-action="collapse-diff"]').click();
  check(await related.locator('.diff-body').evaluate(el => !el.hidden), "Supporting file can be expanded");
  check(await related.locator('[data-renderer="pierre-diffs"]').count() === 1, "Supporting file uses the same diff viewer");
  await related.locator("[data-code]").first().waitFor();
  await page.locator("#next").click();
  check(await bulk.textContent() === "Collapse all diffs", "Bulk state is recalculated for the new active stop");
  check((await page.locator('[data-field="stop-stats"]').textContent()).includes("1 file"), "Stop counts are scoped, not accumulated");
  check(await page.locator("#rail-count").textContent() === "0 / 2 read", "Navigation never marks stops read");
  check(await page.locator("#progress").getAttribute("aria-valuenow") === "0", "Navigation to the final stop does not mark progress");
  await page.locator("#mark-read").click();
  check(await page.locator("#rail-count").textContent() === "1 / 2 read", "Manual read still works");
  await page.keyboard.press("k");
  check(await page.locator("#tour").getAttribute("data-stop-id") === "configure", "k navigates to the previous stop");
  await page.keyboard.press("j");
  await page.keyboard.press("j");
  check(await page.locator("#tour").getAttribute("data-stop-id") === "proof" && await page.locator("#rail-count").textContent() === "1 / 2 read", "j stays bounded and does not alter read marks");
  const local = JSON.parse(JSON.stringify(fixture));
  local.comparison = { repository: "demo/settings", title: "Local change", kind: "working-tree", label: "Working tree → HEAD" };
  await mount(local);
  await page.locator("#rail button").first().waitFor();
  check(await page.locator('[data-field="comparison-kind"]').locator('..').isHidden(), "Local comparisons hide the PR-only identity eyebrow");
  check(await page.locator('[data-field="change-link"]').getAttribute("href") === null, "Local comparisons have no invented external link");
  const unavailable = JSON.parse(JSON.stringify(fixture));
  unavailable.files[1] = { path: "README.md", status: "modified", additions: null, deletions: null, unavailableReason: "Binary source is unavailable." };
  await mount(unavailable);
  await page.locator("#rail button").first().waitFor();
  check((await page.locator('[data-field="stats-unavailable"]').textContent()).includes("1 file"), "Missing line counts must be disclosed, not silently zeroed");
  await page.locator('#related-list [data-action="collapse-diff"]').click();
  check(await page.locator('#related-list [data-context="full"]').isDisabled(), "Unavailable source cannot promise full contents");
  await page.locator('#related-list [data-field="source-status"]').waitFor({ state: "visible" });
  check((await page.locator('#related-list [data-field="source-status"]').textContent()).includes("Binary"), "Unavailable source explains the limitation adjacent to the diff");
  const noted = JSON.parse(JSON.stringify(fixture));
  noted.stops[0].excerpts[0] = { id: "first", path: "src/config.ts", side: "old", start: 1, end: 65, caption: "Old-side contract" };
  noted.stops[0].notes = [{ excerptId: "first", side: "old", line: 35, title: "An old-side invariant", body: "This unchanged contract still matters." }];
  await mount(noted);
  await page.locator('[data-component="engine-status"] [data-state="loaded"]').waitFor();
  await primary.locator("[data-code]").first().waitFor();
  await primary.locator('[data-action="collapse-diff"]').click();
  await page.locator("#notes button").click();
  await primary.locator('[data-note-index="0"]').waitFor({ state: "visible" });
  check(await primary.locator('[data-renderer]').getAttribute("data-selected-side") === "old", "A note opens its card and selects the correct old side");
  await page.locator("#split").click();
  await primary.locator('[data-note-index="0"]').waitFor({ state: "visible" });
  check(await page.locator("#notes button").getAttribute("aria-pressed") === "true", "Layout switching retains selected note state");
  await primary.locator('[data-code][data-deletions] [data-line="35"][data-selected-line]').waitFor({ state: "visible" });
  check(await primary.locator('[data-code][data-deletions] slot[name="annotation-deletions-35"]').count() === 1, "Old-side note annotation belongs in the old-side column");
  await bulk.click();
  await page.locator("#unified").click();
  check(await primary.locator(".diff-body").evaluate(el => el.hidden), "Switching layout must not undo collapse-all to reveal a selected note");
  await bulk.click();
  await primary.locator('[data-note-index="0"]').waitFor({ state: "visible" });
  for (const width of [1440, 900, 390]) {
    await page.setViewportSize({ width, height: 950 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No page-level horizontal overflow at ${width}px`);
    if (width === 390) check(await page.locator("#mobile-stop").isVisible(), "Mobile stop selector remains available");
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  const semanticErrors = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map(el => el.id);
    return [...(ids.length === new Set(ids).size ? [] : ["duplicate IDs"]), ...[...document.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')].flatMap(el => ["aria-controls", "aria-labelledby", "aria-describedby"].flatMap(attr => (el.getAttribute(attr) || "").split(/\s+/).filter(id => id && !document.getElementById(id))))];
  });
  check(semanticErrors.length === 0, `Semantic references resolve: ${semanticErrors.join(", ")}`);
  const exploring = JSON.parse(JSON.stringify(fixture));
  const longOld = Array.from({ length: 240 }, (_, i) => `export const item${i + 1} = ${i + 1};`).join("\n") + "\n";
  let longNext = longOld;
  for (const line of [20, 60, 100, 140, 180, 220]) longNext = longNext.replace(`item${line} = ${line};`, `item${line} = ${line * 10};`);
  exploring.files[0].source = { old: longOld, next: longNext }; exploring.files[0].additions = exploring.files[0].deletions = 6;
  exploring.stops[0].notes = [{ excerptId: "first", side: "new", line: 20, title: "First change", body: "Select once, then continue exploring." }];
  await mount(exploring);
  await page.locator('[data-component="engine-status"] [data-state="loaded"]').waitFor();
  await primary.locator('[data-note-index="0"]').waitFor({ state: "visible" });
  await page.locator("#notes button").click();
  const beforeScroll = await primary.locator('[data-renderer]').evaluate(el => { el.scrollTop = el.scrollHeight - el.clientHeight; return el.scrollTop; });
  check(beforeScroll > 100, "Scroll-regression fixture has distant, scrollable changed hunks");
  const beforeRows = await primary.locator('[data-code] [data-line]').count();
  await primary.locator('[data-expand-button]').last().evaluate(el => el.click());
  await page.waitForFunction(count => document.querySelector('#excerpts [data-renderer] diffs-container')?.shadowRoot?.querySelectorAll('[data-code] [data-line]').length > count, beforeRows);
  check(await primary.locator('[data-renderer]').evaluate(el => el.scrollTop) >= beforeScroll - 100, "Expanding distant context must not snap back to a previously selected note");
  const partial = JSON.parse(JSON.stringify(fixture));
  partial.files = [{ path: "src/config.ts", status: "modified", additions: 1, deletions: 1, patch: "diff --git a/src/config.ts b/src/config.ts\n--- a/src/config.ts\n+++ b/src/config.ts\n@@ -42 +42 @@\n-export const timeout = 1000;\n+export const timeout = 2000;\n", unavailableReason: "Pinned full-file source could not be retrieved." }];
  partial.stops = [partial.stops[0]]; partial.stops[0].relatedFiles = [];
  partial.stops[0].excerpts = [{ id: "partial", path: "src/config.ts", side: "new", start: 42, end: 42, caption: "Original coordinate" }];
  await mount(partial);
  await primary.locator('[data-code] [data-line="42"]').first().waitFor();
  check(await primary.locator('[data-context="full"]').isDisabled(), "Patch fallback cannot invent full-file expansion");
  check((await primary.locator('[data-code]').allTextContents()).join("").includes("2000"), "Real patch contents render at original line 42");
  for (const mutate of [
    data => { data.stops[0].excerpts[0].start = data.stops[0].excerpts[0].end = 999; data.stops[0].notes = [{ excerptId: "partial", side: "new", line: 999, title: "Missing source", body: "Must not claim a nonexistent selection." }]; },
    data => { data.files[0].patch += data.files[0].patch; },
    data => { data.files[0].status = "renamed"; data.files[0].previousPath = "wrong.ts"; },
    data => { delete data.files[0].patch; }
  ]) {
    const invalidPatch = JSON.parse(JSON.stringify(partial)); mutate(invalidPatch);
    await mount(invalidPatch);
    await page.waitForFunction(() => document.body.dataset.viewerState === "error" || document.querySelector("#engine-status")?.dataset.state === "loaded");
    check(await page.locator('[data-field="tour-error"]').isVisible(), "Unrenderable/ambiguous patch anchors and incorrect path metadata must be rejected, not selected");
  }
  for (const status of ["renamed", "modified"]) {
    const unchanged = JSON.parse(JSON.stringify(fixture));
    unchanged.files = [{ path: "retained.ts", ...(status === "renamed" ? { previousPath: "before.ts" } : {}), status, additions: 0, deletions: 0, source: { old: "export const retained = true;\n", next: "export const retained = true;\n" } }];
    unchanged.stops = [unchanged.stops[0]]; unchanged.stops[0].relatedFiles = [];
    unchanged.stops[0].excerpts = [{ id: "retained", path: "retained.ts", side: "new", start: 1, end: 1, caption: "No textual changes" }];
    await mount(unchanged);
    await page.locator('[data-component="engine-status"] [data-state="loaded"]').waitFor();
    await primary.locator('[data-context="full"]').click();
    await primary.locator('[data-code] [data-line="1"]').waitFor();
    check((await primary.locator('[data-code]').allTextContents()).join("").includes("retained"), `${status} without text changes still exposes real complete contents`);
    await primary.locator('[data-context="hunks"]').click();
    check((await primary.locator('[data-field="source-status"]').textContent()).includes("No textual changes"), "Zero-hunk files have an honest changed-view state");
  }
  for (const file of [
    { path: "added.ts", status: "added", additions: 1, deletions: 0, source: { old: null, next: "export const added = true;\n" } },
    { path: "deleted.ts", status: "removed", additions: 0, deletions: 1, source: { old: "export const removed = true;\n", next: null } },
    { path: "renamed.ts", previousPath: "before.ts", status: "renamed", additions: 1, deletions: 1, source: { old: "export const old = 1;\n", next: "export const next = 2;\n" } }
  ]) {
    const single = JSON.parse(JSON.stringify(fixture));
    single.files = [file]; single.stops = [single.stops[0]];
    single.stops[0].excerpts = [{ id: "only", path: file.path, side: file.status === "removed" ? "old" : "new", start: 1, end: 1, caption: "A real file side" }];
    single.stops[0].relatedFiles = [];
    await mount(single);
    await page.locator('body[data-viewer-state="ready"]').waitFor();
    await page.locator('[data-component="engine-status"] [data-state="loaded"]').waitFor();
    await page.locator('[data-renderer="pierre-diffs"] [data-code]').first().waitFor();
    check(!await page.locator("#previous").isVisible() && !await page.locator("#next").isVisible(), "Single-stop boundaries stay hidden");
    check(await page.locator("#note-count").textContent() === "0 notes" && await page.locator('[data-component="source-notes"]').isVisible(), "Zero notes retains the notes region");
    check(await page.locator("#progress").getAttribute("aria-valuemax") === "1", "Single-stop progress has the correct maximum");
    if (file.previousPath) check((await page.locator('[data-component="source-diff"] [data-field="source-path"]').textContent()).includes("before.ts → renamed.ts"), "Renames retain both paths");
  }
  const invalid = JSON.parse(JSON.stringify(fixture));
  invalid.stops[0].excerpts[0].path = "missing.ts";
  await mount(invalid);
  await page.locator('[data-field="tour-error"]').waitFor({ state: "visible" });
  check((await page.locator('[data-field="tour-error"]').textContent()).includes("missing.ts"), "Invalid source references fail visibly");
  for (const mutate of [
    data => { data.comparison.url = "javascript:alert(1)"; },
    data => { data.files[0].additions = -1; },
    data => { data.files[0].source.old = null; },
    data => { data.stops[1].id = data.stops[0].id; },
    data => { data.stops[0].notes = [{ excerptId: "missing", side: "new", line: 20, title: "Invalid", body: "Invalid owner" }]; }
  ]) {
    const data = JSON.parse(JSON.stringify(fixture)); mutate(data);
    await mount(data);
    await page.locator('[data-field="tour-error"]').waitFor({ state: "visible" });
  }
  return "PASS: metadata, deduplicated statistics, supporting diffs, incremental/full/reset context, collapse, old-side notes and selection, 3 viewports, ARIA, sparse tours, added/deleted/renamed files, navigation/read/progress, invalid and hostile data";
}
