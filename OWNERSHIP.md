# Path ownership · studio repository

> Owner: A1, countersigned by P0. The only input to the lane gate.
> The **format** is defined in `docs/03-gates/ownership-schema.md`; this is the **content**.

| Path glob | Owner | Note |
|---|---|---|
| `docs/00-charter/constitution.md` | **HUMAN** | |
| `docs/00-charter/studio-charter.md` | **HUMAN** | |
| `docs/00-charter/glossary.md` | S1 | Process vocabulary only |
| `docs/01-framework/**` | P0 | |
| `docs/02-roles/**` | P0 | Each file is also a bot description |
| `docs/03-gates/**` | Q1 | Format changes need A1 to countersign |
| `docs/04-grokbot/setup.md` | O1 | |
| `docs/04-grokbot/routines.md` | P0 | |
| `docs/04-grokbot/skills/**` | P0 | SOP changes need Q1 review and the human's approval |
| `docs/05-studio/metrics.md` | Q1 | Definition changes need P0 to countersign |
| `docs/05-studio/capability-ledger.md` | A1 | P0 fills the process rows |
| `docs/05-studio/studio-roadmap.md` | P0 | Release needs the human's approval |
| `docs/05-studio/versioning.md` | P0 | |
| `playbooks/**` | P0 | |
| `templates/**` | P0 | |
| `tools/gates/**` | Q1 | Changing a gate means changing its test in the same PR |
| `tools/board/**` | P0 | |
| `tools/lock.mjs` | O1 | |
| `tools/mount.mjs` | O1 | |
| `AGENTS.md` | P0 | |
| `README.md` | P0 | |
| `OWNERSHIP.md` | A1 | Needs P0 to countersign |
| `CHANGELOG.md` | ANYONE | Append your own entry, each with a `★` cause. P0 organises at release. |
| `.github/workflows/**` | Q1 | A1 may countersign |
| `.gitignore` | O1 | |

---

## Why the changelog is shared

Every pull request that changes a gate or an SOP must record the change with its cause.

When one role owned this file, each fix needed either an override or a second pull request.
Both are tedious, and **tedious rules are not obeyed, they are quietly abandoned.** The real
outcome would not have been diligent override requests; it would have been an empty
changelog, and then no record of why the framework looks the way it does.

Append-shared, like the andon file. Add your entry; never rewrite anyone else's.

## Why the studio repository has lanes at all

Five agents touch this repository. It looks like more ceremony than it needs.

But a change here reaches every project, so the discipline should be tighter than a
project's, not looser. One unowned change to an SOP propagates everywhere at once.

And the other reason: **we have no standing to ask projects to follow a rule we exempt
ourselves from.** A framework whose own repository is edited freely has taught everyone
exactly what its rules are worth.
