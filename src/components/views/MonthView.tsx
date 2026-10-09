import React, { useRef } from 'react';
import { useButton } from 'react-aria';
import { Task, Language } from '../../types.ts';
import { WEIGHT_CONFIG } from '../../constants.tsx';

interface MonthViewProps {
  viewDate: Date;
  tasks: Task[];
  settings: { language: Language };
  todayStr: string;
  onDayClick: (day: Date) => void;
}

// Figma Node 285-17083: heat-насыщенность дня = легенда Year View.
// 4 градации синхронны с --flow-week-load-*: пусто→low→medium→high.
const LOAD_TOKENS = [
  'var(--flow-week-load-empty)',
  'var(--flow-week-load-low)',
  'var(--flow-week-load-medium)',
  'var(--flow-week-load-high)',
] as const;

function loadLevel(totalPts: number): number {
  if (totalPts <= 0) return 0;
  if (totalPts <= 3) return 1;
  if (totalPts <= 6) return 2;
  return 3;
}

// Локальная дата YYYY-MM-DD без сдвига в UTC (toISOString ломается в +TZ).
function toLocalDateStr(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
}

const MonthView: React.FC<MonthViewProps> = ({
  viewDate,
  tasks,
  settings,
  todayStr,
  onDayClick,
}) => {

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Figma: неделя с понедельника (Mo…Su). getDay(): 0=Su … 6=Sa → сдвиг в Mo-first.
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  // Локализованные дни недели через Intl (Mo-first). figma: Mo, Tu, We, Th, Fr, Sa, Su.
  const locale = settings.language === 'ru' ? 'ru-RU' : settings.language === 'es' ? 'es-ES' : 'en-US';
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const probe = new Date(2024, 0, 8 + i); // 2024-01-08 — понедельник
    return probe.toLocaleDateString(locale, { weekday: 'short' });
  });

  // Нагрузка дня: сумма весов задач (тот же порог, что Week/Year — 4 градации).
  const dayPoints = (dStr: string): number =>
    tasks
      .filter((t) => t.dueDate === dStr && !t.completed)
      .reduce((s, t) => s + WEIGHT_CONFIG[t.weight].points, 0);

  return (
    <div className="flex flex-col" style={{ gap: '12px' }}>
      {/* Заголовок с шевронами рисует DateNavigator в App (единый для month/year).
          Здесь только сетка: дни недели + Calendar Grid + легенда. */}
      <div className="flex flex-col" style={{ gap: '16px' }}>
        {/* Figma «Days of week»: 7 колонок 44px, текст label-medium/500 on-surface-variant. */}
        <div className="grid grid-cols-7" style={{ gap: '8px' }}>
          {weekdayLabels.map((d, i) => (
            <div
              key={i}
              className="text-center"
              style={{
                width: '44px',
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: 'var(--md-sys-typescale-label-medium-size)',
                fontWeight: 500,
                lineHeight: '20px',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Figma «Calendar Grid»: ряды 44px, row-gap 12. Ячейка 44×44 r=12 —
            heat #AE73F9 только при реальной активности (есть задачи в прошлом).
            Пустая дата — вообще без фона (transparent), а не «свотч Less».
            Сегодня — круг r=22, заливка #6C538C, текст белый. Точек-маркеров нет. */}
        <div className="grid grid-cols-7" style={{ gap: '8px', rowGap: '12px' }}>
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`empty-${i}`} style={{ width: '44px', height: '44px' }} />
          ))}
          {currentMonthDays.map((day) => {
            const dStr = toLocalDateStr(day);
            const isToday = dStr === todayStr;
            // Heat — только реальная активность в прошлом: есть задачи И дата <= сегодня.
            // Пустая дата — hasActivity=false → transparent, без заливки вообще.
            const pts = dStr <= todayStr ? dayPoints(dStr) : 0;
            const hasActivity = pts > 0;
            const level = loadLevel(pts);

            return (
              <MonthDayButton
                key={dStr}
                day={day}
                isToday={isToday}
                level={level}
                hasActivity={hasActivity}
                onPress={() => onDayClick(day)}
              />
            );
          })}
        </div>
      </div>

      {/* Figma «Heatmap Legend»: Less [4 свотча 12×12 r=2] More, label-small, gap 6. */}
      <div className="flex items-center justify-center" style={{ gap: '6px' }}>
        <span
          style={{
            color: 'var(--md-sys-color-on-surface-variant)',
            fontSize: 'var(--md-sys-typescale-label-small-size)',
          }}
        >
          Less
        </span>
        {LOAD_TOKENS.map((tok, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: `color-mix(in srgb, var(--flow-week-leading-fg) ${tok}, transparent)`,
            }}
          />
        ))}
        <span
          style={{
            color: 'var(--md-sys-color-on-surface-variant)',
            fontSize: 'var(--md-sys-typescale-label-small-size)',
          }}
        >
          More
        </span>
      </div>
    </div>
  );
};

function MonthDayButton({
  day,
  isToday,
  level,
  hasActivity,
  onPress,
}: {
  day: Date;
  isToday: boolean;
  level: number;
  hasActivity: boolean;
  onPress: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton({ onPress }, ref);
  // Исключение из правила 48px touch (§1 ui-rules): календарная сетка 7×44 —
  // ячейки физически 44×44, drill-down жестом, не точным тапом.
  return (
    <button
      ref={ref}
      type="button"
      {...buttonProps}
      aria-label={day.toLocaleDateString()}
      aria-current={isToday ? 'date' : undefined}
      className="flex items-center justify-center md-state-layer md-focus-ring"
      style={{
        width: '44px',
        height: '44px',
        // Figma: обычный день r=12, сегодня — круг r=22 (⌀44).
        borderRadius: isToday ? '22px' : '12px',
        background: isToday
          ? 'var(--flow-week-today-circle)'
          : hasActivity
            ? `color-mix(in srgb, var(--flow-week-leading-fg) ${LOAD_TOKENS[level]}, transparent)`
            : 'transparent',
        color: isToday ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
        fontSize: 'var(--md-sys-typescale-label-large-size)',
        fontWeight: 500,
        lineHeight: '20px',
      }}
    >
      {day.getDate()}
    </button>
  );
}

export default MonthView;
