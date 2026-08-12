# Deferred hardenings

Enforcement the plugin could add but deliberately has not. Each entry names the evidence that would justify building it — nothing here is built on speculation, and an entry with no trigger does not belong in this file. When a trigger fires, the work lands via the normal PR path and the entry moves to the CHANGELOG.

## Scoped rationale gate

Deny top-tier Agent calls (`fable`, or `opus` when it is the session's top tier) whose input carries no rationale marker.

- **Why deferred:** rationale strings demanded on every call degrade into gate-passing boilerplate.
- **Trigger to build:** the weekly ledger summary shows top-tier over-provisioning actually happening — a sustained top-tier share on mechanical-sounding delegations. The 7-day delegation mix it prints is the evidence base.
- **Scope:** top-tier calls only.
