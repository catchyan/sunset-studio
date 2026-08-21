#!/usr/bin/env node
/**
 * 车道闸门自测（工作室层）。
 *
 * 这里测的是 **glob 匹配引擎本身**，不是任何一个项目的所有权表。
 * 项目的表由项目自己写断言（见 playbooks/new-project.md 阶段 2）。
 *
 * 为什么这个测试必须存在：
 * 第一次运行它时，它抓出了尾部 `/**` 匹配不到任何深层文件的 bug。
 * 没有它，G5 会静默放行全部越界——一道假装在工作的闸门，比没有闸门更危险，
 * 因为所有人都以为自己被保护着。
 *
 * 用法：node tools/gates/lane-check.test.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { globToRegex, ownerOf as resolve, parseOwnership } from './lane-check.mjs';

let failed = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? '✅' : '❌'} ${label}${ok ? '' : `  ${detail}`}`);
};

// ───────────────────────── 1. glob 引擎 ─────────────────────────
console.log('【glob 匹配引擎】\n');

const G = [
  // [glob, 应匹配, 不应匹配]
  ['packages/sim/**', ['packages/sim/a.ts', 'packages/sim/src/deep/b.ts'], ['packages/simx/a.ts', 'packages/client/a.ts']],
  ['docs/*.md', ['docs/a.md'], ['docs/sub/a.md', 'docs/a.txt']],
  ['board/heartbeat/*.md', ['board/heartbeat/A1.md'], ['board/heartbeat/x/A1.md', 'board/A1.md']],
  ['package.json', ['package.json'], ['packages/package.json', 'package.jsonx']],
  ['.github/workflows/**', ['.github/workflows/ci.yml'], ['.github/CODEOWNERS']],
  ['assets/audio/**', ['assets/audio/hit.wav', 'assets/audio/sfx/hit.wav'], ['assets/art/a.png']],
];

for (const [glob, hits, misses] of G) {
  const re = globToRegex(glob);
  for (const h of hits) check(re.test(h), `${glob}  匹配  ${h}`, '(应匹配却没匹配)');
  for (const m of misses) check(!re.test(m), `${glob}  不匹配  ${m}`, '(不应匹配却匹配了)');
}

// ─────────────────── 2. 最长优先（例外行必须赢） ───────────────────
console.log('\n【最长 glob 优先】\n');

const synthetic = parseOwnership(`
| 路径 glob | Owner |
|---|---|
| \`packages/client/**\` | E2 |
| \`packages/client/src/render/**\` | V1 |
| \`packages/client/src/audio/**\` | U1 |
| \`docs/**\` | S1 |
| \`docs/tech/architecture.md\` | A1 |
`);

const S = [
  ['packages/client/src/main.ts', 'E2'],
  ['packages/client/src/render/pass.ts', 'V1'],
  ['packages/client/src/audio/mixer.ts', 'U1'],
  ['docs/anything.md', 'S1'],
  ['docs/tech/architecture.md', 'A1'],
];
for (const [file, want] of S) {
  const got = resolve(file, synthetic)?.owner ?? '(无归属)';
  check(got === want, `${file.padEnd(38)} -> ${got}`, `(期望 ${want})`);
}

// 无归属必须是可检测的状态，不能悄悄放行
check(resolve('unknown/path.txt', synthetic) === null, '未覆盖路径返回 null（会被判为无归属）');

// ─────────────────── 3. 框架镜像的特殊规则 ───────────────────
// 镜像只能作为"升级钉住版本"的一部分整体地变。
// 这条规则如果写错，要么升不了级（必须 admin 强推），要么谁都能偷改制度。
console.log('\n【框架镜像 owner=框架】\n');

const mirrorRows = parseOwnership(`
| 路径 glob | Owner |
|---|---|
| \`docs/_studio/**\` | 框架 |
| \`.studio-version\` | A1 |
`);
check(resolve('docs/_studio/docs/00-charter/constitution.md', mirrorRows)?.owner === '框架',
  '镜像深层文件解析为「框架」');
check(resolve('.studio-version', mirrorRows)?.owner === 'A1',
  '.studio-version 本身有正常 owner（否则升级时它自己会越界）');

// ─────────────────── 4. 工作室自己的所有权表 ───────────────────
// 本文件会被镜像进各个项目仓库，在那里跑时只该测引擎（上面两节）。
// 项目自己的表由项目写断言，见 playbooks/new-project.md 阶段 2。
const IN_STUDIO = existsSync('docs/00-charter/studio-charter.md');

if (!IN_STUDIO) {
  console.log('\n【工作室 OWNERSHIP.md】跳过 — 当前在项目仓库，只测引擎');
} else {
  console.log('\n【工作室 OWNERSHIP.md】\n');
  const rows = parseOwnership(readFileSync('OWNERSHIP.md', 'utf8'));
  console.log(`解析出 ${rows.length} 行\n`);
  const R = [
    ['docs/00-charter/constitution.md', '人类'],
    ['docs/00-charter/studio-charter.md', '人类'],
    ['docs/00-charter/glossary.md', 'S1'],
    ['docs/01-framework/framework.md', 'P0'],
    ['docs/02-roles/roles.md', 'P0'],
    ['docs/03-gates/gates.md', 'Q1'],
    ['docs/04-grokbot/skills/sop-andon.md', 'P0'],
    ['docs/05-studio/metrics.md', 'Q1'],
    ['playbooks/new-project.md', 'P0'],
    ['tools/gates/lane-check.mjs', 'Q1'],
    ['tools/mount.mjs', 'O1'],
    ['AGENTS.md', 'P0'],
  ];
  for (const [file, want] of R) {
    const got = resolve(file, rows)?.owner ?? '(无归属)';
    check(got === want, `${file.padEnd(40)} -> ${got}`, `(期望 ${want})`);
  }
}

if (failed) {
  console.error(`\n❌ ${failed} 个用例失败。在修好之前，G5 车道闸门是不可信的。`);
  process.exit(1);
}
console.log('\n✅ 车道闸门逻辑正确。');
