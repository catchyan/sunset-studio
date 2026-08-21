# SOP · 心跳（Heartbeat）

**何时使用**：每 2 小时（由 routine 触发）；以及任何一次工作会话结束时。
**输出**：`board/heartbeat/<你的代号>.md`（覆盖写）

---

## 格式（严格照抄，字段不许增删）

```markdown
# <代号> · <角色名> 心跳

- updated: 2026-08-20T14:00+08:00
- status: WORKING | IDLE | BLOCKED | REVIEWING | OFF
- task: T-042 · 格挡判定窗口
- progress: 3/5 步
- progress_detail: 已完成判定窗口与反击触发；剩余音画事件挂接、单测
- last_commit: a3f91c2
- lane_clean: true            # git status 是否干净（有无未提交改动）
- blocked: 无                  # 卡住的具体描述，或"无"
- blocked_since: —            # 卡住的起始时间
- next: 挂接 parry_success 事件到 VFX 总线
- eta: 今天 17:00
- locks_held: —               # 我当前持有的全局资源锁
- needs_from_others: —        # 我在等谁的什么东西
```

---

## 铁律

1. **哪怕没有进展也必须写。** 写"仍在处理 T-042 第 3 步，无进展，原因是 X"。
   **装作在思考是本项目最昂贵的行为。**
2. `progress` 用"已完成步数/总步数"，不要写百分比。百分比会撒谎，步数不会。
3. `blocked` 字段一旦非空：
   - 立刻在写完后 `@总督`
   - 同时填 `blocked_since`
   - 卡住超过 30 分钟才写是违规（宪法第十一条）
4. `needs_from_others` 非空时，必须同时 @ 对方。写在心跳里但不 @ 人，等于没写。
5. `lane_clean: false` 连续出现 3 次心跳 → 说明有长期未提交的改动，风险很高，
   总督会介入要求小步提交。

---

## `status` 取值含义

| 值 | 含义 |
|---|---|
| `WORKING` | 正在执行一个任务 |
| `IDLE` | 没有任务，等待派单（**这是正常状态，不要为了不 IDLE 而自己找活干**） |
| `BLOCKED` | 卡住，已写阻塞报告 |
| `REVIEWING` | 正在评审别人的 PR |
| `OFF` | 未激活（该里程碑还没轮到我） |

> ⚠️ **IDLE 不可耻，自作主张才可耻。**
> 没任务时不要自己去改代码"优化一下"。那是越界，且会制造评审负担。
> 正确做法：写 IDLE，@总督 说"我空了，有活吗"。

---

## 提交方式

心跳文件允许直接 push 到你自己的 lane 分支，**不需要 PR**：

```bash
cd /workspace/lanes/<你的 lane>
git add board/heartbeat/<代号>.md
git commit -m "chore(board): heartbeat <代号> [T-XXX]"
git push origin HEAD
```

总督的巡检会从各 lane 分支读取心跳。
