# SOP · 证据包（Evidence Pack）

**何时使用**：任何任务进入 REVIEW 之前。
**输出**：`evidence/T-XXX/`
**为什么**：宪法第七条禁止自评通过。"我测过了"不构成完成，**把跑的命令和完整输出交出来**才构成完成。

---

## 必需文件

```
evidence/T-XXX/
├── command.txt      # 你执行的验收命令原文（与任务信封第 6 段逐字一致）
├── output.txt       # 完整输出，含最后一行的退出码
├── diff-stat.txt    # git diff --stat origin/main...HEAD
├── env.txt          # node -v; pnpm -v; git rev-parse HEAD; date -Is
└── （按类型追加）
```

## 按任务类型追加的证据

| 任务类型 | 额外证据 |
|---|---|
| 视觉/渲染 | `before.png` + `after.png`（同机位同帧） |
| 手感/战斗 | `clip.gif` 或 `clip.mp4`（≥5 秒，含完整动作） + 帧数据测试输出 |
| 性能 | `bench.txt`（p50/p95/p99 帧时间）+ 与基线的对比 |
| 网络 | 测试台参数（RTT/抖动/丢包）+ 回滚次数统计 |
| 经济 | `econ-report.md` + 8 项判据的实际数值表 |
| 音频 | `sample.wav` + 响度测量（LUFS） |
| 文档 | 变更前后的 diff + 受影响的其他文档清单 |

---

## 生成方法（照抄即可）

```bash
TASK=T-XXX
mkdir -p evidence/$TASK

# 1. 命令原文
cat > evidence/$TASK/command.txt <<'EOF'
<把任务信封第 6 段的命令逐字粘进来>
EOF

# 2. 环境
{ node -v; pnpm -v; git rev-parse HEAD; date -Is; } > evidence/$TASK/env.txt

# 3. 实际执行并捕获完整输出（含退出码）
{ bash evidence/$TASK/command.txt; echo "EXIT_CODE=$?"; } 2>&1 | tee evidence/$TASK/output.txt

# 4. diff 统计
git diff --stat origin/main...HEAD > evidence/$TASK/diff-stat.txt
```

---

## 三条禁令

1. **禁止手写 output.txt。** 必须是真实执行的重定向输出。
   红队会在干净环境里重跑，编造的输出一定对不上，会被记为谎报。
2. **禁止截断输出。** 完整贴，包括警告和噪音。截断本身就可疑。
3. **禁止在 output.txt 里出现 `EXIT_CODE` 之外的退出码标记。**
   最后一行必须是 `EXIT_CODE=0`，否则任务不算完成。

---

## 红队会怎么检查你

闸门官每天随机抽 20% 的 DONE 任务：

```bash
git worktree add /tmp/redteam-$TASK <该任务合入后的 commit>
cd /tmp/redteam-$TASK && git clean -xfd
pnpm install
bash <你的 command.txt>
# 与你的 output.txt 比对
```

对不上就是谎报，记入 `board/trust-ledger.md`。

> 但注意：如果对不上是因为**环境问题**（依赖装不上、需要外部服务），
> 那不是谎报，是**流程缺陷**——说明验收命令不具备可重现性。
> 这种情况应该产出一条 SOP 变更提案（要求验收命令必须在干净环境可跑），而不是记账本。
