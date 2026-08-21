#!/usr/bin/env node
/**
 * 仓库自检：死链、失效的 SOP 引用、失效的路径引用、禁用术语。
 * 在工作室仓库里额外执行**章程铁律一**：制度层不得混入具体游戏的内容。
 *
 * 用法：node tools/gates/selfcheck.mjs
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const problems = [];

// 工作室仓库有 studio-charter.md；项目仓库没有。同一份脚本两处复用。
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

const SKILLS_DIR = ['docs/04-grokbot/skills', 'docs/05-grokbot/skills', 'docs/_studio/docs/04-grokbot/skills'].find(existsSync);
const skills = new Set(SKILLS_DIR ? readdirSync(SKILLS_DIR).map((f) => f.replace(/\.md$/, '')) : []);

// 本仓库真正拥有的路径。工作室仓库没有 board/、没有游戏规格、没有 packages/，
// 也没有项目自己的 tools/（art-lint、asset-gen、bootstrap 都是项目层的）。
// vision.md 是个特例：目录是共享的，但那份文件只存在于项目仓库。
const OWN_PATHS = IS_STUDIO
  ? /^(docs\/(00-charter|01-framework|02-roles|03-gates|04-grokbot|05-studio)|templates|playbooks|tools\/gates)\//
  : /^(docs|board)\//;
const PROJECT_ONLY = /^docs\/00-charter\/vision\.md$/;

/**
 * 铁律一的机检。
 *
 * 拦的是**某个项目术语表里定义过的专名**，不是普通游戏词汇。
 * 「格挡」「金币」「关卡」任何游戏团队都懂，允许出现在示例里；
 * 「招架」「银币」「地下城」是某个项目给它们赋予了特定含义的词，不允许。
 *
 * 这条区分很重要：如果把所有游戏词都禁掉，SOP 就只能写抽象废话，
 * 而弱 agent 最需要的恰恰是具体示例。
 */
const PROJECT_TERMS = [
  '陆老三', '苏九娘', '老聂', '钟不二',
  '光明之魂', '梦幻西游',
  '体魄', '招架', '合击', '破防条', '旧伤', '肌肉记忆',
  '银币', '门票', '地下城', '英雄迟暮',
];

// 能力账本与路线图必须能指名道姓地说"这个能力来自哪个项目"，
// 否则它们就失去了记账的意义。项目**名**允许，项目**术语**不允许。
const LEDGER_FILES = /docs\/05-studio\/(capability-ledger|studio-roadmap)\.md$|sop-elevate\.md$/;

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const text = readFileSync(f, 'utf8');
  const isTemplate = /TEMPLATE\.md$/.test(rel);

  // 1. markdown 相对链接
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(resolve(dirname(f), target))) problems.push(`${rel}: 死链 -> ${target}`);
  }

  // 2. /sop-xxx 引用必须有对应的 skill 文件
  for (const m of text.matchAll(/`?\/(sop-[a-z-]+)`?/g)) {
    if (m[1] === 'sop-xxx') continue; // 占位示例
    if (!skills.has(m[1])) problems.push(`${rel}: 引用了不存在的 skill /${m[1]}`);
  }

  // 3. 反引号包裹的仓库内路径。
  //    工作室文档里大量引用 board/、docs/01-game/ 这类**项目层**路径——
  //    那是 Bot 在项目仓库里会看到的东西，工作室仓库里本来就没有。
  //    所以只校验确实属于本仓库的那些路径，其余跳过。
  //    在文件不存在的情况下报错，只会训练所有人忽略这个检查。
  for (const m of text.matchAll(/`((?:@studio\/)?[A-Za-z0-9_@][A-Za-z0-9_./*<>-]+)`/g)) {
    if (isTemplate) continue;
    const p = m[1].replace(/^@studio\//, '');
    if (/[*<>]/.test(p)) continue; // glob
    if (/XXX|YYY|<|\bNN\b/.test(p)) continue; // 占位符
    if (!OWN_PATHS.test(p) || PROJECT_ONLY.test(p)) continue; // 项目层引用
    if (!existsSync(join(ROOT, p))) problems.push(`${rel}: 引用了不存在的路径 ${p}`);
  }

  // 4. 禁用术语（不可判定的形容词式表述）
  if (!/glossary\.md|sop-drift-check\.md|board\/drift\.md|selfcheck/.test(rel)) {
    for (const bad of ['体力值', '架势条', '弹反', '连携技']) {
      if (text.includes(bad)) problems.push(`${rel}: 使用了禁用术语「${bad}」`);
    }
  }

  // 5. ★ 章程铁律一：制度层不得混入具体游戏的内容
  if (IS_STUDIO && !/glossary\.md|selfcheck/.test(rel)) {
    for (const term of PROJECT_TERMS) {
      if (!text.includes(term)) continue;
      if (LEDGER_FILES.test(rel) && /夕阳红|英雄迟暮/.test(term)) continue;
      problems.push(
        `${rel}: 出现项目专名「${term}」——制度层不得混入具体游戏的内容（章程铁律一）。\n` +
          `      改成通用表述，或把这一段下沉到项目仓库。\n` +
          `      检验方法：把这段话交给一个做卡牌游戏的团队，他们能不能用？`
      );
    }
  }
}

console.log(`自检 ${files.length} 个 markdown 文件${IS_STUDIO ? '（工作室模式：含铁律一检查）' : ''}`);
if (problems.length === 0) {
  console.log('✅ 无问题');
  process.exit(0);
}
console.error(`\n❌ ${problems.length} 个问题：`);
for (const p of problems) console.error('  ' + p);
process.exit(1);
