# Friends — product (Kumple → Discord Activity)

**Pitch:** You're already together. Find out who knows the group best.

**Friends** is a Discord Activity party game. The mobile reference is **Kumple** (`com.kumple`, Buddies Games Inc.): questions and “who knows you best” energy among friends.

This is **not** a clone of Kumple’s catalog, UI, or brand. Same *job*: a fast party night in a group, using Discord identity instead of a join code.

**Strategy (canonical):** [strategy.md](./strategy.md) · [roadmap.md](./roadmap.md) · [metrics.md](./metrics.md)

- **A (MVP)** = sync party in the channel — the product.
- **B** = future growth / share layer that feeds people back into A — **not** a second in-Activity game mode yet.

## What Kumple does (reference)

- One player creates a room; others join with a code (same room or remote).
- Categories for the situation: **Family**, **Party**, **Colleagues**, **Spicy** (and similar packs).
- Rounds mix: truths / questions, challenges / dares, “who is most likely to…”, this-or-that.
- Points for completed challenges and received votes; reveal / roast energy.
- Custom questions; many languages; optional drinking-game framing.

## What Friends does on Discord

| Kumple | Friends |
|--------|---------|
| Join code | Discord Activity instance — everyone who opens the Activity in the channel is in |
| Typed player names | Discord display names + avatars from Embedded App SDK |
| Phone as controller | Discord iframe (desktop + mobile Discord) |
| Host creates lobby | First joiner is stored as technical `hostUserId` only — **no in-game privileges** |
| Category packs | **Not in MVP** — one shared prompt bank, no pack picker |
| Scoreboard | Per-room `RoomPlayer.score` |

## Viral loop (MVP = A)

Designed around one shared beat: **vote in the dark → dramatic reveal**. Sweet spot **3–8** players. No host privileges — everyone shares the same controls. Soft target **~8–12 rounds** per night.

1. Lobby: player list + **Ready** (intent `continue`). When everyone is ready and ≥2 players → start (no category).
2. API serves an unused `most_likely` prompt for the **current session** locale (`en` / `pl`).
3. Everyone votes for another player; votes stay hidden while `voting`. UI shows who has voted.
4. When **all** players have voted → auto advance to post-vote consensus (votes stay sealed; no mid-session tallies or running scores).
5. After each round: **Next round** or **Wrap up** (consensus). All Next → another unused prompt. All Wrap up (after ≥1 reveal) → **finale scoreboard** (only place scores appear). From ~round 8 the UI nudges wrap-up. Empty prompt bank also finishes the night.
6. Finale → any player **Play again** (new `sessionKey`, scores reset; round/vote history kept for future profiles).

| Kind | In MVP? | Player action | Scoring |
|------|---------|---------------|---------|
| `most_likely` | **Yes — only** | Vote for one other player | +1 to the voted player |
| `this_or_that` | Schema only | Pick A or B | No points |
| `truth` | Schema only | Optional short answer or skip | +1 if answered |
| `challenge` | Schema only | Complete or skip | +1 if completed |

Category packs (`party` / `family` / `colleagues` / `spicy`) may return later per [roadmap.md](./roadmap.md); they are not part of the start flow or prompt filter today.

North-star thinking: **groups completing sessions**, not solo DAU — see [metrics.md](./metrics.md).

## Out of scope (until roadmap says otherwise)

- Second equal mode: async “make your quiz” / Friend Quiz inside the Activity lobby
- Kumple’s proprietary question bank or assets
- Paid IAP / question packs in the lobby (see monetization thesis in [strategy.md](./strategy.md))
- Standalone mobile app as MVP
- Discord bot slash commands (Activity-only MVP)
- AI prompt generation before a strong human bank proves session length
- PlayGrid library / sessions / store OAuth

## Tone

Party host, not SaaS. Short prompts, readable on a TV / Discord overlay. Roast-friendly but not harassment or PII fishing. User-facing copy ships in **en + pl**.
