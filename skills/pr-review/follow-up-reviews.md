# Follow-up Review Procedure

Use this procedure only when existing review state was found for the current branch or equivalent local review identity.

## Validate review state

Verify using git that the previously reviewed commit is still an ancestor of the current HEAD.

- If it is, treat the review as a follow-up.
- If it is not, consider the review cache invalid and perform a fresh review.

Do not rely on conversation memory to determine whether a review is initial or follow-up.

Use deterministic git operations for review-state detection.

## Review only invalidated gates

For a follow-up review:

- inspect changes since the previously reviewed commit;
- verify previous unresolved findings;
- determine whether those changes invalidate conclusions from later gates;
- re-run only the gates affected by the changes.

Do not restart the entire review unless necessary.

Examples:

- a local correctness fix normally requires re-running only the affected correctness analysis;
- a changed implementation approach may require rebuilding the Change Map and re-running the Architectural Gate;
- changed stated intent requires returning to the Intent Gate;
- a substantial rewrite, large rebase, changed scope, or invalidated assumptions may require a fresh review.

Treat previous review conclusions as cached knowledge.

Invalidate only what the new changes actually invalidate.
