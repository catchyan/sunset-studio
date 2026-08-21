# T-XXX · <一句话标题>

- 状态: TODO
- 负责人: @<Bot 代号>
- 评审人: @<另一个 Bot 代号>（**不能是负责人自己**）
- 里程碑: M<N>
- 对应放行条件: <roadmap.md 里的具体那一条，逐字引用>
- 创建: YYYY-MM-DD
- 预计: 1 个工作会话

---

## 1. 目标（Why）

服务于 `<规格文件路径#章节>`。

做完之后，可观察的变化是：`<具体、可验证的描述。不要写"实现了 X"，要写"按下 X 键后会发生 Y">`

## 2. 输入（Read First）

接单者必须先读完这些，并在回复第一段逐条确认已读：

- `<精确路径#章节>`
- `<精确路径>`

## 3. 车道（Lane）

- 允许修改：`<glob>`
- 禁止触碰：`<glob>`

（必须与 `@studio/docs/03-gates/ownership-schema.md` 一致。不一致时以所有权表为准，并告知 @架构 修表）

## 4. 契约（Contracts）

必须遵守：`<契约文件路径>` v`<N>`（Status: FROZEN）

如需变更契约：**停手**，按 `/sop-adr` 提 ADR。不要自己改。

## 5. 完成定义（DoD）

- [ ] `<可勾选的具体项>`
- [ ] `<可勾选的具体项>`
- [ ] （战斗动作类）触感六件套齐全
- [ ] （涉及帧数据）与 `packages/content/combat/frames/*.json` 一致

## 6. 验收命令（Verify）

```bash
<一条或多条命令，串联执行，退出码 0 即通过>
```

> ★ 派单前总督自检：**我自己能跑通这条命令吗？** 跑不通就不许派。

## 7. 证据要求（Evidence）

`evidence/T-XXX/` 需含：
- `command.txt` · `output.txt` · `diff-stat.txt` · `env.txt`
- `<视觉/手感类另附>`：`screenshot.png` / `clip.gif`

## 8. 超时与升级（Escalation）

超过 4 小时无进展 → 按 `/sop-blocker` 写 `board/blockers/T-XXX.md` 并 @总督。

同一问题失败 3 次 → **必须停手**，严禁第 4 次相似尝试。

---

## 执行记录（接单者填）

| 时间 | 事件 |
|---|---|
| | 接单，三句自检通过 |
| | 开分支 `lane/<代号>/T-XXX` |
| | 首次跑验收命令（应为红） |
| | 自验通过（EXIT_CODE=0） |
| | 开 PR #<N>，状态改 REVIEW |

## 评审记录（评审者填）

- 评审人：
- 评审时间：
- `/sop-code-review` 检查单：全部勾选 ☐
- 我在自己的 lane 里 checkout 并**真的跑了一次**验收命令：☐
- 结论：APPROVE / REJECT（引用具体闸门条款）
