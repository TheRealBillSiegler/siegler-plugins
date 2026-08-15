// Shared ledger location and append, used by both hooks. They write the same
// file for complementary halves of the record — the gate logs denials, which
// never reach PostToolUse because the call is blocked before it runs, and the
// ledger logs delegations that actually ran — so the path rule and the write
// belong in one place rather than in both.
const fs = require('fs');
const os = require('os');
const path = require('path');

// Precedence, most specific first:
//   DELEGATION_LEDGER   explicit override; contract tests use it
//   CLAUDE_PLUGIN_DATA  the per-plugin directory Claude Code exports to hook
//                       processes, survives updates, and deletes on uninstall
//                       unless `--keep-data` is passed
//   ~/.claude           fallback for runs outside a plugin context (direct
//                       invocation, --plugin-dir before the var is exported)
function ledgerFile() {
  if (process.env.DELEGATION_LEDGER) return process.env.DELEGATION_LEDGER;
  if (process.env.CLAUDE_PLUGIN_DATA) return path.join(process.env.CLAUDE_PLUGIN_DATA, 'delegation-ledger.jsonl');
  return path.join(os.homedir(), '.claude', 'delegation-ledger.jsonl');
}

function append(entry) {
  try {
    const file = ledgerFile();
    // The data directory is documented as created on first reference, but a
    // missing parent would otherwise fail silently and stop the ledger dead.
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch {
    // Recording must never break a session or block the gate's decision.
    // Losing one line is acceptable; losing a delegation is not.
  }
}

module.exports = { ledgerFile, append };
