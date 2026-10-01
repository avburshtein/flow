import React from 'react';
import { Task, Language } from '../../types.ts';

interface MonthViewProps {
  viewDate: Date;
  tasks: Task[];
  settings: { language: Language };
  todayStr: string;
  onDayClick: (day: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ viewDate, tasks, settings, todayStr, onDayClick }) => {
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const currentMonthDays = Array.from({ length: endOfMonth.getDate() }, (_, i) => {
    const d = new Date(startOfMonth);
    d.setDate(i + 1);
    return d;
  });

  // Локализованные дни недели через Intl (было: хардкод 'Sun','Mon',…)
  const locale = settings.language === 'ru' ? 'ru-RU' : settings.language === 'es' ? 'es-ES' : 'en-US';
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const probe = new Date(2024, 0, 7 + i); // 2024-01-07 — воскресенье
    return probe.toLocaleDateString(locale, { weekday: 'short' });
  });

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((d, i) => (
          <div
            key={i}
            className="md-typescale-label-small text-center py-2"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {currentMonthDays.map((day) => {
          const dStr = day.toISOString().split('T')[0];
          const isToday = dStr === todayStr;
          const dayTasks = tasks.filter((t) => t.dueDate === dStr);

          return (
            <button
              type="button"
              key={dStr}
              onClick={() => onDayClick(day)}
              className="aspect-square p-1 flex flex-col items-center justify-between transition-all cursor-pointer md-state-layer"
              style={{
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                background: isToday
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-surface-container)',
                color: isToday ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                boxShadow: isToday ? 'var(--md-sys-elevation-shadow-2)' : undefined,
              }}
            >
              <span className="md-typescale-label-medium font-bold">{day.getDate()}</span>
              <div className="flex flex-wrap gap-0.5 justify-center">
                {dayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: t.completed
                        ? 'var(--md-sys-color-outline)'
                        : 'var(--md-sys-color-primary)',
                    }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
