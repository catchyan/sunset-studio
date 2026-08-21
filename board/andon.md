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

## A-2026-08-21-1 · The framework cannot be worked with as released

- Pulled by: Q1 at 2026-08-21T07:40:00Z
- Type: false-assumption
- Affected: everything. No task may be dispatched against v2.0.1 in any project.
- Evidence: three independent audits of v2.0.1, plus one confirmed in production —
  `catchyan/sunset-club` had `required_status_checks.contexts = ["gates"]`, a workflow name
  where GitHub expects a job name, so its pull request showed seven green gates and could
  not merge. Live API response captured in `evidence/T-002/protection.txt`.
- Also confirmed: `${{ github.head_ref }}` interpolated into `run:` in both workflows, so a
  legal branch name switches the lane and envelope gates off; the ownership table read from
  the pull request head; renames invisible to the lane gate; peer review enforced by nothing;
  the andon cord itself structurally unmergeable.
- Assumption now known to be false: that v2.0.1 was ready for the first task. It was not.
  It was ready to look ready.
- Repair: T-002, merged under `break-glass` because a framework this broken cannot be
  repaired through the gates it broke.
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
