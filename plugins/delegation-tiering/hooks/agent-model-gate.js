#!/usr/bin/env node
// PreToolUse gate enforcing the explicit-model rule from the delegation-tiering
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
const ledger = require('./ledger');

// Denials never reach the PostToolUse ledger (the call is blocked before it
// runs), so the gate records them itself — each denial is a counted, would-be
// violation: the evidence that the deterministic layer is load-bearing.
function logDenial(tool, detail) {
  ledger.append({ tool, denied: true, detail });
}

const TIERS = require('./tiers').LADDER;

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
      allow('delegation-tiering: this predefined workflow cannot be linted for explicit per-agent models. Confirm its agent() calls set model explicitly at the lowest sufficient tier (' + TIERS + ').');
      return;
    }
    const missing = lintScript(src);
    if (missing.length) {
      logDenial('Workflow', missing.length + ' model-less call(s)');
      deny('Workflow script has ' + missing.length + ' agent() call(s) without an explicit model: ' + missing.map((s) => '`' + s + '`').join(' ; ') + '. Apply the delegation-tiering skill: set model (and effort) explicitly on every agent() call at the lowest sufficient tier (' + TIERS + '). If a flagged call genuinely sets its model via a variable or shared options object, add a /* model-gate:allow */ comment inside that call.');
    } else {
      allow('delegation-tiering: workflow script lints clean for explicit per-agent models. Confirm each chosen tier is the lowest sufficient; consult the delegation-tiering skill if unsure.');
    }
    return;
  }

  // Agent tool. Checked explicitly rather than reached by falling through the
  // Workflow branch: the matcher in hooks.json is the only thing deciding what
  // arrives here, and widening it to a third delegation surface would otherwise
  // deny every call to that tool for lacking a `model` field it never had — a
  // hard block on a working tool, caused by an edit in a different file.
  if (input.tool_name !== 'Agent') return;

  if (ti.model) {
    allow('delegation-tiering: chosen tier ' + ti.model + ' — confirm it is the lowest sufficient for this task; consult the delegation-tiering skill if unsure.');
  } else {
    logDenial('Agent', 'no model');
    deny('Agent call has no explicit model. Apply the delegation-tiering skill: choose the lowest sufficient tier (' + TIERS + ') and re-issue this exact Agent call with the model parameter set. If the agent type’s definition already pins a suitable model, restate that model; if inheriting the session model is genuinely the lowest sufficient choice, state that model explicitly.');
  }
});
