# Flow UI Implementation Rules (Material 3 Expressive + Hybrid Architecture)

> ⚠️ ВНИМАНИЕ ИИ-АГЕНТУ: Приложение использует ГИБРИДНУЮ архитектуру стилизации.
> 1. STANDARD UI (Формы, Настройки, Модалки, Шторки, Snackbar): Material-UI (MUI v5/v6), стилизация строго через тему, потребляющую `tokens.css`.
> 2. EXPRESSIVE UI (Циркадные блоки, Баблы задач, Слой дат, Week heat-map): Tailwind CSS v4 + React Aria.
> Хардкод HEX-значений в компонентах СТРОГО ЗАПРЕЩЁН. Сырые px для отступов запрещены (§1), для шрифтов — заменяются токенами (§2).

---

## 0. Приоритеты стилизации (протокол разрешения конфликтов)

При любом новом элементе значения ищутся в строгом порядке:

1. **Токены** (`src/theme/tokens.css`) — единственный источник истины: цвета, шрифты, скругления, тени.
2. **4px-сетка** (§1) — для всех отступов/гапов, если значения нет в токенах.
3. **Figma** — источник факта (что нарисовано), но не системы (как это должно быть измерено). При расхождении Figma ↔ токен/сетка **берём ближайший токен**, в коде оставляем пометку `// figma: 33px → headline-large (32)`, а расхождение фиксируется дизайнеру для правки макета. Макет подстраивается под систему, не наоборот.
4. Исключение: типографика живёт на шкале typescale (§2) и не обязана быть кратной 4.

## 1. Сетка и Отступы (Layout & Spacing)

- **Базовый шаг:** 4px. Все padding, margin, gap и размеры интерактивных элементов кратны 4.
- **Шкала spacing Flow:** `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 56 · 64`. Значения вне шкалы запрещены.
- **Edge margins (M3 canonical):** `16px` для compact (<600dp — наш мобильный layout), `24px` зарезервировано за medium/expanded (планшет).
- **Touch targets:** минимум `48×48px` (Flow calm standard — 52px). Мелкий визуал (например, FAB 40×40) заключается в невидимый touch-контейнер.
- **Сводка фактических значений (детали — §4):** 4 · 8 (col-gap) · 12 (row-gap, баннер-гапы, header-гапы) · 16 (edge, паддинг карточек, шевроны) · 20 (кольцо→свитчер, свитчер→навигатор) · 24 (gesture-зона, top-margin) · 32 (today-круг) · 40 (leading-квадрат, FAB-визуал) · 44 (навигатор, шевроны) · 52 (кнопки header, баннер, кольцо) · 64 (toolbar-контент) · 72 (week-строка) · 88 (toolbar) · 92 (pb = 88+4) · 196 (recovery max-height) · 228 (block max-height).

## 2. Token-first: карта маппинга Figma → токены

| Figma-значение | Токен | Примечание |
|---|---|---|
| Greeting `33/40/600/−0.4` | `headline-large` (32/40/600) | figma: 33px → 32 (принято) |
| Navigator title `16/600/19.36` | `title-medium` (16/24/500/0.15) | fw 600→500 по M3 |
| Week: label дня | `title-medium` | точное |
| Week: supporting `14/20/0.25/400` | `body-medium` | точное |
| Week: trailing «MO/22» | `label-large` (14/20/500/0.1) | figma: 600 → 500 |
| Banner, overline `12/500/0.5` | `label-medium` | точное |
| Progress «50%» | `label-small` (11/16/500) | точное |
| Block title `22/28/−0.5` | `title-large` | точное |

Правило: `fontSize/lineHeight/fontWeight/letterSpacing` — только из `--md-sys-typescale-*`. Осознанное отклонение — только с комментарием `// figma: … → токен …`.

## 3. Система Форм и Скруглений (Shapes)

Острые углы запрещены (Calm UI). Форма — носитель смысла:

