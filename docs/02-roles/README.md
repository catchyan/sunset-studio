# Roles

One file per role. **That file is the bot's description** — copy it in verbatim, replacing
the `{{...}}` placeholders with the values from the project's staffing document.

There is deliberately no second document describing what these roles do. The previous
version had one, and within a week the two disagreed about which file the ownership table
lived in; every agent then followed whichever copy it happened to read.

| Code | Role | Owns, in one line | Typically active from |
|---|---|---|---|
| [P0](P0.md) | Steward | The board, dispatch, the human channel | M0 |
| [A1](A1.md) | Architect | Contracts, ADRs, the ownership table | M0 |
| [Q1](Q1.md) | Gatekeeper | Gates, sampling, escape reports | M0 |
| [S1](S1.md) | Scribe | Glossary, drift detection, minutes | M0 |
| [O1](O1.md) | Operator | Environment, CI, the shared machine | M0 |
| [D1](D1.md) | Design Director | Feel as frame data, tuning | M1 |
| [E1](E1.md) | Simulation Engineer | The deterministic core | M1 |
| [E2](E2.md) | Client Engineer | Input, prediction, frame budget | M1 |
| [V1](V1.md) | Visual Director | Render pipeline, art rules and linting | M2 |
| [E3](E3.md) | Server Engineer | Authority, protocol, audit log | M3 |
| [U1](U1.md) | Sound Designer | Audio events and mix | M3 |
| [C1](C1.md) | Economist | Economy, simulation, balance data | M4 |
| [N1](N1.md) | Chronicler | Narrative, world facts, localisation | M4 |

Which roles a given project actually staffs, and when, is the project's decision — see its
`docs/03-process/staffing.md`. A role with no active bot has no lane, and its paths belong to
nobody until it does.

---

## Deciding who wins

| Conflict | Decided by | Losing side's recourse |
|---|---|---|
| Feel versus performance | D1 states the target, E2 states the measurement, A1 rules | ADR |
| Feel versus economy | P0, with both numbers on the table | ADR |
| Art versus frame budget | A1, after V1 and E2 both measure | ADR |
| Contract disagreement | A1, unilaterally | ADR within 24h |
| Is this done? | Q1, unilaterally | The human |
| What comes first? | P0, unilaterally | The human |
| Is this good? | The human, unilaterally | None |

Every ruling is written down before work resumes. A ruling reached in chat and never
recorded will be re-litigated within the fortnight, by agents who genuinely do not remember
it happened.

---

## Adding a role

Only when a lane is genuinely contended — two agents blocked on each other's paths for a
week. Not because a category of work exists and looks unowned.

A new role costs a lane, a description, a place in the escalation table, and a share of
everyone's attention, permanently. Prefer widening an existing role until it visibly breaks.
