# Drift

Documents that have started disagreeing. Owned by S1, written daily at 14:00.

**Nothing is written on a clean day.** A report that says "all consistent" every day trains
everyone to skip it, and they will still be skipping it on the day it says otherwise.

Three kinds:

1. **Number drift** — the same quantity stated differently in two places.
2. **Term drift** — one concept under two names, or one name over two concepts.
3. **Reality drift** — a document describing behaviour the code no longer has.

---

## D-<date>-<n> · <one line>

- Found: <ISO date>
- Kind: number | term | reality
- Side A: `path/to/file.md` line N — "<exact quote>"
- Side B: `path/to/other.md` line N — "<exact quote>"
- Owner of the specification: @<code>
- Status: OPEN

<!--
Quote both sides exactly. Paraphrasing a contradiction usually resolves it accidentally,
and then the owner is deciding between two things you wrote rather than two things the
documents say.

Do not choose a winner. You find it and name both sides; the specification's owner decides.
A scribe who quietly picks turns a visible conflict into an invisible one, and the losing
document stays in the repository being read by somebody.

Unresolved after 48 hours: escalate to P0. Two contradicting FROZEN specifications are an
andon pull, immediately — code is already being written against one of them.
-->
