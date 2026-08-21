# 路径所有权表（Ownership）

> 状态：ACTIVE v1.0 · 所有者：总架构师(A1)
> 本表是 G5 车道闸门的唯一依据，也用于生成 `.github/CODEOWNERS`。
> **越界修改不看内容直接拒绝**（宪法第四条）。

---

## 规则

1. 每条路径**有且只有一个** owner。没有共管（联署除外，见下）。
2. Bot 只能修改自己 owner 的路径。
3. 需要改别人的路径 → 请对方改；或在群里申请授权，PR 描述里写：
   ```
   LANE-OVERRIDE: packages/protocol/src/combat-events.ts (approved by @A1 in <消息链接>)
   ```
4. 本表本身由 A1 维护；A1 修改本表需 P0 联署。
5. 新增 Bot 或新增顶层目录时，**必须先更新本表**，再开工。

---

## 所有权表

| 路径 glob | Owner | 备注 |
|---|---|---|
| `@studio/docs/00-charter/constitution.md` | **人类** | 任何 Bot 不得修改 |
| `docs/00-charter/vision.md` | **人类** | 任何 Bot 不得修改 |
| `@studio/docs/00-charter/glossary.md` | S1 | |
| `docs/README.md` | S1 | |
| `docs/01-game/gdd-core.md` | D1 | |
| `docs/01-game/feel-spec.md` | D1 | 帧数据表变更需 CI 快照同步 |
| `docs/01-game/gdd-encounters.md` | D1 | |
| `docs/01-game/gdd-economy.md` | C1 | |
| `docs/01-game/econ-dashboard.md` | C1 | |
| `docs/01-game/gdd-world.md` | N1 | |
| `docs/01-game/art-bible.md` | V1 | |
| `docs/01-game/audio-bible.md` | U1 | |
| `docs/01-game/telemetry-spec.md` | T1 | |
| `docs/02-tech/**` | A1 | 含 contracts/ 与 adr/ |
| `docs/02-tech/adr/INDEX.md` | S1 | 例外：索引由典藏官维护 |
| `docs/02-tech/infra.md` | O1 | 例外 |
| `docs/02-tech/backup.md` | O1 | 例外 |
| `@studio/docs/01-framework/framework.md` | P0 | |
| `@studio/docs/02-roles/roles.md` | P0 | |
| `@studio/docs/01-framework/cadence.md` | P0 | |
| `@studio/docs/03-gates/ownership-schema.md` | A1 | 需 P0 联署 |
| `@studio/docs/03-gates/gates.md` | Q1 | |
| `docs/04-plan/**` | P0 | 里程碑定义变更需人类批准 |
| `docs/04-grokbot/**` | P0 | SOP 变更需 Q1 复核 + 人类批准 |
| `packages/sim/**` | E1 | |
| `packages/client/**` | E2 | |
| `packages/client/src/render/**` | V1 | 例外：渲染管线归视觉总监 |
| `packages/client/src/audio/**` | U1 | 例外 |
| `packages/server/**` | E3 | |
| `packages/protocol/**` | A1 | E3 可联署 |
| `packages/content/combat/**` | D1 | |
| `packages/content/economy/**` | C1 | |
| `packages/content/narrative/**` | N1 | |
| `packages/content/i18n/**` | N1 | |
| `packages/content/schema/**` | A1 | |
| `packages/econ-sim/**` | C1 | |
| `packages/telemetry/**` | T1 | |
| `packages/shared/**` | A1 | |
| `assets/audio/**` | U1 | |
| `assets/**`（其余） | V1 | |
| `tools/art-lint/**` | V1 | |
| `tools/asset-gen/**` | V1 | |
| `tools/gates/**` | Q1 | |
| `tools/bootstrap/**` | O1 | |
| `tools/lanes/**` | O1 | |
| `tools/board/**` | P0 | |
| `deploy/**` | O1 | |
| `deploy/server/**` | E3 | 例外 |
| `.github/workflows/**` | Q1 | A1 可联署 |
| `.github/CODEOWNERS` | A1 | 由本表生成 |
| `package.json` | A1 | 根目录构建配置 |
| `pnpm-workspace.yaml` | A1 | |
| `pnpm-lock.yaml` | A1 | 改动需说明原因 |
| `tsconfig*.json` | A1 | |
| `vite.config.*` | A1 | |
| `AGENTS.md` | P0 | |
| `README.md` | P0 | |
| `.gitignore` | O1 | |
| `board/sprint.md` | P0 | |
| `board/tasks/**` | P0 | |
| `board/daily-brief.md` | P0 | |
| `board/stall-report.md` | P0 | |
| `board/demos/**` | P0 | |
| `board/retros/**` | P0 | 由 S1 起草，P0 定稿 |
| `board/minutes/**` | S1 | |
| `board/drift.md` | S1 | |
| `board/trust-ledger.md` | Q1 | |
| `board/redteam/**` | Q1 | |
| `board/escapes/**` | Q1 | |
| `board/econ-reports/**` | C1 | |
| `board/telemetry/**` | T1 | |
| `board/fun-audit/**` | D1 | |
| `board/infra-health.md` | O1 | |
| `board/heartbeat/*.md` | 各自 | **只能写与自己代号同名的那一个文件**；由 CI 按分支上的 Bot 代号校验 |
| `board/econ-proposals/**` | C1 | |
| `board/salvage/**` | O1 | 车道清理时抢救出来的未提交内容 |
| `board/milestones/**` | P0 | |
| `board/blockers/**` | 任何人 | 追加自己的阻塞报告 |
| `board/andon.md` | 任何人 | **追加**（不许删别人的条目）；只有 P0 能改状态为 CLOSED |
| `board/locks.md` | 任何人 | 只能追加/删除**自己**那一行 |
| `evidence/T-XXX/**` | 该任务的负责人 | |

---

## M0 阶段的临时安排

M0 只有 5 个 Bot（P0/A1/Q1/S1/O1），但需要建 `packages/` 骨架。临时规定：

- `packages/**` 在 M0 阶段全部归 **A1**
- M1 扩编时，A1 按上表把车道正式移交给 E1/E2
- 移交时必须写一条 ADR 记录移交范围

---

## 生成 CODEOWNERS

```bash
pnpm tools:gen-codeowners
```

把本表转换成 `.github/CODEOWNERS`。GitHub 会据此自动请求评审。

> 注意：GitHub CODEOWNERS 需要真实的 GitHub 账号。由于 Bot 共用一个人类账号提交，
> CODEOWNERS 在本项目里主要起**文档作用**，真正的强制来自 CI 的 `gates:lane`。
> 这是刻意的设计：**不要依赖 GitHub 的机制，依赖我们自己能控制的 CI 检查。**
