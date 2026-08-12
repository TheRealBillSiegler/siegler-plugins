// The machine-readable tier ladder, injected into every denial so the caller
// receives the fix along with the refusal. The prose ladder — five rungs with
// effort bands and the reasoning behind them — is the delegation-tiering
// skill; this is the compressed form that fits in a hook message.
//
// Names are data and the string is derived, so consumers (the hook's denial
// text, the contract suite's README-drift guard) share one source. Asserting
// on a substring or a hand-kept name list goes vacuously true the moment the
// ladder is reworded or a tier is renamed, leaving a check that can no longer
// fail.
const RUNGS = [
  ['haiku', 'mechanical scouting/extraction'],
  ['sonnet', 'anchored implementation/doc research'],
  ['opus', 'reasoning beyond sonnet'],
];
// Most-capable-first; the top-tier categories go to the first one available.
const TOP_TIER_PREFERENCE = ['fable', 'opus', 'sonnet'];

const LADDER =
  RUNGS.map(([name, use]) => `${name}=${use}`).join('; ') +
  '; top tier=adversarial review gates/open-ended design/security reads, where top tier is the most capable model available in the session — ' +
  TOP_TIER_PREFERENCE.map((m, i) => (i === 0 ? m : `else ${m}`)).join(', ');

const MODELS = [...new Set([...RUNGS.map(([name]) => name), ...TOP_TIER_PREFERENCE])];

module.exports = { LADDER, MODELS };
