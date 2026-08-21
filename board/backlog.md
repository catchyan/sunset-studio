# Backlog · studio

The queue. Owned by P0. Ordered — the top item is the next one taken.

Where each task stands is derived (`node tools/board/status.mjs`); what each task is lives in
its card. This file answers only "what next, and in which order".

The studio has a board for the same reason it has lanes: **we have no standing to ask
projects to follow a rule we exempt ourselves from.** A framework repository edited without
envelopes has already told everyone what its own rules are worth.

---

| # | Task | Title | Owner | Milestone |
|---|---|---|---|---|
| 1 | T-002 | Framework v3: close the audit findings before any task is dispatched | Q1 | S0 |
| 2 | T-001 | The mount produced a mirror the mirror gate rejects | A1 | S0 |
| 3 | T-000 | Framework v2: English, derived state, cut unenforced rules | A1 | S0 |

---

## Not scheduled

- Measure onboarding time once the first agents exist (metric M6, currently unknown).
- Test the lock tool under real contention; the design has never met two agents at once.
- Give each role its own GitHub account. Until then `APPROVED-BY` records who claims to have
  reviewed, not who did, and the lane and override labels prove nothing about who applied
  them. Everything above this line is unaffected; the mechanism does not change, only what
  it proves.
- Run the nineteen negative tests in `setup.md` step 9 against a scratch repository, and
  keep the outputs. They have never all been run in one place.
