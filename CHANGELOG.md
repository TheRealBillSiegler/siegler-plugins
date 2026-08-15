# Changelog

Versions here are the `version` field in each plugin's `plugin.json`, which Claude Code uses as the update cache key — an installed plugin only updates when that field rises. Repo-level changes that ship to nobody (docs/, evals/, scripts/, the root README, CI) are not versioned and are not listed.

Versioning is [semantic](https://semver.org) with one deliberate exception: **pre-1.0, breaking changes ship as MINOR**, not MAJOR — reserving 1.0.0 for a stability commitment these plugins have not made. Anything breaking is called out in its entry.

## delegation-tiering

### 0.1.0

First release under this name. `delegation-steering` (retired section below) split in two: this plugin keeps the enforcement half — tiering skill, gate, ledger, canary — and the steering-mechanism decision guide is now the sibling plugin `steering-claude-code`. Versions reset with the new identities. Relative to `delegation-steering` 0.1.x, everything below changed.

How the hooks are wired changed; what the gate decides did not. It denies and allows exactly what it did before.

- **Windows no longer needs Git for Windows.** The hooks declared `"shell": "bash"` so a shell could expand `${CLAUDE_PLUGIN_ROOT}`. They now spawn in exec form — `"command": "node"` with the script path as an `args` element — which the hooks reference recommends whenever a hook references a path placeholder. Node.js on `PATH` is the only remaining requirement.
- **The ledger no longer blocks a delegation.** It runs with `"async": true`: it emits no output and no decision waits on it.
- **The ledger writes to `${CLAUDE_PLUGIN_DATA}`**, not `~/.claude/delegation-ledger.jsonl`. Uninstalling now removes it along with the plugin's data directory, or preserves it with `--keep-data`, instead of leaving a file behind for you to find. History written under the old plugin name or the old path stays where it is and is not migrated; the repo's weekly summary reads all three locations.
- **Breaking, for anyone reading the ledger file:** the workflow entry's `models` field is now `modelLiterals`. The contents are unchanged — model strings scanned out of the script text, one entry per literal rather than per agent spawned — but the name now says so.
- **The gate checks the tool name instead of inferring it.** Anything the matcher passed that was not a `Workflow` was treated as an `Agent` call and denied for lacking a `model` field. Agent and Workflow calls are unaffected; a tool the gate has no rule for now passes through untouched.
- **Two documented claims were wrong and are corrected.** `/* model-gate:allow */` suppresses only the `agent()` call whose span it sits in, not the whole script as the hooks README stated — a marker in a file header suppresses nothing. And an unreadable `scriptPath` fails open *silently*, not with a reminder as the plugin README stated. Both now have contract cases.
- **The tiering skill leads with the ladder.** The design justification that opened the file moves to the plugin README's Design rationale section; the scope condition inside it (supervised delegation only) moves up beside the standing rule.
- **The payload carries only what Claude needs to apply the skill.** The apparatus that builds and verifies it — the dated source digest, doc-anchor table, verification stamps, drift and weekly-summary pointers — lives in the plugin repo, not the installed plugin; shipped pointers at repo files are full URLs. The operational content the skill keeps — what the gate denies, the fail-open paths, the post-update canary instruction — is the execution surface.
- **The ladder is data.** `hooks/tiers.js` holds the rungs and top-tier preference order and derives the denial string from them — byte-identical to the previous literal, so no user-visible change.
- **The plugin README states the missing-runtime fail-open right under Components**, in a Verify section framed as required, and the canary is namespaced `/delegation-tiering:canary`.

## steering-claude-code

### 0.1.0

First release under this name — the steering-mechanism decision guide split out of `delegation-steering` (retired section below) as a single-skill plugin: the skill alone, no hooks. The skill's content is the restructured `delegation-steering` version; its worked enforcement example now cites the sibling `delegation-tiering` plugin's gate. Matching the sibling, the payload carries only what Claude needs to apply the skill — the Source section keeps the article link and the doc pages behind the mechanics; the dated quote digest and the rest of the build/verify apparatus live in the plugin repo's `docs/research/` and coverage matrix.

## delegation-steering (retired)

Renamed and split 2026-08-12 into `delegation-tiering` and `steering-claude-code` — one plugin enforced model choice while the other advised on config placement, two jobs under one name. Installed copies keep working but will never update; uninstall it and install the successors. History:

### 0.1.1

- Corrected the ledger description: a workflow entry records the model literals scanned from the script text, so it neither counts fan-out (agents spawned from one literal appear once) nor excludes non-agent occurrences. The previous wording claimed it recorded the models used across the workflow.
- Components are now a table with a "Fires when" column, replacing the bullet list.
- Documented the `DELEGATION_LEDGER` path override and the off switch.

No behaviour changed: no skill, hook, or command was modified in this release.

### 0.1.0

- Initial release: `delegation-tiering` and `steering-claude-code` skills, the `agent-model-gate` PreToolUse hook (denies delegations that name no model, lints workflow scripts at launch), the `delegation-ledger` PostToolUse hook, and the `/delegation-steering:canary` verification command.
