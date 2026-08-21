# Gates

A gate is a program that returns zero or non-zero. Nothing else is a gate.

Advice in a document is not a gate. A checklist nobody runs is not a gate. If a rule
matters and no program can check it, say plainly that it is unenforced and depends on a
person — do not describe it in a way that implies a machine is watching.

**This table is itself checked.** `tools/gates/spec-check.mjs` compares it against
`.github/workflows/gates.yml` in both directions: a gate documented here must exist as a
job there, a job there must appear here, and a gate documented as blocking must not
contain `continue-on-error` or a `||` that swallows its own failure.

That check exists because of a real failure: one gate was documented as blocking and its
command ended in `|| echo`. It reported green for weeks while checking nothing, and the
document that would have revealed it was read by different people at different times than
the workflow file.

---

| ID | Gate | Repos | Enforced by | Blocking |
|---|---|---|---|---|
| G1 | Framework mirror | project | `mirror` | yes |
| G2 | Lane | both | `lane` | yes |
| G3 | Envelope and evidence | both | `envelope` | yes |
| G4 | Documents and specification | both | `docs` | yes |
| G5 | Build, types, tests | project | `build` | yes |
| G6 | Feel and art | project | `feel` | yes |
| G7 | Cause for framework change | studio | `cause` | yes |
| R1 | Peer review | both | `envelope` | yes |
| H1 | Daily human decisions | both | the human | no |
| H2 | Milestone taste review | project | the human | yes |

Branch protection requires exactly one check, and it is the **job** named `summary`, never
the workflow named `gates`. GitHub matches job names. A rule naming the workflow waits for a
check that never reports: every gate shows green and the merge button stays grey. That cost
a day in this studio's first project. `tools/verify-protection.mjs` checks it from outside,
which is the only place it can be checked from.

---

## G1 · Framework mirror

`tools/studio-sync.mjs` verifies `docs/_studio/` against `MANIFEST.json` file by file, then
re-clones the pinned tag from the studio repository and recomputes the hashes.

Two layers, because one catches only the careless case. Local hashing catches an edited
mirror file; only re-cloning catches an edited mirror file whose manifest entry was updated
to match.

The mirror is committed with `-text` in `.gitattributes`, and the gate asks git whether that
rule is actually in effect. Without the rule, line-ending translation changes the bytes and
the gate reports tampering — accusing a person when the cause was a checkout setting. Asking
git rather than reading the file matters because `.gitattributes` resolves by *last* match: a
broad `* text=auto` line placed below the mirror's rule silently cancels it.

The gate itself cannot live inside the mirror it verifies, so `mount.mjs` writes it into the
project from `templates/tools/studio-sync.mjs` and the gate compares itself against that
template on every run. That does not make weakening it impossible — nothing project-side can
— but it turns a quiet edit into a visible one.

The last layer compares the *set* of files, not just their contents. Walking the manifest can
only ever find files that are in it, so a manifest that omits a gate describes a mirror
missing that gate and every hash in it still checks out. The list of what should have been
mounted is read from `tools/mount.mjs` inside the freshly cloned tag, never from anything the
project could have written.

## G2 · Lane

`tools/gates/lane-check.mjs` reads the ownership table and rejects any changed path the
branch's bot does not own. Content is not examined; the verdict does not depend on whether
the change was a good idea.

