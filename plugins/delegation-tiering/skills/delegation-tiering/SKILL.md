---
name: delegation-tiering
description: Use when spawning or configuring any delegated agent — an Agent tool call, a Workflow agent() call, or a multi-agent plan — including choosing model or effort parameters, authoring a workflow script, tiering a fan-out, or deciding which tier a delegated task needs.
---

# Delegation Tiering

Standing rule: every delegated agent gets an **explicit model** at the **lowest tier sufficient** for its task. State the tiering rationale when presenting a plan that spawns agents.

Scope: supervised delegation only — a capable orchestrator stays in the loop, writing the spec, choosing the tier, reviewing the output. For a standalone workload with no orchestrator, follow the source article's top-down default instead: start with the most capable model and use effort to dial cost down (why this skill inverts that default: the plugin README's Design rationale section).

## The ladder

Stop at the first tier that is sufficient:

| Tier | Effort | Use for |
| ------ | -------- | --------- |
| fastest/cheapest (`haiku`) | low–medium | Mechanical work: repo/file scouting, verbatim extraction, inventories, reflows, format conversion |
| balanced (`sonnet`) | medium | Pattern-following implementation with verified anchors, doc research, toolchain iteration, fidelity checks |
| balanced (`sonnet`) | high | Implementation from near-code design; complex but well-specified multi-file edits |
| reasoning (`opus`) | high | Reasoning-intensive work where the balanced tier demonstrably falls short AND the task is not a top-tier category |
| top tier (most capable in session: `fable` — the Claude 5 flagship above `opus` — else `opus`, else `sonnet`) | high–xhigh | Top-tier categories ONLY: adversarial review gates, open-ended design, security-boundary reads |

Durable rules about the table:

- **Bands are sweet spots, not fences.** Below-band is fine for easy instances. Wanting effort *above* a tier's band is the tell that the task has left the tier: a `haiku` file-inventory whose prompt keeps growing judgment calls — "skip vendored code", "decide whether each TODO is stale" — until you're reaching for `effort: high` isn't a hard inventory anymore; the judgment is the work, so it's `sonnet` at medium, not `haiku` at high.
- **"Top tier" means the most capable model available in the session** — not last generation's flagship by habit, and not a fixed name. In a fable session, top tier is fable; in fable-less sessions (opus- or sonnet-topped plans, fast mode), the most capable available model takes the top-tier categories. When the ladder compresses — e.g. a sonnet-topped session where sonnet is both worker and gate — the gate stage still earns its place through independence (fresh context, adversarial framing), not extra capability. When the model lineup changes, remap tiers by position (fastest/cheapest ↔ most capable), not by name — the names in parentheses reflect the Claude 5 generation.
- **When fable is available, top-tier categories stay on fable.** The article notes larger models "tend to have more wisdom, creativity, and writing skills despite having similar benchmark scores" — exactly the margin adversarial gates and open-ended design pay for. Opus substitutes as top tier; it does not co-equal fable when fable is present.
- **Both directions fail the rule.** Over-provisioning (top tier for scouting) and under-provisioning (balanced tier for the final adversarial review of production config) are equally wrong.
- **Effort is per-call only on some surfaces.** Workflow `agent()` calls accept `effort` per call; direct Agent tool calls have no effort parameter and inherit the session's effort level — though a custom agent type can pin `effort` in its definition frontmatter. If the session runs below a tier's band for a top-tier category, route through a workflow or a definition-pinned agent type, or accept the session effort — model class is the bigger lever (the article notes higher-class models at lower efforts can outperform smaller models).
- **Orchestration modes don't change the ladder.** Exhaustive-verification modes (e.g. ultracode) scale how many agents you spawn and how many verify stages you add — not the tier each agent gets. Fan-out multiplication makes over-provisioning costlier, not more acceptable; the advisor pattern below is what heavy orchestration should look like.

## Selection questions

1. **How hard is the task?** Difficulty is the main capability axis — "the main difference across model classes is in how hard a problem they can reliably carry" — and Claude models do not specialize by domain. (Not the *only* axis — see the fable-over-opus ladder rule above.)
2. **Latency/volume?** High-frequency fan-out stages point down the ladder.
3. **Unit economics?** Judge cost-per-task, not price-per-token — the article notes cost-per-task is often lower for more intelligent models, especially at lower effort levels, even when price-per-token is higher. A weaker model that retries or produces work needing a redo is not cheap.
4. **Did design already happen?** When a design phase produced implementation-ready specs, downgrade the implementer (work planned at the reasoning tier drops to the balanced tier once specified to near-code level).

## Traps

