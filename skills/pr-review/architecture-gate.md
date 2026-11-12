# 3. Architectural Gate

The Architectural Gate answers:

> **After this PR, is the system still easy to change safely?**

More specifically:

> **Can future behavior still be changed locally, with explicit dependencies and state ownership, without unnecessarily coordinating unrelated parts of the system?**

Use the established intent from the Intent Gate and the factual structural information from the Change Map.

Do not re-review intent.

Do not perform deep correctness analysis here.

The purpose of this gate is to decide whether the structural direction introduced by the PR is one we want future work to build upon.

## Core Principle

Architecture should reduce the amount of the system a developer must understand and coordinate in order to make a safe change.

Prefer designs that keep:

- behavior local;
- state minimal and clearly owned;
- dependencies visible;
- data flow understandable;
- shared surfaces small;
- unrelated features independent.

Be suspicious of changes that increase coordination cost across the system without a concrete benefit.

## Necessity and Simplicity

Before evaluating the broader architecture, ask:

- Does every added mechanism serve the established intent?
- Does the codebase, standard library, platform, or an existing dependency already provide it?
- Are new abstractions, configuration, state, dependencies, or shared surfaces justified by current requirements?
- Could the same behavior be implemented with less indirection or coordination?

Prefer deleting unnecessary machinery, reusing what already exists, and implementing the required behavior directly.

Do not treat fewer lines as inherently better. Preserve validation, error handling, security, accessibility, and other correctness requirements.

Fail the Architectural Gate only when avoidable complexity creates a material ongoing cost or establishes a harmful precedent. If the implementation should be substantially simplified, stop before the Correctness Gate.

---

## Preserve Locality

Prefer behavior, state, tests, and implementation details to remain close to the feature or concept that owns them.

Ask:

- Does this change remain mostly understandable within the area it affects?
- Will future changes to this behavior mostly happen in obvious nearby places?
- Did the PR unnecessarily spread one feature across unrelated modules or layers?
- Did something local become global or shared without demonstrated need?

Do not move behavior into shared infrastructure merely because it might later be reused.

Feature autonomy is generally desirable.

Cross-feature coordination should exist because the domain requires it, not because architectural structure prefers it.

---

## Keep State Minimal and Clearly Owned

Every meaningful piece of state should have an obvious owner.

Prefer:

- local state over global state when coordination is unnecessary;
- derived values over additional stored state;
- one source of truth over synchronized copies.

Be suspicious of:

- mirrored state;
- duplicated caches;
- state copied between layers;
- synchronization mechanisms;
- multiple owners of the same information;
- state lifted or centralized merely to make it broadly accessible.

Ask:

> If this value changes, is it obvious where the authoritative change happens?

If not, future modifications are likely to become harder and less safe.

---

## Keep Dependencies Explicit

A developer should be able to understand important relationships by reading the relevant code.

Prefer explicit dependencies and composition over hidden resolution mechanisms.

Hide implementation complexity, but do not hide important dependency relationships.

Be suspicious of unnecessary:

- global state;
- service locators;
- registries;
- ambient dependencies;
- implicit cross-module behavior;
- framework machinery that makes dependency wiring difficult to trace.

Ambient infrastructure such as application-level context may be appropriate when it is genuinely global and idiomatic for the ecosystem.

The question is not whether every dependency is passed manually.

The question is:

> **Can a developer reasonably see what this code depends on and where those dependencies come from?**

---

## Prefer Understandable Data Flow

Important data and control flow should be easy to follow.

Prefer:

- direct flow;
- composition;
- explicit transformations;
- predictable ownership;
- few synchronization points.

Be suspicious of:

- bidirectional synchronization;
- distant side effects;
- hidden mutation;
- callback webs;
- event-driven indirection where direct flow would be clearer;
- multiple competing paths that can modify the same behavior.

Do not introduce indirection merely to satisfy an architectural pattern.

---

## Keep Shared Surfaces Small

Every shared API, exported abstraction, extension point, configuration option, global mechanism, or public contract creates something future code can depend upon.

Prefer small, narrow surfaces.

Shared modules should generally be few, stable, boring, and difficult to couple to accidentally.

Ask:

> Does this new shared surface need to become a contract today?

If not, keep the implementation local.

Be especially cautious when a PR turns local implementation details into shared infrastructure.

---

## Let Abstractions Earn Their Existence

Do not reward abstraction merely because it removes duplicate syntax or looks architecturally sophisticated.

An abstraction is valuable when it:

- hides meaningful complexity;
- reduces what callers need to understand;
- represents genuinely shared knowledge;
- isolates change that would otherwise affect many consumers.

Prefer concrete implementations first when the common shape is still uncertain.

Tolerate duplicated mechanics when the alternative would couple concepts that may evolve independently.

Ask:

> **If these implementations diverged tomorrow, would that be a bug?**

If no, duplication may be healthy.

If yes, the code may be duplicating knowledge that should have one authoritative representation.

Repeated syntax is usually cheap.

Repeated business decisions are not.

---

## Centralize Knowledge, Not Incidental Similarity

Business rules and invariants that multiple consumers must agree upon should normally have a clear authoritative source.

Examples include:

- whether an operation is allowed;
- state-transition rules;
- validation semantics;
- domain classifications;
- calculations whose meaning must remain consistent.

Do not force unrelated implementations into the same abstraction merely because their code currently looks similar.

Prefer sharing when the shared thing represents **knowledge**, not just coincidental structure.

A useful test is:

> If these copies diverged, would users observe inconsistent or incorrect behavior?

If yes, the knowledge probably should not be independently duplicated.

---

## Prefer Composition Over Configuration

