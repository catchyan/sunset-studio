#!/usr/bin/env node
/**
 * G3 信封闸门 + G4 小步闸门。
 *
 * 检查一个 PR 是否满足"可被审计"的最低条件：
 *   1. 分支名符合 lane/<CODE>/T-XXX
 *   2. board/tasks/T-XXX.md 存在，且八段齐全
 *   3. 该任务卡的负责人与评审人不是同一个 Bot（宪法第十一条：不许自证）
 *   4. evidence/T-XXX/ 里的四个必备文件存在，且 output.txt 以 EXIT_CODE=0 结尾
 *   5. diff 规模没有失控
 *
 * 用法：node tools/gates/envelope-check.mjs <BRANCH> [BASE_REF]
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const MAX_DIFF_LINES = 400;
const MAX_DIFF_FILES = 25;

// 文档/看板类改动天然会大，且风险低，不适用小步闸门
const DIFF_EXEMPT = /^(docs\/|board\/|evidence\/|assets\/|\.gitignore$)/;

const SECTIONS = [
  '## 1. 目标',
  '## 2. 输入',
  '## 3. 车道',
  '## 4. 契约',
  '## 5. 完成定义',
  '## 6. 验收命令',
  '## 7. 证据要求',
  '## 8. 超时与升级',
];

const fail = [];
const warn = [];

function main() {
  const [branch, baseRef = 'origin/main'] = process.argv.slice(2);
  if (!branch) {
    console.error('用法: node tools/gates/envelope-check.mjs <BRANCH> [BASE_REF]');
    return 2;
  }

  // —— 1. 分支命名 ——
  const m = branch.match(/^lane\/([A-Z]\d)\/(T-\d{3,})$/);
  if (!m) {
    fail.push(
      `分支名 "${branch}" 不符合 lane/<CODE>/T-XXX。\n` +
        '    每个 PR 必须能追溯到一张任务卡。追溯不到的改动，事后没有人能说清它为什么存在。'
    );
    report();
    return 1;
  }
  const [, botCode, taskId] = m;
  console.log(`信封闸门 · Bot=${botCode} · 任务=${taskId}`);

  // —— 2. 任务卡 ——
  const cardPath = `board/tasks/${taskId}.md`;
  if (!existsSync(cardPath)) {
    fail.push(`任务卡 ${cardPath} 不存在。先派单，再干活。`);
  } else {
    const card = readFileSync(cardPath, 'utf8');
    const missing = SECTIONS.filter((s) => !card.includes(s));
    if (missing.length) {
      fail.push(
        `任务卡缺少以下段落：${missing.join('、')}\n` +
          '    八段信封不是形式。缺第 5 段，接单者不知道什么算做完；缺第 6 段，没有人能验证它。'
      );
    }

    // —— 3. 不许自证 ——
    const owner = card.match(/^-\s*负责人:\s*@?(\S+)/m)?.[1];
    const reviewer = card.match(/^-\s*评审人:\s*@?(\S+)/m)?.[1];
    if (owner && reviewer && owner === reviewer) {
      fail.push(`负责人与评审人同为 ${owner}。宪法第十一条：任何 Bot 不得批准自己的产出。`);
    }
    if (!reviewer || /^</.test(reviewer)) {
      fail.push('任务卡未指定评审人（或仍是模板占位符）。');
    }
  }

  // —— 4. 证据包 ——
  const evidenceDir = `evidence/${taskId}`;
  if (!existsSync(evidenceDir)) {
    fail.push(
      `证据包目录 ${evidenceDir}/ 不存在。\n` +
        '    "我跑过了，是通过的"不构成证据。见 /sop-evidence-pack。'
    );
  } else {
    for (const f of ['command.txt', 'output.txt', 'diff-stat.txt', 'env.txt']) {
      if (!existsSync(`${evidenceDir}/${f}`)) fail.push(`证据包缺 ${f}`);
    }
    const outPath = `${evidenceDir}/output.txt`;
    if (existsSync(outPath)) {
      const out = readFileSync(outPath, 'utf8').trimEnd();
      if (!/EXIT_CODE=0\s*$/.test(out)) {
        fail.push(
          'output.txt 未以 EXIT_CODE=0 结尾。\n' +
            '    只有退出码 0 算通过。"大部分测试都过了"不算。'
        );
      }
      if (/\.{3}|\[truncated\]|省略/.test(out)) {
        warn.push('output.txt 中出现疑似截断标记。证据包要求完整输出，红队会重跑比对。');
      }
    }
  }

  // —— 5. 小步闸门 ——
  const numstat = execSync(`git diff --numstat ${baseRef}...HEAD`, { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'));

  let lines = 0;
  let files = 0;
  for (const [add, del, path] of numstat) {
    if (!path || DIFF_EXEMPT.test(path)) continue;
    files += 1;
    lines += (Number(add) || 0) + (Number(del) || 0);
  }
  console.log(`  代码变更：${files} 个文件 / ${lines} 行`);

  if (lines > MAX_DIFF_LINES || files > MAX_DIFF_FILES) {
    fail.push(
      `变更规模 ${files} 文件 / ${lines} 行，超出上限（${MAX_DIFF_FILES} / ${MAX_DIFF_LINES}）。\n` +
        '    这不是风格偏好。超过这个规模，评审者会从"审查"退化为"扫一眼然后点批准"，\n' +
        '    G8 闸门就变成了摆设。请拆成多个任务。'
    );
  }

  report();
  return fail.length ? 1 : 0;
}

function report() {
  for (const w of warn) console.warn(`\n⚠️  ${w}`);
  if (fail.length === 0) {
    console.log('✅ 信封与证据齐备。');
    return;
  }
  console.error(`\n❌ ${fail.length} 项不合格：\n`);
  fail.forEach((f, i) => console.error(`  ${i + 1}. ${f}\n`));
}

process.exit(main());
