# Run register: multi-agent methodology records

Any multi-agent run whose conclusions land in durable artifacts (commits, PRs, tickets, verdicts) records its methodology here — the run is not legitimate evidence without it. Reproducibility caveat, stated once: agent runs are stochastic; a record makes a run *re-executable and auditable* (same structure, prompts, tiers, adjudication rules), not bit-identical.

**Template per entry:** date; question; orchestration shape (phases, agent count); per-role model + effort; verification structure (adversarial gate, blinding, dedup rules); counts (raw → surviving findings, with kill reasons recorded where); limitations; where the conclusions landed.

---

## 2026-08-05 — Conformance assessment: skill + hook vs the two source articles

- **Question:** how well do the (pre-plugin) model-selection skill and agent-model-gate hook conform to the models-explained and steering-Claude-Code articles?
- **Shape:** 2 phases. Phase 1: four parallel finders — quote fidelity (sonnet, medium), coverage/omission (sonnet, high), steering-architecture fit (sonnet, high), hook-API check (claude-code-guide agent type, sonnet, medium). Phase 2: one adversarial gate (fable, high) instructed to refute each finding by re-fetching sources, merge duplicates, and re-rank.
- **Counts:** 38 raw findings → 10 surviving (1 high), 9+ explicitly killed with reasons.
- **Empirical augmentation:** 3 live gate tests (deny branch, allow branch, Workflow probe) ran before the fan-out and were given to all agents as ground truth.
- **Limitations:** WebFetch extraction is a small-model reconstruction (quotes were cross-verified across ≥2 independent fetches); single gate, no multi-vote; no blinding between finders and gate.
- **Landed in:** SKILL.md revisions, hook fixes, PR #1 body.

## 2026-08-05 — Multi-authority design review of the plugin artifacts

- **Question:** do SKILL.md, digest, hook, rule file, and wiring follow skill/plugin design best practices across all local authorities plus official blog guidance?
- **Shape:** 2 phases. Phase 1: four parallel streams — blog sweep (sonnet, medium), plugin-dev skill-reviewer agent type (sonnet), local-authorities audit across four best-practice sources (sonnet, high), mechanical quote/coherence fidelity (haiku, medium). Phase 2: adjudication gate (fable, high) verifying each finding against artifact text, ruling on authority conflicts explicitly.
- **Counts:** 30 raw findings → 6 accepted (1 high: the lint span-boundary bug, confirmed by hand-trace), 9 rejected with recorded reasons.
- **Limitations:** authority conflicts ruled by one gate, not a panel; the one correctness bug was found by review, not by any eval — recorded as a failure-class lesson in REMEDIATION.md.
- **Landed in:** the span-boundary fix + `--test` guard, context-tax reduction, coverage-gap docs, effort-token fix.

## 2026-08-05/06 — Scenario eval baselines

- **Protocol:** per [../evals/README.md](../evals/README.md) — fresh-context subagent, skill file only, weakest deployable tier first.
- **Runs:** steering-claude-code: 7 scenarios, haiku 7/7 and sonnet 7/7 (2026-08-05; two gaps found by the eval itself — `paths:` format, hook-vs-permission criterion — fixed same day). delegation-tiering: 12 scenarios, haiku 12/12 and sonnet 12/12 (2026-08-06).
- **Limitations:** single rep per tier (no variance estimate); grader = the map-driving session, not blinded.

## 2026-08-06 — Full verification sweep

- **Question:** verify everything not yet verified (user directive).
- **Shape:** mixed — deterministic inline tests (contract suite extension, drift corrupt/restore) + three agents (haiku eval, sonnet eval, sonnet nested-ledger probe, all explicit-tier) + the complete weekly pipeline executed under `powershell.exe` 5.1 against *real* upstream doc drift, whose scoping stage (headless session) spawned two sonnet page-verifiers and adjudicated noise-vs-claim-affecting itself.
- **Results:** nested gate + nested ledger verified live; contract suite grew to 10 cases; drift-detected exit path verified; real drift correctly triaged (one claim-affecting finding: definition-level `effort`); probe PASS; ledger summary correct; one encoding bug found and fixed from the run's own log.
- **Limitations:** hash-only anchors meant the scoping agent verified claims against live pages rather than diffing; n=1 on drift-pipeline value.
- **Landed in:** effort-frontmatter skill fix, anchors rebaseline, DRIFT-REPORT-2026-08-06.md, encoding fix, denial-counting instrumentation.
