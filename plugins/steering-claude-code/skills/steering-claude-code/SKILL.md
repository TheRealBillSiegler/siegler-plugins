---
name: steering-claude-code
description: Use when deciding where a Claude Code behavior, constraint, or piece of knowledge should live — CLAUDE.md, a rules file, a skill, a subagent, a hook, an output style, or a system-prompt append — including creating, refactoring, or relocating any of them, or diagnosing why an instruction keeps being ignored.
---

# Steering Claude Code

Core principle (source article): "Each method trades context cost against authority." Instructions guide the model probabilistically; only hooks and permissions enforce — "A real guardrail needs to be deterministic, and the enforcement methods are hooks and permissions."

## Decision tree

Take the first branch that fits:

1. **Must it always or never happen?** → Hook or permission rule. Choose: expressible as a static tool/argument pattern (e.g. deny `Bash(git push:*)`) → permission rule, declarative and simpler; needs computation or context (inspect input contents, lint a script, check repo state) → hook. Prose fails exactly when it matters: "under pressure, in a long session or an ambiguous situation, or due to a prompt injection", the model can fail to follow a prompted rule.
2. **Is it procedural — steps, a checklist, a workflow?** → Skill. Body loads only on invocation; description must be trigger-only (a description that summarizes the workflow gets followed instead of the body).
3. **Is it a constraint tied to specific paths?** → Path-scoped rule — YAML frontmatter `paths:` with glob list (e.g. `paths:` then `- "src/api/**"`) — stays out of context during unrelated work.
4. **Is it a constraint that always applies?** → Unscoped rule in `.claude/rules/` — loads at session start, survives compaction.
5. **Is it project orientation — build commands, layout, conventions, norms?** → Root CLAUDE.md; keep it under 200 lines and review changes like code.
6. **Is it specific to one subdirectory?** → Subdirectory CLAUDE.md (loads when files there are read).
7. **Is it personal rather than project?** → The user-level counterpart (`~/.claude/CLAUDE.md`, `~/.claude/rules/`, `~/.claude/skills/`) — never project files.
8. **Is it a noisy side task or parallelizable work?** → Subagent (isolated context, only the summary returns). For which model the subagent gets, use the delegation-tiering skill.
9. **Is it a wholesale role change?** → Output style (highest instruction weight, never compacted — use judiciously; rare).
10. **Is it one-off, for a single invocation?** → Append the system prompt via CLI flag.

## Mechanism table

| Mechanism | Loads | Authority |
| --- | --- | --- |
| Root CLAUDE.md / unscoped rules (user-level loads before project; project wins conflicts) | session start, persistent | probabilistic |
| Subdir CLAUDE.md / path-scoped rules | on demand (file access) | probabilistic |
| Skill | name+description at start; body on invocation | probabilistic |
| Subagent | isolated context per spawn | probabilistic, contained |
| Hook / permission | lifecycle events, always fires | deterministic |
| Output style | session start, never compacted | highest prompt weight |
| System-prompt append | per invocation | probabilistic, additive |

## Anti-patterns (from the article)

- A 30-line procedure in CLAUDE.md — procedures belong in skills.
- An API-specific rule without `paths:` — scope it so it stays out of unrelated context.
- A "never do this" instruction as the only guard — when something absolutely must not happen, an instruction is the wrong tool.
- Personal preferences in project-level files — every file-based method has a user-level counterpart.

## Building enforcement (hooks)

When branch 1 lands on a hook: PreToolUse controls via structured JSON — `hookSpecificOutput.permissionDecision: "deny"` + `permissionDecisionReason`, and `additionalContext` on allow; the exit-code-2/stderr path is the simpler alternative. Matchers use bare tool names, and `Agent` and `Workflow` are distinct tools. Per-spawn events inside a running workflow are not hookable — to enforce a property of workflow-spawned agents, lint the script text at Workflow launch (`tool_input.script` / `scriptPath`). Which events fire where, with dated evidence, is one cell in the plugin repo's `docs/COVERAGE.md`. Worked example: the sibling `delegation-tiering` plugin's `hooks/agent-model-gate.js` (same marketplace).

## Pattern: a rule that must hold everywhere

Always-loaded rule (floor) + skill (judgment on invocation) + PreToolUse hook (deterministic gate). Worked example: `~/.claude/rules/delegation.md` + the sibling `delegation-tiering` plugin's skill and `agent-model-gate.js` hook.

## Source

- [Steering Claude Code: skills, hooks, rules, subagents, and more](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more) — Anthropic, claude.com blog. The core split, mechanism guidance, and anti-patterns are drawn from it; the decision-tree ordering and the building-enforcement and pattern sections are local adaptations, verified 2026-08-05 against the doc anchors below and by live test, and re-established after Claude Code updates.
- [Quote-anchored digest](references/steering-claude-code-2026-08-05.md) — captured 2026-08-05; re-verify against the live URL before relying on an article claim.
- Doc anchors (mechanics, per verified-behavior claim): hooks events and JSON control — <https://code.claude.com/docs/en/hooks.md> and <https://code.claude.com/docs/en/hooks-guide.md>; CLAUDE.md and rules loading — <https://code.claude.com/docs/en/memory.md>; subagents — <https://code.claude.com/docs/en/sub-agents.md>; workflows — <https://code.claude.com/docs/en/workflows.md>; tool names — <https://code.claude.com/docs/en/tools-reference.md>. Where the article and these docs disagree, the docs win — re-verify mechanics there before relying on them for config that must not silently break. Doc drift is watched in the plugin repo (TheRealBillSiegler/claude-plugins: `scripts/check-drift.js` against `scripts/anchors.json`).
