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

A new project has no copy of the mount script, and cloning the whole studio to run one file
is how the first project ended up hand-writing its own CI. Fetch it at the tag you are
mounting, so the mount logic and the framework it mounts are the same release:

```bash
V=vX.Y.Z
curl -fsSL "https://raw.githubusercontent.com/<owner>/sunset-studio/$V/tools/mount.mjs" -o mount.mjs
node mount.mjs --version "$V" && rm mount.mjs
```

Creates `.studio-version` and `docs/_studio/`, installs `tools/studio-sync.mjs`,
`.github/workflows/gates.yml` and the launchers, and adds the `-text` rule to `.gitattributes`.

The launchers are four one-line files — `tools/lock.mjs`, `tools/board/status.mjs`,
`tools/board/stall.mjs`, `tools/verify-protection.mjs` — each forwarding to the same path
inside the mirror. They exist so the command printed in an SOP is the command that runs in a
project: the implementations are in the mirror, the mirror is verified byte for byte and so
cannot be rewritten on the way in, and an agent that has to work out its own prefix will work
it out wrong at the worst moment. Commit everything the mount produced together, then:

```bash
node tools/studio-sync.mjs --remote
```

## 3. Branch protection

**The required check is the job name `summary`, never the workflow name `gates`.** GitHub
matches job names. A rule naming the workflow waits for a check that never reports: the pull
request shows every gate green and the merge button stays grey. That cost this studio's first
project a day, and the symptom points nowhere near the cause.

```bash
cat > /tmp/protection.json <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["summary"] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
gh api -X PUT repos/<owner>/<project>/branches/main/protection --input /tmp/protection.json
node tools/verify-protection.mjs
```

`enforce_admins` must be true. A gate the owner can walk past is a gate that will be walked
past on the first bad afternoon, and after the first time it stops being a gate at all.

`required_pull_request_reviews` is **null**, and that is not a relaxation. Every agent drives
one GitHub account, and GitHub will not let an account approve its own pull request, so a
required review here blocks every merge in the repository forever. Peer review is enforced by
the envelope gate instead: the reviewer submits a review reading `APPROVED-BY: <code>` and the gate refuses
any approval from the author. Give each role its own account and this becomes a real
signature; nothing else changes.

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

**Positive:** first, that the commands the SOPs print actually run here:

```bash
node tools/lock.mjs list
node tools/board/status.mjs
node tools/board/stall.mjs
node tools/verify-protection.mjs
```

Then dispatch one trivial task on a `board/P0/<slug>` branch, merge the card, and take it
through `/sop-task` to merge. Every gate green, no override, evidence pack present, one
`APPROVED-BY` from someone who is not the author.

**Negative — the part people skip.** A gate nobody has watched fail is a gate nobody knows
works:

| Try this | Expected |
|---|---|
| Change one byte in a mirror file | G1 red |
| Change a mirror file *and* `.studio-version` | G2 allows it; G1 judges the content |
| Delete a file from `MANIFEST.json` and from the mirror | G1 red — the file set is compared upstream |
| Have a bot edit a path it does not own | G2 red |
| `git mv` a file out of another role's directory into yours | G2 red on the source path |
| Add the path to the ownership table on your own branch and then use it | G2 red — the table is read from base |
| Start work before the card is merged | G3 red |
| List a path in section 3 outside the fence and use it | G2 red |
| Push a branch named without a task id | G3 red |
| Commit without `[T-XXX]` in the subject | G3 red |
| Put a different command in `command.txt` than the card asks for | G3 red |
| Add a fifth command to `command.txt` that the card does not ask for | G3 red |
| Leave a non-zero `EXIT_CODE` line in the middle of `output.txt` | G3 red |
| Merge with no `APPROVED-BY` review, or one naming yourself | G3 red |
| Change `tools/gates/` without `APPROVED-BY: human` | G3 red |
| Approve with a plain issue comment and merge without re-running | G3 stays red until a run reads it |
| Name a branch `lane/A1/T-001"\|\|true;#` | G2 and G3 still judge it |
| Rename the `summary` job | G4 red |
| Add an unreferenced link to a document | G4 red |
| Document a gate in `gates.md` that no CI job implements | G4 red |

Nineteen negative tests. If any of them passes, that gate is decorative — fix it before the
first real task, because after that it is protecting work you have already come to rely on.

Record the result of each in `evidence/T-000/`. "We tried them" is not evidence; the outputs
are. The first project wrote this table and then merged without running the second half.

## 10. Record what happened

Anything that did not go as written above is a defect in this document. Fix it in the studio
repository with the cause noted, so the next project does not rediscover it.
