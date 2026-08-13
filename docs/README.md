# Docs map

The repo's claim set, procedures, and records — everything that keeps the plugin's assertions honest. Nothing in this directory ships with the plugin.

| Document | Job |
| --- | --- |
| [COVERAGE.md](COVERAGE.md) | Canonical claim set: delegation paths × enforcement layers, dated per cell, on a tabled set of platform dependencies |
| [REMEDIATION.md](REMEDIATION.md) | The drift procedure, its known limits, and the failure classes that shaped it |
| [ROADMAP.md](ROADMAP.md) | Deferred hardenings, each with the evidence trigger that would justify building it |
| [drift/](drift/) | One dated report per detected-drift cycle |
| [research/](research/) | Dated research records with per-claim confidence labels |

How they connect: `scripts/check-drift.js` detects → a scoping run writes `drift/` → claim changes edit COVERAGE.md and the skills in the same PR. The eval methodology these documents serve lives in [../evals/README.md](../evals/README.md); the machinery is deliberately at repo level, not in the installed plugin, so the shipped payload stays small and the evidence stays reviewable.

Where each kind of claim stands is tracked in the file that owns it: enforcement claims in COVERAGE.md's dated cells, skill-quality baselines in [../evals/](../evals/), component-necessity verdicts in [../evals/README.md](../evals/README.md)'s ablation status — an open question with the published base rate leaning no-effect ([research record](research/prior-art-and-eval-methodology-2026-08-09.md)), tracked in the [measurement map](https://github.com/TheRealBillSiegler/claude-plugins/issues/2).
