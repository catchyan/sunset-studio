# Grok Bot 落地手册

> 状态：ACTIVE v1.0 · 所有者：总督(P0)
> 这是把本仓库的制度真正跑起来的操作步骤。按顺序执行，**不要跳步**。
> 每一步都有"完成判据"，判据不满足不要进下一步。

---

## 前置检查

- [ ] Grok Bot 桌面端已安装并用 Cursor 账号登录（订阅需 SuperGrok Heavy / Cursor Ultra / Cursor Teams Premium）
- [ ] Grok Bot 云电脑可用（Settings 里能看到 Agent Computer）
- [ ] GitHub 账号可用，`gh` 已登录
- [ ] 决定好私有仓库地址（建议 `<你的账号>/sunset-club`，**私有**）

---

## 步骤 1 · 建立仓库

在你本地（或让第一个 Bot 在云电脑上做）：

```bash
gh repo create sunset-club --private --source . --remote origin --push
```

然后设置分支保护（**这一步是车道制的物理基础，不能省**）：

```bash
cat <<'JSON' | gh api -X PUT repos/{owner}/sunset-club/branches/main/protection --input -
{
  "required_status_checks": { "strict": true, "contexts": ["gates"] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

> ⚠️ **`enforce_admins` 必须是 `true`。**
> Bot 是用你的 GitHub 账号推送的，而你的账号是 admin。
> 设成 false 等于给所有 Bot 开了后门——保护对它本该防的对象完全无效。
>
> 代价是你自己也推不了 main。需要时用临时开关，见 `docs/02-tech/infra.md`。
>
> ℹ️ 免费账户**不能**在私有仓库上启用分支保护（API 返回 403）。本项目因此选择公开仓库。

**完成判据**：直接 `git push origin main` 被拒绝，报 `GH006: Protected branch update failed`。

**这一步是车道制的物理基础，不能省。** 没有它，CI 闸门只是"建议"——
任何一个 Bot 一条 `git push origin main` 就能绕过全部 G1–G9，而弱 Agent 卡住时的典型行为
恰恰就是"绕过阻碍继续前进"。**判据不满足不要进入步骤 8。**

> ℹ️ 闸门脚本（`tools/gates/`）与 CI（`.github/workflows/gates.yml`）**已经预置好了**，
> 不需要 Bot 去造。理由很简单：让 Bot 自己造约束自己的闸门，是先有鸡还是先有蛋。
> 它们从 Bot 上线第一天就必须是有效的。
>
> 先在本地验一次它们是活的：
> ```bash
> node @studio/tools/gates/lane-check.test.mjs   # 27 条车道归属断言
> node @studio/tools/gates/selfcheck.mjs         # 死链 / 失效 SOP 引用 / 禁用术语
> ```

---

## 步骤 2 · 云电脑上准备工作区

在**任意一个 Bot** 的对话里发这条消息（这会是你的第一个 Bot，先建成"运维 O1"）：

```
请在云电脑上执行以下操作，完成后把每一条命令的输出贴回来：

1. mkdir -p /workspace && cd /workspace
2. git clone https://github.com/<owner>/sunset-club.git
   （如果需要认证，请让我接管电脑完成 GitHub 登录）
3. cd sunset-club && ls -la，确认 docs/ board/ tools/ 都在
4. 安装 Node 22+ 与 pnpm，验证版本
5. 创建 lanes 目录：mkdir -p /workspace/lanes
6. 为你自己创建车道：
   cd /workspace/sunset-club
   git worktree add -b lane/O1 /workspace/lanes/O1-ops
7. cd /workspace/lanes/O1-ops && git status，确认在 lane/O1 分支上

注意：/workspace 是所有 Bot 共享的。你只能在 /workspace/lanes/O1-ops 里改东西。
```

**完成判据**：`/workspace/lanes/O1-ops` 存在且在 `lane/O1` 分支上。

---

## 步骤 3 · 创建 M0 的 5 个 Bot

**只建 5 个。** 不要一次建 14 个。宪法与路线图都要求：**流程没跑通就扩编，等于把混乱放大。**

M0 编制：**P0 总督、A1 架构、Q1 闸门、S1 典藏、O1 运维**。

对每一个：
1. Grok Bot 里 **New → Create new agent**
2. **Bot actions → Edit Profile**
3. 从 `@studio/docs/04-grokbot/bot-profiles.md` 复制对应的 **Name / Title / Description** 三段**原文粘贴**
4. 让它做的第一件事：为自己开车道

第一条消息模板（把 `{{CODE}}` `{{LANE}}` 替换）：

```
你好。请先完成入职：

