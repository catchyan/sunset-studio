#!/usr/bin/env node
/**
 * G3 envelope gate.
 *
 * Checks that a PR meets the minimum conditions for being auditable later:
 *   1. the branch names a task,
 *   2. that task was dispatched (card exists, all eight sections, on the backlog),
 *   3. the author is not also the reviewer,
 *   4. every commit carries the task id,
 *   5. the evidence pack ran the commands the card actually asked for,
 *   6. the diff is small enough that reviewing it is still reviewing.
 *
 * Usage: node tools/gates/envelope-check.mjs <BRANCH> [BASE_REF]
 */

import { existsSync, readFileSync } from 'node:fs';
import { GateError, git, parseBranch, readTaskCard, section, taskCardPath } from './lib.mjs';

const MAX_DIFF_LINES = 400;
const MAX_DIFF_FILES = 25;

// Prose and board files are naturally large and carry little risk. Applying the
// small-steps limit to them would only teach people to split documents oddly.
const DIFF_EXEMPT = /^(docs\/|board\/|evidence\/|assets\/|\.gitignore$|\.gitattributes$)/;

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
const BACKLOG = 'board/backlog.md';

const fail = [];
const warn = [];

/** Command lines from a fenced block, minus comments and blanks. */
function commandLines(text) {
  const fence = String(text ?? '').match(/```[a-z]*\n([\s\S]*?)```/);
  const body = fence ? fence[1] : String(text ?? '');
  return body
    .split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#'));
}

function checkCard(taskId) {
  const card = readTaskCard(taskId);
  if (!card) {
    fail.push(`Task card ${taskCardPath(taskId)} does not exist. Work is dispatched before it is done, not after.`);
    return null;
  }

  const missing = SECTIONS.filter((s) => !card.includes(s));
  if (missing.length) {
    fail.push(
      `Task card is missing: ${missing.join(', ')}\n` +
        '    Without section 5 the assignee cannot know when to stop; without section 6 nobody can check them.'
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

function checkCommits(taskId, baseRef) {
  const subjects = git(`log --no-merges --format=%s ${baseRef}..HEAD`)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (subjects.length === 0) {
    fail.push('No commits on this branch.');
    return;
  }

  for (const s of subjects) {
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
    if (!/EXIT_CODE=0\s*$/.test(out)) {
      fail.push('output.txt does not end with EXIT_CODE=0. Exit code zero is the only passing grade.');
    }
    if (/\.{3}$|\[truncated\]/m.test(out)) {
      warn.push('output.txt looks truncated. The gatekeeper re-runs a sample and compares, so paste all of it.');
    }
  }

  // The acceptance command is chosen when the task is dispatched, precisely so
  // that it cannot be chosen after seeing which commands happen to pass.
  const cmdPath = `${dir}/command.txt`;
  if (card && existsSync(cmdPath)) {
    const want = commandLines(section(card, '## 6. Acceptance command'));
    const got = commandLines(readFileSync(cmdPath, 'utf8'));
    const missing = want.filter((c) => !got.includes(c));
    if (want.length && missing.length) {
      fail.push(
        `command.txt does not contain the acceptance command from section 6 of the card:\n` +
          missing.map((c) => `      missing: ${c}`).join('\n')
      );
    }
  }
}

function checkDiffSize(baseRef) {
  let lines = 0;
  let files = 0;
  for (const row of git(`diff --numstat ${baseRef}...HEAD`).split('\n').filter(Boolean)) {
    const [add, del, ...rest] = row.split('\t');
    const path = rest.join('\t');
    if (!path || DIFF_EXEMPT.test(path)) continue;
    files += 1;
    lines += (Number(add) || 0) + (Number(del) || 0);
  }
  console.log(`  code changes: ${files} file(s) / ${lines} line(s)`);

  if (lines > MAX_DIFF_LINES || files > MAX_DIFF_FILES) {
    fail.push(
      `Diff is ${files} files / ${lines} lines, over the limit of ${MAX_DIFF_FILES} / ${MAX_DIFF_LINES}.\n` +
        '    Past this size review degrades into skimming and clicking approve, which makes the\n' +
        '    review gate decorative. Split the task.'
    );
  }
}

function main() {
  const [branch, baseRef = 'origin/main'] = process.argv.slice(2);
  if (!branch) {
    console.error('Usage: node tools/gates/envelope-check.mjs <BRANCH> [BASE_REF]');
    return 2;
  }

  const parsed = parseBranch(branch);
  if (!parsed) {
    fail.push(
      `Branch "${branch}" is not lane/<CODE>/T-XXX.\n` +
        '    Every PR has to trace back to a task card. A change nobody can trace is a change\n' +
        '    nobody can explain six weeks later.'
    );
    report();
    return 1;
  }

  const { botCode, taskId } = parsed;
  console.log(`envelope gate · bot=${botCode} · task=${taskId}`);

  const card = checkCard(taskId);
  checkCommits(taskId, baseRef);
  checkEvidence(taskId, card);
  checkDiffSize(baseRef);

  report();
  return fail.length ? 1 : 0;
}

function report() {
  for (const w of warn) console.warn(`\nWARN: ${w}`);
  if (fail.length === 0) {
    console.log('OK: envelope and evidence are complete.');
    return;
  }
  console.error(`\nFAIL: ${fail.length} problem(s):\n`);
  fail.forEach((f, i) => console.error(`  ${i + 1}. ${f}\n`));
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
