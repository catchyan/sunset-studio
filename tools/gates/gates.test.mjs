#!/usr/bin/env node
/**
 * Self-test for the gate engine.
 *
 * The gates decide what may merge, so they need tests more than the game code
 * does. The first run of this file found a bug in glob matching that had been
 * quietly approving out-of-lane changes. A gate that only looks like it works is
 * worse than no gate at all.
 *
 * Usage: node tools/gates/gates.test.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import {
  SELF_GOVERNING,
  fencedGlobs,
  globToRegex,
  ownerOf,
  parseBranch,
  parseDiffZ,
  parseOwnership,
  section,
} from './lib.mjs';

let failed = 0;

function check(desc, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failed += 1;
    console.error(`  FAIL ${desc}\n       expected ${JSON.stringify(expected)}\n       actual   ${JSON.stringify(actual)}`);
  }
  return ok;
}

// ── glob matching ─────────────────────────────────────────────────────────
const matches = (glob, path) => globToRegex(glob).test(path);

console.log('glob matching');
check('dir/** matches a direct child', matches('packages/sim/**', 'packages/sim/index.ts'), true);
check('dir/** matches a deep child', matches('packages/sim/**', 'packages/sim/a/b/c.ts'), true);
check('dir/** does not match a sibling', matches('packages/sim/**', 'packages/simx/index.ts'), false);
check('dir/** does not match the bare dir path', matches('packages/sim/**', 'packages/sim'), false);
check('* stops at a slash', matches('board/*.md', 'board/a/b.md'), false);
check('* matches within one segment', matches('board/*.md', 'board/backlog.md'), true);
check('exact path matches itself', matches('AGENTS.md', 'AGENTS.md'), true);
check('exact path is anchored', matches('AGENTS.md', 'docs/AGENTS.md'), false);
check('dots are literal', matches('tsconfig.json', 'tsconfigXjson'), false);

// ── longest glob wins ─────────────────────────────────────────────────────
console.log('specificity');
const rows = [
  { glob: 'packages/client/**', owner: 'E2' },
  { glob: 'packages/client/src/render/**', owner: 'V1' },
  { glob: 'evidence/<TASK>/**', owner: 'TASK-AUTHOR' },
];
check('general glob applies by default', ownerOf('packages/client/src/app.ts', rows)?.owner, 'E2');
check('specific glob overrides it', ownerOf('packages/client/src/render/pass.ts', rows)?.owner, 'V1');
check('unmatched path has no owner', ownerOf('packages/sim/x.ts', rows), null);

// ── <TASK> expansion ──────────────────────────────────────────────────────
// The literal-token bug this replaces blocked every evidence pack the team
// would ever produce, and it did so on the very first task.
console.log('task token');
check('<TASK> expands to the branch task', ownerOf('evidence/T-123/output.txt', rows, 'T-123')?.owner, 'TASK-AUTHOR');
check('another task id does not match', ownerOf('evidence/T-999/output.txt', rows, 'T-123'), null);
check('unexpanded token matches nothing real', ownerOf('evidence/T-123/output.txt', rows), null);

// ── branch parsing ────────────────────────────────────────────────────────
console.log('branch parsing');
check('canonical branch', parseBranch('lane/A1/T-042'), { botCode: 'A1', taskId: 'T-042' });
check('four digit task id', parseBranch('lane/E2/T-1001'), { botCode: 'E2', taskId: 'T-1001' });
check('missing task id', parseBranch('lane/A1/studio-split'), null);
check('trailing segment', parseBranch('lane/A1/T-042/extra'), null);
check('lowercase code', parseBranch('lane/a1/T-042'), null);
check('undefined', parseBranch(undefined), null);

// ── section extraction ────────────────────────────────────────────────────
console.log('section extraction');
const card = ['## 3. Lane', '', '`docs/**`', '`tools/**`', '', '## 4. Contracts', '', 'none'].join('\n');
check('reads the right section', section(card, '## 3. Lane').includes('docs/**'), true);
check('stops at the next heading', section(card, '## 3. Lane').includes('none'), false);
check('missing section is null', section(card, '## 9. Nope'), null);

// ── granted paths come from the fence, not from every backtick ────────────
// A card that spelled out what the assignee must not touch was granting it,
// because the gate read prohibitions and permissions with the same regex.
console.log('fenced grants');
const lane = [
  '',
  'Do not touch `packages/sim/**` under any circumstances.',
  '',
  '```',
  'docs/01-game/**',
  'board/tasks/T-042.md   # the card itself',
  '',
  '```',
  '',
  'See also `docs/02-tech/architecture.md`.',
].join('\n');
check('reads the fenced block', fencedGlobs(lane), ['docs/01-game/**', 'board/tasks/T-042.md']);
check('a prohibition outside the fence grants nothing', fencedGlobs(lane).includes('packages/sim/**'), false);
check('no fence grants nothing', fencedGlobs('`docs/**` is yours'), []);
check('no section at all grants nothing', fencedGlobs(null), []);

// ── renames are two events, not one ───────────────────────────────────────
// Without -M, `git mv` out of somebody else's lane looked like a plain addition
// in yours, and the file it came from was never checked against its owner.
console.log('diff parsing');
check('modification', parseDiffZ('M\0docs/a.md\0'), [{ status: 'M', path: 'docs/a.md' }]);
check(
  'rename becomes a delete and an add',
  parseDiffZ('R100\0docs/00-charter/vision.md\0packages/sim/vision.md\0').map((e) => [e.status, e.path]),
  [
    ['D', 'docs/00-charter/vision.md'],
    ['A', 'packages/sim/vision.md'],
  ]
);
check('paths with spaces survive', parseDiffZ('A\0docs/a b.md\0')[0].path, 'docs/a b.md');
check('empty diff', parseDiffZ(''), []);

// ── files that decide the verdict ─────────────────────────────────────────
console.log('self-governing paths');
check('the workflow', SELF_GOVERNING.test('.github/workflows/gates.yml'), true);
check('a gate', SELF_GOVERNING.test('tools/gates/lane-check.mjs'), true);
check('the project ownership table', SELF_GOVERNING.test('docs/03-process/ownership.md'), true);
check('ordinary code is not', SELF_GOVERNING.test('packages/sim/combat.ts'), false);

// ── ownership table parsing ───────────────────────────────────────────────
console.log('table parsing');
const table = [
  '| Path glob | Owner | Note |',
  '|---|---|---|',
  '| `docs/**` | **S1** | bold owner |',
  '| not a glob | P0 | ignored |',
].join('\n');
check('parses one row', parseOwnership(table).length, 1);
check('strips bold markers', parseOwnership(table)[0].owner, 'S1');

// ── this repo's own table ─────────────────────────────────────────────────
// Only meaningful in the studio repo. In a project repo this same file runs
// from the mirror, where the studio's table does not exist, and asserting on it
// would fail for a reason that has nothing to do with the project.
if (!existsSync('.studio-version') && existsSync('OWNERSHIP.md')) {
  console.log("this repo's ownership table");
  const own = parseOwnership(readFileSync('OWNERSHIP.md', 'utf8'));
  const owner = (f) => ownerOf(f, own)?.owner ?? '(none)';

  check('the constitution is reserved for the human', owner('docs/00-charter/constitution.md'), 'HUMAN');
  check('gate code belongs to the gatekeeper', owner('tools/gates/lane-check.mjs'), 'Q1');
  check('the changelog is append-shared', owner('CHANGELOG.md'), 'ANYONE');
  check('role cards belong to the governor', owner('docs/02-roles/A1.md'), 'P0');

  const orphans = ['AGENTS.md', 'README.md', 'OWNERSHIP.md', 'CHANGELOG.md', '.gitignore'].filter(
    (f) => existsSync(f) && !ownerOf(f, own)
  );
  check('no top-level file is unowned', orphans, []);
}

if (failed) {
  console.error(`\nFAIL: ${failed} assertion(s).`);
  process.exit(1);
}
console.log('\nOK: gate engine behaves as specified.');
