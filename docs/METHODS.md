# Methods records

Two parts: the requirements a methods record must satisfy, then the records themselves — an append-only ledger, newest first. The requirements are revised deliberately via PR; the records are history and are never revised (corrections are new dated entries).

## Requirements

1. **When a record is required.** Any multi-agent run — a workflow, a fan-out of Agent calls, a review panel — whose conclusions land in a durable artifact (commit, PR, ticket, verdict, doc) must have a record here, landing with or before the conclusions. No record, no legitimacy: unrecorded runs are chat, not evidence.
2. **What a record contains.** Date; question; orchestration shape (phases, agent count, agent types); per-role model + effort — **full model IDs as captured at run time, never aliases** (an alias goes ambiguous the moment a new model generation ships); verification/adjudication structure (gates, blinding, dedup rules); counts (raw → surviving findings, with kill reasons where a gate ruled); limitations; where the conclusions landed.
3. **Limitations are mandatory and non-empty.** A run with no stated limitations was not examined, only transcribed.
4. **Provenance honesty.** Anything reconstructed after the fact is labeled as inference; anything not verified from a primary source is labeled UNVERIFIED. Records are append-only — a wrong record is corrected by a new dated entry that names it, never by silent edit.
5. **What a record can and cannot promise.** Agent runs are stochastic: a record makes a run *re-executable and auditable* (same structure, prompts, tiers, adjudication rules), never bit-identical.
6. **Cross-referencing.** Any baseline, verdict, or finding cited elsewhere in the repo must link the record that produced it.

## Records

## 2026-08-11 — Information-leakage audit of the repository

