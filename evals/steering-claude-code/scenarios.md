# Steering-claude-code skill: application eval

Run each scenario against a fresh subagent given ONLY `skills/steering-claude-code/SKILL.md` ("Read the skill and answer from it alone"). Pass = the prescribed mechanism matches Expected. Baseline (2026-08-05): 7/7 at both tiers — run via aliases `haiku`/`sonnet`; resolved IDs inferred from that date's platform defaults as claude-haiku-4-5 and claude-sonnet-5, not captured at run time. Future baselines record full model IDs at run time.

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | All API handlers under `src/api/` must validate input with Zod | Path-scoped rule (`paths:` frontmatter) — branch 3 |
| 2 | Claude must NEVER push directly to main, no exceptions, even in long sessions | Hook or permission rule (static pattern → permission; needs context → hook) — branch 1 |
| 3 | 20-step monthly release checklist | Skill — branch 2 |
| 4 | Personal preference for terse commit messages, all projects | User-level file (`~/.claude/CLAUDE.md` / `~/.claude/rules/`) — branch 7 |
| 5 | Dependency audit producing hundreds of lines of intermediate output | Subagent — branch 8 |
| 6 | New teammate needs monorepo layout and build commands | Root CLAUDE.md — branch 5 |
| 7 | Guarantee every Workflow-spawned agent has an explicit model; why can't a per-spawn hook do it? | Lint script text at Workflow launch (PreToolUse on `Workflow`); per-spawn events aren't hookable and SubagentStart can't block — from the skill's building-enforcement guidance, not its decision tree |

Grading notes: the workflow-spawn scenario tests retrieval of the building-enforcement guidance, not just the decision tree. If a model at or below sonnet misses any scenario, the skill's guidance is insufficient — fix the skill, don't blame the model.
