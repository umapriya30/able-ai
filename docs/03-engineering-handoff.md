# 03 · Design → Build Handoff
**From:** Anton (Product & Design) · **To:** Priya (Builder & Tech) · **Date due: Aug 23 — delivered**

Everything you need is in this repo. Nothing is in Figma, so nothing can go stale or be locked behind an account on demo day.

---

## 1. What you are receiving

| File | What it is | How to use it |
|---|---|---|
| `prototype/index.html` | Working high-fidelity prototype: all 6 screens, real state, live recalculation, animations, light + dark | **Lift from it directly.** Class names, tokens and markup are production-intent, not a mockup |
| `data/dummy-bank-payload.json` | The universal API payload | Your logic engine's only input. Same shape for every partner bank |
| `docs/02-design-system.md` | Tokens, motion spec, component list | Reference when you build anything not already in the prototype |

The prototype already contains a **reference implementation of the timeline engine** (`engine()` in the script block). It is intentionally small — about 15 lines. It is *not* the deliverable version. Yours should own the same maths, but with the payload loaded from the JSON file rather than inlined, plus whatever the AI habit generation ends up being.

---

## 2. The contract — the only thing we must not diverge on

```
INPUT   data/dummy-bank-payload.json
OUTPUT  { weekly, remaining, weeks, baseWeeks, idealWeeks, saved, pct, onTrack }
```

| Field | Meaning | UI that depends on it |
|---|---|---|
| `weekly` | Total £ going to the goal each week: baseline + ticked habits + lever | Lever readout |
| `remaining` | `target − saved` | "£2,360 still to save" |
| `weeks` | `ceil(remaining / weekly)` — **the number the whole product exists to show** | Timeline hero, goal card, habits strip |
| `baseWeeks` | Same, but at the baseline rate only | "68 → 38 weeks" |
| `idealWeeks` | `round(idealMonths × 4.345)` | The "Your date" tick on the rail |
| `saved` | `baseWeeks − weeks` when positive | Every green momentum message |
| `onTrack` | `weeks ≤ idealWeeks` | Green vs amber state |

Maths, exactly:
```
baselineWeekly = monthlyAverageSaved / 4.345
habitWeekly    = Σ weekly of ticked habits
weekly         = baselineWeekly + habitWeekly + lever
weeks          = ceil(max(0, target − saved) / weekly)
```
`4.345` (not 4) matters — at 4 the numbers drift enough that a judge doing mental arithmetic catches it.

`target` is **not** read straight from the payload any more. The goal sheet (screen 03) is live: the name field and the amount field write to session state, and every downstream figure recalculates from that — so `target` means "the payload value, unless the user has edited it this session". Same for `idealMonths`, which the timeframe chips already drove. The payload is still the source of truth for everything the user has *not* touched. Two rules that go with it:

- Never write a value back into an input the user currently has focus in — it fights their cursor mid-keystroke.
- Anything that resets the model (Reset demo, persona switch) must blur those fields first, or they keep displaying what was last typed while the model has moved on.

**If you need a field that isn't in the payload, ask me and I'll add it to the contract.** Do not add it locally — the deck screenshots, the prototype and your build all read the same file, and Wednesday's integration only works if that stays true.

---

## 2.1 Payload v1.1 — what Temi's prototype spec added

`schemaVersion` is now `1.1`. Four changes, all additive except the bank roster:

| Change | Where | Why |
|---|---|---|
| Banks are **NatWest, ClearBank, Allica Bank** | `banks[]` | The three the pitch names. The five invented banks are gone; every profile's `bankId` was remapped, no other figure moved |
| `linkedBankIds: string[]` | every profile | Settings → "Add new account" connects a second bank. `bankId` (the bank that routed them to us, and the funder named on the rewards screen) never changes |
| `kind: "reductive" \| "productive"` | every `habitLibrary` entry | The Action Center has two halves: spend less in a category they already spend in, or move money that is already theirs. The engine treats both identically — it is £/week either way — so `kind` only drives grouping and copy |
| One reward rate: `pointsPerGBP: 100` | `rewardRules` | 100 points = £1.00 cash, at every tier (100/£1, 500/£5, 1200/£12). A judge doing mental arithmetic on any tier gets the same answer. Still cash to savings, still funded by `partner_education_budget`, never a voucher |

Two fields live on the API but deliberately **not** in the payload file, because they only exist once a user has touched something: `Goal.targetDate` (set when the timeframe was picked on the calendar instead of the months slider) and `Profile.preferences.notificationsEnabled`.

`targetDate` is display-only. It is converted to `idealTimeframeMonths` at write time (`logic.months_from_target_date`, days ÷ 30.415 — the same 4.345 constant expressed in days) and **every downstream figure still reads months**. Two sources of truth for one deadline is how they drift apart. A date already in the past floors at 0.25 months rather than going negative.

### Endpoints the prototype spec needs

