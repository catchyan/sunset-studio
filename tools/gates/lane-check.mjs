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
  baseOwnership,
  changedFiles,
  deletedFiles,
  globToRegex,
  ownerOf,
  ownershipPath,
  parseBranch,
  parseOwnership,
  readTaskCard,
  section,
} from './lib.mjs';

const OVERRIDE_LABEL = 'lane-override';
const HUMAN_LABEL = 'human-change';

function labels() {
  return (process.env.PR_LABELS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * An exception needs two independent acts, because one act is something a bot
 * can do to itself. The label requires repository write access and lands in the
 * PR timeline; the card entry has to be written by the dispatcher before the
 * work starts. Free text in a PR body was neither.
 *
 * Not cryptographic: today every agent drives the same account, so nothing here
 * proves who added the label. It is auditable rather than preventive — both acts
 * are timestamped in the timeline, and the gatekeeper reviews every labelled
 * pull request instead of sampling it.
 */
function declaredPaths(taskId, label) {
  if (!labels().includes(label)) return [];
  return backtickedGlobs(section(readTaskCard(taskId), '## 3. Lane'));
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

  const overrides = declaredPaths(taskId, OVERRIDE_LABEL);
  const humanChanges = declaredPaths(taskId, HUMAN_LABEL);
  const violations = [];

  // A deletion is judged against the table as it stood before the change.
  // Removing a file and its ownership row in one commit is the normal shape of a
  // refactor, and reading only the new table calls that "unowned" — a false
  // positive that would fire on every cleanup anyone ever does.
  const deleted = deletedFiles(baseRef);
  const priorRows = deleted.size ? baseOwnership(baseRef, table) : null;

  for (const file of changed) {
    const row =
      (deleted.has(file) && priorRows ? ownerOf(file, priorRows, taskId) : null) ??
      ownerOf(file, rows, taskId);

    if (!row) {
      violations.push({
        file,
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
        file,
        why:
          'Reserved for the human. Amending it needs the "human-change" label and the path\n' +
          `      listed in section 3 of ${taskId}. The lane-override label does not apply here.`,
      });
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

export { declaredPaths };