- **Служебный UI (MUI):** окна/шторки — `--md-sys-shape-corner-extra-large` (28px); поля ввода — `rounded-t-xl` или капсула по контексту.
- **TimeBlock (квадранты):** `--md-sys-shape-corner-extra-large`; высота управляется гридом (§4.4), без Layout Shift.
- **Quick (1 pt):** круг `rounded-full`. Текст внутри запрещён — только центрированная иконка.
- **Focused (3 pts):** мягкий квадрат `rounded-3xl` (squircle).
- **Deep (6 pts):** биоморфное «печенье» — SVG clip-path с контрастным контуром.
## 4. Анатомия Экранов (точные значения)

### 4.1 Header
- Greeting: `headline-large`, цвет `primary`; длинное имя — truncate (перенос ломает вертикальный ритм).
- Правая колонка (align end, на 16px от правого края): row `[view-toggle 52×52] 12 [Recovery 52×52]` → 12 → ProgressRing 52×52 (кольцо ⌀40, stroke 5, viewBox 40).
- **Recovery-тоггл:** Leaf (обычный) ↔ RefreshCw (активен, цвет primary). Тап: активный → `recoveryOverride:'off'`, неактивный → `'on'`. Состояние пишется в `settings` немедленно (Header/баннер/настройки — один источник правды).

### 4.2 ViewSwitcher (Selected button)
- Full width (358), высота 44, капсула, обводка `outline`; выбранный сегмент — fill `secondary-container`, текст `on-secondary-container`, иконка Check 18.

### 4.3 DateNavigator (Temporal header — НАД блоками, под свитчером)
- Полная ширина экрана: `marginInline: −16px`; высота 44; шевроны 44×44 на **16px** от краёв, направлены **наружу** (‹ слева, › справа).
- Заголовок по центру, одна строка truncate: `title-medium`, цвет `on-surface-variant`.
- **Тап по заголовку = вернуться к сегодня.** Отдельной кнопки Today нет.
- Глифы шевронов НЕ зеркалятся ни при каких режимах (§8).

### 4.4 Day View — вертикальный ритм

```
24  верхний отступ контейнера (pt-6)
114 header (52 + 12 + 52)
20  → ViewSwitcher (44)
20  → DateNavigator (44)
12  → сетка блоков (2×2: col-gap 8, row-gap 12, ряды 1fr)
 4  → тулбар (fixed 88) — контейнер pb-[92px]
```
- Ряды блоков: `.day-grid-fit` — `height: calc(100dvh − 370px)` (fallback 100vh). Весь день виден без скролла на любом viewport.

### 4.5 TimeBlock (анатомия)
- Паддинг `16/16/8/16`; time-range `label-small` + capacity `label-medium` (opacity 0.7); заголовок `title-large` (22/28/−0.5).
- Capacity Linear: h=4, r=full, fill = seed, при overflow — `--flow-capacity-overload`.
- **Empty state:** квадрат 40×40, глиф 24px, цвет `seed`, opacity 0.5, sr-only текст. Без CTA.
- Recovery: см. §5.

### 4.6 FlowToolbar
- Fixed bottom, во всю ширину, без скруглений; фон `surface-container`.
- Высота **88 = 64 (контент, px-4) + 24 (gesture bar 108×4)**.
- Слоты: `[Planner 52] [Voice 52] [FAB] [Settings 52] [Ideas 52]`, evenly spaced.
- **FAB:** визуал 40×40 r=16 (M3 Small), внутри touch-контейнера **56×56** (роль Medium FAB; touch ≥ 48). Иконка 24: `Mic` (voice) / `Plus` (text) по `primaryInputMethod`.
### 4.7 Week View (heat-map)
- Строки 358×72 (min-h, pad **12/16**, gap 12, r=12, state-layer + focus-ring).
- Leading 40×40 r=12: **4 градации нагрузки = легенда Year View** (`#AE73F9` @5/@10/@15/@20; тёмная — 12/20/30/45). Иконка активного блока — **только у today**, фон = контейнер актуального периода.
- Фразы (4 градации, синхронны альфе): Rest day / Light day / Work Balance / Busy day; у today — «{block} block is active».
- Trailing: «MO/22» `label-large`; today — число в круге 32×32 (`--flow-week-today-circle`).
- Скролл **внутри списка**: контейнер `height: calc(100dvh − 382px)` (max 560); авто-скролл к today при монтировании/смене недели (учёт fixed-тулбара 88+8). Тап по дню → Day View этой даты.
- Неделя с понедельника.

