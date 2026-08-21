# 规格漂移（Drift）

> Owner: S1 典藏官 · 每日 14:00 由 routine 生成
> **宪法要求：发现漂移必须"要么改代码，要么改规格"，不许两者并存。**
> S1 只负责发现和标记，修改由规格所有者做，但 S1 有权要求 24 小时内消除。
> 超过 48 小时未消除 → @总督，进日报风险区。

---

## 检测范围

### A. 代码 vs 规格
| 规格 | 对应代码/数据 |
|---|---|
| `docs/01-game/feel-spec.md` 帧数据表 | `packages/content/combat/frames/*.json` |
| `docs/01-game/gdd-economy.md` 公式与数值 | `packages/content/economy/**` |
| `docs/02-tech/architecture.md` 性能预算 | CI 里的实际断言阈值 |
| `docs/02-tech/contracts/*.md` 字段名 | `packages/protocol/**` 的 schema |
| `docs/01-game/art-bible.md` 规格 | `tools/art-lint` 的检查阈值 |

### B. 文档 vs 文档
重点交叉：`gdd-core.md` ↔ `feel-spec.md` ↔ `gdd-economy.md` ↔ `architecture.md`

### C. 术语一致性
对照 `@studio/docs/00-charter/glossary.md`。已知易混：

| 正确 | 常见误用 |
|---|---|
| *（由项目填充）* | |

> 这张表由各项目按自己的术语表填。填的方法：
> **每次在评审里发现有人用了同义词，就往这里加一行。**
> 不要一开始就凭想象列满——凭想象列的词多半不会被误用，
> 真正会被误用的那些，你要等它第一次发生才知道。

---

## 当前漂移

| # | 类型 | 位置 A | 位置 B | 矛盾内容 | 责任方 | 发现日期 | 状态 |
|---|---|---|---|---|---|---|---|
| *（暂无）* | | | | | | | |

**状态**：`OPEN` / `RESOLVED` / `ESCALATED`（超 48h）

---

## 已消除（近 30 天）

| # | 矛盾内容 | 怎么解决的 | 消除日期 |
|---|---|---|---|
| *（暂无）* | | | |
