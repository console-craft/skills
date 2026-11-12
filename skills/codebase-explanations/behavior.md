# Behavior Template

Use Behavior when the user wants to understand what happens, why something happens, or the causal mechanism behind an observed behavior.

Typical questions include:

- "What happens when I click Save?"
- "Why does this request fire twice?"
- "What happens when token refresh fails?"
- "Why did this PR make the test suite dramatically slower?"
- "How does this state transition happen?"

Behavior explanations may be substantially more detailed than other explanation types.

System explanations optimize for compression and orientation.

Behavior explanations optimize for causal completeness.

When choosing between omitting a meaningful causal link and making the answer somewhat longer, keep the causal link.

The reader should finish the answer able to:

- understand the mechanism that produces the behavior;
- follow the meaningful causal or execution chain;
- distinguish established evidence from inference;
- understand important conditions that change or amplify the behavior.

The Behavior template always uses this order:

1. Answer
2. Diagram
3. Mechanism
4. Evidence
5. Conditions and variations, when needed

## Answer

Always include `## Answer`.

Give the conclusion immediately.

For straightforward behavior questions, briefly state what happens.

For "why" or diagnostic questions, state the cause as early and directly as the available evidence allows.

Do not make the reader follow the investigation before revealing the conclusion.

Usually use approximately 1–3 sentences, but allow slightly more when the behavior requires several closely related causes or an important environment distinction.

Example:

> The request fires twice because `filters` receives a new object identity on each render. That changes the effect dependency, so the effect runs again and starts a second request.

For a more complex diagnosis:

> The PR made each test perform an expensive setup operation that was previously shared. Local hardware absorbed much of the additional work, but limited CI resources and test concurrency amplified the cost enough to push the suite from roughly five minutes to more than thirty.

The Answer should establish the causal thesis that the rest of the response explains and supports.

## Diagram

Always include a diagram immediately after the Answer.

Choose the diagram according to the global Diagram Selection rules.

Behavior diagrams should normally visualize movement, causality, interaction order, or state transition.

Typical choices:

- Mermaid `sequenceDiagram` when multiple participants interact over time;
- ASCII or Mermaid flowchart for causal chains and branching behavior;
- Mermaid `stateDiagram` when one entity moves between meaningful states.

Example causal diagram:

```text
render
  ↓
new filters object
  ↓
dependency changed
  ↓
effect reruns
  ↓
second request
```

The diagram should expose the important causal shape before the detailed explanation begins.

Do not include every function call or implementation layer.

## Mechanism

Always include `## Mechanism`.

This is the primary section of a Behavior explanation.

Explain the meaningful execution or causal chain that produces the behavior.

Prefer a numbered list when the mechanism has an ordered path.

A typical explanation may use approximately 4–8 meaningful steps, but do not impose a hard maximum when additional steps are necessary to preserve the causal model.

Behavior is explicitly allowed to exceed normal brevity preferences when causal completeness requires it.

Each step may contain several short sentences when necessary to explain:

- what happens;
- why that step matters;
- how it causes or enables the next step;
- relevant environmental or runtime behavior;
- an important file or symbol involved.

Name important files and symbols inline where useful.

Example:

1. **`InvoiceForm.onSubmit()` starts the save path.**  
   It passes the validated form model into the save mutation.

2. **`useSaveInvoice()` converts UI state into the API request.**  
   The mutation owns the transition from local form data into the persisted representation.

3. **The request reaches the invoice endpoint.**  
   The backend validates and persists the update before returning the resulting invoice.

4. **The mutation invalidates the cached invoice query.**  
   Consumers observing that query therefore refetch the latest persisted state.

### Preserve meaningful causality

Include a step only when crossing it changes the reader's understanding of the behavior.

Collapse transparent forwarding layers.

Do not produce traces such as:

```text
button
→ React event
→ handler
→ hook
→ wrapper
→ mutation
→ HTTP utility
→ fetch
→ middleware
→ router
→ controller
→ service
→ repository
→ ORM
→ database
```

