---
description: Verify the delegation gate end-to-end (contract tests + live Agent/Workflow canaries), install the rule file if missing, and finish cutover from legacy loose-file copies
---

Run the delegation-steering verification canary. Execute the steps in order; do not skip a step because an earlier one "probably" covers it.

1. **Rule file (probabilistic floor).** If `~/.claude/rules/delegation.md` does not exist, create it with exactly:

   ```markdown
   # Delegated-agent model rule

   Every delegated agent — Agent tool call or Workflow `agent()` call — gets an explicit `model` (and `effort` where supported) at the lowest tier sufficient for its task. Never inherit the session model silently; if inheritance genuinely is the lowest sufficient choice, write that model out explicitly. Tier ladder and rationale: the model-selection skill (delegation-steering plugin).
   ```

2. **Contract tests (offline).** Run `node "${CLAUDE_PLUGIN_ROOT}/evals/contract/run-contract-tests.js"`. All cases plus the `--test` self-check must pass.

3. **Live canary A — Agent path.** Issue one Agent tool call with a trivial prompt ("Reply with exactly: OK") and NO `model` parameter. Expected: the call is DENIED with a reason mentioning "no explicit model". If it runs instead, the gate is not firing — report and stop (do not proceed to cleanup).

4. **Live canary B — Workflow path.** Launch a minimal Workflow whose script contains exactly one `agent()` call with no `model` (trivial prompt, meta name `gate-canary`). Expected: the LAUNCH is denied with the offending call quoted. If it launches, stop the run immediately and report — the Workflow lint is not firing.

5. **Cutover cleanup (only if 2–4 all passed).** Legacy pre-plugin copies may exist. If present, remove: the `PreToolUse` entry in `~/.claude/settings.json` whose matcher is `Agent|Workflow` and whose command references `.claude/hooks/agent-model-gate.js`; the file `~/.claude/hooks/agent-model-gate.js`; the directories `~/.claude/skills/model-selection` and `~/.claude/skills/steering-claude-code`. Remove nothing else. If any legacy item is absent, note it and continue.

6. **Report.** State pass/fail per step, what was cleaned up, and — if any step failed after a Claude Code update — point at `docs/REMEDIATION.md` in this plugin for the drift procedure. If all passed, remind that "Last verified" dates live in the plugin repo (TheRealBillSiegler/claude-plugins) and should be updated there, not in the installed cache.
