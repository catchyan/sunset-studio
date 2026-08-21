# Metrics

Six numbers about the team, two about the studio. They exist to find where the process
leaks, not to rank anyone.

Read this first: **every metric here measures the process, never a person.** A low
first-pass yield means the gates are unclear or the dispatch is bad. It does not mean an
agent is careless. The moment a number is used to blame someone, it starts being managed
rather than measured, and it stops telling anyone anything.

---

## Team

**M1 · First-pass yield** — share of pull requests that pass every gate on the first try.

Rising means the envelope is clear enough that people know what is expected. Falling is
usually a dispatch problem, not a discipline problem. Target: above 70% by the second
milestone.

**M2 · Escape rate** — share of defects found after merge rather than by a gate.

Every escape names the gate that should have caught it. That name, accumulated, is the
list of gates worth building — and it is the only legitimate source of new gates.

**M3 · Cycle time** — dispatch to merge, median and 90th percentile.

Watch the 90th percentile, not the median. The median is the work that was easy anyway;
the tail is where the process is actually failing, and it is the tail that people feel.

**M4 · Human touches** — interventions by the human per week.

The one number that should fall over time and cannot be gamed, because the human counts
it. Rising means the framework is failing at its job. Approaching zero probably means the
human has stopped paying attention, which is a different failure.

**M5 · Rework rate** — share of pull requests needing more than one round of changes.

High rework with high first-pass yield means the gates pass work that reviewers reject:
the automated checks and the human standard are measuring different things.

**M6 · Onboarding time** — from creating a bot to its first merged pull request.

The most direct measurement of how understandable the framework is. If a new agent needs
a day, the documents are too long or too scattered. Target: under two hours.

---

## Studio

**X1 · Time to first playable** — from a project's first commit to something a person can
play for five minutes.

The studio's whole justification. The second project's number must be under half the
first's, or the framework is overhead rather than leverage.

**X2 · Reuse ratio** — share of a new project's tooling and process that came from the
studio unchanged.

Low means either the framework is too specific to the first game, or projects are copying
instead of consuming. Both are worth knowing; they have opposite fixes.

---

## Reading these honestly

**Goodhart's law is not a footnote here.** Any of these can be improved by making the work
worse: cycle time by lowering standards, first-pass yield by weakening gates, human touches
by hiding problems.

Two protections. First, they are reviewed together — a number that improves while another
degrades is a trade, not a win, and the retrospective names the trade. Second, they steer
retrospectives and nothing else. No target here is ever a deadline, and no agent is ever
evaluated on one.

**Do not add metrics.** Six and two is already more than a small team can act on. A metric
nobody has changed a decision with in a month should be deleted.
