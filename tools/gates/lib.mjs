/**
 * Shared helpers for the gate scripts.
 *
 * Every gate parses the same three things: the branch name, the ownership
 * table, and the git diff. Keeping one implementation means a fix to glob
 * matching cannot be right in one gate and wrong in another.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/** lane/<CODE>/<TASK> — the only branch shape the gates accept. */
export const BRANCH_RE = /^lane\/([A-Z]\d)\/(T-\d{3,})$/;

/** Owner tokens that mean something other than "a bot with this code". */
export const HUMAN = 'HUMAN';
export const ANYONE = 'ANYONE';
export const FRAMEWORK = 'FRAMEWORK';
export const SELF = 'SELF';
export const TASK_AUTHOR = 'TASK-AUTHOR';
export const SPECIAL_OWNERS = new Set([HUMAN, ANYONE, FRAMEWORK, SELF, TASK_AUTHOR]);

export const PIN = '.studio-version';

/** Globs may contain <TASK>, expanded to the branch's task id before matching. */
export const TASK_TOKEN = '<TASK>';

const OWNERSHIP_CANDIDATES = ['OWNERSHIP.md', 'docs/03-process/ownership.md'];

// A diff of a few thousand files still fits; the default 1 MB does not, and the
// failure mode is an unreadable ENOBUFS stack instead of a gate verdict.
const MAX_BUFFER = 64 * 1024 * 1024;

export class GateError extends Error {}

export function git(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', maxBuffer: MAX_BUFFER });
  } catch (err) {
    throw new GateError(`git ${args} failed: ${err.message.split('\n')[0]}`);
  }
}

export function parseBranch(branch) {
  const m = String(branch ?? '').match(BRANCH_RE);
  return m ? { botCode: m[1], taskId: m[2] } : null;
}

export function changedFiles(baseRef) {
  return git(`diff --name-only ${baseRef}...HEAD`)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function deletedFiles(baseRef) {
  return new Set(
    git(`diff --diff-filter=D --name-only ${baseRef}...HEAD`)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/** The ownership table as it stood on the base branch, or null if unreadable. */
export function baseOwnership(baseRef, table) {
  try {
    return parseOwnership(git(`show ${baseRef}:${table}`));
  } catch {
    return null;
  }
}

export function ownershipPath() {
  return (
    process.env.OWNERSHIP_FILE ??
    OWNERSHIP_CANDIDATES.find(existsSync) ??
    OWNERSHIP_CANDIDATES[1]
  );
}

export function parseOwnership(md) {
  const rows = [];
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1);
    if (cells.length < 2) continue;
    const glob = cells[0].match(/`([^`]+)`/)?.[1];
    const owner = cells[1].replace(/\*/g, '').trim();
    if (!glob || !owner || owner === 'Owner' || owner.startsWith('---')) continue;
    rows.push({ glob: glob.trim(), owner });
  }
  if (rows.length === 0) throw new GateError('No ownership rows found. Is the table still a markdown table?');
  return rows;
}

/**
 * glob -> RegExp. Only ** and * are supported, which is enough for path
 * ownership and keeps the behaviour something a human can predict by reading.
 */
export function globToRegex(glob) {
  const deep = /\/\*\*$/.test(glob);
  const base = deep ? glob.slice(0, -3) : glob;
  const esc = base.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const body = esc
    .replace(/\*\*\/?/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?');
  // A trailing /** means "something below this directory", so the bare directory
  // path is not a match. Diffs only ever name files, but a glob that quietly
  // matches more than it says is a glob people will misread.
  return new RegExp(`^${body}${deep ? '/.*' : ''}$`);
}

export function expandTask(glob, taskId) {
  return taskId ? glob.split(TASK_TOKEN).join(taskId) : glob;
}

/**
 * The most specific glob wins. The table is full of exceptions — a directory
 * belongs to one bot except for one subdirectory that belongs to another — and
 * "longest glob" is the rule that makes those exceptions work.
 */
export function ownerOf(file, rows, taskId) {
  let best = null;
  for (const row of rows) {
    const glob = expandTask(row.glob, taskId);
    if (globToRegex(glob).test(file)) {
      if (!best || glob.length > best.glob.length) best = { ...row, glob };
    }
  }
  return best;
}

export function taskCardPath(taskId) {
  return `board/tasks/${taskId}.md`;
}

export function readTaskCard(taskId) {
  const p = taskCardPath(taskId);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

/** Text of one `## ...` section, heading excluded. */
export function section(md, headingPrefix) {
  const lines = String(md ?? '').split('\n');
  const start = lines.findIndex((l) => l.startsWith(headingPrefix));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

export function backtickedGlobs(text) {
  return [...String(text ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
}
