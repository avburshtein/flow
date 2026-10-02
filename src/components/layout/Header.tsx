import React, { useRef } from 'react';
import { useButton } from 'react-aria';
import { Leaf } from 'lucide-react';
import { TRANSLATIONS } from '../../constants.tsx';
import { IconRows, IconGridScan } from '../ui/figmaIcons.tsx';

interface HeaderProps {
  currentTime: Date;
  user: { name: string } | null;
  language: keyof typeof TRANSLATIONS;
  /** Доля выполненных задач дня, 0..1 — для кольцевого индикатора */
  progress?: number;
  isListView: boolean;
  /** Recovery Mode активен (баннер + ёмкость 10) */
  isRecoveryMode?: boolean;
  onToggleView: () => void;
  onToggleRecovery: () => void;
}

/** Кольцевой индикатор прогресса — Figma: 52x52, track + «50%» fs=11/500 */
const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const R = 20;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
      <svg viewBox="0 0 48 48" width={52} height={52} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle
          cx="24" cy="24" r={R}
          fill="none"
          stroke="var(--md-sys-color-secondary-container)"
          strokeWidth="4"
        />
        <circle
          cx="24" cy="24" r={R}
          fill="none"
          stroke="var(--md-sys-color-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: 'stroke-dashoffset var(--md-sys-motion-duration-long2) var(--md-sys-motion-easing-standard)' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-medium"
        style={{ fontSize: 'var(--md-sys-typescale-label-small-size)', color: 'var(--md-sys-color-on-surface)' }}
      >
        {pct}%
      </span>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({
  currentTime,
  user,
  language,
  progress = 0,
  isListView,
  isRecoveryMode = false,
  onToggleView,
  onToggleRecovery,
}) => {
  const t = TRANSLATIONS[language];

  const leafRef = useRef<HTMLButtonElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: leafProps } = useButton(
    { onPress: onToggleRecovery, 'aria-pressed': isRecoveryMode, 'aria-label': t.recoveryMode },
    leafRef
  );
  const { buttonProps: viewProps } = useButton(
    { onPress: onToggleView, 'aria-pressed': isListView, 'aria-label': isListView ? t.gridView : t.listView },
    viewRef
  );

  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return t.goodMorning;
    if (hours < 17) return t.goodAfternoon;
    if (hours < 21) return t.goodEvening;
    return t.goodNight;
  };

  // Figma: заголовок 33px / fw 600 / lh 40 / ls -0.4, цвет primary
  return (
    <header className="flex items-start self-stretch px-6 pb-1 gap-[10px]">
      <div className="flex flex-col flex-1 min-w-0">
        <h1
          className="m-0 font-semibold"
          style={{
            fontSize: '33px',
            lineHeight: '40px',
            letterSpacing: '-0.4px',
            color: 'var(--md-sys-color-primary)',
          }}
        >
          {getGreeting()}, {user?.name.split(' ')[0]}
        </h1>
      </div>

      {/* Container buttons & progress — Figma: VERTICAL gap=10, 114x114 */}
      <div className="flex flex-col shrink-0" style={{ gap: '10px' }}>
        {/* Buttons 114x52: листик Recovery (квадрат r=12) + переключатель вида (круг r=100) */}
        <div className="flex items-center" style={{ gap: '10px' }}>
          <button
            ref={leafRef}
            type="button"
            {...leafProps}
            aria-label={t.recoveryMode}
            className="flex items-center justify-center md-state-layer md-focus-ring"
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              color: isRecoveryMode
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-on-surface)',
            }}
          >
            <Leaf size={22} strokeWidth={2} />
          </button>

          <button
            ref={viewRef}
            type="button"
            {...viewProps}
            aria-label={isListView ? t.gridView : t.listView}
            className="flex items-center justify-center md-state-layer md-focus-ring"
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {isListView
              ? <IconGridScan size={22} strokeWidth={2} />
              : <IconRows size={22} strokeWidth={2} />}
          </button>
        </div>

        <ProgressRing value={progress} />
      </div>
    </header>
  );
};

export default Header;