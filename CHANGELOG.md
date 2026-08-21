# Changelog

Append-shared. Add your own entry; never rewrite anyone else's. P0 organises at release.

**Every entry states a cause**, marked `★`: the real failure that prompted it, with a date
or a link. Constitution article 14. A framework that grows from imagination grows without
bound.

---

## v3.1.0 — 2026-08-21

Minor: the mount produces four more files. Every command printed in an SOP, a routine or a
role card now runs in a project, which until now half of them did not.

### Every command the SOPs print was wrong in a project

★ Cause: a readiness audit of `sunset-club`, 2026-08-21, before any agent was created. `/sop-lock`
says `node tools/lock.mjs`. In the studio that path is the implementation. In a project the
implementation is at `docs/_studio/tools/lock.mjs`, because it arrives inside the mirror — and
the mirror is compared byte for byte against the upstream tag, so the path cannot be rewritten
on the way in. The same held for `tools/board/status.mjs`, `tools/board/stall.mjs` and
`tools/verify-protection.mjs`: P0's daily dispatch, O1's hourly ops check, the stall routine and
the weekly protection check. Every one of them would have failed with a file-not-found the first
time an agent ran it.

Nothing caught this because the studio is the one repository where those paths are correct.

- The mount installs a launcher at each of the four paths, one line, forwarding to the same
  path inside the mirror. Documents keep printing one command and it is right in both kinds of
  repository.
- `gates.test.mjs` asserts every launcher exists and is inside the mounted file set. A launcher
  pointing at a tool nobody mounted forwards to nothing.
- `setup.md` step 9 now runs the four commands before anything else. They are the cheapest
  possible check and they would have caught this in ten seconds.

The alternative was to print two forms of every command and expect each agent to choose. An
agent that has to work out its own prefix works it out wrong at the worst moment, which here is
while holding a lock or answering a stall alert.

---

## v3.0.2 — 2026-08-21

Patch. The docs gate rejected a task card for naming the one path a task card is supposed to
name before it exists.

★ Cause: `sunset-club` PR #3, 2026-08-21 — the first task card written in a project under
v3.0.1. Section 8 of the template ends "Three failed attempts: stop and write
`board/blockers/T-XXX.md`", and the gate checks that backticked in-repo paths exist. Filled in
with a real task id, that line names a file that must not exist yet: a card whose blocker
report already exists is a card already in trouble.

- `board/blockers/**` is exempt from the path-existence check.
- The studio's own path check now covers `board/tasks/`, `board/backlog.md` and
  `board/andon.md`. It previously covered no `board/` path at all, which is why three studio
  cards carrying the same line passed and the first project's card failed. A gate that checks
  a project harder than it checks the framework will keep finding defects one project too
  late.

The rest of the board — decisions, drift, playtests, the trust ledger — is still unchecked in
the studio, because those belong to projects and the studio only describes them.

---

## v3.0.1 — 2026-08-21

Patch. Two things v3.0.0 got wrong on the first real merge it governed, plus two cosmetic
fixes. No gate changed its verdict; the docs changed to describe the verdict correctly.

### The approval mechanism was documented as a comment, and a comment does nothing

★ Cause: `sunset-club` PR #2, 2026-08-21. The human's `APPROVED-BY: human` was posted as an
issue comment. The gate reads issue comments, so the line was valid — but only
`pull_request_review` re-runs the workflow, so no run ever read it. The approval sat in the
timeline and the pull request stayed red, with a failure message instructing the reviewer to
do exactly the thing that had just failed.

- The gate's message now gives the command (`gh pr review <n> --comment --body "..."`) and says
  outright that a plain comment is read but does not re-run anything.
- `gates.md`, `sop-task.md`, `setup.md`, and the constitution now say **review**, not comment.
  `sop-review.md` already did, which is how the discrepancy went unnoticed.

Comments are still read. Narrowing the gate to reviews only would reject an approval that is
in the timeline and legible, which is a worse failure than the one being fixed.

### A stale run's verdict outlived the condition that caused it

★ Cause: the same pull request. Runs started before the `break-glass` label and before the
approving review, failed for those reasons, and left their verdicts on the commit. The newest
run was green on all seven gates and GitHub still reported `BLOCKED`, because labels and the
timeline are read when a run *starts*.

Protection counts every run on the commit, not the most recent, which is the part that makes
this expensive: re-running the newest failure is not enough, and on the pull request that
fixed it three separate runs had to be re-run before the merge button turned green.

