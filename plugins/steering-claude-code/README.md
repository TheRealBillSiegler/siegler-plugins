# steering-claude-code

A decision guide for where a Claude Code behavior should live — CLAUDE.md, a rules file, a skill, a subagent, a hook, an output style, or a system-prompt append. Built from an Anthropic engineering article plus the enforcement mechanics the article doesn't cover, anchored to the official docs.

One skill, no hooks — nothing always-on beyond its listing description.

| Component | What it does | Fires when |
| --- | --- | --- |
| `skills/steering-claude-code/` | Decision tree across the steering mechanisms, with per-option enforcement mechanics and a worked hook example. | You ask where a behavior should live, or why an instruction keeps being ignored |

## Verify

Invoke it: ask "where should a never-push-to-main rule live?" in a session with the plugin enabled — the answer should route to a hook or permission rule, not CLAUDE.md prose. The skill's application eval and its recorded baseline live in the [plugin repo](https://github.com/TheRealBillSiegler/claude-plugins) (`evals/steering-claude-code/scenarios.md`).

## Relation to delegation-tiering

Split from the former `delegation-steering` plugin: this guide answers *where behavior lives*; its sibling [`delegation-tiering`](https://github.com/TheRealBillSiegler/claude-plugins/tree/main/plugins/delegation-tiering) answers *which model a delegated agent gets* and enforces it with hooks. The skill cites that plugin's gate as its worked enforcement example; neither requires the other.

## Source fidelity

Claims carry the same three provenance tiers as the sibling plugin — article digest, doc page, or dated live test — defined in the repo's [Anchoring policy](https://github.com/TheRealBillSiegler/claude-plugins/blob/main/docs/REMEDIATION.md#anchoring-policy). The skill's Doc anchors section names the page behind each mechanic; the dated article digest is in `skills/steering-claude-code/references/`.
