# Decision Template

Use Decision when the user wants to understand or evaluate a focused engineering choice.

The fundamental question is:

> Why was X designed this way, or should it be designed differently?

Decision has two modes:

- **Reconstructive:** explain why an existing choice was likely made.
- **Evaluative:** judge whether the current approach should be kept, simplified, replaced, or changed.

Both modes use the same reasoning structure.

The reader should finish the answer able to:

- understand the recommendation or reconstructed rationale;
- see which concrete facts drive that conclusion;
- compare the realistic alternatives;
- inspect the strongest evidence in the code;
- know which missing facts or future conditions would change the decision.

Decision is a focused design analysis, not a general architecture review.

Investigate broadly before judging. Answer narrowly afterward.

The amount of investigation required does not determine the length of the final explanation.

The Decision template always uses this order:

1. Answer
2. Diagram
3. Decision factors
4. Options
5. Evidence
6. What would change the decision

## Answer

Always include `## Answer`.

Lead with the conclusion.

For evaluative questions, give a clear recommendation when the evidence supports one.

Prefer conclusions such as:

- keep the current approach;
- simplify it;
- prefer A over B;
- change it, but not yet;
- either approach is reasonable under the current constraints.

Do not hide behind generic statements such as:

> Both approaches have advantages and disadvantages.

when the available evidence supports a stronger judgment.

Briefly state the main reason for the conclusion.

Example:

> **I would simplify this.** The abstraction currently has one implementation, callers do not rely on substitutability, and the extra boundary duplicates a capability the framework already provides.

For reconstructive questions, distinguish known rationale from inference.

Example:

> **The rationale is not documented.** The strongest explanation supported by the code is that the event bus keeps three independently mounted UI surfaces from depending directly on each other.

Never present inferred developer intent as documented fact.

When useful, make the confidence level clear through normal language such as:

- documented;
- strongly supported;
- likely;
- plausible but unverified.

## Diagram

Always include a diagram immediately after the Answer.

Choose the representation according to the global Diagram Selection rules.

For Decision explanations, normally diagram:

> the current design and the recommended or main competing alternative.

For reconstructive questions, diagram:

> the chosen design and the strongest realistic alternative when that contrast helps explain the choice.

Prefer paired or mirrored structures so the architectural difference is immediately visible.

Example:

```text
CURRENT                         SIMPLIFIED

Component                       Component
   │                               │
   ▼                               ▼
Adapter                         Service
   │
   ▼
Service
```

The diagram does not need to include every option discussed later.

Usually show only:

- the current or chosen design;
- the recommended or strongest competing alternative.

The Options table is responsible for presenting the complete set of realistic alternatives.

Use a decision-tree-shaped flowchart only when the choice genuinely depends on a small number of explicit conditions.

Do not force nuanced tradeoffs into artificial yes/no trees.

## Decision factors

Always include `## Decision factors`.

Identify the concrete facts that materially drive the judgment.

Prefer approximately 2–5 factors.

Good decision factors include:

- actual requirements;
- existing implementations;
- number and type of callers;
- ownership boundaries;
- framework or language conventions;
- extension requirements;
- testing needs;
- runtime constraints;
- coupling introduced or removed;
- operational complexity;
- existing duplication;
- current and foreseeable change pressure.

Keep these specific to the codebase and the question.

Bad:

> Abstractions improve maintainability.

Better:

> Only one implementation exists, and all callers already depend on behavior specific to that implementation.

Do not evaluate the design primarily against generic best practices.

Judge the options under the codebase's actual constraints.

The purpose of this section is to expose:

> These are the facts that make the answer lean this way.

This also gives the user concrete assumptions or factors they can correct.

## Options

Always include `## Options`.

Use a compact comparison table.

Include the realistic alternatives relevant to the decision.

Normally include approximately 2–4 options.

The current implementation or status quo counts as an option and should normally be included.

Do not invent weak alternatives merely to make the table larger.

Prefer columns that expose the meaningful tradeoff for the specific decision.