## 5. Состояния циркадных блоков

| Состояние | Light | Dark |
|---|---|---|
| Normal | `--flow-block-shadow` (elevation-1), border transparent | border `--flow-block-{period}-border` (15% on-color), shadow none |
| **Active** (текущее время) | `--flow-block-shadow-active` (elevation-2, «приподнят»), border `--flow-block-active-border` | border outline 60%, shadow none |
| **Overload** (pts > capacity) | **янтарное свечение** `--flow-block-shadow-overload` + border 55% — единственный случай свечения | янтарный border, shadow none |
| **Recovery** | ёмкость **10** (`RECOVERY_BLOCK_CAPACITY`), `maxHeight: 196px`, фон `color-mix(container 80%, surface)`, Matter.js выключен, переходы ≤100ms | тот же |
| Empty | см. §4.5 | тот же |

Красный запрещён. Amber = забота, никогда не ошибка.

## 6. Recovery UI

- **Баннер:** 52px (r=12, pad 12/16), гапы **12 сверху/снизу**; fill `secondary-container` 25%, border `primary`; текст `label-medium`. Только при активном Recovery (пустой день — без баннера).
- **Настройки:** SettingsModal → Recovery: Auto / Always on / Always off (`settings.recoveryOverride`). Ручные режимы перекрывают циркадный расчёт.
- **Auto-логика:** Recovery включается на designated recovery days (`recoveryDays`, по умолчанию выходные — весь день!) и в wind-down (90 мин до `restTime`). В NIGHT не активен.

## 7. Карта Компонентов

| Компонент | Донор | Правило |
|---|---|---|
| Button, TextField, Snackbar/Alert, Dialog | **MUI** | через тему `mui-theme.ts` |
| TaskSheet (Bottom Sheet) | **MUI SwipeableDrawer** | верхние углы 28px, helper text pre-reserved |
| SettingsModal, SideSheet | кастомные bottom-панели (Tailwind + scrim) | зафиксировано как есть; миграция на MUI — опционально |
| Циркадный блок, пузырь, навигатор, week heat-map | **React Aria + Tailwind** | кастомные, `onPress` вместо `onClick`, state-layer + focus-ring |
| Иконки | **lucide-react** | `@mui/icons-material` запрещён |

## 8. Ergonomics: Left-Handed Mode (Methodology — researched backlog)

Статус: фича отложена до дизайн-ревью. Реализация — после протокола ниже.

**Исследования:** S. Hoober (49% — одна рука, 75% тапов в нижней трети), модель thumb-zone S. Hurff, M3 bidirectional guidance.

**Принципы:**
1. **Зеркалятся позиции контейнеров, но НЕ глифы.** Шеврон «назад» всегда влево (ошибка с зеркалированием DateNavigator уже совершалась и исправлена).
2. Primary-действие — в естественной дуге активного пальца; редкие/деструктивные — на противоположной стороне.
3. FAB — всегда строго по центру (защита от случайных краевых тапов).
4. Свайп-жесты сохраняют семантику направления (не зеркалятся).

**Протокол валидации:** LHS-макет в Figma до кода; сценарии одной рукой (навигация дня, добавление задачи, скролл недели); сравнение времени/ошибок с LTR-версией; само-тестирование дизайнера (левша) + 1 правша-контроль.

## 9. Типографика

Единственный шрифт — **Inter**. Все размеры — через `--md-sys-typescale-*` (см. §2). Шкала типов:

| Сущность | Токен |
|---|---|
| Greeting | `headline-large` |
| Block title | `title-large` |
| Day/Week labels | `title-medium` |
| Тексты, supporting | `body-medium` |
| Кнопки, trailing, overline, баннер | `label-medium` / `label-large` |
| pts-бейджи, «50%» | `label-small` |
| Wind-down текст | `body-medium` (op 0.5) |