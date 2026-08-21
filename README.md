# sunset-studio

The framework a game team runs on. Not a game.

Games are output. A team that can build them repeatedly is the asset, and it only stays an
asset if it lives somewhere separate from any one game.

```
sunset-studio    how we work, what counts as done, the tools that enforce it
    │
    │  pinned by .studio-version, mirrored read-only into docs/_studio/
    ▼
<a game repo>    what this game is, and how far along it is
```

One question decides where anything belongs: **would a team building a completely different
game still need this?**

---

## What is here

| | |
|---|---|
| `docs/00-charter/` | The constitution, the studio charter, the process glossary |
| `docs/01-framework/` | How a day runs; what is scheduled |
| `docs/02-roles/` | One file per role — each file is also that bot's description |
| `docs/03-gates/` | What counts as passing, and the ownership table format |
| `docs/04-grokbot/` | Team setup, routines, and six SOPs |
| `docs/05-studio/` | Metrics, maturity roadmap, capability ledger, versioning |
| `playbooks/` | Starting a new project |
| `templates/` | Board files a project starts from |
| `tools/` | The gates, the board derivation, mounting, locking |

## Where to start

- **A new agent:** [`AGENTS.md`](AGENTS.md), then your own role card, then
  [`/sop-task`](docs/04-grokbot/skills/sop-task.md). Nothing else is required reading.
- **Setting up a team:** [`docs/04-grokbot/setup.md`](docs/04-grokbot/setup.md).
- **Starting a game:** [`playbooks/new-project.md`](playbooks/new-project.md).
- **Wondering why a rule exists:** [`CHANGELOG.md`](CHANGELOG.md). Every entry names the
  failure that caused it.

## Principles, stated plainly

**A rule no gate enforces is not a rule.** It is a wish, and it is charged to every task
that has to read past it. Either write the check or delete the rule.

**Nothing is added without an incident.** Every framework change names a real failure with a
date. Otherwise the process grows forever, and each addition is permanent.

**Deleting beats adding.** The natural drift of any process is toward more.

**Facts have one home.** Task state lives in git; what a task is lives in its card. A second
copy of anything is a second answer, and it will be the stale one.

## Using it

```bash
node tools/mount.mjs --version v2.0.0     # in a project repo
```

Creates `.studio-version` and `docs/_studio/`. See
[`docs/05-studio/versioning.md`](docs/05-studio/versioning.md) for upgrading, and for what
is allowed into the framework in the first place — the default answer is no.
