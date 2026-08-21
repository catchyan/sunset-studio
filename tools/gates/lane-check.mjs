#!/usr/bin/env node
/**
 * G5 车道闸门。
 *
 * 唯一依据是所有权表——刻意直接解析那份 markdown，
 * 而不是另建一份 JSON 配置。多一份配置就多一处会漂移的真相。
 *
 * 用法：node <path>/lane-check.mjs <BOT_CODE> [BASE_REF]
 * 退出码 0 = 放行，1 = 越界，2 = 用法/解析错误。
 *
 * 表的位置随仓库不同：工作室仓库在 OWNERSHIP.md，项目仓库在 docs/03-process/ownership.md。
 * 自动探测，也可用 OWNERSHIP_FILE 覆盖。
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CANDIDATES = ['OWNERSHIP.md', 'docs/03-process/ownership.md'];
const OWNERSHIP =
  process.env.OWNERSHIP_FILE ?? CANDIDATES.find((p) => existsSync(p)) ?? CANDIDATES[1];
const ANYONE = new Set(['任何人']);
const HUMAN = '人类';
// 框架镜像有唯一一种合法改法：升级钉住的版本。
// 标成「人类」会把这条唯一的路也堵死，于是升级只能靠 admin 强推——
// 一条必须被绕过才能工作的规则，等于教所有人规则是可以绕的。
const MIRROR = '框架';
const PIN = '.studio-version';

export function parseOwnership(md) {
  const rows = [];
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1);
    if (cells.length < 2) continue;
    const glob = cells[0].match(/`([^`]+)`/)?.[1];
    const owner = cells[1].replace(/\*/g, '').trim();
    if (!glob || !owner || owner === 'Owner' || owner.startsWith('---')) continue;
    rows.push({ glob: glob.trim(), owner });
  }
  if (rows.length === 0) throw new Error(`未能从 ${OWNERSHIP} 解析出任何所有权行`);
  return rows;
}

/** glob → 正则。只支持 ** 与 *，够用且行为可预测。 */
export function globToRegex(glob) {
  // 尾部 /** 表示"该目录下的一切"，包括更深层的文件
  const deep = /\/\*\*$/.test(glob);
  const base = deep ? glob.slice(0, -3) : glob;
  const esc = base.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const body = esc
    .replace(/\*\*\/?/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?');
  return new RegExp(`^${body}${deep ? '(?:/.*)?' : ''}$`);
}

/**
 * 匹配最长（最具体）的 glob。
 * 所有权表里有大量"例外"行，例如 packages/client/** 归 E2 但
 * packages/client/src/render/** 归 V1。具体的必须赢。
 */
export function ownerOf(file, rows) {
  let best = null;
  for (const row of rows) {
    if (globToRegex(row.glob).test(file)) {
      if (!best || row.glob.length > best.glob.length) best = row;
    }
  }
  return best;
}

function main() {
  const [botCode, baseRef = 'origin/main'] = process.argv.slice(2);
  if (!botCode) {
    console.error('用法: node tools/gates/lane-check.mjs <BOT_CODE> [BASE_REF]');
    console.error('BOT_CODE 从 PR 分支名 lane/<CODE>/T-XXX 中提取。');
    return 2;
  }

  const rows = parseOwnership(readFileSync(OWNERSHIP, 'utf8'));
  const changed = execSync(`git diff --name-only ${baseRef}...HEAD`, { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (changed.length === 0) {
    console.log('无文件变更。');
    return 0;
  }

  // 越界可以被显式授权，但必须留痕在 PR body 里，见 ownership.md 规则 3
  const prBody = process.env.PR_BODY ?? '';
  const overrides = [...prBody.matchAll(/^LANE-OVERRIDE:\s*(\S+)/gm)].map((m) => m[1]);

  const violations = [];
  for (const file of changed) {
    const row = ownerOf(file, rows);

    if (!row) {
      violations.push({ file, owner: '(无归属)', why: '所有权表里没有任何 glob 覆盖它。新增顶层路径前必须先更新所有权表。' });
      continue;
    }
    if (row.owner === HUMAN) {
      violations.push({ file, owner: HUMAN, why: '宪法保留文件，任何 Bot 不得修改。' });
      continue;
    }
    // 镜像可以变，但只能作为"升级钉住版本"的一部分整体地变。
    // 内容是否真的等于那个版本，由 G0 逐字节核对，这里只管"改法对不对"。
    if (row.owner === MIRROR) {
      if (!changed.includes(PIN)) {
        violations.push({
          file,
          owner: MIRROR,
          why:
            `框架镜像只能通过升级 ${PIN} 来改，本次 diff 里没有它。\n` +
            '      想改制度：去工作室仓库提 PR → 发新版本 → 在本仓库重新挂载。',
        });
      }
      continue;
    }
    // "各自"意味着每人只能写与自己代号同名的那个文件。
    // 心跳文件如果能互相覆盖，停摆巡检就失去意义了。
    if (row.owner === '各自') {
      const stem = file.split('/').pop().replace(/\.md$/, '');
      if (stem !== botCode) {
        violations.push({ file, owner: '各自', why: `这是 ${stem} 的文件，你是 ${botCode}。只能写与自己代号同名的那一个。` });
      }
      continue;
    }
    if (ANYONE.has(row.owner)) continue;
    if (row.owner === botCode) continue;
    if (overrides.some((o) => o === file || globToRegex(o).test(file))) {
      console.log(`  [override] ${file} (owner ${row.owner}) — PR 描述中已声明`);
      continue;
    }
    violations.push({ file, owner: row.owner, why: `归 ${row.owner}，你是 ${botCode}。` });
  }

  console.log(`车道闸门 G5 · Bot=${botCode} · 变更 ${changed.length} 个文件`);

  if (violations.length > 0) {
    console.error('\n❌ 越界，拒绝合并。宪法第四条：越界修改不看内容直接拒绝。\n');
    for (const v of violations) console.error(`  ${v.file}\n    → ${v.why}`);
    console.error('\n处理方式（三选一）：');
    console.error('  1. 把这些文件的改动撤掉，请对应的 Bot 去改；');
    console.error('  2. 在群里申请授权，并在 PR 描述里加 "LANE-OVERRIDE: <路径> (approved by @X in <链接>)"；');
    console.error('  3. 如果你认为所有权表划分不合理，@架构 A1 修表——但不要绕过它。\n');
    return 1;
  }

  console.log('✅ 全部在车道内。');
  return 0;
}

// 允许被测试文件 import 而不触发执行
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(main());
}
