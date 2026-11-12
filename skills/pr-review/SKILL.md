---
name: pr-review
description: Use when the human explicitly invokes /pr-review to review a pull request. Never invoke automatically, for self-review, at task completion, during implementation checkpoints, or from requesting-code-review.
disable-model-invocation: true
---

# PR Review

Review the pull request through a sequence of gates.

Each gate answers a different question and may stop the review before later, more expensive work is performed.

```text
                PR
                 │
                 ▼
          ┌─────────────┐
          │ INTENT GATE │
          └─────────────┘
                 │
        What are we building?
                 │
                 ▼
          ┌────────────┐
          │ CHANGE MAP │
          └────────────┘
                 │
       What structurally changed?
                 │
                 ▼
       ┌────────────────────┐
       │ ARCHITECTURAL GATE │
       └────────────────────┘
                 │
       Do we want this direction?
                 │
                 ▼
        ┌──────────────────┐
        │ CORRECTNESS GATE │
        └──────────────────┘
                 │
             Does it work?
                 │
                 ▼
               MERGE
```

The stages deliberately occur in this order.

Do not spend significant effort proving an implementation correct if its intent is unresolved or its architectural direction should cause it to be substantially rewritten.

---

# General Principles

Review important things, not everything that can possibly be commented on.

The objective is to maximize important confidence per unit of reviewer attention.

Use deterministic tooling for deterministic questions.

Use AI analysis to reduce the amount of information a human reviewer must reconstruct manually.

Reserve human judgment for decisions that require understanding intent, trade-offs, project direction, and context.

AI is a pressure-tester and scout, not an authority.

Prefer concrete evidence over speculative concerns.

Do not comment merely to demonstrate that a review occurred.

Do not review:

- formatting;
- naming preferences;
- subjective style;
- cosmetic refactoring opportunities;
- issues already adequately enforced by deterministic tooling;
- alternative implementations that are merely preferable;
- generic clean-code advice;
- nits.

If there is nothing important to report, report nothing beyond the gate result.

---

# 1. Intent Gate

The Intent Gate answers:

> **What are we actually trying to build, and does the implementation correspond to that intent?**

It establishes the contract against which the rest of the review operates.

## PR description

Start with the PR description.

The PR description must concisely explain what behavior the author intends to introduce or change.

Do not open the ticket merely to discover what the PR is supposed to do.

If the PR description does not provide sufficiently clear intent, stop the review and say so.

Do not compensate for a missing or vague description by reconstructing intent from the diff or ticket.

The author is responsible for making the PR understandable.

The PR description should be short enough that another developer can quickly understand the intended behavioral change.

Do not require it to duplicate the complete ticket or acceptance criteria.

## Ticket ↔ PR description

If ticket context is available, compare the ticket's intended behavior with the PR description.

The ticket represents the original requested intent.

The PR description represents the author's explicit implementation intent.

A PR may intentionally differ from the ticket.

Detect only material differences such as:

- added behavior;
- removed behavior;
- changed scope;
- different handling of important states;
- changed user-visible workflows;
- changed assumptions explicitly stated by the ticket.

Ignore wording differences and implementation details that do not alter intent.

If material drift exists, surface it and ask whether it was intentional.

For example:

> The ticket limits retry to failed payments, while the PR description also includes partially processed payments. Was this expansion intentional?

Do not assume drift is wrong.

Do not perform a complete acceptance-criteria audit.

Do not act as QA.

Do not require the PR description to repeat the ticket.

If there is no meaningful drift, move on without commenting.

## PR description ↔ implementation

Perform enough inspection of the implementation to determine whether the code actually implements what the PR description claims.

Look for:

- missing pieces of stated behavior;
- behavior implemented differently from what is described;
- unintended additional behavior;
- obvious contradictions between tests, implementation, and stated intent.

This is an alignment check, not yet a deep correctness review.

Do not exhaustively hunt bugs or pressure-test edge cases at this stage.

If the implementation materially differs from the stated intent, stop and surface the mismatch.

If the Intent Gate passes, continue to the Change Map.

---

# 2. Change Map

The Change Map is **not a gate**.

It does not approve or reject anything.

Its purpose is to cheaply establish:

> **What important structural facts changed?**

Create a concise factual map of the implementation before making architectural judgments.

Look for meaningful changes such as:

- modules or features added, removed, or substantially changed;
- new public interfaces or APIs;
- new abstractions;
- abstractions that were bypassed or replaced;
- new dependencies;
- changes in dependency direction;
- changes in state ownership;
- new sources of state;
- changes in data flow;
- responsibilities moved between modules or layers;
- business rules introduced in additional locations;
- important mechanisms that were removed or replaced.

Use surrounding source context when necessary to understand these structural facts.

Prefer answering specific questions over exploring the entire subsystem.

Keep the Change Map descriptive and render the Change Map using the compact form of the Codebase Explanations (`codebase-explanations`) skill's `Difference` template. The compact form of the `Difference` template has the following structure:

1. Summary
2. Important consequences
3. Diagram
4. Differences

Do not recommend changes.

Do not judge whether the architecture is good or bad.

Do not produce:

- SOLID commentary;
- code-smell inventories;
- maintainability scores;
- refactoring suggestions;
- style commentary;
- speculative future problems.

