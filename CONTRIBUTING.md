# Contributing

Feature branch → PR into `develop`; releases merge `develop` → `main` by PR — `main` is what the marketplace serves, so nothing reaches an installer until that second merge. No direct pushes to either. Conventional commits.

This repo holds only the marketplace manifest and this documentation. Plugin changes happen in the plugin repos ([delegation-tiering](https://github.com/TheRealBillSiegler/delegation-tiering), [steering-claude-code](https://github.com/TheRealBillSiegler/steering-claude-code), [ablation](https://github.com/TheRealBillSiegler/ablation)) — each carries its own CI, tests, and versioning. A change lands here only when a plugin's install identity changes: its repo, name, or description in `.claude-plugin/marketplace.json`.

## Formatting

No hard line-wraps in markdown — one logical line per paragraph or bullet; wrapped prose churns diffs and the wrap points go stale on edit.

## Reporting problems

Marketplace problems (a plugin won't resolve or install from this manifest): open a [GitHub issue here](https://github.com/TheRealBillSiegler/siegler-plugins/issues). Problems with a plugin's behavior belong on that plugin's own issue tracker. Pre-split issue history for all three plugins also lives in [this repo's issues](https://github.com/TheRealBillSiegler/siegler-plugins/issues).
