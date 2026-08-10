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
