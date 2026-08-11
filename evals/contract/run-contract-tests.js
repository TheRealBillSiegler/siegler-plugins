#!/usr/bin/env node
// Contract tests for the agent-model-gate hook: pipe each fixture to the hook
// and assert the decision and message substrings. Pure and offline — verifies
// the hook's contract as implemented, NOT whether Claude Code still routes
// Agent/Workflow calls to it (that's the /delegation-steering:canary command).
// Run from the repo root: node evals/contract/run-contract-tests.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOOK = path.join(__dirname, '..', '..', 'plugins', 'delegation-steering', 'hooks', 'agent-model-gate.js');
const FIXTURES = path.join(__dirname, 'fixtures');

const CASES = [
  { fixture: 'agent-no-model.json', expect: { decision: 'deny', contains: ['no explicit model', 'lowest sufficient tier'] } },
  { fixture: 'agent-with-model.json', expect: { decision: 'allow', contains: ['chosen tier sonnet'], absent: ['haiku=mechanical'] } },
  { fixture: 'wf-masking.json', expect: { decision: 'deny', contains: ['1 agent() call(s) without an explicit model', "agent('do x')"] } },
  { fixture: 'wf-clean.json', expect: { decision: 'allow', contains: ['lints clean'], absent: ['haiku=mechanical'] } },
  { fixture: 'wf-predefined.json', expect: { decision: 'allow', contains: ['cannot be linted'] } },
];

// Gate cases share a temp ledger so denial-logging is assertable.
const osMod = require('os');
const tmpGateLedger = path.join(osMod.tmpdir(), 'gate-deny-ledger-test-' + process.pid + '.jsonl');
const gateEnv = { ...process.env, DELEGATION_LEDGER: tmpGateLedger };

let failures = 0;
for (const c of CASES) {
  const input = fs.readFileSync(path.join(FIXTURES, c.fixture));
  const stdout = execFileSync('node', [HOOK], { input, env: gateEnv }).toString();
  const out = JSON.parse(stdout).hookSpecificOutput;
  const decision = out.permissionDecision === 'deny' ? 'deny' : 'allow';
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
const LEDGER_HOOK = path.join(__dirname, '..', '..', 'plugins', 'delegation-steering', 'hooks', 'delegation-ledger.js');
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

// Denial logging: the three deny cases above must each have left a counted line.
try {
  const denies = fs.readFileSync(tmpGateLedger, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((e) => e.denied === true);
  if (denies.length === 3) console.log('ok   denial logging (3 denies counted)');
  else {
    failures++;
    console.error('FAIL denial logging: expected 3, got ' + denies.length);
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