- **Question:** after the 0.2.0 hook and ledger changes, does the same design decision live in more than one module anywhere in the repo — such that changing it requires editing several places, and missing one leaves the system inconsistent? (Information leakage in Ousterhout's sense, *A Philosophy of Software Design*.)
- **Shape:** one delegated agent, `general-purpose` type, model alias `opus`, session-inherited effort (the Agent tool exposes no per-call effort parameter). Read-only by instruction. Given the definition, seven named decisions to investigate, an explicit instruction to look past duplicated strings for near-duplicates encoding the same decision in different words, and a requirement to state for each finding whether the copies agree or have already drifted, with severity and the smallest fix. Also required to list cases considered and rejected as legitimate restatement, with reasons.
- **Verification structure:** no adjudicating agent. Every HIGH finding was re-verified by the orchestrator against source before any edit — `grep`/`sed` over the cited lines for the six drift claims, and two behavioral probes: the `model-gate:allow` scope claim was tested by piping three scripts (marker in file header, marker inside the flagged call, marker in a later call) through the hook and reading the decision, and the ledger-summary aggregation was tested against a fixture pairing both ledger files and both field names. MEDIUM and LOW findings were read but not independently re-verified and did not drive edits.
- **Counts:** 6 HIGH, 7 MEDIUM, 4 LOW reported; 6 rejected-as-legitimate cases stated. All 6 HIGH confirmed on re-verification, 0 killed. 6 acted on. Of the 6, two were drift introduced by earlier commits in the same PR (stale ledger paths in prose; the legacy `models` field dropped by the weekly summary) and four predated it.
- **Found by verification, not by the agent:** re-testing the weekly summary revealed a second defect the audit had not reported — `$ledgers | Get-Content` binds nothing, because `Get-Content` does not accept plain path strings from the pipeline, so the summary aggregated an empty set regardless of ledger contents. Introduced by an earlier commit in this PR and caught only because the fixture asserted an expected mix rather than merely running.
- **Model IDs:** specified and captured as the alias `opus` only. Resolved ID for this date, stated as **inference** from the session's platform defaults rather than capture: `claude-opus-5`. Same shortfall and same remedy as the records below.
- **Limitations:** single agent, single pass, no independent adjudication — a second lens might rank differently or find more, and a false negative here is invisible. The agent did not execute the contract suite or the canary, so its "copies agree" verdicts are read against source, not observed behavior; the orchestrator's re-verification covers only the HIGH set. The seven decisions to investigate were supplied by the orchestrator, so decisions outside that list depended on the agent's own sweep. Severity ranking is the agent's judgment, not a measured impact.
- **Landed in:** PR #20 — commits `a20604b`, `c9c15b6`, `0ea5bee`, `d6e8078`, `18deb93`. Four of the six fixes are now pinned by contract cases, so a future edit that reintroduces them fails the suite rather than shipping.

## 2026-08-10 — Correction to "Landing-page redesign panel"

- **Corrects:** the `2026-08-10 — Landing-page redesign panel` record below. Its orchestration shape, tiers, counts, and limitations stand; two reference defects are corrected here.
- **Landed in:** PR #15 (landing page and linked pages) and PR #16 (defects found by rendering the page). The original record said "merge pending" and named an unmerged draft rather than a tracker artifact.
- **Identifiers:** that record cites workflow run IDs and an agent id that exist only in a machine-local session transcript and cannot be resolved by any reader. Disregard them; the orchestration is reproducible from the structure, tiers, and adjudication rules the record already states.
- **Convention going forward:** methods records name tracker artifacts for where work landed, and describe orchestration by structure rather than by session-local run identifiers.

## 2026-08-10 — Landing-page redesign panel

- **Question:** how should the claude-plugins repo landing page (README.md) be restructured — minimal, visual (trees/tables/diagrams), CLI-first install — informed by popular marketplace landing pages and a six-expert panel?
- **Shape:** 2 workflows + 1 direct recovery agent call, 19 delegated agents total. Workflow `wf_dab8f90d-b98` (15 agents): Research phase — discover-marketplaces (sonnet, medium), 6 inventory agents (haiku, medium — 5 over the marketplaces discover returned, 1 over GrillerGeek/idd-framework; 3 failed), cli-install-docs (sonnet, medium). Panel phase — 6 expert lenses (frontend-design, github-conventions, oss-maintainer, ai-native-dev, claude-code-user, learning-expert; all opus, high). Synthesis — 1 agent (fable, high). Workflow `wf_9177151d-b0b`: 3 recovery agents (sonnet, medium) re-running the 3 failed inventories. Direct recovery: `inventory:obra/superpowers` re-run via a direct Agent call (general-purpose type, sonnet, session-inherited effort — the Agent tool has no per-call effort parameter; agent id `aaa6121f151d702b2`).
- **Failures:** 3 haiku inventory agents (`obra/superpowers`, `hesreallyhim/awesome-claude-code`, `anthropics/claude-plugins-official`) hit the StructuredOutput retry cap (5) in `wf_dab8f90d-b98` and were recovered via sonnet re-runs in `wf_9177151d-b0b`; one of those recoveries (`obra/superpowers`, sonnet) returned a schema filled with placeholder text (`'test'`, `'a'`, `'b'`) and was discarded, then re-run a second time via the direct Agent call above, which succeeded.
- **Verification structure:** panel findings adversarially adjudicated by the fable synthesis agent (consensus/tensions/rejected, each with reasons); load-bearing quotes independently re-verified by the orchestrator against source — deny-transcript wording against `agent-model-gate.js:108`, tier-ladder text against `agent-model-gate.js:29-30`, the `DELEGATION_LEDGER` env var against `delegation-ledger.js:36`, component file paths via glob, and marketplace star counts against a fresh `gh api` call.
- **Counts:** 19 delegated agents total; 4 failures (3 StructuredOutput retry-cap, 1 discarded placeholder result); 6/6 panel lenses delivered; synthesis consensus 13 items, tensions 8, rejected 14; the orchestrator's delta-check of the 3 recovered inventories against the already-drafted synthesis found no material changes, reinforcing evidence only.
- **Model IDs:** models were specified and captured as aliases only (`haiku`, `sonnet`, `opus`, `fable`) — the per-agent `meta.json` files record the alias, not a resolved ID. Resolved IDs for this run date, stated as **inference** from the session's platform defaults, not capture: `claude-haiku-4-5-20251001`, `claude-sonnet-5`, `claude-opus-5`, `claude-fable-5`. Same shortfall and same remedy as the 2026-08-05/06 baselines record.
- **Limitations:** the panel and synthesis ran with only 2 of 5 detailed marketplace inventories available — the other 3 arrived after synthesis and were delta-checked by the orchestrator, not re-adjudicated by the panel itself. Landing-page patterns from popular repos are correlational, not causal, evidence of what works.
- **Landed in:** the approved landing-page redesign draft (superseding README.md; merge pending).

## 2026-08-09 — Plugin-only canary re-verification

- **Question:** after PR #1 merged and the legacy loose hook was removed, do the *plugin-registered* hooks (installed as `delegation-steering@siegler-plugins`) produce the denials — not a leftover of the pre-plugin installation?
- **Shape:** no orchestration — four inline live probes from the interactive session: model-less Agent call (expect deny), model-less Workflow launch (expect lint deny), Agent call at alias `haiku` (expect allow + reminder; resolved ID not captured at run time, inferred claude-haiku-4-5 from that date's platform defaults), plus a rule-file presence check.
- **Attribution structure:** the legacy gate file was deleted before the run, so a legacy registration cannot emit a deny decision (its command exits nonzero without one); corroborated by ledger forensics — the pre-cleanup canary (02:11 UTC) wrote *doubled* denial lines (two registrations active), this run (02:26 UTC) wrote exactly one per path.
- **Results:** deny with correct message on both paths; allow path ran with the tiering reminder injected as PreToolUse additional context; full ledger entry for the allow, single denial lines for the denies; rule file present. All three canary steps PASS.
- **Limitations:** single replicate per path; the nested-subagent path and the workflow ledger model-extraction were not re-run (their cells keep earlier dates); the reminder-injection observation comes from the orchestrating session's own context, unblinded; the doubled-lines reading is inference from registration state — the ledger does not record *which* registration wrote a line.
- **Landed in:** the two re-verified date cells in [COVERAGE.md](COVERAGE.md) and the Enforcement dates in the delegation-tiering SKILL.md.

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
- **Landed in:** effort-frontmatter skill fix, anchors rebaseline, [drift/DRIFT-REPORT-2026-08-06.md](drift/DRIFT-REPORT-2026-08-06.md), encoding fix, denial-counting instrumentation.

## 2026-08-05/06 — Scenario eval baselines

- **Protocol:** per [../evals/README.md](../evals/README.md) — fresh-context subagent, skill file only, weakest deployable tier first.
- **Runs:** steering-claude-code: 7 scenarios, haiku 7/7 and sonnet 7/7 (2026-08-05; two gaps found by the eval itself — `paths:` format, hook-vs-permission criterion — fixed same day). delegation-tiering: 12 scenarios, haiku 12/12 and sonnet 12/12 (2026-08-06).
- **Limitations:** single rep per tier (no variance estimate); grader = the same session that orchestrated the eval, not an independent blinded rater — an unblinded LLM comparison against the scenario files' Expected column, i.e. weak-signal by this repo's own grading standards (the endpoint is categorical, so the fix is mechanical extraction, not a better judge); models recorded as aliases at run time — resolved IDs inferred afterward (2026-08-09) from run-date platform defaults as claude-haiku-4-5 and claude-sonnet-5, an inference, not a capture. Later records stamp full model IDs (now requirement 2).

## 2026-08-05 — Multi-authority design review of the plugin artifacts

- **Question:** do SKILL.md, digest, hook, rule file, and wiring follow skill/plugin design best practices across all local authorities plus official blog guidance?
- **Shape:** 2 phases. Phase 1: four parallel streams — blog sweep (sonnet, medium), plugin-dev skill-reviewer agent type (sonnet), local-authorities audit across four best-practice sources (sonnet, high), mechanical quote/coherence fidelity (haiku, medium). Phase 2: adjudication gate (fable, high) verifying each finding against artifact text, ruling on authority conflicts explicitly.
- **Counts:** 30 raw findings → 6 accepted (1 high: the lint span-boundary bug, confirmed by hand-trace), 9 rejected with recorded reasons.
- **Limitations:** authority conflicts ruled by one gate, not a panel; the one correctness bug was found by review, not by any eval — recorded as a failure-class lesson in REMEDIATION.md.
- **Landed in:** the span-boundary fix + `--test` guard, context-tax reduction, coverage-gap docs, effort-token fix.

## 2026-08-05 — Conformance assessment: skill + hook vs the two source articles

- **Question:** how well do the (pre-plugin) model-selection skill and agent-model-gate hook conform to the models-explained and steering-Claude-Code articles?
- **Shape:** 2 phases. Phase 1: four parallel finders — quote fidelity (sonnet, medium), coverage/omission (sonnet, high), steering-architecture fit (sonnet, high), hook-API check (claude-code-guide agent type, sonnet, medium). Phase 2: one adversarial gate (fable, high) instructed to refute each finding by re-fetching sources, merge duplicates, and re-rank.
- **Counts:** 38 raw findings → 10 surviving (1 high), 9+ explicitly killed with reasons.
- **Empirical augmentation:** 3 live gate tests (deny branch, allow branch, Workflow probe) ran before the fan-out and were given to all agents as ground truth.
- **Limitations:** WebFetch extraction is a small-model reconstruction (quotes were cross-verified across ≥2 independent fetches); single gate, no multi-vote; no blinding between finders and gate.
- **Landed in:** SKILL.md revisions, hook fixes, PR #1 body.
