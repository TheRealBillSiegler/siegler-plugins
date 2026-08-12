---
description: Verify the delegation gate end-to-end in a live session (Agent and Workflow deny paths) and install the always-loaded rule file if missing
---

# Delegation gate canary

Run the delegation-tiering verification canary. Execute the steps in order; do not skip a step because an earlier one "probably" covers it.

1. **Rule file — the probabilistic layer** (holds only if the model follows it, unlike the deterministic hook verified in steps 2–3). If `~/.claude/rules/delegation.md` does not exist, create it with exactly:

   ```markdown
   # Delegated-agent model rule

   Every delegated agent — an Agent tool call, a Workflow `agent()` call, or any other worker this session spawns (nested subagents, headless `claude -p` children, scheduled runs) — gets an explicit `model` (and `effort` where supported) at the lowest tier sufficient for its task. Never inherit the session model silently; if inheritance genuinely is the lowest sufficient choice, write that model out explicitly. Tier ladder and rationale: the delegation-tiering skill (delegation-tiering plugin).
   ```

2. **Live canary A — Agent path.** Issue one Agent tool call with a trivial prompt ("Reply with exactly: OK") and NO `model` parameter. Expected: the call is DENIED with a reason mentioning "no explicit model". If it runs instead, the gate is not firing — report and stop.

3. **Live canary B — Workflow path.** Launch a minimal Workflow whose script contains exactly one `agent()` call with no `model` (trivial prompt, meta name `gate-canary`). Expected: the LAUNCH is denied with the offending call quoted. If it launches, stop the run immediately and report — the Workflow lint is not firing.

4. **Report.** State pass/fail per step. If any step failed after a Claude Code update, point at the drift procedure in the plugin repo: `docs/REMEDIATION.md` in [TheRealBillSiegler/claude-plugins](https://github.com/TheRealBillSiegler/claude-plugins). If all passed, remind that "Last verified" dates live in that repo (the skill's Enforcement section and the cells of `docs/COVERAGE.md`) and should be updated there, not in the installed cache.
