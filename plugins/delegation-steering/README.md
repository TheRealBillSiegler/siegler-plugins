# delegation-steering

Explicit model/effort tiering for every delegated agent, enforced — plus a decision guide for where Claude Code behavior should live. Built from two Anthropic articles and the official docs, adapted for supervised delegation.

## What installs

- **`skills/delegation-tiering/`** — the tier ladder and selection questions for delegated agents (Agent tool, Workflow `agent()` calls, multi-agent plans). Loads on invocation.
- **`skills/steering-claude-code/`** — decision tree for CLAUDE.md vs rules vs skills vs subagents vs hooks vs output styles vs system-prompt appends, with locally verified addenda the article doesn't cover.
- **`hooks/agent-model-gate.js`** — PreToolUse gate (matcher `Agent|Workflow`): denies Agent calls without `model`; lints Workflow script text at launch and denies model-less `agent()` calls. `--test` embeds the regression case for the lint's known failure class: an `agent (` call written with a space must not throw off call-span detection and hide a neighboring model-less call.
- **`hooks/delegation-ledger.js`** — PostToolUse observability: appends one JSONL line per delegation to `~/.claude/delegation-ledger.jsonl` (model, agent type, description; per-workflow model lists) so tier choices are reviewable, not just explicit.
- **`commands/canary.md`** — `/delegation-steering:canary`: live end-to-end verification of both gate paths, plus rule-file install.

## Three-layer enforcement

1. **Always-loaded rule** (`~/.claude/rules/delegation.md`, installed by the canary command): the standing rule survives compaction and holds without skill invocation — a probabilistic floor: it depends on the model following it, unlike the deterministic hook below.
2. **Skill** (on invocation): the judgment layer — which tier is lowest-sufficient.
3. **Hook** (every Agent/Workflow call): the deterministic gate. Known limits are documented in the skill's Enforcement section: the workflow lint is a string heuristic (`/* model-gate:allow */` suppresses false positives), predefined workflows and unreadable scriptPaths fail open with a reminder, and headless `claude -p` delegation is covered by no layer.

The ledger sits alongside as the observability layer: the gate can force models to be *explicit*, but only review of actual choices can show whether tiering judgment held. Its weekly summary (run from the plugin repo) is the evidence base for a deferred hardening — denying top-tier Agent calls that state no rationale — described in the repo's `docs/REMEDIATION.md`.

### Coverage map

```mermaid
flowchart TD
    A["Agent tool call"] --> G{"PreToolUse gate<br>agent-model-gate.js"}
    W["Workflow launch"] --> G
    G -- "no model / lint fails" --> DENY["denied, with re-issue instructions"]
    G -- "explicit models" --> RUN["runs, one-line tiering reminder injected"]
    RUN --> LED["delegation-ledger.js (PostToolUse)<br>appends to ~/.claude/delegation-ledger.jsonl"]
    IN["agent() spawns inside a running workflow"] -. "not hookable — always-loaded rule + skill discipline only" .-> RUN
    HP["headless claude -p from Bash"] -. "covered by no layer — manual discipline" .-> HP2["(documented gap)"]
```

## Verify

In a live session with the plugin enabled:

```text
/delegation-steering:canary
```

Everything used to *build and measure* this plugin — hook contract tests and fixtures, skill scenario evals with baselines, the enforcement coverage matrix, doc-drift detection, and methodology records — lives in the [plugin repo](https://github.com/TheRealBillSiegler/claude-plugins) (`evals/`, `docs/`, `scripts/`), not in the installed payload.

## Sunset criterion

This plugin is a stopgap for a missing platform feature, not a product to defend. If Claude Code ships native per-delegation model routing (demand is tracked upstream in anthropics/claude-code#27665, #44976, #67898), verify parity against the repo's [docs/COVERAGE.md](https://github.com/TheRealBillSiegler/claude-plugins/blob/main/docs/COVERAGE.md) — every delegation path, deterministically enforced — and archive this plugin. The repo's drift pipeline exists to notice that day, not to outlive it.

## Source fidelity tiers

- **Article-only claims** (advisor figure, start-smart posture): dated quote digests in each skill's `references/` — the blogs are the primary source; digests are the ceiling.
- **Mechanics**: specific `code.claude.com/docs` pages, listed per claim in each SKILL.md's Doc anchors; docs win over articles.
- **Enforcement-boundary behavior** (what actually fires for what): empirical, dated live tests — largely undocumented; where a doc page does state a boundary, the repo's COVERAGE.md dependency table cites it, and the canary and the repo's weekly probe re-establish the behavior after Claude Code updates either way.
