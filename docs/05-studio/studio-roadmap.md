# Studio roadmap

The studio's own maturity, separate from any game's milestones. A game can ship while the
studio is still immature, and the studio can be mature while a game is failing — these are
different axes and conflating them hides both problems.

---

## S0 · The framework exists and works

**Goal:** a small team can run one task end to end without a person carrying it.

Release criteria:
- Every gate in `gates.md` is implemented, wired into CI, and has been **watched failing**.
- One task went from dispatch to merge with no human intervention.
- A new agent reached its first merged pull request in under two hours.
- Every negative test in `setup.md` produces the expected red.

The third one is the real test. A framework only its author can operate is a personal habit.

## S1 · One game shipped

**Goal:** the framework survived contact with a real project from beginning to release.

Release criteria:
- A game shipped, with players.
- The capability ledger has entries at "done once" or better across rendering, networking,
  content pipeline, and release.
- The retrospectives produced more deletions than additions.

That last criterion looks odd and is deliberate. A framework that only grew during its first
real use never learned anything — it just accumulated.

## S2 · The second game proves the point

**Goal:** demonstrate that the studio is leverage rather than overhead.

Release criteria:
- Time to first playable under half the first game's.
- Reuse ratio above 60%.
- No process rule needed to be invented from scratch; the changes were adjustments.
- The framework changes made during this project were driven by incidents, not by the new
  game's shape.

**This is the milestone the studio exists for.** Everything before it is a promise.

## S3 · Self-sustaining

**Goal:** the team runs on its own, and the human's attention goes to taste rather than
traffic control.

Release criteria:
- Human touches under five per week, sustained for a month, with quality holding.
- A new project can be started by following the playbook without asking questions.
- The framework has been stable for two months, changing only from incidents.

---

## The rule that outranks this page

**Do not sacrifice a game for the studio's progress.**

If a framework improvement would delay a game, the game wins. A studio with a perfect
process and nothing shipped has proven nothing, and there is no evidence a process is good
except games it helped finish.

The reverse is also bounded: a shortcut that saves a week and destroys reusability is only
worth taking once, and it must be recorded in the ledger's negative list so the next project
knows what it inherited.
