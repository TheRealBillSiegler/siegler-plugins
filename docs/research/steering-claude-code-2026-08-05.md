# Reference digest: "Steering Claude Code: skills, hooks, rules, subagents, and more"

- **Canonical source:** <https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more> (Anthropic, claude.com blog)
- **Captured:** 2026-08-05 via two independent WebFetch extractions. Quotes marked **[x2]** appeared verbatim in both; unmarked quotes are single-extraction; **[APPROX]** marks lines whose wording differed between extractions. This is a quote-anchored digest, not a mirror — read the live article for full context.
- **Freshness:** Claude Code's steering surface changes with releases. Re-verify mechanics against <https://code.claude.com/docs> before relying on a claim for config that must not silently break.

## Article structure (section headings, in order)

The seven methods for delivering instructions · CLAUDE.md files · Rules · Skills · Subagents · Hooks · Output styles · Appending the system prompt · When to use each method · Getting started with Claude Code customization

## Core thesis

> "Each method trades context cost against authority." **[x2]**

> "A real guardrail needs to be deterministic, and the enforcement methods are hooks and permissions." **[x2]**

> "Claude will follow the instruction most of the time, but when under pressure, in a long session or an ambiguous situation, or due to a prompt injection in a file accessed as part of the task, the model can fail to follow a prompted rule."

## When to use each mechanism

- **Root CLAUDE.md:** "Build commands, directory layout, monorepo structure, coding conventions, and team norms all fit naturally here." **[x2 core phrase]** Loads at session start, persists. "Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code." **[x2 core]**
- **Subdirectory CLAUDE.md:** conventions specific to that subdirectory; "loads when Claude reads a file under that subdirectory, not at session start."
- **Rules (`.claude/rules/`):** "Specific constraints or conventions (e.g., all API handlers must validate input with Zod)" **[x2]**. Unscoped rules load at session start; path-scoped (`paths:` frontmatter) load only for matching files — "a rule scoped to `src/api/**` stays out of context during a docs-only session".
- **Skills:** "Instructions that are procedural, like deploy workflows, release checklists, or review processes, belong in a skill". Name + description load at session start; body loads on invocation.
- **Subagents:** "Use a subagent when a side task like deep search, a log analysis pass, or a dependency audit would clutter your main conversation". Isolated context; only the final message returns. Frontmatter: "name, description, plus optional fields for model and tool access" **[x2]**; "Subagents can nest up to five levels deep" **[x2]**.
- **Hooks:** "Use hooks for anything that should happen deterministically: running linters after edits, posting to Slack on completion, or blocking specific commands". **[APPROX]** "A `PreToolUse` hook can inspect a call and exit with code 2 to block it" (second extraction: "…inspect any tool call and exit code 2 to deny it"). Blocking hook stderr is saved to context so Claude knows why the call was denied.
- **Output styles:** "Significant role changes (code assistant to general assistant)" **[x2]**; "never get compacted, load at the start of every session"; carry the highest instruction-following weight — use judiciously.
- **Appending the system prompt:** "best for adding specific coding standards, output formatting, or domain-specific knowledge"; per-invocation, additive only.

## Anti-patterns

> "A 30-line procedure in CLAUDE.md. Procedures belong in skills." **[x2 core]**

> "An API-specific rule without paths. If a rule only applies to `src/api/**`, scoping it with `paths:` keeps it out of context"

> "When there's something that absolutely must not happen, an instruction is the wrong tool." **[APPROX]** (other extraction: "A 'Never do this' instruction is the wrong tool")

> "Writing personal preferences to a project-level CLAUDE.md file. All file-based methods have a user-level counterpart"
