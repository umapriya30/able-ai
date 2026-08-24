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

## 3. Behaviour rules the engine must enforce

1. **Goal reward:** +100 points on completion, hard-capped at **one goal reward per calendar month**, keyed on `lastGoalRewardAt`. When capped, still show the celebration, award 0, and say why (copy is in the prototype). Judges will ask how we stop farming — the answer needs to be visible, not verbal.
2. **Habit points** are uncapped but small (10–20). The cap belongs on money, not encouragement.
3. **`weekly ≤ 0`** must never render "∞". Show the zero-leftover state from `docs/01-user-journey.md §7.1`.
4. **Never round weeks down.** Always `ceil`. Beating your own estimate is a good surprise; missing it is a broken promise.
5. **No advice strings.** "At this rate", "if you added" — never "you should", never a product or rate.

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
