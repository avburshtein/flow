<div align="center">

# 🌅 Flow — Circadian Productivity Calendar

**Plan your day around your energy — not around a clock.**

A mobile-first planner that splits the day into **4 circadian blocks** derived from *your* wake/rest times,
weighs every task in **cognitive points**, and automatically protects you from overbooking.

[🌐 Live Demo](https://flow-nine-xi.vercel.app) · [🐛 Report a Bug](https://github.com/denzakh/flow/issues)

![React](https://img.shields.io/badge/React-19-087ea4?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.3-38bdf8?logo=tailwindcss&logoColor=white)
![MUI](https://img.shields.io/badge/Material_UI-9-0071b5?logo=materialui&logoColor=white)

</div>

<p align="center">
  <a href="README.md"><strong>🇬🇧 English</strong></a> &nbsp;·&nbsp; <a href="README.ru.md"><strong>🇷🇺 Русский</strong></a>
</p>

---

## 📖 Table of contents

- [Status — what actually works today](#-status--what-actually-works-today)
- [Quick start](#-quick-start)
- [Available scripts](#-available-scripts)
- [The circadian model](#-the-circadian-model)
- [Voice control](#-voice-control)
- [Tech stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project structure](#-project-structure)
- [Data & privacy](#-data--privacy)
- [Browser support](#-browser-support)
- [Documentation](#-documentation)
- [Roadmap — not implemented yet](#-roadmap--not-implemented-yet)
- [Known issues](#-known-issues)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📊 Status — what actually works today

Flow is an actively developed, **fully client-side** app (no backend, no telemetry).
This table is the honest source of truth — it is kept in sync with the code, not with the wish list.

| Area | Status | Notes |
|---|---|---|
| Circadian time blocks (Morning / Afternoon / Evening / Night) | ✅ | Derived from `wakeUpTime` → `restTime`, the active window is split in thirds |
| Task weights **Quick 1 / Focused 3 / Deep 6** | ✅ | Auto-suggested from the task title (keyword + length heuristics) |
| Capacity **12 pts per block** + automatic transfer | ✅ | `adjustTaskPeriods()` routes overflow to the next free slot and shows a snackbar notice |
| Recovery Mode & Wind Down | ✅ | Recovery days (Sat/Sun by default) + the last 90 min before `restTime` |
| 4 calendar views (Day / Week / Month / Year) | ✅ | Switchable by tap and by voice |
| Day view: block grid ⇄ list toggle, collapse, quick add | ✅ | |
| Voice control (RU / EN / ES) | ✅ | Web Speech API, Chromium-based browsers — see [Voice control](#-voice-control) |
| Fade-in alarm with 7 ambient sounds + 5 min snooze | ✅ | Sounds are streamed from `mixkit.co` |
| Light / dark M3 theming, persisted | ✅ | Class-based (`.light` / `.dark`), fully token-driven |
| UI language EN / RU / ES | 🟡 | Mostly complete; Month view weekday headers are still hardcoded in English |
| Task recurrence (daily / weekly / monthly / all-blocks) | 🟡 | The value is stored on the task, but repeat instances are **not** generated yet |
| Auth screen | 🟡 | UI demo only — guest / e-mail / “Google” buttons are mocked, the profile lives in `localStorage` |
| Ideas Bank & Smart Day Planner | 🔵 | Buttons exist in `FlowToolbar`, handlers are no-ops |
| Bubble physics | 🔵 | `requestAnimationFrame` spring simulation; Matter.js is specified but **not** installed |
| Left-handed mode | 🔵 | Spec only — [`docs/gestures-motion.md`](docs/gestures-motion.md) |
| React Aria / React Stately | 🔵 | Dependencies installed, **no imports in `src/` yet** |
| Automated tests | ❌ | No test runner configured — QA is manual, see [TEST_PLAN.md](TEST_PLAN.md) |

---

## 🚀 Quick start

**Prerequisites:** Node.js **20+** (verified on 24.13.0) and npm 10+. Vite 6 does not support Node 18 officially.

```bash
git clone https://github.com/denzakh/flow.git
cd flow
npm install
npm run dev
```

Then open **http://localhost:3000** — the dev server binds to `0.0.0.0`, so it is also reachable from a phone
on the same Wi-Fi (handy for testing the real touch targets and the voice API).

> There is **nothing to configure**: no `.env`, no API keys, no database. The app boots straight into a demo auth
> screen — pick *Guest* or any login option to continue.

## 📜 Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR on `http://localhost:3000` |
| `npm run build` | Production bundle into `dist/` (transpile only — **no** type-check) |
| `npm run preview` | Serves the built `dist/` locally |

Housekeeping notes:

- There is **no lint / test / typecheck script** yet. `npx tsc --noEmit` currently reports ~60 pre-existing type
  errors, 46 of them in the legacy helper `src/utils/design-utils.ts`. The build is unaffected because Vite only
  transpiles. Cleaning this up is on the [roadmap](#-roadmap--not-implemented-yet).
- The build output is a single ~545 kB JS chunk (Vite warns about the 500 kB limit) — no code splitting yet.

## 🧬 The circadian model

Everything in Flow derives from two numbers you set once: **wake-up time** and **rest time**.

```
restTime ──────────────────────────────▶ wakeUpTime
  │            active window           │
  │  ┌────────────┬────────────┐       │  Night
  │  │  Morning   │ Afternoon  │       │  (recovery,
  │  │  1/3 of    │  1/3 of    │ 3/3  │   no capacity)
  └──┴────────────┴────────────┴───────┘
```

- **4 blocks** — `Morning`, `Afternoon`, `Evening` divide the waking window into equal thirds; `Night` closes the
  loop. Implementation: [`src/services/circadian.ts`](src/services/circadian.ts) → `getDynamicBlocks()`.
- **Wind Down** starts 90 minutes before `restTime` and switches the app into Recovery Mode automatically.
- **Recovery Mode** is active on your configured recovery days (default: Saturday + Sunday) and during Wind Down.
  It shows a banner with a rotating recovery tip and relaxes the visuals.
- **Sleep-gap validation:** saving a schedule with less than 7 h between `restTime` and `wakeUpTime` is rejected
  with a localized error.
- **The active block** is recomputed every second from a ticking clock (`currentTime`), so the UI always knows which
  part of the day you are in.

### Task weights & the 12-point capacity

| Weight | Points | Auto-detected from keywords (RU/EN) |
|---|---|---|
| ⚡ Quick | **1** | `email`, `почта`, `звонок`, `call`, `оплатить`, `buy`, `убрать`, `заказать`, … |
| 🎯 Focused | **3** | *default* when nothing matches |
| 🧠 Deep | **6** | `код`, `design`, `исследование`, `study`, `рефактор`, `тест`, `стратегия`, … |

Ties are broken by title length (≤ 20 chars → Quick, ≥ 50 chars → Deep). See
[`suggestWeight()`](src/services/taskOptimizer.ts).

- **Each block holds 12 points.** The block card shows a capacity bar and a 2nd-px amber border when overloaded.
- **Overflow is not a punishment — it is a redirect.** When a task does not fit, `adjustTaskPeriods()` looks for the
  next free slot (later block → tomorrow) and tells you where the task landed
  ([`src/utils/taskCreation.ts`](src/utils/taskCreation.ts) → `resolveTaskPlacement()`).
- The **Night** block never accepts new tasks and is excluded from the capacity math — it is a rest zone, not a slot.
- Task **priority** is encoded by shape, weight by size + color — see
  [`src/components/ui/TaskBubble.tsx`](src/components/ui/TaskBubble.tsx) (circle / squircle / 12-sided “cookie”).

## 🎤 Voice control

Tap the mic in the bottom bar and speak. Everything is rule-based (regex + context analysis) — no LLM in the loop.

| Intent | English | Русский |
|---|---|---|
| Add a task | “add task call the bank”, “remind me to buy coffee” | «добавь задачу позвонить в банк», «напомни купить кофе» |
| Complete | “complete task 2”, “done with the report” | «выполни задачу 2», «готово» + название |
| Delete | “delete task 3” | «удали задачу 3» |
| Re-weight | “make task 1 deep” | «сделай задачу 1 глубокой» |
| Move a block | “move task 2 to evening” | «перенеси задачу 2 на вечер» |
| Change priority | “mark task 1 high priority” | «сделай задачу 1 важной» |
| Navigate | “next day”, “go to today”, “what's due tomorrow” | «следующий день», «сегодня», «что завтра» |
| Switch view | “show week view”, “open month” | «покажи неделю», «открой месяц» |

- **Languages:** English, Russian, Spanish (`ru-RU` / `en-US` / `es-ES`).
- **Confidence gate:** if the recognizer's confidence is below the threshold (default `0.7`), the command is shown in
  a confirmation dialog instead of being executed. Zero/absent confidence falls back to `threshold + 0.1`.
- **TTS feedback** is spoken back after execution (voice selectable in Settings → Voice).
- **Noise filter:** greetings and filler words (`привет`, `ok google`, `hola`, …) never become tasks.
- **Fallback rule:** any unrecognized utterance becomes *add task* — by design, so dictation “just works”.
- Code: [`src/services/voice/`](src/services/voice) — `VoiceControlService.ts` (STT/TTS),
  `VoiceCommandProcessor.ts` (normalization, noise filter, entity extraction) and `commands/` (patterns).

---

## 🛠️ Tech stack

| Layer | Technology | Version |
|---|---|---|
| UI runtime | React + React DOM | 19.2 |
| Language | TypeScript | ~5.8 |
| Build / dev server | Vite | 6.4 (port `3000`, host `0.0.0.0`) |
| Standard UI | Material UI (`@mui/material`) + Emotion | 9.0 / 11.14 |
| Expressive UI | Tailwind CSS v4 via `@tailwindcss/vite` | 4.3 |
| A11y primitives | `react-aria` + `react-stately` *(installed, integration pending)* | 3.48 / 3.46 |
| Icons | `lucide-react` (exclusively — Material icons are banned) | 0.562 |
| Voice | Web Speech API (STT + TTS), browser-native | — |
| Alarm audio | `HTMLAudioElement` + remote ambient mp3s | — |
| State | React hooks in `App.tsx` — no global store, no Context yet | — |
| Persistence | `localStorage` | — |
| Fonts | Inter (Google Fonts, SIL OFL 1.1) | — |
| AI | Not integrated — the original AI Studio prototype was removed; the AI phase will run through a server-side proxy | — |

## 🏗️ Architecture

### Hybrid UI: two systems, one token source

The app deliberately mixes two styling worlds. The rule (also encoded in [`.clinerules`](.clinerules)):

- **Standard UI** — modals, bottom sheets, forms, settings, toolbars, snackbars → **Material UI**,
  themed *only* through [`src/theme/mui-theme.ts`](src/theme/mui-theme.ts), which maps MUI palette slots onto the
  CSS variables below.
- **Expressive UI** — circadian blocks, task bubbles, the date navigator → **Tailwind v4** utilities plus CSS
  variables. No MUI wrappers here, they would break the DOM structure of these custom elements.

### Design tokens are the single source of truth

```
src/theme/tokens.css        ← SSOT: ~800 M3 variables + Flow extensions, .light and .dark blocks
        │
        ├── src/theme/mui-theme.ts   → MUI palette / typography / shape (var(--md-sys-color-*))
        ├── tailwind.config.ts       → utility classes (bg-surface-container, text-primary, rounded-md-lg, …)
        └── components               → inline style={{ background: 'var(--flow-block-morning)' }}
```

Rules the code follows (and reviewers should enforce):

- **No hardcoded hex** in components, and no pixel values in `sx` for layout — only `var(--…)` or Tailwind classes.
- Layout spacing → Tailwind; MUI `sx` is reserved for component-internal state (size, radius, color).
- M3 motion easing only: `ease-m3-emphasized` / `ease-m3-decelerate`. No `linear`, no `ease-in-out`.
- Touch targets ≥ 48–52 px; every icon button in the app follows this.
- The overload state is signaled with **amber** (`--flow-capacity-overload`), never red.

### Layer order (z-index)

| Layer | Content |
|---|---|
| Background | gradient, ambient blobs, theme image |
| Content | `Header` → `ViewSwitcher` → Day/Week/Month/Year views → `FlowToolbar` |
| Temporal | `DateNavigator` (prev/next + date label) below the view, above the toolbar |
| Overlay | Task sheet, settings sheet, alarm modal, voice confirmation, capacity snackbar |
| Toolbar | `FlowToolbar` — fixed bottom bar (settings, ideas, mic, add, smart planner) |

### State & data flow

`App.tsx` is the single state owner: `tasks`, `settings`, `voiceSettings`, `viewMode`, `viewDate`,
`collapsedBlocks`, plus a 1-second `currentTime` tick. Derived values (`activePeriodId`, `dynamicBlocks`,
`isRecoveryMode`, `isWindDown`) are memoized from that tick. All mutations flow through a handful of handlers
(`commitTask`, `toggleTask`, `updateTask`, `deleteTask`, `executeVoiceCommand`) and are mirrored into
`localStorage`. There is no store, no server and no conflict resolution yet.

---

## 📁 Project structure

```
flow/
├── index.html                    # Vite entry point, loads Inter
├── vite.config.ts                # port 3000, host 0.0.0.0, Tailwind plugin, @ alias
├── tailwind.config.ts            # maps CSS variables → utility classes, M3 shapes/easings/durations
├── tsconfig.json                 # ES2022, bundler resolution, @/* → project root
├── .clinerules / .cursorrules    # agent constitution: hybrid UI rules, forbidden actions
├── CLAUDE.md                     # deep project context for AI agents (architecture + styling contract)
├── TEST_PLAN.md                  # manual QA scenarios and bug tracker
├── INTEGRATION_REPORT.md         # design-system integration report (phase 0)
├── docs/                         # see the documentation map below
└── src/
    ├── main.tsx                  # React root + theme bootstrap (reads flow_theme before first paint)
    ├── App.tsx                   # state owner: tasks, settings, voice, alarm, capacity routing
    ├── types.ts                  # domain model: Task, TimePeriod, TaskWeight, UserSettings, VoiceCommand…
    ├── constants.tsx             # i18n strings (EN/RU/ES), alarm sounds, weights, BLOCK_CAPACITY = 12
    ├── theme/
    │   ├── tokens.css            # ← SSOT: M3 tokens + Flow tokens, light & dark
    │   ├── mui-theme.ts          # CSS variables → MUI theme
    │   └── design-tokens.ts      # TypeScript mirror of the token names
    ├── components/
    │   ├── Auth.tsx              # demo auth screen (mocked, no backend)
    │   ├── TaskItem.tsx          # list row for a task
    │   ├── TaskManagerPanel.tsx  # day stats + bulk delete (completed / all)
    │   ├── layout/               # Header.tsx, FlowToolbar.tsx
    │   ├── common/               # DateNavigator.tsx, ViewSwitcher.tsx
    │   ├── views/                # DayView, WeekView, MonthView, YearView
    │   ├── blocks/               # TimeBlock, TimeBlockList, BubbleBlock, RecoveryBanner, FocusPoint
    │   ├── ui/                   # TaskBubble.tsx — weight/priority encoding
    │   ├── modals/               # TaskSheet, SettingsModal, AlarmModal, AlarmPlayingModal, VoiceConfirmDialog
    │   └── voice/                # VoiceFeedback, VoiceControlButton, VoiceSettingsModal
    ├── services/
    │   ├── circadian.ts          # dynamic blocks, active period, wind-down, recovery mode
    │   ├── taskOptimizer.ts      # weight suggestion, capacity routing, Eisenhower matrix
    │   ├── iconSuggester.ts      # keyword → lucide icon
    │   └── voice/                # VoiceControlService, VoiceCommandProcessor, commands/{Task,Navigation,Update}
    └── utils/
        ├── taskCreation.ts       # createTaskId, resolveTaskPlacement, transfer notifications
        ├── design-utils.ts       # legacy style helpers (source of most type errors)
        └── getCurrentYear.ts
```

> Legacy leftovers still tracked in git: `*.bak`, `*.backup*`, `App.tsx.original`, `tokens.css.backup`.
> They are not imported anywhere — removal is on the roadmap.

## 🔐 Data & privacy

Everything stays on the device. There is no server, no account and no analytics.

| `localStorage` key | Contents |
|---|---|
| `flow_user` | Demo profile (id, name, e-mail, avatar, guest flag) |
| `flow_tasks` | All tasks: title, periods, weight, priority, due date, recurrence, completion |
| `flow_settings` | Wake/rest times, recovery days, UI language, alarm config |
| `flow_voice_settings` | Voice language, TTS toggle + voice, auto-submit, confirmation, confidence threshold |
| `flow_theme` | `"light"` or `"dark"` |

Clearing site data resets the app completely — there is no export/import yet.

## 🌐 Browser support

| Browser | App | Voice (Web Speech API) |
|---|---|---|
| Chrome / Edge (desktop & Android) | ✅ | ✅ |
| Safari (macOS / iOS) | ✅ | ⚠️ partial, depends on OS language pack |
| Firefox | ✅ | ❌ `SpeechRecognition` is not implemented |

Other runtime requirements: `localStorage`, and network access for the Google Fonts stylesheet and the alarm mp3s.
The alarm fades in over 15 s, which is a deliberate anti-shock design — note that browsers block autoplay until the
user has interacted with the page at least once.

## 📚 Documentation

| Document | What is inside |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Deep project context for AI agents: architecture, styling contract, capacity logic, known issues |
| [`.clinerules`](.clinerules) / [`.cursorrules`](.cursorrules) | Agent constitution: hybrid UI rules, z-index order, forbidden actions |
| [`TEST_PLAN.md`](TEST_PLAN.md) | Manual QA scenarios per stage, bug tracker, UX edge cases |
| [`INTEGRATION_REPORT.md`](INTEGRATION_REPORT.md) | What changed when the design system was integrated (phase 0) |
| [`docs/ui-rules.md`](docs/ui-rules.md) | M3 Expressive + hybrid architecture rules |
| [`docs/ui-layout-flow.md`](docs/ui-layout-flow.md) | Layout constitution and layer order |
| [`docs/ui-react-aria-flow.md`](docs/ui-react-aria-flow.md) | React Aria + Tailwind rules for the expressive layer |
| [`docs/state-management.md`](docs/state-management.md) | State & interaction rules (incl. what is *not* implemented yet) |
| [`docs/gestures-motion.md`](docs/gestures-motion.md) | Left-handed mode / ergonomics — future spec |
| [`docs/ai-manifesto.md`](docs/ai-manifesto.md) | Why Flow exists: the product philosophy |
| [`docs/CURRENT/DEFINE.md`](docs/CURRENT/DEFINE.md) | User research (n=99, RU/EN/ES), personas, success metrics |
| [`docs/components/`](docs/components) | Component specs: `TimeBlock`, `TaskSheet`, `Task indicator` |
| [`docs/figma/`](docs/figma) | Figma token exports (light/dark variables, master spec) |
| [`docs/specs/`](docs/specs) | Future specs: energy peak planner, audio neural engine, audio events |
| [`docs/Archive/`](docs/Archive) | Superseded documents, kept for reference only |

---

## 🗺️ Roadmap — not implemented yet

Nothing below ships today. It is listed so that nobody mistakes a spec for a feature.

**Near term**

- [ ] Wire **React Aria** primitives into the expressive layer (deps are installed, `useFocusRing` / `onPress` are not used)
- [ ] Replace the `requestAnimationFrame` bubble spring with **Matter.js** physics for Compact Mode
- [ ] Implement the two dead toolbar buttons: **Ideas Bank** and **Smart Day Planner**
- [ ] **Left-handed mode** — mirror `FlowToolbar` / `DateNavigator` for left-hand thumb zones
- [ ] Materialize **recurring tasks** (daily / weekly / monthly / all-blocks are stored but never expanded)
- [ ] Finish **ES localization** (Month view weekday labels are hardcoded in English)

**Platform**

- [ ] Real authentication + backend + sync (currently a demo screen and `localStorage`)
- [ ] Data export / import (JSON backup)
- [ ] PWA: manifest, offline, installable voice widget
- [ ] Code splitting to get under the 500 kB warning
- [ ] CI: `tsc --noEmit` + lint + a Vitest suite for `circadian.ts` / `taskOptimizer.ts` / `VoiceCommandProcessor`

**AI layer** (philosophy in [`docs/ai-manifesto.md`](docs/ai-manifesto.md))

- [ ] `suggestWeightAI()` with a rule-based fallback
- [ ] `parseVoiceCommandAI()` with a rule-based fallback
- [ ] `getDailyBrief()` — daily energy-aware summary
- [ ] Server-side proxy so API keys never reach the client

**Housekeeping**

- [ ] Delete `*.bak` / `*.backup*` / `App.tsx.original` / `tokens.css.backup`
- [ ] Fix or retire `src/utils/design-utils.ts` (46 of ~60 type errors)
- [ ] Add a `LICENSE` file (see [License](#-license))

## 🐛 Known issues

The live list lives in [`TEST_PLAN.md`](TEST_PLAN.md). Currently tracked:

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | Sleep-gap warning is hard to notice in Settings | 🔴 High | Open — validation works (`< 7 h` is rejected), but the error is easy to miss |
| 2 | UI language sometimes applies only after reload | 🔴 High | Open — not reproducible in Chrome, still seen in Edge |
| 3 | Double quotes in the task-transfer notification | 🟡 Medium | Open |
| 4 | Voice confidence drops to 0.64 → confirmation every time | 🔴 High | Fixed (STT confidence fallback `threshold + 0.1`) |
| 5 | Update commands (“make task 1 important”) | 🔴 High | Fixed in v4 (`UpdateCommands.ts`) |

Found something new? Please open an issue with the steps to reproduce, browser, and language.

## 🤝 Contributing

1. Branch off `main` (`feature/…`, `fix/…`) and keep commits focused — the history follows
   [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).
2. Read [`.clinerules`](.clinerules) (or [`docs/ui-rules.md`](docs/ui-rules.md)) **before** touching UI.
   The non-negotiables: tokens instead of hex, `lucide-react` instead of Material icons, Tailwind for layout,
   M3 easings, ≥ 48 px touch targets, `onPress` instead of `onClick` in expressive components.
3. New tokens go into [`src/theme/tokens.css`](src/theme/tokens.css) first (both `.light` and `.dark`),
   then get exposed through `mui-theme.ts` / `tailwind.config.ts`.
4. Verify `npm run build` passes, and manually walk through the affected flow in both themes.
5. Update the affected docs (`CLAUDE.md`, `TEST_PLAN.md`, `docs/…`) in the same commit — the docs are part of the product.

## 📄 License

This project is licensed under the [Apache License 2.0](./LICENSE).

Copyright 2026 avburshtein.

You may use, copy, modify, and distribute the software under the terms of the Apache License 2.0.
The license includes patent protection and requires preserving copyright and license notices in source distributions.

## 🌙 Credits

- **Circadian science** as the product model: the day is a resource with a rhythm, not a grid of hours.
- **Material Design 3 / M3 Expressive** for the token system, motion curves and shape language.
- **Inter** by Rasmus Andersson — SIL Open Font License 1.1.
- **Web Speech API** for on-device speech recognition and synthesis.
- Ambient alarm sounds courtesy of [Mixkit](https://mixkit.co/free-sound-effects/).
- Product decisions are grounded in the n=99 user study documented in [`docs/CURRENT/DEFINE.md`](docs/CURRENT/DEFINE.md).

---

<p align="center">
  Made with ☕️ and circadian science · <a href="README.ru.md">Читать на русском</a>
</p>
