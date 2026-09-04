# Friends — metrics

Related: [strategy.md](./strategy.md) · [roadmap.md](./roadmap.md) · [product.md](./product.md)

Friends is a **group** product. Optimize groups and sessions, not solo DAU vanity.

Instrumentation (PostHog, etc.) comes later. This doc defines **what** to measure once events exist.

## North star

**Weekly Active Groups completing ≥1 full game/session**

A “group” ≈ people who shared a Discord Activity `instanceId` / room and finished a meaningful play (see session definition below).

Not: weekly active users alone. Not: Activity opens that bounce in lobby.

## Session definition (working)

A **completed session** includes at least:

- Room moved past lobby into play, and
- At least one round reached **reveal**, then either **consensus wrap-up** to the finale scoreboard or **prompt bank exhausted** → finished

Tune the bar once analytics exist; do not count “opened Activity, left” as success.

## Metric hierarchy

| Layer | Metric | Why | Early target (directional) |
|-------|--------|-----|------------------------------|
| North star | Weekly Active Groups with ≥1 completed session | Product is multiplayer | Trend up week over week |
| Core | **Rounds per completed session** | Depth / “one and done” killer | Median **8–12** rounds (not 1–2) |
| Viral | Invites / shares **per session** | Cold start of the *group*, Discord-native | Rising; Invite used |
| Retention | % groups with another completed session within **7 days** | Habit of the squad | Any solid non-zero; improve over time |
| B-validation | % completed sessions that produce share/invite **outside** current players | Unlock Phase 5 Friend Quiz | **≥20–30%** before building full async B |

## What not to optimize early

- Raw “installs” / Discord app interest clicks without sessions
- Solo DAU / lone lobby opens
- Prompt count as a vanity metric (quality + rounds/session matter more)
- Monetization conversion before PMF

## Mapping to roadmap

| Signal | Action |
|--------|--------|
| Rounds/session stuck at ~1–2 | Fix Phase 1 reveal/tempo/prompts — not categories |
| Invite unused / groups stuck at 2 | Improve Invite UX + lobby copy (Phase 1) |
| Strong rounds + weak 7d return | Phase 2 identity + Phase 3 card (reason to come back) |
| B-validation ≥20–30% or loud demand | Green-light Phase 4–5 async growth |
| B-validation near zero | Do **not** build Friend Quiz; double down on A |

## Event sketch (for a later analytics cut)

Suggested names only — implement when instrumenting:

- `session_started` / `session_completed` / `session_replayed`
- `round_revealed` (with `round_index`)
- `invite_opened`
- `share_clicked` (when Friend Card exists)
- `group_returned_7d` (derived)

Never log JWT, Discord tokens, or OAuth codes in analytics payloads.