A useful default is:

| Option | What it buys | Cost | Fit here |
|---|---|---|---|
| Current approach | ... | ... | ... |
| Simpler alternative | ... | ... | ... |
| Other realistic option | ... | ... | ... |

`Fit here` should contain an actual judgment rather than another neutral description.

Possible values include:

- Strong
- Reasonable
- Weak
- Best fit
- Only justified if X

Adapt the columns when another comparison communicates the decision more clearly.

The table exists both to support the recommendation and to provide a stable reference surface for follow-up discussion.

A user should be able to say:

> Tell me more about option B.

and have the reference be unambiguous.

After the table, add only the short interpretation needed to explain which differences actually decide the question.

Do not repeat every cell in prose.

## Evidence

Always include `## Evidence`.

Ground the reasoning in the strongest concrete evidence from the codebase.

Prefer approximately 2–4 anchors.

An anchor may be:

- a file;
- function;
- class;
- component;
- hook;
- interface;
- configuration entry;
- call site;
- test;
- documentation or ADR;
- another concrete symbol or repository artifact.

Choose evidence that supports the important decision factors.

Do not list everything inspected during the investigation.

Each code anchor should normally contain:

1. the path or symbol;
2. one short sentence explaining what it proves;
3. one small fenced snippet from the actual code.

Example:

**`src/payments/PaymentProcessor.ts`**  
Defines the abstraction, currently with a single implementation.

```ts
interface PaymentProcessor {
  process(payment: Payment): Promise<void>
}
```

**`src/payments/StripePaymentProcessor.ts`**  
The only concrete implementation in the repository.

```ts
class StripePaymentProcessor implements PaymentProcessor
```

Normally keep code snippets to approximately 1–4 lines.

Use the smallest actual fragment that demonstrates the relevant fact.

For reconstructive decisions, also inspect available rationale sources when useful, including:

- ADRs;
- documentation;
- comments;
- tests;
- commit history;
- PR descriptions or discussions when available.

Clearly distinguish evidence of behavior or structure from evidence of historical intent.

Code can strongly establish what a system does without establishing why its authors chose it.

## What would change the decision

Always include `## What would change the decision`.

State the concrete conditions, missing facts, or future requirements that would materially alter the conclusion.

Examples:

- a second implementation is actually planned;
- runtime implementation selection is required;
- another package consumes this interface as a stable boundary;
- a compatibility constraint exists outside the repository;
- a requirement discussed outside the codebase changes the expected lifecycle;
- the alternative would violate an operational constraint not visible in the code.

This section exposes the boundary conditions of the recommendation.

It is not a generic caveats section.

Use it to make the judgment falsifiable and easy for the user to refine with context the agent may not possess.

Do not invent invisible organizational constraints and treat them as facts.

Instead, state them conditionally:

> This recommendation would change if this interface is intentionally consumed by another package that must remain implementation-independent.

If the user confirms that a condition cannot occur, the recommendation may become stronger.

If the user reveals that a condition is true, reassess the decision using the new information.

If no realistic condition would materially change the conclusion within the requested scope, say so briefly rather than manufacturing one.

## Decision Quality

Decision explanations should be opinionated when the evidence permits, but never more certain than the evidence supports.

Prefer:

> Given the current constraints, B is the better fit because...

over:

> B is a best practice.

Prefer:

> I would remove this abstraction unless a second implementation is a real requirement.

over:

> This abstraction violates YAGNI.

Do not substitute architecture slogans, pattern preferences, or generic best practices for codebase-specific reasoning.

Do not recommend complexity for hypothetical future requirements unless those requirements have credible evidence.

Do not recommend simplification merely because fewer lines or fewer abstractions look cleaner.

Consider the actual cost of change, ownership, coupling, behavior, language/framework conventions, and requirements relevant to the decision.

For reconstructive questions, never invent historical intent.

For evaluative questions, make a recommendation rather than stopping at a neutral list of tradeoffs when the evidence supports one.
