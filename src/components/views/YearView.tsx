import React, { useRef } from 'react';
import { useButton } from 'react-aria';
import { Task } from '../../types.ts';
import { WEIGHT_CONFIG } from '../../constants.tsx';

interface YearViewProps {
  viewDate: Date;
  tasks: Task[];
  language: 'en' | 'ru' | 'es';
  todayStr: string;
  onMonthClick: (month: number) => void;
}

// Figma Node 285-17183: 4 градации heat — та же легенда, что Month/Week.
// Токены --flow-week-load-* едины для Week, Month и Year.
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

const YearView: React.FC<YearViewProps> = ({
  viewDate,
  tasks,
  language,
  todayStr,
  onMonthClick,
}) => {
  const year = viewDate.getFullYear();
  const locale = language === 'ru' ? 'ru-RU' : language === 'es' ? 'es-ES' : 'en-US';

  // Figma: неделя с понедельника. Короткие дни через Intl (Mo..Su), 8px.
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const probe = new Date(2024, 0, 8 + i); // 2024-01-08 — понедельник
    return probe.toLocaleDateString(locale, { weekday: 'short' });
  });

  // Нагрузка дня: сумма весов задач (4 градации, синхрон Week/Month).
  const dayPoints = (dStr: string): number =>
    tasks
      .filter((t) => t.dueDate === dStr && !t.completed)
      .reduce((s, t) => s + WEIGHT_CONFIG[t.weight].points, 0);

  return (
    <div className="flex flex-col" style={{ gap: '12px' }}>
      {/* Заголовок с шевронами рисует DateNavigator в App (единый для month/year).
          Здесь только годовой календарь + легенда. */}
      {/* Figma «Годовой календарь 2026» 358×466 r=12: 4 квартала друг под другом,
          внутри квартала 3 месяца в ряд (gap 6), карточка месяца без заливки,
          ячейка дня 17×13 r=4, heat #AE73F9 по 4 градациям. */}
      <div
        className="flex flex-col"
        style={{
          borderRadius: '12px',
          gap: '12px',
          padding: '4px',
        }}
      >
        {[0, 1, 2, 3].map((q) => (
          <div key={q} className="grid grid-cols-3" style={{ gap: '6px' }}>
            {[0, 1, 2].map((c) => {
              const m = q * 3 + c;
              return (
                <MiniMonth
                  key={m}
                  year={year}
                  month={m}
                  locale={locale}
                  weekdayLabels={weekdayLabels}
                  todayStr={todayStr}
                  dayPoints={dayPoints}
                  onMonthClick={onMonthClick}
                />
              );
            })}
          </div>
        ))}
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

// Мини-месяц — топ-уровень: стабильный тип, иначе 12 карточек
// размонтируются при каждом рендере года. Заголовок (11px) —
// кнопка drill-down в Month; сетка 7 колонок, ячейка 13px r=4.
interface MiniMonthProps {
  year: number;
  month: number;
  locale: string;
  weekdayLabels: string[];
  todayStr: string;
  dayPoints: (dStr: string) => number;
  onMonthClick: (month: number) => void;
}

function MiniMonth({ year: y, month: m, locale, weekdayLabels, todayStr, dayPoints, onMonthClick }: MiniMonthProps) {
    const monthDate = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const leadingBlanks = (monthDate.getDay() + 6) % 7;
    const monthLabel = monthDate.toLocaleDateString(locale, { month: 'short' });
    const monthLong = monthDate.toLocaleDateString(locale, { month: 'long' });
    const headerRef = useRef<HTMLButtonElement>(null);
    const { buttonProps: headerProps } = useButton(
      { onPress: () => onMonthClick(m), 'aria-label': monthLong },
      headerRef,
    );

    return (
      <div
        className="flex flex-col"
        style={{ padding: '4px 0 4px 0', gap: '2px', minWidth: 0 }}
      >
        <button
          ref={headerRef}
          type="button"
          {...headerProps}
          aria-label={`Open ${monthLong}`}
          className="md-state-layer md-focus-ring"
          style={{
            borderRadius: '4px',
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '11px',
            fontWeight: 500,
            lineHeight: '16px',
            textAlign: 'left',
            minHeight: '24px',
          }}
        >
          {monthLabel}
        </button>
        <div className="grid grid-cols-7" style={{ gap: '1px' }}>
          {weekdayLabels.map((d, i) => (
            <div
              key={i}
              aria-hidden="true"
              style={{
                height: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '8px',
                lineHeight: '10px',
              }}
            >
              {d.slice(0, 2)}
            </div>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`empty-${i}`} style={{ height: '13px' }} />
          ))}
          {Array.from({ length: daysInMonth }, (_, d) => {
            const date = new Date(y, m, d + 1);
            const off = date.getTimezoneOffset();
            const dStr = new Date(date.getTime() - off * 60000).toISOString().split('T')[0];
            const isToday = dStr === todayStr;
            // Heat — только реальная активность в прошлом: есть задачи И дата <= сегодня.
            // Пустая ячейка — transparent, без заливки вообще (даже «Less»).
            const pts = dStr <= todayStr ? dayPoints(dStr) : 0;
            const hasActivity = pts > 0;
            const level = loadLevel(pts);
            // Figma: обычный день r=4 с heat-заливкой; сегодня — строгий круг ⌀13
            // #6C538C поверх heat (left/top 50% + translate — без эллипса), белый жирный текст.
            return (
              <div
                key={d}
                aria-hidden="true"
                style={{
                  position: 'relative',
                  height: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  background: hasActivity
                    ? `color-mix(in srgb, var(--flow-week-leading-fg) ${LOAD_TOKENS[level]}, transparent)`
                    : 'transparent',
                  color: isToday ? '#FFFFFF' : 'var(--md-sys-color-on-surface)',
                  fontSize: '8px',
                  fontWeight: isToday ? 600 : 400,
                  lineHeight: '10px',
                }}
              >
                {isToday && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: '13px',
                      height: '13px',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '999px',
                      background: 'var(--flow-week-today-circle)',
                    }}
                  />
                )}
                <span style={{ position: 'relative' }}>{d + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
}

export default YearView;
