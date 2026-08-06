#!/usr/bin/env node
// PreToolUse gate enforcing the explicit-model rule from the model-selection
// skill (shipped in this plugin) on both delegation paths:
//  - Agent tool: no explicit `model` -> deny with re-issue instructions;
//    explicit model -> inject a one-line tiering reminder.
//  - Workflow tool: lint the script text for agent() calls with no `model:`
//    in their argument span -> deny listing the offending calls.
// The workflow lint is a string heuristic, not a JS parse: a call whose model
// arrives via a variable or shared options object false-positives (suppress
// with a `/* model-gate:allow */` comment inside the call), and a `model:`
// occurring between two calls can mask a violation. Upgrade path if it
// misfires in practice: balanced-paren scan of each call's argument list.
const fs = require('fs');

const TIERS =
  'haiku=mechanical scouting/extraction; sonnet=anchored implementation/doc research; opus=reasoning beyond sonnet; top tier=adversarial review gates/open-ended design/security reads, where top tier is the most capable model available in the session — fable where available, otherwise opus';

function lintScript(src) {
  const missing = [];
  const re = /\bagent\s*\(/g;
  const idx = [];
  let m;
  while ((m = re.exec(src))) idx.push(m.index);
  idx.forEach((start, i) => {
    const span = src.slice(start, idx[i + 1] ?? src.length);
    if (!/model\s*:/.test(span) && !/model-gate:\s*allow/.test(span)) {
      missing.push(span.slice(0, 90).replace(/\s+/g, ' ').trim());
    }
  });
  return missing;
}

// Self-check: `node agent-model-gate.js --test`. Guards the span-boundary logic —
// a space-styled `agent (` must not desync spans and mask the model-less call.
if (process.argv[2] === '--test') {
  const got = lintScript("await agent('x'); await agent ('y', { model: 'haiku' });");
  if (got.length !== 1 || !got[0].includes("agent('x')")) {
    console.error('lint self-test FAILED: ' + JSON.stringify(got));
    process.exit(1);
  }
  console.log('lint self-test OK');
  process.exit(0);
}

const emit = (out) => console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', ...out } }));
const allow = (context) => emit({ additionalContext: context });
const deny = (reason) => emit({ permissionDecision: 'deny', permissionDecisionReason: reason });

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    // Unparseable input: fail open (no output = allow) rather than block all
    // delegation. Deliberate: the harness serializes tool_input itself, so the
    // realistic trigger is a harness bug — and the platform already fails open
    // on hook crash, so fail-closed here would not make the gate airtight.
    return;
  }
  const ti = input.tool_input || {};

  if (input.tool_name === 'Workflow') {
    let src = ti.script;
    if (!src && ti.scriptPath) {
      try {
        src = fs.readFileSync(ti.scriptPath, 'utf8');
      } catch {
        // Unreadable scriptPath: the Workflow tool will surface that itself.
        return;
      }
    }
    if (!src) {
      // Named/predefined workflow: no script text available to lint.
      allow('model-selection: this predefined workflow cannot be linted for explicit per-agent models. Confirm its agent() calls set model explicitly at the lowest sufficient tier (' + TIERS + ').');
      return;
    }
    const missing = lintScript(src);
    if (missing.length) {
      deny('Workflow script has ' + missing.length + ' agent() call(s) without an explicit model: ' + missing.map((s) => '`' + s + '`').join(' ; ') + '. Apply the model-selection skill: set model (and effort) explicitly on every agent() call at the lowest sufficient tier (' + TIERS + '). If a flagged call genuinely sets its model via a variable or shared options object, add a /* model-gate:allow */ comment inside that call.');
    } else {
      allow('model-selection: workflow script lints clean for explicit per-agent models. Confirm each chosen tier is the lowest sufficient; consult the model-selection skill if unsure.');
    }
    return;
  }

  // Agent tool.
  if (ti.model) {
    allow('model-selection: chosen tier ' + ti.model + ' — confirm it is the lowest sufficient for this task; consult the model-selection skill if unsure.');
  } else {
    deny('Agent call has no explicit model. Apply the model-selection skill: choose the lowest sufficient tier (' + TIERS + ') and re-issue this exact Agent call with the model parameter set. If the agent type’s definition already pins a suitable model, restate that model; if inheriting the session model is genuinely the lowest sufficient choice, state that model explicitly.');
  }
});