- `gates.md` and `sop-review.md` now name the symptom, say to list the runs and re-run each
  failure with `gh run rerun <id> --failed`, and say not to merge past them with `--admin`.

No mechanism can fix this from inside a workflow: a run cannot invalidate the verdict of a run
that finished before it. Recognising it is the whole remedy.

### Two cosmetic fixes

- The lane gate printed `task=null` on board branches, which have no task by design. It now
  prints `board branch`.
- `mount.mjs` told a freshly mounted project to run `tools/verify-protection.mjs`, which in a
  project lives at `docs/_studio/tools/verify-protection.mjs`. Copy-pasting the printed line
  produced a file-not-found on the last step of setup.

---

## v3.0.0 — 2026-08-21

Major. Three independent audits read the v2.0.1 framework against its own claims before any
game code existed. They found the gates could be switched off by a branch name, that peer
review was unenforced, and that the first project's pull requests could not merge at all.
Everything below is a defect that was real in v2.0.1.

The version is major because tightening a gate turns an existing project red: cards must now
be dispatched before the work, granted paths must be inside a fence, and evidence packs must
run exactly the card's commands. Every project re-mounting will have to fix its open cards.

### Branch protection required a check that does not exist

★ Cause: 2026-08-21. `sunset-club` was configured with `contexts: ["gates"]` — the workflow
name. GitHub matches **job** names, so the required check never reported. Every pull request
showed seven green gates and a grey merge button, and the repository was unmergeable for a
day. `setup.md` warned about this two paragraphs after printing the command that caused it.

- `tools/verify-protection.mjs`: reads live protection from outside the repository, which is
  the only place it can be read from. Nothing inside a workflow can see its own protection.
- R11, Monday 09:30, O1.
- `spec-check.mjs` additionally refuses a workflow with no `summary` job, or one whose
  `needs` list omits a gate — a gate outside that list cannot block a merge.
- `setup.md` now uses a JSON body, states the job-versus-workflow distinction first, and
  ends with the verification command.

### A branch name could switch the gates off

★ Cause: the gate-tools audit, 2026-08-21, which proved the ref name was legal rather than
assuming it. `${{ github.head_ref }}` was interpolated into `run:`, so a branch named
``lane/A1/T-001"||true;#`` made the lane and envelope steps exit zero without checking
anything. The pull request that disabled the gates would have been approved by them.

- Every external value is an `env:` variable in both workflows and the project template.
- `lib.mjs` calls git through `execFileSync` with an argument array. There is no shell left
  between a branch name and git.

### The lane gate read permissions from the branch it was judging

★ Cause: same audit. Four independent ways past it, all real:

- The ownership table was read from the pull request head, so its owner could grant
  themselves a path in the commit that used it. Permissions now come from the base branch;
  only files that do not exist on base are matched against the branch's table, and adding
  that row is itself a change the gate has already judged.
- `ownershipPath()` returned the first candidate that existed, so creating a root
  `OWNERSHIP.md` in a project hijacked the whole table. The table is now chosen by repository
  kind: `.studio-version` present means project.
- `git diff --name-only` reports only where a renamed file landed, so `git mv` out of another
  role's directory read as a plain addition in yours. Diffs use `-M -z`; a rename is checked
  as a delete of the source and an add of the destination.
- Task cards were read from the branch, so the lane declaration was a note the author wrote
  to themselves. Cards are read from the base branch: dispatch is now load-bearing rather
  than ceremonial.

### A card that forbade a path was granting it

★ Cause: same audit. Section 3 was scanned for backticks, so "do not touch `packages/sim/**`"
put that glob in the granted list. Granted paths now come from a fenced block and nowhere
else, and the envelope gate rejects a card whose section 3 has no fence.

### Peer review was not enforced by anything

★ Cause: 2026-08-21. Every agent drives one GitHub account, so GitHub's own review
requirement can never be satisfied — an account cannot approve its own pull request — and
`sunset-club` had it set to one, which was the second reason nothing could merge. The
envelope gate's owner-versus-reviewer check compared two strings in a file the author edits.

- The reviewer comments `APPROVED-BY: <code>`. The envelope gate collects every review and
  comment body and requires a code that is neither the branch's bot nor the card's owner.
- `pull_request_review` is a trigger, so an approval re-runs the gates without a new commit.
- A diff touching `.github/workflows/`, `tools/gates/`, or an ownership table needs
  `APPROVED-BY: human`. On a same-repository pull request GitHub runs the workflow from the
  branch under review, so those diffs are judged by the files they change. The human is the
  only reviewer outside that loop, and `gates.md` now says so under "What the gates cannot
  check" rather than implying the repository can police itself.

