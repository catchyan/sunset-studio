#!/usr/bin/env node
/**
 * G1 framework mirror gate.
 *
 * Three layers, because each one catches what the one before it cannot.
 *
 *   local    every file under docs/_studio/ hashes to what MANIFEST.json says.
 *   remote   the manifest itself is what the pinned tag actually contains.
 *   self     this file still matches the template inside the mirror.
 *
 * Without the second layer, editing a mirror file and updating its manifest entry to match
 * passes — which is the obvious next thing to try once the first layer rejects an edit.
 *
 * The third layer exists because this file cannot live inside the mirror it verifies, so it
 * is the one project-side file that could be quietly weakened. Comparing it against the
 * mirrored template does not make that impossible; it makes it show up in the diff as a
 * gate being disarmed, which is the thing a reviewer can actually act on.
 *
 * Written here by `mount.mjs` from `templates/tools/studio-sync.mjs`. Edit it upstream.
 *
 * Usage: node tools/studio-sync.mjs [--remote]
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';

const STUDIO_REPO = process.env.STUDIO_REPO ?? 'https://github.com/catchyan/sunset-studio.git';
const MIRROR = join('docs', '_studio');
const MANIFEST = join(MIRROR, 'MANIFEST.json');
const TEMPLATE = join(MIRROR, 'templates', 'tools', 'studio-sync.mjs');
const PIN = '.studio-version';

// Paths are reported with forward slashes on every platform, so a failure message can be
// pasted straight into a command whichever machine read it.
const SHOW = 'docs/_studio';

const problems = [];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * The mirror has to be exempt from end-of-line normalisation, and `.gitattributes` resolves
 * by last match — so a broad `* text=auto` rule placed after the mirror's `-text` rule
 * silently disables it. That happened once and cost an afternoon, because the symptom is
 * every mirror file reporting as modified on one machine and none on another.
 *
 * Asking git rather than reading the file: git's answer is the only one that accounts for
 * ordering, nested .gitattributes, and global configuration.
 */
function checkLineEndingRule() {
  let attr;
  try {
    attr = execSync(`git check-attr text -- "${MIRROR}/MANIFEST.json"`, { encoding: 'utf8' });
  } catch {
    // Not a git checkout — an unpacked tarball, or a container without git. The hash
    // comparison below still decides the verdict; only the diagnosis is unavailable.
    console.log('note: not a git checkout, skipping the line-ending rule check.');
    return;
  }
  if (!/:\s*text:\s*unset\s*$/m.test(attr)) {
    problems.push(
      `${SHOW}/ is not exempt from line-ending translation. git says: ${attr.trim()}\n` +
        '    .gitattributes needs "docs/_studio/** -text", placed after any "*" rule.'
    );
  }
}

/** CR-insensitive, so a checkout setting cannot masquerade as an edit. */
const normalise = (buf) => buf.toString('utf8').split('\r\n').join('\n');

function checkSelf() {
  if (!existsSync(TEMPLATE)) return; // Framework older than the template. The pin check covers it.
  const mine = normalise(readFileSync(fileURLToPath(import.meta.url)));
  const theirs = normalise(readFileSync(TEMPLATE));
  if (mine !== theirs) {
    problems.push(
      'tools/studio-sync.mjs differs from the template it was generated from\n' +
        `    (${SHOW}/templates/tools/studio-sync.mjs). This gate is the only check on the\n` +
        '    framework mirror, so weakening it locally is not a local change. Re-mount, or\n' +
        '    change it upstream and cut a release.'
    );
  }
}

function checkLocal() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

  const pinned = readFileSync(PIN, 'utf8').trim();
  if (pinned !== manifest.version) {
    problems.push(`${PIN} says ${pinned}, the manifest says ${manifest.version}.`);
  }

  const onDisk = new Set(
    walk(MIRROR)
      .map((p) => relative(MIRROR, p).split(sep).join('/'))
      .filter((p) => p !== 'MANIFEST.json')
  );

  for (const [file, want] of Object.entries(manifest.files)) {
    if (!onDisk.has(file)) {
      problems.push(`${SHOW}/${file} is missing.`);
      continue;
    }
    onDisk.delete(file);
    if (sha256(readFileSync(join(MIRROR, file))) !== want) {
      problems.push(`${SHOW}/${file} was modified in place.`);
    }
  }

  for (const extra of onDisk) problems.push(`${SHOW}/${extra} is not in the manifest.`);

  return manifest;
}

async function checkRemote(manifest) {
  const tmp = mkdtempSync(join(tmpdir(), 'studio-verify-'));
  try {
    // The same clone options the mount used, so both sides hash identical bytes. Without
    // them a Windows checkout translates line endings and the gate reports tampering when
    // the cause was a git setting — accusing a person for a configuration default.
    execSync(
      `git -c core.autocrlf=false -c core.eol=lf clone --depth 1 --branch ${manifest.version} ${STUDIO_REPO} "${tmp}"`,
      { stdio: 'pipe' }
    );

    for (const [file, want] of Object.entries(manifest.files)) {
      if (file === 'README.md') continue; // written by the mount; no upstream counterpart
      const src = join(tmp, file);
      if (!existsSync(src)) {
        problems.push(`${file} is in the manifest but not in ${manifest.version} upstream.`);
        continue;
      }
      if (sha256(readFileSync(src)) !== want) {
        problems.push(`${file}: the manifest hash does not match ${manifest.version} upstream — forged manifest.`);
      }
    }

    // Walking the manifest can only ever find files that are in it. A manifest that
    // omits a gate file describes a mirror missing that gate, and every hash in it
    // still checks out. The upstream mount rules are the only list of what should
    // have been there, so they are read from the clone rather than from anything
    // the project could have written.
    const mountPath = join(tmp, 'tools', 'mount.mjs');
    if (existsSync(mountPath)) {
      const { mountableFiles } = await import(pathToFileURL(mountPath).href);
      const listed = new Set(Object.keys(manifest.files));
      const absent = mountableFiles(tmp).filter((f) => !listed.has(f));
      if (absent.length) {
        problems.push(
          `${absent.length} file(s) in ${manifest.version} upstream are absent from the manifest, ` +
            'so the mirror is incomplete and the gate would never have said so:\n' +
            absent.slice(0, 10).map((f) => `      ${f}`).join('\n')
        );
      }
    }
  } catch (err) {
    problems.push(`Could not verify against upstream: ${err.message.split('\n')[0]}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

async function main() {
  if (!existsSync(MANIFEST)) {
    console.error(`FAIL: ${SHOW}/MANIFEST.json not found. Has the framework been mounted?`);
    return 1;
  }

  checkLineEndingRule();
  checkSelf();
  const manifest = checkLocal();
  const remote = process.argv.includes('--remote');
  if (remote) await checkRemote(manifest);

  console.log(
    `mirror gate · ${manifest.version} · ${Object.keys(manifest.files).length} file(s)` +
      (remote ? ' · verified against upstream' : ' · local only')
  );

  if (problems.length === 0) {
    console.log('OK: the mirror matches the pinned version.');
    return 0;
  }

  console.error(`\nFAIL: ${problems.length} problem(s):\n`);
  for (const p of problems) console.error('  ' + p);
  console.error(`
The mirror is read-only. To change the framework: open a pull request in the studio repo,
cut a release, then re-mount here and move ${PIN} in the same diff.
`);
  return 1;
}

process.exit(await main());
