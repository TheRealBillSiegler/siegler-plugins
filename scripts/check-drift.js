#!/usr/bin/env node
// Deterministic drift detection for the claims this plugin anchors to living
// sources: the Claude Code doc pages it cites, plus the installed Claude Code
// version. Compares SHA-256 of each page body against scripts/anchors.json.
//
// The watched set is derived from the pages the shipped skills and the
// coverage matrix actually cite, not maintained as a list here. Citing a new
// page in a claim is what puts it under watch; a hand-kept list goes stale
// silently, leaving the newest claim the only unwatched one.
//
//   node scripts/check-drift.js           exit 0 = no drift; exit 1 = drift (prints what changed)
//   node scripts/check-drift.js --update  rewrite anchors.json from current state
//
// Detection is deterministic and free; acting on drift is agentic and
// deliberately separate — see docs/REMEDIATION.md.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ANCHORS = path.join(__dirname, 'anchors.json');
const REPO = path.join(__dirname, '..');
// Where claims cite their doc basis. Not every markdown file in the repo: a
// link in a README is orientation, not a claim under watch. Every shipped
// plugin's skills are claim-bearing, so the set is enumerated, not named.
const CITING = [
  ...fs
    .readdirSync(path.join(REPO, 'plugins'))
    .map((p) => path.join(REPO, 'plugins', p, 'skills'))
    .filter((p) => fs.existsSync(p)),
  path.join(REPO, 'docs', 'COVERAGE.md'),
];

function markdownFiles(target) {
  if (fs.statSync(target).isFile()) return [target];
  return fs
    .readdirSync(target, { recursive: true })
    .map((f) => path.join(target, f))
    .filter((f) => f.endsWith('.md') && fs.statSync(f).isFile());
}

function anchoredUrls() {
  const pages = new Set();
  for (const source of CITING) {
    for (const file of markdownFiles(source)) {
      const text = fs.readFileSync(file, 'utf8');
      // Normalize: a page is cited with or without the .md suffix, and may
      // carry a #fragment. All forms name the same page body.
      for (const m of text.matchAll(/code\.claude\.com\/docs\/en\/([a-z0-9-]+)/g)) {
        pages.add(`https://code.claude.com/docs/en/${m[1]}.md`);
      }
    }
  }
  return [...pages].sort();
}

const URLS = anchoredUrls();

function claudeVersion() {
  try {
    // execSync with a shell is deliberate: the command is a constant literal
    // (no interpolated input, so no injection surface), and on Windows the
    // `claude` CLI is a .cmd shim that execFileSync cannot run without a shell.
    return execSync('claude --version', { encoding: 'utf8', timeout: 30000 }).trim();
  } catch {
    return 'unknown';
  }
}

async function currentState() {
  const state = { capturedAt: new Date().toISOString(), claudeVersion: claudeVersion(), pages: {} };
  for (const url of URLS) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    const body = await res.text();
    state.pages[url] = crypto.createHash('sha256').update(body).digest('hex');
  }
  return state;
}

(async () => {
  const state = await currentState();
  if (process.argv[2] === '--update') {
    fs.writeFileSync(ANCHORS, JSON.stringify(state, null, 2) + '\n');
    console.log('anchors.json updated at ' + state.capturedAt);
    return;
  }
  if (!fs.existsSync(ANCHORS)) {
    console.error('No anchors.json — run with --update first.');
    process.exit(1);
  }
  const baseline = JSON.parse(fs.readFileSync(ANCHORS, 'utf8'));
  const drift = [];
  if (state.claudeVersion !== baseline.claudeVersion) {
    drift.push(`claude version: ${baseline.claudeVersion} -> ${state.claudeVersion}`);
  }
  for (const url of URLS) {
    if (!baseline.pages[url]) drift.push(`new anchored page (no baseline): ${url}`);
    else if (baseline.pages[url] !== state.pages[url]) drift.push(`changed: ${url}`);
  }
  if (drift.length) {
    console.log('DRIFT DETECTED (baseline ' + baseline.capturedAt + '):');
    for (const d of drift) console.log('  - ' + d);
    process.exit(1);
  }
  console.log('No drift (baseline ' + baseline.capturedAt + ', claude ' + baseline.claudeVersion + ').');
})().catch((e) => {
  console.error('drift check errored: ' + e.message);
  process.exit(2);
});
