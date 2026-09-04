# Friends — strategy

Pitch: **You're already together. Find out who knows the group best.**

Related: [product.md](./product.md) · [roadmap.md](./roadmap.md) · [metrics.md](./metrics.md)

## Decision (locked)

| Layer | Role |
|-------|------|
| **A — Sync party** | The product. Discord Activity, 3–8 friends, `most_likely` → secret vote → reveal → next. |
| **B — Growth / return** | Not a second game mode. Future distribution layer that feeds people **back into A**. |

We do **not** ship A and B as equal modes. Premature “Play together / Make your quiz / Daily / Who knows me…” kills a clear reason to open the app.

**A uses a moment Discord already has:** friends on voice, someone says “let’s do something for 10 minutes.” Friends competes with *what do we do now*, not with every other game catalog.

**B answers a different job:** “We’re not all here, but I want to see who knows me.” That job is real (validated by apps like *How Well Do You Know Me?*), but it is a **growth engine**, not the Discord-native core.

## Target shape

```text
                         FRIENDS
                            │
              ┌─────────────┴─────────────┐
              │                           │
         LIVE / SYNC                 ASYNC / SHARE
              │                           │
      Discord Activity              Web (later)
              │                           │
       3–8 friends                quiz / reaction
              │                           │
              └─────────────┬─────────────┘
                            │
                     FRIEND PROFILE
                            │
                     SHARE / INVITE
                            │
                       NEW PEOPLE
                            │
                            ↓
                    BACK TO DISCORD (A)
```

B does not compete with A. **B delivers people to A.**

## A + B-lite (preferred) vs full A+B

| Approach | What it means | Verdict |
|----------|---------------|---------|
| Full A+B now | Two game modes in one Activity | Reject — focus death |
| **A + B-lite** | Ship only A; after reveal/session, invite/share hooks; data ready for profiles | **Adopt** |
| A only forever | Never use async | Too narrow long-term; keep B on the roadmap behind a signal |

Example B-lite (later phases, not MVP UI): after a reveal, “Send this question to friends who weren’t here” → one async tap → crumb of profile → eventually Friend Card → only then a full quiz if metrics say so.

## Market notes (short)

- **Discord Activities** — co-located multiplayer in the conversation (desktop + mobile). Social graph + invite is the distribution edge. Case studies like Death by AI show group sessions (often 3+ friends) can scale when the product fits “we’re already together.”
- **Jackbox** — short shared space, ~1–8 players, voting, optional audience. Benchmark for sync energy, not for building a second solo game inside the same pitch.
- **Kumple** — proves party “who knows you” on mobile; we take the *job*, not their bank/brand. Our bet: that job is *better* when native in Discord.
- **How Well Do You Know Me?** — proves async “quiz about me → friends guess” as its own category. Treat as evidence for **Phase 5 B**, not as MVP scope.

Hypothesis to prove: *this format wins when it is native in Discord* — not that humans like social quizzes (they already do).

## Silent architecture (now)

Even before B UI exists, product/data thinking should allow:

```text
User → game history → votes received → (derived) Friend Profile → shareable result
```

Do **not** invent a second game loop in the Activity. Do **not** throw away round/vote history that could become reputation later. Concrete schema work is scheduled in [roadmap.md](./roadmap.md) Phase 1–2 engineering cuts — not as an async product.

## Non-goals (until roadmap says otherwise)

- Second in-Activity mode: “make your quiz” / daily challenge / who-knows-me as equal peer to A
- Category packs as the main lobby choice (party / spicy / …)
- AI-generated prompt floods before a hand-tuned bank proves 10–15 minutes of fun
- Monetization screens, IAP packs of questions
- Native mobile app; Discord bot as primary surface
- Full web `friends.gg` quiz **before** share/invite signal from A

Monetization later (if ever): sell identity / history / customization / server status — not “€2.99 for 100 questions.”

### Monetization thesis (plan, not ship)

- **Paywall never sits on the core party loop** (lobby start / vote / reveal).
- Natural SKU moments: **session finale** (cosmetic frames, titles on the scoreboard) and later **Friend Profile / Card** skins.
- Guild / server status badges are fine; **category/question packs as IAP are not** the primary plan.
- Entitlements stay out of MVP code paths until PMF — schema already preserves session + vote history for that layer.

## What we optimize for first

Biggest risk is **one session and never again**, not “solo can’t play.”

Cold start of a group (“how do we get the first session?”) is solved with invite/share around **A**, not by turning Friends into Wordle.

See [metrics.md](./metrics.md) for north-star and B-unlock signal.
