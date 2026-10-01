import React from 'react';
import { TimePeriod, Task, Language, UserSettings } from '../../types.ts';

interface WeekViewProps {
  viewDate: Date;
  tasks: Task[];
  settings: UserSettings;
  todayStr: string;
  language: Language;
}

const WeekView: React.FC<WeekViewProps> = ({ viewDate, tasks, todayStr, language }) => {
  const startOfWeek = new Date(viewDate);
  startOfWeek.setDate(viewDate.getDate() - viewDate.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const dStr = day.toISOString().split('T')[0];
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const dayTasks = tasks.filter((t) => t.dueDate === dStr);
        const isToday = dStr === todayStr;

        return (
          <div
            key={dStr}
            className={`p-3 flex gap-3 ${isWeekend ? 'opacity-90' : ''}`}
            style={{
              borderRadius: 'var(--md-sys-shape-corner-large)',
              padding: '12px 16px',
              background: 'var(--md-sys-color-surface-container)',
            }}
          >
            <div
              className="w-20 text-center py-2 flex-shrink-0"
              style={{
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                background: isToday ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                color: isToday ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                border: isToday ? '1px solid var(--md-sys-color-primary)' : '1px solid transparent',
              }}
            >
              <span className="md-typescale-label-small block">{day.toLocaleDateString(language, { weekday: 'short' })}</span>
              <span className="md-typescale-title-medium">{day.getDate()}</span>
            </div>
            <div className="flex-1 flex gap-2">
              {[TimePeriod.MORNING, TimePeriod.AFTERNOON, TimePeriod.EVENING].map((p) => (
                <div
                  key={p}
                  className="flex-1 h-12 flex items-center justify-center p-1 gap-0.5"
                  style={{
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                  }}
                >
                  {dayTasks
                    .filter((t) => t.periods.includes(p))
                    .map((t) => (
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
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekView;
