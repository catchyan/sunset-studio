#!/usr/bin/env node
/**
 * Mutual exclusion for resources the whole team shares: ports, databases, the
 * package store, anything global on the one machine every agent works on.
 *
 * Locks are annotated git tags named lock/<resource>. Pushing a tag that already
 * exists on the remote fails, and that failure is the lock: the check and the
 * claim are one operation, so two agents cannot both believe they won. The
 * earlier design pushed a markdown file straight to the default branch, which
 * branch protection correctly refuses, leaving no legal way to take a lock at all.
 *
 * Usage:
 *   node tools/lock.mjs acquire <resource> <holder> [reason]
 *   node tools/lock.mjs release <resource> <holder>
 *   node tools/lock.mjs list
 */

import { execFileSync } from 'node:child_process';

const MAX_AGE_HOURS = 4;

function git(args, quiet = false) {
  try {
    return { ok: true, out: execFileSync('git', args, { encoding: 'utf8', stdio: quiet ? 'pipe' : 'pipe' }) };
  } catch (err) {
    return { ok: false, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

const tagOf = (resource) => `lock/${resource}`;

function list() {
  const res = git(['ls-remote', '--tags', 'origin', 'refs/tags/lock/*']);
  const held = res.out
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t')[1]?.replace('refs/tags/', ''))
    .filter(Boolean);
  if (held.length === 0) {
    console.log('No locks held.');
    return 0;
  }
  console.log('Locks held:');
  for (const t of held) {
    const info = git(['tag', '-l', '--format=%(contents:subject)', t]);
    console.log(`  ${t.replace('lock/', '')}  ${info.out.trim()}`);
  }
  return 0;
}

function acquire(resource, holder, reason) {
  const tag = tagOf(resource);
  const message = `${holder} ${new Date().toISOString()} ${reason ?? ''}`.trim();

  git(['tag', '-d', tag], true);
  const made = git(['tag', '-a', tag, '-m', message]);
  if (!made.ok) {
    console.error(`Could not create the local tag: ${made.out.trim()}`);
    return 2;
  }

  const pushed = git(['push', 'origin', `refs/tags/${tag}`]);
  if (pushed.ok) {
    console.log(`Acquired ${resource}. Release it with: node tools/lock.mjs release ${resource} ${holder}`);
    return 0;
  }

  git(['tag', '-d', tag], true);
  git(['fetch', '--tags', '--force', 'origin'], true);
  const who = git(['tag', '-l', '--format=%(contents:subject)', tag]).out.trim();
  console.error(`${resource} is already locked${who ? ` by ${who}` : ''}.`);

  const stamp = who.split(' ')[1];
  const ageH = stamp ? (Date.now() - Date.parse(stamp)) / 3_600_000 : NaN;
  if (Number.isFinite(ageH) && ageH > MAX_AGE_HOURS) {
    console.error(
      `That lock is ${ageH.toFixed(1)}h old, over the ${MAX_AGE_HOURS}h limit.\n` +
        'Do not delete it yourself. Report it so the holder can be checked first: a lock outlives\n' +
        'its holder exactly when something went wrong, and that is worth looking at.'
    );
  }
  return 1;
}

function release(resource, holder) {
  const tag = tagOf(resource);
  git(['fetch', '--tags', '--force', 'origin'], true);
  const subject = git(['tag', '-l', '--format=%(contents:subject)', tag]).out.trim();
  if (!subject) {
    console.log(`${resource} is not locked.`);
    return 0;
  }
  if (holder && !subject.startsWith(holder)) {
    console.error(`${resource} is held by ${subject.split(' ')[0]}, not ${holder}. Releasing another holder's lock is how two jobs end up writing the same port.`);
    return 1;
  }
  const pushed = git(['push', '--delete', 'origin', `refs/tags/${tag}`]);
  git(['tag', '-d', tag], true);
  if (!pushed.ok) {
    console.error(`Could not release: ${pushed.out.trim()}`);
    return 1;
  }
  console.log(`Released ${resource}.`);
  return 0;
}

const [cmd, resource, holder, ...rest] = process.argv.slice(2);
switch (cmd) {
  case 'list':
    process.exit(list());
    break;
  case 'acquire':
    if (!resource || !holder) {
      console.error('Usage: node tools/lock.mjs acquire <resource> <holder> [reason]');
      process.exit(2);
    }
    process.exit(acquire(resource, holder, rest.join(' ')));
    break;
  case 'release':
    if (!resource) {
      console.error('Usage: node tools/lock.mjs release <resource> <holder>');
      process.exit(2);
    }
    process.exit(release(resource, holder));
    break;
  default:
    console.error('Usage: node tools/lock.mjs <acquire|release|list> ...');
    process.exit(2);
}
