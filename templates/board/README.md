# 看板（Board）

这是项目的**黑板**——所有 Bot 的状态、任务、警报都写在这里，且在 git 里，因此可 diff、可回滚、可审计。

**分区写入原则**：每个 Bot 只能写自己那一格（见 `@studio/docs/03-gates/ownership-schema.md`）。这是共享单机下唯一能防止互相覆盖的办法。

## 目录

| 文件/目录 | 内容 | Owner | 更新频率 |
|---|---|---|---|
| `daily-brief.md` | **人类每天只看这个** | P0 | 每日 21:00 |
| `sprint.md` | 唯一的任务真相（状态机） | P0 | 每日 |
| `tasks/T-XXX.md` | 任务信封（八段） | P0 | 派单时 |
| `heartbeat/<代号>.md` | 各 Bot 的心跳 | 各自 | 每 2 小时 |
| `stall-report.md` | 停摆巡检结果 | P0 | 每 3 小时 |
| `andon.md` | 安灯记录（全线停工警报） | 任何人追加 | 触发式 |
| `blockers/T-XXX.md` | 三振出局的阻塞报告 | 任何人 | 触发式 |
| `locks.md` | 全局资源锁 | 任何人（自己那行） | 触发式 |
| `trust-ledger.md` | 信任账本（谎报/越界/超时） | Q1 | 触发式 |
| `redteam/<date>.md` | 红队抽检报告 | Q1 | 每日 |
| `escapes/<id>.md` | 缺陷逃逸分析 | Q1 | 每次事故 |
| `drift.md` | 规格漂移 | S1 | 每日 |
| `minutes/<date>.md` | 常委会与回顾纪要 | S1 | 会后 |
| `retros/<week>.md` | 周回顾 + SOP 变更清单 | P0 | 每周五 |
| `demos/<week>.md` | 周 Demo 汇编 | P0 | 每周五 |
| `milestones/<M>.md` | 里程碑收敛报告 + 品味评分 | P0 | 里程碑结束 |
| `fun-audit/<date>.md` | 乐趣审计（D1 亲自试玩后写） | D1 | 每周 ≥1 |
| `econ-reports/<date>.md` | 经济模拟报告 | C1 | 每日（M5 起） |
| `telemetry/<week>.md` | 遥测周报 | T1 | 每周（M5 起） |
| `infra-health.md` | 环境健康 | O1 | 每日 |

## 阅读优先级（给人类）

```
1. daily-brief.md          ← 每天读这个就够了
2. andon.md                ← 如果有 OPEN 的，说明出事了
3. milestones/<M>.md       ← 里程碑验收时
4. retros/<week>.md        ← 想知道流程在不在改进
5. trust-ledger.md         ← 想知道哪个 Bot 不靠谱
```
