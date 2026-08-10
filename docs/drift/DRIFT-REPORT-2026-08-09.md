# Drift report — 2026-08-09

**Trigger:** ad-hoc live run of `scripts/check-drift.js` during a documentation-audit question (not the weekly schedule). Detected: Claude Code 2.1.218 → 2.1.224 and hash changes on all six anchored pages (baseline captured 2026-08-07T02:23Z).

## Verdict: NOISE on all six pages

Root cause of "all six changed": a site-wide relative-link rewrite (`/en/…` → `/docs/en/…`, hundreds of occurrences per page) plus additive release content across ~6 days of Claude Code versions (new `EndConversation`/`ListAgents` tools, cross-session messaging, PowerShell hook tabs, workflow plugin distribution, `/import` command, glob-brace budget). No anchored claim contradicted, renamed, or newly documented.

Special-attention findings:

- **A8 (no hook fires for `agent()` spawns inside a running workflow): still docs-silent.** TaskCreated/TaskCompleted and the `workflow` task type pre-existed the drift window (byte-identical in the 2026-08-04 Wayback snapshot); they gate explicit `TaskCreate` tool calls and Stop-hook observability, and cannot block a workflow-internal spawn. No new hookable surface.
- **A3 (`model` in Agent `tool_input`): unaffected** — schema table byte-identical to the pre-drift baseline.
- **A1, A2, A5, A6: unaffected** — deny semantics, matcher semantics, PostToolUse coverage, and rules-loading text identical or functionally identical.
- Nothing newly closes a bold gap in the COVERAGE matrix.

## Corrections shipped this cycle (claim-side, not doc-side)

- **A7**: hooks.md documents subagent tool-call hooks and did so before our 2026-08-06 live test (Wayback 2026-08-04) — the docs-silent label was a verification miss, caught by a review question, fixed before this scoping run.
- **A3/A4 citation accuracy** (surfaced by this scoping run, pre-existing, not drift): the Agent `tool_input` schema lives in hooks.md, not tools-reference.md (A3 re-pointed); the Workflow `script`/`scriptPath` fields are named in no doc page (A4 re-marked docs-silent, empirical).

## Method and limitations

Single read-only scoping agent (sonnet), 2026-08-09: fetched all six live pages, recovered pre-drift Wayback snapshots for each, diffed old vs new, checked every hunk against the claim set in both SKILL.md files, COVERAGE.md (A1–A8), and evals/README.md. Limitations: hooks.md has no snapshot at the exact anchor timestamp — nearest prior (2026-08-04) used as baseline, so a change landed-and-reverted between 08-04 and 08-07 would not show; contract tests and canary were not re-run (REMEDIATION gating: no claim-affecting change found, so empirical re-verification is not required this cycle).

## Disposition

Anchors rebaselined as-is (`check-drift.js --update`) in the same PR as this report, per REMEDIATION.md.