For trivial changes with no meaningful structural consequences, simply state:

> No meaningful structural changes.

Then continue.

---

# 3. Architectural Gate

If the Intent Gate passes and the Change Map is complete, read and apply [architecture-gate.md](architecture-gate.md). Do not continue to the Correctness Gate unless the Architectural Gate passes.

---

# 4. Correctness Gate

The Correctness Gate answers:

> **Given that this is the behavior we intend and an implementation direction we are willing to keep, does it actually work?**

Now pressure-test the implementation deeply.

Try to falsify it.

Focus on:

- incorrect behavior;
- regressions;
- missing or incorrect failure handling;
- race conditions and state bugs;
- invalid assumptions about data or APIs;
- security problems relevant to the change;
- important edge cases;
- incorrect interactions with existing behavior.

Ask questions such as:

- What happens when dependencies fail?
- What happens at boundaries and empty states?
- What happens with unexpected but plausible data?
- Can operations happen twice or race?
- Can state become stale or inconsistent?
- Does existing behavior still work?
- Are error and recovery paths correct?
- Do tests meaningfully exercise the changed behavior?
- Can a realistic input, state, or execution sequence produce an incorrect result?

Prefer findings that can be demonstrated with a concrete failure scenario.

Do not invent hypothetical problems without a plausible path to failure.

Use existing deterministic signals such as:

- tests;
- typechecking;
- builds;
- linters;
- static analysis;

when available.

Do not duplicate deterministic tooling by commenting on issues those tools already adequately enforce unless the issue reveals a genuine behavioral problem.

AI analysis is a correctness pressure-tester, not a correctness verifier.

If no concrete correctness problems are found, do not manufacture findings.

---

# Findings

Every finding must belong to a gate.

Use only the following categories.

## Intent Drift

The PR description materially differs from the linked ticket and the difference should be confirmed as intentional.

## Intent Mismatch

The implementation materially differs from what the PR description claims.

## Architectural Issue

The implementation introduces a structural direction that materially increases future change cost, hidden coordination, coupling, or cognitive load.

Explain the future consequence rather than citing architectural doctrine.

## Correctness Issue

There is a plausible bug, regression, unsafe behavior, or other immediate correctness problem.

For correctness findings, explain the concrete failure scenario whenever possible.

Do not disguise stylistic preferences or optional improvements as findings.

---

# Follow-up Reviews

Keep lightweight local review state under `.git/pr-review/`. Never commit it.

Before reviewing, determine the current branch or equivalent local review identity and look for existing review state. If state exists, read and apply [follow-up-reviews.md](follow-up-reviews.md) before continuing. If none exists, perform an initial review.

Store only the review identity, last reviewed commit SHA, and unresolved finding gates and summaries. Do not store full ticket contents, full diffs, model reasoning, or unrelated project information.

After every review, update the state to the current HEAD and unresolved findings.

---

# Platform Independence

Do not assume any specific pull request or ticketing provider.

Use local git whenever possible for repository state and follow-up detection.

Use PR and ticket context when it is already available through the current environment or explicitly supplied.

Do not require or assume:

- GitHub;
- GitLab;
- Bitbucket;
- Jira;
- Linear;
- Azure DevOps;
- GitHub Issues;
- any specific provider API.

The review philosophy must remain independent of the tools used to host the repository or track work.

Do not fail the entire review merely because a ticketing integration is unavailable.

If ticket context is unavailable, perform the parts of the Intent Gate that can be established from the PR description and implementation.

---

# Source Navigation

Start from the PR description and changed files.

Use surrounding source context when necessary to answer a specific question.

Do not automatically explore the entire subsystem.

Treat local source navigation as a depth tool, not an entrance ticket.

Before leaving the immediate PR context, have a concrete question such as:

> Who currently owns this state?

> Is this business rule already defined elsewhere?

> Does this module already provide a narrow API for this operation?

> Does this new dependency bypass an existing abstraction?

Prefer targeted investigation over broad codebase archaeology.

---

# Output

Keep review output concise.

Report only information that materially affects one of the gates.

Do not produce commentary for a gate merely to prove that it was performed.

A successful review may look like:

```text
Intent Gate: passed

Change Map:
- Payment retry behavior added to PaymentsTable.
- New retry API operation introduced.
- Retry eligibility remains owned by the payments domain.
- No new shared infrastructure or global state.

Architectural Gate: passed

Correctness Gate: passed
```

If a gate fails, report the relevant findings and stop when continuing would waste review effort.

For example:

```text
Architectural Gate: failed

Architectural Issue:
Retry eligibility is now independently encoded in both the domain layer and PaymentsTable. Future changes to retry rules would require keeping the two implementations synchronized.

The authoritative retry rule should remain in one place and be consumed by the UI.

Correctness review skipped because the implementation direction should change.
```

Do not append:

- optional improvements;
- generic praise;
- nits;
- unrelated observations;
- speculative refactoring ideas.

---

# Review Principle

Evaluate the cheapest broad invalidators before spending attention on narrower expensive questions.

```text
Intent
  ↓
Change Map
  ↓
Architecture
  ↓
Correctness
```

The review should answer four questions:

> **Did we consciously decide what to build?**

> **What structural route did the implementation take?**

> **Is that a route we want the codebase to continue taking?**

> **Does the implementation actually work?**
