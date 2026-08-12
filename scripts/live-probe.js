#!/usr/bin/env node
// Live-fire verification of the delegation-tiering plugin in a REAL headless
// session — the layer the offline contract suite cannot reach. The contract
// suite proves the hooks' contract as implemented; this proves Claude Code
// still wires them up: spawns the hook (exec form), fires it on delegation
// tool calls, surfaces the denial, and lets the async ledger write.
//
//   node scripts/live-probe.js            probe the plugins active in your environment
//   node scripts/live-probe.js --dev      load the working-tree plugin via --plugin-dir
//
// Spends one small metered claude -p session. Runs with --debug and captures
// the debug stream, so the evidence is three independent layers:
//   1. FIRING   — debug log shows the agent-model-gate hook executing
//   2. DENYING  — the model reports both gate paths denied
//   3. RECORDING — the (temp-redirected) ledger holds denied:true lines
// A doubled denial count is expected when a legacy install is active
// alongside --dev: both registrations fire; assertions are >=, not ==.
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dev = process.argv.includes('--dev');
const ledger = path.join(os.tmpdir(), 'live-probe-ledger-' + process.pid + '.jsonl');

// The assertions below rest on the ledger, not on the model's self-report, so
// a reformatted transcript cannot fake a pass or force a spurious fail.
const PROBE =
  'Diagnostic run. Do not invoke any skill or slash command. Do exactly this and nothing else. ' +
  "Step 1: one Agent tool call, subagent_type general-purpose, prompt 'Reply with exactly: OK', and NO model parameter - deliberate; if denied, do not retry or add a model. " +
  "Step 2: one Workflow tool call whose script is exactly: export const meta={name:'probe',description:'diagnostic'}; return await agent('Reply with exactly: OK') - again deliberately no model; if the launch is denied, do not fix or retry it. " +
  "Step 3: one Agent tool call, subagent_type general-purpose, model haiku, prompt 'Reply with exactly: OK' - this one SHOULD run; wait for it. " +
  "Step 4: output exactly three lines and nothing more: 'GATE-AGENT: DENIED' or 'GATE-AGENT: ALLOWED', then 'GATE-WORKFLOW: DENIED' or 'GATE-WORKFLOW: ALLOWED', then 'ALLOW-PATH: RAN' or 'ALLOW-PATH: BLOCKED'.";

// The probe session gets an explicit model at the lowest sufficient tier: it
// follows four instructions, it does not think.
// The prompt travels via STDIN, never argv: with shell:true (needed on
// Windows, where claude is a .cmd shim) spawnSync does not quote arguments,
// and a prompt on argv shatters at the first space — observed live
// 2026-08-12, when the session received only the word "Diagnostic".
const args = ['-p', '--debug', '--model', 'haiku'];
if (dev) args.unshift('--plugin-dir', path.join(__dirname, '..', 'plugins', 'delegation-tiering'));

console.log('probing' + (dev ? ' (working-tree plugin via --plugin-dir)' : ' (installed plugins)') + ' — one metered session...');
const run = spawnSync('claude', args, {
  encoding: 'utf8',
  shell: process.platform === 'win32', // claude is a .cmd shim on Windows
  input: PROBE,
  env: { ...process.env, DELEGATION_LEDGER: ledger },
  timeout: 300000,
});
const out = (run.stdout || '') + '\n' + (run.stderr || '');

let failures = 0;
const check = (name, ok, detail) => {
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!ok) failures++;
};

// 1. FIRING + RECORDING, from ground truth: denied:true lines in the
// redirected ledger prove the hook was spawned (exec form, live), ran its
// logic on both paths, and wrote its record — independent of anything the
// model chose to say.
// The PostToolUse ledger runs async, and whether the CLI waits for
// outstanding async hooks before exiting is docs-silent — so the read polls
// briefly rather than racing a background write into a spurious FAIL.
const readLedger = () => {
  try {
    return fs.readFileSync(ledger, 'utf8').trim().split('\n')
      .map((l) => { try { return JSON.parse(l); } catch { return {}; } });
  } catch { return []; }
};
let entries = readLedger();
for (let i = 0; i < 10 && !entries.some((e) => e.tool === 'Agent' && !e.denied); i++) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300); // sync sleep, no shell
  entries = readLedger();
}
const denies = entries.filter((e) => e.denied === true);
check('fired + recorded (denied:true ledger lines)', denies.length >= 2, denies.length + ' lines');
check('both paths denied (Agent and Workflow in ledger)',
  denies.some((e) => e.tool === 'Agent') && denies.some((e) => e.tool === 'Workflow'));

// The allowed call exercises the OTHER hook: the async PostToolUse ledger,
// which only fires when a delegation actually runs. Its entry proves the
// async spawn wrote after the tool completed.
check('allow path recorded by the async ledger (model captured)',
  entries.some((e) => e.tool === 'Agent' && e.model === 'haiku' && !e.denied));

// 2. DENIAL REACHED THE SESSION: the transcript acknowledges the denials.
// The exact GATE- lines are requested, but a skill hijack can reformat the
// report (observed once), so any denial acknowledgement counts.
check('transcript reflects denial', /GATE-AGENT:\s*DENIED/.test(out) || /denied/i.test(out));

// 3. DEBUG TRACE (informational): whether `claude -p --debug` names hook
// commands in its stream is docs-silent; report, don't fail.
console.log((/agent-model-gate/i.test(out) ? 'info ' : 'info ') + 'debug stream ' + (/agent-model-gate/i.test(out) ? 'names' : 'does not name') + ' the gate hook (informational — docs-silent for print mode)');

try { fs.unlinkSync(ledger); } catch {}

if (failures && !/GATE-/.test(out)) {
  console.error('\nNo GATE- lines at all — the session may have failed before probing. Tail of output:');
  console.error(out.slice(-2000));
}
process.exit(failures ? 1 : 0);
