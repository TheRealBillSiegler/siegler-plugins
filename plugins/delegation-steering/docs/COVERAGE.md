# Enforcement coverage matrix

Every delegation path crossed with every layer. This file is the canonical claim set for what the plugin enforces where — the coverage map diagram in the README visualizes flow; this matrix tracks completeness and freshness. When a cell's behavior is re-verified (canary, probe, or drift remediation), update its date; when Claude Code changes a cell's truth, this file changes in the same PR as the fix.

| Delegation path | Gate (deterministic) | Rule (probabilistic) | Ledger (observability) | Last verified |
| --- | --- | --- | --- | --- |
| Agent tool call | deny without `model`; tiering reminder with one | always loaded | full entry (model, agent type, description) | 2026-08-05, live |
| Nested Agent call inside a subagent | same as Agent tool call — hooks fire for subagent tool calls | always loaded | expected (doc-attested), unverified live | 2026-08-06, live (gate); ledger unverified |
| Workflow launch, inline script | launch-time lint; heuristic (`model-gate:allow` escape) | always loaded | models extracted from script text | 2026-08-05, live |
| Workflow launch, `scriptPath` | lint if readable; **silent allow if unreadable** | always loaded | models extracted if readable | 2026-08-05, contract test |
| Workflow launch, predefined name | **none** — reminder only (no script text to lint) | always loaded | name only, no models | 2026-08-05, contract test |
| `agent()` spawns inside a running workflow | **none** — not hookable (PreToolUse never fires; SubagentStart can't block) | always loaded | covered only via launch lint | 2026-08-05, live |
| Headless `claude -p` from Bash | **none** | always loaded (wording broadened 2026-08-06 to cover spawned workers) | **none** | 2026-08-06, analysis |

The skill layer (judgment, on invocation) applies to all paths equally and is validated by the scenario evals, not per-path — so it is not a column here.

Reading the gaps: bold cells are the accepted holes, each documented in the skill's Enforcement section with its mitigation. The last row is covered by no layer at all — manual discipline, flagged in the skill. If any bold cell becomes closable (e.g. a future hook event reaches workflow-internal spawns), close it and record the evidence here.
