# claude-plugins

Claude Code plugins by [Bill Siegler](https://github.com/TheRealBillSiegler), served from the `siegler-plugins` marketplace.

| Plugin | What it does |
| --- | --- |
| [**delegation-steering**](plugins/delegation-steering/) | Explicit model tiering for every delegated agent, hook-enforced |

## Install

> [!IMPORTANT]
> **Requirement:** Node.js on `PATH`. Check with `node --version`.
>
> If `node` does not resolve when a hook runs, the gate **fails open**: no denial, no ledger line, no error. The plugin looks installed and enforces nothing. Step 2 below is how you find out.

```bash
claude plugin marketplace add TheRealBillSiegler/claude-plugins
claude plugin install delegation-steering@siegler-plugins
```

Then:

1. Restart or run `/reload-plugins` — no install form takes effect in a running session.
2. Run `/delegation-steering:canary`. It installs the always-loaded rule file and verifies both deny paths — required, not just a check.

### Other ways to install

**In a session** — `/plugin marketplace add TheRealBillSiegler/claude-plugins`, then `/plugin install delegation-steering@siegler-plugins`.

**By hand**, for dotfiles or config you version yourself — merge these keys into `~/.claude/settings.json` ([settings reference](https://code.claude.com/docs/en/settings#plugin-settings)):

```json
{
  "extraKnownMarketplaces": {
    "siegler-plugins": {
      "source": { "source": "github", "repo": "TheRealBillSiegler/claude-plugins" }
    }
  },
  "enabledPlugins": { "delegation-steering@siegler-plugins": true }
}
```

**Without installing**, to try it or test a local change — clone the repo and load the plugin for one session only:

```bash
claude --plugin-dir ./plugins/delegation-steering
```

## delegation-steering

When Claude spawns a subagent or launches a workflow without naming a model, the subagent silently inherits the session's model — no one asks whether a cheaper one would do. delegation-steering forces the question: a deterministic hook (not a CLAUDE.md line Claude may or may not follow) **denies** any delegation that doesn't name a model. The refusal opens:

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
- **Off switch:** `/plugin disable delegation-steering` — leaves the rule file in place; uninstalling takes the ledger with the plugin's data directory

Components, enforcement layers, escape hatches, known gaps, and the coverage map: [plugins/delegation-steering/](plugins/delegation-steering/). Claims, tests, and drift watch: [docs/](docs/) and [evals/](evals/).

## Development

Branch flow, test commands, versioning, and the repo's authoring conventions: [CONTRIBUTING.md](CONTRIBUTING.md). The claim set, procedures, and records behind the plugin: [docs/](docs/).

[MIT licensed](LICENSE).
