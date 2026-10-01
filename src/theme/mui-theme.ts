import { createTheme, type PaletteOptions, type Theme, type ThemeOptions } from '@mui/material/styles';

// Flow custom colors — доступны через CSS-переменные для кастомных компонентов
export const flowColors = {
    block: {
        morning: 'var(--flow-block-morning)',
        afternoon: 'var(--flow-block-afternoon)',
        evening: 'var(--flow-block-evening)',
        night: 'var(--flow-block-night)',
    },
    weight: {
        quick: 'var(--flow-weight-quick-color)',
        focused: 'var(--flow-weight-focused-color)',
        deep: 'var(--flow-weight-deep-color)',
    },
};

/** Ссылка на M3-токен из tokens.css */
const token = (name: string) => `var(--md-sys-color-${name})`;

const isCssVar = (color: string) => color.startsWith('var(--');

/**
 * MUI IconButton/ButtonBase вызывают theme.alpha(palette.action.active, opacity) в рантайме.
 * systemAlpha() не парсит var(). Используем -rgb каналы из tokens.css или color-mix.
 */
function cssVarAlpha(color: string, coefficient: number | string): string {
    const opacity = typeof coefficient === 'number' ? coefficient : `calc(${coefficient})`;

    const m3 = color.match(/^var\(--md-sys-color-(.+)\)$/);
    if (m3) {
        return `rgb(var(--md-sys-color-${m3[1]}-rgb) / ${opacity})`;
    }

    const flow = color.match(/^var\(--(flow-[^)]+)\)$/);
    if (flow) {
        const mixPercent =
            typeof coefficient === 'number'
                ? `${((1 - coefficient) * 100).toFixed(0)}%`
                : `calc((1 - (${coefficient})) * 100%)`;
        return `color-mix(in srgb, var(--${flow[1]}), transparent ${mixPercent})`;
    }

    return color;
}

function attachFlowColorManipulators(theme: Theme): void {
    const originalAlpha = theme.alpha.bind(theme);

    theme.alpha = (color: string, coefficient: number | string) => {
        if (isCssVar(color)) {
            return cssVarAlpha(color, coefficient);
        }
        return originalAlpha(color, coefficient);
    };

    const originalLighten = theme.lighten.bind(theme);
    theme.lighten = (color: string, coefficient: number) => {
        if (isCssVar(color)) {
            return `color-mix(in srgb, ${color}, white ${(coefficient * 100).toFixed(0)}%)`;
        }
        return originalLighten(color, coefficient);
    };

    const originalDarken = theme.darken.bind(theme);
    theme.darken = (color: string, coefficient: number) => {
        if (isCssVar(color)) {
            return `color-mix(in srgb, ${color}, black ${(coefficient * 100).toFixed(0)}%)`;
        }
        return originalDarken(color, coefficient);
    };
}

/**
 * MUI augmentColor() вызывает lighten/darken/getContrastRatio для main,
 * если не заданы light, dark или contrastText. CSS var() там не парсится.
 * Передаём все четыре поля сразу — MUI просто прокидывает значения в sx/theme.
 */
function channel(main: string, light: string, dark: string, contrastText: string) {
    return { main, light, dark, contrastText };
}

function buildPalette(mode: 'light' | 'dark'): PaletteOptions {
    return {
        mode,
        primary: channel(
            token('primary'),
            token('primary-container'),
            token('primary'),
            token('on-primary'),
        ),
        secondary: channel(
            token('secondary'),
            token('secondary-container'),
            token('secondary'),
            token('on-secondary'),
        ),
        error: channel(
            token('error'),
            token('error-container'),
            token('error'),
            token('on-error'),
        ),
        warning: channel(
            'var(--flow-capacity-overload)',
            'var(--flow-capacity-overload)',
            'var(--flow-capacity-overload)',
            token('on-surface'),
        ),
        info: channel(
            token('secondary'),
            token('secondary-container'),
            token('secondary'),
            token('on-secondary'),
        ),
        success: channel(
            token('tertiary'),
            token('tertiary-container'),
            token('tertiary'),
            token('on-tertiary'),
        ),
        background: {
            default: token('background'),
            paper: token('surface'),
        },
        text: {
            primary: token('on-background'),
            secondary: token('on-surface-variant'),
        },
        divider: token('outline-variant'),
        action: {
            active: token('on-surface-variant'),
            hover: `color-mix(in srgb, ${token('on-surface')} 8%, transparent)`,
            selected: `color-mix(in srgb, ${token('on-surface')} 12%, transparent)`,
            disabled: `color-mix(in srgb, ${token('on-surface')} 38%, transparent)`,
            disabledBackground: `color-mix(in srgb, ${token('on-surface')} 12%, transparent)`,
        },
    };
}

const baseThemeOptions: Omit<ThemeOptions, 'palette'> = {
    typography: {
        fontFamily: '"Inter", system-ui, sans-serif',
        h1: { fontSize: '57px', lineHeight: 1.12, fontWeight: 400 },
        h2: { fontSize: '45px', lineHeight: 1.16, fontWeight: 400 },
        h3: { fontSize: '36px', lineHeight: 1.22, fontWeight: 400 },
        h4: { fontSize: '32px', lineHeight: 1.25, fontWeight: 400 },
        h5: { fontSize: '28px', lineHeight: 1.28, fontWeight: 400 },
        h6: { fontSize: '24px', lineHeight: 1.33, fontWeight: 400 },
        subtitle1: { fontSize: '16px', lineHeight: 1.5, fontWeight: 500 },
        subtitle2: { fontSize: '14px', lineHeight: 1.57, fontWeight: 500 },
        body1: { fontSize: '16px', lineHeight: 1.5, fontWeight: 400 },
        body2: { fontSize: '14px', lineHeight: 1.43, fontWeight: 400 },
        button: { fontSize: '14px', lineHeight: 1.43, fontWeight: 500, textTransform: 'none' },
        caption: { fontSize: '12px', lineHeight: 1.33, fontWeight: 400 },
        overline: { fontSize: '12px', lineHeight: 1.33, fontWeight: 500, textTransform: 'uppercase' },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '9999px',
                    textTransform: 'none',
                },
            },
        },
        MuiFab: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                },
            },
        },
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                filled: {
                    backgroundColor: 'var(--md-sys-color-tertiary-container)',
                    color: 'var(--md-sys-color-on-tertiary-container)',
                },
                colorWarning: {
                    backgroundColor: 'var(--flow-capacity-overload)',
                    color: token('on-surface'),
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: token('background'),
                    color: token('on-background'),
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    color: token('on-surface-variant'),
                    '--IconButton-hoverBg': `rgb(var(--md-sys-color-on-surface-rgb) / ${0.08})`,
                    '&:hover': {
                        backgroundColor: 'var(--IconButton-hoverBg)',
                        '@media (hover: none)': {
                            backgroundColor: 'transparent',
                        },
                    },
                },
            },
        },
        MuiButtonBase: {
            defaultProps: {
                disableRipple: false,
            },
        },
    },
};

export const createMuiTheme = (mode: 'light' | 'dark'): Theme => {
    const theme = createTheme({
        ...baseThemeOptions,
        palette: buildPalette(mode),
    });
    attachFlowColorManipulators(theme);
    return theme;
};

export const muiTheme = createMuiTheme('light');

export default muiTheme;
