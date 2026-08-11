// The machine-readable tier ladder, injected into every denial so the caller
// receives the fix along with the refusal. The prose ladder — five rungs with
// effort bands and the reasoning behind them — is the delegation-tiering
// skill; this is the compressed form that fits in a hook message.
//
// Exported rather than inlined so the contract test can assert against the
// whole string. Asserting on a substring of it goes vacuously true the moment
// the ladder is reworded, leaving a test that can no longer fail.
module.exports =
  'haiku=mechanical scouting/extraction; sonnet=anchored implementation/doc research; opus=reasoning beyond sonnet; top tier=adversarial review gates/open-ended design/security reads, where top tier is the most capable model available in the session — fable, else opus, else sonnet';
