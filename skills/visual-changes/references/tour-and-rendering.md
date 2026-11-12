# Tour and rendering reference

## Populate, do not rebuild

Read the complete `template.html`, copy it to the dated output path, then replace its `#tour-data` JSON and `data-content-kind="fictional-example"` marker. The HTML shell, complete stylesheet, pinned URLs, component hierarchy, semantic hooks, and interaction module stay unchanged. Metadata and repeated cards are rendered from data; generation requires no source adapters or new event handlers.

An explicit viewer-change request changes the canonical template separately. Unsupported data is a limitation to report, not permission to improvise another viewer.

| Fixed viewer | Variable payload |
| --- | --- |
| Layout, CSS, landmarks, rail/mobile selector, navigation/read/progress | Comparison metadata and real stop count/order |
| Repeated Pierre diff cards and supporting-file group | File records, complete sources, excerpt ranges, supporting reasons |
| Card/bulk collapse, Full file/Hunks, Unified/Split and Wrap/No-Wrap | Genuine source availability and authoritative statistics |
| Notes region, whole-card note buttons, annotation/scroll behavior | Zero to three important notes; null attention by default |

Sparse tours keep the same viewer: one stop retains navigation machinery and reaches 100% progress only when marked read; `notes: []` retains the notes region/grid; `attention: null` lets template logic hide the callout. Empty supporting lists hide their group through template logic, not edited markup.

## Establish and acquire the comparison

Distinguish working-tree, staged, commit, and branch comparisons. For PRs, pin the head and actual merge base. A base-branch tip may differ from the merge base; record it separately rather than silently substituting it. Merged PRs may need their original comparison or an explicitly identified commit-parent comparison.

Acquire **complete before/after text for every changed text file**, including supporting files. Use existing local Git objects or authorized read-only APIs at the pinned object IDs; use the correct base/head repository for forked PRs. A collected patch, head-only checkout, short deadline, or pre-existing excerpt-only draft does not establish source unavailability. Do not execute PR code, mutate a checkout, or create a worktree merely to investigate unrelated source.

If source retrieval fails, record the concrete reason on that file. If the file is binary or otherwise non-text, record that fact. Use the template's built-in fallback below. Never fabricate missing context, use today's branch contents, or represent failed retrieval as an empty/deleted file.

Primary PR metadata is `headRef → baseRef`, for example `feat/pretty-markdown → main`; only PR guides show the Pull request/number eyebrow. Local comparisons use their real kind/label and no invented PR URL. “Source details” uses labeled Before/After rows: PRs name the shared starting commit and head branch; local snapshots name the last commit and saved uncommitted/staged files. Commit IDs are shortened to eight characters for display; full revisions, snapshot fingerprints and a distinct `baseTip` remain embedded, not printed as a hash wall or substituted for the comparison start. Local snapshots show a readable Captured time only when a valid `capturedAt` was recorded.

## The actual payload

This is the viewer's schema, not a separate conceptual planning model. The bundled fictional payload is a working example; replace it completely with real data.

```json
{
  "comparison": {
    "repository": "owner/project",
    "kind": "pull-request",
    "number": 7,
    "title": "Increase the timeout",
    "url": "https://example.com/owner/project/pull/7",
    "status": "Open",
    "headRef": "feat/timeout",
    "baseRef": "main",
    "mergeBase": "exact-old-commit",
    "head": "exact-head-commit"
  },
  "files": [
    {
      "path": "src/config.ts",
      "status": "modified",
      "additions": 1,
      "deletions": 1,
      "source": {
        "old": "export const timeout = 1000;\n",
        "next": "export const timeout = 2000;\n"
      }
    },
    {
      "path": "README.md",
      "status": "added",
      "additions": 1,
      "deletions": 0,
      "source": { "old": null, "next": "The timeout is configurable.\n" }
    }
  ],
  "stops": [
    {
      "id": "timeout",
      "category": "The contract",
      "title": "Allow more time for the operation",
      "shortTitle": "Increase the timeout",
      "subline": "config.ts · one setting",
      "summary": "The configured value changes from 1000 to 2000.",
      "attention": null,
      "excerpts": [
        { "id": "setting", "path": "src/config.ts", "side": "new", "start": 1, "end": 1, "caption": "The configured value doubles." }
      ],
      "relatedFiles": [
        { "path": "README.md", "reason": "Document the same configuration." }
      ],
      "notes": []
    }
  ]
}
```

### Comparison and files