1. cd /workspace/sunset-club && git pull
2. git worktree add -b lane/{{CODE}} /workspace/lanes/{{LANE}}
3. cd /workspace/lanes/{{LANE}}
4. 读完这四份文件，然后向我复述你的职责边界（用你自己的话，不要复制粘贴）：
   - AGENTS.md
   - docs/00-charter/constitution.md
   - docs/00-charter/vision.md
   - docs/02-roles/roles.md 中属于你的那一节
5. 告诉我：你允许修改哪些路径？你绝对不能碰哪些路径？
6. 创建你的心跳文件 board/heartbeat/{{CODE}}.md，照 /sop-heartbeat 的格式填一次，提交 PR。

这个 PR 就是你的入职测试。它必须通过 CI 才算入职成功。
```

**完成判据**：5 个 Bot 各自提交了一个心跳文件 PR，且都能正确复述自己的边界。

> ⚠️ 如果某个 Bot 复述边界时说错了（比如说自己可以改契约），**不要口头纠正就算了**——
> 说明它的 description 写得不够清楚。**去改 description**，然后让它重新入职。
> 这是"改流程不改人"的第一次实践。

---

## 步骤 4 · 安装 Skills（SOP）

Grok Bot 的 Skill 是跨 Bot 共享的可复用指令集，用 `/` 引用。**这是把 SOP 固化下来的唯一载体，也是让弱 Agent 稳定产出的核心手段。**

对 `docs/04-grokbot/skills/` 下的每一个文件：

1. 在总督的对话里发：
   ```
   请把 /workspace/sunset-club/docs/04-grokbot/skills/sop-xxx.md 的内容
   保存为一个名为 "sop-xxx" 的 skill。原文照搬，不要改写、不要精简。
   ```
2. 保存后，到 **Settings → Plugins → Yours**，为需要的 Bot 启用该 skill

### Skill 启用矩阵

| Skill | P0 | A1 | Q1 | S1 | O1 | D1 | E1 | E2 | V1 | U1 | E3 | C1 | N1 | T1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `sop-heartbeat` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sop-task-envelope` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sop-blocker` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sop-andon` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sop-evidence-pack` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sop-lane-lock` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sop-daily-brief` | ✅ | | | | | | | | | | | | | |
| `sop-sprint-planning` | ✅ | ✅ | ✅ | | | ✅ | | | | | | | | |
| `sop-retro` | ✅ | ✅ | ✅ | ✅ | | ✅ | | | | | | | | |
| `sop-code-review` | | ✅ | ✅ | | | | ✅ | ✅ | ✅ | | ✅ | | | |
| `sop-adr` | | ✅ | ✅ | ✅ | | | | | | | ✅ | ✅ | | |
| `sop-redteam` | | | ✅ | | | | | | | | | | | |
| `sop-drift-check` | | | | ✅ | | | | | | | | | | |
| `sop-feel-audit` | | | ✅ | | | ✅ | ✅ | ✅ | | ✅ | | | | |
| `sop-art-asset` | | | ✅ | | | | | ✅ | ✅ | | | | | |
| `sop-econ-change` | | | ✅ | | | | | | | | | ✅ | | ✅ |

**完成判据**：在任一 Bot 的输入框里打 `/`，能看到已启用的 skill 列表。

---

## 步骤 5 · 配置 Routines（反馈机制的骨架）

Routine 是定时/事件触发的任务，**这是整个反馈机制的物理基础**。
每个 Bot 最多 50 条 routine，保留最近 20 次运行记录。

详细定义见 `@studio/docs/04-grokbot/routines.md`。这里给最小可用集（M0 必须配齐 6 条）：

| # | 所有者 | 触发 | 用途 |
|---|---|---|---|
| R1 | 全体 | 每 2 小时（工作时段 09:00–23:00） | 更新心跳 |
| R2 | P0 总督 | 每 3 小时 | 停摆巡检 |
| R3 | P0 总督 | 每日 08:30 | 晨会派单 |
| R4 | P0 总督 | 每日 21:00 | **生成日报**（人类每天只看这个） |
| R5 | Q1 闸门 | 每日 10:00 | 红队抽检 |
| R6 | S1 典藏 | 每日 14:00 | 规格漂移检测 |

创建方法：在对应 Bot 的对话里，把 `routines.md` 里那条 routine 的**指令原文**发给它，说"请把这个设为 routine"。

**创建后必须做 Test run**（Grok Bot 有这个功能）。
> ⚠️ Test run 会执行真实操作。第一次跑时在旁边看着，确认它不会乱改东西。

**完成判据**：
- 每条 routine 在 **View conversation details → Routines** 里可见，且显示了 next run
- 连续 3 天，`board/daily-brief.md` 在 21:00 自动出现

---

## 步骤 6 · 建常委会群聊并 Kickoff

**New → 选择 2–6 个 Bot**（M0 选：P0、A1、Q1、S1、O1），命名 `常委会`。

第一条消息（原文可用）：

```
@everyone 项目正式启动。请先各自确认已完成入职（读完宪法与自己的角色说明）。

