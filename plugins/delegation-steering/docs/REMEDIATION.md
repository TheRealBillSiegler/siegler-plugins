# Drift remediation procedure

Follow this when `scripts/check-drift.js` exits 1 (doc-page or Claude Code version drift), or when `/delegation-steering:canary` fails after a Claude Code update. Detection is deterministic; everything below is judgment — run it as an agent session in the plugin repo, and land changes via PR, never by committing directly to `main`. Auto-merging changes to live enforcement config is prohibited: a misread doc diff must not be able to rewrite the guardrails unreviewed.

## Procedure

1. **Scope the drift first — exit early if it's noise.** For each page check-drift reports as changed, fetch it and diff against the claims the skills actually anchor to it (each SKILL.md's "Doc anchors" bullet names the page-to-claim mapping). Typo/format/unrelated-section changes → run `node scripts/check-drift.js --update`, commit the refreshed `anchors.json` with a one-line note, and stop. Do not touch skill prose for noise.

2. **If an anchored claim is affected**, re-verify the mechanic empirically before editing prose:
   - Run `node evals/contract/run-contract-tests.js` (offline contract).
   - Run `/delegation-steering:canary` in a live session (Agent deny, Workflow launch-lint deny).
   - If a canary fails, diagnose against the changed doc page: renamed tool (matcher dead), changed hook JSON contract, changed Workflow tool_input shape are the known failure classes.

3. **Edit at the right layer.** Hook behavior changes go in `hooks/agent-model-gate.js` (keep `--test` passing; extend it if the fix changes lint semantics). Claim changes go in the affected SKILL.md section AND its dated reference digest if the source moved. Update "Last verified" dates only for claims actually re-verified.

4. **Re-run everything**: contract tests, `--test`, canary, and the scenario evals (`evals/scenarios/*.md`) if skill prose changed.

5. **Ship**: branch → conventional commits → PR with a body stating which doc pages drifted, which claims were affected, and the verification evidence. Bump the plugin version in `.claude-plugin/plugin.json` (SemVer: message/prose = patch; lint semantics or new enforcement = minor). Include `node scripts/check-drift.js --update` output so `anchors.json` lands in the same PR.

6. **After merge**: update the installed plugin (marketplace pull), restart the session, run `/delegation-steering:canary` once more against the installed copy.

## Failure classes seen so far

- 2026-08-05: lint span-boundary desync (space-styled `agent (` masked a model-less neighbor) — caught by review, now guarded by `--test`. Lesson: any lint change needs a masking-direction test case.
