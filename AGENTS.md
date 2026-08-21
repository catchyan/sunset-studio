# AGENTS.md · 工作室仓库

> **任何 Agent 在对本仓库做任何操作之前，必须先读完这一页。**

---

## 这是什么仓库

这是**工作室的操作系统**，不是任何一款游戏。

这里放：宪法、章程、RELAY 协作框架、岗位定义、闸门定义、SOP、闸门工具、看板模板、
工作室成熟度路线图、效能指标、能力账本、新项目启动手册。

**这里不放任何一款具体游戏的内容。** 游戏在各自的项目仓库里。

```
sunset-studio  ← 你在这里。制度，跨项目，是复利资产
     │ tag 钉版本
     ├─────> sunset-club     《夕阳红俱乐部》
     └─────> （未来的项目）
```

## 最重要的一条

> **章程铁律一：制度层不允许出现任何一款具体游戏的内容。**

检验方法：**把这份文档交给一个做卡牌游戏的团队，他们能不能用？**

不能用的段落，就是混进来的项目内容，应该下沉到项目仓库。CI 会扫描已知的项目专名。

可以写：「负责手感的岗位」「帧数据类规格」「经济类变更需双人复核」
不能写：具体角色名、招式名、某款游戏的数值、某款游戏的里程碑

## 第二重要的一条

> **章程铁律二：制度的改动必须来自真实事故。**

每一个改动 SOP 或闸门的 PR，描述里必须回答：

> **这条改动，是哪一次真实的失败促成的？**（日期 / 任务号 / 事故记录链接）

回答不出来 → 拒绝合并。凭想象设计的流程会往"看起来严谨"的方向膨胀，
最终变成没人真的执行的仪式。

---

## 开工前的三句自检

**在你回复的第一段，必须回答这三句。答不出任何一句 → 不要开工，退回 @总督。**

1. 我读了哪些文件？（列出精确路径）
2. 我这次允许改哪些路径？（对照 `OWNERSHIP.md`）
3. 我的验收命令是什么？跑通它意味着什么？

## 本仓库的红线

1. **不改 `docs/00-charter/`**（宪法与章程）。需要改 → 提 ADR，人类批准。
2. **不在这里放游戏内容。** 见上。
3. **不直接 push main。** 一切通过 PR。
4. **改动 SOP / 闸门必须有事故背书。** 见上。
5. **不移动已发布的 tag。** 各项目的镜像清单会记录 tag 指向的 commit，移动 tag 会被回源校验抓到。
6. **改了闸门工具，必须同时改它的测试。** 闸门本身也需要被测试——
   `lane-check.test.mjs` 第一次运行就抓出了尾部 `/**` 匹配不到文件的 bug；
   没有那个测试，闸门会静默放行全部越界。
7. **发版本前必须写 CHANGELOG，每条带 ★ 起因。**

## 验收命令

```bash
node tools/gates/lane-check.test.mjs   # 车道归属断言
node tools/gates/selfcheck.mjs         # 死链 / 失效 SOP 引用 / 禁用术语 / 项目专名泄漏
```

## 文档地图

| 我想知道 | 读这个 |
|---|---|
| 工作室为什么存在、两个产品是什么 | `@studio/docs/00-charter/studio-charter.md` |
| 不可谈判的规矩 | `@studio/docs/00-charter/constitution.md` |
| 某个流程术语是什么意思 | `@studio/docs/00-charter/glossary.md` |
| 协作制度为什么这么设计 | `@studio/docs/01-framework/framework.md` |
| 日/周/里程碑的节奏 | `@studio/docs/01-framework/cadence.md` |
| 岗位职责 | `@studio/docs/02-roles/roles.md` |
| 什么算通过 | `@studio/docs/03-gates/gates.md` |
| 车道表怎么写 | `@studio/docs/03-gates/ownership-schema.md` |
| 怎么把 Bot 配起来 | `@studio/docs/04-grokbot/setup.md` |
| SOP 原文 | `docs/04-grokbot/skills/` |
| 工作室自己的里程碑 | `@studio/docs/05-studio/studio-roadmap.md` |
| 怎么衡量团队效能 | `@studio/docs/05-studio/metrics.md` |
| 我们现在会做什么了 | `@studio/docs/05-studio/capability-ledger.md` |
| 怎么发框架版本 | `@studio/docs/05-studio/versioning.md` |
| **怎么启动一款新游戏** | `@studio/playbooks/new-project.md` |

## 提交信息格式

```
<type>(<scope>): <描述>
```

`type`：`feat` / `fix` / `docs` / `refactor` / `test` / `chore`
`scope`：`charter` / `framework` / `roles` / `gates` / `sop` / `tools` / `studio`

> 本仓库的提交**不要求** `[T-XXX]`——制度改动往往不来自任务卡，而来自事故。
> 但必须在 PR 描述里写清 ★ 起因。