Prefer assembling concrete pieces over creating generic configurable machinery.

Do not introduce:

- strategy systems;
- plugin architectures;
- extension registries;
- generic option matrices;
- callbacks for hypothetical use cases;

unless real variation already justifies them.

Known near-term variation may justify an extension seam.

Hypothetical future requirements do not.

Design for futures that are visible, not imaginary ones.

---

## Prefer Deleteable and Reversible Structure

Code is easier to evolve when features and mechanisms can be removed without dismantling unrelated infrastructure.

Ask:

- Could this feature still be removed reasonably cleanly?
- Did this PR entangle itself with shared infrastructure?
- Did it create a contract that will become difficult to retract?
- Did it introduce a decision that becomes expensive to reverse once other code depends upon it?

Favor reversible decisions when uncertainty is high.

---

## Respect the Ecosystem's Native Shape

Architecture should fit the language, framework, and existing codebase.

Do not impose a universal architectural template across ecosystems.

React code need not resemble C# code.

C# code need not resemble Python code.

Python code need not resemble React code.

Prefer the idiomatic mechanisms of the ecosystem unless there is a concrete reason to deviate.

For example, explicit dependencies may naturally appear as:

- function arguments;
- closures;
- React props;
- hooks;
- composition;
- context;
- constructor injection;

depending on the ecosystem.

Do not reward architectural consistency across languages when that consistency makes the code less natural, less direct, or harder for developers in that ecosystem to understand.

Ask:

> **Does this solution look like a natural solution in this language and framework, or does it look like an architectural style imported from somewhere else?**

---

## Boundaries Must Pay Rent

Do not create boundaries merely because layered architecture says one should exist.

A useful boundary should accomplish something concrete, such as:

- hide substantial complexity;
- reduce what callers need to know;
- isolate volatile implementation details;
- protect meaningful domain knowledge;
- reduce the blast radius of future change.

Be skeptical of layers that merely forward calls, mirror types, or duplicate interfaces without reducing cognitive load.

A narrow API hiding substantial complexity is valuable.

A chain of shallow abstractions that exposes the same complexity across more files is not.

---

## Prefer Deep Modules Over Shallow Ceremony

A good module may hide substantial implementation complexity behind a small, meaningful interface.

Judge a module by how much complexity it removes from its consumers.

Prefer:

```text
small interface
      ↓
substantial hidden capability
```

over:

```text
many layers
      ↓
many interfaces
      ↓
caller still understands everything
```

Do not introduce interfaces solely for hypothetical replaceability.

An interface, whether formal or implicit, should represent a meaningful contract or hide meaningful complexity.

The public surface of a module is itself an interface even when no language-level `interface` declaration exists.

Hide implementation details.

Do not hide important relationships.

---

## Watch the Trajectory

Do not judge only whether this single PR is tolerable.

Ask:

> **If five more features are implemented using this same pattern, what kind of system do we get?**

A small local compromise may be harmless.

A small new precedent may not be.

Pay particular attention to changes that establish patterns others are likely to copy:

- new shared infrastructure;
- new state ownership patterns;
- new dependency mechanisms;
- new abstraction styles;
- new cross-feature coupling;
- new extension mechanisms.

Architectural review should care more about harmful trajectories than isolated local ugliness.

---

## Architectural Findings

Raise an architectural finding only when the PR creates a meaningful long-term cost or establishes a direction that should not be repeated.

A finding should explain:

1. **What structural decision the PR introduces.**
2. **How that decision increases future change cost, coupling, hidden coordination, or cognitive load.**
3. **Why the issue matters beyond personal preference.**
4. **What architectural property should be preserved instead.**

Prefer concrete consequences.

For example:

> This PR introduces a second owner for retry eligibility in the UI. Future changes to retry rules would now require coordinating the domain logic and the component logic. Keep retry eligibility authoritative in one domain-level location and let the UI consume that decision.

Avoid findings such as:

- "This violates SOLID."
- "Consider adding an abstraction."
- "This isn't clean architecture."
- "This should use dependency injection."
- "This could be more reusable."
- "I prefer a service here."

Architectural vocabulary is not evidence.

Explain the future change cost.

---

## When to Block

Block the PR when the architectural issue is significant enough that allowing the implementation to become precedent would make future changes materially harder or less safe.

Examples include:

- introducing competing sources of truth;
- significant hidden coupling;
- broadly shared abstractions based on speculative reuse;
- duplicated authoritative business knowledge;
- unnecessary global state or coordination mechanisms;
- major new shared surfaces without demonstrated need;
- structural choices that make a feature difficult to change or remove independently;
- importing an architectural style that fights the ecosystem and materially increases complexity.

Do not block because the implementation is imperfect.

Do not demand architectural purity.

Local ugliness can be acceptable when it remains local and easy to replace.

The Architectural Gate protects the **direction of travel**, not aesthetic perfection.

If the implementation should be substantially redesigned, stop the review.

Do not proceed to the Correctness Gate.

---

## Passing the Architectural Gate

The gate passes when the implementation may not be perfect, but:

- its complexity remains appropriately local;
- important dependencies and ownership remain understandable;
- shared contracts are justified and narrow;
- authoritative knowledge is not unnecessarily duplicated;
- abstractions hide real complexity rather than add ceremony;
- the design fits the ecosystem;
- future changes remain reasonably isolated;
- no harmful precedent is being established.

If the gate passes, continue to the Correctness Gate.

Before passing, ask:

> **If someone copies the structural decisions in this PR five times over the next year, will the codebase become easier or harder to understand, change, and delete?**

If the answer is materially harder, identify why before proceeding.

---
