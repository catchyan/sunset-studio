#!/usr/bin/env node
/**
 * Reports lanes that have stopped moving. Nothing else.
 *
 * This replaces scheduled self-reported heartbeats. Five agents writing a status
 * file every two hours is sixty writes a day whose only content is "still here",
 * and the one case that matters — an agent that has stopped and cannot say so —
 * is exactly the case self-reporting cannot cover. Commit timestamps report the
 * same fact, cost nothing, and cannot be written by an agent that is stuck.
 *
 * Usage: node tools/board/stall.mjs [--warn-hours 3] [--alert-hours 6] [--strict]
 */

import { execFileSync } from 'node:child_process';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
}

const WARN_H = arg('warn-hours', 3);
const ALERT_H = arg('alert-hours', 6);
const STRICT = process.argv.includes('--strict');

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

git(['fetch', '--quiet', '--prune', 'origin']);

const lanes = git(['for-each-ref', '--format=%(refname:short)\t%(committerdate:iso-strict)\t%(authorname)', 'refs/remotes/origin/lane'])
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [ref, when, who] = line.split('\t');
    const m = ref.match(/lane\/([A-Z]\d)\/(T-\d{3,})$/);
    return m ? { ref, bot: m[1], task: m[2], when: new Date(when), who } : null;
  })
  .filter(Boolean);

const now = Date.now();
const problems = [];

for (const lane of lanes) {
  const hours = (now - lane.when.getTime()) / 3_600_000;
  if (hours >= ALERT_H) problems.push({ level: 'ALERT', hours, lane });
  else if (hours >= WARN_H) problems.push({ level: 'WARN', hours, lane });
}

problems.sort((a, b) => b.hours - a.hours);

console.log(`stall check · ${lanes.length} active lane(s) · warn ${WARN_H}h · alert ${ALERT_H}h`);

if (problems.length === 0) {
  console.log('OK: every active lane moved recently.');
  process.exit(0);
}

for (const p of problems) {
  console.log(`${p.level} ${p.lane.bot} ${p.lane.task}: no commit for ${p.hours.toFixed(1)}h (last by ${p.lane.who})`);
}
console.log('\nAn alerting lane needs a blocker report or a reassignment, not another wait.');

process.exit(STRICT && problems.some((p) => p.level === 'ALERT') ? 1 : 0);