| Endpoint | Screen |
|---|---|
| `GET /profiles/{id}/spend-summary?days=30` | Dashboard donut. Returns **£ spent and £ saved**, not just percentages — the two segments always sum to 100 |
| `POST /profiles/{id}/goals` | Create New Goal. Send **exactly one** of `idealTimeframeMonths` or `targetDate`; sending both or neither is a 422 |
| `PATCH /profiles/{id}` | Settings. `displayName` writes to the live profile so the dashboard greeting changes with it; `notificationsEnabled` is the toggle |
| `POST /profiles/{id}/banks/link` | Settings → Add new account. Picks a partner bank not yet linked; 409 when all three are |
| `GET /profiles/{id}/habits` | Action Center. Reductive rows first, then productive, each carrying the `explanation` its dropdown shows |

`explanation` is the "where did the AI find this money" dropdown, computed from that profile's own spending: *"You currently spend £72/month on coffee & snacks. This frees up £46/month — £10.50 a week toward the goal."* It is arithmetic on their figures, never advice — see rule 5 below, which the productive habits make easy to break and `tests/test_logic.py` now asserts against.

---

## 3. Behaviour rules the engine must enforce

1. **Goal reward:** +100 points on completion, hard-capped at **one goal reward per calendar month**, keyed on `lastGoalRewardAt`. When capped, still show the celebration, award 0, and say why (copy is in the prototype). Judges will ask how we stop farming — the answer needs to be visible, not verbal.
2. **Habit points** are uncapped but small (10–20). The cap belongs on money, not encouragement.
3. **`weekly ≤ 0`** must never render "∞". Show the zero-leftover state from `docs/01-user-journey.md §7.1`.
4. **Never round weeks down.** Always `ceil`. Beating your own estimate is a good surprise; missing it is a broken promise.
5. **No advice strings.** "At this rate", "if you added" — never "you should", never a product or rate. This is why the productive habits say *"Sweep what's left the day before payday"* and not the Lifetime-ISA-and-25%-bonus wording in Temi's spec: naming a regulated product and its rate on stage is the one line docs/05 §3 says loses the room. Same behaviour, safe copy. If Temi wants the product named, that is his call to make explicitly, not ours to slip in.

---

## 4. Component classes — keep these names

`.btn` `.btn-ghost` `.chip` `.chip-mo` `.chip-sel` `.chip-lime` `.chip-slip` `.card` `.goalcard` `.progress` (`.is-faster` `.is-slip`) `.trail` (`.track` `.sweep` `.ideal` `.marker` `.lbl` `.lbl.stack` `.is-dragging`) `.habit` (`.box` `.habit-label` `.habit-meta`) `.streak` `.dot` `.pointspill` `.floater` `.rewardbar` (`i` per tier) `.tier` `.tabs` `.celebrate` `.screen` `.num-lead`

The rail labels are positioned in JS, not CSS — `layoutRailLabels()` centres the end label on the marker and drops "Your date" to a second row when the two would collide. Keep that behaviour; pinning the end label to the track edge is what made the marker miss its own label by 10px.

All colour comes from CSS custom properties (`--ink`, `--momentum`, `--lime`, `--slip`, …). **Never hard-code a hex in a component.** That is what makes dark mode work for free, and dark mode is what makes the demo survive whatever the projector does to the colours.

---

## 5. Motion — the three that carry meaning

| Moment | Rule |
|---|---|
| Habit tick | Row fills, checkbox stroke draws. **Do not rebuild the list's HTML on tick** — replacing the node cancels the animation. Toggle `data-done` on the existing element instead (the prototype does this; it was the one real bug I hit) |
| Timeline change | Number rolls, marker slides, green sweep fires **only when weeks decrease** |
| Goal complete | Lime bloom + canvas shards, 1.4s |

Everything else can be a plain transition. All of it collapses under `prefers-reduced-motion`, and **no information is animation-only**.

---

## 6. Build order I'd suggest (your call)

1. Load the JSON, render the dashboard from it — no hard-coded numbers anywhere.
2. Engine + timeline screen. This is the demo; everything else is context.
3. Habit tick → points → recalculation loop.
4. Reward cap logic.
5. Celebration.

If time runs out, cut in reverse order. Screens 1–3 alone still make a complete pitch.

---

## 7. Acceptance checklist (I'll run this before Thursday's rehearsal)

- [ ] Every visible number traces back to `dummy-bank-payload.json`
- [ ] Persona switch changes all numbers, no reload
- [ ] Lever recalculates within one frame of the drag
- [ ] Ticking three habits visibly drops the week count on the habits screen
- [ ] Goal reward capped on second attempt in the same month, with the reason on screen
- [ ] Works with the laptop in flight mode
- [ ] Works at 1280×800 projected, and in dark mode
- [ ] Full keyboard path: tab to every control, visible focus, arrow keys move through the run of show