### Routines, andon pulls and dispatch were all structurally unmergeable

★ Cause: the framework audit, 2026-08-21. The envelope gate required a dispatched card, an
evidence pack and a green exit code from every pull request. Appending to `board/andon.md`
has none of those, and its first trigger is a red default branch — so recording that the line
had stopped required the line to be running. Dispatching the first card required a card that
had already been dispatched.

- `board/<CODE>/<slug>` branches: `chore(board):` commits, no card, no evidence pack, and
  nothing outside `board/`.
- `board/andon.md` and `board/blockers/**` merge with no approval either. A distress signal
  that waits for a reviewer is not one.
- `break-glass`: when CI itself is broken the repair cannot pass the gates it broke. The
  label downgrades the envelope gate's failures to warnings, but only if the same diff writes
  the andon entry. Pulling the cord and recording it are one act.

### Evidence packs passed on their last line

★ Cause: same audit. The gate tested `/EXIT_CODE=0\s*$/` against the whole file, so a pack
reporting `EXIT_CODE=1`, `EXIT_CODE=1`, `EXIT_CODE=0` passed — which is exactly the pack you
would produce if you were hiding the first two. `command.txt` was checked for containing the
card's commands, so adding four more that pass was free.

- Every `EXIT_CODE` line must be zero, and the set of commands must equal the card's exactly.

### The mirror gate could not see a file the manifest omitted

★ Cause: same audit. Verification walked `MANIFEST.json`, so a manifest missing a gate file
described a mirror missing that gate and every hash in it still checked out.

- The upstream file set is now compared against the manifest. The list of what should have
  been mounted is read from `tools/mount.mjs` inside the freshly cloned tag, never from
  anything the project could have written.

### A project had to hand-write its CI

★ Cause: the framework audit. `mount.mjs` was documented as `node tools/mount.mjs`, a path
that does not exist in a repository that has not mounted anything yet, and no workflow
template shipped. The first project wrote its own, and it was the one with the unreachable
required check and the missing upstream mirror comparison.

- `templates/.github/workflows/gates.yml` ships and is installed on first mount, never
  overwritten afterwards — projects add their own jobs to it.
- The bootstrap is a `curl` of `mount.mjs` at the tag being mounted, so the mount logic and
  the framework it mounts are the same release.
- The template fails with the list of missing `package.json` scripts rather than with npm's
  "command not found", because the commit that creates the workspace turns eight blocking
  steps on at once.

### `skipped` counted as `success`

★ Cause: the gate-tools audit. The summary job treated a job that never ran as a job that
passed, and a job that never runs is one `if:` away in a diff this gate is judging. Required
jobs are now listed per event and must be `success`.

### Smaller things

- `lock.mjs`: releasing required no holder, and matched with `startsWith`, so omitting your
  name was the easiest way to take someone else's lock and `A1` could release `A10`'s. Holder
  is required and compared exactly. `list` fetches tags first, so it can read the messages it
  prints.
- Role cards listed ownership globs. They had already drifted from the table — C1 named a
  board directory that had been renamed, and O1 and Q1 both claimed `.github/`. The cards
  describe an area of responsibility; the table decides paths.
- The constitution claimed a build gate enforced frozen contracts and hardcoded constants.
  Neither check exists in the studio layer. Both now say so.
- H2 had no rubric, so "the human plays it for twenty minutes" produced nothing comparable
  between milestones. Four fixed questions, written to `board/playtests/`, with question four
  blocking.
- `spec-check.mjs` reported its own explanatory comment as a swallowed failure. Comment lines
  are stripped before the scan.

## v2.0.1 — 2026-08-21

Patch. No rule changed; the mount produced a mirror the mirror gate rejected.

### The mount wrote a file it did not hash

★ Cause: the first project to mount v2.0.0 failed G1 immediately with
`docs/_studio/README.md is not in the manifest`. `tools/mount.mjs` wrote the mirror's
read-me *after* computing the manifest, so the file existed on disk and in no hash. The
gate is right to reject that — a file nobody hashed is a file anybody can change — but no
project could have mounted v2.0.0 at all.

- `tools/mount.mjs` writes the read-me before walking the tree, so it is hashed with
  everything else. `studio-sync.mjs` already skipped it in the upstream comparison, which is
  where the intent was visible: the file was always meant to be in the manifest.

