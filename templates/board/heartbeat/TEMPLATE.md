# <代号> · <角色名> 心跳

- updated: 2026-08-20T14:00+08:00
- status: WORKING | IDLE | BLOCKED | REVIEWING | OFF
- task: T-XXX · <标题>
- progress: 3/5 步
- progress_detail: <已完成什么，剩余什么。写事实，不写"进展顺利">
- last_commit: <hash>
- lane_clean: true
- blocked: 无
- blocked_since: —
- next: <下一步具体要做什么>
- eta: <预计完成时间>
- locks_held: —
- needs_from_others: —

---

> 使用说明见 `/sop-heartbeat`。字段不许增删。
>
> **哪怕没有进展也必须写。** 写"仍在处理 T-042 第 3 步，无进展，原因是 X"。
> 装作在思考是本项目最昂贵的行为。
>
> `blocked` 非空 → 立刻 @总督。`needs_from_others` 非空 → 立刻 @对方。
> 写在心跳里但不 @ 人，等于没写。
>
> **IDLE 不可耻，自作主张才可耻。** 没任务时不要自己找活干，写 IDLE 并 @总督。
