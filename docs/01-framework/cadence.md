# Cadence

Three clocks. Everything that recurs is on exactly one of them, has one owner, and has a
deadline. Anything not on this page is not scheduled, and "someone will notice" is not a
schedule.

---

## Daily

| Time | Who | What | Output |
|---|---|---|---|
| 07:00 | O1 | Environment check: CI, disk, the shared machine, stale locks | Silent unless broken |
| 08:30 | P0 | Dispatch: write cards for today's tasks, assign reviewers | New cards on the backlog |
| every 3h | P0 | Stall check (`tools/board/stall.mjs`) | Silent unless a lane stopped |
| 10:00 | Q1 | Re-run a sample of yesterday's finished work in a clean environment | Sample report |
| 14:00 | S1 | Drift check: do any two documents now disagree? | `board/drift.md`, only on findings |
| 21:00 | P0 | Report to the human | Board (generated) + at most three decisions |
| on event | Q1 | Respond to a red build within 30 minutes | Fix, revert, or andon |

Two of these produce nothing on a good day, on purpose. A recurring report that says
"all fine" every day stops being read within a week, and then stops being read on the day
it says something else.

### The nightly report

Generated, then edited down. `node tools/board/status.mjs` produces the table; P0 adds
what a table cannot show — what is at risk, and what needs a human decision.

**At most three decisions per day.** More than three and the human becomes the queue that
everything waits in, which is the bottleneck this whole framework exists to avoid. If
there are five, P0 decides two of them and records the reasoning in `board/decisions/`.

---

## Weekly

**Monday 09:00 — planning.** P0, A1, Q1, plus the roles the week's work touches. One
question decides everything: *what is the smallest thing that would be playable by
Friday?* Output is cards on the backlog, each with a named reviewer.

Twenty-five messages maximum. A planning meeting that needs more than that is planning
work nobody has specified yet, and the fix is to specify it, not to keep talking.

**Friday 16:00 — demo.** Something runs. A recording, a screenshot, a log. Not slides.

**Friday 17:00 — retrospective.** Four questions: what broke, which gate should have
caught it, what got slower, what should be deleted.

The required output is a change to the process — most usefully a deletion. "Nothing needs
changing" is an acceptable answer twice in a row. The third time it means the
retrospective has become a ritual, and P0 raises that with the human.

---

## Per milestone

Every machine gate green, plus:

- The gatekeeper's convergence review: no open andon, no unresolved escapes, evidence
  packs complete for everything marked done.
- The archivist's consistency review: the documents describe the thing that now exists.
- **The human plays it.** At least twenty minutes, unassisted, on the target hardware.

The last one has no substitute. Metrics say whether it works. Only a person says whether
it is worth playing, and shipping a milestone nobody has played is how a team spends six
months building something technically excellent that nobody enjoys.

---

## Exceptions

- **Andon overrides the clock.** A pulled cord stops scheduled work until it is closed.
- **A red default branch outranks everything.** No new work merges until it is green.
- **The human can interrupt anything.** Every other interruption goes through P0, so that
  agents are not each other's interrupt sources.
