#!/usr/bin/env node
/**
 * Mounts the studio framework into a project repository.
 *
 * A new project has no copy of this script, and cloning the whole studio just to
 * run one file is how the first project ended up hand-writing its own CI. Fetch
 * it at the tag you are mounting, so the mount logic and the framework it mounts
 * are the same release:
 *
 *   V=v3.0.0
 *   curl -fsSL "https://raw.githubusercontent.com/catchyan/sunset-studio/$V/tools/mount.mjs" -o mount.mjs
 *   node mount.mjs --version "$V" && rm mount.mjs
 *
 * Produces:
 *   .studio-version             the pinned tag
 *   docs/_studio/               a byte-for-byte mirror of that tag
 *   docs/_studio/MANIFEST.json  sha256 per file, checked by studio-sync
 *
 * A mirror rather than a submodule: weak agents lose submodules in every way
 * available — forgetting to init, committing a pointer without the content,
 * editing inside a detached HEAD. A mirror is just files, and reading files
 * requires no special knowledge.
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const STUDIO_REPO = process.env.STUDIO_REPO ?? 'https://github.com/catchyan/sunset-studio.git';
const MIRROR = join('docs', '_studio');

// Only what a project actually reads or runs. The studio's own board and
// changelog stay in the studio.
export const INCLUDE = [
  'docs',
  'templates',
  'playbooks',
  'tools/gates',
  'tools/board',
  'tools/lock.mjs',
  'tools/verify-protection.mjs',
];

/**
 * Files that a mount of `root` would copy, as mirror-relative paths.
 *
 * Exported because the mirror gate needs the same answer from the other side: a
 * manifest is only trustworthy if it lists everything it should, and a gate that
 * walks the manifest can never notice a file the manifest left out.
 */
export function mountableFiles(root) {
  const out = [];
  for (const item of INCLUDE) {
    const from = join(root, item);
    if (!existsSync(from)) continue;
    if (statSync(from).isDirectory()) {
      for (const p of walk(from)) out.push(relative(root, p).split(sep).join('/'));
    } else {
      out.push(item);
    }
  }
  return out.sort();
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * Copy a mirrored template into the project.
 *
 * The mirror gate is compared against its template on every run, so it is kept
 * in step. The workflow is not: projects add build and playtest jobs of their
 * own, and overwriting those on every re-mount would delete the project's work.
 */
function installTemplate(from, to, overwrite = true) {
  if (!existsSync(from)) return;
  const before = existsSync(to) ? readFileSync(to) : null;
  if (before !== null && !overwrite) {
    console.log(`   ${to} -> kept (yours)`);
    return;
  }
  mkdirSync(join(to, '..'), { recursive: true });
  cpSync(from, to);
  console.log(`   ${to} -> ${before === null ? 'created' : before.equals(readFileSync(to)) ? 'unchanged' : 'updated'}`);
}

function main() {
  const args = process.argv.slice(2);
  const vi = args.indexOf('--version');
  const version = vi >= 0 ? args[vi + 1] : null;
  if (!version) {
    console.error('Usage: node mount.mjs --version <tag>');
    return 2;
  }

  const tmp = mkdtempSync(join(tmpdir(), 'studio-'));
  try {
    console.log(`Fetching ${STUDIO_REPO} @ ${version} ...`);
    // Force LF. The mirror's hashes have to be platform independent: mounted on
    // Windows, verified on Linux CI, both sides must compute the same bytes.
    // autocrlf breaks that silently, and the resulting failure accuses the wrong
    // thing — it looks like somebody edited the framework.
    execSync(
      `git -c core.autocrlf=false -c core.eol=lf clone --depth 1 --branch ${version} ${STUDIO_REPO} "${tmp}"`,
      { stdio: 'pipe' }
    );

    const resolved = execSync('git rev-parse HEAD', { cwd: tmp, encoding: 'utf8' }).trim();

    if (existsSync(MIRROR)) rmSync(MIRROR, { recursive: true, force: true });
    mkdirSync(MIRROR, { recursive: true });

    for (const item of INCLUDE) {
      const from = join(tmp, item);
      if (!existsSync(from)) continue;
      const to = join(MIRROR, item);
      mkdirSync(join(to, '..'), { recursive: true });
      cpSync(from, to, { recursive: true });
    }

    // Written before the manifest is computed, so it is hashed like everything else.
    // The mirror gate treats an unlisted file as tampering, and it is right to: a file
    // nobody hashed is a file anybody can change.
    writeFileSync(
      join(MIRROR, 'README.md'),
      [
        '# Read-only mirror — change nothing here',
        '',
        `A byte-for-byte mirror of studio framework \`${version}\` (commit \`${resolved.slice(0, 7)}\`).`,
        '',
        '**CI verifies it. Editing it turns the build red, and no explanation will be accepted.**',
        '',
        'To change the framework: open a PR in the studio repo, cut a release, then raise',
        '`.studio-version` here. See `docs/_studio/docs/05-studio/versioning.md`.',
        '',
        'The reason for the rule: if every project could patch the framework in place, within',
        'a few months every project would have its own incompatible copy and the studio would',
        'have stopped existing.',
        '',
      ].join('\n')
    );

    const files = walk(MIRROR)
      .map((p) => relative(MIRROR, p).split(sep).join('/'))
      .filter((p) => p !== 'MANIFEST.json')
      .sort();

    const manifest = {
      version,
      commit: resolved,
      mountedAt: new Date().toISOString().slice(0, 10),
      files: Object.fromEntries(files.map((f) => [f, sha256(readFileSync(join(MIRROR, f)))])),
    };

    writeFileSync(join(MIRROR, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
    writeFileSync('.studio-version', version + '\n');

    // The mirror gate cannot live inside the mirror it verifies, so it is the one framework
    // file a project owns a copy of. Shipping it here rather than asking each project to
    // write its own: the first project to do that got a gate with no upstream comparison,
    // which is the half that catches a forged manifest.
    installTemplate(join(MIRROR, 'templates', 'tools', 'studio-sync.mjs'), join('tools', 'studio-sync.mjs'));

    // A project that has to write its own CI writes a subset of it. The first one
    // shipped without the upstream half of the mirror check and with branch
    // protection pointing at a job that did not exist, and both were invisible
    // until a pull request could not merge. Installed once, then owned by O1.
    installTemplate(
      join(MIRROR, 'templates', '.github', 'workflows', 'gates.yml'),
      join('.github', 'workflows', 'gates.yml'),
      false
    );

    const GA = '.gitattributes';
    const rule = 'docs/_studio/** -text';
    const ga = existsSync(GA) ? readFileSync(GA, 'utf8') : '';
    if (!ga.includes(rule)) {
      writeFileSync(
        GA,
        `${ga}${ga && !ga.endsWith('\n') ? '\n' : ''}# The mirror is verified byte for byte; any line-ending translation defeats that gate\n${rule}\n`
      );
      console.log(`   ${GA} -> added "${rule}"`);
    }

    console.log(`Mounted ${version} (${files.length} files).`);
    console.log('Next:');
    console.log('  1. node tools/studio-sync.mjs --remote');
    console.log('  2. node tools/verify-protection.mjs   (branch protection must require the "summary" job)');
    return 0;
  } catch (err) {
    console.error(`Mount failed: ${err.message}`);
    return 1;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Guarded, because the mirror gate imports this file for its list of mountable
// paths and importing a script should not run it.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(main());
}
