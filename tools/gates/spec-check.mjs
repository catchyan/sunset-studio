#!/usr/bin/env node
/**
 * G4b specification gate: the gate list must describe the gates that actually run.
 *
 * This exists because of a real failure. The gate document claimed checks that
 * had never been written, and one gate that was documented as blocking ended its
 * command with `|| echo`, so it could not fail. Nobody noticed for weeks, because
 * documents and workflows are read by different people at different times.
 *
 * Usage: node tools/gates/spec-check.mjs [GATES_MD] [WORKFLOW_YML]
 */

import { existsSync, readFileSync } from 'node:fs';

const GATES_MD =
  process.argv[2] ?? ['docs/03-gates/gates.md', 'docs/_studio/docs/03-gates/gates.md'].find(existsSync);
const WORKFLOW = process.argv[3] ?? '.github/workflows/gates.yml';
const REPO_KIND = existsSync('docs/00-charter/studio-charter.md') ? 'studio' : 'project';

// Reporting jobs aggregate other gates; they are plumbing, not gates.
const NOT_A_GATE = new Set(['summary']);

const problems = [];

function parseGateTable(md) {
  const gates = [];
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 5) continue;
    const [id, , repos, enforcedBy, blocking] = cells;
    if (!/^[GRH]\d+$/.test(id)) continue;
    gates.push({
      id,
      repos: repos.replace(/`/g, '').toLowerCase(),
      job: enforcedBy.match(/`([^`]+)`/)?.[1] ?? null,
      blocking: /yes/i.test(blocking),
    });
  }
  return gates;
}

/** Enough of a YAML reader for a workflow file we control. */
function parseJobs(yml) {
  const lines = yml.split('\n');
  const start = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (start === -1) return {};
  const jobs = {};
  let current = null;
  for (const line of lines.slice(start + 1)) {
    const head = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (head) {
      current = head[1];
      jobs[current] = [];
      continue;
    }
    if (current && line.trim()) jobs[current].push(line);
  }
  return Object.fromEntries(Object.entries(jobs).map(([k, v]) => [k, v.join('\n')]));
}

function main() {
  if (!GATES_MD || !existsSync(GATES_MD)) {
    console.error(`FAIL: gate list not found (${GATES_MD ?? 'no candidate path'}).`);
    return 2;
  }
  if (!existsSync(WORKFLOW)) {
    console.error(`FAIL: workflow not found (${WORKFLOW}).`);
    return 2;
  }

  const gates = parseGateTable(readFileSync(GATES_MD, 'utf8'));
  const jobs = parseJobs(readFileSync(WORKFLOW, 'utf8'));

  if (gates.length === 0) problems.push(`${GATES_MD}: no gate rows parsed. Has the table format changed?`);

  const mine = gates.filter((g) => g.repos.includes(REPO_KIND) || g.repos.includes('both'));

  // Documented here, missing there.
  for (const g of mine) {
    if (!g.job) continue;
    if (!(g.job in jobs)) {
      problems.push(
        `${g.id} claims to be enforced by CI job "${g.job}", but ${WORKFLOW} has no such job.\n` +
          '      Either write the gate or stop claiming it. A gate nobody runs is worse than no gate,\n' +
          '      because everyone believes they are covered.'
      );
      continue;
    }
    if (g.blocking) {
      const body = jobs[g.job];
      if (/continue-on-error:\s*true/.test(body)) {
        problems.push(`${g.id} is documented as blocking, but job "${g.job}" sets continue-on-error: true.`);
      }
      const swallow = body.match(/\|\|\s*(true|echo|:)\b.*/);
      if (swallow) {
        problems.push(
          `${g.id} is documented as blocking, but job "${g.job}" swallows failures:\n      ${swallow[0].trim()}`
        );
      }
    }
  }

  // Running there, undocumented here.
  const documented = new Set(mine.map((g) => g.job).filter(Boolean));
  for (const job of Object.keys(jobs)) {
    if (NOT_A_GATE.has(job) || documented.has(job)) continue;
    problems.push(`${WORKFLOW} runs job "${job}", which no row in ${GATES_MD} accounts for.`);
  }

  console.log(`spec gate · ${REPO_KIND} repo · ${mine.length} documented gate(s) · ${Object.keys(jobs).length} CI job(s)`);
  if (problems.length === 0) {
    console.log('OK: the gate list matches the workflow.');
    return 0;
  }
  console.error(`\nFAIL: ${problems.length} mismatch(es):\n`);
  for (const p of problems) console.error('  ' + p);
  return 1;
}

process.exit(main());