Special owners: `HUMAN`, `FRAMEWORK` (mirror; changes only alongside `.studio-version`),
`ANYONE` (append-shared files), `SELF` (only the file named after you), `TASK-AUTHOR` (a
`<TASK>` glob, expanded to this branch's task id).

**Permissions are read from the base branch, never from the branch under review.** The table
on your own branch is a table you can edit in the commit that uses it, which made the lane
gate a note the author wrote to themselves. The one exception is a file that does not exist
on base yet: a new path is matched against the table on the branch, because adding its row is
itself a change to the table, and the table has an owner, so this gate has already judged it.

**Which table governs is decided by the kind of repository, not by which file exists.** A
project reads `docs/03-process/ownership.md`; the studio reads `OWNERSHIP.md`. Trying
candidates in order meant anyone who could write one path in a project could create a root
`OWNERSHIP.md` and become the owner of everything in it.

**Renames are two events.** `git diff --name-only` reports only where a file landed, so
`git mv` out of somebody else's directory looked like a plain addition in yours. The gate
diffs with `-M` and checks the source path against its owner and the destination against
yours.

Two exceptions, each needing two independent acts: the path listed in the fenced block of
section 3 of the task card **as merged on the base branch**, plus a label. `lane-override`
for another role's paths, `human-change` for `HUMAN` paths. One act alone does nothing,
because one act is something an agent can do to itself.

Granted paths come from the fence and nowhere else. Scanning the section for backticks read
the prohibitions too, so a card that said "do not touch `packages/sim/**`" granted exactly
that path.

`HUMAN` paths need a route at all because the constitution has to be amendable, and every
change here goes through a pull request. Without one, amending it would require an
administrator force-push — and a rule whose own amendment procedure requires breaking the
rules does not survive contact with a deadline.

This is auditable, not preventive. Every agent currently drives the same account, so nothing
proves who applied a label. What the mechanism buys is that both acts are timestamped in the
pull request timeline and the gatekeeper reviews **every** labelled pull request rather than
sampling it.

## G3 · Envelope and evidence

`tools/gates/envelope-check.mjs`:

- the branch is `lane/<CODE>/T-XXX`;
- that card was **already on the base branch** before the work started, has all eight
  sections with a fenced block in section 3, and appears on `board/backlog.md`;
- owner and reviewer are named, and are different;
- somebody other than the author has approved it (R1, below);
- every commit subject matches `<type>(<scope>): <subject> [T-XXX]` with the branch's id;
- the evidence pack exists, **every** `EXIT_CODE` line in it is zero, and its `command.txt`
  is exactly the acceptance command from section 6 of the card — no more, no less;
- code changes stay under 400 lines and 25 files.

The command comparison is the point of the whole gate. Without it an agent can run whatever
passes and paste that instead, and every other check here would still be green. It compares
both ways: a pack that adds commands the card never asked for is a pack whose exit codes are
about a different question. And it counts every exit code, not the last one — a pack ending
`EXIT_CODE=1, EXIT_CODE=1, EXIT_CODE=0` used to pass on the strength of its final line, which
is exactly the pack you would write if you were hiding the first two.

Requiring the card on the base branch is what makes dispatch mean anything. The lane, the
definition of done and the acceptance command are the terms you will be judged against, and a
card on your own branch lets you write your own terms in the same commit that meets them.

Some changes genuinely cannot be split: a bootstrap, a mechanical rename, a vendored import.
Removing the size limit for those would remove it for everything, so the exception raises the
price instead — `- Size exception: <reason>` on the card, the `large-change` label on the pull
request, and a full review rather than a sampled one.

### Board branches

`board/<CODE>/<slug>` is for changes that record something rather than build it: dispatching
a card, pulling the andon cord, filing a blocker, logging a playtest. They carry no card and
no evidence pack, and their commits read `chore(board): <subject>`. They may change nothing
outside `board/`.

This exists because the alternative was a deadlock in three places. Every pull request needed
a dispatched card, so the first card could never be merged; the andon cord's first trigger is
a red default branch, so recording that the line had stopped required the line to be running;
and the scheduled routines produce artefacts that are nobody's task.

`board/andon.md` and `board/blockers/**` merge without an approval. Everything else on a
board branch still needs one. A distress signal that waits for a reviewer is not one.

### Break-glass

If CI itself is broken, the repository cannot be repaired through a pull request, because
repairing it requires passing the gates it broke. The `break-glass` label turns the blocking
failures of G2 and G3 into warnings — but only if the same diff also writes to
`board/andon.md`. Pulling the cord and recording that you pulled it are one act.

G2 is covered as well as G3 because a card grants paths and a card is read from the base
branch, so a repair to the dispatch mechanism itself can never grant itself anything.

**One failure survives break-glass: the human's approval of a diff that changes the gates.**
Break-glass exists so a broken repository can be repaired. A repair that also removes the
last reviewer standing outside the loop is not a repair.

The downgraded failures are printed in full in the log, and the gatekeeper reviews the whole
diff and files the follow-up task before the andon entry may be closed.

## G4 · Documents and specification

`tools/gates/selfcheck.mjs`: dead links, references to skills or paths that do not exist,
unmeasurable wording in specification files, and — in the studio repo — iron law one, that
the framework layer carries no single game's proper nouns.

`tools/gates/spec-check.mjs`: this table against the workflow, as described above.

`tools/gates/gates.test.mjs`: the gate engine's own tests. Gates decide what merges, so they
need tests more than product code does.

## G5 · Build, types, tests

Type checking, linting, unit tests, dependency direction, and replay determinism. Steps are
skipped by an `if` condition while a package does not yet exist — never by a command that
cannot fail. A gate is either running or absent; "present but harmless" is the state that
misleads everyone.

## G6 · Feel and art

Frame-data tests, latency measurement, and the art linter. Blocking on any change that
touches combat, rendering, or assets.

Feel is the thing this kind of project gets wrong slowly and irreversibly. A latency
regression of ten milliseconds is invisible in review and obvious in play, so it has to be
caught by measurement or not at all.

## G7 · Cause for framework change

In the studio repository, a pull request touching gates or SOPs must add an entry to
`CHANGELOG.md` stating the incident that prompted it, marked with `★`, with a date and a link.

The changelog rather than the pull request description, for two reasons. Article 1: a
description is not a file in the repository, so a cause recorded only there is a cause nobody
finds in three months. And the description was being interpolated into a shell command, which
made every pull request body executable by whoever wrote it.

Constitution article 14. A framework that grows from imagination grows without bound, and
every addition is a tax paid on every future task. Requiring a real failure is the only
brake that has ever worked.

## R1 · Peer review

A different agent, after CI is green. The reviewer checks intent against the card, not
syntax — the machines already did syntax.

The reviewer records it by submitting a review whose body holds a line, on its own, reading:

```
APPROVED-BY: Q1
```

The envelope gate collects every review and comment body on the pull request and requires at
least one code that is neither the branch's bot nor the card's owner.

It must be a **review**, not a plain issue comment. Both are read, but only a review re-runs
the workflow, and an approval nothing re-reads is an approval nobody collected:

```bash
gh pr review <n> --comment --body "APPROVED-BY: Q1"
```

The same applies to labels. A run reads the labels and the timeline as they stood when it
started, so a run that began before the label or the review keeps its now-obsolete verdict on
the commit, and branch protection keeps seeing it. Re-run it with `gh run rerun <id> --failed`;
do not merge past it with `--admin`.

**This is auditable, not authenticated.** Every agent drives one GitHub account, so GitHub's
own review approval can never be satisfied — an account cannot approve its own pull request —
and its identity would prove nothing if it could. A written line in the timeline is weaker
than a signature and stronger than what it replaced, which was a field the author filled in on
their own card. Giving each role its own account is the upgrade path, and it changes nothing
above this line.

Approving without reading is the failure this gate is exposed to, which is why G3 caps diff
size: past a few hundred lines, review becomes skimming regardless of who is doing it.

## What the gates cannot check

On a same-repository pull request, GitHub runs the workflow **from the branch under review**.
A diff that edits the workflow or the gate scripts is therefore judged by the versions it
contains. No amount of checking inside the repository closes that loop; the repository is
checking its own checker.

Three things hold instead, and they are worth knowing precisely because they are the weak
point:

- Branch protection requires the `summary` job. A diff that removes it never reports a check
  and can never merge, whatever else it does.
- The envelope gate refuses any diff touching `.github/workflows/`, `tools/gates/`, or an
  ownership table unless the human has approved with `APPROVED-BY: human`. A compromised gate
  could skip this check — which is the point: the human is the reviewer *outside* the loop,
  and the rule tells them which diffs they must not wave through.
- `tools/verify-protection.mjs` reads the live protection from outside the repository, on the
  weekly ops routine.

## H1 · Daily human decisions

At most three per day, from P0. Not a merge gate; a check on whether the team is pointed at
the right thing.

## H2 · Milestone taste review

The human plays the milestone, unassisted, for at least twenty minutes, on the target
hardware, and writes the answers into `board/playtests/<date>-H2.md`.

Four questions, the same four every time, so that answers can be compared across milestones:

1. What did you do in the first sixty seconds, and was it the thing the milestone is about?
2. Where did you stop paying attention? Give the minute.
3. What did you expect to happen that did not?
4. Would you play it again tomorrow without being asked? Yes or no, then one sentence.

A "no" to question 4 blocks the milestone. Nothing else here blocks by itself; the answers go
to P0, who decides what becomes a task. The verdict is recorded even when it is favourable,
because a milestone with no H2 file is a milestone nobody played.

No metric substitutes for this and none ever will. A milestone that no person has played is
not finished, however green the board is.
