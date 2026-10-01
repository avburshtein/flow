import React from 'react';
import { TimeBlockConfig, TimePeriod, Task, Language } from '../../types.ts';
import { WEIGHT_CONFIG, BLOCK_CAPACITY } from '../../constants.tsx';
import { expandRecurringTasks } from '../../utils/taskCreation.ts';
import TimeBlock from './TimeBlock.tsx';

interface TimeBlockListProps {
  blocks: TimeBlockConfig[];
  activePeriodId: TimePeriod;
  todayStr: string;
  viewDate: Date;
  tasks: Task[];
  collapsedBlocks: Record<string, boolean>;
  language: Language;
  isListView: boolean;
  onQuickAdd: (period: TimePeriod) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onToggleCollapse: (blockId: string) => void;
}

const TimeBlockList: React.FC<TimeBlockListProps> = ({
  blocks,
  activePeriodId,
  todayStr,
  viewDate,
  tasks,
  collapsedBlocks,
  language,
  isListView,
  onQuickAdd,
  onToggle,
  onDelete,
  onUpdate,
  onToggleCollapse
}) => {
  const dateStr = viewDate.toISOString().split('T')[0];

  // Разворачиваем рекуррентные задачи на отображаемую дату
  const visibleTasks = expandRecurringTasks(tasks, dateStr);

  return (
    <div className={isListView ? 'flex flex-col gap-6' : 'grid grid-cols-2 gap-4'}>
      {blocks.map((block) => {
        const isActive = activePeriodId === block.id && todayStr === dateStr;
        const isNight = block.id === TimePeriod.NIGHT;
        const blockTasks = visibleTasks.filter(task => task.periods.includes(block.id) && task.dueDate === dateStr);
        const totalPoints = blockTasks.reduce((sum, task) => sum + WEIGHT_CONFIG[task.weight].points, 0);
        const isOverCapacity = !isNight && totalPoints > BLOCK_CAPACITY;
        const capacityPercent = Math.min(100, (totalPoints / BLOCK_CAPACITY) * 100);
        const blockIndex = blocks.findIndex(b => b.id === block.id);
        const activeIndex = blocks.findIndex(b => b.id === activePeriodId);
        const isPast = todayStr === viewDate.toISOString().split('T')[0] && blockIndex < activeIndex;
        const isCollapsed = collapsedBlocks[block.id] || false;

        return (
          <TimeBlock
            key={block.id}
            block={block}
            isActive={isActive}
            isPast={isPast}
            isNight={isNight}
            tasks={blockTasks}
            totalPoints={totalPoints}
            capacityPercent={capacityPercent}
            isOverCapacity={isOverCapacity}
            onQuickAdd={() => onQuickAdd(block.id)}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdate={onUpdate}
            language={language}
            viewMode={isListView ? 'vertical' : 'grid'}
          />
        );
      })}
    </div>
  );
};

export default TimeBlockList;
