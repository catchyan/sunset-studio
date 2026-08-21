# Capability ledger

What this studio actually knows how to do — as opposed to what it has read about.

Four levels. Moving up a level requires evidence, not confidence.

| Level | Meaning | Requirement to reach it |
|---|---|---|
| Unknown | Never attempted | — |
| Done once | Worked in one project | Shipped, and the approach is written down |
| Mastered | Repeatable, predictable | Two projects, and estimates were roughly right |
| Productised | Available as `@studio/*` | Rule of two, plus versioning and an owner |

Being honest at level one is the entire value of this file. A ledger that flatters the team
gives the same answer as no ledger, and it does it with more confidence.

---

## Process capabilities

| Capability | Level | Evidence |
|---|---|---|
| Lane isolation for multiple agents | Done once | Gate implemented, watched failing |
| Task envelope and evidence packs | Done once | Gate implemented, watched failing |
| Framework mirroring and pinning | Done once | Two-layer verification, cross-platform bug found and fixed |
| Gate specification matching reality | Done once | Spec-check written after a gate was found decorative |
| Deriving state from git rather than files | Unknown | Designed, never run with real agents |
| Locking shared resources | Unknown | Tag-based design, untested under contention |
| Onboarding an agent in under two hours | Unknown | Never measured |

## Technical capabilities

| Capability | Level | Evidence |
|---|---|---|
| Browser-based 3D rendering pipeline | Unknown | |
| Deterministic simulation with replay tests | Unknown | |
| Authoritative multiplayer server | Unknown | |
| Data-driven content pipeline with schema validation | Unknown | |
| Procedural and generated art pipeline | Unknown | |
| Economy simulation before shipping changes | Unknown | |
| Desktop packaging and store release | Unknown | |

Everything technical is unknown. Nothing has been built yet, and writing anything else here
would be the first fabricated claim in a system whose central rule is that claims need
evidence.

---

## Negative list · tried, did not work

Kept because a studio that only records successes repeats its failures on schedule.

| What | Why it failed | Date |
|---|---|---|
| Self-reported heartbeats every two hours | Sixty writes a day of "still here", and structurally unable to catch the one case that matters: an agent too stuck to report being stuck | 2026-08 |
| Task state duplicated across three files | Nobody owned the synchronisation, so all three were stale and every report inherited the error | 2026-08 |
| Single-owner changelog | Every fix needed an override or a second pull request; tedious rules do not get followed, they get abandoned | 2026-08 |
| Free-text `LANE-OVERRIDE` in a pull request body | An agent could authorise itself by typing a line, and the approval link was never checked | 2026-08 |
| Locking by pushing a file to the protected default branch | Branch protection refuses it, so there was no legal way to take a lock at all | 2026-08 |

---

## Rules

**Only evidence moves a row up.** A link, a commit, a shipped thing. "We understand it now"
does not count.

**Rows may move down.** A capability nobody has exercised in two projects is not mastered
any more; it is remembered.

**Productised requires the rule of two.** See `versioning.md`. One project's solution is a
solution, not a pattern.