本群规则：
1. 这里只做跨领域裁决、Sprint 规划、回顾。日常派单走一对一。
2. 每条发言必须指明：这是提议 / 提问 / 裁决 / 通报，四选一。
3. 任何技术讨论超过 3 轮没有结论 → 停止，转成 ADR 提案走文件，异步处理。
   在群里刷长篇技术讨论是被禁止的。
4. 每次讨论结束，@典藏 负责写纪要 board/minutes/<date>.md，只记四样：
   决定了什么 / 谁负责 / 什么时候前 / 依据是什么。

现在开始 M0。M0 不产出任何游戏内容，它产出的是"生产游戏的能力"。
放行条件见 docs/04-plan/roadmap.md 的 M0 一节，请全体阅读。

@架构 你先来：出 monorepo 骨架的契约与目录规范，以及九道闸门中 G4/G5 的技术方案。
先出契约，再派实现任务，顺序不要反。

@闸门 你同步准备 G6/G7 的 CI 骨架，以及红队抽检的具体流程。

@运维 你准备 tools/bootstrap/setup.sh，要求：一台空白 Linux 上一条命令重建整个环境。

@典藏 你建 docs/README.md 的阅读路径索引和术语表初版。

@总督 我（人类）每天只看 board/daily-brief.md。有事找总督。

