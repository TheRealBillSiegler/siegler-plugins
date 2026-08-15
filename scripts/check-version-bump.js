#!/usr/bin/env node
// Fails when a PR changes files that ship inside a plugin without raising that
// plugin's version. Claude Code uses the version in plugin.json as the cache key
// for updates: with a version pinned, "users get updates only when you bump this
// field. Pushing new commits without bumping it has no effect, and /plugin update
// reports 'already at the latest version'"
// (https://code.claude.com/docs/en/plugins-reference#version-management).
// So an unbumped change to plugins/** ships to nobody — silently, and looking
// like success. This guard is the deterministic backstop for that.
//
// Everything outside plugins/ (docs/, evals/, scripts/, root README) is repo
// apparatus that never reaches an installer, so it needs no bump.
//
// The comparison baseline is what installers can actually have: the version on
// origin/main, the branch the marketplace serves. A plugin or version that has
// never reached main shipped to nobody, so payload changes under it need no
// bump. If origin/main is unreachable, the guard falls back to comparing
// against the PR base — stricter, never weaker — and says so.
//
// Usage: node scripts/check-version-bump.js <baseSha> [headSha]
const { execFileSync } = require('child_process');

const [, , base, head = 'HEAD'] = process.argv;
if (!base) {
  console.error('usage: check-version-bump.js <baseSha> [headSha]');
  process.exit(2);
}

// stderr ignored: probing refs that legitimately lack a path (new or removed
// plugins) makes git print "fatal:" noise the catch already handles.
const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });

// A base we cannot read means we cannot compare. Warn rather than block: this
// job only runs on pull_request, where base.sha is present, so the realistic
// cause is a git edge case rather than a missing bump.
try {
  git(['cat-file', '-e', base]);
} catch {
  console.warn('WARN base ' + base + ' is unreachable — skipping version check');
  process.exit(0);
}

const mainRef = (() => {
  try {
    return git(['rev-parse', '--verify', 'origin/main']).trim();
  } catch {
    return null;
  }
})();
if (!mainRef) console.warn('WARN origin/main unreachable — comparing against the PR base instead of the released baseline (fetch it with: git fetch origin main)');

const changed = git(['diff', '--name-only', base, head]).split('\n').filter(Boolean);
const touched = [...new Set(changed.map((f) => /^plugins\/([^/]+)\//.exec(f)?.[1]).filter(Boolean))];

if (!touched.length) {
  console.log('ok   no plugin payload changed — version bump not required');
  process.exit(0);
}

const parse = (v) => String(v).split('.').map((n) => parseInt(n, 10) || 0);
const isGreater = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
};

const versionAt = (ref, plugin) => {
  const path = 'plugins/' + plugin + '/.claude-plugin/plugin.json';
  try {
    return JSON.parse(git(['show', ref + ':' + path])).version;
  } catch {
    return null; // plugin (or its manifest) did not exist at this ref
  }
};

let failures = 0;
for (const plugin of touched) {
  const before = versionAt(base, plugin);
  const after = versionAt(head, plugin);
  const files = changed.filter((f) => f.startsWith('plugins/' + plugin + '/'));

  const dirAtHead = git(['ls-tree', '--name-only', head, 'plugins/' + plugin]).trim() !== '';
  if (after == null && !dirAtHead) {
    // The whole plugin is gone at head: a removal or rename, not an unbumped
    // change. Nothing ships, so nothing needs a version.
    console.log('ok   ' + plugin + ': removed at head — no version required');
  } else if (after == null) {
    failures++;
    console.error('FAIL ' + plugin + ': plugins/' + plugin + '/.claude-plugin/plugin.json is missing or unreadable');
  } else {
    // Absence at the PR base is not absence for installers: a plugin deleted on
    // the base branch but still on origin/main (deleted, then re-added later)
    // is compared against the released version like any other change.
    const released = mainRef ? versionAt(mainRef, plugin) : before;
    if (released == null) {
      console.log('ok   ' + plugin + ': ' + (before == null
        ? 'new plugin at version ' + after
        : 'never released on main — version ' + after + ' needs no bump'));
    } else if (isGreater(after, released)) {
      console.log('ok   ' + plugin + ': released ' + released + ' -> ' + after + ' at head (' + files.length + ' shipped file(s) changed)');
    } else {
      failures++;
      console.error(
        'FAIL ' + plugin + ': version ' + after + ' does not exceed released ' + released + ' but ' + files.length + ' shipped file(s) changed:\n' +
          files.map((f) => '       ' + f).join('\n') +
          '\n       Raise "version" in plugins/' + plugin + '/.claude-plugin/plugin.json above the version main serves, or installers will never receive this change.'
      );
    }
  }
}

process.exit(failures ? 1 : 0);
