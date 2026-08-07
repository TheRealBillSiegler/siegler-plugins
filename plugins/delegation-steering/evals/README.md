# Eval methodology

What the evals verify, where each layer's cases come from, and how the set grows. The layers are ordered by what they can prove: deterministic contract → live behavior → skill application quality.

## Layer 1: contract tests (`contract/`)

**Based on:** observed hook behavior and found bugs — one fixture per exercised branch, plus a regression fixture for every fixed bug (per the failure-classes ledger in [../docs/REMEDIATION.md](../docs/REMEDIATION.md)). `wf-masking.json` is the archetype: it encodes the span-boundary bug found by adversarial review on 2026-08-05, and the same case is embedded in the hook as `node hooks/agent-model-gate.js --test`.

**Protocol:** `node evals/contract/run-contract-tests.js` — pipes each fixture to the hook, asserts decision and message substrings. Pure, offline, free. Verifies the hook's contract *as implemented*, not whether Claude Code still routes calls to it.

**Growth rule:** any change to lint semantics must keep `--test` passing and add a fixture for the failure class it fixes. No fix without its regression case.

## Layer 2: live verification (canary + weekly probe)

**Based on:** the enforcement-boundary claims the docs are silent on — what actually fires for what. These were established by dated live tests (see the skill's Enforcement section) and can silently change on any Claude Code update, so they are re-established empirically, never assumed.

**Protocol:** `/delegation-steering:canary` in a live session (both gate paths must deny; also performs rule-file install and legacy cutover). The weekly probe in `../scripts/weekly-drift-task.ps1` automates the same two assertions headlessly and logs PASS/FAIL to `drift.log`.

## Layer 3: scenario evals (`scenarios/`)

**Based on:**

- `steering-scenarios.md` — six scenarios converted from the source article's own when-to-use examples and anti-patterns (Zod rule, never-push-to-main, release checklist, personal preferences, noisy dependency audit, monorepo orientation), plus one probing the locally verified addenda (workflow-spawn enforcement), which exists in no article.
- `delegation-tiering-scenarios.md` — one probe per ladder rung or durable rule in the skill's own contract, including the positional top-tier definition and the explicit-even-when-inheriting rule.

**Protocol:** fresh-context subagent given ONLY the skill file ("Read the skill and answer from it alone"), run at the weakest tier the skill should serve *before* stronger ones. Baselines are recorded in each scenario file with dates. Grading rule: if a model at or below sonnet misses a scenario, the skill's guidance is insufficient — fix the skill, not the model.

**Growth rule — toward production-drawn evals:** the source article's counsel is that real evals are "drawn from production." The delegation ledger (`~/.claude/delegation-ledger.jsonl`) is the production feed: when a weekly mix summary or manual review surfaces a mis-tiered delegation, convert it into a scenario with the correct expected tier. Author-derived scenarios (the current set) are the floor, not the end state.

## Necessity (ablation) status

Everything above proves the components *work*; ablation asks whether each still *earns its place* — remove it, observe matched behavior, stamp the verdict.

**Probe-arm protocol** — the evidence bar for every verdict, defined here so it is self-contained (the methodology derives from a machine-local ablation skill, but this text governs): run matched arms for the component under test — control (component present) vs ablated (component absent) — in isolated per-arm configuration (prepared config directories; see the arm-isolation research record), at least 3 reps per arm on realistic probes, outputs graded blind to arm identity, tallied mechanically. Verdict: **load-bearing** (behavior degrades without it), **ceremony** (no observable difference), or **harmful** (better without it) — stamped with model, date, and probe/rep counts. Stamps expire on model upgrade.

Current status, stamped claude-fable-5 / 2026-08-06 (static-read assertions — no probe-arm evidence yet — except where noted):

| Component | Verdict | Evidence | Next step |
| --- | --- | --- | --- |
| Gate (deny branches) | load-bearing | violation history: 2026-08-01, three model-less calls silently inherited the top tier, pre-gate; denial counting added 2026-08-06 | count real denials (`denied: true` ledger lines; weekly summary reports them) |
| Allow-branch reminder | ceremony-candidate | none either way — rule + skill may already suffice | probe arms: matched delegations with/without the reminder |
| Rule file (floor) | untested, confounded | clean sessions can't be attributed between rule, skill, and reminder | ablate alone, not as a cluster |
| Skill bodies | capability-verified, necessity untested | 12/12 and 7/7 evals prove guidance is retrievable, not that tier choices differ without it | judgment probes with/without skill access |
| Tier policy (lowest-sufficient) | article-claimed, locally unmeasured | no local outcome comparison exists | outcome ablation: same real task at prescribed vs top tier, blind-graded; the ledger accumulates candidate tasks |
| Drift pipeline | one real catch (n=1) | 2026-08-06: claim-affecting doc change caught in week one | track catch/noise ratio across runs |

Harm surveillance (the third verdict): denial rate (friction on legitimate work), `model-gate:allow` marker frequency (lint false positives), redos after cheap delegations (ledger review). Cadence: re-run verdicts after each model upgrade — a verdict stamped on one model says nothing about the next.

## Run records

Every eval or verdict run records its methodology in [../docs/RUNS.md](../docs/RUNS.md) — date, question, orchestration shape, per-role model + effort, adjudication structure, raw→surviving counts, limitations. Baselines cited in scenario files must have a corresponding run record.

## What the evals cannot show

Tier *optimality*. The layers prove models are explicit (gate), the gate is alive (probe), and the skills' guidance is retrievable and applicable (scenarios). Whether a specific real-world delegation used the cheapest sufficient tier is a judgment call — the ledger makes those calls reviewable, and REMEDIATION.md's deferred hardenings state what evidence would justify enforcing more.
