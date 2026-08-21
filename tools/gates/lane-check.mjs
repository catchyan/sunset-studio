#!/usr/bin/env node
/**
 * G2 lane gate.
 *
 * The ownership table is the only input. Parsing that markdown directly, rather
 * than keeping a JSON copy beside it, is deliberate: a second copy is a second
 * truth, and the two will disagree on the day it matters.
 *
 * Usage: node tools/gates/lane-check.mjs <BRANCH> [BASE_REF]
 * Exit:  0 in lane, 1 out of lane, 2 usage or parse error.
 */

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  ANYONE,
  FRAMEWORK,
  GateError,
  HUMAN,
  PIN,
  SELF,
  TASK_AUTHOR,
  baseOwnership,
  diffEntries,
  dispatchedCard,
  fencedGlobs,
  globToRegex,
  ownerOf,
  ownershipPath,
  parseBranch,
  parseOwnership,
  section,
} from './lib.mjs';

const OVERRIDE_LABEL = 'lane-override';
const HUMAN_LABEL = 'human-change';
const BREAK_GLASS_LABEL = 'break-glass';
const ANDON = 'board/andon.md';

function labels() {
  return (process.env.PR_LABELS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * An exception needs two independent acts, because one act is something a bot
 * can do to itself. The label requires repository write access and lands in the
 * PR timeline; the card entry has to be on the base branch, which means it was
 * dispatched and merged before the work started.
 *
 * Not cryptographic: today every agent drives the same account, so nothing here
 * proves who added the label. It is auditable rather than preventive — both acts
 * are timestamped in the timeline, and the gatekeeper reviews every labelled
 * pull request instead of sampling it.
 */
function declaredPaths(card, label) {
  if (!labels().includes(label)) return [];
  return fencedGlobs(section(card, '## 3. Lane'));
}

function main() {
  const [branch, baseRef = 'origin/main'] = process.argv.slice(2);
  if (!branch) {
    console.error('Usage: node tools/gates/lane-check.mjs <BRANCH> [BASE_REF]');
    return 2;
  }

  // board/<CODE>/<slug> carries no task, so it grants no exceptions and expands no
  // <TASK> glob. It is still lane-checked: recording something is not a licence to
  // record it in another role's file.
  const board = branch.match(/^board\/([A-Z]\d)\/[a-z0-9][a-z0-9-]*$/);
  const parsed = board ? { botCode: board[1], taskId: null } : parseBranch(branch);
  if (!parsed) {
    console.error(`Branch "${branch}" is neither lane/<CODE>/T-XXX nor board/<CODE>/<slug>.`);
    console.error('The envelope gate explains why.');
    return 2;
  }
  const { botCode, taskId } = parsed;

  const table = ownershipPath();

  // Permissions come from the base branch. Reading the table from the branch
  // meant the table's owner could grant themselves a path in the same commit
  // that used it, and the gate would agree with the grant it was handed.
  const priorRows = baseOwnership(baseRef, table);
  const headRows = parseOwnership(readFileSync(table, 'utf8'));
  const rows = priorRows ?? headRows;
  if (!priorRows) {
    console.log(`  note: no ${table} on ${baseRef}; this repository is being bootstrapped.`);
  }

  const entries = diffEntries(baseRef);
  const card = taskId ? dispatchedCard(baseRef, taskId) : null;

  console.log(
    `lane gate · bot=${botCode} · ${taskId ? `task=${taskId}` : 'board branch'} · table=${table} · ${entries.length} path(s)`
  );
  if (entries.length === 0) return 0;

  const overrides = declaredPaths(card, OVERRIDE_LABEL);
  const humanChanges = declaredPaths(card, HUMAN_LABEL);
  const touchesPin = entries.some((e) => e.path === PIN);
  const violations = [];

  for (const entry of entries) {
    const file = entry.path;

    // A path that does not exist yet cannot have a row on the base branch, so a
    // new file is judged against the table on the branch. That is not a hole:
    // adding the row is itself a change to the table, and the table has an
    // owner, so this gate has already refused the row unless it was allowed.
    const row = entry.status === 'A' ? (ownerOf(file, rows, taskId) ?? ownerOf(file, headRows, taskId)) : ownerOf(file, rows, taskId);

    const origin = entry.renamedFrom
      ? ` (renamed from ${entry.renamedFrom})`
      : entry.renamedTo
        ? ` (renamed to ${entry.renamedTo})`
        : '';

    if (!row) {
      violations.push({
        file: file + origin,
        why: 'No glob in the ownership table covers it. Add the path to the table before creating it.',
      });
      continue;
    }

    // The human has to be able to amend the constitution, and every change goes
    // through a pull request like everything else. Without a route, the only way
    // to amend it would be an administrator force-push — and a rule whose own
    // amendment procedure requires breaking the rules is not a rule for long.
    // Deliberately a separate label from lane-override, so these are countable.
    if (row.owner === HUMAN) {
      if (humanChanges.some((g) => g === file || globToRegex(g).test(file))) {
        console.log(`  human-change: ${file} — labelled and declared in ${taskId}`);
        continue;
      }
      violations.push({
        file: file + origin,
        why:
          'Reserved for the human. Amending it needs the "human-change" label and the path\n' +
          `      listed in the fenced block of section 3 of ${taskId}, on ${baseRef}.`,
      });
      continue;
    }

    // The mirror has exactly one legal way to change: as part of moving the pin.
    // Whether the new content really is that version is G1's job; this gate only
    // checks that the change is shaped like an upgrade.
    if (row.owner === FRAMEWORK) {
      if (!touchesPin) {
        violations.push({
          file: file + origin,
          why:
            `The framework mirror only changes by moving ${PIN}, and this diff does not touch it.\n` +
            '      To change the framework: open a PR in the studio repo, cut a release, then re-mount here.',
        });
      }
      continue;
    }

    if (row.owner === SELF) {
      const stem = file.split('/').pop().replace(/\.md$/, '');
      if (stem !== botCode) {
        violations.push({ file: file + origin, why: `This file belongs to ${stem}; you are ${botCode}.` });
      }
      continue;
    }

    if (row.owner === TASK_AUTHOR) {
      // The <TASK> token was expanded with this branch's task id, so a match
      // already proves the path belongs to the task being worked on.
      continue;
    }

    if (row.owner === ANYONE) continue;
    if (row.owner === botCode) continue;

    if (overrides.some((g) => g === file || globToRegex(g).test(file))) {
      console.log(`  override: ${file} (owner ${row.owner}) — labelled and declared in ${taskId}`);
      continue;
    }

    violations.push({ file: file + origin, why: `Owned by ${row.owner}; you are ${botCode}.` });
  }

  if (violations.length === 0) {
    console.log('OK: every changed file is in lane.');
    return 0;
  }

  // A card grants paths, and a card is read from the base branch — so a repair to the
  // dispatch mechanism itself has no way to grant itself anything. Break-glass covers
  // this gate for the same reason it covers the envelope gate: the repository has to be
  // repairable through a pull request even when the thing being repaired is the rule the
  // pull request would have to satisfy. The price is unchanged: a label, an andon entry
  // in the same diff, and a full review.
  if (labels().includes(BREAK_GLASS_LABEL) && entries.some((e) => e.path === ANDON)) {
    console.warn(`\nBREAK-GLASS: ${violations.length} out-of-lane path(s) downgraded to warnings.\n`);
    for (const v of violations) console.warn(`  ${v.file}\n    -> ${v.why}`);
    console.warn('\nThe gatekeeper reviews every one of these by hand before this merges.');
    return 0;
  }

  console.error('\nFAIL: out of lane. Out-of-lane changes are rejected without reading the content.\n');
  for (const v of violations) console.error(`  ${v.file}\n    -> ${v.why}`);
  console.error(
    taskId
      ? `
Three ways forward:
  1. Drop these changes and ask the owning bot to make them.
  2. Get the change authorised: the dispatcher lists the path in the fenced block of
     section 3 of ${taskId}'s card and merges that card, then someone with write
     access adds the "${OVERRIDE_LABEL}" label. Every labelled PR is reviewed by the
     gatekeeper, not sampled.
  3. If the table itself is wrong, ask A1 to change the table. Do not route around it.
`
      : `
A board branch grants no exceptions, because it has no card to declare them on. Either
write only to files you own, or do this as a task on lane/${botCode}/T-XXX.
`
  );
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exit(main());
  } catch (err) {
    if (err instanceof GateError) {
      console.error(`FAIL: ${err.message}`);
      process.exit(2);
    }
    throw err;
  }
}

export { declaredPaths };
