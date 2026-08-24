# Able AI — working rules

Turning little habits into big benefits. Hackathon demo **28 Aug 2026**. Owner: Anton (Product & Design).
The prototype is a single offline file: `prototype/index.html`. No build, no server, no network — deliberately, so it cannot fail on stage.

---

## Design position — read this before touching any pixel

Slick like a neobank, but deliberately **not** a neobank clone.

1. **Time is the material.** Money apps design around amounts; Able AI designs around *distance*. The recurring visual device is a horizontal rail with a marker on it — not a pie, not a card grid. Same object at three scales: goal card, timeline screen, rewards bar.
2. **Never shame the user.** No red, no downward arrows, no "you overspent". Behind = amber and a route forward. The only saturated colour in the product is reserved for *progress*.

Full spec: `docs/02-design-system.md`. Where doc and prototype disagree, **the prototype wins** — it has been tested at projector size.

---

## Never

- Raw hex / rgb / hsl anywhere outside the `:root` token block. Only `var(--ink)`, `--ground`, `--card`, `--momentum`, `--momentum-ink`, `--lime`, `--slip`, `--slip-ink`, `--slip-on-ink`, `--muted`.
- `--momentum` green used decoratively. Green appears **only** when `weeksRemaining` drops. Green without the number moving kills the whole design premise.
- `--lime` as a text colour. Fill only, `--ink` on top.
- `--momentum` or `--slip` as a **text** colour on their own tints — they fail contrast there. Text uses `--momentum-ink` / `--slip-ink`; the always-dark celebration overlay uses `--slip-on-ink`.
- Emoji as icons. Inline SVG only, 1.5px stroke, `currentColor`.
- Layout spacing off the scale `4 8 12 16 24 32 48`. Layout with flex/grid `gap`, never per-element margins. Control internals (chip padding `6px 12px`, pointspill `5px 11px`) sit below the scale deliberately — the scale governs layout rhythm, not the inside of a 32px chip.
- A second shadow. One elevation token, and depth belongs to the phone frame, not to cards.
- Generic-AI tells: `rounded-lg` on everything, grey-100 cards, purple/indigo, gradient text, evenly-padded card grids.
- Information carried by animation alone. Every motion has an instant state change underneath it.
- A new component pattern. The inventory below is **closed**.
- Renaming existing classes. Priya integrates against them on Wednesday.

## Always

- Design for the **390×844** phone first. The presenter rail around it is desktop chrome, not product.
- `font-variant-numeric: tabular-nums` on any figure that can change. A timeline that jitters while recalculating destroys the illusion of a real engine.
- `min-width:0` on any input inside a flex row. Inputs carry an intrinsic width that blocks shrink and silently overflows the 390px phone.
- 44×44 minimum touch target; habit rows 56px. Jayden is on a cracked phone on a bus.
- Radii: `10px` controls, `18px` cards, `28px` phone frame, `999px` chips. One step per level.
- Running text capped at 65ch.
- `prefers-reduced-motion: reduce` → everything collapses to instant state change plus a 120ms opacity fade. Tick, number and colour still change.
- `aria-live="polite"` on the timeline number and points counter.

## Reaction budget

Interface reacts to good behaviour within **400ms**, and the reaction is always about *time*, not praise. No confetti for ticking a box — confetti is reserved for finishing a goal. Timings table: `docs/02-design-system.md` §5.

## Component inventory (closed)

`Chip` · `PrimaryButton` (56px) · `GhostButton` · `StatPair` · `TimelineRail` · `GoalCard` · `HabitRow` · `PointsCounter` · `RewardBar` · `DonutSplit` (2 segments) · `TabBar` (4 items) · `Sheet` · `CelebrationOverlay`

Live classes in `prototype/index.html` — keep them:
`balance bloom brandmark btn btn-ghost card celebrate chip chip-lime chip-mo chip-sel chip-slip distances donut eyebrow floater glyph goal-emoji goal-name goalcard habit habit-label habit-meta habits hicon ideal legend marker num num-lead partner-name phone phone-wrap pointspill progress rail rail-actions rail-group rewardbar screen seg split stage status steps streak sweep t-pts tabs ticks ticks tier tiers tnum track trail viewport`

State classes: `.chip-sel` neutral selection · `.num-lead` the 44px figure in a StatPair (weeks, not money) · `.progress.is-faster` / `.progress.is-slip` · `.trail.is-dragging`.

## SVG

Never hand-write path data. Compute it — a JS function that emits coords (`describeArc`, tick spacing, marker position) beats a guessed `d` string every time. Anything freehand gets rendered and looked at before it is accepted. Celebration shards stay on canvas, not SVG.

## Workflow — verified

1. Change `prototype/index.html`.
2. `preview_start` name `proto` → serves `prototype/` on `http://localhost:4321`, tab `seed`.
3. `resize_window` **560×920**. The page is desktop chrome containing a real 390×844 phone — do *not* resize to a phone viewport, it is not built that way. At 560×920 the phone is fully in frame at true size.
4. `screenshot`. Step the six screens with `ArrowRight`. Re-check in `colorScheme: dark`.
5. Run the `design-critic` agent on it.
6. Fix findings. Repeat until "no findings".

`zoom` region-cropping does not work in this browser pane — it returns the full screenshot. For detail, read geometry with `javascript_tool` + `getBoundingClientRect`, and wrap snippets in an IIFE or `const` redeclaration errors.

## Data

`data/dummy-bank-payload.json` is the single source of truth for every number. Do not invent figures; derive them. Maths: `docs/03-engineering-handoff.md`.
