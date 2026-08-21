#!/usr/bin/env node
/**
 * Derives the board from git and GitHub instead of asking anyone to maintain it.
 *
 * The previous design kept task state in three places — a sprint file, the task
 * card, and the pull request — and made a role responsible for keeping them in
 * step. Nobody can do that reliably, least of all an agent that forgets between
 * sessions, so the board was always slightly wrong and every report built on it
 * inherited the error. Now there is one source of truth per fact: the card says
 * what the task is, git and CI say where it stands.
 *
 * Usage: node tools/board/status.mjs [--summary]
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';

const BACKLOG = 'board/backlog.md';
const TASKS_DIR = 'board/tasks';

function gh(args) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch {
    return null;
  }
}

function taskIds() {
  if (!existsSync(TASKS_DIR)) return [];
  return readdirSync(TASKS_DIR)
    .filter((f) => /^T-\d{3,}\.md$/.test(f))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

function cardMeta(id) {
  const text = readFileSync(`${TASKS_DIR}/${id}.md`, 'utf8');
  return {
    owner: text.match(/^-\s*Owner:\s*@?(\S+)/m)?.[1] ?? '?',
    reviewer: text.match(/^-\s*Reviewer:\s*@?(\S+)/m)?.[1] ?? '?',
    milestone: text.match(/^-\s*Milestone:\s*(\S+)/m)?.[1] ?? '?',
  };
}

function pullRequests() {
  const raw = gh(['pr', 'list', '--state', 'all', '--limit', '200', '--json',
    'number,headRefName,state,isDraft,reviewDecision,statusCheckRollup,updatedAt,url']);
  if (!raw) return null;
  const byTask = new Map();
  for (const pr of JSON.parse(raw)) {
    const id = pr.headRefName.match(/^lane\/[A-Z]\d\/(T-\d{3,})$/)?.[1];
    if (!id) continue;
    const prev = byTask.get(id);
    if (!prev || new Date(pr.updatedAt) > new Date(prev.updatedAt)) byTask.set(id, pr);
  }
  return byTask;
}

function ciOf(pr) {
  const checks = pr.statusCheckRollup ?? [];
  if (checks.length === 0) return 'none';
  if (checks.some((c) => (c.conclusion ?? c.state) === 'FAILURE')) return 'red';
  if (checks.some((c) => !(c.conclusion ?? c.state) || (c.status && c.status !== 'COMPLETED'))) return 'running';
  return 'green';
}

function stateOf(id, pr, branches) {
  if (!pr) return branches.has(id) ? 'IN PROGRESS' : 'DISPATCHED';
  if (pr.state === 'MERGED') return 'DONE';
  if (pr.state === 'CLOSED') return 'ABANDONED';
  if (pr.isDraft) return 'IN PROGRESS';
  const ci = ciOf(pr);
  if (ci === 'red') return 'NEEDS FIX';
  if (ci === 'running') return 'CI RUNNING';
  if (pr.reviewDecision === 'CHANGES_REQUESTED') return 'NEEDS FIX';
  if (pr.reviewDecision === 'APPROVED') return 'READY TO MERGE';
  return 'IN REVIEW';
}

function localBranches() {
  const out = execFileSync('git', ['branch', '-a', '--format=%(refname:short)'], { encoding: 'utf8' });
  const ids = new Set();
  for (const line of out.split('\n')) {
    const id = line.trim().match(/lane\/[A-Z]\d\/(T-\d{3,})$/)?.[1];
    if (id) ids.add(id);
  }
  return ids;
}

const ids = taskIds();
const prs = pullRequests();
const branches = localBranches();
const backlog = existsSync(BACKLOG) ? readFileSync(BACKLOG, 'utf8') : '';

const rows = ids.map((id) => {
  const pr = prs?.get(id) ?? null;
  const meta = cardMeta(id);
  return {
    id,
    state: prs ? stateOf(id, pr, branches) : 'UNKNOWN (gh unavailable)',
    owner: meta.owner,
    reviewer: meta.reviewer,
    milestone: meta.milestone,
    pr: pr ? `#${pr.number}` : '-',
  };
});

const lines = [];
lines.push('| Task | State | Owner | Reviewer | Milestone | PR |');
lines.push('|---|---|---|---|---|---|');
for (const r of rows) {
  lines.push(`| ${r.id} | ${r.state} | ${r.owner} | ${r.reviewer} | ${r.milestone} | ${r.pr} |`);
}

const anomalies = [];
for (const id of ids) if (backlog && !backlog.includes(id)) anomalies.push(`${id} has a card but is not on ${BACKLOG}.`);
for (const m of backlog.matchAll(/\bT-\d{3,}\b/g)) {
  if (!ids.includes(m[0])) anomalies.push(`${m[0]} is on the backlog but has no card in ${TASKS_DIR}/.`);
}
if (!prs) anomalies.push('gh is unavailable, so pull request state could not be read.');

const report = [
  `Board · generated ${new Date().toISOString()} · ${rows.length} task(s)`,
  '',
  ...lines,
  ...(anomalies.length ? ['', 'Anomalies:', ...new Set(anomalies.map((a) => `- ${a}`))] : []),
].join('\n');

console.log(report);

if (process.argv.includes('--summary') && process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
}
