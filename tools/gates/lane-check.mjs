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
  backtickedGlobs,
  changedFiles,
  globToRegex,
  ownerOf,
  ownershipPath,
  parseBranch,
  parseOwnership,
  readTaskCard,
  section,
} from './lib.mjs';

const OVERRIDE_LABEL = 'lane-override';

/**
 * An override needs two independent acts, because one act is something a bot
 * can do to itself. The label requires repository write access and lands in the
 * PR timeline; the task card entry has to be written by the task's dispatcher
 * before the work starts. Free text in a PR body was neither.
 */
function allowedOverrides(taskId) {
  const labels = (process.env.PR_LABELS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!labels.includes(OVERRIDE_LABEL)) return [];
  const lane = section(readTaskCard(taskId), '## 3. Lane');
  return backtickedGlobs(lane);
}

function main() {
  const [branch, baseRef = 'origin/main'] = process.argv.slice(2);
  if (!branch) {
    console.error('Usage: node tools/gates/lane-check.mjs <BRANCH> [BASE_REF]');
    return 2;
  }

  const parsed = parseBranch(branch);
  if (!parsed) {
    console.error(`Branch "${branch}" is not lane/<CODE>/T-XXX. The envelope gate explains why.`);
    return 2;
  }
  const { botCode, taskId } = parsed;

  const table = ownershipPath();
  const rows = parseOwnership(readFileSync(table, 'utf8'));
  const changed = changedFiles(baseRef);

  console.log(`lane gate · bot=${botCode} · task=${taskId} · table=${table} · ${changed.length} file(s)`);
  if (changed.length === 0) return 0;

  const overrides = allowedOverrides(taskId);
  const violations = [];

  for (const file of changed) {
    const row = ownerOf(file, rows, taskId);

    if (!row) {
      violations.push({
        file,
        why: 'No glob in the ownership table covers it. Add the path to the table before creating it.',
      });
      continue;
    }

    if (row.owner === HUMAN) {
      violations.push({ file, why: 'Reserved for the human. No bot may change it, with or without an override.' });
      continue;
    }

    // The mirror has exactly one legal way to change: as part of moving the pin.
    // Whether the new content really is that version is G1's job; this gate only
    // checks that the change is shaped like an upgrade.
    if (row.owner === FRAMEWORK) {
      if (!changed.includes(PIN)) {
        violations.push({
          file,
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
        violations.push({ file, why: `This file belongs to ${stem}; you are ${botCode}.` });
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

    violations.push({ file, why: `Owned by ${row.owner}; you are ${botCode}.` });
  }

  if (violations.length === 0) {
    console.log('OK: every changed file is in lane.');
    return 0;
  }

  console.error('\nFAIL: out of lane. Out-of-lane changes are rejected without reading the content.\n');
  for (const v of violations) console.error(`  ${v.file}\n    -> ${v.why}`);
  console.error(`
Three ways forward:
  1. Drop these changes and ask the owning bot to make them.
  2. Get the change authorised: the dispatcher lists the path in section 3 of
     ${taskId}'s card, and someone with write access adds the "${OVERRIDE_LABEL}" label.
     Every labelled PR is reviewed by the gatekeeper, not sampled.
  3. If the table itself is wrong, ask A1 to change the table. Do not route around it.
`);
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

export { allowedOverrides };
