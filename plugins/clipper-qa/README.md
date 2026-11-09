# ClipperQA (`plugins/clipper-qa`)

Babel-трансформер помечает JSX атрибутами `data-qa-*` и при необходимости вставляет виджет; сам виджет — React-компонент. Включение — **явным флагом** (`NEXT_PUBLIC_CLIPPER_QA_ENABLED` или `VITE_CLIPPER_QA_ENABLED`), а не через `NODE_ENV`. Рантайм читает пары Next/Vite в **[`clipperQaEnv.ts`](clipperQaEnv.ts)**.

---

## Быстрый старт

1. В `.env` / CI: **`NEXT_PUBLIC_CLIPPER_QA_ENABLED=true`** (или **`VITE_CLIPPER_QA_ENABLED=true`** для Vite; для процесса Babel переменная должна быть в `process.env` при `next dev` / `next build` / `vite build`).
2. В корневом **layout** рендерить `<ClipperQA />` только если включено — например **`clipperQaIsEnabled()`** из `clipperQaEnv.ts` (как в [`src/app/layout.tsx`](../../src/app/layout.tsx) этого репозитория).
3. Для метаданных экспорта (имя/версия приложения, ветка) в Next — см. корневой **[`next.config.ts`](../../next.config.ts)** (`env` + `package.json` / git / CI).

---

## Переменные окружения

Пары **Next** / **Vite**: в коде сначала `NEXT_PUBLIC_CLIPPER_QA_*`, иначе `import.meta.env.VITE_CLIPPER_QA_*`. Для Babel в Node доступен только `process.env`, поэтому флаг включения задайте в окружении процесса сборки.

| Next (приоритет) | Vite (`import.meta.env`) | Назначение |
| ---------------- | ------------------------ | ---------- |
| `NEXT_PUBLIC_CLIPPER_QA_ENABLED` | `VITE_CLIPPER_QA_ENABLED` | **`"true"`** — Babel + виджет. |
| `NEXT_PUBLIC_CLIPPER_QA_ACTION_MODE` | `VITE_CLIPPER_QA_ACTION_MODE` | `default` или **`copyInfo`** (регистр не важен): нижние кнопки. |
| `NEXT_PUBLIC_CLIPPER_QA_STAND_URL` | `VITE_CLIPPER_QA_STAND_URL` | URL стенда в экспорте; иначе `window.location.origin`. |
| `NEXT_PUBLIC_CLIPPER_QA_APP_NAME` | `VITE_CLIPPER_QA_APP_NAME` | Имя приложения в экспорте. |
| `NEXT_PUBLIC_CLIPPER_QA_APP_VERSION` | `VITE_CLIPPER_QA_APP_VERSION` | Версия в экспорте. |
| `NEXT_PUBLIC_CLIPPER_QA_GIT_BRANCH` | `VITE_CLIPPER_QA_GIT_BRANCH` | Ветка в экспорте. |
| `NEXT_PUBLIC_CLIPPER_QA_SEND_TO_AI_URL` | `VITE_CLIPPER_QA_SEND_TO_AI_URL` | Режим **`default`**: POST `{ bugs, context }`. |
| `NEXT_PUBLIC_CLIPPER_QA_WELL_DONE_URL` | `VITE_CLIPPER_QA_WELL_DONE_URL` | Режим **`default`**: POST `{ done: true, context }`. |

> ⚠️ В Vite переменные читаются **только статически** — `import.meta.env.VITE_X`. Динамический доступ (`import.meta.env[key]`, а также `const meta = import.meta; meta.env` или `meta.env[key]`) не инлайнится и даёт `undefined` и в `vite dev`, и в собранном бандле. Поэтому все ключи перечислены явно в `VITE_ENV` внутри [`clipperQaEnv.ts`](clipperQaEnv.ts) — не заменяйте их на универсальный поиск по ключу. После правки `.env.local` перезапускайте dev-сервер: env подхватывается только при старте.

В **`next.config.ts`** при сборке подставляются имя/версия из `package.json` и ветка, если соответствующие переменные не заданы.

Пример `.env.local`:

```bash
NEXT_PUBLIC_CLIPPER_QA_ENABLED=true
NEXT_PUBLIC_CLIPPER_QA_ACTION_MODE=default
# NEXT_PUBLIC_CLIPPER_QA_ACTION_MODE=copyinfo
# NEXT_PUBLIC_CLIPPER_QA_STAND_URL=https://staging.example.com
# NEXT_PUBLIC_CLIPPER_QA_GIT_BRANCH=feature/qa-widget
# NEXT_PUBLIC_CLIPPER_QA_SEND_TO_AI_URL=https://api.example.com/clipper/ai
# NEXT_PUBLIC_CLIPPER_QA_WELL_DONE_URL=https://api.example.com/clipper/done
```

---

## Режимы виджета

- **`default`**: при наличии клипов — кнопка **SEND TO AI** (POST на `SEND_TO_AI_URL`); при пустом списке — **WELL DONE** (POST на `WELL_DONE_URL`). После успешной отправки в ИИ список багов очищается.
- **`copyinfo`**: кнопка **Copy** вместо отправки в ИИ; кнопка «done» не показывается при пустом списке. Текст для Jira — см. следующий раздел.

