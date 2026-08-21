# Routines

A routine is a scheduled prompt attached to one bot. Every recurring obligation in this
framework is one of these — if it is not here, it is not scheduled, and "someone will
remember" is not a schedule.

Ten routines. There used to be more, including a self-reported heartbeat from every agent
every two hours. That produced sixty writes a day whose entire content was "still here",
and it could not cover the one case that mattered: an agent that has stopped and therefore
cannot report stopping. Commit timestamps report the same fact for free and cannot be
faked by an absent agent.

---

| ID | Owner | When | What it runs |
|---|---|---|---|
| R1 | O1 | 07:00 daily | Environment check |
| R2 | P0 | 08:30 daily | Dispatch |
| R3 | P0 | every 3h, 09–21 | Stall check |
| R4 | Q1 | 10:00 daily | Sampling |
| R5 | S1 | 14:00 daily | Drift check |
| R6 | P0 | 21:00 daily | Report to the human |
| R7 | Q1 | on CI failure | Respond within 30 minutes |
| R8 | P0 | Monday 09:00 | Sprint planning |
| R9 | P0 | Friday 16:00 and 17:00 | Demo, then retrospective |
| R10 | C1 | 03:00 daily, from M4 | Economy simulation |

---

## Prompts

**R1 · Environment check**
> Check CI health, disk space, and stale locks (`node tools/lock.mjs list`). Report only
> problems. A lock older than four hours: report it, do not break it.

**R2 · Dispatch**
> For each task starting today, write `board/tasks/T-XXX.md` with all eight sections, a
> named reviewer who is not the assignee, and an acceptance command that exits zero when the
> task is done. Add it to `board/backlog.md`. Assign it in the room.

**R3 · Stall check**
> Run `node tools/board/stall.mjs`. Say nothing if it reports nothing. For each alerting
> lane, ask the agent directly; no answer within thirty minutes means write the blocker
> report on their behalf and reassign.

**R4 · Sampling**
> Follow `/sop-review`, sampling section. 20% of yesterday's finished tasks, plus every pull
> request that carried the `lane-override` label. Record in `board/trust-ledger.md`.

**R5 · Drift check**
> Compare numbers, terms, and reality across the specification documents. Report findings to
> `board/drift.md` and name both sides. Write nothing on a clean day. Do not decide which
> side is right — that belongs to the specification's owner.

**R6 · Report to the human**
> Run `node tools/board/status.mjs`. Add what the table cannot show: what is at risk, and at
> most three decisions needed. If there are more than three, decide the rest yourself and
> record the reasoning in `board/decisions/`.

**R7 · CI failure response**
> Within 30 minutes: fix, revert, or pull the andon cord. Nothing merges while the default
> branch is red. If it stays red for an hour, it is an andon pull regardless of cause.

**R8 · Sprint planning**
> One question: what is the smallest thing that would be playable by Friday? Output cards on
> the backlog, each with a reviewer. Twenty-five messages maximum.

**R9 · Demo, then retrospective**
> Demo: something runs — a recording, a screenshot, a log. Not slides.
> Retrospective: what broke, which gate should have caught it, what got slower, what should
> be deleted. The required output is a process change, preferably a deletion. "Nothing needs
> changing" is acceptable twice in a row; the third time, raise it with the human.

**R10 · Economy simulation**
> Run the simulation over the current data. Compare against the prediction recorded when the
> last change merged. Report the difference, not the absolute numbers.

---

## Rules for routines

**Two of these produce nothing on a good day, on purpose.** R1 and R5 are silent unless
they find something. A recurring report that says "all fine" every day stops being read
within a week — and then it is also not read on the day it says something else.

**One owner each.** A routine two bots run is a routine that gets done twice or not at all.

**Adding one requires an incident.** Same rule as any other framework change: name the
failure it would have caught, with a date. Routines are the cheapest thing to add and among
the most expensive to carry, because every one of them consumes attention forever.

**Deleting one requires only that it has been useless for a month.** Deletions are cheap;
say so at the retrospective and remove it.
