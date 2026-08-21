#!/usr/bin/env node
/**
 * G3 envelope gate.
 *
 * Checks that a PR meets the minimum conditions for being auditable later:
 *   1. the branch names a task, or declares itself a board-only change,
 *   2. that task was dispatched — the card was on the base branch before the work,
 *   3. somebody other than the author approved it, in writing, in the timeline,
 *   4. every commit carries the task id,
 *   5. the evidence pack ran the commands the card actually asked for, and they passed,
 *   6. the diff is small enough that reviewing it is still reviewing.
 *
 * Usage: node tools/gates/envelope-check.mjs <BRANCH> [BASE_REF]
 */

import { existsSync, readFileSync } from 'node:fs';
import {
  GateError,
  SELF_GOVERNING,
  changedFiles,
  dispatchedCard,
  fencedBlock,
  git,
  parseBranch,
  section,
  taskCardPath,
} from './lib.mjs';

const MAX_DIFF_LINES = 400;
const MAX_DIFF_FILES = 25;

// Prose and board files are naturally large and carry little risk. Applying the
// small-steps limit to them would only teach people to split documents oddly.
const DIFF_EXEMPT = /^(docs\/|board\/|evidence\/|assets\/|templates\/|playbooks\/|\.gitignore$|\.gitattributes$)/;

const SIZE_LABEL = 'large-change';
const BREAK_GLASS_LABEL = 'break-glass';

/** board/<CODE>/<slug> — for changes that record something rather than build it. */
const BOARD_BRANCH_RE = /^board\/([A-Z]\d)\/[a-z0-9][a-z0-9-]*$/;

/**
 * The distress signals. Recording that the line stopped must never depend on
 * the line running: the first andon trigger is a red default branch, and that
 * is exactly when a gate demanding a green evidence pack would refuse the
 * record of why nothing is green.
 */
const DISTRESS = /^board\/(andon\.md$|blockers\/)/;

const SECTIONS = [
  '## 1. Goal',
  '## 2. Inputs',
  '## 3. Lane',
  '## 4. Contracts',
  '## 5. Definition of done',
  '## 6. Acceptance command',
  '## 7. Evidence',
  '## 8. Timeout and escalation',
];

const COMMIT_RE = /^(feat|fix|docs|refactor|test|chore|perf|content|art)\([^)]+\): .+ \[(T-\d{3,})\]$/;
const BOARD_COMMIT_RE = /^(chore|docs)\(board\): .+$/;
const BACKLOG = 'board/backlog.md';
const APPROVAL_RE = /^\s*APPROVED-BY:\s*([A-Z]\d|human)\s*$/gm;

const fail = [];
const warn = [];

/** Failures break-glass does not cover. Currently one: the human's approval. */
const hardFail = [];

/** Command lines from a fenced block, minus comments, fences, and blanks. */
function commandLines(text) {
  const block = fencedBlock(text);
  const body = block === null ? String(text ?? '') : block;
  return body
    .split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('```'));
}