when the useful model is:

```text
Form → mutation → API endpoint → persistence → cache invalidation
```

Do not confuse runtime completeness with explanatory completeness.

### Code inside the mechanism

Short fenced code snippets may appear directly beneath a Mechanism step when the code is the clearest evidence for that specific causal link.

Normally use approximately 1–4 lines.

Example:

1. **A new `filters` object is created on each render.**

```ts
const filters = { status, owner }
```

2. **The effect treats that new identity as a changed dependency.**

```ts
useEffect(() => {
  loadItems(filters)
}, [filters])
```

Use snippets selectively.

Do not place a code block under every step merely for consistency.

A snippet should prove or clarify the mechanism, not decorate it.

## Evidence

Always include `## Evidence`.

Show the strongest evidence supporting the mechanism described above.

Evidence may include:

- actual source code;
- tests;
- logs;
- timings or measurements;
- profiler output;
- configuration;
- environment differences;
- PR or commit diffs;
- before/after runs;
- behavior after a revert;
- other directly observed repository or runtime facts.

Prefer measured or directly observable evidence over inference.

Use the smallest representation appropriate to the evidence.

For a simple behavior question, Evidence may be only one or two short code snippets.

For a detailed diagnosis or post-mortem, this section may be substantially larger.

A table may be useful when several observations need to be compared across the same dimensions.

Example:

| Observation | Evidence | Why it matters |
| --- | --- | --- |
| Local suite took ~5 minutes | Local test timing | Establishes the local baseline |
| CI exceeded 30 minutes | Pipeline timing | Shows environment-specific amplification |
| Regression began with the PR | Before/after CI runs | Narrows the triggering change |
| Revert restored prior timing | Post-revert CI run | Strongly supports the causal explanation |

Do not present speculation as evidence.

When part of the mechanism is inferred rather than directly established, say so clearly.

## Conditions and variations

Include `## Conditions and variations` only when circumstances materially alter the main mechanism.

Use this section for:

- alternate branches;
- success and failure paths;
- retries;
- preconditions;
- environmental differences;
- concurrency effects;
- amplifying or suppressing conditions;
- behavior that occurs only in specific states;
- other variations that would make the main explanation incomplete if omitted.

Examples:

For token refresh:

- **Refresh succeeds:** replace the token and retry the original request.
- **Refresh fails:** clear the session and return to authentication.
- **Concurrent failures:** requests may share the same refresh operation rather than starting several.

For a CI performance regression:

- Local hardware may hide much of the additional cost.
- Lower CI CPU or memory may amplify resource contention.
- Worker concurrency may make an expensive operation scale much worse in CI than locally.

Do not use this section as a generic collection of extra facts.

If the behavior has no meaningful branches or qualifying conditions, omit it.

## Diagnostic and post-mortem depth

Behavior also owns deeper explanatory questions such as regressions, incidents, performance failures, and technical post-mortems.

For these questions, investigate as deeply as necessary before answering.

Do not stop at the nearest observable trigger.

Distinguish between:

- the change or condition that initiated the behavior;
- the mechanism through which it produced the observed effect;
- conditions that amplified, suppressed, or altered that effect;
- evidence supporting each major causal link.

Do not require incident-specific headings such as "Root cause" or "Contributing factors".

Express those ideas through the normal Behavior grammar:

- `Answer` states the causal conclusion;
- `Mechanism` reconstructs the causal chain;
- `Evidence` supports it;
- `Conditions and variations` captures amplifiers, branches, and environmental differences.

## Information Selection

Behavior may use more detail than other templates, but detail must remain causally useful.

Do not reproduce the investigation diary.

Avoid:

- every function encountered while tracing execution;
- unrelated implementation details;
- speculative side theories unsupported by evidence;
- generic technical background;
- recommendations the user did not ask for;
- remediation plans unless they are required to explain existing behavior.

Behavior explains what happens and why.

If the user's primary question becomes what should be changed or which design would be better, use Decision or a separate planning workflow instead.

