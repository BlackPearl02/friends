---
name: friends-game-design
description: >-
  Friends party-game design — viral most_likely loop, reveal, scoring.
  Use when adding prompts, rounds, lobby flow, or changing how votes work.
---

# Friends game design

## Read first

1. [docs/strategy.md](../../../docs/strategy.md) — A-core / B-growth-later
2. [docs/product.md](../../../docs/product.md)
3. [docs/roadmap.md](../../../docs/roadmap.md) — what phase we are in
4. [friends-game.mdc](../../rules/friends-game.mdc)

## Loop (MVP = A)

1. Players open the Activity → same `instanceId` room
2. Everyone marks **Ready** / `continue` (≥2) → auto start
3. API serves an unused **`most_likely`** prompt for the **current session**
4. Players vote (votes hidden); UI shows who voted
5. All voted → auto **reveal** (scores applied server-side; clients see no tallies)
6. **Next** (`continue`) → next round; **Wrap up** → finale scoreboard when all agree (≥1 reveal)
7. Empty prompt bank → finale; **Play again** → new `sessionKey`, scores reset, history kept

## Constraints

- Original prompts only (en+pl rows)
- Party-roast tone — not harassment or PII fishing
- No pack picker in MVP; category fields are legacy / unused in selection
- No second async game mode in the Activity until roadmap Phase 5 unlock
- Reveal is a server state, not a client toggle
- Prefer keeping vote/round history for future Friend Profile (do not casually wipe)

When adding a kind back into the loop: schema enum (if any) + API selection + Activity UI + seed prompts + tests — and confirm it does not violate A-only strategy.
