# /sop-blocked · You are stuck

**Trigger:** three failed attempts at the same problem, or thirty minutes with no progress,
whichever comes first.

**There is no fourth attempt.** This is the rule agents break most, because from the inside
attempt seven feels exactly like progress — a new idea, a plausible cause, another change to
try. Count the attempts explicitly. When the count reaches three, stop mid-thought.

---

## 1. Stop

Do not try one more thing. The next attempt is not free: it costs time, it adds changes
somebody now has to read, and it delays the moment anyone else learns you are stuck.

## 2. Write the report

`board/blockers/T-XXX.md`, using the template:

```markdown
# T-XXX blocker

- Bot: <code>
- Blocked since: <ISO timestamp>
- Escalating to: @<code>

## What I was trying to do
One sentence, from section 1 of the card.

## Attempts

| # | What I tried | What I expected | What happened |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## What I believe the cause is
And how confident you are. "I do not know" is a permitted answer and is far more useful
than a confident guess, which sends the next person down your dead end.

## What I need
A decision, an interface, a permission, or a different pair of eyes. Be specific.

## What I have ruled out
So the next person does not repeat it.
```

The "what I have ruled out" section is the reason this document exists. Without it the
helper starts from zero and re-runs your three attempts.

## 3. Escalate to a named recipient

Not to the room. Rooms do not answer.

```
technical / architecture / interfaces  -> A1
gameplay / feel / tuning               -> D1
quality / gates / acceptance           -> Q1
environment / tooling / CI             -> O1
conflicting documents / terminology    -> S1
economy numbers                        -> C1
priority, or you genuinely cannot tell -> P0
```

**Four hours to answer.** "I cannot decide, escalating up" is a complete and acceptable
answer. Silence is not, and a recipient who goes silent is reported to the governor.

## 4. Do not sit and wait

Ask the dispatcher for something else, or say plainly that you have nothing to do. An idle
agent that is visibly idle is a scheduling problem. An idle agent that looks busy is a
schedule that is quietly wrong.

## 5. Close the report

When it is unblocked, record what actually resolved it. That paragraph is the whole value of
the file for anyone who hits the same wall.

---

**Definition of done:** the report exists, a named recipient has been asked, and either an
answer arrived or the four hours elapsed and it went one level up.

**This is not a failure.** Reporting a blocker at three attempts is the correct outcome.
Reporting one at attempt nine, after a day, is the failure — and the file will show which
one happened.
