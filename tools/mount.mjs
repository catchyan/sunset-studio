#!/usr/bin/env node
/**
 * Mounts the studio framework into a project repository.
 *
 *   node mount.mjs --version v2.0.0
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
import { tmpdir } from 'node:os';

const STUDIO_REPO = process.env.STUDIO_REPO ?? 'https://github.com/catchyan/sunset-studio.git';
const MIRROR = join('docs', '_studio');

// Only what a project actually reads or runs. The studio's own board and
// changelog stay in the studio.
const INCLUDE = ['docs', 'templates', 'playbooks', 'tools/gates', 'tools/board', 'tools/lock.mjs'];

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
    const SYNC = join('tools', 'studio-sync.mjs');
    const syncTemplate = join(MIRROR, 'templates', 'tools', 'studio-sync.mjs');
    if (existsSync(syncTemplate)) {
      mkdirSync('tools', { recursive: true });
      const before = existsSync(SYNC) ? readFileSync(SYNC) : null;
      cpSync(syncTemplate, SYNC);
      const verb = before === null ? 'created' : before.equals(readFileSync(SYNC)) ? 'unchanged' : 'updated';
      console.log(`   ${SYNC} -> ${verb}`);
    }

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
    console.log('Next: run tools/studio-sync.mjs in CI so the mirror cannot drift.');
    return 0;
  } catch (err) {
    console.error(`Mount failed: ${err.message}`);
    return 1;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

process.exit(main());
