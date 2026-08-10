# Changelog

Versions here are the `version` field in each plugin's `plugin.json`, which Claude Code uses as the update cache key — an installed plugin only updates when that field rises. Repo-level changes that ship to nobody (docs/, evals/, scripts/, the root README, CI) are not versioned and are not listed.

This project follows [semantic versioning](https://semver.org): MAJOR for breaking changes, MINOR for new capability, PATCH for corrections that change no behaviour.

## delegation-steering

### 0.1.2

- States the missing-runtime fail-open where the requirement is stated: if `node` does not resolve when a hook runs, the gate allows the delegation with no denial, no ledger line, and no error. Verified live 2026-08-10.
- Clarifies the headless gap: spawning `claude -p` from Bash is not itself gated, but delegations inside that child session are, since it loads the same plugin.
- Adds a text alternative under the coverage map and shortens its labels so they render without clipping.

No behaviour changed: no skill, hook, or command was modified in this release.

### 0.1.1

- Corrected the ledger description: a workflow entry records the model literals scanned from the script text, so it neither counts fan-out (agents spawned from one literal appear once) nor excludes non-agent occurrences. The previous wording claimed it recorded the models used across the workflow.
- Components are now a table with a "Fires when" column, replacing the bullet list.
- Documented the `DELEGATION_LEDGER` path override and the off switch.

No behaviour changed: no skill, hook, or command was modified in this release.

### 0.1.0

- Initial release: `delegation-tiering` and `steering-claude-code` skills, the `agent-model-gate` PreToolUse hook (denies delegations that name no model, lints workflow scripts at launch), the `delegation-ledger` PostToolUse hook, and the `/delegation-steering:canary` verification command.
