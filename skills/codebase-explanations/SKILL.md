---
name: codebase-explanations
description: Explain existing codebases and questions related to codebases using consistent response templates. Use when the user's primary goal is to understand how a system or feature works, locate where something is implemented, trace or diagnose behavior, understand differences between implementations or revisions, or evaluate a focused technical design decision. Do not use for implementation, refactoring, planning, routine completion summaries, or PR review when another workflow owns the task.
---

# Codebase Explanations

Implemented templates: System, Location, Behavior, Difference, Decision

## Purpose

Use this skill when the user's primary goal is to understand some aspect of an existing codebase.

The goal is not maximum completeness. Produce a compact, reconstructable mental model that is easy to scan repeatedly because similar explanation types always use the same response structure.

Prefer stable response grammar over improvising a new presentation for every answer.

## Activation

Activate this skill automatically when the user's primary intent is to:

- understand how a system, feature, subsystem, or component works;
- locate where something lives in the codebase;
- trace or explain runtime behavior;
- understand differences between two implementations, revisions, branches, or states;
- understand or evaluate a technical design decision.

The user does not need to use words such as "explain".

Examples that should activate this skill:

- "How does authentication work?"
- "Describe the styling strategy in this app."
- "Where is CSV export implemented?"
- "What happens when the access token expires?"
- "Why does this request fire twice?"
- "What changed in this branch?"
- "How do these two implementations differ?"
- "Why did they use Context instead of Zustand?"
- "Would this be simpler without this abstraction?"

## Do Not Activate

Do not activate this skill merely because another task involves explanatory text.

Examples:

- implementing a feature;
- fixing a bug;
- refactoring code;
- running tests or commands;
- creating a plan;
- reviewing a PR when a dedicated review workflow or skill owns the task;
- summarizing work the agent itself just completed;
- routine status or completion reports;
- answering general technical knowledge questions that do not require understanding this codebase.

If the user later explicitly asks for an explanation of work performed, that new request may activate this skill.

Example:

- "Implement token refresh." → do not activate.
- "What exactly did you change?" → Difference.
- "Why did you implement it this way?" → Decision.

## Skill Composition

This skill owns the semantic structure of codebase explanations.

Other skills may independently own prose style, brevity, tone, or formatting constraints.

When another active skill requests shorter or simpler answers:

- preserve the explanation template;
- compress wording aggressively;
- remove nonessential detail;
- do not remove information required to preserve an accurate mental model.

When constraints conflict, prefer:

1. semantic correctness;
2. this skill's explanation structure;
3. stylistic or brevity constraints.

Specialized task skills take precedence when explanation is secondary to their primary task.

Planning is a separate concern and is outside this skill.

## Classification

Classify every matching request into exactly one primary explanation type.

Choose based on the user's primary requested operation, not on answer length or code complexity.

### System

Fundamental question:

> How does X work?

Use for mental models of systems, features, architectural approaches, components, conventions, or strategies.

Examples:

- "How does authentication work?"
- "Describe the styling strategy."
- "How is caching handled?"
- "What does this provider do?"
- "Explain the payments subsystem."

### Location

Fundamental question:

> Where is X?

Examples:

- "Where is authentication implemented?"
- "Where does feature X live?"
- "Where would I change token refresh behavior?"

### Behavior

Fundamental question:

> What happens, or why does it happen?

Use for runtime behavior, execution paths, data flow, causal chains, and diagnosis.

Examples:

- "What happens when I click Save?"
- "Why does this request fire twice?"
- "What happens when refresh fails?"

### Difference

Fundamental question:

> What is different between A and B?

A and B may represent:

- before and after;
- base branch and PR;
- two implementations;
- two components;
- old and new behavior.

Examples:

- "What did this PR change?"
- "How does this branch differ from main?"
- "What's different between these two auth implementations?"

### Decision

Fundamental question:

> Why was X designed this way, or should it be designed differently?

Use for reconstructing or evaluating focused engineering decisions.

Examples:

