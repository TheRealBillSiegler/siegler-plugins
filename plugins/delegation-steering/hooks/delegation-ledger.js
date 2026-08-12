#!/usr/bin/env node
// PostToolUse ledger: append one JSONL line per delegation (Agent or Workflow
// call). Location and write live in ./ledger.js, shared with the gate. This is
// the observability layer the PreToolUse gate cannot provide: the gate forces
// models to be EXPLICIT; the ledger makes tier CHOICES reviewable (weekly
// summary in weekly-drift-task.ps1). If the ledger shows top-tier
// over-provisioning, the deferred hardening in docs/ROADMAP.md (scoped
// rationale gate) has its evidence.
//
// Runs with "async": true — it emits nothing and nothing waits on it.
// ponytail: append-only, no rotation; at ~175 B/line, 10 MB is years away.
const ledger = require('./ledger');

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
  const entry = { tool: input.tool_name, cwd: input.cwd || null };
  if (input.tool_name === 'Agent') {
    entry.model = ti.model || null;
    entry.agentType = ti.subagent_type || null;
    entry.description = ti.description || null;
  } else if (input.tool_name === 'Workflow') {
    const src = ti.script || '';
    // Named for what it is: model strings scanned out of the script text. One
    // entry per literal, not per agent spawned — a `model:` reused across a
    // fan-out appears once, and a non-agent occurrence still counts.
    entry.modelLiterals = [...src.matchAll(/model\s*:\s*['"]([\w.-]+)['"]/g)].map((m) => m[1]);
    entry.name = ti.name || null;
  } else {
    return;
  }
  ledger.append(entry);
});
