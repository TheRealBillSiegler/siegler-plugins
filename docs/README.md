# Docs map

The repo's claim set, procedures, and records — everything that keeps the plugin's assertions honest. Nothing in this directory ships with the plugin.

| Document | Role |
| --- | --- |
| [COVERAGE.md](COVERAGE.md) | The canonical claim set: every delegation path × enforcement layer, with per-cell verification dates, plus the load-bearing platform dependencies table (each assumption tied to its Anthropic doc basis or marked docs-silent) |
| [METHODS.md](METHODS.md) | Methods records: one dated entry per multi-agent run whose conclusions landed in this repo — shape, per-role model + effort, adjudication, counts, limitations. No record, no legitimacy |
| [REMEDIATION.md](REMEDIATION.md) | The drift procedure (scope → re-verify empirically → PR, never auto-merge), the known preservation-only blindness and its compensating control, deferred hardenings with their evidence triggers, and the failure-class ledger |
| [drift/](drift/) | One dated report per detected-drift cycle: what changed, noise vs claim-affecting verdict per page, method and limitations of the scoping run |
| [research/](research/) | Dated research records with per-claim confidence labels — quote-anchored findings that ground design decisions (isolation mechanisms, prior art, methodology precedents) |

How they connect: `scripts/check-drift.js` detects → a scoping run writes `drift/` → claim changes edit COVERAGE.md and the skills in the same PR → the run that did it gets a methods record in METHODS.md. The eval methodology these documents serve lives in [../evals/README.md](../evals/README.md).

## Current status

Every claim is verified or explicitly marked pending:

| Claim | Status | Evidence |
| --- | --- | --- |
| Gate denies model-less Agent calls, lints Workflow scripts | Live-tested on all gate branches (deny, allow, launch-lint, nested spawns) | [Coverage matrix](COVERAGE.md) — re-run yourself with `/delegation-steering:canary` |
| Hook contract suite | 10/10 | `node evals/contract/run-contract-tests.js` |
| Skills route to the right tier | 12/12 and 7/7 dated baselines at the weakest served tiers — smoke-test grade until the mechanized re-baseline | [Eval methodology](../evals/README.md) |
| Drift pipeline catches claim-affecting upstream doc changes | One real catch (2026-08-06); re-checked weekly by a local task (no CI), triaged by hand — never auto-merged | [Drift reports](drift/) — [triage rules](REMEDIATION.md) |
| Each component is necessary | Open question, pre-registered — the published base rate for steering artifacts leans no-effect | [Research record](research/prior-art-and-eval-methodology-2026-08-09.md) — [measurement map](https://github.com/TheRealBillSiegler/claude-plugins/issues/2) |

The machinery behind this table — contract tests and fixtures, scenario evals, the coverage matrix, drift detection, methods records — lives at repo level, deliberately not in the installed plugin. Its job is to stamp each component load-bearing, ceremony, or harmful. The repo is deliberately both a small plugin and a working example of evidence-first plugin maintenance.
