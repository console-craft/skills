# System Template

Use System when the user wants a mental model of how some part of the codebase works.

The reader should finish the answer able to:

- explain the subsystem back in their own words;
- understand its important pieces and relationships;
- mentally simulate its normal operation at an appropriate level;
- know where the important implementation lives.

The System template always uses this order:

1. Summary
2. Diagram
3. How it works
4. Key code
5. Important details, when needed

Do not add generic sections such as "Overview", "Conclusion", "Further reading", or "Recommendations".

Do not turn a System explanation into a design review.

## Summary

Always include `## Summary`.

Give the mental model immediately.

Use approximately 1–3 sentences.

State:

- what the system fundamentally does;
- its main organizing mechanism;
- the most important relationship or boundary when useful.

Do not begin with generic filler.

Bad:

> The authentication system consists of several interconnected components that work together to provide authentication functionality.

Better:

> Authentication uses short-lived access tokens plus refresh tokens. Frontend session state lives in `AuthProvider`, requests go through a shared API client, and backend middleware resolves authenticated users before protected handlers execute.

The Summary should be useful even if the reader stops there.

## Diagram

Always include a diagram immediately after the Summary.

Every System explanation is considered diagram-worthy, including very small systems.

Choose the diagram according to the global Diagram Selection rules.

For System explanations, normally prefer a topology-oriented diagram showing the important components and relationships.

A tiny ASCII diagram is sufficient for simple systems:

```text
AuthProvider ──→ API client
```

Use richer Mermaid diagrams only when the system's structure warrants them.

Do not make the diagram reproduce the entire `How it works` section.

The diagram should establish the visual mental model that the following explanation expands.

## How it works

Always include `## How it works`.

Explain the conceptual operating model.

Prefer approximately 3–5 items.

Use a numbered list when there is meaningful:

- sequence;
- lifecycle;
- precedence;
- causality;
- ordered flow.

Use short bullets instead when the system is better understood as parallel responsibilities, rules, conventions, or cooperating pieces.

Describe conceptual behavior, not every function call.

Example:

1. Login sends credentials to the authentication endpoint.
2. The backend validates them and issues access and refresh tokens.
3. The shared API client attaches the access token to protected requests.
4. Backend middleware validates the token and establishes the current user.
5. Expired access tokens enter the refresh flow before the original request is retried.

Do not place routine code snippets under these items.

Keep this section visually easy to scan.

## Key code

Always include `## Key code`.

Use code anchors to ground the explanation in the actual implementation.

Target approximately 5 anchors.

Prefer 4–5 when the subsystem naturally has that many important landmarks.

Use fewer when the subsystem is genuinely smaller.

Exceed 5 only when omitting another anchor would leave a materially important part of the mental model ungrounded.

An anchor may be:

- a file;
- function;
- class;
- hook;
- component;
- route;
- middleware;
- configuration entry;
- another concrete symbol or location.

Choose anchors that materially define the system.

Do not list every file that participates.

Each anchor should contain:

1. the path or symbol;
2. one short sentence explaining its role;
3. one small fenced snippet from the actual code.

Example:

**`src/auth/AuthProvider.tsx`**  
Owns frontend session state.

```ts
const [session, setSession] = useState<Session | null>(null)
```

**`src/api/client.ts`**  
Attaches the current access token to API requests.

```ts
headers.set("Authorization", `Bearer ${session.accessToken}`)
```

### Code snippet rules

Snippets are evidence, not miniature tutorials.

Normally use approximately 1–4 lines.

Select the smallest actual code fragment that demonstrates why the anchor matters.

Prefer:

- signatures;
- representative calls;
- important expressions;
- key configuration;
- central branches.

Remove irrelevant surrounding boilerplate.

Do not reconstruct code that does not exist.

Do not use pseudocode in place of actual repository code unless explicitly labeled and genuinely necessary.

Do not explain syntax that is already obvious from the snippet.

If no useful short snippet exists for an anchor, show the smallest relevant declaration or call site instead of manufacturing one.

## Important details

Include `## Important details` only when necessary.

This section contains facts that materially qualify the mental model established above.

Good candidates include:

- non-obvious constraints;
- exceptions;
- legacy paths;
- bypasses;
- surprising ownership boundaries;
- important differences from the apparent architecture;
- special behavior that would make the simplified model misleading if omitted.

Keep it short.

Do not use this section as a dumping ground for miscellaneous facts discovered during investigation.

If there are no important qualifications, omit the section entirely.

## Information Selection

The answer should not reproduce the investigation process.

Do not confuse:

> information required to discover the answer

with:

> information required by the user to understand the answer.

Inspect as much code as necessary.

Return only the information needed to reconstruct the useful mental model.

Do not include:

- exhaustive file inventories;
- every call in the execution chain;
- investigation diaries;
- generic background knowledge the user did not ask for;
- speculative improvements;
- repetitive conclusions.

Prefer high information density with low reading burden.

---

