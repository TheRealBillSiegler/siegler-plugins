# claude-plugins

Bill Siegler's Claude Code plugin marketplace (`siegler-plugins`). Private; plugins here encode personal engineering posture as enforceable configuration — probabilistic guidance backed by deterministic gates, with evals and doc-drift detection so Claude Code's release cadence can't silently rot them.

## Plugins

| Plugin | What it does |
|---|---|
| [delegation-steering](plugins/delegation-steering/) | Explicit model/effort tiering for every delegated agent: a decision-tree skill (`model-selection`), a steering-mechanism guide (`steering-claude-code`), a PreToolUse gate that denies model-less Agent calls and lints Workflow scripts at launch, plus evals and drift detection. |

## Install

Registered in `~/.claude/settings.json`:

```json
"extraKnownMarketplaces": {
  "siegler-plugins": { "source": { "source": "github", "repo": "TheRealBillSiegler/claude-plugins" } }
},
"enabledPlugins": { "delegation-steering@siegler-plugins": true }
```

The repo is private — the machine needs GitHub auth that can read it (`gh auth status`). After enabling, restart the session and run `/delegation-steering:canary` to verify enforcement end-to-end and complete any cutover from pre-plugin loose files.

## Freshness pipeline

Claude Code updates frequently; the claims these plugins rest on are anchored, not assumed:

1. **Anchored sources** — every skill claim cites its fidelity tier: article-only claims pin to dated quote digests in `references/`; mechanics cite specific `code.claude.com/docs` pages (docs win over articles); enforcement-boundary behavior is verified empirically with dated live tests.
2. **Deterministic detection** — `scripts/check-drift.js` hashes the anchored doc pages and records the Claude Code version against `scripts/anchors.json`; scheduled locally (weekly cron). Free; no agent runs unless something changed.
3. **Agentic remediation** — on drift, [REMEDIATION.md](plugins/delegation-steering/docs/REMEDIATION.md): scope the diff (exit early on noise), re-verify empirically (contract tests + live canary), edit at the right layer, ship via PR. Never auto-merged.
4. **Evals** — `evals/contract/` (offline hook contract), `/delegation-steering:canary` (live end-to-end), `evals/scenarios/` (skill application scenarios with recorded baselines).

## Development

- Branch → PR into `main`; no direct pushes. Conventional commits.
- Any change to hook lint semantics must keep `node hooks/agent-model-gate.js --test` passing and add a case for the failure class it fixes.
- Contract tests: `node plugins/delegation-steering/evals/contract/run-contract-tests.js`
- Refresh drift baseline (only as part of a reviewed PR): `node plugins/delegation-steering/scripts/check-drift.js --update`
