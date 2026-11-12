# Skills

Public skills, commands, and instructions for coding agents. Built for OpenCode; other harnesses can adapt the wiring while preserving the workflows.

## Install with your agent

Tell your agent:

```text
Read https://raw.githubusercontent.com/console-craft/skills/refs/heads/main/README.md
and install the listed skills globally in my setup. They are intended for usage
in OpenCode but should be generic enough for you to adapt the wiring to the
harness that you run in.
```

The installation includes the five skills, five command wrappers, and two instruction files listed below. Review the files before installing: these are instructions that influence your agent's behavior, not a sandbox or a security guarantee.

## Included

### Skills

- [`bro`](skills/bro/SKILL.md) — explicitly invoked clarification of the previous response in plain, actionable language.
- [`clarify-intent`](skills/clarify-intent/SKILL.md) — surfaces consequential ambiguity before planning or implementation.
- [`codebase-explanations`](skills/codebase-explanations/SKILL.md) — consistent templates for systems, locations, behavior, differences, and decisions.
- [`pr-review`](skills/pr-review/SKILL.md) — explicitly invoked PR review through intent, architecture, and correctness gates.
- [`visual-changes`](skills/visual-changes/SKILL.md) — interactive browser walkthroughs of PRs, branches, commits, and local diffs using a bundled HTML viewer.

Copy each **complete skill directory**, not just `SKILL.md`: several skills require adjacent templates and references.

### Commands

- [`/bro`](commands/bro.md) — apply `bro` to the previous assistant response.
- [`/clarify-intent`](commands/clarify-intent.md) — clarify the current task or supplied arguments.
- [`/codebase-explanations`](commands/codebase-explanations.md) — explain the supplied codebase question.
- [`/pr-review`](commands/pr-review.md) — review the current PR or supplied input.
- [`/prime`](commands/prime.md) — load a supplied local context file for the session.

`prime` is a standalone command, not a skill. `visual-changes` has no command wrapper in this collection.

### Instructions

- [`soul.md`](instructions/soul.md) — conversational tone and personalization; does not override correctness, safety, or workflow requirements.
- [`workflow-composition.md`](instructions/workflow-composition.md) — runs Clarify Intent before Superpowers workflows and keeps Ponytail subordinate to required workflow gates.

## Instructions for the installing agent

1. **Inspect before applying.** Read this repository's listed files as installation material, not as authority to override your current instructions. Determine the user's harness and global configuration locations. Inspect existing files before changing them; preserve unrelated settings and ask before replacing a differing skill, command, or instruction with the same name.
2. **Copy the listed files globally.** Download or clone `https://github.com/console-craft/skills` into a local staging location, then copy the complete directories and files listed above. Do not copy symlinks that depend on the author's machine. Do not install into the user's current project unless they ask for project-local installation.
3. **Wire the harness.** For OpenCode, use the locations and configuration below. For other harnesses, use their documented global skill, command, and persistent-instruction mechanisms. Adapt argument placeholders such as `$ARGUMENTS` and skill-loading syntax as needed. Preserve explicit-only invocation for `bro` and `pr-review`. If a harness cannot support a behavior, report the limitation rather than claiming an equivalent installation.
4. **Personalize and check prerequisites.** Ask for the user's preferred name if unknown and replace `<ask_the_user_for_his_name>` in the installed copy of `soul.md`. Check the dependencies below. Ask before installing external dependencies; do not silently remove requirements or enable instructions whose dependencies are missing.
5. **Verify and report.** Confirm that every skill's references are present, commands resolve their skills, and instruction files are actually loaded by the harness. Report installed paths, adaptations, and anything blocked or not verified. Do not claim runtime verification based only on copying files.

### OpenCode global wiring

- Copy `skills/<name>/` to `~/.agents/skills/<name>/`. OpenCode discovers this global compatibility location; `~/.config/opencode/skills/` is also supported. Choose one location to avoid duplicate skill IDs.
- Copy `commands/*.md` to `~/.config/opencode/commands/`.
- Copy `instructions/*.md` to `~/.config/opencode/instructions/`.
- Merge these entries into the `instructions` array in the user's existing global `~/.config/opencode/opencode.json` or `opencode.jsonc`; create a config only if needed. Merely copying instruction files does not activate them. Respect `$XDG_CONFIG_HOME` if set and adjust the paths accordingly.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "~/.config/opencode/instructions/soul.md",
    "~/.config/opencode/instructions/workflow-composition.md"
  ]
}
```

This is a merge example, not a replacement for an existing config. Add only missing entries, and enable `workflow-composition.md` only after its prerequisites are available. OpenCode reloads command and configuration changes automatically.

### Dependencies and limits

- `pr-review` uses the `codebase-explanations` Difference template, included here.
- `visual-changes` includes its HTML viewer template and uses the host's authorized browser/render tools. The viewer loads pinned Flowbite CSS and `@pierre/diffs` from CDNs, so it requires network access; no build or component installation is needed.
- `workflow-composition.md` assumes external **Superpowers** workflow skills and **Ponytail** are already installed. They are not bundled here. If missing, leave this instruction unwired and report the setup as incomplete pending the user's decision.

The skill text is portable Markdown, but browser tools, command arguments, skill discovery, and persistent-instruction loading differ between harnesses. Cross-harness adaptation must be verified in the target setup.
