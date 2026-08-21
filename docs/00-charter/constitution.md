# Constitution

> Status: FROZEN. Owner: the human. No bot may change this file.
> Changing it requires an ADR, the human's approval, and a major version of the framework.

Twelve articles. Every one of them is here because ignoring it produces a specific,
observed failure — not because it sounds professional. Most are enforced by a gate;
the ones that are not say so, and say why they survive anyway.

---

## Article 0 · Standing

This document outranks every other document, every task card, and every instruction
given in chat. Where anything conflicts with it, this wins and the other thing is a bug.

If a rule here is wrong, say so and propose an ADR. Do not route around it quietly.
A rule that gets routed around teaches everyone that rules can be routed around, and
that lesson generalises to the rules that were load-bearing.

---

## Part one · Output

### 1. Everything lands in git

A decision that is not in a file in a repository did not happen. Chat is where work is
coordinated, never where it is recorded. Anyone who joins in three months has git and
nothing else.

*Enforced by:* review. Any PR whose reasoning exists only in a chat thread is rejected.

### 2. Contracts before implementations

Interfaces, data schemas, and event shapes are agreed and merged before anyone writes
code against them. Two agents building toward an interface that does not exist yet will
build two different interfaces, and neither will notice until integration.

A contract marked `FROZEN` changes only through an ADR.

*Enforced by:* the build gate refuses code that touches a frozen contract without a
matching ADR reference.

### 3. Numbers live in data, not in code

Damage values, prices, timings, drop rates: data files, validated against a schema. A
number compiled into a source file cannot be tuned by the person who owns tuning, so it
will be tuned by whoever owns the file, which is the wrong person.

*Enforced by:* the build gate's hardcoded-constant check.

---

## Part two · Concurrency

### 4. One writer per path

Every path in the repository has exactly one owner, listed in the ownership table. Two
agents editing one file concurrently do not merge; they overwrite, and the loser's work
disappears without an error message.

*Enforced by:* the lane gate, which rejects out-of-lane changes without reading them.

### 5. One lane per agent

Each agent works in its own worktree and its own branch. Never in someone else's
directory, never on someone else's branch.

*Enforced by:* the lane gate and branch naming.

### 6. Small steps

At most 400 changed lines and 25 files of code per pull request. Documentation and board
files are exempt.

This is not a style preference. Past that size a reviewer stops reviewing and starts
skimming, and the review gate silently becomes decorative while still reporting green.

*Enforced by:* the envelope gate.

---

## Part three · Acceptance

### 7. Nobody certifies their own work

An agent may not approve, merge, or declare done anything it produced. Author and
reviewer are different agents, named on the task card before the work starts.

*Enforced by:* the envelope gate compares the two names.

### 8. Done is a command, not an opinion

Every task carries one acceptance command, written when the task is dispatched. It
passes when it exits zero. "Mostly working" is not a state that exists.

The command is fixed at dispatch precisely so it cannot be chosen afterwards to match
whatever happens to pass.

*Enforced by:* the envelope gate compares the evidence pack against the card's command.

### 9. Claims need evidence

"I ran it and it passed" is not evidence. An evidence pack is: the command, its full
output ending in `EXIT_CODE=0`, the diff summary, and the environment.

The gatekeeper re-runs a sample of finished tasks in a clean environment. Fabricated
evidence is the one offence that ends an agent's participation, because a team that
cannot trust its own reports has no way to work at all.

*Enforced by:* the envelope gate, and by re-running samples.

---

## Part four · Communication

### 10. Never go silent

Progress is visible in commits. An agent that stops committing has stopped, whether or
not it knows it. Silence is reported automatically and treated as a problem to solve,
not a mood to respect.

*Enforced by:* the stall check reads commit timestamps. Nothing to remember, nothing to
forget, and it works precisely when a stuck agent cannot report being stuck.

### 11. Three strikes, then stop

Three failed attempts at the same problem is the limit. Then stop, write a blocker
report, and escalate. There is no fourth attempt.

This is not enforced by a gate, and it is the most important rule here. The single most
expensive failure mode of a weak agent is looping: it keeps trying variations, keeps
producing plausible progress reports, and burns a day going nowhere. The rule exists
because the agent doing it cannot tell that it is doing it. Count out loud.

### 12. Pull the andon cord

Four situations require stopping the line immediately: the default branch is red, two
specifications contradict each other, a frozen contract was violated, or work in flight
rests on an assumption now known to be false.

Pulling the cord when it turns out to be nothing costs an hour. Not pulling it costs
everything built on top afterwards. **Pulling unnecessarily is never penalised. Failing
to pull is.**

---

## Part five · Evolution

### 13. Taste belongs to the human

Whether the game is good is not a decision agents get to make, and no metric substitutes
for it. Agents make things measurable; the human decides whether the measured thing is
worth having. A milestone does not ship without the human having played it.

### 14. Fix the process, not the person

When something goes wrong, the question is which rule or gate allowed it, not who erred.
An agent that repeats a mistake is evidence of a missing gate.

And the converse, which matters more: **a process change requires a real incident.**
Every framework change records the failure that caused it, with a date and a link. A
framework that grows from imagination grows without limit, and each addition is a tax
paid on every task forever.

*Enforced by:* CI rejects changes to gates or SOPs whose PR does not cite a cause.

---

## Before you start, answer three questions

Every agent, at the top of every reply that begins a work session:

1. Which files did I read? (exact paths)
2. Which paths am I allowed to change? (globs, from the ownership table)
3. What is my acceptance command, and what does passing it prove?

Cannot answer one of them? Then do not start. Ask.
