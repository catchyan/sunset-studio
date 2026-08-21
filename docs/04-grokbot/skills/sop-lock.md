# /sop-lock · Take a shared resource

**Trigger:** you are about to use something there is only one of. Every agent works on one
machine with one filesystem: ports, databases, the package store, build output directories,
any external service account.

**Check before you use, not after it breaks.** Two processes on one port fail in ways that
look like a code bug, and the hour spent debugging it happens before anyone thinks to ask
whether someone else was also running the server.

---

## 1. Take the lock

```bash
node tools/lock.mjs acquire <resource> <your-code> "<why, briefly>"
```

Exit zero means you have it. Non-zero means someone else does, and the message says who.

Locks are annotated git tags named `lock/<resource>`. Pushing a tag that already exists on
the remote fails, and that failure *is* the lock — the check and the claim are one
operation, so two agents cannot both come away believing they won.

An earlier design pushed a markdown file directly to the default branch. Branch protection
correctly refuses that, which left no legal way to take a lock at all: every agent either
skipped locking or asked for an administrator override. Tags are not branch-protected, so
this works within the rules rather than against them.

## 2. If it is taken

Do something else. Do not wait in a loop, and do not use the resource anyway.

If you cannot proceed without it, tell the dispatcher — reordering the day is cheap, and two
agents fighting over one database is not.

## 3. Release it the moment you are done

```bash
node tools/lock.mjs release <resource> <your-code>
```

Not at the end of your session. The moment the work needing it is finished.

## 4. A stale lock is a symptom

Anything older than four hours probably outlived its holder. Report it; do not break it.

A lock outlives its holder precisely when something went wrong — the agent crashed, looped,
or was reset. Deleting the tag makes the resource available again and throws away the only
evidence that an agent died. Check on the holder first.

---

## What needs a lock

| Resource | Why |
|---|---|
| A port | Two servers, one port; the second fails confusingly |
| A database or schema | Concurrent migrations corrupt state |
| The package store | Concurrent installs corrupt the cache for everyone |
| A shared build directory | Two builds interleave their outputs |
| An external service account | Rate limits are per account, not per agent |

**What does not:** your own worktree, your own branch, anything under a path you own. Lanes
already handle those, and locking what is already exclusive only adds ceremony.

---

**Definition of done:** acquired before use, released immediately after.

**Escalation:** a lock over four hours old goes to the operator. Two agents needing the same
resource all day is a scheduling problem for the governor, not a queue for you to sit in.
