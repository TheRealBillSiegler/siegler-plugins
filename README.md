# claude-plugins

Claude Code plugins by [Bill Siegler](https://github.com/TheRealBillSiegler), served from the `siegler-plugins` marketplace.

| Plugin | What it does |
| --- | --- |
| [**delegation-steering**](plugins/delegation-steering/) | Every delegated agent gets an explicit model at the lowest sufficient tier — enforced by a hook, not convention |

## Install

### Requirements

- Node.js on `PATH`
- Windows only: Git for Windows (hooks declare `"shell": "bash"`)

```bash
claude plugin marketplace add TheRealBillSiegler/claude-plugins
claude plugin install delegation-steering@siegler-plugins
```

Inside a session: `/plugin marketplace add TheRealBillSiegler/claude-plugins`, then `/plugin install delegation-steering@siegler-plugins`.

Then:

1. Restart or run `/reload-plugins` — neither install form takes effect in a running session.
2. Run `/delegation-steering:canary` to verify the gate end-to-end.

## delegation-steering

When Claude spawns a subagent or launches a workflow without naming a model, the subagent silently inherits the session's model — no one asks whether a cheaper one would do. delegation-steering forces the question: a deterministic hook (not a CLAUDE.md line Claude may or may not follow) **denies** any delegation that doesn't name a model:

```text
Agent call has no explicit model. Apply the delegation-tiering skill: choose the lowest sufficient tier …
```

The denial hands back the ladder to choose from:

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
