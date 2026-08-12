#!/usr/bin/env node
// Dead-reference checker, two phases. Run from the repo root; exit 1 on any hit.
//
// 1. Repo-wide: every relative markdown link resolves to a real file, and every
//    #anchor matches a heading in the target under GitHub's slug rules
//    (lowercase, punctuation stripped, each space becomes one hyphen — an em
//    dash between spaces therefore yields a double hyphen).
// 2. Payload containment: a markdown link inside plugins/<name>/ must resolve
//    WITHIN that plugin or be an absolute URL. The repo tree makes ../sibling
//    links look fine, but an installer's cache holds one plugin directory, so
//    anything relative that escapes the plugin is dead exactly where it ships.
//
// Prose references (backticked paths, "this plugin's X") are not checked here:
// a lint precise enough to avoid flagging correctly-qualified repo references
// would be a parser, not a grep. That class stays with human/agent review.
const fs = require('fs');
const path = require('path');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) files.push(p);
  }
})('.');

const slug = (t) => t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/ /g, '-');
const anchors = {};
for (const f of files) {
  anchors[path.resolve(f)] = new Set(
    [...fs.readFileSync(f, 'utf8').matchAll(/^#+\s+(.*)$/gm)].map((m) => slug(m[1]))
  );
}

const pluginRootOf = (f) => {
  const m = /^plugins[\\/]([^\\/]+)[\\/]/.exec(path.relative('.', f));
  return m ? path.resolve('plugins', m[1]) : null;
};

let checked = 0;
const bad = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const plugin = pluginRootOf(f);
  for (const m of src.matchAll(/\]\(([^)\s]+)\)/g)) {
    const url = m[1];
    if (/^(https?:|mailto:)/.test(url)) continue;
    checked++;
    const [rel, anchor] = url.split('#');
    const target = rel ? path.resolve(path.dirname(f), rel) : path.resolve(f);
    if (rel && !fs.existsSync(target)) {
      bad.push(`${f} -> ${url} (missing target)`);
      continue;
    }
    if (anchor && fs.existsSync(target) && fs.statSync(target).isFile() && anchors[target] && !anchors[target].has(anchor)) {
      bad.push(`${f} -> ${url} (missing anchor)`);
    }
    if (plugin && rel && !(target + path.sep).startsWith(plugin + path.sep) && target !== plugin) {
      bad.push(`${f} -> ${url} (escapes the plugin: dead in an installed cache — use an absolute URL)`);
    }
  }
}

console.log(`${checked} relative links checked across ${files.length} markdown files`);
if (bad.length) {
  console.error('DEAD REFERENCES:');
  for (const b of bad) console.error('  ' + b);
  process.exit(1);
}
console.log('all resolve; plugin payloads self-contained');