This is the case for the eight negative tests in `docs/04-grokbot/setup.md` step 9. The
release passed every gate in the studio repo, because the studio repo has no mirror to mount.
A gate nobody has watched fail is a gate nobody knows works, and a tool nobody has watched
succeed end to end is the same thing.

### The mirror gate is shipped, not rewritten per project

★ Cause: same mount. `tools/studio-sync.mjs` lives in the project, because it cannot verify
a mirror it lives inside — and nothing shipped it, so the playbook effectively asked each
project to write the framework's most important gate from a paragraph of description. The
first hand-written copy had the local hash check and not the upstream comparison, which is
the half that catches a forged manifest.

- Added `templates/tools/studio-sync.mjs`, the canonical implementation.
- `mount.mjs` writes it into the project.
- It compares itself against the mirrored template on every run. A project-side gate can
  always be weakened; this makes weakening it appear in the diff as a gate being disarmed.

### The mirror's line-ending exemption is verified, not assumed

★ Cause: found while mounting. `.gitattributes` resolves by last match, so adding a
repository-wide `* text=auto eol=lf` line *above* `docs/_studio/** -text` cancelled it
without any warning. The symptom is every mirror file reporting as modified on one machine
and none on another, which reads as tampering.

- `studio-sync.mjs` now runs `git check-attr text` on the mirror and fails if the answer is
  not `unset`. Reading `.gitattributes` directly would not have caught it: only git accounts
  for ordering, nested files, and global configuration.

### The envelope gate names the character it cannot see

★ Cause: 2026-08-21, while preparing this release. PowerShell's `Set-Content` wrote a
byte-order mark, the commit subject looked exactly correct in every terminal, and the gate
said only that it did not match the format. This is the third time a non-ASCII byte in a
machine-read position has cost time, and the first two are why v2.0.0 is in English.

- Commit subjects are checked for non-printable-ASCII characters before the format check,
  and the failure prints their code points and the one-line fix.

### G7 reads the changelog, not the pull request body

