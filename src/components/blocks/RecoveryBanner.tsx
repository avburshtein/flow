import React from 'react';
import { TRANSLATIONS } from '../../constants.tsx';

interface RecoveryBannerProps {
  isWindDown: boolean;
  currentTime: Date;
  language: 'en' | 'ru' | 'es';
  /** День без задач — показываем инвайт «день свободен» вместо recovery-текста */
  isEmptyDay?: boolean;
  onAddTask?: () => void;
}

/**
 * Компактный баннер по Figma (ноды 786-22114 и 591-19197):
 * 358x51 (max 52), r=12, pad 10/16, одна строка fs12/500 ls0.5.
 * Три варианта:
 * - Пустой день: без заливки, обводка лаванда, текст outline (инвайт добавить задачу)
 * - Recovery: fill #EADDFF@25, обводка primary, текст on-surface-variant
 * - Wind-down (вечер): тот же recovery-стиль, сокращённая фраза
 */
const RecoveryBanner: React.FC<RecoveryBannerProps> = ({ isWindDown, language, isEmptyDay = false, onAddTask }) => {
  const t = TRANSLATIONS[language];

  const text = isEmptyDay
    ? t.dayWideOpen
    : isWindDown
      ? t.windDownShort
      : t.recoveryCapacityReduced;
  const isInvite = isEmptyDay;

  return (
    <button
      type="button"
      onClick={onAddTask}
      disabled={!isInvite}
      className="w-full flex items-center text-left md-state-layer md-focus-ring"
      style={{
        minHeight: '52px',
        maxHeight: '52px',
        padding: '12px 16px',
        gap: '8px',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        border: `1px solid ${isInvite ? 'var(--flow-week-leading-fg)' : 'var(--md-sys-color-primary)'}`,
        background: isInvite
          ? 'transparent'
          : 'color-mix(in srgb, var(--md-sys-color-secondary-container) 25%, transparent)',
        cursor: isInvite ? 'pointer' : 'default',
      }}
    >
      <span
        className="truncate"
        style={{
          /* M3 label-medium (12/16/500/0.5) — точное совпадение с Figma */
          fontSize: 'var(--md-sys-typescale-label-medium-size)',
          fontWeight: 'var(--md-sys-typescale-label-medium-weight)',
          lineHeight: 'var(--md-sys-typescale-label-medium-line-height)',
          letterSpacing: 'var(--md-sys-typescale-label-medium-letter-spacing)',
          color: isInvite
            ? 'var(--md-sys-color-outline)'
            : 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        {text}
      </span>
    </button>
  );
};

export default RecoveryBanner;
