import React, { useState, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import { Sparkles, Mic, Settings, Lightbulb, Plus } from 'lucide-react';
import { TRANSLATIONS } from '../../constants.tsx';
import type { PrimaryInputMethod } from '../../types.ts';

/** Figma: боковые кнопки тулбара 52x52 (touch target по Flow calm standard) */
const SIDE_BTN_SX = {
    width: 52,
    height: 52,
    color: 'var(--md-sys-color-on-surface-variant)',
} as const;

interface FlowToolbarProps {
    onSettingsClick: () => void;
    onIdeasClick: () => void;
    onVoiceClick: () => void;
    onAddTaskClick: () => void;
    onSmartPlannerClick: () => void;
    isVoiceListening?: boolean;
    language?: keyof typeof TRANSLATIONS;
    primaryInputMethod?: PrimaryInputMethod;
}

export const FlowToolbar: React.FC<FlowToolbarProps> = ({
    onSettingsClick,
    onIdeasClick,
    onVoiceClick,
    onAddTaskClick,
    onSmartPlannerClick,
    isVoiceListening = false,
    language = 'en',
    primaryInputMethod = 'text',
}) => {
    const t = TRANSLATIONS[language];
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Scroll behavior
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'
                }`}
            style={{
                zIndex: 100,
                background: 'var(--md-sys-color-surface-container)',
                boxShadow: 'var(--md-sys-elevation-shadow-2)',
                transitionTimingFunction: 'var(--md-sys-motion-easing-emphasized-decel)',
            }}
        >
                        {/* Figma Toolbar 390x64: pad 12/16/12/16, 5 слотов evenly spaced,
                FAB строго по центру. Порядок: Planner, Voice, [FAB], Settings, Ideas. */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
                <IconButton onClick={onSmartPlannerClick} aria-label={t.smartPlanner} sx={SIDE_BTN_SX}>
                    <Sparkles size={24} strokeWidth={2} />
                </IconButton>

                <IconButton
                    onClick={onVoiceClick}
                    aria-label={t.voice}
                    aria-pressed={isVoiceListening}
                    sx={{
                        ...SIDE_BTN_SX,
                        color: isVoiceListening
                            ? 'var(--md-sys-color-primary)'
                            : 'var(--md-sys-color-on-surface-variant)',
                    }}
                >
                    <Mic size={24} strokeWidth={2} />
                </IconButton>

                {/* Central FAB — Figma: 56x56, r=12, primary, белая иконка */}
                <button
                    type="button"
                    onClick={onAddTaskClick}
                    aria-label={t.addTask}
                    className="flex items-center justify-center shrink-0"
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        background: 'var(--md-sys-color-primary)',
                        color: 'var(--md-sys-color-on-primary)',
                        boxShadow: 'var(--md-sys-elevation-shadow-2)',
                    }}
                >
                    {primaryInputMethod === 'voice'
                        ? <Mic size={24} strokeWidth={2} />
                        : <Plus size={24} strokeWidth={2.4} />}
                </button>

                <IconButton onClick={onSettingsClick} aria-label={t.settings} sx={SIDE_BTN_SX}>
                    <Settings size={24} strokeWidth={2} />
                </IconButton>

                <IconButton onClick={onIdeasClick} aria-label={t.ideas} sx={SIDE_BTN_SX}>
                    <Lightbulb size={24} strokeWidth={2} />
                </IconButton>
            </div>

            {/* Gesture bar — Figma: 108x4, r=12 */}
            <div className="flex justify-center pb-2 pt-1">
                <div
                    className="rounded-full"
                    style={{
                        width: '108px',
                        height: '4px',
                        background: 'var(--md-sys-color-on-surface)',
                    }}
                />
            </div>
        </div>
    );
};

export default FlowToolbar;