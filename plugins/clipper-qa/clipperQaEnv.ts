/**
 * Unified reading of public env vars: Next (`NEXT_PUBLIC_CLIPPER_QA_*`)
 * or Vite (`import.meta.env.VITE_CLIPPER_QA_*`).
 *
 * ⚠️ Bundlers inline ONLY static member expressions:
 *   - Vite: `import.meta.env.VITE_X`. Dynamic access (`import.meta.env[key]`)
 *     is never replaced and stays `undefined` both in `vite dev` and in the
 *     production bundle (the browser has no `import.meta.env` object).
 *   - Next/webpack: the same applies to `process.env.NEXT_PUBLIC_X`.
 * That is why every key is spelled out explicitly in `VITE_ENV` below instead
 * of a generic `(import.meta.env as Record<string, string>)[key]` lookup.
 *
 * For each key both sources are listed explicitly so Next can inline
 * `process.env.NEXT_PUBLIC_*` at build time.
 */

type EnvValue = string | boolean | undefined;

/**
 * Static `import.meta.env` reads — do NOT refactor into a dynamic lookup.
 * Missing keys are harmless: Vite resolves them to `undefined`.
 */
const VITE_ENV: Record<string, EnvValue> = {
    VITE_CLIPPER_QA_ENABLED: import.meta.env.VITE_CLIPPER_QA_ENABLED,
    VITE_CLIPPER_QA_ACTION_MODE: import.meta.env.VITE_CLIPPER_QA_ACTION_MODE,
    VITE_CLIPPER_QA_STAND_URL: import.meta.env.VITE_CLIPPER_QA_STAND_URL,
    VITE_CLIPPER_QA_APP_NAME: import.meta.env.VITE_CLIPPER_QA_APP_NAME,
    VITE_CLIPPER_QA_APP_VERSION: import.meta.env.VITE_CLIPPER_QA_APP_VERSION,
    VITE_CLIPPER_QA_GIT_BRANCH: import.meta.env.VITE_CLIPPER_QA_GIT_BRANCH,
    VITE_CLIPPER_QA_SEND_TO_AI_URL: import.meta.env.VITE_CLIPPER_QA_SEND_TO_AI_URL,
    VITE_CLIPPER_QA_WELL_DONE_URL: import.meta.env.VITE_CLIPPER_QA_WELL_DONE_URL,
};

function viteString(key: string): string | undefined {
    const v = VITE_ENV[key];
    return typeof v === 'string' ? v : undefined;
}

/**
 * Reads a Next-style var lazily and only where a real `process.env` exists.
 * The getter keeps the member expression static (so it can be inlined by
 * Next/webpack) while staying safe in the browser, where `process` is absent.
 */
function nextString(read: () => string | undefined): string | undefined {
    if (typeof process === 'undefined' || !process.env) return undefined;
    return read();
}

function trimOrEmpty(s: string | undefined): string {
    return (s ?? '').trim();
}

function firstNonEmpty(
    ...candidates: (string | undefined)[]
): string | undefined {
    for (const c of candidates) {
        const t = trimOrEmpty(c);
        if (t.length) return t;
    }
    return undefined;
}

/** Whether the ClipperQA layer is enabled (Babel + widget in a typical setup). */
export function clipperQaIsEnabled(): boolean {
    const flag = firstNonEmpty(
        nextString(() => process.env.NEXT_PUBLIC_CLIPPER_QA_ENABLED),
        viteString('VITE_CLIPPER_QA_ENABLED'),
    );

    return (flag ?? '').toLowerCase() === 'true';
}

/** Raw footer action mode (`default`, `copyInfo`, …). */
export function clipperQaActionModeRaw(): string {
    return (
        firstNonEmpty(
            nextString(() => process.env.NEXT_PUBLIC_CLIPPER_QA_ACTION_MODE),
            viteString('VITE_CLIPPER_QA_ACTION_MODE'),
        ) ?? ''
    );
}

export function clipperQaStandUrlEnv(): string | undefined {
    return firstNonEmpty(
        nextString(() => process.env.NEXT_PUBLIC_CLIPPER_QA_STAND_URL),
        viteString('VITE_CLIPPER_QA_STAND_URL'),
    );
}

export function clipperQaAppNameEnv(): string | undefined {
    return firstNonEmpty(
        nextString(() => process.env.NEXT_PUBLIC_CLIPPER_QA_APP_NAME),
        viteString('VITE_CLIPPER_QA_APP_NAME'),
    );
}

export function clipperQaAppVersionEnv(): string | undefined {
    return firstNonEmpty(
        nextString(() => process.env.NEXT_PUBLIC_CLIPPER_QA_APP_VERSION),
        viteString('VITE_CLIPPER_QA_APP_VERSION'),
    );
}

export function clipperQaGitBranchEnv(): string | undefined {
    return firstNonEmpty(
        nextString(() => process.env.NEXT_PUBLIC_CLIPPER_QA_GIT_BRANCH),
        viteString('VITE_CLIPPER_QA_GIT_BRANCH'),
    );
}

/** POST endpoint for default mode: bugs + context to AI. */
export function clipperQaSendToAiUrl(): string | undefined {
    return firstNonEmpty(
        nextString(() => process.env.NEXT_PUBLIC_CLIPPER_QA_SEND_TO_AI_URL),
        viteString('VITE_CLIPPER_QA_SEND_TO_AI_URL'),
    );
}

/** POST endpoint for default mode: WELL DONE command + context. */
export function clipperQaWellDoneUrl(): string | undefined {
    return firstNonEmpty(
        nextString(() => process.env.NEXT_PUBLIC_CLIPPER_QA_WELL_DONE_URL),
        viteString('VITE_CLIPPER_QA_WELL_DONE_URL'),
    );
}
