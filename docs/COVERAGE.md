# Enforcement coverage matrix

Every delegation path crossed with every layer. This file is the canonical claim set for what the plugin enforces where — the coverage map diagram in the README visualizes flow; this matrix tracks completeness and freshness. When a cell's behavior is re-verified (canary, probe, or drift remediation), update its date; when Claude Code changes a cell's truth, this file changes in the same PR as the fix. Every cell's truth rests on the platform dependencies tabled at the bottom, each tied to its Anthropic doc basis or explicitly marked docs-silent.

| Delegation path | Gate (deterministic) | Rule (probabilistic) | Ledger (observability) | Last verified |
| --- | --- | --- | --- | --- |
| Agent tool call | deny without `model`; tiering reminder with one | always loaded | full entry (model, agent type, description) | 2026-08-09, live, plugin-only registration ([record](METHODS.md#2026-08-09--plugin-only-canary-re-verification)) |
| Nested Agent call inside a subagent | same as Agent tool call — hooks fire for subagent tool calls | always loaded | full entry — verified live | 2026-08-06, live (gate and ledger) |
| Workflow launch, inline script | launch-time lint; heuristic — bypassable by the literal marker `model-gate:allow` in the script text | always loaded | models extracted from script text | 2026-08-09, live, plugin-only, deny path ([record](METHODS.md#2026-08-09--plugin-only-canary-re-verification)); ledger extract 2026-08-05 |
| Workflow launch, `scriptPath` | lint if readable; **silent allow if unreadable** | always loaded | models extracted if readable | 2026-08-05, contract test |
| Workflow launch, predefined name | **none** — reminder only (no script text to lint) | always loaded | name only, no models | 2026-08-05, contract test |
| `agent()` spawns inside a running workflow | **none** — not hookable (PreToolUse never fires; SubagentStart can't block) | always loaded | covered only via launch lint | 2026-08-05, live |
| Headless `claude -p` from Bash | **none** | always loaded (wording broadened 2026-08-06 to cover spawned workers) | **none** | 2026-08-06, analysis |

The skill layer (judgment, on invocation) applies to all paths equally and is validated by the scenario evals, not per-path — so it is not a column here.

Reading the gaps: bold cells are the accepted holes, each documented in the skill's Enforcement section with its mitigation. The last row is covered by no layer at all — manual discipline, flagged in the skill. If any bold cell becomes closable (e.g. a future hook event reaches workflow-internal spawns), close it and record the evidence here.

## Load-bearing platform dependencies

Every assumption the matrix rests on, tied back to the Anthropic documentation that states it — or marked **docs silent** where no doc states it and the claim is empirical. All cited pages are hashed by `scripts/check-drift.js` (`scripts/anchors.json`), so a change to any doc basis surfaces in the weekly drift check. The docs-silent rows are the plugin's empirical perimeter: they are re-established by dated live tests, never assumed across Claude Code updates.

| # | Assumption | Anthropic doc basis | Watched by |
| --- | --- | --- | --- |
| A1 | PreToolUse hooks can deny via `hookSpecificOutput.permissionDecision` + reason | <https://code.claude.com/docs/en/hooks.md>, <https://code.claude.com/docs/en/hooks-guide.md> | canary + weekly probe (deny assertions) |
| A2 | Matchers match the bare tool names `Agent` and `Workflow` | <https://code.claude.com/docs/en/hooks.md>, <https://code.claude.com/docs/en/tools-reference.md> | weekly probe — a matcher break silences denials → FAIL |
| A3 | Agent-tool calls surface `model` in `tool_input` | <https://code.claude.com/docs/en/hooks.md> (PreToolUse input, Agent section — citation corrected 2026-08-09; the schema lives there, not in tools-reference.md); regressed upstream once (anthropics/claude-code#31027) | canary allow path + probe deny path; a schema regression would spike ledger denials |
| A4 | Workflow launches surface `script`/`scriptPath` in `tool_input` | **docs silent** — empirical; contract-tested and live-tested 2026-08-05. Citation corrected 2026-08-09: no doc page names these fields (previously mis-cited to tools-reference.md/workflows.md) | weekly probe (GATE-WORKFLOW assertion) |
| A5 | PostToolUse fires for Agent/Workflow calls | <https://code.claude.com/docs/en/hooks.md> | weekly ledger mix summary — zero entries is a visible failure |
| A6 | `~/.claude/rules/*.md` load at session start and persist | <https://code.claude.com/docs/en/memory.md> | drift anchor only — probabilistic layer, no behavioral assertion |
| A7 | Hooks fire for tool calls made *inside* subagents | <https://code.claude.com/docs/en/hooks.md> ("When a subagent calls a tool, tool events such as `PreToolUse` and `PostToolUse` fire the same configured hooks as in the main conversation"). Correction 2026-08-09: originally recorded docs-silent — wrong; the statement predates our 2026-08-06 live test (Wayback snapshot 2026-08-04) and our verification missed it | drift anchor on hooks.md; live test 2026-08-06 confirms behavior matches; candidate probe extension still open |
| A8 | PreToolUse does **not** fire for `agent()` spawns inside a running workflow — the gap the launch lint exists for | **docs silent** — empirical, live-tested 2026-08-05 | monthly changelog review; if a future hook event closes it, close the matrix cell above |
