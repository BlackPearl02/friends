# Security checklists

## Endpoint card

- [ ] METHOD / PATH
- [ ] Public or authenticated?
- [ ] Resource + owner / room membership
- [ ] Input validation
- [ ] Output filtering (no tokens; votes hidden until reveal)
- [ ] Rate limit
- [ ] Race (double vote, double join)
- [ ] Logging safe?

## IDOR / BOLA

For every `:roomId|:roundId|:userId|:instanceId`:

- [ ] User A → another instance’s room?
- [ ] Vote as another voter?
- [ ] Read answers before reveal?

## Discord

- [ ] Exchange uses server secret; code one-time
- [ ] Identity from `/users/@me`, not client body
- [ ] No token in logs
