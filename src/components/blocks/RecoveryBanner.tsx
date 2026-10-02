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
 * 358x51, r=12, pad 10/16, одна строка fs12/500 ls0.5.
 * - Пустой день: без заливки, обводка #D8BAFB, текст #7B757F (инвайт добавить задачу)
 * - Recovery: fill #EADDFF@25, обводка primary (#6C2EB5), текст on-surface-variant
 * Большой баннер с цитатой из старого макета заменён на эту полоску —
 * она почти не сдвигает контент (51px вместо ~350px).
 */
const RecoveryBanner: React.FC<RecoveryBannerProps> = ({ isWindDown, language, isEmptyDay = false, onAddTask }) => {
  const t = TRANSLATIONS[language];

  return (
    <button
      type="button"
      onClick={onAddTask}
      disabled={!isEmptyDay}
      className="w-full flex items-center text-left md-state-layer md-focus-ring"
      style={{
        minHeight: '51px',
        padding: '10px 16px',
        gap: '8px',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        border: `1px solid ${isEmptyDay ? 'var(--flow-week-leading-fg)' : 'var(--md-sys-color-primary)'}`,
        background: isEmptyDay
          ? 'transparent'
          : 'color-mix(in srgb, var(--md-sys-color-secondary-container) 25%, transparent)',
        cursor: isEmptyDay ? 'pointer' : 'default',
      }}
    >
      <span
        className="truncate"
        style={{
          fontSize: 12,
          fontWeight: 500,
          lineHeight: '16px',
          letterSpacing: '0.5px',
          color: isEmptyDay
            ? 'var(--md-sys-color-outline)'
            : 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        {isEmptyDay ? t.dayWideOpen : t.recoveryCapacityReduced}
      </span>
    </button>
  );
};

export default RecoveryBanner;
