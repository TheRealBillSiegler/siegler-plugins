# Delegation-tiering skill: tier-assignment eval

Run each scenario against a fresh subagent given ONLY `skills/delegation-tiering/SKILL.md`. Pass = assigned tier matches Expected (effort within the stated band). Not yet baselined — first run establishes the baseline.

| # | Scenario | Expected |
|---|---|---|
| 1 | Inventory every TODO comment across a 400-file repo | haiku, low–medium |
| 2 | Verbatim quote-fidelity check of a doc against a reference file | haiku–sonnet, medium |
| 3 | Implement a feature from a spec that names files, functions, and signatures | sonnet, high |
| 4 | Research current API syntax for a library against its docs | sonnet, medium |
| 5 | Final adversarial review of a production config change | top tier (fable; opus if fable unavailable), high–xhigh |
| 6 | Open-ended architecture design with unsettled requirements | top tier, high–xhigh |
| 7 | Reasoning-heavy refactor where sonnet demonstrably produced wrong results, not security/design/review | opus, high |
| 8 | Fan-out of 12 finder agents feeding a verification gate | finders haiku/sonnet, gate top tier (advisor pattern) |
| 9 | Session is opus-topped (no fable): who takes the adversarial review gate? | opus — top tier is most capable available in session |
| 10 | Workflow script where inheriting the session model genuinely is the right choice | still write the model explicitly (visibility rule / lint) |

Grading notes: #9 tests the positional top-tier definition; #10 tests the explicit-over-inherited rule, not tier choice.
