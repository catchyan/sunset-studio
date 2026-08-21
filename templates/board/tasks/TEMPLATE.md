# T-XXX · <title>

- Owner: @<code>
- Reviewer: @<code>          <!-- must not be the owner -->
- Milestone: M<n>
- Release condition it advances: <quote it from the roadmap>

<!--
Written by the dispatcher BEFORE the work starts. An assignee who writes their own
envelope will, without meaning to, write down whatever turns out to be easy.

There is deliberately no status field. Where this task stands lives in git and CI;
run `node tools/board/status.mjs` to see it. A status written here would be a second
answer to a question that already has one, and it would be the stale one.
-->

## 1. Goal

One sentence. What is true after this that is not true now?

## 2. Inputs

Exact paths to every file the assignee must read. Not titles — paths. If it is not listed
here, it will not be read.

## 3. Lane

The globs this task may touch. One per line, inside the fence — the gate reads the fence and
nothing else.

```
path/glob/**
```

<!--
The fence matters. The gate used to scan this whole section for backticks, so a card that
spelled out "do not touch `packages/sim/**`" was granting exactly that path.

Any path outside the assignee's normal lane must be listed here AND the pull request must
carry the `lane-override` label. Both, or the gate rejects it. One of the two alone is
something an agent can arrange by itself.

This card is read from the base branch, so it grants nothing until it is merged. Dispatch
first, then work.
-->

## 4. Contracts

Which interfaces or schemas this depends on, and whether they are frozen. "None" is a valid
answer, but say it explicitly rather than leaving the section empty.

## 5. Definition of done

A checklist. Every item observable by someone who did not do the work.

- [ ] 
- [ ] 

<!-- Anything an adjective could describe does not belong here. -->

## 6. Acceptance command

```bash

```

One command, or a short sequence. It exits zero exactly when this task is done.

<!--
Fixed at dispatch. The evidence gate compares this against the pack in both directions, so
the pack runs these commands and no others: the command cannot be selected afterwards to
match whatever happened to pass, and extra commands cannot pad the output.
-->

## 7. Evidence

`evidence/T-XXX/` — command.txt, output.txt ending in EXIT_CODE=0, diff-stat.txt, env.txt.

Anything else this particular task needs (a screenshot, a recording, a profile) goes here.

## 8. Timeout and escalation

- Expected: <n> hours
- If blocked: escalate to @<code>
- Three failed attempts: stop and write `board/blockers/T-XXX.md`. There is no fourth.
