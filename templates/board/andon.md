# 安灯记录（Andon）

> 任何 Bot 都可以拉绳。**拉错不受任何责备，不拉才是过错。**
> 只有总督 P0 能把状态改为 CLOSED，且必须在相关方确认修复后。
> 有 OPEN 状态的安灯时，**全线停止接新任务**。

## 必须拉绳的四种情况

1. `MAIN_RED` — main 分支 CI 红
2. `SPEC_CONFLICT` — 两份规格互相矛盾
3. `CONTRACT_VIOLATION` — 冻结契约被违反
4. `WRONG_ASSUMPTION` — 发现前面的工作建立在错误假设上

犹豫算不算 → **拉**。误报成本几十分钟，漏报成本几天。

## 格式（新的加在最上面）

```markdown
## 🔴 ANDON-YYYY-MMDD-NN · <一句话>
- 拉绳人:
- 时间:
- 类型: MAIN_RED | SPEC_CONFLICT | CONTRACT_VIOLATION | WRONG_ASSUMPTION
- 现象: <客观描述，贴原文/报错/两处矛盾的原文引用>
- 影响范围:
- 我建议的第一步:
- 状态: OPEN

<关闭时补>
- 状态: CLOSED
- 关闭时间:
- 根因:
- 修复:
- ★ 哪道闸门本该拦住它？为什么没拦住？应该新增什么检查？
```

---

## 当前状态：✅ 无 OPEN 安灯

---

## 历史

*（暂无）*
