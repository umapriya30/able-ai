# 02 · Design System & Visual Feedback Spec
**Owner:** Anton · **Consumers:** Priya (implementation), Nikita (deck styling)

The prototype in `prototype/index.html` is the executable version of this document. Where the two disagree, the prototype wins — it has been tested at projector size.

---

## 1. Design position

Slick like a neobank, but deliberately **not** a neobank clone. Two rules drive every choice:

1. **Time is the material.** Money apps design around amounts; Able AI designs around *distance*. So the recurring visual device is a horizontal rail with a marker on it — not a pie, not a card grid. The rail appears on the goal card, the timeline screen and the rewards bar. Same object, three scales.
2. **Never shame the user.** Irvin's premise is that young people avoid banking apps because those apps only show what they don't have. So: no red for being behind, no downward arrows, no "you overspent". Behind = amber and a route forward. The only saturated colour in the product is reserved for *progress*.

---

## 2. Colour

Named, then tokenised. Six values do the whole product.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink` | `#0C2321` | `#E9F1ED` | Text, rails, the phone chrome. Deep teal-black, not neutral black — it sits under the green without going muddy |
| `--ground` | `#EEF2ED` | `#08110F` | Page ground. Neutral biased 4° toward the accent so it reads chosen, not default grey |
| `--card` | `#FFFFFF` | `#12211E` | Surfaces |
| `--momentum` | `#0E9F6E` | `#2FBF8B` | **State colour.** Timeline shortened, habit ticked, on track. Never used decoratively |
| `--lime` | `#C8F135` | `#C8F135` | **Reward colour.** Points, tiers, celebration. Always as a fill with `--ink` text on top — never as text on white |
| `--slip` | `#B4721A` | `#D99A3D` | Behind schedule, capped reward, gentle warnings. Replaces red entirely |
| `--muted` | `#5C706B` | `#8FA39D` | Secondary text, rail track, tick marks |

Three derived tokens exist because a fill colour and a text colour are different jobs. `--momentum` and `--slip` are **fill** values; at text sizes on their own tints they fail contrast, so text uses the darker pair:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--momentum-ink` | `#0A7250` | `#2FBF8B` | Green **text** on `--momentum-soft`. 5.04:1 on the tint, 5.55:1 on a ticked habit row |
| `--slip-ink` | `#8A5610` | `#D99A3D` | Amber **text** on `--slip-soft`. 5.17:1 |
| `--slip-on-ink` | `#D99A3D` | `#D99A3D` | Amber on the always-dark celebration overlay, which does not follow the theme |

Momentum green and reward lime are **different jobs and must never be swapped**: green = "your future moved closer", lime = "you earned something". A judge should be able to tell, without reading, whether a flash of colour meant progress or points.

Contrast: all text pairs measured in the running prototype at ≥ 4.5:1 in both themes — lowest pair is 5.04:1 (light), 5.84:1 (dark). Lime never carries text weight on light ground (fails) — it only ever appears as a filled chip.

**Green is earned.** `--momentum` appears only where `weeksRemaining` actually dropped: the rail sweep, the ticked-checkbox fill, the goal bar in its `.is-faster` state, the rail marker's on-track state. Everything that used to be green because it was merely *selected* or *complete* — consent ticks, the donut, streak dots, the active tab, timeframe chips, the lever chip at `+£0` — is now `--ink`. Selected-but-neutral uses `.chip-sel` (ink fill, ground text).

---

## 3. Typography

| Role | Face | Why this one |
|---|---|---|
| Display / numbers | **Bricolage Grotesque** (variable, 700–800, tight tracking) | Variable width lets big numbers compress without shrinking; has enough character to not read as Inter-default, enough discipline to read as a bank |
| UI / body | **Hanken Grotesk** (400/500/600) | Warm humanist grotesque, high x-height — survives projector distance |
| Micro-labels / rail ticks | **DM Mono** (400, uppercase, +0.08em) | The measurement voice. Used only for eyebrows, timeline ticks and units — reinforces "instrument", not "brochure" |

Scale (1.25): `12 · 14 · 16 · 20 · 25 · 31 · 44 · 56`. Body 16/1.55. Running text capped at 65ch.
Every figure that can change uses `font-variant-numeric: tabular-nums` — a timeline that jitters while recalculating destroys the illusion of a real engine.

