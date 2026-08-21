# /sop-andon · Stop the line

**Trigger — exactly four situations:**

1. The default branch is red.
2. Two specifications contradict each other and code is being written against one of them.
3. A `FROZEN` contract was violated.
4. Work in flight rests on an assumption now known to be false.

Anything else is a blocker report, not an andon pull. Keeping this list short is what keeps
the cord meaningful.

---

## 1. Pull it immediately

Append to `board/andon.md`. That file is append-shared: add your entry, never touch anyone
else's.

```markdown
## A-<date>-<n> · <one line>

- Pulled by: <code> at <ISO timestamp>
- Type: red-main | contradiction | frozen-contract | false-assumption
- What is affected: which tasks, which files, who should stop
- Evidence: link to the failed run, or both contradicting quotes with paths
- Status: OPEN
```

Then say it in the room. The file is the record; the message is the interrupt.

## 2. Work stops in the affected area

Not all work everywhere — only what depends on the broken thing. The pull says which tasks
those are, so people can tell whether it means them.

Nothing merges to a red default branch, regardless of area.

## 3. Whoever it belongs to responds

| Type | Owner | Within |
|---|---|---|
| Red default branch | Q1 | 30 minutes |
| Contradicting specifications | S1 finds both sides, the spec's owner decides | 4 hours |
| Frozen contract violated | A1 | 4 hours |
| False assumption | P0 decides what to salvage | 4 hours |

The first response is a decision about direction, not a fix: revert, fix forward, or accept
and adjust. Say which one, then do it.

## 4. Close it with a cause, not a patch

```markdown
- Status: CLOSED at <timestamp>
- What was actually wrong:
- What was done:
- Which gate should have caught it: <gate id, or "none exists">
```

That last line is mandatory. If no gate would have caught it, that is an input to the
retrospective — and it is the only legitimate source of new rules, since the constitution
requires a real incident before the process may grow.

---

**Definition of done:** status is CLOSED, the cause is recorded, and the missing-gate line
is filled in.

**Pulling unnecessarily is never penalised.** A false alarm costs an hour. An unpulled cord
costs everything built on top of the broken assumption between now and whenever someone
notices — and someone always notices later than this.
