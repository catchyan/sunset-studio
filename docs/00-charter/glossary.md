# Glossary · process terms

Process vocabulary only. Game vocabulary belongs in each project's own glossary, and mixing
the two is how a framework stops being reusable.

One definition per term. If you find a second definition somewhere, that is drift — report
it, do not pick a winner.

---

## Organisation

**Studio** — the team, its process, and its tooling. Outlives any single game.

**Project** — one game. Consumes a pinned version of the framework.

**Role** — a named position with a lane, a set of outputs, and an escalation target. Defined
by exactly one file, which is also the bot's description.

**Standing committee** — P0, A1, Q1, and one rotating seat. Where cross-cutting decisions
are made, because a six-participant limit makes an all-hands room impossible anyway.

**Cell** — three to five agents formed around one deliverable and dissolved when it ships.

## Working

**Lane** — the set of paths a role owns. Enforced by a gate that rejects out-of-lane changes
without reading them.

**Ownership table** — the mapping from path globs to owners. Format defined once at the
studio layer; contents belong to each repository.

**Task card** — the eight-section envelope written before work starts. Goal, inputs, lane,
contracts, definition of done, acceptance command, evidence, escalation.

**Acceptance command** — the single command that exits zero when the task is done. Chosen at
dispatch, never afterwards.

**Evidence pack** — command, full output ending in `EXIT_CODE=0`, diff summary, environment.
The proof that the acceptance command actually ran.

**Gate** — a program returning zero or non-zero. Advice in a document is not a gate.

**Andon** — the cord any agent may pull to stop the line. Four triggers, listed in the
constitution. Pulling unnecessarily is never penalised.

**Blocker report** — what you write at the third failed attempt, instead of a fourth.

**Escape** — a defect that reached the default branch. Its report names the gate that should
have caught it.

**Drift** — two documents that have started disagreeing. Found daily, resolved by the owner
of the specification, never by the person who found it.

**Derived state** — anything read from git and CI rather than written down. Where a task
stands is derived; what a task is, is not.

## Studio layer

**Mirror** — `docs/_studio/`, a byte-for-byte read-only copy of one framework version inside
a project.

**Pin** — `.studio-version`, the tag a project has mounted. Projects upgrade deliberately;
the framework is never pushed onto them.

**Elevation** — moving something from a project up into the framework, so every future
project inherits it.

**Rule of two** — nothing is elevated until a *second real project* needs it. One project's
solution is a solution; two projects' shared solution is a pattern. Anticipated reuse is
neither.

**Capability ledger** — what the studio actually knows how to do, at four levels: unknown,
done once, mastered, productised.

---

## Words to avoid in specifications

Not banned in conversation — banned in anything that acts as a specification, because each
of these describes a target without letting anyone determine whether it was hit.

| Instead of | Write |
|---|---|
| responsive, feels good | input to first visible frame, in milliseconds, at a stated rate |
| performant, fast | a number, on named hardware, in the worst case |
| as needed, as appropriate | the condition, explicitly |
| intuitive, user-friendly | the task, the success rate, the time |
| polish pass | the specific list of defects |
| roughly, about | the number and its tolerance |

A specification that cannot fail also cannot pass, which means the work against it cannot
be finished — only abandoned.
