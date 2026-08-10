#!/usr/bin/env node
// PostToolUse ledger: append one JSONL line per delegation (Agent or Workflow
// call) to ~/.claude/delegation-ledger.jsonl (override path via the
// DELEGATION_LEDGER env var). This is the observability layer the PreToolUse
// gate cannot provide: the gate forces models to be EXPLICIT; the ledger makes
// tier CHOICES reviewable (weekly summary in weekly-drift-task.ps1). If the
// ledger shows top-tier over-provisioning, the deferred hardening in
// docs/REMEDIATION.md (scoped rationale gate) has its evidence.
// ponytail: append-only, no rotation; add rotation if it ever passes ~10 MB.
const fs = require('fs');
const os = require('os');
const path = require('path');

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    return;
  }
  const ti = input.tool_input || {};
  const entry = { ts: new Date().toISOString(), tool: input.tool_name, cwd: input.cwd || null };
  if (input.tool_name === 'Agent') {
    entry.model = ti.model || null;
    entry.agentType = ti.subagent_type || null;
    entry.description = ti.description || null;
  } else if (input.tool_name === 'Workflow') {
    const src = ti.script || '';
    entry.models = [...src.matchAll(/model\s*:\s*['"]([\w.-]+)['"]/g)].map((m) => m[1]);
    entry.name = ti.name || null;
  } else {
    return;
  }
  const file = process.env.DELEGATION_LEDGER || path.join(os.homedir(), '.claude', 'delegation-ledger.jsonl');
  try {
    fs.appendFileSync(file, JSON.stringify(entry) + '\n');
  } catch {
    // The ledger must never break a session; losing one line is acceptable.
  }
});
