---
name: clarify-intent
description: Use before planning or implementing any feature, bugfix, refactor, or behavior change. Runs first to surface consequential product, behavioral, scope, compatibility, or priority ambiguity; if intent is already clear, asks nothing and immediately hands off.
---

# Clarify Intent

## Overview

Clarify the few decisions that could make an otherwise good implementation solve the wrong problem.

Run this before brainstorming, systematic debugging, implementation planning, or implementation.

The goal is not complete requirements gathering. Surface only consequential ambiguity that deserves human attention before technical design begins.

**Core principle: ask first about the unresolved decision whose wrong answer would invalidate the most downstream work.**

## Boundary

This skill owns intent, not design.

Clarify:

- **Outcome**: what result actually matters?
- **Invariants**: what must remain true?
- **Scope**: where should this change stop?
- **Priority**: when desirable goals conflict, which one should win?

Leave technical decisions downstream.

Do not ask about:

- architecture or implementation approach
- files or module placement
- libraries or dependencies
- state management
- API shape unless the API behavior itself is an intent constraint
- test strategy
- naming
- repository facts or conventions the agent can discover itself

A useful dividing line:

| Clarify here | Leave to planning / brainstorming |
| --- | --- |
| What are we actually trying to accomplish? | How should we build it? |
| What must not change? | What architecture fits? |
| How far should the change reach? | Where should the code live? |
| Which outcome matters more if they conflict? | Which technical approach is best? |

## When to Ask

The preflight always runs before planning or implementing a change. Ask a question only when intent may be underspecified, implicit, solution-shaped, or consequential.

Typical signals:

- a ticket proposes a mechanism without making the underlying outcome clear
- compatibility or existing behavior may matter
- the obvious fix could expand into adjacent work
- there are several desirable outcomes that may conflict
- stakeholder, product, or historical context may exist outside the repository
- the requested change could reasonably mean materially different things

If the existing conversation already makes intent sufficiently clear, ask nothing and continue.

Do not manufacture clarification work for a clear task.

## Process

### 1. Read the existing intent

Use the request and relevant context already available.

Do not perform repository exploration merely to complete this gate. Technical or repository-answerable uncertainty belongs downstream.

Identify only consequential unresolved intent.

### 2. Consider four dimensions

#### Outcome

Ask whether the stated request describes the desired result or merely a proposed mechanism.

Useful questions include:

- What observable outcome actually matters here?
- Is the proposed mechanism itself required, or is it one possible solution?
- What problem should still be considered solved if the implementation differs from the suggestion?

Prefer clarifying the underlying result over prematurely accepting a prescribed mechanism.

#### Invariants

Identify behavior or contracts that may need to survive the change.

Useful questions include:

- What must still be true afterward?
- What existing behavior must not change?
- What outcome would make this unacceptable even if it solved the immediate problem?

Examples include compatibility, user-visible behavior, persistence semantics, integrations, security expectations, and intentionally preserved quirks.

#### Scope

Clarify where the requested change should stop when adjacent work is plausible.

Useful questions include:

- Are we fixing only this known case or the broader pattern?
- Is the adjacent problem intentionally in scope?
- Should this remain local unless broader change proves necessary?

Do not invite speculative cleanup.

#### Priority

Look for desirable goals that may conflict.

Useful questions include:

- If these goals conflict, which one should win?
- Is compatibility more important than a cleaner interface?
- Is a narrow change preferable to system-wide consistency here?
- Should we optimize for the smallest safe fix or for establishing a durable direction?

Ask about the priority, not the technical solution.

### 3. Rank before asking

Do not walk through all four dimensions mechanically.

Rank unresolved questions by downstream consequence.

Ask the question whose wrong answer would invalidate the greatest amount of subsequent work.

Prefer questions that require:

- human intent
- product or stakeholder judgment
- prioritization
- authority
- information unavailable to the agent

Avoid questions whose answers are technical, local, reversible, or cheaply discoverable later.

### 4. Ask one question at a time

Keep attention on the highest-consequence decision.

Do not present a long questionnaire.

When helpful, provide likely options and recommend one rather than forcing the user to invent an opinion from scratch.

Example:

> I recommend preserving the existing API behavior unless you know consumers can migrate. Breaking it would give us a cleaner interface but introduces coordination risk. Should compatibility win here?

The recommendation should make the decision easier, not bias the user through false certainty.

### 5. Handle "I don't know" without stalling

Not knowing is a valid answer.

