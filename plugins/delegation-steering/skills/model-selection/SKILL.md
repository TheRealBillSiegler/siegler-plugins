---
name: model-selection
description: Use when spawning or configuring any delegated agent — an Agent tool call, a Workflow agent() call, or a multi-agent plan — including choosing model or effort parameters, authoring a workflow script, tiering a fan-out, or deciding which tier a delegated task needs.
---

# Model Selection for Delegated Agents

Standing rule: every delegated agent gets an **explicit model** at the **lowest tier sufficient** for its task. State the tiering rationale when presenting a plan that spawns agents.

## Why bottom-up, when the article's default is top-down

The source article's default recommendation is the opposite direction: "start with the most intelligent generally available model and use effort level to dial in performance and cost." This skill deliberately takes the article's alternative path because it operates strictly downstream of that choice: the orchestrator doing the delegating already **is** the most capable model available in the session, and it stays in the loop — writing the spec, choosing the tier, and reviewing the output. That structure is the article's own advisor strategy generalized across the ladder (quoted under Advisor pattern below). When no capable orchestrator is in the loop — e.g. picking the model for a standalone workload — follow the article's top-down default instead; this skill's ladder is for supervised delegation only.

## The ladder

Stop at the first tier that is sufficient:

| Tier | Effort | Use for |
|------|--------|---------|
| fastest/cheapest (`haiku`) | low–medium | Mechanical work: repo/file scouting, verbatim extraction, inventories, reflows, format conversion |
| balanced (`sonnet`) | medium | Pattern-following implementation with verified anchors, doc research, toolchain iteration, fidelity checks |
| balanced (`sonnet`) | high | Implementation from near-code design; complex but well-specified multi-file edits |
| reasoning (`opus`) | high | Reasoning-intensive work where the balanced tier demonstrably falls short AND the task is not a top-tier category |
| top tier (`fable`; `opus` when fable is unavailable) | high–xhigh | Top-tier categories ONLY: adversarial review gates, open-ended design, security-boundary reads |

Durable rules about the table:

- **"Top tier" means the most capable model available in the session** — not last generation's flagship by habit, and not a fixed name. In a fable session, top tier is fable; in a session where fable is unavailable (opus-topped plans, fast mode), opus is the top tier and takes the top-tier categories. When the model lineup changes, remap tiers by position (fastest/cheapest ↔ most capable), not by name — the names in parentheses reflect the Claude 5 generation.
- **When fable is available, top-tier categories stay on fable.** The article notes larger models "tend to have more wisdom, creativity, and writing skills despite having similar benchmark scores" — exactly the margin adversarial gates and open-ended design pay for. Opus substitutes as top tier; it does not co-equal fable when fable is present.
- **Both directions fail the rule.** Over-provisioning (top tier for scouting) and under-provisioning (balanced tier for the final adversarial review of production config) are equally wrong.

## Selection questions

The article asks four questions: task difficulty, latency needs, access constraints, and unit economics. Questions 1–3 below adapt three of them for delegation; the access-constraints question is deliberately dropped (every model available to the session is equally accessible to a delegated agent — availability is already folded into the top-tier definition). Question 4 is a delegation-specific addition with no article counterpart.

1. **How hard is the task?** Difficulty is the main capability axis — "the main difference across model classes is in how hard a problem they can reliably carry" — and Claude models do not specialize by domain. (Not the *only* axis — see the fable-over-opus ladder rule above.)
2. **Latency/volume?** High-frequency fan-out stages point down the ladder.
3. **Unit economics?** Judge cost-per-task, not price-per-token — the article notes cost-per-task is often lower for more intelligent models, especially at lower effort levels, even when price-per-token is higher. A weaker model that retries or produces work needing a redo is not cheap.
4. **Did design already happen?** When a design phase produced implementation-ready specs, downgrade the implementer (work planned at the reasoning tier drops to the balanced tier once specified to near-code level).

## Traps

- **Workflow scripts:** omitting `model` on an `agent()` call inherits the *session* model — often the top tier. Set `model` (and `effort`) explicitly on every `agent()` call; if inheriting genuinely is the lowest sufficient choice, still write the model explicitly so the choice is visible. The launch-time script lint (see Enforcement) backstops this path, but only heuristically — keep the discipline regardless.
- **Verify/review stages deserve the tier the finding warrants**, not the tier the finder ran at: cheap finders feeding an un-reviewed conclusion is a silent quality ceiling.

