# Contributing

Feature branch → PR into `develop`; releases merge `develop` → `main` by PR — `main` is what the marketplace serves, so nothing reaches an installer until that second merge. No direct pushes to either. Conventional commits. Multi-agent runs whose conclusions land in the repo record their methodology in [docs/METHODS.md](docs/METHODS.md).

## Before you push

Run from the repo root:

```bash
node evals/delegation-tiering/contract/run-contract-tests.js                          # hook contract suite
node plugins/delegation-tiering/hooks/agent-model-gate.js --test   # lint self-check
node scripts/check-version-bump.js origin/develop HEAD              # fails if plugins/** changed without a version bump
node scripts/check-links.js                                         # links resolve; plugin payloads self-contained
```

CI runs the same four. Versioning policy is stated at the top of [CHANGELOG.md](CHANGELOG.md); any change to lint semantics follows the growth rule in [evals/delegation-tiering/contract/README.md](evals/delegation-tiering/contract/README.md#growth-rule) — no fix without its regression case.

## Live verification

The contract suite proves the hooks as implemented, not that Claude Code wires them up. Three ways to see them live, in cost order:

- **Watch it happen (free):** hook denials render in the transcript natively, with the reason; `claude --debug` additionally logs each hook execution with exit code and output; `/hooks` shows what is registered and from which source.
- **`node scripts/live-probe.js --dev` (one small metered session):** headless end-to-end proof against the working tree — both deny paths and one allowed call, every assertion read from a temp-redirected ledger rather than the model's self-report. Run it before merging any change to `hooks/`.
- **`/delegation-tiering:canary` (in-session):** the installed-user form — both deny paths plus the rule-file install.

## Authoring conventions

This repo treats prose with the same discipline as code. Files have exactly one of three audiences, and the rules differ by audience — the file's job determines its standard, so know which kind you are editing.

### Files Claude loads and executes

`skills/*/SKILL.md`, `commands/*.md`, and their `references/` — a skill body is working context, not documentation ([skills reference](https://code.claude.com/docs/en/skills)).

- **Every line is a recurring token cost.** Once invoked, the body stays in context for the session. State what to do; move how-and-why to a rationale section at the bottom or a `references/` file.
- **Position is mechanical, not stylistic.** After auto-compaction only the first 5,000 tokens of a skill are re-attached (25,000 shared across skills), so operative content goes first and anything below that line must be droppable.
- **Supporting files are invisible until named.** The model reads `references/` only when the body points at it with a description of what is there. "See appendix" without a path is a dead end.
- **Staleness stamps stay inline.** A "last verified" date changes how the model asserts a mechanic, and the model cannot open a backing file it was never pointed at. One stamp per file, pointing at the file that owns the detail.
- **What the model cannot act on does not belong.** Repo pipeline detail, script paths, provenance narration — human-audit material lives in `docs/`, not in the loaded body.

### Files humans read

READMEs and `docs/` prose.

- **One home per fact.** Every claim has one authoritative file; every other mention links to it. If editing a fact means editing two files, the structure is wrong — the fix is a link, not a synchronized edit.
- **One job per file.** If stating a file's purpose takes an "and", split it. Revision cadence is the test: content that changes on different triggers belongs in different files.
- **The consequential thing comes first.** A reader who stops after the first screen should hold the most important fact, not the preamble.
- **No hand-kept counts of derived things.** "Six pages", "ten cases", "four gaps" go stale silently; describe the rule that produces the set, or link the set.
- **Cite symbols, never line numbers** — a line number is stale after any refactor; a symbol survives.
- **Diagrams get one text alternative.** The paragraph under a mermaid block is accessibility, not summary; a third restatement of the same content is a defect.
- No hard line-wraps in markdown — one logical line per paragraph or bullet.

### Files that are data

`docs/COVERAGE.md`, `docs/METHODS.md`, `docs/drift/`, `evals/*/scenarios.md` — matrices, registers, and answer keys that happen to render as markdown.

- **The register is append-only.** A wrong record is corrected by a new dated entry that names it, never edited in place ([METHODS.md requirements](docs/METHODS.md)).
- **Dates live in cells, not prose.** The matrix owns verification dates; prose that needs one links the cell.
- **Reference rows by topic, not ordinal.** Row numbers shift on insert; "the workflow-spawn scenario" does not.
- **Expiring records carry their date in the filename** (`*-2026-08-09.md`), so staleness is visible from the directory listing.

## Reporting problems

Open a [GitHub issue](https://github.com/TheRealBillSiegler/claude-plugins/issues). For a gate that seems dead (delegations passing with no model named), run `/delegation-tiering:canary` first and include its output — the most likely cause is the missing-runtime fail-open documented in [docs/COVERAGE.md](docs/COVERAGE.md) (dependency A9).
