# Reference digest: "Claude models explained: choosing the best model for your use case"

- **Canonical source:** <https://claude.com/blog/claude-models-explained-choosing-the-best-model-for-your-use-case> (Anthropic, claude.com blog)
- **Captured:** 2026-08-05, via multiple independent WebFetch extractions; every quotation below appeared verbatim in at least two independent extractions. This is a quote-anchored digest, not a verbatim mirror — for full context, read the live article.
- **Freshness:** model names and figures are Claude-5-generation specific. Before relying on a quote for a durable claim, re-verify against the live URL; if the article has moved or changed, update this digest and its capture date.

## Article structure (section headings, in order)

1. Our advice: start smart
2. The Claude model family
3. How to choose which Claude model is best for your workload
4. Combining models' strengths with the advisor strategy
5. How evals and benchmarks help with model choice
6. Making the smart choice

## The article's default recommendation

> "our default recommendation is to start with the most intelligent generally available model and use effort level to dial in performance and cost"

Top-down is the article's default; starting small and upgrading is the demoted alternative. Related caution:

> "Starting with a smaller model can also make it harder to distinguish between model failures and setup failures."

## The capability axis

> "The main difference across model classes is in how hard a problem they can reliably carry, and what that capability costs in price and speed."

> "If it typically takes a lot of time, involves multiple steps, or is previously unsolved then a more capable model class is appropriate."

No domain specialization:

> "We don't recommend one model class for finance and another for science. Every Claude model is trained to excel in areas like coding, agentic tasks, and knowledge work."

Note: "main difference" is not "only difference" — the article itself names a second axis:

> "larger models such as Fable tend to have more wisdom, creativity, and writing skills despite having similar benchmark scores to models such as Opus"

## Model classes

- **Mythos/Fable** — "Anthropic's most capable model class", "frontier capabilities across domains", "especially capable at coding, long-running agent tasks, and solving problems AI has not reliably handled before". Fable is the generally available packaging with "additional safeguards"; Mythos is gated.
- **Opus** — "our powerful model class for reasoning-intensive enterprise tasks".
- **Sonnet** — "our versatile model class for everyday tasks"; "a balance of performance, cost, and speed for the widest set of general purpose use cases".
- **Haiku** — "our lowest cost and fastest model class", for "high-frequency workloads where latency and cost matter".

## The four selection questions

Quoted verbatim from the article:

1. "How hard is this task?"
2. "What are the latency needs?"
3. "What are the access constraints?"
4. "What are the unit economics?"

## Effort levels

> "Effort level also impacts the balance of quality, speed, and cost. Higher-class models at higher efforts offer the best possible performance, and higher-class models at lower efforts can sometimes be more efficient than smaller models."

The article's effort/quality curves carry the note: "Curves are illustrative and not plotted from benchmark data."

## Unit economics

> "Cost-per-task is often lower for more intelligent models, especially at lower effort levels, even if the price-per-token is higher. This is because more capable models often take fewer turns and less thinking time to get most tasks right."

## The advisor strategy

> "The advisor strategy allows faster, lower-cost worker models to call more intelligent models to check their plan and evaluate their work."

> "For example, on SWE-bench Pro Sonnet 5 with a Fable 5 advisor is within 10% of Fable 5's score at 63% of the price of using Fable 5 for the whole task."

Note the qualifiers: a single benchmark (SWE-bench Pro), and the baseline is Fable 5 running the whole task.

## Evals and benchmarks

> "The challenge arises when evaluating powerful models, such as Opus and Fable, which can solve almost all of the questions on the test (often referred to as saturation)."

> "In these cases, we recommend organizations use the models on real workloads or test them with their own evaluations to make a decision on which model is the right choice."

> "Typically, evaluations are a curated set of problems drawn from production — including difficult tasks where your current tools fall short, with success criteria your team defines."