★ Cause: [PR #5](https://github.com/catchyan/sunset-studio/pull/5), 2026-08-21. The cause for
this very release was written in `CHANGELOG.md`, where the constitution says it belongs, and
G7 failed anyway because it was reading the pull request description. A gate that rejects the
correct behaviour teaches people to work around it.

The second reason is worse: the description was interpolated straight into a shell command,
so any pull request body could run commands on the runner. Nobody had to be malicious for
that to hurt — a stray backtick in prose would have done it.

- G7 now requires an added `★` line in the changelog diff, and reads no untrusted input.

### This repository stores LF

★ Cause: the same investigation. The studio had no `.gitattributes`, so a Windows checkout
produced CRLF working files. Nothing was broken — the mount clones with `core.eol=lf`, which
is why this never surfaced — but the correctness of every project's mirror rested on one flag
in one script rather than on what the repository says about itself. Renormalising changed no
stored bytes, so v2.0.0's hashes are unaffected.

### Editorial

- The constitution said "twelve articles" and had fifteen. No rule changed; the count was
  wrong from the first draft, which is a small thing that costs credibility in a document
  whose whole claim is that it is precise.

---

## v2.0.0 — 2026-08-21

Breaking. Rewritten in English, cut down, and re-founded on state derived from git rather
than state written by hand. Projects upgrading from v1 must re-mount and rewrite their
ownership table; the owner tokens changed.

### The framework is in English now

★ Cause: three failures in one week traceable to non-ASCII text in machine-read positions.
A branch protection rule silently required a status check whose name was non-ASCII and
never matched; a commit message acquired a byte-order mark that broke the subject-line
check; line-ending translation made the mirror gate accuse a person of tampering when the
cause was a checkout setting. Owner tokens, gate output, task card headings, commit format,
and CI job names are all ASCII.

### State is derived, not written

★ Cause: the audit before staffing found that task status lived in three files, that the
SOPs required the assignee and the reviewer to update files they did not own, and that
nobody at all was assigned to update the sprint board — which the sampling and stall
routines both read. Every one of those would have failed on the first real task.

- Removed the status field from task cards; removed the sprint file entirely.
- Added `tools/board/status.mjs`, which reads git and CI.
- Added `tools/board/stall.mjs`, which reports only lanes that have stopped.
- Deleted self-reported heartbeats. Sixty writes a day of "still here" that structurally
  could not catch the one case that mattered.

### Evidence packs were impossible to submit

★ Cause: the ownership table read `` `evidence/T-XXX/**` `` with `T-XXX` as a literal
string, so it matched nothing, and the owner was written as prose the gate did not
understand. Caught by CI on 2026-08-21 on the first pull request that produced an evidence
pack. Added the `<TASK>` token and the `TASK-AUTHOR` owner, both expanded against the
branch's task id.

### The lane override could authorise itself

★ Cause: the same audit. The gate matched `LANE-OVERRIDE:` followed by any token in the
pull request body, accepted a glob, and never checked the approval link — an agent could
grant itself blanket permission by typing one line. Overrides now require a
`lane-override` label plus the path being listed in section 3 of the task card, and every
labelled pull request is fully reviewed rather than sampled.

### Documented gates that did not exist

★ Cause: the audit compared `gates.md` against the workflow. Three documented checks had
never been written, commit-message task ids were never verified despite being documented as
enforced, and one gate documented as blocking ended its command in `|| echo` — green for
weeks while checking nothing. Added `tools/gates/spec-check.mjs`, which compares the gate
list against the workflow in both directions and rejects a blocking gate that swallows its
own failures. Implemented the commit-id check and the comparison of `command.txt` against
the card's acceptance command.

### Locks were impossible to take legally

★ Cause: the lock SOP told agents to push a file directly to the default branch, while
setup requires branch protection with `enforce_admins`. Every push would have been refused,
leaving no legal way to lock a shared resource. Locks are now git tags, where the push
either wins or fails atomically.

### Roles and bot descriptions were two documents

★ Cause: the audit found they had already diverged — one told every bot that the ownership
table lived at a path that holds only the format specification. Merged into one file per
role under `docs/02-roles/`, which is itself the description.

### Cut

★ Cause: fourteen roles, seventeen SOPs, eleven routines, and roughly twelve thousand words
of process, none of which had ever been executed, for agents that will not read it all.
Rules the gates do not enforce are wishes, and wishes charged to every task.

- SOPs: 17 to 6. The rest folded into the role card of whoever performs them, or deleted.
- Routines: 11 to 10, with two of them silent unless they find something.
- Constitution: 20 articles to 12.
- Board: 20 paths to 11.

### Three defects the new gates found in their own rewrite

★ Cause: running the gates against the rewrite itself, before pushing it.

- A glob ending in `/**` also matched the bare directory path. Harmless in a diff, which
  only ever names files, but a glob matching more than it says is one people misread.
- Deleting a file and its ownership row in the same commit was reported as "unowned" — a
  false positive that would have fired on every refactor anyone ever did. Deletions are now
  judged against the table as it stood on the base branch.
- `HUMAN`-owned paths had no legal amendment route at all, so the constitution could only be
  changed by an administrator force-push. Added the `human-change` label, with the same
  two-act structure as `lane-override` and a separate name so the two can be counted apart.

Also added a declared exception for changes that genuinely cannot be split, since a hard cap
with no route made the first infrastructure change impossible — the same shape of defect as
the three above.

### Also

- Skill installation path corrected to the mirror. As written, no skill would have installed.
- `docs/00-charter/vision.md` clarified as project-layer; the studio never holds one.
- Gate scripts share `tools/gates/lib.mjs`, so glob matching cannot be right in one gate and
  wrong in another.
- `git` invocations raised to a 64 MB buffer; a large diff previously crashed with an
  unreadable stack instead of a verdict.

---

## v1.0.3 — 2026-08-21

Added the mirror owner, so upgrading the framework no longer requires bypassing the lane
gate.

★ Cause: the mirror was owned by the human, which blocked the one legal way to change it.
The only route left was an administrator force-push. A rule that must be bypassed to get
anything done teaches that rules are optional.

## v1.0.2 — 2026-08-21

Mount and verify with forced LF line endings; write the `-text` rule into `.gitattributes`.

★ Cause: the mirror gate went red in a project's CI. Windows had translated line endings on
checkout, so the bytes verified on Linux differed from the bytes hashed on Windows. The
failure accused someone of tampering with the framework.

## v1.0.1 — 2026-08-21

The lane gate's self-test skips studio-table assertions when running in a project repo. The
changelog became append-shared.

★ Cause: the mirrored test failed in a project repository looking for a file that only
exists in the studio. And a gate fix was blocked because the changelog belonged to one role,
which would have made every future fix require an override.

## v1.0.0 — 2026-08-21

First release. Constitution, RELAY framework, roles, gates, SOPs, mirroring, and the studio
layer.
