# /sop-review · Review someone else's work

**Trigger:** you are named as reviewer on a task card and CI is green. Also used by the
gatekeeper for daily sampling.

You are the last gate that can read intent. The machines already checked syntax, size,
lanes, and evidence. Do not repeat their work; do the part they cannot.

---

## 1. Read the card before the diff

What was asked, and what does section 5 say counts as done? A diff read without the card
gets reviewed for whether it is reasonable code, which is a different and much weaker
question than whether it is the requested change.

## 2. Four questions

1. **Does it do what the card asked?** Not something adjacent, not more.
2. **Does the evidence prove it?** Does `command.txt` match section 6? Does the output
   actually show the thing passing, or merely end in a zero?
3. **What breaks?** Name a caller, a contract, or a saved file that this affects. If you
   cannot name one, you have not looked far enough yet.
4. **Would a stranger understand why?** Six weeks from now, with nobody to ask.

## 3. Say what you want changed, specifically

"This could be cleaner" is not actionable and will be answered with a random change.
"Extract lines 40 to 60 into a function, this branch is repeated in three places" is.

Distinguish blocking from advisory. Mark advisory comments as such, and let them go on the
second pass — a review that blocks on preferences trains people to stop reading reviews.

## 4. Approve, or do not

Approving means: **you are accountable for this too.** If a defect escapes here, the escape
report names the gate that missed it and the reviewer who passed it. That is not a
punishment; it is the only thing that makes an approval worth anything.

Never approve to unblock a schedule. If it must ship unfinished, that is a governor's
decision recorded in `board/decisions/`, not a quiet approval.

## 5. Merge and close

Merge it. The board updates itself from the pull request; there is no status file to edit.

---

## Sampling (gatekeeper only, daily at 10:00)

Pick 20% of the tasks finished yesterday, **and 100% of pull requests that carried the
`lane-override` label**. In a clean checkout:

```bash
git clone <repo> /tmp/verify && cd /tmp/verify
git checkout <merge-commit>
<the acceptance command from section 6 of the card>
```

Compare against the evidence pack. Record the result in `board/trust-ledger.md`.

Three outcomes: identical (fine), different but honestly reported (a flaky test, worth
fixing), or the evidence never matched anything (fabrication).

Fabricated evidence goes to the human the same day. Everything else here is a process
problem to be fixed; this one is the exception, because a team that cannot trust its own
reports has no mechanism left to work with.

---

**Definition of done:** approved and merged, or changes requested with specific items.

**Escalation:** unsure whether it meets the spec, ask the specification's owner. A dispute
you cannot settle goes to the gatekeeper, whose ruling on "is this done" is final short of
the human.
