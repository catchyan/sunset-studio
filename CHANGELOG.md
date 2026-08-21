# Changelog

Append-shared. Add your own entry; never rewrite anyone else's. P0 organises at release.

**Every entry states a cause**, marked `★`: the real failure that prompted it, with a date
or a link. Constitution article 14. A framework that grows from imagination grows without
bound.

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
