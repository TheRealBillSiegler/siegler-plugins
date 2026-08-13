# claude-plugins

Claude Code plugins by [Bill Siegler](https://github.com/TheRealBillSiegler), served from the `siegler-plugins` marketplace.

| Plugin | What it does |
| --- | --- |
| [**delegation-tiering**](plugins/delegation-tiering/) | Explicit model tiering for every delegated agent, hook-enforced |
| [**steering-claude-code**](plugins/steering-claude-code/) | Decision guide for where a Claude Code behavior should live — a single skill |

## Install

The plugins are independent — install either or both:

```bash
claude plugin marketplace add TheRealBillSiegler/claude-plugins
claude plugin install delegation-tiering@siegler-plugins
claude plugin install steering-claude-code@siegler-plugins
```

**Requirement:** delegation-tiering's hooks run on Node.js, so `node` must resolve on `PATH` (check with `node --version`). Without it the gate [fails open — silently](plugins/delegation-tiering/README.md#verify--required-not-optional); step 2 below is the detector. steering-claude-code needs nothing beyond Claude Code.

Then:

1. Restart or run `/reload-plugins` — no install form takes effect in a running session.
2. delegation-tiering only: run `/delegation-tiering:canary`. It installs the always-loaded rule file and verifies both deny paths — required, not just a check.

### Other ways to install

**In a session** — `/plugin marketplace add TheRealBillSiegler/claude-plugins`, then `/plugin install <plugin>@siegler-plugins`.

**By hand**, for dotfiles or config you version yourself — merge these keys into `~/.claude/settings.json` ([settings reference](https://code.claude.com/docs/en/settings#plugin-settings)), keeping only the plugins you want:

```json
{
  "extraKnownMarketplaces": {
    "siegler-plugins": {
      "source": { "source": "github", "repo": "TheRealBillSiegler/claude-plugins" }
    }
  },
  "enabledPlugins": {
    "delegation-tiering@siegler-plugins": true,
    "steering-claude-code@siegler-plugins": true
  }
}
```

**Without installing**, to try one or test a local change — clone the repo and load a plugin for one session only:

```bash
claude --plugin-dir ./plugins/delegation-tiering
# or: claude --plugin-dir ./plugins/steering-claude-code
```

## delegation-tiering

When Claude spawns a subagent or launches a workflow without naming a model, the subagent silently inherits the session's model — no one asks whether a cheaper one would do. delegation-tiering forces the question: a deterministic hook (not a CLAUDE.md line Claude may or may not follow) **denies** any delegation that doesn't name a model. The refusal opens:

> **Agent call has no explicit model.**

It then hands back the ladder, so the call can be re-issued with a tier named:

| Tier | For |
| --- | --- |
| `haiku` | Mechanical scouting, extraction |
| `sonnet` | Anchored implementation, doc research |
| `opus` | Reasoning beyond `sonnet` |
| Top tier — `fable`, else `opus`, else `sonnet` | Adversarial review gates, open-ended design, security reads |

Workflow scripts get the same check at launch. Each denial includes its fix, so the call comes back with a model named — an extra round trip, not a dead end.

On your machine:

- **Gates** direct `Agent` calls and `Workflow` launches with readable script text — model-less ones are denied; nothing else is touched. The paths it does not reach are named in the [coverage matrix](docs/COVERAGE.md)
- **Logs** one line per delegation to the plugin's own data directory, so uninstalling takes it with them
- **Installs** `~/.claude/rules/delegation.md` (via the canary)
- **Off switch:** `/plugin disable delegation-tiering` — leaves the rule file in place; uninstalling takes the ledger with the plugin's data directory

Components, enforcement layers, escape hatches, known gaps, and the coverage map: [plugins/delegation-tiering/](plugins/delegation-tiering/). Claims, tests, and drift watch: [docs/](docs/) and [evals/](evals/).

## steering-claude-code

The other half of the question: not *which model*, but *where should a behavior live at all* — CLAUDE.md, a rules file, a skill, a subagent, a hook, an output style, or a system-prompt append. A single-skill plugin: one decision tree with per-option enforcement mechanics, no hooks, nothing always-on beyond its listing.

Details: [plugins/steering-claude-code/](plugins/steering-claude-code/).

## Development

Branch flow, test commands, versioning, and the repo's authoring conventions: [CONTRIBUTING.md](CONTRIBUTING.md). The claim set, procedures, and records behind the plugin: [docs/](docs/).

[MIT licensed](LICENSE).
