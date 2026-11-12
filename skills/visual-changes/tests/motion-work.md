# Undo icon and note-scroll motion

Scope: reset button inline SVG, one-shot note reveal scroll, ignored reset/motion regression coverage, factual reference and regenerated external preview. No payload, storage, selection, or global scroll changes.

- [x] RED: missing decorative undo SVG; note scroll has no intermediate positions.
- [x] Minimal implementation: inline currentColor SVG hidden from accessibility; native smooth scroll for explicit note reveal, instant for reduced-motion preference.
- [x] GREEN targeted tests: real frame-sampled scroll positions, reduced-motion reveal, source selection and single reveal across renderer updates; reset/accessibility name preserved.
- [x] Full viewer/clipboard/reset/motion/preferences suites and 78 PR checks pass; syntax/fidelity checks and report updated. Nonignored files staged, index whitespace clean, no unstaged tracked changes. Verification browser closed; no commit. Cross-browser/screen-reader matrix not run.
