import React from 'react';
import { Task, Language, TimeBlockConfig } from '../../types.ts';
import { TRANSLATIONS } from '../../constants.tsx';
import { useButton } from 'react-aria';
import { Sunrise, Sun, Sunset, Moon, ChevronRight } from 'lucide-react';

interface WeekViewProps {
  viewDate: Date;
  tasks: Task[];
  settings: unknown;
  todayStr: string;
  language: Language;
  /** Активный блок дня (TimePeriod) — цвет и иконка today-квадратика */
  activePeriodId?: string;
  /** Клик по дню → Day View этой даты */
  onDayClick?: (day: Date) => void;
}

/** Порог нагрузки (pts): градации совпадают с легендой Year View (Less→More, 4 ступени) */
const LOAD_EMPTY = 0;
const LOAD_HIGH = 6;

/** Фраза дня по нагрузке — 4 градации, синхронно с альфой квадратика (легенда Year View) */
const dayLabel = (pts: number, language: Language) => {
  const t = TRANSLATIONS[language];
  if (pts === LOAD_EMPTY) return t.dayEmpty;
  if (pts <= 3) return t.dayLight;
  if (pts <= LOAD_HIGH) return t.dayBalanced;
  return t.dayBusy;
};

/** Альфа leading-квадратика — те же 4 градации, что и фраза (GitHub-style) */
const loadAlpha = (pts: number) =>
  pts === LOAD_EMPTY
    ? 'var(--flow-week-load-empty)'
    : pts <= 3
      ? 'var(--flow-week-load-low)'
      : pts <= LOAD_HIGH
        ? 'var(--flow-week-load-medium)'
        : 'var(--flow-week-load-high)';

/** Вес задачи в pts (дублирует WEIGHT_CONFIG по контракту Figma «N high») */
const taskPts = (w: string) => (w === 'focused' ? 3 : w === 'deep' ? 6 : 1);

/** Иконка активного блока дня — в Week View она есть ТОЛЬКО у today
 *  (подсказывает, какой сейчас блок; остальные дни — чистый heat-map квадратик) */
const ActiveBlockIcon: React.FC<{ period: string }> = ({ period }) => {
  const s = { size: 24, strokeWidth: 2 } as const;
  if (period === 'afternoon') return <Sun {...s} />;
  if (period === 'evening') return <Sunset {...s} />;
  if (period === 'night') return <Moon {...s} />;
  return <Sunrise {...s} />;
};

/** Строка дня — Figma: 358x72, r=12, pad 10/16, gap 12 */
const DayRow: React.FC<{
  day: Date;
  dStr: string;
  isToday: boolean;
  allDayTasks: Task[];
  language: Language;
  onPress: () => void;
  /** Активный блок дня (today) — цвет и иконка квадратика */
  activePeriodId?: string;
  /** Ref на today-строку для scrollIntoView */
  rowRef?: React.RefObject<HTMLButtonElement | null>;
}> = ({ day, dStr, isToday, allDayTasks, language, onPress, activePeriodId, rowRef }) => {
  const localRef = React.useRef<HTMLButtonElement>(null);
  const ref = rowRef ?? localRef;
  const { buttonProps } = useButton({ onPress }, ref);

  // Нагрузка дня в pts — 4 градации, альфа и фраза синхронны (легенда Year View)
  const totalPts = allDayTasks.reduce((sum, tk) => sum + taskPts(tk.weight), 0);
  const highCount = allDayTasks.filter((tk) => tk.priority === 'high').length;
  const activeCount = allDayTasks.filter((tk) => !tk.completed).length;

  // Фраза дня по загрузке (4 градации); у today — какой блок активен сейчас
  const t = TRANSLATIONS[language];
  const label = isToday
    ? t.activeBlockPattern.replace('{block}', t[activePeriodId as keyof typeof t] ?? '')
    : dayLabel(totalPts, language);

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
      {/* Leading: heat-map квадратик 40x40 r=12.
          Остальные дни — насыщенность = нагрузка (легенда Year View).
          Today — цвет контейнера АКТУАЛЬНОГО блока (утро-персик/день-голубой/вечер-лаванда)
          + иконка этого блока. */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          background: isToday
            ? `var(--flow-block-${activePeriodId ?? 'morning'}-container)`
            : `color-mix(in srgb, var(--flow-week-leading-fg) ${loadAlpha(totalPts)}, transparent)`,
          color: isToday
            ? `var(--flow-block-${activePeriodId ?? 'morning'}-on-container)`
            : 'var(--flow-week-leading-fg)',
        }}
      >
        {isToday && <ActiveBlockIcon period={activePeriodId ?? 'morning'} />}
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

const WeekView: React.FC<WeekViewProps> = ({ viewDate, tasks, todayStr, language, activePeriodId, onDayClick }) => {
  // Figma: неделя с понедельника (MO 22 … SU 28)
  const startOfWeek = new Date(viewDate);
  const dow = (viewDate.getDay() + 6) % 7; // 0 = Monday
  startOfWeek.setDate(viewDate.getDate() - dow);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Today не должен уползать за тулбар (воскресенье без скролла не видно).
  // Порядок строк НЕ меняем (ментальная модель недели), просто при монтировании
  // и смене недели аккуратно докручиваем today в зону видимости.
  const todayRowRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    todayRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [todayStr, viewDate]);

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
            activePeriodId={activePeriodId}
            onPress={() => onDayClick?.(day)}
            rowRef={dStr === todayStr ? todayRowRef : undefined}
          />
        );
      })}
    </div>
  );
};

export default WeekView;
