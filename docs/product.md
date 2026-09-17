# Squimbo — product

**Pitch:** You're already together. Find out who knows the group best.

**Squimbo** is a Discord Activity party game: “who is most likely” rounds among people already in a Discord channel. Discord identity and the Activity instance are the room.

**Strategy (canonical):** [strategy.md](./strategy.md) · [roadmap.md](./roadmap.md) · [metrics.md](./metrics.md)

- **A (MVP)** = sync party in the channel — the product.
- **B** = future growth / share layer that feeds people back into A — **not** a second in-Activity game mode yet.

## What Squimbo does on Discord

| Aspect | Behavior |
|--------|----------|
| Room | Discord Activity instance — everyone who opens the Activity in the channel is in |
| Players | Discord display names + avatars from Embedded App SDK |
| Surface | Discord iframe (desktop + mobile Discord) |
| Host | First joiner is stored as technical `hostUserId` only — **no in-game privileges** |
| Categories | **Not in MVP** — one shared prompt bank, no pack picker |
| Scoreboard | Per-room `RoomPlayer.score` |

## Viral loop (MVP = A)

Designed around one shared beat: **vote in the dark → dramatic reveal**. Sweet spot **3–8** players. No host privileges — everyone shares the same controls. Soft target **~8–12 rounds** per night.

1. Lobby: player list + **Ready** (intent `continue`). When everyone is ready and ≥2 players → start (no category).
2. API serves an unused English `most_likely` prompt for the current session. Prompt bank is **EN-only in MVP**; Activity UI chrome stays en+pl.
3. Everyone votes for another player; votes stay hidden while `voting`. UI shows who has voted.
4. When **all** players have voted → **reveal**: question stays up, show who got the most votes (tallies + avatars). Running session scores stay hidden until the finale.
5. Clear winner → **Next round** or **Wrap up** (consensus). Tie → show tied players; **Vote again** or **Keep going** (consensus). Revote voids that ballot (kept in history) and reopens the same prompt. Keep going / Next applies scores then continues. All Wrap up (after ≥1 reveal) → **finale scoreboard**. From ~round 8 the UI nudges wrap-up. Empty prompt bank also finishes the night.
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
- Third-party proprietary question banks, assets, or brands
- Paid IAP / question packs in the lobby (see monetization thesis in [strategy.md](./strategy.md))
- Standalone mobile app as MVP
- Discord bot / chat slash surface (`/play`, moderation, economy) — Activity Entry Point + launcher only
- AI prompt generation before a strong human bank proves session length
- PlayGrid library / sessions / store OAuth

## Tone

Party host, not SaaS. Short prompts, readable on a TV / Discord overlay. Roast-friendly but not harassment or PII fishing. User-facing copy ships in **en + pl**.

## Brand vs engineering

- **Product / Discord name:** Squimbo · marketing site: [squimbo.app](https://squimbo.app)
- **Monorepo packages:** still `@friends/*` until a later rename
