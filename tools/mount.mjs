#!/usr/bin/env node
/**
 * 把工作室框架挂载到一个项目仓库。
 *
 *   node mount.mjs --version v1.0.0
 *
 * 产出：
 *   .studio-version        钉住的 tag
 *   docs/_studio/          该 tag 的只读镜像，Bot 直接本地读
 *   docs/_studio/MANIFEST.json  每个文件的 sha256，供 studio-sync 校验
 *
 * 为什么是镜像而不是 submodule：
 *   弱 Agent 在 submodule 上翻车的概率很高——忘记 init、提交了指针没推内容、
 *   detached HEAD 里改了东西。镜像是普通文件，读起来没有任何特殊知识要求。
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';

const STUDIO_REPO = process.env.STUDIO_REPO ?? 'https://github.com/catchyan/sunset-studio.git';
const MIRROR = join('docs', '_studio');

// 镜像里只放项目真正需要读的东西。工作室自己的看板、CHANGELOG 不进项目仓库。
const INCLUDE = ['docs', 'templates', 'tools/gates', 'playbooks'];

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
    console.error('用法: node mount.mjs --version <tag>');
    console.error('例如: node mount.mjs --version v1.0.0');
    return 2;
  }

  const tmp = mkdtempSync(join(tmpdir(), 'studio-'));
  try {
    console.log(`拉取 ${STUDIO_REPO} @ ${version} ...`);
    // 强制 LF。镜像的哈希必须与平台无关：在 Windows 上挂载、在 Linux 的 CI 上校验，
    // 两边算出来的必须是同一个值。autocrlf 会让这件事悄无声息地失败。
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
      cpSync(from, join(MIRROR, item), { recursive: true });
    }

    // 清单在校验时被排除，否则自己哈希自己
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

    // 没有这一条，git 会在 Windows 上把镜像转成 CRLF、提交时转回 LF，
    // 于是 CI 在 Linux 上校验的内容和本地生成清单时的内容不是同一份字节。
    const GA = '.gitattributes';
    const rule = 'docs/_studio/** -text';
    const ga = existsSync(GA) ? readFileSync(GA, 'utf8') : '';
    if (!ga.includes(rule)) {
      writeFileSync(GA, `${ga}${ga && !ga.endsWith('\n') ? '\n' : ''}# 制度镜像逐字节校验，任何行尾转换都会让 G0 闸门失效\n${rule}\n`);
      console.log(`   ${GA} -> 已加入 "${rule}"`);
    }
    writeFileSync(
      join(MIRROR, 'README.md'),
      [
        '# ⚠️ 只读镜像 — 不要在这里改任何东西',
        '',
        `本目录是工作室框架 \`${version}\` 的逐字节镜像（commit \`${resolved.slice(0, 7)}\`）。`,
        '',
        '**它由 CI 校验，改了会红，而且不会有人接受你的解释。**',
        '',
        '想改制度 → 回 sunset-studio 仓库提 PR → 发新版本 → 在本仓库升级 `.studio-version`。',
        '',
        '这条规则的意义：如果每个项目都能就地改制度，那么半年后各项目会有各自互不兼容的框架，',
        '工作室就不存在了。',
        '',
        '升级方式见 `docs/_studio/docs/05-studio/versioning.md`。',
        '',
      ].join('\n')
    );

    console.log(`✅ 已挂载 ${version}（${files.length} 个文件）`);
    console.log(`   .studio-version -> ${version}`);
    console.log(`   ${MIRROR}/ -> 只读镜像`);
    console.log('\n下一步：把 tools/studio-sync.mjs 加入 CI，确保镜像不被就地修改。');
    return 0;
  } catch (err) {
    console.error(`挂载失败: ${err.message}`);
    return 1;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

process.exit(main());
