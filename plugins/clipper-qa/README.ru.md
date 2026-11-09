# ClipperQA (`plugins/clipper-qa`)

The Babel transformer marks JSX with `data-qa-*` attributes and injects the widget if necessary; the widget itself is a React component. Activation is handled via an **explicit flag** (`NEXT_PUBLIC_CLIPPER_QA_ENABLED` or `VITE_CLIPPER_QA_ENABLED`) rather than `NODE_ENV`. The runtime resolves Next/Vite environment pairs in **[`clipperQaEnv.ts`](https://www.google.com/search?q=clipperQaEnv.ts)**.

-----

## Quick Start

1.  Set the flag in `.env` / CI: **`NEXT_PUBLIC_CLIPPER_QA_ENABLED=true`** (or **`VITE_CLIPPER_QA_ENABLED=true`** for Vite; for the Babel process, the variable must be in `process.env` during `next dev` / `next build` / `vite build`).
2.  Render `<ClipperQA />` in the root **layout** only if enabled—for example, using **`clipperQaIsEnabled()`** from `clipperQaEnv.ts` (as seen in [`src/app/layout.tsx`](https://www.google.com/search?q=../../src/app/layout.tsx) of this repository).
3.  For export metadata (app name/version, branch) in Next, refer to the root **[`next.config.ts`](https://www.google.com/search?q=../../next.config.ts)** (`env` + `package.json` / git / CI).

-----

## Environment Variables

Next / Vite pairs: the code prioritizes `NEXT_PUBLIC_CLIPPER_QA_*`, then falls back to `import.meta.env.VITE_CLIPPER_QA_*`. For Babel in Node, only `process.env` is available, so set the activation flag in the build process environment.

| Next (Priority) | Vite (`import.meta.env`) | Purpose |
| ---------------- | ------------------------ | ---------- |
| `NEXT_PUBLIC_CLIPPER_QA_ENABLED` | `VITE_CLIPPER_QA_ENABLED` | **`"true"`** — Enables Babel + widget. |
| `NEXT_PUBLIC_CLIPPER_QA_ACTION_MODE` | `VITE_CLIPPER_QA_ACTION_MODE` | `default` or **`copyInfo`** (case-insensitive): controls bottom buttons. |
| `NEXT_PUBLIC_CLIPPER_QA_STAND_URL` | `VITE_CLIPPER_QA_STAND_URL` | Stand URL in export; otherwise `window.location.origin`. |
| `NEXT_PUBLIC_CLIPPER_QA_APP_NAME` | `VITE_CLIPPER_QA_APP_NAME` | App name in export. |
| `NEXT_PUBLIC_CLIPPER_QA_APP_VERSION` | `VITE_CLIPPER_QA_APP_VERSION` | Version in export. |
| `NEXT_PUBLIC_CLIPPER_QA_GIT_BRANCH` | `VITE_CLIPPER_QA_GIT_BRANCH` | Branch in export. |
| `NEXT_PUBLIC_CLIPPER_QA_SEND_TO_AI_URL` | `VITE_CLIPPER_QA_SEND_TO_AI_URL` | **`default`** mode: POST `{ bugs, context }`. |
| `NEXT_PUBLIC_CLIPPER_QA_WELL_DONE_URL` | `VITE_CLIPPER_QA_WELL_DONE_URL` | **`default`** mode: POST `{ done: true, context }`. |

> ⚠️ In Vite the vars are read **statically only** — `import.meta.env.VITE_X`. Dynamic access (`import.meta.env[key]`, or `const meta = import.meta; meta.env` / `meta.env[key]`) is never inlined and yields `undefined` in both `vite dev` and the built bundle. That is why all keys are listed explicitly in `VITE_ENV` inside `clipperQaEnv.ts` — do not replace them with a generic key lookup. Restart the dev server after editing `.env.local`: env is picked up only on start.

In **`next.config.ts`**, the app name/version from `package.json` and the git branch are injected during build if corresponding variables are not set.

Example `.env.local`:

```bash
NEXT_PUBLIC_CLIPPER_QA_ENABLED=true
NEXT_PUBLIC_CLIPPER_QA_ACTION_MODE=default
# NEXT_PUBLIC_CLIPPER_QA_ACTION_MODE=copyinfo
# NEXT_PUBLIC_CLIPPER_QA_STAND_URL=https://staging.example.com
# NEXT_PUBLIC_CLIPPER_QA_GIT_BRANCH=feature/qa-widget
# NEXT_PUBLIC_CLIPPER_QA_SEND_TO_AI_URL=https://api.example.com/clipper/ai
# NEXT_PUBLIC_CLIPPER_QA_WELL_DONE_URL=https://api.example.com/clipper/done
```

-----

## Widget Modes

  - **`default`**: if clips exist—**SEND TO AI** button (POST to `SEND_TO_AI_URL`); if list is empty—**WELL DONE** button (POST to `WELL_DONE_URL`). The bug list is cleared after a successful send to AI.
  - **`copyinfo`**: **Copy** button instead of sending to AI; the "done" button is not shown for empty lists. For Jira text, see the next section.

### API in `default` Mode

Requests: **`fetch`**, `Content-Type: application/json`, success determined by **`response.ok`** (2xx). If the URL is not set, the widget shows a hint and does not make a network call.

**CORS:** For different origins, the API must provide correct headers (`Access-Control-Allow-Origin`, etc.).

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

`context` is the result of **`buildClipperExportMeta()`** (from module [`formatBugsForJira.ts`](https://www.google.com/search?q=formatBugsForJira.ts)).

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

-----

## Jira Export (`copyinfo` mode)

The **`formatBugsForJira.ts`** module generates **Markdown**: a "Context" block (stand, package, branch) and sections for each bug (component, file, breakpoint, classes in a code-block, description). This is convenient for pasting into Jira task descriptions that support Markdown.

-----

## Babel Plugin Behavior

  - Source files do not contain extra `data-qa-*` attributes; they are added during build when the flag is enabled. JSX **inside** `plugins/clipper-qa/` is not processed.
  - If the flag is disabled, the plugin makes no changes.
  - If the entry file already contains an import or JSX named `ClipperQA`, the widget will not be re-injected.

-----

## Next.js — `.babelrc`

```json
{
  "presets": ["next/babel"],
  "plugins": ["./plugins/clipper-qa/index.js"]
}
```

Equivalent to: `"./plugins/clipper-qa/babel-plugin-clipper-qa.js"`.

### Next.js 16 + `next dev` (Turbopack)

Turbopack may handle `.babelrc` differently. For reliability: use `next dev --webpack` or explicitly connect `<ClipperQA />` in `layout.tsx` with `NEXT_PUBLIC_CLIPPER_QA_ENABLED=true` set during build.

-----

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

Set **`NEXT_PUBLIC_CLIPPER_QA_ENABLED=true`** or **`VITE_CLIPPER_QA_ENABLED=true`** in the process environment so Babel detects the flag. Use **`path.resolve`** for the plugin path.

-----

## Dependencies for Manual Babel Check

```bash
npm install --save-dev @babel/core
```

(`path` is a built-in Node module).

-----

## Example Transformation Result (DOM)

```html
<div class="p-4 shadow" data-qa-component="Card" data-qa-file="src/components/Card.tsx">…</div>
```

-----

## Application Integration

  - Import from `plugins/clipper-qa/ClipperQA` (or a wrapper in `src/components/clipper-qa/ClipperQA.tsx`).
  - Conditional rendering of the widget via **`clipperQaIsEnabled()`**, consistent with Babel.
  - Metadata for Next export—root **`next.config.ts`**.

-----

## Directory Structure

| File | Purpose |
| ---- | ---------- |
| **`index.js`** | Babel entry point: re-exports `babel-plugin-clipper-qa.js`. |
| **`babel-plugin-clipper-qa.js`** | Plugin: adds `data-qa-*` to JSX outside `plugins/clipper-qa/`; optional `<ClipperQA />` injection in entry. |
| **`ClipperQA.tsx`** | Root widget: composition of hooks and sub-components. |
| **`BugListItem.tsx`** | Bug list row. |
| **`ClipperQaCollapsed.tsx`** | Collapsed state. |
| **`ClipperQaHeader.tsx`** | Panel header. |
| **`ClipperQaFooter.tsx`** | Hints and bottom buttons. |
| **`constants.ts`** | LocalStorage keys, outline styles, widget interactivity class. |
| **`domCapture.ts`** | DOM helpers and `captureContextFromElement`. |
| **`clipboard.ts`** | `copyTextToClipboard`. |
| **`clipperQaMode.ts`** | `getClipperQaActionMode()`. |
| **`clipperQaApi.ts`** | `postBugsToAi`, `postWellDoneCommand`. |
| **`useClipperQaStorage.ts`** | LocalStorage: expanded / bugs / wellDone. |
| **`useClipperQaHoverOutline.ts`** | Hover highlighting (Alt / Inspect). |
| **`useClipperQaCapture.ts`** | Click interception for clipping. |
| **`types.ts`** | `ClippedBug`, `ClipperQaActionMode`. |
| **`formatBugsForJira.ts`** | Markdown export and `buildClipperExportMeta`. |
| **`clipperQaEnv.ts`** | Next / Vite environment resolver. |
| **`README.md`** | This documentation. |