### API в режиме `default`

Запросы: **`fetch`**, `Content-Type: application/json`, успех по **`response.ok`** (2xx). Если URL не задан, виджет показывает подсказку и не вызывает сеть.

**CORS:** при другом origin API должен отдавать корректные заголовки (`Access-Control-Allow-Origin` и т.д.).

**POST** `SEND_TO_AI_URL`:

```json
{
  "bugs": [
    {
      "id": "string",
      "file": "string",
      "component": "string",
      "classes": "string",
      "description": "string",
      "breakpoint": "Mobile | Desktop"
    }
  ],
  "context": {
    "standUrl": "string",
    "appName": "string",
    "appVersion": "string",
    "gitBranch": "string"
  }
}
```

`context` — результат **`buildClipperExportMeta()`** (модуль [`formatBugsForJira.ts`](formatBugsForJira.ts)).

**POST** `WELL_DONE_URL`:

```json
{
  "done": true,
  "context": {
    "standUrl": "string",
    "appName": "string",
    "appVersion": "string",
    "gitBranch": "string"
  }
}
```

---

## Экспорт в Jira (режим `copyinfo`)

Модуль **`formatBugsForJira.ts`** формирует **Markdown**: блок «Контекст» (стенд, package, ветка) и секции по багам (компонент, файл, breakpoint, классы в code-block, описание). Удобно вставлять в описание задачи в Jira с поддержкой Markdown.

---

## Поведение Babel-плагина

- В исходниках нет лишних `data-qa-*`; они появляются в сборке при включённом флаге. JSX **внутри** `plugins/clipper-qa/` не размечается.
- Если флаг выключен, плагин ничего не меняет.
- Если в entry уже есть импорт или JSX с именем `ClipperQA`, виджет повторно не вставляется.

---

## Next.js — `.babelrc`

```json
{
  "presets": ["next/babel"],
  "plugins": ["./plugins/clipper-qa/index.js"]
}
```

Эквивалент: `"./plugins/clipper-qa/babel-plugin-clipper-qa.js"`.

### Next.js 16 + `next dev` (Turbopack)

Turbopack может иначе учитывать `.babelrc`. Надёжнее: `next dev --webpack` или явное подключение `<ClipperQA />` в `layout.tsx` и флаг `NEXT_PUBLIC_CLIPPER_QA_ENABLED=true` при сборке.

---

## Vite — `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [path.resolve(__dirname, 'plugins/clipper-qa/index.js')],
      },
    }),
  ],
})
```

В окружении процесса задайте **`NEXT_PUBLIC_CLIPPER_QA_ENABLED=true`** или **`VITE_CLIPPER_QA_ENABLED=true`**, чтобы Babel увидел флаг. Путь к плагину — через **`path.resolve`**.

---

## Зависимости для отдельной проверки Babel

```bash
npm install --save-dev @babel/core
```

(`path` — встроенный модуль Node.)

---

## Пример результата трансформации (DOM)

```html
<div class="p-4 shadow" data-qa-component="Card" data-qa-file="src/components/Card.tsx">…</div>
```

---

## Интеграция в приложение

- Импорт из `plugins/clipper-qa/ClipperQA` (или обёртка в `src/components/clipper-qa/ClipperQA.tsx`).
- Условный рендер виджета через **`clipperQaIsEnabled()`**, согласованный с Babel.
- Метаданные для экспорта в Next — корневой **`next.config.ts`**.

---

## Структура каталога

| Файл | Назначение |
| ---- | ---------- |
| **`index.js`** | Точка входа Babel: реэкспорт `babel-plugin-clipper-qa.js`. |
| **`babel-plugin-clipper-qa.js`** | Плагин: `data-qa-*` на JSX вне `plugins/clipper-qa/`; опциональная вставка `<ClipperQA />` в entry. |
| **`ClipperQA.tsx`** | Корневой виджет: композиция хуков и подкомпонентов. |
| **`BugListItem.tsx`** | Строка списка багов. |
| **`ClipperQaCollapsed.tsx`** | Свёрнутое состояние. |
| **`ClipperQaHeader.tsx`** | Шапка панели. |
| **`ClipperQaFooter.tsx`** | Подсказки и нижние кнопки. |
| **`constants.ts`** | Ключи LocalStorage, outline, класс интерактивности виджета. |
| **`domCapture.ts`** | DOM-хелперы и `captureContextFromElement`. |
| **`clipboard.ts`** | `copyTextToClipboard`. |
| **`clipperQaMode.ts`** | `getClipperQaActionMode()`. |
| **`clipperQaApi.ts`** | `postBugsToAi`, `postWellDoneCommand`. |
| **`useClipperQaStorage.ts`** | LocalStorage: expanded / bugs / wellDone. |
| **`useClipperQaHoverOutline.ts`** | Hover-подсветка (Alt / Inspect). |
| **`useClipperQaCapture.ts`** | Перехват кликов для клипа. |
| **`types.ts`** | `ClippedBug`, `ClipperQaActionMode`. |
| **`formatBugsForJira.ts`** | Markdown-экспорт и `buildClipperExportMeta`. |
| **`clipperQaEnv.ts`** | Резолвер env Next / Vite. |
| **`README.md`** | Эта документация. |