- `comparison.repository` and `title` are required. Use kind `pull-request`, `working-tree`, `staged`, `commit`, or `branch`; other kinds use generic comparison labels. Optional `label` describes a local comparison; `baseRef` can identify the current branch for a local snapshot without inventing a head branch. Optional `capturedAt` is the ISO timestamp recorded when a working-tree/staged snapshot was acquired, not the later HTML rendering time; omit unknown times. Missing/invalid timestamps stay hidden. `baseTip` preserves a distinct base-branch tip. URLs must be HTTP(S).
- `files` contains one record per changed path. `status` is `added`, `removed`, `modified`, `renamed`, `changed`, or `copied`. Renames require `previousPath`; the renderer uses it for the old filename.
- `source.old`/`source.next` are complete strings, including real trailing-newline behavior. `null` means a side does not exist: only old on added files, only next on removed files. Empty strings are real empty files, not missing retrieval.
- `additions`/`deletions` come from the exact full-file comparison, not excerpt lengths or rendered rows. Values are nonnegative integers; null/omitted values disclose unavailable line counts. Binary counts reported as zero by Git are legitimate zeros, not guesses.
- **Fallback:** omit `source`, supply `unavailableReason`, and supply a valid original-coordinate `patch` if text hunks are available. It must contain exactly one matching file with compatible path/status metadata; excerpt/note anchors must belong to its supplied side/hunks. Non-text files without line-addressable patches belong in `relatedFiles`, without invented excerpts. Their cards show an honest no-text-diff state. Full file is disabled with the reason adjacent to the diff; Hunks remains the available context mode. Keep this fallback in data, not edited handlers.

### Stops, excerpts, and notes

- Stops have unique lowercase slug `id` values, titles, short titles, and summaries. `excerpts`, `relatedFiles`, and `notes` are arrays; omitted arrays default to empty. Every stop needs at least one excerpt or supporting file.
- Each excerpt has a unique stop-local slug `id`, a changed `path`, explicit `old`/`new` side, and inclusive positive `start`/`end` coordinates. The focus button says “Focus on lines X-Y”; its accessible name retains before-change/after-change context and the source path. Opening a diff highlights and scrolls to its focus range without truncating source or hiding other changed hunks. A separate file-status badge uses the theme's additions color for Added, deletions color for Removed, and accent for Modified/Renamed/Copied. Multiple excerpts/files per stop are supported.
- Each supporting entry has a changed `path` and short `reason`. It appears in “Also in this stop” as the same single collapsible diff card, with its reason above it—no outer details/summary disclosure and no duplicate path/count header. Use it for mechanical changes, lockfiles, docs, fixtures, and less-important connected changes.
- Notes are optional, highly selective explanations of a non-obvious reason—not syntax paraphrases. A note is `{ "excerptId": "setting", "side": "new", "line": 1, "title": "Why", "body": "The important relationship." }`. Its side must match its owning excerpt and its line must fall within that excerpt. For an old-side note, create an old-side excerpt; never quietly anchor removed code to a new line.
- `attention` is null or a short string describing a genuine maintainer decision: tradeoff, contract, product choice, accepted risk, or accessibility judgment. No filler callouts.

Before delivery, check ranges against the pinned files and actual diff hunks. Check every note's ownership/side/line and account for every changed path. The viewer rejects missing/duplicate IDs, unknown paths, invalid ranges/source pairs/statistics, and uncovered files visibly; generation still needs evidence that the supplied source and explanation are real.

## Editorial and statistics rules

Usually use two to six semantic stops, one for a trivial change: contract → implementation → callers → proof. Each stop advances one idea, not one file. Summaries explain before/after and why in two to four sentences; relevant focus ranges are usually 3–25 lines. Group secondary changes with the idea they support. For stacked PRs, explain only the requested layer.

Statistics have explicit scopes:

- Comparison header: all unique changed file records.
- Rail item and active stop: the union of that stop's excerpt and supporting paths.
- Diff card/supporting row: the complete changed file, not only its focus range.

A file may contribute to several stops, but only once within each scope. Do not sum stop totals to obtain PR totals. Missing counts are disclosed; partial known totals are not passed off as complete. The viewer computes these scopes from authoritative per-file records.

## Renderer and interactions

Keep Flowbite 3.1.2 compiled CSS and vanilla `@pierre/diffs` 1.6.4 at the template's pinned CDN URLs. No React, build, component installation, or Tailwind browser compiler. One HTML file still requires CDN connectivity.

The header uses a bullet separator and one accessible native Theme dropdown: Gruvware Dark (default), Gruvware Light, Pierre Dark, Pierre Light, Tokyo Night, Nord, Dracula, Catppuccin Mocha, Gruvbox Light, and Gruvbox Dark. Gruvbox uses the renderer's standard medium variants. Each allowlisted choice synchronizes the shell's semantic CSS palette, explicit light/dark color scheme and Pierre's actual theme. Theme choice is stored in the existing comparison-scoped preference record; valid saved choices remain unchanged, while invalid/missing values fall back to Gruvware Dark without discarding other saved settings. Blocked storage leaves in-memory controls usable. Reset guide restores Gruvware Dark along with the other defaults. There is no separate dark/light/system toggle or global theme preference. Theme changes reuse existing FileDiff/File instances so collapsed cards, full/incremental context, read marks, notes and manual source selections are retained; new/lazy renderers use the active theme. Keep source-note colors tokenized too. Text/controls and status/focus colors must remain readable in every palette, not only inside the syntax renderer; small shell status colors may use contrast-adjusted shades of the theme's red/green.

