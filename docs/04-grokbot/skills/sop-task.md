# /sop-task · Take a task from dispatch to merged

**Trigger:** you were assigned a task card, or you are picking the top unclaimed item off
`board/backlog.md`.

---

## 1. Sync and read

```bash
cd /workspace/lanes/<your-code>
git fetch origin && git rebase origin/main
```

Read the card at `board/tasks/T-XXX.md` and **every file it lists in section 2**. Not the
titles — the files.

## 2. Answer the three questions, out loud, in your first message

1. Which files did I read? (exact paths)
2. Which globs may I change? (from the ownership table, section 3 of the card)
3. What is my acceptance command, and what does passing it prove?

Cannot answer one? Do not start. Ask the dispatcher. A task you have to guess at is a task
you will finish and then be told to redo.

## 3. Refuse a bad envelope

You may hand a card back. Reasons that are always sufficient: no acceptance command, an
acceptance criterion that is an adjective, section 5 that cannot be verified, a lane you do
not own, or a contract it depends on that does not exist yet.

Refusing costs one message. Building the wrong thing costs a day, and then the day it takes
to unpick it.

## 4. Branch

```bash
git switch -c lane/<CODE>/T-XXX
```

Any other shape fails the envelope gate, and it fails for a reason: a change nobody can
trace to a card is a change nobody can explain six weeks from now.

## 5. Run the acceptance command first — and watch it fail

Before writing anything. If it already passes, either the task is done or the command tests
the wrong thing. Both are worth knowing now rather than at review.

## 6. Implement in small commits

```
<type>(<scope>): <subject> [T-XXX]
```

`feat` `fix` `docs` `refactor` `test` `chore` `perf` `content` `art`. Every commit carries
the task id; CI checks this and rejects the pull request otherwise.

Under 400 changed lines and 25 files of code. Larger means splitting the task, not asking
for an exemption.

## 7. Count your failures

Three failed attempts at the same problem and you stop. Not four. See `/sop-blocked`.

You will not notice you are looping — from the inside, attempt seven feels like progress.
Keep the count explicitly.

## 8. Produce the evidence pack

Run **exactly** the command in section 6 of the card. Capture all of it.

```
evidence/T-XXX/
  command.txt     the command, verbatim from section 6
  output.txt      full output, last line EXIT_CODE=0
  diff-stat.txt   git diff --stat origin/main...HEAD
  env.txt         node/git versions, platform
```

Do not trim the output. The gatekeeper re-runs a sample and compares; a trimmed log is
indistinguishable from a hidden failure, and it will be treated as one.

If the command does not exit zero, you are not finished. There is no partial credit and no
"passes locally".

## 9. Open the pull request

Title `<type>(<scope>): <subject> [T-XXX]`. Body: what changed, why, and what you verified.
Request the reviewer named on the card — never yourself.

## 10. Done means merged

Not "PR opened". Not "CI green". Merged, by someone else. Until then the task is in flight
and you own it.

---

**Definition of done:** the pull request is merged, every gate was green without an
override, and the evidence pack is in the repository.

**Escalation:** blocked over 30 minutes, tell the dispatcher. Three failures, write a
blocker report. A reviewer silent for four hours, ask the dispatcher for a different one.
