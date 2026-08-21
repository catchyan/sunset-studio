#!/usr/bin/env node
/**
 * G4 document gate: dead links, dangling SOP references, dangling path
 * references, unmeasurable wording, and — in the studio repo only — iron law
 * one: the framework layer must not absorb one game's content.
 *
 * Usage: node tools/gates/selfcheck.mjs
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const problems = [];

// The studio repo has a studio charter; a project repo does not. One script,
// two repos, so the mirror can run the same checks the framework runs on itself.
const IS_STUDIO = existsSync('docs/00-charter/studio-charter.md');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === '.git' || e === 'node_modules' || e === '_studio') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);

const SKILLS_DIR = ['docs/04-grokbot/skills', 'docs/_studio/docs/04-grokbot/skills'].find(existsSync);
const skills = new Set(SKILLS_DIR ? readdirSync(SKILLS_DIR).map((f) => f.replace(/\.md$/, '')) : []);

// Which backticked paths this repo is expected to actually contain. Studio docs
// refer to project-layer paths constantly — those exist in project repos, not
// here — and reporting them would train everyone to ignore this check.
// The studio's board holds only tasks, a backlog and an andon log; the rest of the
// board it describes — decisions, drift, playtests, the trust ledger — belongs to
// projects. Naming the three it has keeps its own cards under the same check a
// project's cards get, which is how the blocker-path defect stayed hidden: the
// studio never checked a `board/` path, so only the first project ever hit it.
const OWN_PATHS = IS_STUDIO
  ? /^(docs\/(00-charter|01-framework|02-roles|03-gates|04-grokbot|05-studio)|templates|playbooks|tools)\/|^board\/(tasks\/|backlog\.md|andon\.md)/
  : /^(docs|board)\//;
// Paths a project has and the studio does not, even though the parent directory
// is shared. The studio has no vision document and does not verify its own mirror.
const PROJECT_ONLY = /^(docs\/00-charter\/vision\.md|tools\/studio-sync\.mjs)$/;
// Paths named precisely because they do not exist. Every task card's escalation
// line names the blocker report to write at the third failed attempt, and a card
// whose blocker report already exists is a card that is already in trouble.
const NOT_YET = /^board\/blockers\//;

/**
 * Iron law one, mechanised.
 *
 * These are proper nouns a specific project's glossary gave a specific meaning.
 * Ordinary game vocabulary — block, coin, level, boss — is fine and stays fine,
 * because a framework written without concrete examples is a framework weak
 * agents cannot follow.
 */
const PROJECT_TERMS = [
  'Sunset Club',
  'Shining Soul',
  'Fantasy Westward Journey',
  'Vigor',
  'Delve Permit',
  'Silver Note',
  'Blade Instructor',
  'Twilight Heroes',
];

// The ledger and the roadmap have to be able to say which project a capability
// came from. Project names are allowed there; project vocabulary is not.
const LEDGER_FILES = /docs\/05-studio\/(capability-ledger|studio-roadmap)\.md$/;
const LEDGER_ALLOWED = /^(Sunset Club|Twilight Heroes)$/;

/**
 * Words that describe a target without letting anyone decide whether it was hit.
 * A spec that says "responsive" cannot fail, which means it also cannot pass.
 */
const UNMEASURABLE = [
  'feels good',
  'feel good',
  'as needed',
  'appropriate amount',
  'as appropriate',
  'reasonably fast',
  'good performance',
  'user-friendly',
  'intuitive',
  'polish pass',
];
const SPEC_FILES = /^docs\/(01-game|02-tech|03-gates)\//;

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const text = readFileSync(f, 'utf8');
  const isTemplate = /TEMPLATE\.md$/.test(rel);
  const isGlossary = /glossary\.md$/.test(rel);

  // 1. relative markdown links
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(resolve(dirname(f), target))) problems.push(`${rel}: dead link -> ${target}`);
  }

  // 2. /sop-xxx must resolve to a skill file
  for (const m of text.matchAll(/`?\/(sop-[a-z-]+)`?/g)) {
    if (m[1] === 'sop-xxx') continue;
    if (!skills.has(m[1])) problems.push(`${rel}: references a skill that does not exist: /${m[1]}`);
  }

  // 3. backticked in-repo paths
  for (const m of text.matchAll(/`((?:@studio\/)?[A-Za-z0-9_@][A-Za-z0-9_./*<>-]+)`/g)) {
    if (isTemplate) continue;
    const p = m[1].replace(/^@studio\//, '');
    if (/[*<>]/.test(p)) continue;
    if (/XXX|YYY|\bNN\b/.test(p)) continue;
    if (!OWN_PATHS.test(p) || PROJECT_ONLY.test(p) || NOT_YET.test(p)) continue;
    if (!existsSync(join(ROOT, p))) problems.push(`${rel}: references a path that does not exist: ${p}`);
  }

  // 4. unmeasurable wording in files that are supposed to be specifications
  if (SPEC_FILES.test(rel) && !isGlossary) {
    for (const bad of UNMEASURABLE) {
      if (text.toLowerCase().includes(bad)) {
        problems.push(`${rel}: "${bad}" states a target nobody can test. Give a number, a threshold, or a procedure.`);
      }
    }
  }

  // 5. iron law one
  if (IS_STUDIO && !isGlossary && !/selfcheck/.test(rel)) {
    for (const term of PROJECT_TERMS) {
      if (!text.includes(term)) continue;
      if (LEDGER_FILES.test(rel) && LEDGER_ALLOWED.test(term)) continue;
      problems.push(
        `${rel}: contains the project term "${term}". The framework layer does not carry one game's content.\n` +
          '      Generalise it, or move the paragraph down into the project repo.\n' +
          '      The test: hand this paragraph to a team building a card game. Can they use it?'
      );
    }
  }
}

console.log(`selfcheck: ${files.length} markdown file(s)${IS_STUDIO ? ' (studio mode: iron law one enforced)' : ''}`);
if (problems.length === 0) {
  console.log('OK: no problems.');
  process.exit(0);
}
console.error(`\nFAIL: ${problems.length} problem(s):`);
for (const p of problems) console.error('  ' + p);
process.exit(1);