When the user cannot resolve an important question and a reasonably safe default exists, recommend a **provisional intent** and continue.

Use this fallback preference order:

1. Preserve existing observable behavior and contracts.
2. Minimize the scope of change.
3. Avoid irreversible commitments.
4. Prefer the choice that is easiest to revise later.

Choose the least presumptuous option, not the theoretically most elegant one.

State briefly:

- the recommended assumption
- why it is the safer default
- that it is provisional rather than confirmed

Do not present a provisional assumption as known stakeholder intent.

### 6. Recognize decisions that cannot be safely defaulted

Do not invent a default when any plausible guess could create major irreversible, security, destructive-data, authorization, billing, compliance, or similarly consequential risk.

Mark the intent as unresolved.

Further investigation or design may continue if it does not commit to that decision, but implementation that depends on the unresolved choice must not silently proceed.

### 7. Stop early

Stop when the remaining uncertainty is primarily:

- technical
- implementation-specific
- repository-answerable
- local
- reversible
- cheaply discoverable during planning

Do not keep asking questions merely because more questions are possible.

The ideal result is that downstream brainstorming inherits the important intent and mostly has engineering questions left.

## Intent Confidence

Distinguish internally between:

- **Confirmed**: explicitly established by the user or authoritative context
- **Inferred**: strongly supported by existing context
- **Provisional**: unknown, with a conservative default deliberately chosen

Do not treat these as equally certain.

Use explicit labels when the distinction would help downstream reasoning. Do not clutter trivial cases with unnecessary metadata.

## Handoff

Do not create a specification or markdown artifact unless explicitly requested.

Keep the result concise in the current session context.

When useful, summarize only the decisions that materially constrain downstream work:

```text
Intent

Outcome:
Eliminate duplicate exports during overlapping retries.

Invariants:
Concurrent retry behavior must remain. [confirmed]
Existing external behavior should remain unchanged. [provisional]

Scope:
Fix this retry path only. Do not redesign the export pipeline.

Priority:
Prefer the smallest compatible change over broader cleanup.
```

Then hand off to the normal debugging, planning, or brainstorming workflow.

If no consequential ambiguity existed, a simple statement is enough:

> Intent is already sufficiently clear. Continue.

## Example

Request:

> Add Redis caching to the customer endpoint because it has become slow.

Do not immediately ask about Redis topology, cache invalidation, libraries, or implementation.

First notice that the request may be solution-shaped.

Ask:

> Is Redis itself a requirement, or is the actual goal to bring the customer endpoint latency down while preserving its current behavior? I recommend treating latency as the requirement and Redis as one possible implementation unless there is an external reason Redis is mandated.

Suppose the user answers:

> Redis is not mandated. The important thing is reducing latency. Existing callers must see exactly the same behavior.

Capture:

```text
Outcome:
Reduce customer endpoint latency. Redis is an implementation option, not a requirement.

Invariant:
Preserve existing externally observable behavior.

Scope:
No broader caching architecture has been requested.
```

Stop.

Questions about caching strategy, measurement, invalidation, dependencies, architecture, and tests belong to downstream brainstorming.

## Common Mistakes

| Mistake | Correction |
| --- | --- |
| Asking all four categories every time | Ask only consequential unresolved questions |
| Turning this into requirements gathering | Stop once intent is sufficient for technical planning |
| Asking the user technical questions | Let the agent investigate or let brainstorming decide |
| Asking repo-answerable questions | Leave repository discovery downstream |
| Treating a proposed solution as the requirement | Clarify the underlying outcome when uncertain |
| Blocking whenever the user says "I don't know" | Recommend a conservative provisional default |
| Coin-flipping between reasonable options | Prefer compatibility, minimal scope, reversibility, and low commitment |
| Hiding uncertainty after choosing a default | Mark provisional assumptions as provisional |
| Expanding scope "while we're here" | Default to the smallest scope that solves the known problem |
| Continuing until every ambiguity disappears | Stop when remaining ambiguity is technical or cheap to resolve |

## Red Flags

If you find yourself asking any of these, reconsider whether this skill has crossed into planning:

- "Which architecture should we use?"
- "Which library do you prefer?"
- "Where should this state live?"
- "Which files should change?"
- "How should we test this?"
- "Should I extract an abstraction?"
- "What does the existing repository currently do?"

The intent gate is finished when the important **why, what, boundaries, and priorities** are clear enough for engineering judgment to take over.
