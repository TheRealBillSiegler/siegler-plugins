#!/usr/bin/env node
// Contract tests for hooks/agent-model-gate.js: pipe each fixture to the hook
// and assert the decision and message substrings. Pure and offline — verifies
// the hook's contract as implemented, NOT whether Claude Code still routes
// Agent/Workflow calls to it (that's the /delegation-steering:canary command).
// Run from the plugin root: node evals/contract/run-contract-tests.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOOK = path.join(__dirname, '..', '..', 'hooks', 'agent-model-gate.js');
const FIXTURES = path.join(__dirname, 'fixtures');

const CASES = [
  { fixture: 'agent-no-model.json', expect: { decision: 'deny', contains: ['no explicit model', 'lowest sufficient tier'] } },
  { fixture: 'agent-with-model.json', expect: { decision: 'allow', contains: ['chosen tier sonnet'], absent: ['haiku=mechanical'] } },
  { fixture: 'wf-masking.json', expect: { decision: 'deny', contains: ['1 agent() call(s) without an explicit model', "agent('do x')"] } },
  { fixture: 'wf-clean.json', expect: { decision: 'allow', contains: ['lints clean'], absent: ['haiku=mechanical'] } },
  { fixture: 'wf-predefined.json', expect: { decision: 'allow', contains: ['cannot be linted'] } },
];

let failures = 0;
for (const c of CASES) {
  const input = fs.readFileSync(path.join(FIXTURES, c.fixture));
  const stdout = execFileSync('node', [HOOK], { input }).toString();
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

// The hook's own span-boundary self-test is part of the contract.
try {
  execFileSync('node', [HOOK, '--test']);
  console.log('ok   --test (span-boundary self-check)');
} catch {
  failures++;
  console.error('FAIL --test (span-boundary self-check)');
}

process.exit(failures ? 1 : 0);
