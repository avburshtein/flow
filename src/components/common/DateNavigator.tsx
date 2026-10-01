import React, { useRef } from 'react';
import { useButton } from 'react-aria';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { TRANSLATIONS } from '../../constants.tsx';

interface DateNavigatorProps {
  viewDate: Date;
  viewMode: 'day' | 'week' | 'month' | 'year';
  todayStr: string;
  language: keyof typeof TRANSLATIONS;
  isLeftHanded?: boolean;
  onNavigate: (direction: number) => void;
  onToday: () => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({
  viewDate,
  viewMode,
  todayStr,
  language,
  isLeftHanded = false,
  onNavigate,
  onToday,
}) => {
  const { buttonProps: prevProps } = useButton(
    { onPress: () => onNavigate(-1), 'aria-label': TRANSLATIONS[language].prev },
    useRef<HTMLButtonElement>(null)
  );
  const { buttonProps: nextProps } = useButton(
    { onPress: () => onNavigate(1), 'aria-label': TRANSLATIONS[language].next },
    useRef<HTMLButtonElement>(null)
  );
  const { buttonProps: todayProps } = useButton(
    { onPress: onToday, 'aria-label': TRANSLATIONS[language].today },
    useRef<HTMLButtonElement>(null)
  );

  const isToday = todayStr === viewDate.toISOString().split('T')[0];

  // Figma: центрированный заголовок 16px / fw 600 — напр. "Today's Flow, Monday 22"
  const getTitle = () => {
    switch (viewMode) {
      case 'day': {
        const day = viewDate.toLocaleDateString(language, {
          day: 'numeric',
          month: 'long',
        });
        return isToday ? `${TRANSLATIONS[language].todaysFlow}, ${day}` : day;
      }
      case 'week':
        return viewDate.toLocaleDateString(language, { month: 'long', year: 'numeric' });
      case 'month':
        return viewDate.toLocaleDateString(language, { month: 'long', year: 'numeric' });
      case 'year':
        return viewDate.getFullYear().toString();
    }
  };

  const getSubtitle = () => {
    if (viewMode === 'day') {
      return viewDate.toLocaleDateString(language, { weekday: 'long' });
    }
    return TRANSLATIONS[language].upcoming;
  };

  const navButtonStyle: React.CSSProperties = {
    color: 'var(--md-sys-color-on-surface-variant)',
    transition: 'color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
  };

  const chevronBtn = (
    <button
      type="button"
      className="flex items-center justify-center w-11 h-11 md-state-layer md-focus-ring"
      style={navButtonStyle}
      {...prevProps}
    >
      <ChevronLeft size={24} strokeWidth={2} />
    </button>
  );

  const chevronNext = (
    <button
      type="button"
      className="flex items-center justify-center w-11 h-11 md-state-layer md-focus-ring"
      style={navButtonStyle}
      {...nextProps}
    >
      <ChevronRight size={24} strokeWidth={2} />
    </button>
  );

  const todayBtn = (
    <button
      type="button"
      className="flex items-center justify-center w-11 h-11 md-state-layer md-focus-ring"
      style={navButtonStyle}
      {...todayProps}
    >
      <RotateCw size={20} strokeWidth={2} />
    </button>
  );

  // Figma: ‹ [заголовок по центру] › — 390x44
  return (
    <div
      className="flex items-center justify-between h-11 px-2"
      style={{ minHeight: '44px' }}
    >
      {isLeftHanded ? (
        <>
          {todayBtn}
          <div className="flex items-center gap-1">
            {chevronBtn}
            {chevronNext}
          </div>
          <div className="flex-1 text-right">
            <h2
              className="font-semibold"
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: 'var(--md-sys-typescale-title-medium-size)',
                lineHeight: 'var(--md-sys-typescale-title-medium-line-height)',
              }}
            >
              {getTitle()}
            </h2>
            <span
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                opacity: 0.7,
                fontSize: 'var(--md-sys-typescale-label-small-size)',
              }}
            >
              {getSubtitle()}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 text-left">
            <h2
              className="font-semibold"
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: 'var(--md-sys-typescale-title-medium-size)',
                lineHeight: 'var(--md-sys-typescale-title-medium-line-height)',
              }}
            >
              {getTitle()}
            </h2>
            <span
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                opacity: 0.7,
                fontSize: 'var(--md-sys-typescale-label-small-size)',
              }}
            >
              {getSubtitle()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {chevronBtn}
            {todayBtn}
            {chevronNext}
          </div>
        </>
      )}
    </div>
  );
};

export default DateNavigator;