## Advisor pattern

For fan-outs, prefer cheap workers plus a top-tier gate over top tier everywhere. The article's example — a single-benchmark figure, not a general result: "on SWE-bench Pro Sonnet 5 with a Fable 5 advisor is within 10% of Fable 5's score at 63% of the price of using Fable 5 for the whole task." Structure: fastest/balanced-tier finders → top-tier adversarial verify.

## Evaluation

Public benchmarks saturate with powerful models; the article's counsel is to decide with custom evaluations drawn from real workloads. Applied to delegation: when unsure whether the balanced tier suffices for a recurring task, try it once and inspect the output — upgrade the tier on evidence, not on vibes. Before concluding the tier was insufficient, rule out a setup failure first (under-specified prompt, missing anchors, broken tool wiring): the article cautions that starting small makes model failures hard to distinguish from setup failures, and a mis-specified delegation fails identically at every tier.

## Enforcement

Three layers back the standing rule:

- **Agent tool (deterministic):** this plugin's PreToolUse hook (`hooks/agent-model-gate.js`, matcher `Agent|Workflow` registered via the plugin's `hooks/hooks.json`) denies Agent calls without `model` and injects a one-line tiering reminder on calls that have one. Verified live 2026-08-05 (both branches).
- **Workflow tool (deterministic, heuristic):** the same hook lints the script text at launch and denies on `agent()` calls with no `model:` in their argument span, quoting the offending snippets.
  - String scan, not a JS parse: a call whose model arrives via a variable or shared options object can false-positive (suppress with a `/* model-gate:allow */` comment inside that call), and stray `model:` text between calls can mask a violation. Mechanics and self-test: header of `hooks/agent-model-gate.js` (`node hooks/agent-model-gate.js --test` from the plugin root).
  - Fail-open paths: named/predefined workflows (no script text to lint) are allowed with only a reminder, and an unreadable `scriptPath` is allowed silently — both fall back to the always-loaded rule alone.
  - Per-spawn events inside a running workflow are not hookable (checked 2026-08-05: PreToolUse never fires for them — confirmed live — and SubagentStart cannot block), so launch-time linting is the only deterministic contact point for this path.
- **Always-loaded rule (probabilistic):** the standing rule also lives in `~/.claude/rules/delegation.md` (installed by the `/delegation-steering:canary` command if missing), so it holds even when this skill is never invoked and survives compaction.

Uncovered entirely: headless delegation (`claude -p` spawned from Bash) is invisible to the matcher and outside the rule file's literal scope — apply the standing rule manually there.

Maintenance: `Agent` and `Workflow` are documented tool names ([tools-reference](https://code.claude.com/docs/en/tools-reference.md)), but a rename would disable the gate silently — after a Claude Code update, run `/delegation-steering:canary` (one Agent call without `model` and one Workflow script containing a model-less `agent()` call; expect both denied). Doc drift is watched by `scripts/check-drift.js` against `scripts/anchors.json`. Last verified: 2026-08-05.

## Source

- [Claude models explained: choosing the best model for your use case](https://claude.com/blog/claude-models-explained-choosing-the-best-model-for-your-use-case) — Anthropic, claude.com blog. The selection framework, economics guidance, and advisor example above are drawn from it; the ladder's effort mapping, question 4, and the bottom-up posture are delegation-specific adaptations, with the posture rationale stated above.
- [Quote-anchored digest of the article](references/claude-models-explained-2026-08-05.md) — captured 2026-08-05 with cross-verified verbatim quotes; re-verify against the live URL before relying on a quote for a durable claim. The digest anchors only the article-only claims (advisor figure, start-smart posture, selection questions).
- Doc anchors (enforcement mechanics): hook control surface — <https://code.claude.com/docs/en/hooks.md> and <https://code.claude.com/docs/en/hooks-guide.md>; matchable tool names — <https://code.claude.com/docs/en/tools-reference.md>; workflow spawn isolation — <https://code.claude.com/docs/en/workflows.md> and <https://code.claude.com/docs/en/sub-agents.md>. Where the article and docs disagree, docs win.
- Model facts (IDs, tiers, pricing, effort vocabulary): the maintained anchors are the [platform models overview](https://platform.claude.com/docs/en/about-claude/models/overview) (which links the Effort parameter guidance) and the local `claude-api` skill — not this skill or its digest.