Both Gruvware definitions are embedded as inert `custom-themes` JSON in the single HTML, extracted from [ovi-ispas/diff2html](https://github.com/ovi-ispas/diff2html/tree/805d86760c3f7dd0acccb2b0c16059d904b30cfa/src/themes). Preserve all 42 ordered TextMate rules per variant, including scope arrays, font styles, backgrounds and the original `NONE` sentinel. Register them with Pierre's `registerCustomTheme(name, loader, "textmate")` before exposing FileDiff/File; do not substitute Gruvbox or fetch the original project at runtime. The shell uses matching palette colors with legible semantic status shades; syntax definitions remain unchanged.

Keep the page/stop heading hierarchy distinct: stop headings scale from 20–24px, below the page title. Main-section groups have generous vertical spacing; note and rail stop titles use the primary foreground while descriptions stay muted. Source-detail hashes use the theme accent. The local `.stop-actions` rule gives arrows an explicit 8px gap and Reset a wider 24px separation; do not depend on absent compiled utility classes for these gaps.

The template uses `FileDiff` with complete old/new files, `hunkSeparators: "line-info"`, and native incremental expansion. Each card has a native segmented “Full file” / “Hunks” group using `expandUnchanged`: Hunks is the default changed-hunk view, Full file reveals all available context, and clicking the active option does nothing. The selected mode stays in the existing per-card `full` preference; focus/notes that reveal hidden complete source synchronize the group too. There is no separate reset-context button. The diff header hides the card body independently. Added files already contain their entire available side. Fallback patches use `parsePatchFiles` with original hunk headers; partial patches cannot supply missing lines and disable Full file.

A native “Wrap” / “No-Wrap” group follows Unified/Split. No-Wrap is the fresh, missing/invalid-preference and reset default. Guide-scoped `overflow` stores Pierre's `"wrap"` / `"scroll"` values directly; legacy preferences keep their other settings. Change wrapping with existing renderer `setOptions`/`rerender`, preserving native incremental context, collapsed cards, notes, selections and read state. All primary/supporting/patch/File renderers, including lazy or newly navigated cards, use the active mode. Visual wrapping never changes copied source text or original line coordinates. The controls remain usable before CDN readiness or with blocked storage; do not introduce a second storage key or a CSS-only imitation of renderer wrapping.

Pure renames and metadata-only changes have no textual hunks. Their changed view says so; full contents uses Pierre's `File` renderer to expose the real unchanged file instead of pretending that expanding zero hunks can reveal it.

Preserve:

- One active stop, direct rail navigation/mobile selector, bounded Previous/Next and j/k outside editable fields. Every successful stop change through these controls returns the document to the top immediately and retains keyboard focus on the new stop heading; bounded/current-stop no-ops do not scroll. Note/source reveal scrolling remains separate. No Finish action, quiz, or completion dialog.
- Manual read/unread only; navigation does not mark anything read. The labeled Progress bar tracks read stops divided by total stops, restores saved read marks, and reaches 100% only when all stops are marked read. The narrow-layout selector appends exactly “ (Read)” to each read stop's existing numbered title; update it with the rail/progress on mark, unmark, reload and reset, without changing option values or marking navigation read. Keep labels current while hidden so resizing works immediately. Marking unread reduces progress, regardless of current position.
- Each entire diff header is one native button (path, status and counts), toggled with pointer, Enter or Space. Keep its expanded state and accessible label synchronized; there is no separate nested collapse button.
- The caption's focus range is a native ghost button labeled “Focus on lines X-Y”, with source side/path retained in its accessible name: restore the range after manual selection or a note, clear active note styling, reopen the card and scroll back to the source. Reveal missing context when complete source is available; never invent context for patch-only input. Keep note locations concise as `filename:line`; retain source-side metadata and accessible descriptions. Engine loading text says “loading from CDN...” and success says “loaded from CDN”.
- “Collapse all diffs” / “Reveal all diffs” precedes Unified/Split and affects the active stop, including supporting-file rows. Its label follows actual card visibility; bulk controls never change read marks or full-context preferences. Unified/split mode preserves collapsed cards and selected notes. Stop replacement cleans up old Pierre instances and recalculates bulk state. Read checkmarks remain green in active and inactive stops; the Important code changes heading uses normal foreground color.
- Fresh tours start with every primary/supporting diff collapsed, Hunks context and No-Wrap. Local storage restores layout, wrapping, bulk collapse preference, per-card collapse/full-context choices, and read marks by stop ID. Storage is scoped by repository, comparison kind, exact revisions, label and page path; another comparison starts fresh. Bulk changes update the default across stops while preserving full-context choices. Invalid saved values use safe defaults; blocked/full storage shows a footer warning and leaves in-memory controls usable. Do not store source or PR prose in preferences.
- “Reset guide” precedes up/down navigation with visible spacing. It removes only this walkthrough's exact key from localStorage and sessionStorage, clears all read marks and transient selections/feedback, restores Unified, No-Wrap and collapsed/Hunks context across stops, and returns to the first stop with its URL updated. Never clear other walkthroughs or unrelated storage. Try each store independently; if removal is blocked, apply defaults in memory and warn that saved settings could not be cleared.
- Source-side selection and whole-card note buttons with matching badges/hover and 5px spacing. Clicking an explanation reopens its source card, reveals hidden source when complete files exist, selects the correct side, and scrolls to its inline annotation once. When notes move below the main section (the existing max-width 1200px breakpoint), clicking an inline annotation instead focuses and scrolls its matching explanation into view, retaining source selection without a competing source scroll. Above that breakpoint, inline clicks keep their existing source-oriented behavior. Inline annotation `aria-controls` identifies the matching note card; explanation buttons control their source view. Both directions use native smooth scrolling, instant for prefers-reduced-motion; later renderer updates restore selection without replaying either reveal.
- A valid focus, note, or manual selection replaces the selection hint with a regular (not ghost) button labeled “Copy selected old/new lines X–Y”. Copy exact source from that revision, without line numbers or diff markers; preserve original line endings and missing final newlines. Reverse selections use ascending coordinates. Cleared selections restore the hint; mixed-side selections and missing patch lines explain why copying is unavailable. Patch-only copying uses original hunk coordinates, never inferred context. Clipboard success/failure is inline; unavailable or denied clipboard access must not report success. Changing selections clears feedback, and pending writes cannot mark a different selection copied. Manual selection supersedes an active note and survives layout changes. Complete-source note copying does not wait for the CDN renderer; selection/hint updates retain polite live announcements separately from clipboard feedback.
- Within copy-button labels, “old lines” uses the theme's deletions color and “new lines” additions green; keep the surrounding text/range neutral and preserve the full accessible label. Successful writes say simply “Copied.”; keep explanatory failure feedback.
- Reset guide uses red danger styling with a red hover state and readable white text/icon. Its decorative, nonfocusable inline undo-arrow SVG uses currentColor; the accessible button name remains Reset guide.
- Footer engine status, real error/loading states, source-unavailability explanations, and no page-level horizontal overflow on narrow screens.
- Native landmarks, lists, buttons/details, resolving ARIA references, and synchronized stop/source/action/state metadata. Pierre owns a shadow root: inspect rendered code and real selection there, not just the outer wrapper or “loaded” label.

## Safe embedding and fidelity gate

PR prose/source are untrusted data; never execute diff code. The template already assigns prose and annotations with `textContent`. Serialize the whole payload programmatically into the existing non-executable JSON element:

```js
const safeJson = JSON.stringify(data)
  .replaceAll("<", "\\u003c")
  .replaceAll(">", "\\u003e")
  .replaceAll("&", "\\u0026");
```

Replace the JSON element's contents as one region, not through interpolated executable template literals. Preserve the rest of the copied file; set its content-kind marker to the real comparison kind. Optional static document-title metadata may be escaped programmatically, but is unnecessary because the viewer updates it.

Before handoff:

1. Diff against the template: only payload, content-kind marker, and optional escaped static title differ. The complete stylesheet and interaction module are byte-identical. No new adapters, handlers, or formatting rewrites.
2. Check source pins, complete file contents, branch direction, per-file counts, path coverage, ranges, and source-side note anchors. No fictional payload remains.
3. Exercise navigation, read/progress, sparse tours, primary/supporting diffs, incremental context, Full file/Hunks, Unified/Split, Wrap/No-Wrap, note reveal/selection/scroll, selected-side clipboard contents/failures, and narrow layout. Verify actual Pierre shadow-root code/line geometry and inspect console/CDN errors.
4. Report unavailable source/CDNs and unperformed checks honestly. A browser label or a manual read checkmark is not a claim that PR code is correct or its tests were executed.

## Browser handoff

Honor the requested browser and host restrictions. Prefer an existing authorized serving path; serve only a dedicated artifact directory, never the repository/home/shared temp root. If a server is authorized, bind to loopback on a fixed available port and retain its process identity. Do not start one when the host forbids it.

Use the host's actual browser/render tools; do not assume one disconnected integration means all browser paths are unavailable. Return the dated artifact's absolute path and a URL when the authorized path provides one. Opening a URL alone does not prove rendering worked.
