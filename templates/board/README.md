# The board

Only two things here are written by hand: what the work *is*, and what order it goes in.
Everything else is derived.

```bash
node tools/board/status.mjs   # where every task stands, from git and CI
node tools/board/stall.mjs    # lanes that have stopped, and nothing else
```

The previous design kept task status in three files and asked a role to keep them
synchronised. Nobody can do that reliably, so all three were always slightly wrong, and
every report built on them inherited the error. Now each fact has exactly one home.

---

| Path | Owner | What it is |
|---|---|---|
| `backlog.md` | P0 | The queue, ordered. The only hand-maintained schedule. |
| `tasks/T-XXX.md` | P0 | Envelopes. Written before work starts, rarely changed after. |
| `blockers/T-XXX.md` | TASK-AUTHOR | Written at the third failed attempt, instead of a fourth. |
| `decisions/D-XXX.md` | P0 | Rulings that are not yet ADRs. Every ruling gets one. |
| `andon.md` | ANYONE | Append-only. The cord. |
| `drift.md` | S1 | Documents that have started disagreeing. |
| `trust-ledger.md` | Q1 | Sampling results per agent. |
| `redteam/` | Q1 | Sampling detail. |
| `escapes/` | Q1 | Defects that reached the default branch, each naming the gate that missed it. |
| `retros/` | P0 | Weekly. Required output is a process change. |
| `milestones/` | P0 | Release checklists, including the human's play session. |

---

## Rules

**Append-shared means append.** In an `ANYONE` file, add your own entry. Editing someone
else's line is out of lane even there.

**No status fields.** If you find yourself wanting to write "in progress" somewhere, the
answer is already in git. Adding it here creates a second answer that will disagree.

**Silent on a good day.** Drift and stall reports write nothing when they find nothing. A
report that says "all fine" every day stops being read within a week — including on the day
it says something else.
