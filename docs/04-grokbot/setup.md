# Setting up the team

From an empty account to a team that can run one task end to end. Do these in order; each
step assumes the previous one worked.

Time: roughly half a day, most of it waiting for CI.

---

## 1. Repository

Public. Branch protection on free accounts requires it, and branch protection is not
optional here — without it the rule "nothing merges without gates" is a request rather than
a fact.

```bash
gh repo create <owner>/<project> --public --clone
```

**Before the first push, check that no credential, address, or key is in any file.** A
public repository's history is permanent, and purging it later means deleting and recreating
the repository. Verify now.

## 2. Mount the framework

```bash
node tools/mount.mjs --version vX.Y.Z
```

Creates `.studio-version` and `docs/_studio/`, and adds the `-text` rule to
`.gitattributes`. Commit all three together.

## 3. Branch protection

```bash
gh api -X PUT repos/<owner>/<project>/branches/main/protection \
  -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=summary' \
  -f 'enforce_admins=true' \
  -f 'required_pull_request_reviews[required_approving_review_count]=1' \
  -F 'restrictions=null'
```

`enforce_admins` must be true. A gate the owner can walk past is a gate that will be walked
past on the first bad afternoon, and after the first time it stops being a gate at all.

Status check names must be ASCII. Non-ASCII job names do not reliably match the contexts
GitHub records, and the protection silently requires a check that never appears.

## 4. Install the skills

Six of them, from **`docs/_studio/docs/04-grokbot/skills/`**. That is the mirror path — the
framework does not exist at the top level of a project repository, and this step has been
got wrong before by copying the studio's own path.

For each file, tell the bot:

> Create a skill named `sop-<name>`. Contents: <paste the file>.

Verify: type `/` and see all six.

## 5. Create the bots

Milestone zero staffs five: P0, A1, Q1, S1, O1.

For each, create a bot whose description is **the entire contents of
`docs/_studio/docs/02-roles/<CODE>.md` below the horizontal rule**, with every `{{...}}`
placeholder replaced by the value from the project's `docs/03-process/staffing.md`.

Do not summarise the file. The role card is written to be the description; a paraphrase is a
second copy, and two copies of a role definition diverge.

## 6. Group chats

Six participants maximum, so:

- **Standing committee** — human, P0, A1, Q1, plus one rotating seat.
- **Build cell** — P0, plus whoever is building the current deliverable.

Add the whole team to nothing. A room where everyone can be interrupted is a room where
everyone is interrupted.

## 7. Routines

Configure the ten in `routines.md`. At milestone zero, R1 through R7 are required; R8 and R9
start with the first full week; R10 waits for M4.

## 8. Worktrees

```bash
git worktree add /workspace/lanes/<code> -b lane/<code>/init
```

One per bot. An agent works in its own directory and nowhere else — this is what makes two
agents editing the same file impossible rather than merely forbidden.

## 9. Prove it works

**Positive:** dispatch one trivial task and take it through `/sop-task` to merge. Every gate
green, no override, evidence pack present.

**Negative — the part people skip.** A gate nobody has watched fail is a gate nobody knows
works:

| Try this | Expected |
|---|---|
| Change one byte in a mirror file | G1 red |
| Change a mirror file *and* `.studio-version` | G2 allows it; G1 judges the content |
| Have a bot edit a path it does not own | G2 red |
| Push a branch named without a task id | G3 red |
| Commit without `[T-XXX]` in the subject | G3 red |
| Put a different command in `command.txt` than the card asks for | G3 red |
| Add an unreferenced link to a document | G4 red |
| Document a gate in `gates.md` that no CI job implements | G4 red |

Eight negative tests. If any of them passes, that gate is decorative — fix it before the
first real task, because after that it is protecting work you have already come to rely on.

## 10. Record what happened

Anything that did not go as written above is a defect in this document. Fix it in the studio
repository with the cause noted, so the next project does not rediscover it.
