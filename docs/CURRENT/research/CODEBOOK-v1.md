# Flow planning survey — codebook v1

This document defines the analysis vocabulary. Executable language mappings, regular expressions and the reviewed context overrides live in `analyze-planning.mjs`; generated audit files show every inclusion/exclusion decision without exposing response text.

## 1. Column families

| Construct | EN | ES | RU |
|---|---|---|---|
| Language | C | C | C |
| Submission time | B | B | B |
| Age | D | K | R |
| Gender | E | L | S |
| Occupation | G | N | U |
| Planner frequency | I | P | W |
| Daily plan | Y | AD | AI |
| Planning time | Z | AE | AJ |
| Unfinished tasks | AA | AF | AK |
| Small-task trap, frequency | AB | AG | AL |
| Guilt | AC | AH | AM |
| Focus peak | AN | AW | BF |
| Energy check | AO | AX | BG |
| Add-task channels | BO | BS | BW |
| Accessibility use | BQ | BU | BY |
| Timing Likert | AP | AY | BH |
| Overload Likert | AQ | AZ | BI |
| Small-task Likert | AR | BA | BJ |
| Day-clarity Likert | AS | BB | BK |
| State-aware Likert | AT | BC | BL |
| Capacity Likert | AU | BD | BM |
| Frustration | BP, CT | BT, CU | BX, CV |
| Recovery | AV, CQ | BE, CR | BN, CS |
| Magic feature | CA, CW | CB, CX | CC, CY |

For duplicated original/optional fields, the first non-empty value is used. Empty self-closing XLSX cells are missing values, not truncation signals.

## 2. Closed categories

- **Manual:** `Manually move…`, `Las muevo manualmente…`, `Переношу вручную…`.
- **Accumulation:** `They pile up…`, `Se acumulan…`, `Они накапливаются…`.
- **Reprioritize:** `I review…`, `Reviso…`, `Пересматриваю…`.
- **Forget:** `I simply forget…`, `Simplemente se me olvidan…`, `Просто забываю…`.
- **Rarely:** `This rarely…`, `Casi nunca…`, `Такого почти…`.
- **Other:** localized `Other/Otro` or remaining explicit options.

Focus categories: morning, afternoon, evening/night, variable, never considered. Guilt categories: calm, mild anxiety, strong upset/guilt. Small-task frequency: constant, sometimes, rarely, never. Energy check: always, sometimes, never. Voice use means the corresponding option was selected among add-task channels.

## 3. Frustrations (F)

| Code | Include |
|---|---|
| F1 fragmentation | Separate tools, scattered lists, lost tasks, lack of overview/categorization |
| F2 notifications | Failed/weak reminders, forgotten plan/tasks, desire to be reminded |
| F3 input/usability/custom | Entry effort, clicks, slow/confusing UI, paper/digital friction, colour/customization, progress visibility |
| F4 overload/capacity | Stressful/rigid lists, time underestimation, overload, procrastination |
| F5 priorities | Missing priority/importance/urgency support |
| F6 adoption/habit | Irregular use, lack of routine, boredom, motivation to maintain the tool |

Excluded as `base_no_content`: technical blanks, `nada/none/no`, generic short satisfaction. Excluded as `satisfied_or_nonuser`: explicit absence of frustration, satisfaction without a described problem, or non-use with no problem described. Ambiguous substantive statements remain `other/unclear`.

## 4. Recovery (R)

| Code | Include |
|---|---|
| R1 rest/restore | Rest, sleep, walking, music, recovery, taking time, calming activity |
| R2 postpone/redistribute | Move to another day/time, postpone, distribute over days/week |
| R3 reduce/simplify | Fewer/easier/smaller tasks, decomposition, delegation, reduced goal |
| R4 accept/self-compassion | Permission to rest, listening to body, acceptance, mental-health priority |
| R5 difficulty/shutdown | Shutdown, accumulation, forcing through, inability to reduce, frustration |

Excluded as `base_no_content`: blanks, `no`, `this does not happen`. Excluded as `strategy_free_confirmation`: bare yes/sometimes/rare confirmations without a strategy. `Con música` and `Me tomo mi tiempo` are substantive R1 examples, not exclusions.

## 5. Magic feature (M)

| Code | Include |
|---|---|
| M1 auto-prioritize/schedule | Automatic ordering, prioritization, segmentation, scheduling, rescheduling, conflict handling |
| M2 energy/context/capacity | Energy, mood, fatigue, sleep/concentration, personal capacity, realistic duration |
| M3 reminder/motivation | Reminders, accountability, motivation, gamification, rewards, completion support |
| M4 AI/voice/integration | AI assistant, voice/dictation, email/app/device synchronization and integrations |
| M5 visual/custom/progress | Colour, layout, customization, visual overview, progress/status/charts |
| M6 guidance/planning | Advice, instructions, planning improvement, analysis, realistic planning guidance |

Excluded as `base_no_content`: blanks, no idea, `nada`. Excluded as `satisfied_or_nonuser`: non-use or satisfaction without a feature request.

## 6. Personas and inference

Personas are illustrative design archetypes grounded in Full-166 distributions and recurring themes, not statistical clusters or individual respondents. Segment B is directional because n=19. Open-theme percentages use only the thematic base of that question and cannot be generalized to all 166 respondents.

## 7. Privacy

Generated audits use keys such as `F001`, `R001`, `M001` assigned independently in each question. They contain inclusion status, exclusion reason and codes only. They do not contain source row numbers, Submission IDs, timestamps, emails, free-text answers or demographic combinations.
