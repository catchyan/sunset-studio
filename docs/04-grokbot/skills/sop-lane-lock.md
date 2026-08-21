# SOP · 车道与资源锁（Lane & Lock）

**何时使用**：每次开始工作时；每次需要用到共享资源时。
**为什么**：**所有 Bot 共用同一台 Grok Bot 云电脑和同一个文件系统。**
这是本项目的头号技术风险。这份 SOP 是防止互相踩踏的全部依据。

---

## 一、车道（Lane）

### 目录布局

```
/workspace/sunset-club/          ← main 的 clone。只读参考。任何人不许在这里改任何东西
/workspace/lanes/P0-steward/     ← 总督的 worktree，分支 lane/P0
/workspace/lanes/A1-arch/        ← 架构的 worktree，分支 lane/A1
/workspace/lanes/E1-sim/         ← ...
```

### 三条铁律

1. **我只在 `/workspace/lanes/<我的代号>-<名>/` 里操作。**
   绝不 `cd` 进别人的 lane，绝不在 `/workspace/sunset-club/` 里改东西。
2. **我只修改 `@studio/docs/03-gates/ownership-schema.md` 中分配给我的路径。**
   CI 的 G5 闸门会检查 PR 的 diff 范围。**越界不看内容直接拒绝。**
3. **我绝不直接 push `main`。** 一切通过 PR。

### 开工序列（每次工作会话的第一件事）

```bash
cd /workspace/lanes/<我的 lane>
git fetch origin
git rebase origin/main          # 保持与主干同步，减少冲突
git status                      # 确认干净
git switch -c lane/<代号>/T-XXX  # 每个任务一个分支
```

### 需要改车道外文件时

**停手。** 三个选项，按优先级：

1. **最好**：@ 那条路径的所有者，请他改，你等着（同时把状态改成 BLOCKED，写清在等什么）
2. **次之**：在群里申请临时授权，得到所有者 + A1 明确同意后再改，PR 里注明"已获 @XX 授权"
3. **最差**：如果这暴露了车道划分本身有问题 → @架构 A1，请他修 `ownership.md`

**永远不要**："我先偷偷改一下，反正很小。" 这是宪法第四条的红线。

### 新建 lane（由 O1 运维官执行）

```bash
cd /workspace/sunset-club && git fetch origin
git worktree add -b lane/<代号> /workspace/lanes/<代号>-<名> origin/main
```

### 回收 lane

```bash
cd /workspace/sunset-club
git worktree remove /workspace/lanes/<代号>-<名>
git branch -D lane/<代号>
```

---

## 二、全局资源锁（Lock）

共享单机上有些资源天然是**全局唯一**的，两个 Bot 同时用一定出事：

| 资源类型 | 例子 |
|---|---|
| 端口 | `port:2567`（Colyseus）、`port:5173`（Vite dev）、`port:5432`（Postgres） |
| 包管理 | `pnpm-store`（并发 install 会损坏 store） |
| 数据库 | `db:dev`（迁移、种子数据） |
| 浏览器会话 | `browser:steam`、`browser:github` |
| 构建产物 | `build:client`（并发构建会互相覆盖 dist/） |
| 云电脑屏幕 | 每个 Bot 有自己的屏幕，但重的 computer-use 任务会抢 CPU |

### 加锁：追加一行并 push（git 提供原子性）

```bash
cd /workspace/lanes/<我的 lane>
git fetch origin && git rebase origin/main
# 编辑 board/locks.md，追加一行
git add board/locks.md
git commit -m "chore(lock): acquire port:2567 [T-XXX]"
git push origin HEAD:main      # 直推 main，仅限 board/locks.md
```

**push 成功 = 拿到锁。** push 被拒（有人抢先） → rebase 后重看表格：
- 那个资源已被占 → 你没拿到锁，等待或做别的
- 是别的资源冲突 → 重试

### `board/locks.md` 格式

```markdown
| 资源 | 持有者 | 获取时间 | 预计释放 | 用途 | 任务 |
|---|---|---|---|---|---|
| port:2567 | E3-server | 2026-08-20T14:02+08:00 | 15:00 | 跑权威服调试 | T-118 |
| pnpm-store | E1-sim | 2026-08-20T14:20+08:00 | 14:30 | 安装新依赖 | T-121 |
```

### 解锁：删行并 push

```bash
# 删掉你那一行
git commit -am "chore(lock): release port:2567 [T-XXX]"
git push origin HEAD:main
```

### 锁的纪律

1. **用完立刻释放。** 不要"我等下还要用"就一直占着。
2. **预计释放时间要保守。** 宁可写 30 分钟然后提前释放，也不要写 5 分钟然后占 2 小时。
3. **超时 1 小时** → 总督或运维官有权强制回收，并在 `board/infra-health.md` 记录。
4. **拿不到锁不要硬来。** 不要"反正他应该不在用了"就直接抢端口。把任务状态改成 BLOCKED，写清在等什么锁。
5. **锁等待频繁出现在心跳里 = 架构问题**，@运维 O1 想办法消除共享（比如给每个 lane 分配不同端口段）。

### 端口段分配（避免大部分端口锁）

| Bot | 端口段 |
|---|---|
| E1-sim | 5100–5199 |
| E2-client | 5200–5299 |
| E3-server | 5300–5399 |
| O1-ops | 5400–5499 |
| 其他 | 5500+ |

在自己的段内用端口**不需要加锁**。只有共享服务（数据库、staging）才需要。
