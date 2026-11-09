import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Babel (unlike the app runtime) runs in Node and sees only `process.env`,
 * while the QA flag usually lives in `.env.local`. Forward it so the Babel
 * plugin and `clipperQaIsEnabled()` agree on the same value.
 */
function forwardClipperQaEnv(env: Record<string, string>): void {
    for (const key of [
        'VITE_CLIPPER_QA_ENABLED',
        'NEXT_PUBLIC_CLIPPER_QA_ENABLED',
        'NEXT_PUBLIC_CLIPPER_QA_ACTION_MODE',
        'NEXT_PUBLIC_CLIPPER_QA_STAND_URL',
        'NEXT_PUBLIC_CLIPPER_QA_GIT_BRANCH',
        'NEXT_PUBLIC_CLIPPER_QA_SEND_TO_AI_URL',
        'NEXT_PUBLIC_CLIPPER_QA_WELL_DONE_URL',
    ]) {
        const value = env[key];
        if (value !== undefined && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

export default defineConfig(({ mode }) => {
    forwardClipperQaEnv(loadEnv(mode, process.cwd(), ''));

    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [
            react({
                babel: {
                    plugins: [
                        path.resolve(__dirname, 'plugins/clipper-qa/index.cjs'),
                    ],
                },
            }),
            tailwindcss(),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            },
        },
    };
});
