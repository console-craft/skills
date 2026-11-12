# Difference Template

Use Difference when the user wants to understand what meaningfully differs between two implementations, revisions, branches, states, or versions.

The comparison may be temporal:

> before → after

or lateral:

> A ↔ B

The reader should finish the answer able to:

- state the meaningful delta in their own words;
- understand how much the difference matters before studying its details;
- visually recognize how the structure or behavior changed;
- compare the important dimensions directly;
- know where the important evidence lives in the code.

Explain semantic differences, not changed lines.

For PRs, branches, commits, and other code changes, organize around meaningful changes rather than modified files.

The Difference template always uses this order:

1. Summary
2. Important consequences
3. Diagram
4. Differences
5. Key code

Do not add generic sections such as "Overview", "Conclusion", "Recommendations", or "Files changed".

Do not turn a Difference explanation into a review or design judgment.

## Summary

Always include `## Summary`.

State the meaningful delta immediately.

Use approximately 1–3 sentences.

Describe what became different at the level the user actually cares about.

For code changes, prefer behavioral, structural, ownership, API, or responsibility changes over diff statistics.

Bad:

> This PR modifies 12 files with 148 additions and 73 deletions.

Better:

> Session refresh moved out of `AuthProvider` and into the shared API client. Expired requests can now refresh and retry transparently instead of immediately forcing logout.

For lateral comparisons, summarize the central distinction:

> Both components display invoice data, but `InvoiceTable` owns fetching and caching while `InvoiceGrid` receives prepared data from its parent.

The Summary should be useful even if the reader stops there.

## Important consequences

Always include `## Important consequences` immediately after the Summary.

This section is an attention triage layer.

Before the reader invests effort understanding the detailed delta, tell them what the difference actually affects.

Prefer approximately 1–3 short bullets.

Good candidates include:

- observable behavior changes;
- responsibilities or ownership moving between components or layers;
- compatibility or caller impact;
- changed data flow;
- changed state ownership;
- new or removed boundaries;
- public API changes;
- meaningful dependency changes;
- changes that remain intentionally local or contained.

Keep this section descriptive.

Valid:

> Existing callers no longer need to handle token refresh explicitly.

Not valid:

> Centralizing token refresh here is a bad architectural choice.

The latter belongs to review or Decision.

If the difference has no meaningful consequences beyond a local implementation detail, say so explicitly:

> No meaningful consequences beyond the local implementation.

Do not invent significance merely to populate this section.

## Diagram

Always include a diagram after Important consequences.

Choose the representation according to the global Diagram Selection rules.

Difference explanations normally use paired or mirrored diagrams.

The two sides should use the same visual grammar so the delta can be recognized by inspection.

For temporal changes:

```text
BEFORE                    AFTER

Component                 Component
   │                         │
   ▼                         ▼
  API                     Cache
   │                         │
   ▼                         ▼
  DB                        API
                              │
                              ▼
                             DB
```

For lateral comparisons:

```text
IMPLEMENTATION A           IMPLEMENTATION B

Component                  Parent
   │                          │
   ▼                          ▼
fetch data                  fetch data
   │                          │
   ▼                          ▼
render                     Component
                              │
                              ▼
                            render
```

Use a small ASCII diagram when the comparison is simple.

For larger structures, prefer a Mermaid flowchart with parallel `subgraph`s.

Do not use Mermaid `gitGraph` merely because the comparison concerns a PR or branch.

Use `gitGraph` only when Git history or branch topology itself is what the user needs to understand.

The diagram should expose the structural or behavioral delta.

Do not reproduce every table row visually.

## Differences

Always include `## Differences`.

This is the centerpiece of the template.

Use a comparison table unless the difference is so small that a table would contain fewer than two meaningful comparison dimensions.

Prefer approximately 3–5 meaningful rows.

Use column names that match the actual comparison.

Examples:

```text
| Aspect | Before | After |
```

```text
| Aspect | `InvoiceTable` | `InvoiceGrid` |
```

```text
| Aspect | `main` | Current branch |
```

Do not mechanically use "Before" and "After" for lateral comparisons.

