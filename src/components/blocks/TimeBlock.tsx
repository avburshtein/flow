import React from 'react';
import { TimeBlockConfig, TimePeriod, Task, Language } from '../../types.ts';
import { BLOCK_CAPACITY, TRANSLATIONS } from '../../constants.tsx';
import TaskItem from '../TaskItem.tsx';
import BubbleBlock from './BubbleBlock.tsx';
import { getIcon } from '../../constants.tsx';

interface TimeBlockProps {
  block: TimeBlockConfig;
  isActive: boolean;
  isPast: boolean;
  isNight: boolean;
  tasks: Task[];
  totalPoints: number;
  capacityPercent: number;
  isOverCapacity: boolean;
  onQuickAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  language: Language;
  viewMode?: 'grid' | 'vertical';
}

const TimeBlock: React.FC<TimeBlockProps> = ({
  block,
  isActive,
  isPast,
  isNight,
  tasks,
  totalPoints,
  capacityPercent,
  isOverCapacity,
  onQuickAdd,
  onToggle,
  onDelete,
  onUpdate,
  language,
  viewMode = 'grid',
}) => {
  const t = TRANSLATIONS[language];
  const periodId = block.id;
  const containerColor = `var(--flow-block-${periodId}-container)`;
  const onContainerColor = `var(--flow-block-${periodId}-on-container)`;
  const seedColor = `var(--flow-block-${periodId}-seed)`;
  const seedOnColor = `var(--flow-block-${periodId}-seed-on)`;
  const borderColor = `var(--flow-block-${periodId}-border)`;

  return (
    <section
      className={`relative p-0 ${viewMode === 'vertical' ? 'min-h-[228px] h-auto' : 'h-[228px]'} flex flex-col overflow-hidden`}
      style={{
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        background: containerColor,
        // Figma: активный блок получает обводку outline + усиленную тень (elevation-3)
        border: isActive ? '1px solid var(--md-sys-color-outline)' : '1px solid transparent',
        boxShadow: isActive
          ? 'var(--md-sys-elevation-shadow-3)'
          : 'var(--md-sys-elevation-shadow-1)',
        animation: `block-appear 250ms var(--md-sys-motion-easing-emphasized-decel) both`,
      } as React.CSSProperties}
    >
      {/* Header Rows — Figma: pad 16/16/8/16, gap 4 между строками */}
      <div className="flex flex-col gap-1 px-4 pt-4 pb-2">
        {/* Row 1: Time range (11px/500) + Capacity (12px/500), вся группа opacity 0.7 */}
        <div
          className="flex justify-between items-center w-full"
          style={{ opacity: 0.7 }}
        >
          <span
            className="font-medium whitespace-nowrap"
            style={{
              color: onContainerColor,
              fontSize: 'var(--md-sys-typescale-label-small-size)',
              lineHeight: 'var(--md-sys-typescale-label-small-line-height)',
            }}
          >
            {block.startTime} – {block.endTime}
          </span>
          {!isNight && (
            <span
              className="font-medium whitespace-nowrap"
              style={{
                color: onContainerColor,
                fontSize: 'var(--md-sys-typescale-label-medium-size)',
                lineHeight: 'var(--md-sys-typescale-label-medium-line-height)',
              }}
            >
              {totalPoints}/{BLOCK_CAPACITY} pts
            </span>
          )}
        </div>

        {/* Row 2: Block title — Figma: 22px / weight 500 / letter-spacing -0.5 */}
        <span
          className="font-medium"
          style={{
            color: onContainerColor,
            fontSize: 'var(--md-sys-typescale-title-large-size)',
            lineHeight: 'var(--md-sys-typescale-title-large-line-height)',
            letterSpacing: 'var(--md-sys-typescale-title-large-letter-spacing)',
          }}
        >
          {block.label}
        </span>
      </div>

      {/* Capacity Linear — Figma: h=4px, r=full, bg #fff, stroke on-container 0.2px */}
      {!isNight && (
        <div className="px-4">
          <div
            className="w-full overflow-hidden"
            style={{
              height: '4px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              background: 'var(--md-sys-color-surface)',
              boxShadow: `inset 0 0 0 0.2px ${onContainerColor}`,
            }}
          >
            <div
              className="h-full ease-md-standard"
              style={{
                width: `${isOverCapacity ? 100 : capacityPercent}%`,
                borderRadius: 'var(--md-sys-shape-corner-full)',
                background: isOverCapacity ? 'var(--flow-capacity-overload)' : seedColor,
                transition: 'width var(--md-sys-motion-duration-medium-2) var(--md-sys-motion-easing-standard)',
              }}
            />
          </div>
        </div>
      )}

      {/* Content Slot */}
      <div className="flex-1 relative overflow-visible w-full">
        {isNight ? (
          <div className="flex items-center justify-center h-full px-4">
            <p
              className="text-center"
              style={{
                color: onContainerColor,
                opacity: 0.5,
                fontSize: 'var(--md-sys-typescale-body-medium-size)',
                lineHeight: 'var(--md-sys-typescale-body-medium-line-height)',
              }}
            >
              {t.windDownSpace}
            </p>
          </div>
        ) : tasks.length > 0 ? (
          viewMode === 'grid' ? (
            <BubbleBlock
              tasks={tasks}
              isRecoveryMode={false}
              blockId={block.id}
              onBubbleClick={onToggle}
            />
          ) : (
            <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
              {tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  lang={language}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
            <div style={{ opacity: 0.08 }}>
              {block.id === TimePeriod.MORNING && getIcon('sunrise', 'w-8 h-8')}
              {block.id === TimePeriod.AFTERNOON && getIcon('sun', 'w-8 h-8')}
              {block.id === TimePeriod.EVENING && getIcon('sunset', 'w-8 h-8')}
            </div>
            <p
              className="text-center"
              style={{
                color: onContainerColor,
                opacity: 0.5,
                fontSize: 'var(--md-sys-typescale-body-medium-size)',
                lineHeight: 'var(--md-sys-typescale-body-medium-line-height)',
              }}
            >
              {t.noTasksScheduled}
            </p>
          </div>
        )}
      </div>

      {/* Inline slot for overflow helper — pre-reserved to avoid layout shift */}
      {isOverCapacity && (
        <div className="px-4 pb-3">
          <p
            className="text-center font-medium"
            style={{
              color: onContainerColor,
              opacity: 0.8,
              fontSize: 'var(--md-sys-typescale-label-small-size)',
              lineHeight: 'var(--md-sys-typescale-label-small-line-height)',
            }}
          >
            {t.capacityExceeded}
          </p>
        </div>
      )}
    </section>
  );
};

export default TimeBlock;