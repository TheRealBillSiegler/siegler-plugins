# Drift report — 2026-08-06

REMEDIATION step 1 (scope the drift) only. No skills, hooks, or `anchors.json` were edited; no `--update` was run.

## Trigger

`node scripts/check-drift.js` exit 1 against baseline `capturedAt: 2026-08-06T01:59:35.430Z` (claude 2.1.218):

- changed: `https://code.claude.com/docs/en/hooks.md`
- changed: `https://code.claude.com/docs/en/sub-agents.md`

No Claude Code version drift (installed CLI still 2.1.218). The other four anchored pages are unchanged.

## Method

The baseline stores SHA-256 hashes only, so no old-vs-new textual diff is possible; per REMEDIATION step 1, scoping is claim-driven: each changed page was re-fetched raw (curl, no summarization) and every claim the skills anchor to it (per the "Doc anchors" bullets in `skills/delegation-tiering/SKILL.md` and `skills/steering-claude-code/SKILL.md`, plus the COVERAGE.md cells) was verified against the current text with verbatim quotes. Fetch/verify ran as two sonnet subagents (doc research tier); adjudication and classification here are the orchestrator's.

Fetched state at verification time:

| Page | Baseline SHA-256 (prefix) | Fetched SHA-256 (prefix) | Bytes |
| --- | --- | --- | --- |
| hooks.md | `752d3f5e` | `4f8ff174` | 252286 |
| sub-agents.md | `4a931152` | `779e64d7` | 97090 |

## Verdict summary

| Page | Classification | Basis |
| --- | --- | --- |
| hooks.md | **Noise** (w.r.t. anchored claims) | Every anchored claim re-verified SUPPORTED in current text; no contradiction found |
| sub-agents.md | **Claim-affecting** (one claim) | Documented definition-level `effort` frontmatter materially qualifies the delegation-tiering effort-surface claim |

## hooks.md — claims and evidence

**C1. PreToolUse structured output: `hookSpecificOutput.permissionDecision: "deny"` + `permissionDecisionReason`; `additionalContext` on allow** (steering-claude-code addendum; delegation-tiering Enforcement "deny … injects a reminder"). **SUPPORTED.** "PreToolUse decision control" documents `permissionDecision` with `"deny"` ("prevents the tool call") and `additionalContext` ("String added to Claude's context alongside the tool result"), with a worked deny example (`"permissionDecision": "deny", "permissionDecisionReason": "Database writes are not allowed"`) and an allow example carrying `additionalContext`. Note: the page deprecates the *top-level* `decision`/`reason` form for PreToolUse in favor of exactly the `hookSpecificOutput` form the plugin uses — the plugin is on the current side of that deprecation. A new `"defer"` value exists; irrelevant to the gate's allow/deny branches.

**C2. Exit-code-2/stderr is the simpler blocking alternative** (steering-claude-code addendum). **SUPPORTED.** "Exit 2 means a blocking error … stderr text is fed back to Claude … `PreToolUse` blocks the tool call"; per-event table row `PreToolUse | Yes | Blocks the tool call`.

**C3. Matchers use bare tool names; `Agent` and `Workflow` are distinct matchable tools** (steering-claude-code addendum; gate matcher `Agent|Workflow`). **SUPPORTED, with a documentation-gap nuance.** Matcher patterns confirm exact-name alternation ("`Edit|Write` … match either tool exactly"). `Agent` has its own PreToolUse `tool_input` schema (`prompt`, `description`, `subagent_type`, `model` — `model`: "Optional model alias to override the default"). `Workflow` does **not** appear as a tool on hooks.md (its only "workflow" hits are the Stop-event background-task labels); its existence as a distinct tool is instead confirmed on sub-agents.md (tool list names `Workflow` alongside `Agent`) and by the unchanged tools-reference.md baseline. Docs are silent, not contradictory — the matcher claim stands; see watch item W1.

**C4. SubagentStart exists but cannot block** (steering-claude-code addendum; delegation-tiering Enforcement). **SUPPORTED, now explicit in the doc.** "SubagentStart hooks can't block subagent creation, but they can inject context"; decision-control table lists SubagentStart as "Context only … No blocking or decision control"; exit-code table `SubagentStart | No`. (SubagentStop *can* block — but only to prevent the subagent from stopping, which does not create a pre-spawn control point; no anchored claim is affected.)

**C5. Hooks fire for tool calls inside subagents** (COVERAGE row "Nested Agent call inside a subagent", verified live 2026-08-06). **SUPPORTED, now explicit in the doc.** "Hooks from settings files, managed policy settings, and plugins also run inside subagents. When a subagent calls a tool, tool events such as `PreToolUse` and `PostToolUse` fire the same configured hooks as in the main conversation," with `agent_id`/`agent_type` input fields. This is doc confirmation of the cell verified live yesterday.

**C6. PostToolUse available for the ledger** (delegation-tiering Enforcement, observability). **SUPPORTED.** "Runs immediately after a tool completes successfully"; input includes `tool_input` and `tool_response`.

**C7. Per-spawn events inside a running Workflow are not hookable** (steering-claude-code addendum; delegation-tiering Enforcement; COVERAGE row "agent() spawns inside a running workflow"). **NOT CONTRADICTED — docs remain silent.** No content on hooks.md (or sub-agents.md) addresses hook events for workflow-internal `agent()` spawns; by contrast subagent-tool-call firing is explicit (C5). The claim continues to rest on the 2026-08-05 live test, as COVERAGE already records.

## sub-agents.md — claims and evidence

