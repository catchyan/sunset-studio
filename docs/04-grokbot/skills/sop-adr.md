# /sop-adr · Record a decision

**Trigger:** a decision that is expensive to reverse. Choosing an engine, a network model, a
data format, a dependency the whole codebase will import. Also: any change to a `FROZEN`
contract, and any ruling a governor makes that another role disagreed with.

Rule of thumb: if undoing it in three months would cost more than a day, write it down now.

---

## 1. One file, numbered

`docs/02-tech/adr/NNNN-short-name.md`, next number in sequence. Add it to the index.

## 2. Six sections. All of them.

```markdown
# NNNN · <decision in one line>

- Status: PROPOSED | ACCEPTED | SUPERSEDED by NNNN
- Date: <ISO date>
- Deciders: <codes>

## Context
What forced a choice. What was true at the time — constraints, deadlines, what we did not
yet know. This section is what makes the decision legible later; without it the decision
looks arbitrary and someone reverses it for reasons you already considered.

## Options
At least two, each with its real cost. A single-option ADR is a rationalisation.

## Decision
What we chose.

## Consequences
What this makes easy. What this makes hard. What it forecloses.

## Rollback condition
The observable signal that would mean this was wrong, and what we would do then.
```

## 3. The rollback condition is not optional

"If server tick cost exceeds 8 ms at 40 players, this model does not scale and we move to X."

A decision with no falsifying condition cannot be revisited on evidence, only on argument —
and arguments are won by whoever is most insistent, which is not a property correlated with
being right. Weak agents in particular will defend a recorded decision indefinitely unless
the document itself tells them when to stop.

## 4. Twenty-four hours to object

Post it as PROPOSED and name who should look. Any role may object with a reason and an
alternative; "I do not like it" is not an objection.

Silence after 24 hours is consent. This is deliberate — waiting for enthusiastic agreement
from every role means nothing is ever decided.

## 5. Accept it, then follow it

Change the status to ACCEPTED and merge. From then on, code that contradicts an accepted ADR
is rejected at review, and the correct response to disagreeing is a new ADR that supersedes
it — never a quiet exception in one file.

---

**Definition of done:** merged with status ACCEPTED, listed in the index, and the rollback
condition is something a person could actually observe.

**Escalation:** an unresolved objection after 24 hours goes to the architect, who decides
unilaterally. A decision the architect cannot make goes to the human.
