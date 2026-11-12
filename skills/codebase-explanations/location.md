# Location Template

Use Location when the user's primary goal is to find where something lives, where it is owned, or where they should start making a particular change.

The reader should finish the answer able to:

- identify the primary implementation or ownership location;
- recognize the small repository neighborhood around it;
- know which nearby files or symbols matter;
- understand how those locations relate when that relationship is necessary for navigation.

The Location template always uses this order:

1. Location
2. Repository map
3. Key locations
4. How it connects, when needed

Keep Location answers deliberately smaller than System explanations.

Do not expand into a general explanation of how the subsystem works merely because the relevant code was discovered.

## Location

Always include `## Location`.

Answer the location question immediately.

Use approximately 1–2 sentences.

Identify:

- the primary directory, file, or symbol;
- the main owner or entry point when useful.

Example:

> The CSV export feature primarily lives under `src/features/export/`. Its main orchestration entry point is `useCsvExport()` in `hooks/useCsvExport.ts`.

For questions asking where to make a change, answer in action-oriented language:

> To change token refresh behavior, start in `src/api/client.ts`. `refreshAccessToken()` owns the retry flow; `AuthProvider` only supplies session state.

If the concept has no single primary location, say so explicitly rather than inventing one.

## Repository map

Always include a diagram immediately after the Location section.

Choose the representation according to the global Diagram Selection rules.

For Location answers, normally prefer a selective ASCII repository tree.

Example:

```text id="p7f2la"
src/
├── features/
│   └── reconciliation/
│       ├── api/
│       ├── hooks/
│       └── components/
└── shared/
    └── ledger/
```

For a very small location, the diagram may be correspondingly small:

```text id="7o5rnq"
src/
└── auth/
    └── middleware.ts   ← main implementation
```

When the relevant code spans several repository areas and their relationship matters more than their directory hierarchy, use a small ownership or dependency graph instead:

```text id="ow0gmv"
features/reconciliation
        │
        ├──→ api/payments
        └──→ shared/ledger
```

The map is selective, not an exhaustive directory listing.

Show only enough surrounding structure to establish orientation.

Do not include large unrelated portions of the repository.

## Key locations

Always include `## Key locations`.

Target approximately 3–5 anchors.

An anchor may be:

- a directory;
- file;
- function;
- class;
- hook;
- component;
- route;
- configuration entry;
- another concrete symbol or repository location.

For each anchor, give the path or symbol and one short sentence describing why it matters.

Example:

- **`src/features/reconciliation/`** — owns the feature.
- **`hooks/useReconciliation.ts`** — main frontend orchestration.
- **`api/reconciliation.ts`** — API boundary for the feature.
- **`components/ReconciliationPage.tsx`** — main user-facing entry point.
- **`shared/ledger/`** — shared ledger functionality consumed by reconciliation.

Prefer locations that help the reader navigate or modify the feature.

Do not list every file that happens to participate.

Do not include routine code snippets under these anchors. The path and ownership role are the evidence in a Location answer.

Use fewer anchors when the answer is genuinely small.

Exceed 5 only when another location is necessary to avoid giving a materially incomplete or misleading repository map.

## How it connects

Include `## How it connects` only when the relationship between the locations materially helps the reader understand ownership or navigate the codebase.

Keep it short.

Example:

> `AuthProvider` owns frontend session state, but authentication enforcement lives in backend middleware. The shared API client connects the two by attaching credentials to outgoing requests.

This section is especially useful when:

- responsibility is split across several directories;
- the apparent location is not the actual owner;
- one location is only an entry point into another;
- frontend and backend ownership differ;
- shared infrastructure participates in a feature owned elsewhere.

Omit this section when the paths and roles are already self-explanatory.

## Scope Control

Location answers are maps, not subsystem tutorials.

Do not explain implementation behavior unless a small amount of context is necessary to establish ownership or distinguish between nearby locations.

Do not include:

- a general architecture walkthrough;
- detailed runtime flows;
- exhaustive file inventories;
- code snippets merely to prove that a file exists;
- historical background;
- design recommendations;
- unrelated neighboring code.

If the user wants to understand how the located system works, that is a System request.

If the user wants to understand what happens through the located code at runtime, that is a Behavior request.

Prefer the smallest repository map that leaves the reader confidently oriented.