- "Why did they choose Y instead of Z?"
- "Would X have been better implemented another way?"
- "Should this abstraction be simplified?"
- "Do we actually need this service?"

## Classification Rules

Prefer the user's explicit requested operation when categories overlap.

Examples:

- "How does auth work after this PR?" → System
- "What changed about auth in this PR?" → Difference
- "What happens when auth refresh fails?" → Behavior
- "Where is auth refresh implemented?" → Location
- "Would auth refresh be simpler without this abstraction?" → Decision

Do not create hybrid templates.

Choose the single category that best represents what the user wants from the answer.

Complexity controls how much detail fills a template. It does not control whether the template is used.

---

# Diagram Selection

When a template includes a diagram, choose the diagram structure according to the mental model being communicated.

Prefer the simplest representation that preserves the important relationships.

Diagrams are explanatory tools, not decoration.

## Topology and component relationships

Use when the question is primarily about:

- important components;
- ownership boundaries;
- dependencies;
- architectural relationships;
- how pieces fit together.

Prefer:

- a small ASCII graph for simple relationships;
- a Mermaid `flowchart` for larger relationships;
- a Mermaid block diagram when high-level component grouping is more important than directional flow.

Example:

```text
AuthProvider ──→ API client ──→ Backend
```

Do not use complex architecture notation when a few boxes and arrows communicate the model more clearly.

## Interactions over time

Use when understanding depends on the order in which multiple participants interact.

Prefer a Mermaid `sequenceDiagram`.

Typical uses:

- browser → frontend → API → database;
- request/response flows;
- retries;
- authentication exchanges;
- asynchronous interactions between services.

Sequence diagrams should emphasize meaningful participants and interactions, not every function call.

## State transitions

Use when the central mental model is one entity moving between states.

Prefer a Mermaid `stateDiagram`.

Typical uses:

- order lifecycle;
- connection states;
- authentication/session states;
- workflow status changes.

Do not use a state diagram merely because the implementation happens to contain state.

## Repository location and ownership

Use when the question is about where code lives.

Prefer:

- an ASCII directory tree;
- a small ASCII relationship graph when the concept spans multiple areas.

Example:

```text
src/
└── features/
    └── reconciliation/
        ├── components/
        ├── hooks/
        └── api/
```

Use Mermaid only when ownership or dependencies across multiple repository areas cannot be communicated clearly with a small tree or graph.

## Before/after and alternatives

Use when the mental model is fundamentally comparative.

Prefer paired or mirrored diagrams that use the same visual structure on both sides.

Typical uses:

- before vs after;
- old vs new implementation;
- current design vs proposed alternative;
- implementation A vs implementation B.

Example:

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

When using Mermaid, a flowchart with parallel `subgraph`s is usually appropriate.

Keep both sides visually comparable so the meaningful delta is easy to see.

## Causal chains

Use when explaining why an observed behavior occurs and participant interaction is less important than cause and effect.

Prefer an ASCII or Mermaid flowchart.

Example:

```text
render
  ↓
new object identity
  ↓
effect dependency changes
  ↓
effect reruns
  ↓
second request
```

## Git topology

Use Mermaid `gitGraph` only when branches, commits, merges, or Git history topology are themselves the subject of the explanation.

Do not use `gitGraph` merely because the question concerns a PR or branch.

"What changed in this PR?" is normally a semantic before/after comparison, not a Git topology problem.

## Decision trees

A flowchart shaped as a decision tree may be useful when a design choice genuinely depends on a small number of explicit conditions.

Do not force nuanced engineering tradeoffs into artificial yes/no trees.

When comparing architectural alternatives, paired structural diagrams are usually more honest and useful.

---

# Template Routing

After classifying the request, read exactly one template file before answering:

- System: [system.md](system.md)
- Location: [location.md](location.md)
- Behavior: [behavior.md](behavior.md)
- Difference: [difference.md](difference.md)
- Decision: [decision.md](decision.md)

Read only the selected template file. If a request contains multiple explanation questions, choose the primary explanation type rather than loading another template.
