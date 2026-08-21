# RELAY · how the work actually flows

The constitution says what the rules are. This says how a day runs.

RELAY is five mechanisms: **R**ecord, **E**nvelope, **L**ane, **A**ssert, **Y**ield.
They exist to survive one specific situation — a team of agents that forget things
between sessions, cannot tell when they are stuck, and will confidently report success
they have not achieved.

---

## What we are designing around

Seven failure modes, all observed rather than imagined:

| Failure | What it looks like | Which mechanism answers it |
|---|---|---|
| Amnesia | Yesterday's decision is gone today | Record — it is in git or it did not happen |
| Drift | Slowly solving a different problem | Envelope — the goal is written before the work |
| Collision | Two agents overwrite one file | Lane — one owner per path |
| Self-certification | "Done" with nothing behind it | Assert — evidence, and a different reviewer |
| Looping | Attempt four through nine of the same fix | Yield — three strikes, then stop |
| Silence | Stopped, nobody notices for a day | Derived state — commit times, not self-reports |
| Plausible nonsense | Fluent output, wrong content | Gates — machines judge, not adjectives |

The framework's whole job is to make these seven expensive to do and easy to detect.

---

## R · Record

One place per fact.

- What a task **is**: its card, `board/tasks/T-XXX.md`, written before dispatch.
- Where a task **stands**: git and CI. Nobody writes this down; `tools/board/status.mjs`
  reads it.
- Why a decision was made: an ADR, or `board/decisions/` for a governor's ruling.

There is no status field anywhere. The previous design had task state in three files and
made a role responsible for keeping them synchronised; the result was three answers to
every question, all slightly stale, and every report built on top inherited the error.
Ask git instead. Git cannot forget and does not round up.

## E · Envelope

Nothing is worked on until it has a card with eight sections: goal, inputs, lane,
contracts, definition of done, acceptance command, evidence, escalation. The template is
`templates/board/tasks/TEMPLATE.md` and the gate checks all eight are present.

Sections 5 and 6 are the load-bearing ones. Without a definition of done the assignee
cannot know when to stop, and without an acceptance command nobody else can check them.

The card is written by the dispatcher, not the assignee. Writing your own envelope is
how scope quietly becomes whatever was easy.

## L · Lane

One owner per path, listed in the ownership table, enforced by a gate that rejects
out-of-lane diffs without reading their content.

Crossing lanes is possible but deliberately awkward: the dispatcher lists the path in
section 3 of the card, and somebody with write access adds the `lane-override` label.
Both, or it does not merge. Every labelled PR gets reviewed — not sampled.

## A · Assert

Every claim carries evidence, and every gate is a program.

Gates run in CI and are listed in `docs/03-gates/gates.md`. That list is itself checked
against the workflow file, because the failure that produced this rule was a gate
documented as blocking whose command ended in `|| echo` — green for weeks, checking
nothing.

## Y · Yield

Three failed attempts, then stop and escalate. Every escalation has a named recipient
and a four-hour deadline. A recipient who cannot decide says "I cannot decide, escalating
up" — which is a legitimate answer. Silence is not.

```
technical / architecture / interfaces  -> A1
gameplay / feel / tuning               -> D1
quality / gates / acceptance           -> Q1
environment / tooling / CI             -> O1
conflicting documents / terminology    -> S1
economy numbers                        -> C1
priority, or genuinely unclear         -> P0  -> the human
```

---

## Organisation

Group chats hold six participants, so the team is not one room.

- **Standing committee** — P0, A1, Q1, plus one rotating seat. Cross-cutting decisions.
- **Cells** — three to five agents formed around one deliverable, dissolved when it ships.
- **Human channel** — P0 to the human, once a day, at most three decisions requested.

Roles are one file each, in `docs/02-roles/`. That file *is* the agent's description:
there is no second copy to drift out of step with the first.

---

## The loop

**Per task.** Dispatch (P0 writes the card) → claim (agent answers the three self-check
questions) → run the acceptance command and watch it fail → implement in small commits →
produce the evidence pack → open a PR → gates → a different agent reviews → merge.

**Per day.** P0 dispatches in the morning and reports to the human at night, with the
board generated rather than typed. Q1 re-runs a sample of yesterday's finished work in a
clean environment. S1 checks whether any two documents have started contradicting each
other. A stall check runs every three hours and says nothing unless a lane has stopped.

**Per week.** Monday planning, Friday demo and retrospective. The retrospective's only
required output is a change to the process — or an explicit "nothing needs changing",
which is allowed twice in a row and not three times.

**Per milestone.** Every gate green, plus the human plays it. A milestone that no human
has played is not finished, no matter what the metrics say.

---

## Why this works on weak agents

- **Nothing depends on memory.** Every session starts by reading files.
- **Nothing depends on judgement where a machine can judge instead.** Adjectives do not
  pass gates; exit codes do.
- **Nothing depends on an agent noticing its own failure.** Stalls and loops are detected
  from outside, because from inside they look like progress.
- **Every rule has an owner, a trigger, and a deadline.** "Someone should" is not a plan.
- **The process changes only when something actually breaks.** Otherwise it grows until
  following it costs more than the work.
