# Versioning and elevation

Two things live here: how the framework is released, and what is allowed into it in the
first place. They belong together, because most version churn comes from admitting things
that should never have been admitted.

---

## Version numbers

`vMAJOR.MINOR.PATCH`.

**MAJOR** — existing projects must do work to adopt. A gate got stricter, a file format
changed, a required section was added, an owner token was renamed.

**MINOR** — new capability, nothing breaks. A new SOP, a new optional gate, a new tool.

**PATCH** — wording, typos, clarifications. No behaviour change anywhere.

The test for MAJOR: mount the new version in an existing project and run its gates unchanged.
If anything goes red, it is MAJOR — regardless of how small the change looked.

## Releasing

1. Pull request into the studio's default branch, with the cause marked `★`.
2. Append to `CHANGELOG.md`. Every entry carries a cause: a date, a task, an incident link.
3. Tag the release.
4. Projects open their own pull requests to raise `.studio-version` when they choose to.

**Projects upgrade; the framework is never pushed onto them.** A project mid-milestone that
is forced to absorb a framework change gets two unrelated failures at once and cannot tell
which is which.

## How far behind a project may fall

| Version type | Limit |
|---|---|
| PATCH | Whenever convenient |
| MINOR | Before the next milestone |
| MAJOR | At most two milestones behind |

Past that, the project is effectively on its own fork and stops contributing to — or
benefiting from — anything the studio learns.

## Emergency fixes

If a released gate is broken in a way that lets bad work merge, or blocks all good work: fix
it, release a PATCH the same day, and tell every project to upgrade immediately. Record it
as an incident afterwards. This is the one case where a framework change may precede its
write-up.

---

## What is allowed into the framework

**The default answer is no.**

The framework is not a place to put good ideas. Everything in it is read by every agent on
every project forever, and its cost is paid continuously while its benefit is occasional.

### The rule of two

Something is elevated when a **second real project** needs it. Not a project that might
exist. Not a project someone plans. A second repository with commits in it.

Why two rather than three: with weak agents, a capability that stays at the project layer
gets copied, and the copies begin diverging on day one. Waiting for a third project means
merging three variants that already disagree. Two is early enough that the merge is still
cheap and late enough that the need is real.

**Exception:** gates and process documents. Those *are* the framework, and they are elevated
on first use — that is what makes the studio a studio rather than a folder of tips.

### Six questions for a proposal

1. Which two projects need it? Name the repositories and the commits.
2. What did each of them do instead, before this?
3. What is the interface, and what is deliberately *not* in it?
4. What is the migration cost for the projects already running?
5. Who owns it once it is up here, and who reviews changes to it?
6. What would make us remove it again?

A proposal that cannot answer six has not been thought about long enough.

### What elevation costs

Once something is at the studio layer it gets semantic versioning, a documented interface,
migration notes on every breaking change, and no project-specific escape hatches. If that
sounds heavy, that is the point — it is the accurate price, and paying it at the project
layer where it belongs is usually cheaper.

### Demotion

Something used by one project and ignored by the rest goes back down. Deleting from the
framework is cheap and always allowed; the retrospective is the natural place to propose it.