- **Workflow scripts:** omitting `model` on an `agent()` call inherits the *session* model — often the top tier. Set `model` (and `effort`) explicitly on every `agent()` call; if inheriting genuinely is the lowest sufficient choice, still write the model explicitly so the choice is visible. The launch-time script lint (see Enforcement) backstops this path, but only heuristically — keep the discipline regardless.
- **Verify/review stages deserve the tier the finding warrants**, not the tier the finder ran at: cheap finders feeding an un-reviewed conclusion is a silent quality ceiling.

## Tiering verification work

The tier follows how enumerated the target is — the less anyone has named what to look for, the higher the tier:

| Verification shape | The question it answers | Tier |
| --- | --- | --- |
| Deterministic check (suite, guard, lint) | Does the command pass? | none — run the script |
| Fix re-verification | Does each named fix match its named evidence? | `sonnet` |
| Single-finding adjudication | Is this one claimed defect real? | the tier the finding's severity warrants |
| Lens review | What's wrong along *this named dimension*? | `sonnet`, high effort |
| Open adversarial gate | What's wrong that *nobody has named*? | top tier — once per claim |

The gate earns top tier once per claim, not once per retry: a follow-up named "re-gate" that checks enumerated fixes against expected evidence is the second row, not the last. And every fix that lands with the deterministic check that would have caught it moves its future re-verification to the first row.

## Advisor pattern

For fan-outs, prefer cheap workers plus a top-tier gate over top tier everywhere. The article's example — a single-benchmark figure, not a general result: "on SWE-bench Pro Sonnet 5 with a Fable 5 advisor is within 10% of Fable 5's score at 63% of the price of using Fable 5 for the whole task." Structure: fastest/balanced-tier finders → top-tier adversarial verify.

## Evaluation

Lowest-sufficient is a hypothesis and the output is its test: review every delegated result at the tier the claim warrants; on failure, rule out setup first (under-specified prompt, missing anchors, broken wiring) before re-dispatching one rung up — a saved rung that produces a redo saved nothing.

The same loop at slower cadence for recurring tasks: public benchmarks saturate with powerful models, so the article's counsel is custom evaluations drawn from real workloads — when unsure whether the balanced tier suffices, try it once, inspect, and upgrade on evidence, not vibes. The article cautions that starting small makes model failures hard to distinguish from setup failures: a mis-specified delegation fails identically at every tier.

## Enforcement

What backs the standing rule:

- **Agent tool (deterministic):** this plugin's PreToolUse hook (`hooks/agent-model-gate.js`, matcher `Agent|Workflow`) denies Agent calls without `model` and injects a one-line tiering reminder on calls that have one.
- **Workflow tool (deterministic, heuristic):** the same hook lints the script text at launch and denies on `agent()` calls with no `model:` in their argument span, quoting the offending snippets.
  - String scan, not a JS parse: it can false-positive on a call whose model arrives via a variable or shared options object, and stray `model:` text between calls can mask a violation. The denial message carries the fix, escape marker included; mechanics are in the plugin's `hooks/README.md`.
  - Fail-open paths: named/predefined workflows (no script text to lint) are allowed with only a reminder, and an unreadable `scriptPath` is allowed silently — both fall back to the always-loaded rule alone.
  - Per-spawn events inside a running workflow are not hookable, so launch-time linting is the only deterministic contact point for this path.
- **Always-loaded rule (probabilistic):** the standing rule also lives in `~/.claude/rules/delegation.md` (installed by the `/delegation-tiering:canary` command if missing), so it holds even when this skill is never invoked and survives compaction.

Alongside the layers, observability: this plugin's PostToolUse hook (`hooks/delegation-ledger.js`) records every delegation to the plugin's data directory — the gate makes models explicit; the ledger makes tier choices reviewable.

Not covered: the `claude -p` spawn itself, which is a Bash command rather than a delegation call — choose that session's model deliberately. The child session then gates its own delegations normally, since it loads the same plugins and hooks.

Maintenance: `Agent` and `Workflow` are documented tool names, but a rename would disable the gate silently — after a Claude Code update, run `/delegation-tiering:canary` (one Agent call without `model` and one Workflow script containing a model-less `agent()` call; expect both denied).

## Source

- [Claude models explained: choosing the best model for your use case](https://claude.com/blog/claude-models-explained-choosing-the-best-model-for-your-use-case) — Anthropic, claude.com blog. The selection framework, economics guidance, and advisor example above are drawn from it; the ladder's effort mapping, question 4, and the bottom-up posture are delegation-specific adaptations.
- Model facts (IDs, tiers, pricing, effort vocabulary): the maintained anchors are the [platform models overview](https://platform.claude.com/docs/en/about-claude/models/overview) and the local `claude-api` skill — not this skill.
