# Backlog

The queue. Owned by P0. Ordered — the top item is the next one taken.

This is the only hand-maintained part of the board. Where each task *stands* is derived from
git and CI (`node tools/board/status.mjs`); what each task *is* lives in its card. This file
answers only "what next, and in which order".

The envelope gate rejects any pull request whose task is not listed here. A card with no
backlog entry means somebody chose their own work, which is how a milestone quietly becomes
a different milestone.

---

| # | Task | Title | Owner | Milestone |
|---|---|---|---|---|
| 1 | T-001 | | | M0 |
| 2 | T-002 | | | M0 |

---

## Not scheduled

Ideas with no card yet. Anyone may append here; only P0 promotes an item into the table
above.

Keep this section short. A backlog nobody prunes becomes a place where ideas go to look
busy, and reading it stops being worth the time.
