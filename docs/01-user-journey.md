# 01 · User Journey & Wireframes
**Owner:** Anton (Product & Design) · **Status:** delivered · **Consumers:** Priya (build), Nikita (script), Temi (scope)

---

## 1. The one sentence the whole design serves

> Other money apps show you **how much you have**. Able AI shows you **how far away you are** — and makes that distance visibly shrink when you do something small today.

Every screen must answer one of two questions: *how far?* or *what do I do next?* If a screen answers neither, it gets cut.

---

## 2. Personas (design targets)

| | **Maya — primary** | **Jayden — expansion** |
|---|---|---|
| Age / band | 23 · 18–25 | 16 · 15–18 |
| Route in | Demo Bank CRM email | School programme, bank-sponsored |
| Income | £1,980/mo net | £120/mo (part-time + allowance) |
| Goal | Deposit fund, £3,000 | Match boots, £220 |
| Emotional state | "I'll never afford a deposit, so I avoid looking" | "I want it now, saving feels like nothing happens" |
| Design implication | Long horizon must feel **reachable** — show weeks, not years, wherever honest | Short horizon must feel **eventful** — reward density higher, smaller numbers |

Per Ayodele's Business & Reach: **18–25 is the commercial beachhead**, 15–18 is expansion. So Maya is the default view in every demo and screenshot; Jayden is the scalability proof. Irvin's interview quotes should be attached to these two profiles, not to new ones.

---

## 3. Journey map

```
[Bank CRM email]
      │  "Your bank has set this up for you"
      ▼
(1) HANDOFF ──────────► (2) DASHBOARD ──────────► (3) NEW GOAL
 data arrives via         balance · split ·        name · cost ·
 universal API            momentum · goal          ideal timeframe
 consent line shown       card · next habit              │
                                 │                        ▼
                                 │                 (4) AI TIMELINE
                                 │                 "£2,360 to go ·
                                 │                  61 weeks at today's rate"
                                 │                        │
                                 ▼                        ▼
                          (5) ACTION CENTRE ◄──── levers: what if I add £X/wk
                          tick a habit
                          ├─ points +10        ─── timeline shortens, UI goes green
                          └─ streak continues
                                 │
                                 ▼
                          (6) REWARDS            (7) GOAL COMPLETE
                          points · tiers ·        +100 pts (1 goal/month cap)
                          funded by your bank     → set the next goal
```

**Loop we are actually designing for:** open app → see distance → tick one habit → watch distance shrink → close app. Target session length **under 40 seconds**. Anything that lengthens that session is a design failure, not a feature.

---

## 4. Screen inventory

| # | Screen | Job | Must show | Cut-ability |
|---|---|---|---|---|
| 1 | Handoff | Prove the B2B2C route in 3 seconds | Partner name, what data arrived, consent line | Keep — it *is* the business model on screen |
| 2 | Dashboard | Orient in one glance | Balance, spend/save split, momentum line, active goal, next habit | Core |
| 3 | New Goal | Capture goal in <20s | Label, target £, ideal timeframe | Core |
| 4 | Goal Timeline | The money shot | Financial distance, time distance, timeline rail, levers | Core — this is the demo |
| 5 | Action Centre | Convert intent into a tick | 3 habits max, each with £/week and points | Core |
| 6 | Rewards | Answer "what do I actually get" | Points balance, next tier, funder | Keep, 20s of stage time |
| 7 | Goal Complete | Payoff moment | +100 points, cap rule, next goal CTA | Keep, ends the demo on a high |

Deliberately **not** built: settings, transaction list, notifications centre, profile editing, multi-goal management, chat. All are session-lengtheners and none appear in a 5-minute pitch.

---

## 5. Wireframes

### (1) Handoff
```
┌───────────────────────────────┐
│  ● Demo Bank                  │  partner mark, small
│                               │
│  Your bank set this up        │  display, 2 lines max
│  for you.                     │
│                               │
│  ┌───────────────────────┐    │
│  │ ✓ Balance & spending  │    │  what arrived — 3 chips,
│  │ ✓ Last 3 months       │    │  concrete not abstract
│  │ ✓ Nothing is moved    │    │  ← kills the "is this
│  └───────────────────────┘    │     open banking?" fear
│                               │
│  Demo Bank sent this securely │  micro-copy, mono
│  You can disconnect anytime.  │
│                               │
│  [      Start       ]         │  primary, 56px tall
└───────────────────────────────┘
```

### (2) Dashboard
```
┌───────────────────────────────┐
│ Morning, Maya      [140 pts]  │  points always visible = ambient reward
│                               │
│ £1,284.50                     │  display XL, tabular
│ Demo Bank current account     │
│                               │
│ ┌──────────┐  Saving   £152   │  donut, 2 segments only.
│ │  ◕ 8.5%  │  Spending £1,642 │  NO 7-slice pie — nobody reads it
│ └──────────┘                  │
│                               │
│ ┌───────────────────────────┐ │
│ │ 🔑 Deposit fund           │ │  goal card = the hero card
│ │ ████████░░░░░░░░  21%     │ │
│ │ £2,360 to go              │ │  financial distance
│ │ 61 weeks at today's rate  │ │  time distance ← the differentiator
│ │ ▸ 4 weeks faster than     │ │  momentum line, green
│ │   when you started        │ │
│ └───────────────────────────┘ │
│                               │
│ TODAY                         │  eyebrow, mono
│ ┌───────────────────────────┐ │
│ │ ☐ Skip 3 coffees  +£10.50 │ │  one habit surfaced here,
│ │                   +10 pts │ │  rest live in Action Centre
│ └───────────────────────────┘ │
│                               │
│ [Home] [Goals] [Habits] [You] │  4 tabs, 44px+ targets
└───────────────────────────────┘
```