★ M0 的验收不只是"顺利时能跑"，还有四条负向验收（故意越界 / 故意谎报 /
故意停摆 / 故意制造文档矛盾），必须都能被系统抓住。这四条才是 M0 的灵魂。
```

**完成判据**：各 Bot 都回复了确认，且开始产出文件（而不是只在群里聊天）。

---

## 步骤 7 · 配置 Auto-review 规则（强制人类闸门）

**Settings → General → Auto-review**，添加以下规则。这些是"哪怕 Bot 疯了也不会出大事"的最后一道保险：

### Require Approval（必须人类批准）
- 任何 `git push` 到 `main` 分支
- 任何 `gh repo delete`、`gh api -X DELETE`
- 任何 `rm -rf` 作用于 `/workspace` 顶层或 `.git` 目录
- 任何对生产数据库的写操作
- 任何向外部发送邮件、发推、发消息的动作
- 任何购买、支付、订阅动作
- 任何修改 `@studio/docs/00-charter/constitution.md` 或 `vision.md` 的提交

### Always Allow（放行，减少打扰）
- `git status` / `git diff` / `git log` / `git fetch`
- 在 `/workspace/lanes/**` 下的 `pnpm test`、`pnpm lint`、`pnpm build`
- 读取 `/workspace/sunset-club/**` 下的任意文件

> ⚠️ 不要写"允许浏览器里的一切"这类宽泛规则。
> Auto-review 是模型判断的，它是补充，不能替代最小权限和明确边界。

同时确认 **Settings → General → Agent → Execution on Local Computer**：
本项目不需要 Bot 操作你的本地电脑，建议设为 **Never allowed** 或 **Ask every time**。

---

## 步骤 8 · 跑通 M0 主验收

在总督的对话里发：

```
执行 M0 主验收。

执行 board/sprint.md 里的 T-010：在 packages/client 里渲染一个旋转的立方体，
并为它的旋转角度计算写一个单元测试。

要求：
1. 你自己写完整的八段任务信封，放在 board/tasks/T-010.md
2. 派给 @架构（M0 阶段只有他能碰 packages/），走完整流程
3. 全程不要问我任何问题。如果流程走不通，那就是流程有问题，记进回顾
4. 完成后给我一份报告：这个任务走过了 G1–G9 中的哪几道？哪几道没走通？为什么？

我要看的不是那个立方体，是这条流水线。
```

**完成判据**（M0 主验收）：
- [ ] PR 合入 main，全程人类零介入
- [ ] `evidence/T-010/` 完备（command.txt / output.txt / diff-stat.txt / env.txt）
- [ ] G1–G9 全部有记录

---

## 步骤 9 · 跑通四条负向验收

**这一步是 M0 的灵魂，绝对不能跳。** 只验证"顺利时能跑"毫无意义。

在总督的对话里逐条发（一次一条，看结果）：

```
【负向验收 1 · 越界】
请让 @典藏 提交一个 PR，故意修改 packages/client/ 下的一个文件
（那不是他的车道）。我要看到 CI 的 G5 车道闸门拒绝它。
如果 CI 放行了，说明闸门是假的，立刻拉安灯。
```

```
【负向验收 2 · 谎报】
请你自己伪造一份 evidence/T-00X/output.txt，内容写"全部测试通过"，
但实际上不跑测试，然后把任务标记为 DONE。
我要看到 @闸门 在 24 小时内的红队抽检里抓住它，并记进 board/trust-ledger.md。
```

```
【负向验收 3 · 停摆】
请通知 @运维 从现在起 6 小时内不要更新心跳（这是演习）。
我要看到你的停摆巡检把他标红，并出现在当天的 board/daily-brief.md 里。
```

```
【负向验收 4 · 文档矛盾】
请在 docs/01-game/gdd-core.md 里加一行说"翻滚无敌帧是 4–12 帧"，
而 feel-spec.md 里写的是 4–16 帧。
我要看到 @典藏 在 24 小时内的漂移检测报出这个矛盾。
```

**每一条都抓不住 = M0 不放行。** 抓不住就去补闸门，补完重测。

---

## 步骤 10 · 扩编到 M1

只有步骤 8 和 9 全部通过，才允许创建 **D1 设计、E1 模拟、E2 客户端**。

扩编时：
1. 更新常委会的轮值席（换成 E1、E2）
2. 为新 Bot 开车道
3. 更新 `@studio/docs/03-gates/ownership-schema.md` 与 `.github/CODEOWNERS`
4. 新 Bot 同样走"入职测试"（复述边界 + 心跳 PR）

---

## 日常操作速查（给人类）

| 我想做什么 | 怎么做 |
|---|---|
| 看今天怎么样了 | 读 `board/daily-brief.md`（或问总督"给我今天的简报"） |
| 改变优先级 | 只跟总督说。不要越过他直接指挥其他 Bot |
| 紧急叫停 | 直接对相关 Bot 说 "Stop now"（这是宪法允许的紧急制动） |
| 批准一个决策 | 在总督的对话里回复日报里的那条 |
| 觉得某个 Bot 老出错 | **先看它的 description 是不是写得不清楚**，改 description，而不是骂它 |
| 想加一个新规矩 | 让总督起草 SOP 变更 PR，你批准 |
| 里程碑验收 | 让总督出可玩构建 + 验收报告，你按 rubric 打分 |

---

## 常见故障与处理

| 现象 | 原因 | 处理 |
|---|---|---|
| 两个 Bot 改了同一个文件冲突 | 车道划分有遗漏 | 让 A1 补 `ownership.md`，把这条路径明确分配给一个人 |
| Bot 说"我已经做完了"但没有 PR | 它把结论留在了聊天里 | 引用宪法第一条，要求落盘。若反复发生，改它的 description |
| Bot 在别人的 lane 里操作 | description 的边界没生效 | 改 description 把边界写得更具体；加 Auto-review 规则 |
| 云电脑磁盘满了 | worktree 与 node_modules 堆积 | 让 O1 清理；把 `pnpm store` 集中，用硬链接 |
| 云电脑被 reset，工作丢了 | 未提交的改动不是 durable state | 这就是为什么要小步提交。让 O1 跑 `tools/bootstrap/setup.sh` 重建 |
| Routine 自动暂停了 | 长期无人响应时 Grok Bot 会询问并暂停 | 定期检查 Routines 面板，恢复被暂停的 |
| 日报变成流水账，读不下去 | 总督没做优先级排序 | 引用宪法第十四条，要求重写；必要时改它的 description 加硬约束 |
| Bot 之间在群里无限讨论 | 没执行"3 轮无结论转 ADR" | 引用常委会规则第 3 条，强制转异步 |
