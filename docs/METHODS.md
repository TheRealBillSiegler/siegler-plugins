# Methods records

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
- **Limitations:** single rep per tier (no variance estimate); grader = the same session that orchestrated the eval, not an independent blinded rater — an unblinded LLM comparison against the scenario files' Expected column, i.e. weak-signal by this repo's own grading standards (the endpoint is categorical, so the fix is mechanical extraction, not a better judge); models recorded as aliases at run time — resolved IDs inferred afterward (2026-08-09) from run-date platform defaults as claude-haiku-4-5 and claude-sonnet-5, an inference, not a capture. Later records stamp full model IDs.

## 2026-08-09 — Instrument-detection critique import

- **Question:** does the parallel "Improve instrument detection of false claims" session (a critique workflow over the A7/A3/A4 citation incident, run in another project) bear on current work?
- **Shape:** 1 transcript-investigation agent (general-purpose type, sonnet) over that session's file and workflow record; the source run itself was 3 parallel critics (opus, sonnet, sonnet — high effort) plus an adversarial gate (fable, high), recorded in that workflow's own output.
- **Findings imported:** a fourth defect-class pillar for the calibration ticket (false doc-basis attribution, with a hard spec for planted units), an A8-class placebo requirement, an adjudication guard on refutations, and an attribution correction — the review question caught A7 only; routine unblinded scoping caught A3/A4; fresh-context blinding has no demonstrated catch in this repo.
- **Limitations:** the investigator read the source session selectively (tail-weighted); the source run's verdicts were analytical and were not independently re-executed here.
- **Landed in:** issue #13 (defect-class addition section).

## 2026-08-09 — Cryptic-wording sweep (pre-public readability)

- **Question:** which passages in the fifteen public-facing files stall a cold reader — undefined coined terms, compressed grammar, insider references, or sentences depending on conversation context the repo does not contain?
- **Shape:** 1 workflow, 7 parallel readers (general-purpose type, sonnet, effort medium), one per file group, precision-biased rubric (false flag costs more than a miss).
- **Counts:** 22 raw findings → 18 accepted and rewritten, 4 rejected. All four rejections flagged the model name `fable` as undefined or unreal — a reviewer knowledge-cutoff artifact (two proposed rewrites mis-described a released model as an "alias" or "codename"); one defensive gloss was added at the skill ladder's first use anyway.
- **Limitations:** single reader per file group; acceptance adjudicated unblinded by the authoring session.
- **Landed in:** the cryptic-wording commit across 11 files.

## 2026-08-09 — Prior-art and eval-methodology research

- **Question:** (1) prior art for this plugin's components; (2) empirical (non-judge-only) assessment of model selection and steering config in the literature; (3) what the strongest primary sources prescribe for eval methodology.
- **Shape:** 4 read-only web-research agents (general-purpose type, sonnet, session effort), 3 launched in parallel (prior-art sweep; empirical/routing literature; Pocock primary sources) + 1 supplemental (definitive methodology sources, replacing tweet-grade citations where stronger sources exist).
- **Verification structure:** no adversarial gate — instead per-claim confidence labels preserved end-to-end (agents instructed to label anything not read from a primary source UNVERIFIED); orchestrator independently re-verified two load-bearing claims live (Zheng et al. reference-guided 70%→15% figure re-fetched from paper text; hooks.md subagent statement checked against a Wayback snapshot).
- **Counts:** not gated, so no raw→surviving figure; 8 items remain explicitly UNVERIFIED and are listed as such in the record.
- **Limitations:** one agent per axis (no cross-agent replication); WebFetch summarization is unreliable for PDFs (all PDF-derived quotes flagged); two tweets retrieved via a mirror API after x.com blocked direct fetch (provenance disclosed in the record); awesome-list sweeps were title-level, not line-by-line — the prior-art sweep is non-exhaustive by construction.
- **Landed in:** [research/prior-art-and-eval-methodology-2026-08-09.md](research/prior-art-and-eval-methodology-2026-08-09.md), the ablation-protocol precedent citations in [../evals/README.md](../evals/README.md), and the sunset criterion in the plugin README.

## 2026-08-06 — Full verification sweep

- **Question:** verify everything not yet verified (user directive).
- **Shape:** mixed — deterministic inline tests (contract suite extension, drift corrupt/restore) + three agents (haiku eval, sonnet eval, sonnet nested-ledger probe, all explicit-tier) + the complete weekly pipeline executed under `powershell.exe` 5.1 against *real* upstream doc drift, whose scoping stage (headless session) spawned two sonnet page-verifiers and adjudicated noise-vs-claim-affecting itself.
- **Results:** nested gate + nested ledger verified live; contract suite grew to 10 cases; drift-detected exit path verified; real drift correctly triaged (one claim-affecting finding: definition-level `effort`); probe PASS; ledger summary correct; one encoding bug found and fixed from the run's own log.
- **Limitations:** hash-only anchors meant the scoping agent verified claims against live pages rather than diffing; n=1 on drift-pipeline value.
- **Landed in:** effort-frontmatter skill fix, anchors rebaseline, DRIFT-REPORT-2026-08-06.md, encoding fix, denial-counting instrumentation.
