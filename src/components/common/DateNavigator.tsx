import React, { useRef } from 'react';
import { useButton } from 'react-aria';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '../../constants.tsx';

interface DateNavigatorProps {
  viewDate: Date;
  viewMode: 'day' | 'week' | 'month' | 'year';
  todayStr: string;
  language: keyof typeof TRANSLATIONS;
  onNavigate: (direction: number) => void;
  onToday: () => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({
  viewDate,
  viewMode,
  todayStr,
  language,
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
  const todayRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: todayProps } = useButton(
    { onPress: onToday, 'aria-label': TRANSLATIONS[language].today },
    todayRef
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

  // Figma-скриншот: Week Header 44x390 — во всю ширину экрана.
  // Шевроны 44x44, 18px от краёв, направлены НАРУЖУ (‹ prev слева, › next справа),
  // заголовок по центру одной строкой. Тап по заголовку — вернуться к сегодня.
  return (
    <div
      className="flex items-center justify-between h-11"
      style={{ minHeight: '44px', marginInline: '-16px', paddingInline: '18px' }}
    >
      <div style={{ width: '44px' }}>{chevronBtn}</div>

      <button
        ref={todayRef}
        type="button"
        {...todayProps}
        title={TRANSLATIONS[language].today}
        className="flex-1 text-center truncate md-state-layer md-focus-ring mx-1"
        style={{
          fontWeight: 600,
          color: 'var(--md-sys-color-on-surface-variant)',
          fontSize: '16px', // Figma: fs=16 fw=600 lh=19.36
          lineHeight: '19.36px',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          minHeight: '44px',
        }}
      >
        {getTitle()}
      </button>

      <div style={{ width: '44px' }}>{chevronNext}</div>
    </div>
  );
};

export default DateNavigator;
