#!/usr/bin/env node
// Contract tests for the agent-model-gate hook: pipe each fixture to the hook
// and assert the decision and message substrings. Pure and offline — verifies
// the hook's contract as implemented, NOT whether Claude Code still routes
// Agent/Workflow calls to it (that's the /delegation-tiering:canary command).
// Run from the repo root: node evals/delegation-tiering/contract/run-contract-tests.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOOK = path.join(__dirname, '..', '..', '..', 'plugins', 'delegation-tiering', 'hooks', 'agent-model-gate.js');
const FIXTURES = path.join(__dirname, 'fixtures');
// The ladder itself, not a substring of it: an assertion pinned to the first
// few words survives any rewording and silently stops testing anything.
const { LADDER: TIERS, MODELS } = require(path.join(__dirname, '..', '..', '..', 'plugins', 'delegation-tiering', 'hooks', 'tiers.js'));

const CASES = [
  { fixture: 'agent-no-model.json', expect: { decision: 'deny', contains: ['no explicit model', 'lowest sufficient tier', TIERS] } },
  { fixture: 'agent-with-model.json', expect: { decision: 'allow', contains: ['chosen tier sonnet'], absent: [TIERS] } },
  { fixture: 'wf-masking.json', expect: { decision: 'deny', contains: ['1 agent() call(s) without an explicit model', "agent('do x')"] } },
  { fixture: 'wf-clean.json', expect: { decision: 'allow', contains: ['lints clean'], absent: [TIERS] } },
  { fixture: 'wf-predefined.json', expect: { decision: 'allow', contains: ['cannot be linted'] } },
];

// Gate cases share a temp ledger so denial-logging is assertable.
const osMod = require('os');
const tmpGateLedger = path.join(osMod.tmpdir(), 'gate-deny-ledger-test-' + process.pid + '.jsonl');
const gateEnv = { ...process.env, DELEGATION_LEDGER: tmpGateLedger };

let failures = 0;
// Counted as denials happen rather than hardcoded, so adding a deny case above
// cannot silently break the denial-logging assertion below — or worse, be
// "fixed" by bumping a number until it matches.
let deniesObserved = 0;
for (const c of CASES) {
  const input = fs.readFileSync(path.join(FIXTURES, c.fixture));
  const stdout = execFileSync('node', [HOOK], { input, env: gateEnv }).toString();
  const out = JSON.parse(stdout).hookSpecificOutput;
  const decision = out.permissionDecision === 'deny' ? 'deny' : 'allow';
  if (decision === 'deny') deniesObserved++;
  const text = out.permissionDecisionReason || out.additionalContext || '';
  const problems = [];
  if (decision !== c.expect.decision) problems.push(`decision ${decision} != ${c.expect.decision}`);
  for (const s of c.expect.contains || []) if (!text.includes(s)) problems.push(`missing "${s}"`);
  for (const s of c.expect.absent || []) if (text.includes(s)) problems.push(`unexpected "${s}"`);
  if (problems.length) {
    failures++;
    console.error(`FAIL ${c.fixture}: ${problems.join('; ')}`);
  } else {
    console.log(`ok   ${c.fixture}`);
  }
}

