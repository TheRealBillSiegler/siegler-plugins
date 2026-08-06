# claude-plugins

A Claude Code plugin marketplace (`siegler-plugins`) by [Bill Siegler](https://github.com/TheRealBillSiegler). Plugins here turn engineering discipline into enforceable configuration: probabilistic guidance (skills, rules) backed by deterministic gates (hooks), with evals and doc-drift detection so Claude Code's release cadence can't silently rot the claims they rest on.

## Plugins

### [delegation-steering](plugins/delegation-steering/)

Explicit model/effort tiering for every delegated agent: a decision-tree skill (`model-selection`), a steering-mechanism guide (`steering-claude-code`), and a PreToolUse gate that denies model-less Agent calls and lints Workflow scripts at launch — plus evals and a freshness pipeline.

## Install

In Claude Code:

```
/plugin marketplace add TheRealBillSiegler/claude-plugins
/plugin install delegation-steering@siegler-plugins
```

Or directly in `~/.claude/settings.json`:

```json
"extraKnownMarketplaces": {
  "siegler-plugins": { "source": { "source": "github", "repo": "TheRealBillSiegler/claude-plugins" } }
},
"enabledPlugins": { "delegation-steering@siegler-plugins": true }
```

Then restart your session and run `/delegation-steering:canary` — it verifies the gate end-to-end (deny, allow, and lint branches), installs the always-loaded rule file, and cleans up any pre-plugin loose-file install if you had one.

**Requirements:** Node.js on `PATH` (the hook and scripts run via `node`); on Windows, Git for Windows (hooks declare `"shell": "bash"`).

## Using the skills

- `model-selection` triggers when Claude spawns or configures subagents and workflow fan-outs — it assigns each delegated agent the lowest sufficient model tier, and the hook makes the "explicit model, always" rule non-optional.
- `steering-claude-code` is a consultation skill: ask Claude "where should this behavior/constraint live?" (CLAUDE.md vs rules vs skills vs subagents vs hooks vs output styles) and it applies the decision tree. It also fires when Claude authors or refactors that configuration on your behalf. Its value shows up at configuration time, not during ordinary coding.

## Freshness pipeline

Claude Code updates frequently; these plugins anchor their claims instead of assuming them:

1. **Anchored sources** — every skill claim carries its fidelity tier: article-only claims pin to dated quote digests in `references/`; mechanics cite specific [code.claude.com/docs](https://code.claude.com/docs) pages (docs win over articles); enforcement-boundary behavior is verified empirically with dated live tests.
2. **Deterministic detection** — `scripts/check-drift.js` hashes the anchored doc pages and records the Claude Code version against `scripts/anchors.json`. Schedule it however you like (`weekly-drift-task.ps1` is a Windows Task Scheduler wrapper); no agent runs unless something changed.
3. **Agentic remediation** — on drift, [REMEDIATION.md](plugins/delegation-steering/docs/REMEDIATION.md): scope the diff (exit early on noise), re-verify empirically (contract tests + live canary), edit at the right layer, ship via PR. Never auto-merged.
4. **Evals** — `evals/contract/` (offline hook contract), `/delegation-steering:canary` (live end-to-end), `evals/scenarios/` (skill application scenarios with recorded baselines).

## Development

- Branch → PR into `main`; no direct pushes. Conventional commits.
- Contract tests: `node plugins/delegation-steering/evals/contract/run-contract-tests.js`
- Any change to hook lint semantics must keep `node plugins/delegation-steering/hooks/agent-model-gate.js --test` passing and add a case for the failure class it fixes.
- Refresh the drift baseline (`check-drift.js --update`) only as part of a reviewed PR.
