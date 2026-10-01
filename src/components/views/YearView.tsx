import React from 'react';
import { Task } from '../../types.ts';

interface YearViewProps {
  viewDate: Date;
  tasks: Task[];
  language: 'en' | 'ru' | 'es';
}

const YearView: React.FC<YearViewProps> = ({ viewDate, tasks, language }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 12 }, (_, m) => {
        const monthDate = new Date(viewDate.getFullYear(), m, 1);
        const daysInMonth = new Date(viewDate.getFullYear(), m + 1, 0).getDate();
        const startDay = new Date(viewDate.getFullYear(), m, 1).getDay();

        return (
          <div
            key={m}
            className="p-3 space-y-2"
            style={{
              borderRadius: 'var(--md-sys-shape-corner-large)',
              padding: '12px',
              background: 'var(--md-sys-color-surface-container)',
            }}
          >
            <span className="md-typescale-label-small block text-center flow-text-muted">
              {monthDate.toLocaleDateString(language, { month: 'long' })}
            </span>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="w-2 h-2" />
              ))}
              {Array.from({ length: daysInMonth }, (_, d) => {
                const dStr = new Date(viewDate.getFullYear(), m, d + 1).toISOString().split('T')[0];
                const hasTasks = tasks.some((t) => t.dueDate === dStr);
                return (
                  <div
                    key={d}
                    className="w-2 h-2 flex items-center justify-center md-typescale-label-small rounded-full"
                    style={{
                      background: hasTasks ? 'var(--md-sys-color-primary)' : 'transparent',
                      color: hasTasks
                        ? 'var(--md-sys-color-on-primary)'
                        : 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    {d + 1}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default YearView;