Choose comparison dimensions according to what actually matters.

Useful dimensions may include:

- behavior;
- ownership;
- responsibilities;
- state;
- data flow;
- API surface;
- dependencies;
- failure handling;
- persistence;
- lifecycle;
- boundaries;
- configuration.

Example:

| Aspect | Before | After |
|---|---|---|
| Refresh ownership | `AuthProvider` | shared API client |
| Expired request | logout | refresh + retry |
| Callers | auth-aware | mostly auth-agnostic |
| Retry logic | duplicated | centralized |

Do not create rows merely because facts are available.

Prefer the few dimensions that reconstruct the meaningful delta.

For PRs and branches, do not organize this section file-by-file.

Bad:

- `auth.ts` changed...
- `client.ts` changed...
- `provider.ts` changed...

Better:

| Aspect | Before | After |
|---|---|---|
| Refresh ownership | provider | API client |
| Failure behavior | logout | refresh + retry |
| Session responsibility | distributed | centralized |

Files are evidence for the delta, not the organizing principle.

## Key code

Always include `## Key code`.

Ground the comparison in the actual implementation.

Target approximately 5 important anchors.

Prefer 3–5 when that is sufficient to prove the important differences.

Use fewer when the delta is genuinely small.

Exceed 5 only when another anchor is necessary to establish a materially important difference.

An anchor may be:

- a changed file;
- function;
- class;
- hook;
- component;
- route;
- configuration entry;
- old/new implementation pair;
- another concrete symbol or location.

Choose anchors that demonstrate the meaningful delta.

Do not list every modified file.

Each anchor should contain:

1. the path or symbol;
2. one short sentence explaining what difference it demonstrates;
3. a tiny fenced snippet from the actual code.

For code changes, prefer a short diff when it communicates the change clearly:

**`src/api/client.ts`**  
Refresh responsibility moved into the shared request layer.

```diff
+ if (response.status === 401) {
+   return refreshAndRetry(request)
+ }
```

For lateral comparisons, paired representative snippets may be more appropriate:

**`InvoiceTable.tsx` vs `InvoiceGrid.tsx`**  
One owns its query while the other receives prepared data.

```tsx
const { data } = useQuery(invoiceQuery)
```

versus:

```tsx
function InvoiceGrid({ invoices }: Props) {
```

### Code snippet rules

Snippets are evidence, not miniature diff reviews.

Normally use approximately 1–4 lines per snippet.

Select the smallest actual fragment that demonstrates the difference.

Prefer:

- changed signatures;
- representative calls;
- central branches;
- ownership-defining declarations;
- configuration differences;
- expressions that expose changed behavior.

Remove irrelevant surrounding boilerplate.

Do not reconstruct code that does not exist.

Do not explain every changed line.

For large diffs, select representative evidence rather than reproducing the patch.

## Information Selection

Investigate as much of both sides as necessary to understand the comparison.

Return only the differences needed to reconstruct the meaningful delta.

Do not confuse:

> everything that changed

with:

> everything the reader needs to understand what changed.

Do not include:

- exhaustive changed-file inventories;
- diff statistics unless explicitly requested;
- chronological narration of commits;
- every mechanical rename or formatting change;
- unchanged implementation details that do not clarify the comparison;
- architectural recommendations;
- maintainability judgments;
- speculative future problems.

Keep the answer descriptive.

The Difference template explains:

> What is different, and what does that difference affect?

Decision or review workflows answer:

> Is that difference good?

## Reuse in specialized workflows

Specialized skills may reuse the Difference response grammar without activating this skill as the primary workflow.

When Difference is embedded inside a larger workflow, use a compact form when appropriate:

1. Summary
2. Important consequences
3. Diagram
4. Differences

`Key code` may be omitted when the surrounding workflow already provides sufficient code evidence or would otherwise repeat the same snippets.

For example, a PR-review Change Map may use this compact form to establish the semantic delta before later architectural or correctness gates evaluate it.

The specialized workflow remains responsible for judgment.

The Difference grammar only establishes what changed and what that change affects.

