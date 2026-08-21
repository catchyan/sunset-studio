#!/usr/bin/env node
/**
 * Does the live branch protection actually enforce the gates?
 *
 * This exists because of a real failure. A repository was configured to require
 * a status check named after the *workflow* (`gates`) instead of the aggregate
 * *job* (`summary`). GitHub matches job names, so the required check never
 * reported. Every pull request showed seven green gates and a grey merge button,
 * and the repository was unmergeable for a day before anyone worked out why.
 *
 * Nothing inside a workflow can see this: protection is repository configuration,
 * not repository content. So it is checked from outside, on a schedule, by O1.
 *
 * Usage: node tools/verify-protection.mjs [owner/repo] [branch]
 * Needs: gh, authenticated with admin read on the repository.
 */

import { execFileSync } from 'node:child_process';

const REQUIRED_CHECK = 'summary';

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
}

function main() {
  const repo = process.argv[2] ?? JSON.parse(gh(['repo', 'view', '--json', 'nameWithOwner'])).nameWithOwner;
  const branch = process.argv[3] ?? 'main';

  let p;
  try {
    p = JSON.parse(gh(['api', `repos/${repo}/branches/${branch}/protection`]));
  } catch {
    console.error(`FAIL: ${repo}@${branch} has no branch protection at all.`);
    console.error('Without it every rule in this framework is a suggestion, because anyone can push past it.');
    return 1;
  }

  const problems = [];
  const contexts = p.required_status_checks?.contexts ?? [];

  if (!contexts.includes(REQUIRED_CHECK)) {
    problems.push(
      `Required checks are [${contexts.join(', ') || 'none'}], which does not include "${REQUIRED_CHECK}".\n` +
        '    Protection matches job names, not workflow names. A rule naming the workflow waits\n' +
        '    forever for a check that never reports, and nothing can merge.'
    );
  }
  for (const c of contexts) {
    if (c !== REQUIRED_CHECK) {
      problems.push(`Required check "${c}" is not a job in this workflow. Remove it or nothing will merge.`);
    }
  }
  if (p.required_status_checks?.strict !== true) {
    problems.push('Required checks are not strict, so a branch can merge without being current with main.');
  }
  if (p.enforce_admins?.enabled !== true) {
    problems.push('Administrators are exempt. The one account that can bypass the gates is the account every agent uses.');
  }
  if (p.allow_force_pushes?.enabled === true) {
    problems.push('Force pushes are allowed, so merged history can be rewritten and the audit trail is not one.');
  }
  if (p.allow_deletions?.enabled === true) {
    problems.push(`Branch deletion is allowed on ${branch}.`);
  }

  // Reviews are enforced by the envelope gate reading APPROVED-BY, not by
  // GitHub. Every agent drives one account, and GitHub will not let an account
  // approve its own pull request, so requiring a review here blocks everything.
  if (p.required_pull_request_reviews?.required_approving_review_count > 0) {
    problems.push(
      'GitHub review approval is required, and every agent shares one account.\n' +
        '    An author cannot approve their own pull request, so this setting blocks every merge.\n' +
        '    Peer review is enforced by the envelope gate (APPROVED-BY) instead. Set this to none.'
    );
  }

  console.log(`protection · ${repo}@${branch} · required=[${contexts.join(', ') || 'none'}]`);
  if (problems.length === 0) {
    console.log('OK: protection enforces the gates.');
    return 0;
  }
  console.error(`\nFAIL: ${problems.length} problem(s):\n`);
  problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}\n`));
  return 1;
}

process.exit(main());
