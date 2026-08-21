# AGENTS.md · read this before touching anything

This is **sunset-studio**: the framework, not a game. Nothing here belongs to any single
project, and a change here reaches every project at once.

If you are looking for a game, you are in the wrong repository.

---

## The three iron laws

**One. Process and content stay separate.** No game's proper nouns in this repository. A
gate checks it. The test: hand the paragraph to a team building a card game — can they use
it?

**Two. Process changes come from real incidents.** Every change to a gate or an SOP names
the failure that caused it, with a date and a link, marked `★`. A gate checks it. A
framework that grows from imagination grows without bound, and every rule is a tax paid on
every task forever.

**Three. Deleting beats adding.** When a retrospective produces a change, prefer removing a
rule. The natural drift of any process is toward more, and only a standing preference for
less corrects it.

---

## Before you start, answer three questions

In the first paragraph of your reply. Cannot answer one? Do not start — ask P0.

1. Which files did I read? (exact paths)
2. Which globs may I change? (from `OWNERSHIP.md`)
3. What is my acceptance command, and what does passing it prove?

---

## Red lines

1. **Do not edit outside your lane.** `OWNERSHIP.md`. Out-of-lane pull requests are rejected
   without the content being read.
2. **Do not push to the default branch.** Everything goes through a pull request.
3. **Do not change** `docs/00-charter/constitution.md` or `docs/00-charter/studio-charter.md`.
   Those need an ADR and the human.
4. **Do not approve your own work.**
5. **Do not fabricate evidence.** A sample of finished work is re-run in a clean environment.
   This is the one offence with no second chance.
6. **Stop at three failed attempts.** Write a blocker report. There is no fourth.
7. **Pull the andon cord** for: a red default branch, two contradicting specifications, a
   violated frozen contract, or work resting on an assumption now known to be false.
   Pulling unnecessarily is never penalised; failing to pull is.

---

## Acceptance

Four commands. All four exit zero, or nothing merges.

```bash
node tools/gates/gates.test.mjs                       # the gate engine's own tests
node tools/gates/selfcheck.mjs                        # links, references, wording, iron law one
node tools/gates/spec-check.mjs                       # the gate list matches the workflow
node tools/gates/lane-check.mjs lane/<CODE>/T-XXX     # your own diff, before you push
```

## Commits

```
<type>(<scope>): <subject> [T-XXX]
```

`feat` `fix` `docs` `refactor` `test` `chore` `perf` `content` `art`. Every commit carries
the task id, and CI rejects those that do not.

---

## Where things are

| Question | File |
|---|---|
| What is this studio for? | `docs/00-charter/studio-charter.md` |
| What are the non-negotiable rules? | `docs/00-charter/constitution.md` |
| What does this word mean? | `docs/00-charter/glossary.md` |
| How does a day actually run? | `docs/01-framework/framework.md` |
| What is scheduled, and who owns it? | `docs/01-framework/cadence.md`, `docs/04-grokbot/routines.md` |
| What is my job? | `docs/02-roles/<CODE>.md` — this file is also your description |
| What counts as passing? | `docs/03-gates/gates.md` |
| Who owns which paths? | `OWNERSHIP.md`, format in `docs/03-gates/ownership-schema.md` |
| How do I do X? | `docs/04-grokbot/skills/` — six SOPs, that is all of them |
| How do I set up a team? | `docs/04-grokbot/setup.md` |
| How do I start a new game? | `playbooks/new-project.md` |
| What may be added to the framework? | `docs/05-studio/versioning.md` |
| What do we actually know how to do? | `docs/05-studio/capability-ledger.md` |

## Escalation

```
architecture / interfaces        -> A1
quality / gates / acceptance     -> Q1
environment / tooling / CI       -> O1
conflicting documents / terms    -> S1
priority, or genuinely unclear   -> P0  -> the human
```

**Four hours to answer.** "I cannot decide, escalating up" is a complete answer. Silence is
not.
