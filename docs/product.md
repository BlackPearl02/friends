# Friends — product (Kumple → Discord Activity)

**Friends** is a Discord Activity party game. The mobile reference is **Kumple** (`com.kumple`, Buddies Games Inc.): questions, challenges, and “who knows you best” voting among friends.

This is **not** a clone of Kumple’s catalog, UI, or brand. It is the same *job*: a fast party night in a group, using Discord identity instead of a join code.

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
| Host creates lobby | First authenticated participant is host; others auto-join the same `instanceId` |
| Category packs | Same four packs: `party`, `family`, `colleagues`, `spicy` |
| Scoreboard | Per-room `RoomPlayer.score` |

## Round types (v1)

| Kind | Player action | Scoring (default) |
|------|----------------|-------------------|
| `most_likely` | Vote for one other player | +1 to the voted player |
| `this_or_that` | Pick A or B | No points (icebreaker) |
| `truth` | Optional short answer or skip | +1 if answered |
| `challenge` | Complete or skip | +1 if completed |

Host starts the match after picking a category. The API picks unused prompts for that category + locale (`en` / `pl`).

## Out of scope (until asked)

- Kumple’s proprietary question bank or assets
- Paid subscription / IAP clone
- Standalone mobile app
- Discord bot slash commands (Activity-only MVP)
- PlayGrid library / sessions / store OAuth

## Tone

Party host, not SaaS. Short prompts, readable on a TV / Discord overlay. User-facing copy ships in **en + pl**.
