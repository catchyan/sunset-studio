# Ownership table · format

> Status: FROZEN. The **format** is defined here; the **contents** belong to each repository
> (`OWNERSHIP.md` in the studio, `docs/03-process/ownership.md` in a project).

The lane gate parses that markdown table directly. There is no JSON copy, deliberately: a
second copy is a second truth, and the two will disagree on the day it matters.

---

## Format

```markdown
| Path glob | Owner | Note |
|---|---|---|
| `packages/sim/**` | E1 | |
| `packages/client/src/render/**` | V1 | more specific than the client row, so it wins |
| `docs/00-charter/constitution.md` | **HUMAN** | |
```

- The glob must be in backticks. A row without backticks is ignored, which makes it safe to
  write prose between sections of the table.
- The owner is a role code or one of the special values below. Bold markers are stripped.
- The third column is free text and is never parsed.

## Matching

Only `*` and `**` are supported. `*` stops at a slash; `**` at the end of a glob means
"everything below this directory". Nothing else — no braces, no character classes — because
a matching rule people cannot predict by reading is a rule they will get wrong.

**The longest matching glob wins.** The table is mostly exceptions: a directory belongs to
one role except for one subdirectory that belongs to another. Longest-match is what makes
that expressible without ordering rules.

**A path no glob covers is a violation**, not a free-for-all. Adding a new top-level path
means updating this table in the same pull request. The alternative — unlisted paths being
implicitly public — means the table silently stops covering the repository as it grows.

## Special owners

| Value | Meaning |
|---|---|
| `HUMAN` | No bot may change it, with or without an override. |
| `FRAMEWORK` | The studio mirror. Changes only in a diff that also moves `.studio-version`. |
| `ANYONE` | Append-shared. Add your own entry; never edit someone else's. |
| `SELF` | Only the file whose name matches your role code. |
| `TASK-AUTHOR` | Use with a `<TASK>` glob. Expanded to the branch's task id before matching. |

`<TASK>` exists because of a real failure. The table originally read
`` `evidence/T-XXX/**` `` with the owner written as prose — "whoever owns the task". The
glob was a literal string matching nothing, and the owner was not a value the gate knew,
so every evidence pack the team would ever produce was rejected. It failed on the first
task, which is the good case; the bad case is a rule that fails on the hundredth.

## Rules

1. **One owner per path.** Two owners means a merge conflict nobody is responsible for.
2. **Shared files are append-only.** `ANYONE` means adding your own line. Rewriting another
   role's line is out of lane even in an `ANYONE` file.
3. **Overrides need two acts.** The dispatcher lists the path in section 3 of the task card,
   and someone with write access adds the `lane-override` label. Every labelled pull request
   is fully reviewed by the gatekeeper — not sampled.
4. **Wrong table, fix the table.** If the split is wrong, ask the architect to change it.
   Working around it is worse than the wrong split, because a rule that must be bypassed to
   get anything done teaches that bypassing rules is normal.

## A file people frequently get wrong

If every change of a certain kind requires an override, the table is wrong, not the people.

The changelog was originally owned by one role, and every framework fix therefore needed
either an override or a second pull request. Both are tedious, and **tedious rules are not
obeyed, they are quietly abandoned** — the real outcome would not have been diligent
override requests, it would have been an empty changelog. It is now `ANYONE`, append-only.
