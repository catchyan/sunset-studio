# Andon

Append-only. Add your own entry; never edit anyone else's.

Four triggers, and only these four:

1. The default branch is red.
2. Two specifications contradict each other and code is being written against one of them.
3. A `FROZEN` contract was violated.
4. Work in flight rests on an assumption now known to be false.

Anything else is a blocker report. Keeping the list short is what keeps the cord meaningful.

**Pulling unnecessarily is never penalised. Failing to pull is.** A false alarm costs an
hour. An unpulled cord costs everything built on the broken assumption between now and
whenever somebody eventually notices, which is always later than this.

---

## A-<date>-<n> · <one line>

- Pulled by: <code> at <ISO timestamp>
- Type: red-main | contradiction | frozen-contract | false-assumption
- Affected: which tasks, which files, who should stop now
- Evidence: link to the failed run, or both contradicting quotes with their paths
- Status: OPEN

<!--
On close, replace the status line with all three of these:

- Status: CLOSED at <ISO timestamp>
- What was actually wrong:
- What was done:
- Which gate should have caught it: <gate id, or "none exists">

The last line is mandatory. "None exists" is the only legitimate source of new gates —
the constitution requires a real incident before the process is allowed to grow.
-->