function labels() {
  return (process.env.PR_LABELS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Role codes that signed off, from review bodies and issue comments.
 *
 * Every bot drives the same GitHub account today, so GitHub's own review
 * approval can never be satisfied — an author cannot approve their own pull
 * request — and its identity would prove nothing if it could. A written line in
 * the timeline is weaker than a signature and stronger than the alternative,
 * which was a field the author fills in on their own card.
 *
 * Both reviews and plain comments are read, but only a review re-runs this
 * workflow. A plain comment is collected on the next run and, if there is no
 * next run, by nobody.
 */
function approvals() {
  const file = process.env.PR_APPROVALS_FILE;
  if (!file || !existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  return [...new Set([...text.matchAll(APPROVAL_RE)].map((m) => m[1]))];
}

function checkApproval(botCode, card, changed) {
  const given = approvals();
  const owner = card?.match(/^-\s*Owner:\s*@?(\S+)/m)?.[1]?.replace(/^@/, '');
  const self = new Set([botCode, owner].filter(Boolean));
  const independent = given.filter((c) => !self.has(c));

  if (independent.length === 0) {
    fail.push(
      'Nobody has approved this pull request.\n' +
        '    The reviewer submits a review — not a plain comment — whose body holds a line\n' +
        '    reading "APPROVED-BY: <their code>":\n' +
        `      gh pr review <n> --comment --body "APPROVED-BY: <their code>"\n` +
        `    Anyone except ${[...self].join(' or ')}. Approvals seen: ${given.length ? given.join(', ') : 'none'}.\n` +
        '    A plain issue comment is read too, but it does not re-run this workflow, so the\n' +
        '    approval sits in the timeline unseen until something else triggers a run.'
    );
  } else {
    console.log(`  approved by: ${independent.join(', ')}`);
  }

  // A repository cannot check its own checker: on a same-repository pull
  // request GitHub runs the workflow from the branch under review, so a diff
  // that edits the gates is judged by the gates it edits. The human is the only
  // reviewer outside that loop.
  const governing = changed.filter((f) => SELF_GOVERNING.test(f));
  if (governing.length && !given.includes('human')) {
    // Kept out of `fail` so that break-glass cannot waive it. Break-glass exists to let
    // a broken repository be repaired; a repair that also removes the last reviewer
    // standing outside the loop is not a repair.
    hardFail.push(
      'This diff changes what the gates do, and the human has not approved it.\n' +
        governing.slice(0, 5).map((f) => `      ${f}`).join('\n') +
        '\n    These files decide every other verdict, and the run that judges them is the run\n' +
        '    they configure. Only a reviewer outside the repository closes that loop.\n' +
        '    The human submits a review whose body reads "APPROVED-BY: human".'
    );
  }
}

function checkCard(taskId, baseRef) {
  const card = dispatchedCard(baseRef, taskId);
  if (!card) {
    fail.push(
      `No task card for ${taskId} on ${baseRef}.\n` +
        `    Work is dispatched before it is done. ${taskCardPath(taskId)} has to be merged first,\n` +
        '    on its own board/<CODE>/<slug> branch, so the lane and the acceptance command were\n' +
        '    agreed by somebody other than the person about to be judged against them.'
    );
    return null;
  }

  const missing = SECTIONS.filter((s) => !card.includes(s));
  if (missing.length) {
    fail.push(
      `Task card is missing: ${missing.join(', ')}\n` +
        '    Without section 5 the assignee cannot know when to stop; without section 6 nobody can check them.'
    );
  }

  if (fencedBlock(section(card, '## 3. Lane')) === null) {
    fail.push(
      'Section 3 of the card has no fenced block.\n' +
        '    The lane gate reads granted paths from a fence, so a card without one grants nothing.'
    );
  }

  const owner = card.match(/^-\s*Owner:\s*@?(\S+)/m)?.[1];
  const reviewer = card.match(/^-\s*Reviewer:\s*@?(\S+)/m)?.[1];
  if (!reviewer || /^</.test(reviewer)) {
    fail.push('Task card names no reviewer (or still holds the template placeholder).');
  } else if (owner === reviewer) {
    fail.push(`Owner and reviewer are both ${owner}. Nobody approves their own output.`);
  }

  if (existsSync(BACKLOG)) {
    if (!readFileSync(BACKLOG, 'utf8').includes(taskId)) {
      fail.push(
        `${taskId} is not on ${BACKLOG}.\n` +
          '    A card with no backlog entry means somebody picked their own work. That is how scope drifts.'
      );
    }
  }

  return card;
}

function checkCommits(taskId, baseRef, boardOnly) {
  const subjects = git(['log', '--no-merges', '--format=%s', `${baseRef}..HEAD`])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (subjects.length === 0) {
    fail.push('No commits on this branch.');
    return;
  }

  for (const s of subjects) {
    // Named before the format complaint, because the character that breaks the match is
    // usually one you cannot see. A byte-order mark from a Windows editor cost an hour
    // once: the subject looked exactly right and the gate said it did not match.
    const invisible = [...s].filter((c) => c.charCodeAt(0) > 126 || c.charCodeAt(0) < 32);
    if (invisible.length) {
      const codes = [...new Set(invisible.map((c) => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')))];
      fail.push(
        `Commit subject contains characters that are not printable ASCII: ${codes.join(' ')}\n` +
          `      ${s}\n` +
          '      A byte-order mark is the usual culprit. Write the message to a file with\n' +
          '      UTF-8 and no BOM, then: git commit --amend -F <file>'
      );
      continue;
    }

    if (boardOnly) {
      if (!BOARD_COMMIT_RE.test(s)) {
        fail.push(`Board commits are "chore(board): <subject>" or "docs(board): <subject>":\n      ${s}`);
      }
      continue;
    }

    const m = s.match(COMMIT_RE);
    if (!m) {
      fail.push(`Commit subject does not match "<type>(<scope>): <subject> [T-XXX]":\n      ${s}`);
    } else if (m[2] !== taskId) {
      fail.push(`Commit references ${m[2]} but the branch is ${taskId}:\n      ${s}`);
    }
  }
}

function checkEvidence(taskId, card) {
  const dir = `evidence/${taskId}`;
  if (!existsSync(dir)) {
    fail.push(`Evidence pack ${dir}/ does not exist. "I ran it and it passed" is not evidence.`);
    return;
  }

  for (const f of ['command.txt', 'output.txt', 'diff-stat.txt', 'env.txt']) {
    if (!existsSync(`${dir}/${f}`)) fail.push(`Evidence pack is missing ${f}.`);
  }

  const outPath = `${dir}/output.txt`;
  if (existsSync(outPath)) {
    const out = readFileSync(outPath, 'utf8').trimEnd();

    // Every exit code, not the last one. A pack that runs four commands and
    // reports EXIT_CODE=1, EXIT_CODE=1, EXIT_CODE=0 used to pass on the strength
    // of its final line, which is the pack you would write if you were hiding
    // the first two.
    const codes = [...out.matchAll(/^EXIT_CODE=(\d+)\s*$/gm)].map((m) => Number(m[1]));
    if (codes.length === 0) {
      fail.push('output.txt records no EXIT_CODE line. Exit code zero is the only passing grade.');
    } else {
      const bad = codes.filter((c) => c !== 0);
      if (bad.length) {
        fail.push(`output.txt contains ${bad.length} non-zero exit code(s): ${bad.join(', ')}.`);
      }
      if (!/EXIT_CODE=0\s*$/.test(out)) {
        fail.push('output.txt does not end with EXIT_CODE=0.');
      }
    }

    if (/\.{3}$|\[truncated\]/m.test(out)) {
      warn.push('output.txt looks truncated. The gatekeeper re-runs a sample and compares, so paste all of it.');
    }
  }

  // The acceptance command is chosen when the task is dispatched, precisely so
  // that it cannot be chosen after seeing which commands happen to pass. The
  // comparison runs both ways: a pack that adds commands the card never asked
  // for is a pack whose EXIT_CODE lines belong to something else.
  const cmdPath = `${dir}/command.txt`;
  if (card && existsSync(cmdPath)) {
    const want = commandLines(section(card, '## 6. Acceptance command'));
    const got = commandLines(readFileSync(cmdPath, 'utf8'));
    const missing = want.filter((c) => !got.includes(c));
    const extra = got.filter((c) => !want.includes(c));
    if (want.length && missing.length) {
      fail.push(
        'command.txt does not contain the acceptance command from section 6 of the card:\n' +
          missing.map((c) => `      missing: ${c}`).join('\n')
      );
    }
    if (want.length && extra.length) {
      fail.push(
        'command.txt runs commands section 6 of the card does not ask for:\n' +
          extra.map((c) => `      extra: ${c}`).join('\n') +
          '\n    Change the card, through dispatch, or drop the command. The pack has to be the\n' +
          '    thing the card asked for, or its exit codes are about a different question.'
      );
    }
  }
}

function checkDiffSize(baseRef, card) {
  let lines = 0;
  let files = 0;
  for (const row of git(['diff', '--numstat', `${baseRef}...HEAD`]).split('\n').filter(Boolean)) {
    const [add, del, ...rest] = row.split('\t');
    const path = rest.join('\t');
    if (!path || DIFF_EXEMPT.test(path)) continue;
    files += 1;
    lines += (Number(add) || 0) + (Number(del) || 0);
  }
  console.log(`  code changes: ${files} file(s) / ${lines} line(s)`);

  if (lines <= MAX_DIFF_LINES && files <= MAX_DIFF_FILES) return;

  const over = `Diff is ${files} files / ${lines} lines, over the limit of ${MAX_DIFF_FILES} / ${MAX_DIFF_LINES}.`;

  // Some changes genuinely cannot be split: a bootstrap, a mechanical rename, a
  // vendored import. Removing the limit for them would remove it for everything,
  // so the exception raises the price instead: it is declared on the card before
  // the work, labelled by someone with write access, and reviewed in full rather
  // than sampled.
  const reason = card?.match(/^-\s*Size exception:\s*(.+)$/m)?.[1];
  if (labels().includes(SIZE_LABEL) && reason) {
    warn.push(`${over}\n     Declared exception: ${reason}\n     The gatekeeper reviews this in full.`);
    return;
  }

  fail.push(
    `${over}\n` +
      '    Past this size review degrades into skimming and clicking approve, which makes the\n' +
      '    review gate decorative. Split the task.\n' +
      `    If it genuinely cannot be split: add "- Size exception: <reason>" to the card and the\n` +
      `    "${SIZE_LABEL}" label to the pull request. Both, and expect a full review.`
  );
}

function main() {
  const [branch, baseRef = 'origin/main'] = process.argv.slice(2);
  if (!branch) {
    console.error('Usage: node tools/gates/envelope-check.mjs <BRANCH> [BASE_REF]');
    return 2;
  }

  const changed = changedFiles(baseRef);
  const boardOnly = changed.length > 0 && changed.every((f) => f.startsWith('board/'));
  const distressOnly = changed.length > 0 && changed.every((f) => DISTRESS.test(f));

  const board = branch.match(BOARD_BRANCH_RE);
  if (board) {
    // Dispatching a card, recording an andon, filing a blocker. None of these
    // build anything, and requiring each to arrive with its own dispatched card
    // made the first card in the repository impossible to merge.
    console.log(`envelope gate · board · bot=${board[1]}`);
    if (!boardOnly) {
      fail.push(
        'A board/ branch may only change board/ files.\n' +
          changed.filter((f) => !f.startsWith('board/')).slice(0, 5).map((f) => `      ${f}`).join('\n') +
          '\n    Anything else needs a task card and an evidence pack. Use lane/<CODE>/T-XXX.'
      );
    }
    checkCommits(null, baseRef, true);
    if (!distressOnly) checkApproval(board[1], null, changed);
    else console.log('  distress record: merges without approval, by design.');
    report();
    return fail.length + hardFail.length ? 1 : 0;
  }

  const parsed = parseBranch(branch);
  if (!parsed) {
    fail.push(
      `Branch "${branch}" is neither lane/<CODE>/T-XXX nor board/<CODE>/<slug>.\n` +
        '    Every PR has to trace back to a task card, or declare itself a record. A change\n' +
        '    nobody can trace is a change nobody can explain six weeks later.'
    );
    report();
    return 1;
  }

  const { botCode, taskId } = parsed;
  console.log(`envelope gate · bot=${botCode} · task=${taskId}`);

  const card = checkCard(taskId, baseRef);
  checkCommits(taskId, baseRef, false);
  checkEvidence(taskId, card);
  checkDiffSize(baseRef, card);
  checkApproval(botCode, card, changed);

  // Break-glass turns the blocking gates into warnings so a repository whose CI
  // is broken can be repaired through a pull request. It is not a quiet flag:
  // it needs a label, an andon entry in the same diff, and it announces itself
  // in the log the gatekeeper reads every morning.
  if (labels().includes(BREAK_GLASS_LABEL)) {
    if (!changed.includes('board/andon.md')) {
      fail.push(
        'The break-glass label is applied and board/andon.md is not in the diff.\n' +
          '    Pulling the cord and recording that you pulled it are the same act.'
      );
      report();
      return 1;
    }
    console.warn(`\nBREAK-GLASS: ${fail.length} blocking problem(s) downgraded to warnings.`);
    fail.forEach((f, i) => console.warn(`  ${i + 1}. ${f}\n`));
    console.warn('The gatekeeper reviews this in full and files the follow-up task before the andon closes.');
    fail.length = 0;
  }

  report();
  return fail.length + hardFail.length ? 1 : 0;
}

function report() {
  for (const w of warn) console.warn(`\nWARN: ${w}`);
  const all = [...hardFail, ...fail];
  if (all.length === 0) {
    console.log('OK: envelope and evidence are complete.');
    return;
  }
  console.error(`\nFAIL: ${all.length} problem(s):\n`);
  all.forEach((f, i) => console.error(`  ${i + 1}. ${f}\n`));
}

try {
  process.exit(main());
} catch (err) {
  if (err instanceof GateError) {
    console.error(`FAIL: ${err.message}`);
    process.exit(2);
  }
  throw err;
}
