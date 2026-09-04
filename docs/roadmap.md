# Friends — roadmap

Related: [strategy.md](./strategy.md) · [product.md](./product.md) · [metrics.md](./metrics.md)

Strategy lock: **A = product. B = growth layer later.** Do not ship equal A+B modes.

## Status

| Phase | Name | Status |
|-------|------|--------|
| — | Strategy + metrics docs | **Done** |
| **1** | Sync A polish | **Done** |
| 1b | Session finale (Dalej / Kończymy) | **Next engineering** |
| 2 | Persistent identity | Planned |
| 3 | Shareable Friend Card | Planned (first visible B-lite) |
| 4 | Async reaction | Planned |
| 5 | Friend Quiz (B) | Planned — only behind B-signal |

---

## Phase 1b — Session finale

**Goal:** Consensus end-of-night instead of unilateral End / leaving the Activity.

**In scope:**

- Post-reveal intents: **Next round** vs **Wrap up**; all wrap → finale scoreboard
- Soft nudge from ~round 8; empty prompt bank → auto finale
- `sessionKey` so Play again refreshes the prompt bank without deleting history

**Out of scope:** IAP, timers, paid packs.

---

## Phase 1 — Sync A polish (**shipped**)

**Goal:** Best possible live Discord party loop. No async game UI.

**Shipped:**

- Stronger reveal climax (winner + context line; tallies + avatars)
- Host **Invite** via Discord Embedded App SDK (`openInviteDialog`)
- Host **End session** → scoreboard; **Play again** → lobby + score reset, round/vote history kept
- Larger hand-authored `most_likely` bank (~45 unique × en/pl); `--force` seed locally only
- Data foundation: `Vote.target` → `User` + index
- Lobby copy: sweet spot 3–8 players

**Out of scope for Phase 1:** Agree/Why reactions, Friend Card UI, async quiz, AI prompts, category packs, monetization.

**Exit / go to Phase 2 when:**

- Real groups complete multi-round sessions (see [metrics.md](./metrics.md) — rounds/session)
- Invite path works in Discord for the host
- Prompt bank sustains a ~10–15 minute night without feeling empty

---

## Phase 2 — Persistent identity

**Goal:** Rafał is not only “joined this instance” — the product remembers him across sessions.

**In scope (sketch):**

- Aggregates: games played, votes received, recurring “titles” (e.g. most-voted prompts)
- Still **no** public Friend Card share page required

**Exit:** Identity stats are trustworthy enough to power a card in Phase 3.

---

## Phase 3 — Shareable Friend Card

**Goal:** First B-lite artifact — *how your friends see you* — generated from A, not a second game.

**In scope (sketch):**

- Post-session (or profile) card: e.g. “62% most likely to…”
- Share / invite affordance measurable as B-validation metric

**Exit:** Share rate is instrumented and non-trivial; qualitative demand for “send this to someone who wasn’t here.”

---

## Phase 4 — Async reaction

**Goal:** Absent friends react to one prompt/result without a full quiz product.

**Example:** “Your friends think Rafał is most likely to become famous. Who do you pick?” → soft CTA to create own presence / card.

**Surface:** Prefer shareable web later; Activity alone is weak for “come back tomorrow alone.”

**Exit:** External clicks/completions exist; funnel into Discord A is visible.

---

## Phase 5 — Friend Quiz (B)

**Goal:** Full “How well do you know X?” as **acquisition**, not a peer mode inside the Activity lobby.

**Unlock condition (B-signal):** roughly **≥20–30%** of completed sessions produce invite/share outside the players already in the room — or clear manual demand (people copying results / asking for absent friends). See [metrics.md](./metrics.md).

**Surface:** Web-friendly share (`friends.gg/…` style) → Discord remains home for sync A.

**Do not start Phase 5** because async is fashionable. Start it because A already creates shareable social proof.

---

## Sequence reminder

```text
ONLY A (Phase 1)
  → memory (Phase 2)
  → Friend Card share (Phase 3)
  → light async reaction (Phase 4)
  → Friend Quiz if signal (Phase 5)
  → new people → back to Discord A
```

## Explicitly deferred ideas

| Idea | When (if ever) |
|------|----------------|
| Agree / Why after reveal | After Phase 1 ships and sessions feel thin post-reveal |
| Jackbox-style audience | After core 3–8 loop is sticky |
| Category packs / spicy lobby | After one mechanic proves retention |
| AI prompt generation | After 100–200 great human prompts prove session length |
| Guild / user subscriptions | After PMF; sell identity/history/status, not question packs |
