import React from 'react';
import { Task, Language, UserSettings } from '../../types.ts';
import { useButton } from 'react-aria';
import { Sunrise, Sun, Sunset, CupSoda, ChevronRight } from 'lucide-react';

interface WeekViewProps {
  viewDate: Date;
  tasks: Task[];
  settings: UserSettings;
  todayStr: string;
  language: Language;
}

/** Порог «высокой» нагрузки дня (pts) для supporting-текста «N high» */
const HIGH_LOAD_THRESHOLD = 6;

/** Иконка ведущего квадрата по типу дня — Figma: Morning/Work Balance/Busy day/Rest day */
const DayIcon: React.FC<{ label: string }> = ({ label }) => {
  const s = { size: 24, strokeWidth: 2 } as const;
  if (label.startsWith('Rest')) return <CupSoda {...s} />;
  if (label.startsWith('Busy')) return <Sun {...s} />;
  if (label.startsWith('Work')) return <Sunset {...s} />;
  return <Sunrise {...s} />;
};

/** Вес задачи в pts (дублирует WEIGHT_CONFIG по контракту Figma «N high») */
const taskPts = (w: string) => (w === 'focused' ? 3 : w === 'deep' ? 6 : 1);

/** Строка дня — Figma: 358x72, r=12, pad 10/16, gap 12 */
const DayRow: React.FC<{
  day: Date;
  dStr: string;
  isToday: boolean;
  allDayTasks: Task[];
  language: Language;
  onPress: () => void;
}> = ({ day, dStr, isToday, allDayTasks, language, onPress }) => {
  const ref = React.useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton({ onPress }, ref);

  // Нагрузка дня в pts → альфа leading-иконки (Figma: 5/10/20%)
  const totalPts = allDayTasks.reduce((sum, tk) => sum + taskPts(tk.weight), 0);
  const loadVar =
    totalPts > HIGH_LOAD_THRESHOLD
      ? 'var(--flow-week-load-high)'
      : totalPts > 0
        ? 'var(--flow-week-load-medium)'
        : 'var(--flow-week-load-low)';

  const highCount = allDayTasks.filter((tk) => tk.priority === 'high').length;
  const activeCount = allDayTasks.filter((tk) => !tk.completed).length;

  // Тип дня по нагрузке (Figma-варианты leading-иконок)
  const label = isToday
    ? 'Today'
    : totalPts > HIGH_LOAD_THRESHOLD
      ? 'Busy day'
      : totalPts > 0
        ? 'Work Balance'
        : 'Rest day';

  const weekdayShort = day
    .toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' })
    .toUpperCase();

  return (
    <button
      ref={ref}
      {...buttonProps}
      className="w-full flex items-center text-left md-state-layer md-focus-ring"
      style={{
        minHeight: '72px',
        padding: '10px 16px',
        gap: '12px',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        background: isToday
          ? 'var(--md-sys-color-surface-container)'
          : 'var(--md-sys-color-surface-container-low)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {/* Leading: иконка 40x40 r=12; today — персик, остальные — лаванда с альфой по нагрузке */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          background: isToday
            ? 'var(--flow-week-leading-today-bg)'
            : `color-mix(in srgb, var(--flow-week-leading-fg) ${loadVar}, transparent)`,
          color: isToday ? 'var(--flow-week-leading-today-fg)' : 'var(--flow-week-leading-fg)',
        }}
      >
        <DayIcon label={label} />
      </div>

      {/* Content: label fs16/400 + supporting fs14/400 «N high · N задач» */}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{ fontSize: 16, fontWeight: 400, lineHeight: '24px', letterSpacing: '0.5px', color: 'var(--md-sys-color-on-surface)' }}
        >
          {label}
        </div>
        <div
          className="truncate"
          style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', letterSpacing: '0.25px', color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {highCount} high · {activeCount} {language === 'ru' ? 'задач' : 'tasks'}
        </div>
      </div>

      {/* Trailing: «MO\n22»; today — число в круге 32x32 (Figma #6C538C) */}
      <div className="shrink-0 flex items-center" style={{ gap: '8px' }}>
        {isToday ? (
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              background: 'var(--flow-week-today-circle)',
            }}
          >
            <span style={{ color: 'var(--md-sys-color-on-primary)', fontSize: 14, fontWeight: 500, lineHeight: '20px' }}>
              {day.getDate()}
            </span>
          </div>
        ) : (
          <div
            className="flex flex-col items-center"
            style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', letterSpacing: '0.1px', color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            <span>{weekdayShort}</span>
            <span>{day.getDate()}</span>
          </div>
        )}
        <ChevronRight size={20} strokeWidth={2} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
      </div>
    </button>
  );
};

const WeekView: React.FC<WeekViewProps> = ({ viewDate, tasks, todayStr, language }) => {
  // Figma: неделя с понедельника (MO 22 … SU 28)
  const startOfWeek = new Date(viewDate);
  const dow = (viewDate.getDay() + 6) % 7; // 0 = Monday
  startOfWeek.setDate(viewDate.getDate() - dow);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="flex flex-col" style={{ gap: '12px' }}>
      {days.map((day) => {
        const dStr = day.toISOString().split('T')[0];
        const allDayTasks = tasks.filter((tk) => tk.dueDate === dStr);
        return (
          <DayRow
            key={dStr}
            day={day}
            dStr={dStr}
            isToday={dStr === todayStr}
            allDayTasks={allDayTasks}
            language={language}
            onPress={() => {}}
          />
        );
      })}
    </div>
  );
};

export default WeekView;