---

## 4. Layout & form

- Radii: `10px` controls, `18px` cards, `28px` phone frame, `999px` chips. One step per level, no `rounded-lg` everywhere.
- Spacing: 4-based — `4 8 12 16 24 32 48`. Layout with flex/grid `gap`, never per-element margins.
- Elevation: one shadow only (`0 1px 2px rgba(12,35,33,.06), 0 8px 24px -12px rgba(12,35,33,.18)`). Depth is for the phone frame, not for decorating cards.
- Touch targets: **44×44 minimum**, habit rows 56px tall. Jayden is using this on a cracked phone on a bus.
- The app canvas is a fixed **390×844** phone. Everything is designed at that width first; the presenter rail around it is desktop chrome, not product.

---

## 5. Visual feedback spec  *(the Aug 22 deliverable)*

The rule: **the interface reacts to good behaviour within 400ms, and the reaction is always about time, not praise.** No confetti for ticking a box; confetti is reserved for finishing a goal.

| Trigger | Reaction | Timing |
|---|---|---|
| Habit ticked | Row fills `--momentum` 8% → checkbox draws its tick (stroke-dashoffset) → row settles | 180ms fill, 220ms stroke |
| Points earned | `+10` chip lifts 20px and fades while counter rolls up digit by digit | 600ms, staggered 60ms after tick |
| Timeline shortens | Old number cross-fades out **upward**, new number in from below; rail marker slides left; green sweep travels the rail once, left→right | 320ms number, 480ms sweep |
| Timeline lengthens | Same motion, amber, **no sweep, no bounce.** Losing ground is stated, never dramatised | 320ms |
| Lever dragged | Number tracks the drag live at 60fps; rail marker follows; no easing while held | live |
| Lever released | Marker settles with a single soft overshoot (cubic-bezier(.22,1,.36,1)) | 420ms |
| Goal complete | Full-screen: lime radial bloom → `+100` counts up → 12 lime shards fall (canvas, not SVG) | 1.4s total |
| Tier reached | Reward bar fills to the tier mark, pulses once | 500ms |

**Momentum green is earned, not decorative.** It appears only when `weeksRemaining` drops. If the demo ever shows green without the number having moved, the effect is dead and the whole design premise dies with it.

`prefers-reduced-motion: reduce` → all of the above collapse to instant state changes plus a 120ms opacity fade. The tick, the number and the colour still change. **Nothing that carries information is animation-only** — required for accessibility and required because the venue projector may drop frames.

Announcements: timeline number and points counter sit in `aria-live="polite"` regions. Screen-reader users get "47 weeks, 14 weeks earlier" as text.

---

## 6. Component inventory

`Chip` · `PrimaryButton` (56px) · `GhostButton` · `StatPair` (£ + weeks) · `TimelineRail` (track, ideal marker, position marker, sweep) · `GoalCard` (progress bar, dual distance, momentum line) · `HabitRow` (checkbox, saving, points, locked state) · `PointsCounter` · `RewardBar` (tier marks) · `DonutSplit` (2 segments only) · `TabBar` (4 items) · `Sheet` (goal creation) · `CelebrationOverlay`.

**Icons** are a computed set, not a font: `ICONS` in the prototype emits 24px SVG on `currentColor` at 1.5px stroke (`polar`, `arcPath` and `starPoints` generate anything curved, so no path data is guessed). Tab icons, habit category icons and the brandmark all come from it. The brandmark is the thesis in 18px: a rail, and a marker that has moved.

The **TimelineRail** carries a computed scale - a notch a month, a longer notch a quarter, spacing derived from the horizon - so the rail reads as a measure of time rather than a progress bar.

Each exists in `prototype/index.html` with the class names Priya should keep. Copy the classes, don't rename them — that's how we stay in sync during Wednesday integration.

State classes added since the first pass: `.chip-sel` (neutral selected chip), `.num-lead` (the 44px figure in a `StatPair` — on the dashboard this is *weeks*, not money), `.progress.is-faster` / `.progress.is-slip` (goal bar takes its colour from schedule state, never green at rest), `.trail.is-dragging` (kills marker easing while the lever is held). `RewardBar` now spans the whole tier journey `0…1200` and carries a `<i>` mark per tier, so it reads as the same rail object as the timeline.
