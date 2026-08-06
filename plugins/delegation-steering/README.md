# delegation-steering

Explicit model/effort tiering for every delegated agent, enforced — plus a decision guide for where Claude Code behavior should live. Built from two Anthropic articles and the official docs, adapted for supervised delegation, and kept fresh by evals + drift detection.

## Components

| Component | Role |
|---|---|
| `skills/model-selection/` | The tier ladder and selection questions for delegated agents (Agent tool, Workflow `agent()`, multi-agent plans). Loads on invocation. |
| `skills/steering-claude-code/` | Decision tree for CLAUDE.md vs rules vs skills vs subagents vs hooks vs output styles vs system-prompt appends, with locally verified addenda the article doesn't cover. |
| `hooks/agent-model-gate.js` | PreToolUse gate (matcher `Agent\|Workflow`): denies Agent calls without `model`; lints Workflow script text at launch and denies model-less `agent()` calls. `--test` self-check guards the lint's span-boundary logic. |
| `commands/canary.md` | `/delegation-steering:canary` — end-to-end live verification + rule-file install + legacy cutover cleanup. |
| `evals/` | Offline hook contract tests (fixtures + runner) and application scenarios for both skills with recorded baselines. |
| `scripts/check-drift.js` | Deterministic doc/version drift detection against `anchors.json`. |
| `docs/REMEDIATION.md` | The agentic procedure that runs only when drift touches an anchored claim. |

## Three-layer enforcement

1. **Always-loaded rule** (`~/.claude/rules/delegation.md`, installed by the canary command): the standing rule survives compaction and holds without skill invocation. Probabilistic floor.
2. **Skill** (on invocation): the judgment layer — which tier is lowest-sufficient.
3. **Hook** (every Agent/Workflow call): the deterministic gate. Known limits are documented in the skill's Enforcement section: the workflow lint is a string heuristic (`/* model-gate:allow */` suppresses false positives), predefined workflows and unreadable scriptPaths fail open with a reminder, and headless `claude -p` delegation is covered by no layer.

## Verify

```bash
node hooks/agent-model-gate.js --test              # lint self-check
node evals/contract/run-contract-tests.js           # offline contract
# then, in a live session with the plugin enabled:
/delegation-steering:canary                         # end-to-end + cutover
```

## Source fidelity tiers

- **Article-only claims** (advisor figure, start-smart posture): dated quote digests in each skill's `references/` — the blogs are the primary source; digests are the ceiling.
- **Mechanics**: specific `code.claude.com/docs` pages, listed per claim in each SKILL.md's Doc anchors; docs win over articles.
- **Enforcement-boundary behavior** (what actually fires for what): empirical, dated live tests — the docs are silent here; the canary re-establishes these after Claude Code updates.