**C8. Subagents are spawned via the `Agent` tool; a rename would kill the matcher** (delegation-tiering Maintenance). **SUPPORTED.** The page uses `Agent` throughout ("Every subagent Claude spawns with the Agent tool counts toward the limit") and records the only rename as historical: "In version 2.1.63, the Task tool was renamed to Agent. Existing `Task(...)` references … still work as aliases." No further rename; `Workflow` appears as a separate tool name in the available-tools list, supporting the `Agent|Workflow` matcher.

**C9. Omitted model inherits the session/main-conversation model** (delegation-tiering standing rule rationale; Traps). **SUPPORTED.** "Omitted: defaults to `inherit` and uses the same model as the main conversation." Resolution order documented as: `CLAUDE_CODE_SUBAGENT_MODEL` env var → per-invocation `model` parameter → definition frontmatter `model` → main conversation's model. See watch item W2 for the env-var nuance.

**C10. Effort surface: "direct Agent tool calls have no effort parameter and inherit the session's effort level … route that delegation through a workflow to pin effort"** (delegation-tiering, ladder rules bullet "Effort is per-call only on some surfaces"). **CLAIM-AFFECTING.** Two parts:

- *Still true:* no per-invocation `effort` parameter is documented for the Agent tool anywhere on the page (the per-invocation surface documented is `model` only), and the current session's Agent tool schema likewise carries `model` but no `effort`.
- *Materially qualified:* the frontmatter table documents a definition-level `effort` field — "Effort level when this subagent is active. Overrides the session effort level. Default: inherits from session. Options: low, medium, high, xhigh, max" — also accepted in `--agents` CLI JSON. So "inherit the session's effort level" holds only when the invoked subagent's definition omits `effort`, and routing through a workflow is no longer the only way to pin effort for a delegation: a custom subagent definition pins it too. The skill sentence is not wrong for direct calls on generic agent types, but it now understates the available effort surfaces, and the workflow-routing advice presents as the sole mitigation when it is not.

Whether this field is new since the 2026-08-06T01:59Z baseline or was missed at capture cannot be determined from hashes; either way the current doc materially qualifies the anchored claim, which is the test step 1 applies.

**C11. Spawn isolation** (Doc anchors "workflow spawn isolation"; steering-claude-code "subagents" anchor). **SUPPORTED.** "Each subagent runs in its own context window …"; "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation history …". Documented exception: forks ("A fork … inherits the entire conversation so far … drops the input isolation") — the plugin makes no claim about forks; no impact.

**C12. Hooks × subagents (corroboration of C5/C7).** **CONSISTENT.** "In settings.json: define session-wide hooks that also fire inside subagents. Tool events such as PreToolUse and PostToolUse fire for the subagent's tool calls the same way they do in the main conversation." Nothing on this page addresses hookability of workflow-internal `agent()` spawns (only a subagent-limit note that "Agents a workflow script spawns with agent() don't count toward the limit").

## Watch items (not claim-affecting; no action required by step 1)

- **W1 — Workflow `tool_input` shape is doc-invisible.** hooks.md's PreToolUse per-tool schema list (Bash, PowerShell, Write, Edit, Read, Glob, Grep, WebFetch, WebSearch, Agent, AskUserQuestion, ExitPlanMode) has no `Workflow` entry, and no `script`/`scriptPath` field appears in any documented schema. The launch-lint's contact point (`tool_input.script`/`scriptPath`) therefore rests entirely on the 2026-08-05 live canary — a shape change would not surface as doc drift. The canary remains the only reliable detector for this path.
- **W2 — `CLAUDE_CODE_SUBAGENT_MODEL` outranks the per-invocation `model` parameter.** A gate reading `tool_input.model` neither sees nor is bypassed by it: model-less calls are still denied even when the env var would have supplied a model (over-denial consistent with the explicitness rule, but worth knowing if the env var ever enters use here). Definition-frontmatter `model` similarly resolves outside the gate's view for calls that omit `model`; the gate denies those anyway.
- **W3 — Background-by-default subagents (v2.1.198)** change `tool_response` (`status: "async_launched"`) and restrict background subagents to a fixed built-in tool allowlist. Checked: `hooks/delegation-ledger.js` reads only `tool_input` (line 23), so ledger entries are unaffected.
- **W4 — Doc version callouts run ahead of the installed CLI** (references up to v2.1.222 vs installed 2.1.218), including `CLAUDE_CODE_SUBAGENT_MODEL=inherit` semantics changes and subagent nesting-depth churn (v2.1.217–219). Re-check on the next CLI update via `/delegation-steering:canary` per existing Maintenance guidance.
- **W5 — SubagentStop can block** (prevent a subagent from stopping, Stop-style decision control). No plugin claim touches it; noted only because the skill prose says "SubagentStart exists but cannot block" and a careless future edit could overgeneralize to both events.

## Disposition

Because one anchored claim is affected (C10), the pure-noise exit (run `--update`, commit, stop) does not apply. Next actions per REMEDIATION steps 2–5, not performed here: re-verify mechanics empirically (`node evals/contract/run-contract-tests.js`, `/delegation-steering:canary`), then edit the affected sentence in `skills/delegation-tiering/SKILL.md` (effort-surface bullet) at the prose layer — no lint-semantics change is indicated — updating the affected COVERAGE.md cells and dates in the same PR, with `anchors.json` refreshed via `--update` in that PR. The hooks.md drift needs no prose change; its refreshed hash rides along in the same `--update`.

*Generated with Claude Code on behalf of Bill Siegler*
