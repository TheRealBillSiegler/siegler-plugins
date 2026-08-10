# claude-plugins

Claude Code plugins by [Bill Siegler](https://github.com/TheRealBillSiegler), served from the `siegler-plugins` marketplace.

| Plugin | What it does |
| --- | --- |
| [**delegation-steering**](plugins/delegation-steering/) | Explicit model tiering for every delegated agent, hook-enforced |

## Install

> [!IMPORTANT]
> **Requirements:** Node.js on `PATH`. On Windows, Git for Windows — the hooks declare `"shell": "bash"`.

```bash
claude plugin marketplace add TheRealBillSiegler/claude-plugins
claude plugin install delegation-steering@siegler-plugins
```

Then:

1. Restart or run `/reload-plugins` — no install form takes effect in a running session.
2. Run `/delegation-steering:canary` to verify the gate end-to-end.

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

When Claude spawns a subagent or launches a workflow without naming a model, the subagent silently inherits the session's model — no one asks whether a cheaper one would do. delegation-steering forces the question: a deterministic hook (not a CLAUDE.md line Claude may or may not follow) **denies** any delegation that doesn't name a model:

> **Agent call has no explicit model.** Apply the delegation-tiering skill: choose the lowest sufficient tier — the ladder below — and re-issue this exact Agent call with the `model` parameter set.

The ladder it hands back:

| Tier | For |
| --- | --- |
| `haiku` | Mechanical scouting, extraction |
| `sonnet` | Anchored implementation, doc research |
| `opus` | Reasoning beyond `sonnet` |
| Top tier — `fable`, else `opus`, else `sonnet` | Adversarial review gates, open-ended design, security reads |

Workflow scripts get the same check at launch. Each denial includes its fix, so the call comes back with a model named — an extra round trip, not a dead end.

On your machine:

- **Gates** every `Agent`/`Workflow` call — model-less ones are denied; nothing else is touched
- **Logs** one line per delegation to `~/.claude/delegation-ledger.jsonl`
- **Installs** `~/.claude/rules/delegation.md` (via the canary)
- **Off switch:** `/plugin disable delegation-steering`

Components (two skills, two hooks, one command), enforcement layers, escape hatches, known gaps, and the coverage map: [plugins/delegation-steering/](plugins/delegation-steering/).

## Development

- Feature branch → PR into `develop`; releases merge `develop` → `main` by PR. No direct pushes. Conventional commits.
- Changes to hook lint semantics must keep `node plugins/delegation-steering/hooks/agent-model-gate.js --test` passing and add a case for the failure class fixed.
- Multi-agent runs that produce conclusions record their methodology in [METHODS.md](docs/METHODS.md).

[MIT licensed](LICENSE).
