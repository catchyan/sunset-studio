/**
 * Shared helpers for the gate scripts.
 *
 * Every gate parses the same three things: the branch name, the ownership
 * table, and the git diff. Keeping one implementation means a fix to glob
 * matching cannot be right in one gate and wrong in another.
 */

import { execFileSync } from 'node:child_process';
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

const STUDIO_TABLE = 'OWNERSHIP.md';
const PROJECT_TABLE = 'docs/03-process/ownership.md';

/**
 * Paths that decide what the gates do at all. A change to any of them is
 * reviewed by the human, because a repository cannot check the checker: on a
 * same-repository pull request, GitHub runs the workflow from the branch under
 * review. See docs/03-gates/gates.md, "What the gates cannot check".
 */
export const SELF_GOVERNING = /^(\.github\/workflows\/|tools\/gates\/|OWNERSHIP\.md$|docs\/03-process\/ownership\.md$)/;

// A diff of a few thousand files still fits; the default 1 MB does not, and the
// failure mode is an unreadable ENOBUFS stack instead of a gate verdict.
const MAX_BUFFER = 64 * 1024 * 1024;

export class GateError extends Error {}

/**
 * Arguments are passed as an array, never as a command string. A branch name is
 * attacker-controlled input — `lane/A1/T-001"||true;#` is a legal git ref — and
 * a shell between here and git is one more place for it to be read as syntax.
 */
export function git(args, quiet = false) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      maxBuffer: MAX_BUFFER,
      // execFileSync passes the child's stderr through to ours unless told not to.
      // For lookups whose failure is an ordinary answer — "this file is new" — that
      // prints a `fatal:` line above a passing verdict, which reads like a crash.
      stdio: quiet ? ['ignore', 'pipe', 'ignore'] : ['ignore', 'pipe', 'inherit'],
    });
  } catch (err) {
    throw new GateError(`git ${args.join(' ')} failed: ${err.message.split('\n')[0]}`);
  }
}

export function parseBranch(branch) {
  const m = String(branch ?? '').match(BRANCH_RE);
  return m ? { botCode: m[1], taskId: m[2] } : null;
}

/**
 * Every changed path with its status, renames split into both halves.
 *
 * -z because a path with a space or a non-ASCII byte comes back quoted and
 * escaped otherwise, and a quoted path matches no glob in the table — which
 * reads as "unowned" for an ordinary filename and as "in lane" for nothing.
 *
 * -M because without it a rename is reported only as an addition. Moving a
 * frozen contract out of its owner's directory would have been a change the
 * lane gate could not see.
 */
export function parseDiffZ(raw) {
  const parts = raw.split('\0').filter((s) => s !== '');
  const out = [];
  for (let i = 0; i < parts.length; ) {
    const status = parts[i++];
    if (/^[RC]/.test(status)) {
      const from = parts[i++];
      const to = parts[i++];
      out.push({ status: 'D', path: from, renamedTo: to });
      out.push({ status: 'A', path: to, renamedFrom: from });
    } else {
      out.push({ status: status[0], path: parts[i++] });
    }
  }
  return out;
}

export function diffEntries(baseRef) {
  return parseDiffZ(git(['diff', '--name-status', '-M', '-z', `${baseRef}...HEAD`]));
}

export function changedFiles(baseRef) {
  return [...new Set(diffEntries(baseRef).map((e) => e.path))];
}

export function deletedFiles(baseRef) {
  return new Set(diffEntries(baseRef).filter((e) => e.status === 'D').map((e) => e.path));
}

/** True when this repository consumes the framework rather than being it. */
export function isProject() {
  return existsSync(PIN);
}

/**
 * Which ownership table governs this repository is decided by what kind of
 * repository it is, not by which candidate file happens to exist. Picking the
 * first existing file let anyone who could write one path in a project repo
 * create a root OWNERSHIP.md and become the owner of everything.
 */
export function ownershipPath() {
  return isProject() ? PROJECT_TABLE : STUDIO_TABLE;
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

/** A file's content as it stands on the base branch, or null if absent there. */
export function showAtBase(baseRef, path) {
  try {
    return git(['show', `${baseRef}:${path}`], true);
  } catch {
    return null;
  }
}

/** The ownership table as it stood on the base branch, or null if unreadable. */
export function baseOwnership(baseRef, table) {
  const md = showAtBase(baseRef, table);
  if (md === null) return null;
  try {
    return parseOwnership(md);
  } catch {
    return null;
  }
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

/**
 * The card as it stood on the base branch.
 *
 * Permissions are read from here, never from the branch. A card on the branch
 * is a card the author can edit in the same commit that uses it, which made the
 * lane declaration a note the author wrote to themselves. Reading from base is
 * what makes dispatch mean something: the paths were agreed before the work.
 */
export function dispatchedCard(baseRef, taskId) {
  return showAtBase(baseRef, taskCardPath(taskId));
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

/** Contents of the first fenced block in a section, or null if there is none. */
export function fencedBlock(text) {
  const m = String(text ?? '').match(/```[a-z]*\r?\n([\s\S]*?)^```/m);
  return m ? m[1] : null;
}

/**
 * Globs a section grants, read only from its fenced block.
 *
 * Scanning the whole section for backticks read the prohibitions too: a card
 * that said "you may not touch `packages/sim/**`" granted exactly that path.
 * A fence is the difference between naming a path and granting it.
 */
export function fencedGlobs(text) {
  const block = fencedBlock(text);
  if (block === null) return [];
  return block
    .split('\n')
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean);
}

export function backtickedGlobs(text) {
  return [...String(text ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
}
