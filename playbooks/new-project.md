# Starting a new project

From an idea to a first playable slice. Follow it in order.

The measurement that matters: **how long from the first commit to something a person can
play for five minutes.** Every step here is judged by whether it shortens that.

---

## Phase 0 · Four questions, answered by the human

Written down before anything is created. Not delegated — these are the decisions that
determine everything an agent will later do without asking.

1. **What is it?** One sentence a stranger would understand.
2. **Who is it for?** Not "everyone". A specific person with a specific evening free.
3. **What does success look like?** A number and a date.
4. **What are we explicitly not doing?** The most valuable answer of the four, because it is
   the only one that will still be constraining scope in month four.

Into `docs/00-charter/vision.md`. Human-owned, and no bot may change it.

## Phase 1 · Repository and framework

Follow `docs/04-grokbot/setup.md` steps 1 through 3: create the repository public, mount the
framework, turn on branch protection with `enforce_admins`.

Do not skip the credential check before the first push. A public repository's history is
permanent, and the only fix afterwards is deleting and recreating the repository.

## Phase 2 · The project's own documents

Five files, and only these five, before any code:

| File | Contains |
|---|---|
| `docs/00-charter/vision.md` | The four answers |
| `docs/00-charter/glossary.md` | This game's vocabulary, one definition each |
| `docs/03-process/ownership.md` | Paths to owners, in the frozen format |
| `docs/03-process/staffing.md` | Which roles activate when, and the `{{...}}` values |
| `docs/04-plan/roadmap.md` | Milestones, each with a release condition |

Every milestone's release condition must be something a person can observe. "Combat feels
good" is not one. "Four players clear the first dungeon in under twelve minutes with no
desync" is.

## Phase 3 · Staff the minimum

Five roles at milestone zero: P0, A1, Q1, S1, O1. Everyone else joins when their lane has
work — a role with nothing to do still consumes attention and still has to be read around.

`staffing.md` records both the schedule and the placeholder values the role cards need.

## Phase 4 · Contracts before code

The architect writes the interfaces the first slice needs, and they are merged before anyone
builds against them. Two agents implementing toward an interface that does not exist yet
will produce two interfaces and discover it at integration.

## Phase 5 · One vertical slice

Not a system. A slice: one character, one room, one enemy, one loop that ends. Ugly is
acceptable; incomplete is not.

Horizontal work — a complete input system, a complete rendering layer — produces months with
nothing playable, and nobody can tell whether any of it is any good.

## Phase 6 · Review, then improve the framework

At the end of the first milestone:

1. Update the capability ledger honestly, including the negative list.
2. Measure X1 and X2 and write them down, whatever they say.
3. For each framework change made during the project, check that it names a real incident.
4. Fix this playbook where reality did not match it.

Step four is the one that compounds. Everything else improved this project; this improves
every project after it.

---

## Warnings from previous projects

- **Set up branch protection before the first bot exists.** Retrofitting discipline onto a
  team that has already merged without it does not work.
- **Watch every gate fail once before trusting it.** A gate that has never been red has
  never been tested, and roughly half of them are broken in some way on first writing.
- **Do not staff ahead of the work.** Idle roles generate discussion, and discussion looks
  like progress.
- **The vision document is the human's.** An agent that edits it has redefined the project
  and will do so without noticing.
