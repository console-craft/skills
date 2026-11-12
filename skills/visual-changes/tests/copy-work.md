# Selected-source copy

Scope: canonical template selection UI/extraction/clipboard handler; existing focus, note and manual-selection callers; ignored browser tests; factual rendering reference; regenerated external PR artifact and verification report. No payload schema, dependency, persisted-source or PR-code changes.

- [x] Intent and design: selected-side source only, normal labeled button; empty hint, mixed/unavailable explanation, inline clipboard errors.
- [x] RED: original clipboard test failed because selection area was not a button.
- [x] GREEN: initial native clipboard test passes exact old/new, notes/focus, CRLF, final newline, denied writes and patch line 42.
- [x] Extend manual/reverse/cleared/mixed/unavailable cases and resolve failures.
- [x] Review connected selection callers and asynchronous feedback; fix note-before-CDN and live-semantic findings.
- [x] Update factual reference to describe verified behavior (no new agent workflow; pressure/micro-tests and new skill-authoring checklist not applicable).
- [x] Regenerate artifact; run full viewer, clipboard, PR (69 checks) and preferences suites.
- [x] Verify module syntax, JSON/local links, template fidelity and staged whitespace; stage nonignored changes without committing. Docs/tests confirmed ignored; no unstaged tracked changes.
- [x] Close private verification browser and report actual limits in external verification.md.

Additional RED→GREEN: clear old feedback on note selection; manual selection supersedes active note across layouts; pending writes never label a different range copied; note copying works before the CDN renderer initializes. Only initial favicon 404; no PR runtime/CDN errors. No root application test command in this dotfiles repository; PR code/tests not executed, browser/screen-reader matrix not audited.