// Ledger contract: one JSONL line per delegation, models captured.
const os = require('os');
const LEDGER_HOOK = path.join(__dirname, '..', '..', '..', 'plugins', 'delegation-tiering', 'hooks', 'delegation-ledger.js');
const tmpLedger = path.join(os.tmpdir(), 'delegation-ledger-test-' + process.pid + '.jsonl');
try {
  const env = { ...process.env, DELEGATION_LEDGER: tmpLedger };
  execFileSync('node', [LEDGER_HOOK], { input: fs.readFileSync(path.join(FIXTURES, 'agent-with-model.json')), env });
  execFileSync('node', [LEDGER_HOOK], { input: fs.readFileSync(path.join(FIXTURES, 'wf-clean.json')), env });
  const lines = fs.readFileSync(tmpLedger, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  if (lines.length === 2 && lines[0].model === 'sonnet' && Array.isArray(lines[1].modelLiterals) && lines[1].modelLiterals.join(',') === 'haiku,sonnet') {
    console.log('ok   ledger (agent + workflow entries)');
  } else {
    failures++;
    console.error('FAIL ledger: ' + JSON.stringify(lines));
  }
} catch (e) {
  failures++;
  console.error('FAIL ledger: ' + e.message);
} finally {
  try { fs.unlinkSync(tmpLedger); } catch {}
}

// scriptPath lint branches: deny via file read, silent allow when unreadable.
const tmpScript = path.join(os.tmpdir(), 'gate-scriptpath-test-' + process.pid + '.js');
fs.writeFileSync(tmpScript, "export const meta={};\nawait agent('no model here');\n");
try {
  const input = JSON.stringify({ tool_name: 'Workflow', tool_input: { scriptPath: tmpScript } });
  const out = JSON.parse(execFileSync('node', [HOOK], { input, env: gateEnv }).toString()).hookSpecificOutput;
  if (out.permissionDecision === 'deny' && (out.permissionDecisionReason || '').includes('1 agent() call(s)')) {
    deniesObserved++;
    console.log('ok   scriptPath lint (deny)');
  } else {
    failures++;
    console.error('FAIL scriptPath lint: ' + JSON.stringify(out));
  }
} catch (e) {
  failures++;
  console.error('FAIL scriptPath lint: ' + e.message);
} finally {
  try { fs.unlinkSync(tmpScript); } catch {}
}
try {
  const input = JSON.stringify({ tool_name: 'Workflow', tool_input: { scriptPath: tmpScript + '.missing' } });
  const stdout = execFileSync('node', [HOOK], { input }).toString().trim();
  if (stdout === '') console.log('ok   scriptPath unreadable (silent allow)');
  else {
    failures++;
    console.error('FAIL scriptPath unreadable: expected silence, got ' + stdout);
  }
} catch (e) {
  failures++;
  console.error('FAIL scriptPath unreadable: ' + e.message);
}

// Escape-hatch scope: the marker suppresses only the call whose span it sits
// in. Documented in hooks/README.md; pinned here because the docs previously
// claimed it worked anywhere in the script, which would have been a real
// bypass and read as one to anyone following them.
const SCOPE_CASES = [
  { name: 'marker in header does not suppress', script: "/* model-gate:allow */\nawait agent('no model');", expect: 'deny' },
  { name: 'marker inside the call suppresses it', script: "await agent('x' /* model-gate:allow */);", expect: 'allow' },
];
for (const c of SCOPE_CASES) {
  try {
    const input = JSON.stringify({ tool_name: 'Workflow', tool_input: { script: c.script } });
    const out = JSON.parse(execFileSync('node', [HOOK], { input, env: gateEnv }).toString()).hookSpecificOutput;
    const got = out.permissionDecision === 'deny' ? 'deny' : 'allow';
    if (got === 'deny') deniesObserved++;
    if (got === c.expect) console.log(`ok   ${c.name}`);
    else {
      failures++;
      console.error(`FAIL ${c.name}: got ${got}, expected ${c.expect}`);
    }
  } catch (e) {
    failures++;
    console.error(`FAIL ${c.name}: ${e.message}`);
  }
}

// The root README's ladder table is a human restatement of tiers.js — kept for
// the landing page, guarded here so the two cannot disagree about which tiers
// exist. MODELS comes from the same data the denial string is built from, so a
// renamed or added tier fails here until the README follows.
try {
  const readme = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'README.md'), 'utf8');
  const absent = MODELS.filter((t) => !readme.includes(t));
  if (absent.length === 0) console.log(`ok   README ladder names every tier (${MODELS.join(', ')})`);
  else {
    failures++;
    console.error('FAIL README ladder: tiers.js names tiers the README never mentions: ' + absent.join(', '));
  }
} catch (e) {
  failures++;
  console.error('FAIL README ladder: ' + e.message);
}

// A tool the gate has no rule for passes through untouched. Pins the explicit
// tool_name check: without it, widening the hooks.json matcher would deny every
// call to the new tool for lacking a `model` field.
try {
  const input = JSON.stringify({ tool_name: 'SomeFutureDelegationTool', tool_input: { prompt: 'x' } });
  const stdout = execFileSync('node', [HOOK], { input, env: gateEnv }).toString().trim();
  if (stdout === '') console.log('ok   unknown tool passes through');
  else {
    failures++;
    console.error('FAIL unknown tool: expected silence, got ' + stdout);
  }
} catch (e) {
  failures++;
  console.error('FAIL unknown tool: ' + e.message);
}

// Denial logging: the deny cases above must each have left a counted line.
try {
  const denies = fs.readFileSync(tmpGateLedger, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((e) => e.denied === true);
  if (denies.length === deniesObserved) console.log(`ok   denial logging (${deniesObserved} denies, all counted)`);
  else {
    failures++;
    console.error(`FAIL denial logging: ${deniesObserved} denials issued, ${denies.length} written to the ledger`);
  }
} catch (e) {
  failures++;
  console.error('FAIL denial logging: ' + e.message);
} finally {
  try { fs.unlinkSync(tmpGateLedger); } catch {}
}

// The hook's own span-boundary self-test is part of the contract.
try {
  execFileSync('node', [HOOK, '--test']);
  console.log('ok   --test (span-boundary self-check)');
} catch {
  failures++;
  console.error('FAIL --test (span-boundary self-check)');
}

process.exit(failures ? 1 : 0);
