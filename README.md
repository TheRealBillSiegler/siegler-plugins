# siegler-plugins

Claude Code plugin marketplace by [Bill Siegler](https://github.com/TheRealBillSiegler). Each plugin lives in its own repo; this repo is the manifest that serves them all under one install namespace.

| Plugin | What it does |
| --- | --- |
| [**delegation-tiering**](https://github.com/TheRealBillSiegler/delegation-tiering) | Explicit model tiering for every delegated agent, hook-enforced |
| [**steering-claude-code**](https://github.com/TheRealBillSiegler/steering-claude-code) | Decision guide for where a Claude Code behavior should live — a single skill |
| [**ablation**](https://github.com/TheRealBillSiegler/ablation) | Tests whether a piece of steering text still earns its place — a single skill |

## Install

The plugins are independent — install any subset:

```bash
claude plugin marketplace add TheRealBillSiegler/siegler-plugins
claude plugin install delegation-tiering@siegler-plugins
claude plugin install steering-claude-code@siegler-plugins
claude plugin install ablation@siegler-plugins
```

**Requirement:** delegation-tiering's hooks run on Node.js, so `node` must resolve on `PATH` (check with `node --version`). Without it the gate [fails open — silently](https://github.com/TheRealBillSiegler/delegation-tiering#verify); step 2 below is the detector. The other plugins need nothing beyond Claude Code.

Then:

1. Restart or run `/reload-plugins` — no install form takes effect in a running session.
2. delegation-tiering only: run `/delegation-tiering:canary`. It installs the always-loaded rule file and verifies both deny paths — required, not just a check.

### Other ways to install

**In a session** — `/plugin marketplace add TheRealBillSiegler/siegler-plugins`, then `/plugin install <plugin>@siegler-plugins`.

**Direct from a plugin's own repo** — each plugin repo self-registers as a one-plugin marketplace, e.g. `/plugin marketplace add TheRealBillSiegler/ablation`, then `/plugin install ablation@ablation` (the doubled name is correct).

**By hand**, for dotfiles or config you version yourself — merge these keys into `~/.claude/settings.json` ([settings reference](https://code.claude.com/docs/en/settings#plugin-settings)), keeping only the plugins you want:

```json
{
  "extraKnownMarketplaces": {
    "siegler-plugins": {
      "source": { "source": "github", "repo": "TheRealBillSiegler/siegler-plugins" }
    }
  },
  "enabledPlugins": {
    "delegation-tiering@siegler-plugins": true,
    "steering-claude-code@siegler-plugins": true,
    "ablation@siegler-plugins": true
  }
}
```

**Without installing**, to try one or test a local change — clone the plugin's repo and load it for one session only:

```bash
git clone https://github.com/TheRealBillSiegler/delegation-tiering
claude --plugin-dir ./delegation-tiering
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

Components, enforcement layers, escape hatches, known gaps, claims, tests, and the drift watch: the [delegation-tiering repo](https://github.com/TheRealBillSiegler/delegation-tiering), including its [coverage matrix](https://github.com/TheRealBillSiegler/delegation-tiering/blob/main/docs/COVERAGE.md).

## steering-claude-code

The other half of the question: not *which model*, but *where should a behavior live at all* — CLAUDE.md, a rules file, a skill, a subagent, a hook, an output style, or a system-prompt append. A single-skill plugin: one decision tree with per-option enforcement mechanics, no hooks, nothing always-on beyond its listing.

Details: the [steering-claude-code repo](https://github.com/TheRealBillSiegler/steering-claude-code).

## ablation

The measurement instrument the other two lean on: does a CLAUDE.md line, rule file, or skill step still earn its place? It runs matched tasks with and without the component under blind judging and reports the smallest difference the design could have detected. Verdicts are stamped with model and date because they expire on model upgrade.

Details: the [ablation repo](https://github.com/TheRealBillSiegler/ablation).

## Development

Branch flow and this repo's authoring conventions: [CONTRIBUTING.md](CONTRIBUTING.md). Plugin code, claims, tests, and procedures live in each plugin's own repo.

[MIT licensed](LICENSE).
