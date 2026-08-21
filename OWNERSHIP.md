# 本仓库的路径所有权

> Owner: A1 总架构师（需 P0 联署）· G5 车道闸门的唯一依据
> 表的**格式与规则**定义在 `docs/03-gates/ownership-schema.md`；这里是本仓库自己的**内容**。

| 路径 glob | Owner | 备注 |
|---|---|---|
| `docs/00-charter/constitution.md` | **人类** | 任何 Bot 不得修改 |
| `docs/00-charter/studio-charter.md` | **人类** | 任何 Bot 不得修改 |
| `docs/00-charter/glossary.md` | S1 | 只收流程术语 |
| `docs/01-framework/**` | P0 | |
| `docs/02-roles/**` | P0 | |
| `docs/03-gates/**` | Q1 | 车道表格式变更需 A1 联署 |
| `docs/04-grokbot/setup.md` | O1 | |
| `docs/04-grokbot/bot-profiles.md` | P0 | |
| `docs/04-grokbot/routines.md` | P0 | |
| `docs/04-grokbot/skills/**` | P0 | SOP 变更需 Q1 复核 + 人类批准 |
| `docs/05-studio/metrics.md` | Q1 | 指标定义变更需 P0 联署 |
| `docs/05-studio/capability-ledger.md` | A1 | 流程能力部分由 P0 填 |
| `docs/05-studio/studio-roadmap.md` | P0 | 放行需人类批准 |
| `docs/05-studio/versioning.md` | P0 | |
| `playbooks/**` | P0 | |
| `templates/**` | P0 | |
| `tools/gates/**` | Q1 | 改了必须同时改测试 |
| `tools/mount.mjs` | O1 | |
| `CHANGELOG.md` | 任何人 | **只能追加自己这次改动的条目**，每条必须带 ★ 起因。发版本时由 P0 整理 |
| `AGENTS.md` | P0 | |
| `README.md` | P0 | |
| `OWNERSHIP.md` | A1 | 需 P0 联署 |
| `.github/workflows/**` | Q1 | A1 可联署 |
| `.gitignore` | O1 | |

---

## 为什么 CHANGELOG 是「任何人」

因为**每一个改动 SOP 或闸门的 PR 都必须写变更记录**（章程铁律二要求带 ★ 起因）。

如果这个文件专属某一个 Bot，那么每一次修复都要么申请一次越界授权，
要么拆成两个 PR 等 P0 补写。两条路都很烦，而**烦的规矩会被绕过**——
真实的结果不会是"大家老老实实申请授权"，而是"大家渐渐不写 CHANGELOG 了"。

所以按 `board/andon.md` 的模式处理：**追加式共享**。
你只能加自己这次改动的条目，不能改别人的。发版本时由 P0 整理归类。

---

## 为什么工作室仓库也要有车道

只有 5 个常驻 Bot 会碰这个仓库，看起来不需要这么正式。

但**制度层的改动影响所有项目**，所以这里的纪律应该比项目仓库更严，不是更松。
一次没人负责的 SOP 改动，会同时传播到每一个项目。

另外还有一层意思：**我们自己不遵守的规矩，没有资格要求项目遵守。**
如果工作室仓库随便改，那"车道制"在所有人眼里就是一句只约束别人的话。