### (3) New Goal — three questions, one per screen-third
```
┌───────────────────────────────┐
│ ← New goal                    │
│                               │
│ What are you saving for?      │
│ [ Deposit fund            ]   │  free text + emoji picker
│                               │
│ How much?                     │
│ [ £3,000                  ]   │  big numeric keypad styling
│                               │
│ Ideally by when?              │
│ [ 6mo ] [ 12mo ] [ 2yr ] [+]  │  chips, not a date picker
│                               │
│ [   See my timeline    ]      │
└───────────────────────────────┘
```

### (4) Goal Timeline — **the money shot**
```
┌───────────────────────────────┐
│ ← 🔑 Deposit fund             │
│                               │
│ £2,360          61 weeks      │  two distances, equal weight,
│ to go           at this rate  │  side by side. This pairing IS
│                               │  the product.
│ ├──●─────────────────────┤    │  timeline rail
│ today   ▲ ideal        target │  ▲ = their stated timeframe,
│                               │      sitting BEHIND reality
│ ┌───────────────────────────┐ │
│ │ What if you added         │ │
│ │ £──────●──────  £12/week  │ │  the lever. Drag = live recalc
│ └───────────────────────────┘ │
│                               │
│ 61 → 47 weeks                 │  animated count-down, green
│ 14 weeks earlier. That's      │  plain-language payoff
│ three coffees a week.         │  ← translate £ into behaviour
│                               │
│ [  Lock these habits in   ]   │
└───────────────────────────────┘
```

### (5) Action Centre
```
┌───────────────────────────────┐
│ Habits            [140 pts]   │
│ This week ●●●○○○○   3/7       │  streak dots, not a calendar
│                               │
│ ┌───────────────────────────┐ │
│ │ ☑ Skip 3 coffees          │ │  ticked state: strikethrough +
│ │   +£10.50/wk  +10 pts  ✓  │ │  green fill + tick animation
│ ├───────────────────────────┤ │
│ │ ☐ Pack lunch 2 days       │ │
│ │   +£14.00/wk  +15 pts     │ │
│ ├───────────────────────────┤ │
│ │ ☐ Cancel one subscription │ │
│ │   +£2.75/wk   +20 pts     │ │
│ └───────────────────────────┘ │
│                               │
│ These 3 habits = 11 weeks     │  aggregate impact, always on
│ off your deposit fund.        │  screen. Habit → outcome link.
└───────────────────────────────┘
```
Max **3 habits**. Four+ turns a reward loop into a chore list.

### (6) Rewards / (7) Goal Complete
```
┌───────────────────────────────┐     ┌───────────────────────────────┐
│ 140 points                    │     │        ✦   ✦   ✦              │
│ ███████░░░░░░░░ 110 to £5     │     │                               │
│                               │     │      Goal reached             │
│ NEXT TIERS                    │     │      🔑 Deposit fund          │
│  250 → £5 credit              │     │                               │
│  600 → £15 credit             │     │      +100 points              │
│ 1200 → £40 credit             │     │                               │
│                               │     │  One goal reward per month —  │
│ Rewards funded by Demo Bank's │     │  next one unlocks 1 Oct.      │
│ financial education budget.   │     │                               │
│ ← say this out loud on stage  │     │  [   Set the next goal   ]    │
└───────────────────────────────┘     └───────────────────────────────┘
```
The funder line is a **design element, not fine print**. It is the slide where a judge realises the unit economics are not hand-waved.

---

## 6. States every component must have

| Component | States |
|---|---|
| Habit row | default · hover/press · ticked · already-ticked-today (locked, greyed) |
| Goal card | on track (green momentum line) · steady (neutral) · slipping (amber, never red) · complete |
| Timeline rail | baseline · recalculating (200ms) · improved (green sweep) · worsened (amber, no shake, no shame) |
| Lever slider | idle · dragging (live number) · released (settle animation) |
| Points counter | idle · incrementing (roll-up) · tier reached (pulse) |
| Goal reward | available · **capped this month** (explicit, with unlock date) |
| Empty | no goals yet → single CTA, illustration-free |
| Error | payload missing a field → "We couldn't read your spending yet. Demo Bank is retrying." + retry button. Never a raw error code. |

---

## 7. Edge cases the judges will probe

1. **Spending > income.** Timeline is undefined. Do **not** show "∞ weeks". Show: *"At the moment there's nothing left over. Here are three habits that free up £27/week — that's the first step."* Screen turns amber, not red.
2. **Goal is genuinely unreachable in the stated timeframe.** Never hide it, never fake it. Show the honest number *and* the nearest achievable version: *"12 months needs £197/week. At £52/week you're there in 45 weeks."*
3. **Reward farming.** Goal reward hard-capped at 1/month, enforced in the engine and surfaced in the UI (see screen 7). Habit points are uncapped but low-value — the cap is on money, not on encouragement.
4. **"Is this financial advice?"** No screen states a recommendation about a regulated product. Copy is always *simulation* framing: "at this rate", "if you added". No investments, no rates, no products. Reuse ChronoWealth's line: **simulate, don't advise.**
5. **Under-18s.** Jayden's view carries no credit content, no rewards convertible to cash without guardian flag. Flag this to Ayodele — safeguarding shows up in school procurement.

---

## 8. What I need from others

- **Priya:** consume `data/dummy-bank-payload.json` as-is. If you need a field that isn't there, tell me and I'll add it to the contract rather than you inventing it locally.
- **Irvin:** two verbatim quotes — one from a Maya-shaped person, one Jayden-shaped. They go on the Handoff and Goal Complete screens in the deck.
- **Nikita:** demo run-of-show is in `docs/04-demo-run-of-show.md`. Script to those exact screens.
