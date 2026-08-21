# Trust ledger

Sampling results, per agent. Owned by Q1.

This is not a scoreboard. It answers one question: **can we believe evidence packs without
re-running them?** If we can, the team moves at full speed. If we cannot, everything needs
verifying and the whole framework's throughput collapses.

---

| Agent | Sampled | Matched | Honest mismatch | Fabricated | Note |
|---|---|---|---|---|---|
| | | | | | |

**Matched** — the re-run produced the same result as the evidence pack.

**Honest mismatch** — different result, but the pack reflected what actually happened at the
time. Usually a flaky test or an environment difference. This is a bug to fix, not a
character finding, and it is worth fixing quickly: flakiness is what makes fabrication
plausible.

**Fabricated** — the pack never reflected any real run.

---

## Sampling rate

20% of finished tasks, plus **100% of pull requests that carried the `lane-override`
label** — that label is the one documented path around the lane gate, so it is not sampled,
it is always checked.

An agent with three consecutive clean samples drops to 10%. One mismatch returns it to 20%.
The rate is a cost, and lowering it for agents that have earned it is the point of keeping
this file.

## Fabrication

Reported to the human the same day, and the agent's work is suspended pending that
conversation.

Everything else in this framework is a process problem to be fixed with a better gate. This
one is not, and it cannot be, because a team whose reports cannot be trusted has no
mechanism left to work with — every check would have to be redone by whoever reads it, which
is the situation the framework exists to escape.
