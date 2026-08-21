# Studio charter

> Status: FROZEN. Owner: the human. No bot may change this file.

## There are two products

**A. The games.** What players buy.

**B. A team that can build games repeatedly, quickly, and well.** What outlives them.

B is the main product. A is its output.

This is not a slogan; it changes decisions. A shortcut that ships one game a week earlier
and leaves nothing reusable behind is a bad trade here. So is a framework so elaborate that
the first game never ships — B without A is a folder of process documents.

## Mission

Make game development faster, steadier, and better with each project.

Concretely: **the second game's time to first playable slice must be under half the first
game's.** If it is not, the framework was overhead pretending to be leverage, and the
retrospective's job is to find out which parts.

## Two layers

| Layer | Contains | Test |
|---|---|---|
| Studio | How we work, what counts as done, the tools that enforce it | Still true for a different game? |
| Project | What this game is, and how far along it is | Meaningless for a different game |

One question decides where anything belongs: **would a team building a completely different
game still need this?** Yes, studio. No, project.

The question has a sharper form for reviews: hand the paragraph to a team building a card
game. Can they use it? A gate checks this mechanically for proper nouns, but the judgement
is the point and the gate only catches the obvious cases.

## Three iron laws

**One. Process and content stay separate.**

The moment a game's specifics leak into the framework, the framework stops being reusable
and the next project starts by deleting things. Enforced by a gate.

**Two. Process changes come from real incidents.**

Every framework change names the failure that caused it, with a date and a link. A framework
that grows from imagination grows without bound, and every rule is a tax paid on every task
forever. Enforced by a gate.

**Three. Deleting beats adding.**

When a retrospective produces a change, prefer removing a rule to adding one. The default
drift of any process is toward more, and nothing corrects it except a standing preference
for less.

## How projects consume the framework

A project pins a version in `.studio-version` and holds a byte-for-byte read-only mirror at
`docs/_studio/`. CI verifies the mirror against the pinned tag on every pull request.

Projects upgrade when they choose to. The framework is never pushed onto a project
mid-milestone, because absorbing two unrelated failures at once makes both harder to
diagnose.

Why a mirror rather than a submodule: agents lose submodules in every available way, and a
mirror is just files.

## What the human does not delegate

- Whether the game is good.
- Whether to ship.
- Changes to this document and to the constitution.
- Which project exists at all.

Everything else is delegated, and delegated means actually delegated. A framework whose
every decision routes back to one person is a framework that has a single-threaded
bottleneck with extra steps.
