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
| R1 | Peer review | both | a different agent | yes |
| H1 | Daily human decisions | both | the human | no |
| H2 | Milestone taste review | project | the human | yes |

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

## G2 · Lane

`tools/gates/lane-check.mjs` reads the ownership table and rejects any changed path the
branch's bot does not own. Content is not examined; the verdict does not depend on whether
the change was a good idea.

Special owners: `HUMAN`, `FRAMEWORK` (mirror; changes only alongside `.studio-version`),
`ANYONE` (append-shared files), `SELF` (only the file named after you), `TASK-AUTHOR` (a
`<TASK>` glob, expanded to this branch's task id).

Two exceptions, each needing two independent acts: the path listed in section 3 of the task
card, plus a label. `lane-override` for another role's paths, `human-change` for `HUMAN`
paths. One act alone does nothing, because one act is something an agent can do to itself.

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
- that card exists, has all eight sections, and appears on `board/backlog.md`;
- owner and reviewer are named, and are different;
- every commit subject matches `<type>(<scope>): <subject> [T-XXX]` with the branch's id;
- the evidence pack exists, its output ends in `EXIT_CODE=0`, and its `command.txt`
  contains the acceptance command from section 6 of the card;
- code changes stay under 400 lines and 25 files.

The command comparison is the point of the whole gate. Without it an agent can run whatever
passes and paste that instead, and every other check here would still be green.

Deletions are judged against the ownership table as it stood on the base branch. Removing a
file and its ownership row in one commit is the normal shape of a refactor, and reading only
the new table calls that "unowned" — a false positive that fires on every cleanup.

Some changes genuinely cannot be split: a bootstrap, a mechanical rename, a vendored import.
Removing the size limit for those would remove it for everything, so the exception raises the
price instead — `- Size exception: <reason>` on the card, the `large-change` label on the pull
request, and a full review rather than a sampled one.

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

Approving without reading is the failure this gate is exposed to, which is why G3 caps diff
size: past a few hundred lines, review becomes skimming regardless of who is doing it.

## H1 · Daily human decisions

At most three per day, from P0. Not a merge gate; a check on whether the team is pointed at
the right thing.

## H2 · Milestone taste review

The human plays the milestone, unassisted, for at least twenty minutes, on the target
hardware, and answers three written questions.

No metric substitutes for this and none ever will. A milestone that no person has played is
not finished, however green the board is.
