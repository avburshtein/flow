import React from 'react';
import { TimePeriod, Task, Language, TimeBlockConfig } from '../../types.ts';
import RecoveryBanner from '../blocks/RecoveryBanner.tsx';
import TimeBlockList from '../blocks/TimeBlockList.tsx';
import TaskSheet from '../modals/TaskSheet.tsx';

interface DayViewProps {
  isRecoveryMode: boolean;
  isWindDown: boolean;
  isListView: boolean;
  currentTime: Date;
  dynamicBlocks: TimeBlockConfig[];
  activePeriodId: TimePeriod;
  todayStr: string;
  viewDate: Date;
  tasks: Task[];
  collapsedBlocks: Record<string, boolean>;
  language: Language;
  isTaskSheetOpen?: boolean;
  onCloseTaskSheet?: () => void;
  onTaskAdd: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onQuickAdd: (period: TimePeriod) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onToggleCollapse: (blockId: string) => void;
  onDeleteAllCompleted: () => void;
  onDeleteAll: () => void;
}

const DayView: React.FC<DayViewProps> = ({
  isRecoveryMode,
  isWindDown,
  isListView,
  currentTime,
  dynamicBlocks,
  activePeriodId,
  todayStr,
  viewDate,
  tasks,
  collapsedBlocks,
  language,
  isTaskSheetOpen = false,
  onCloseTaskSheet,
  onTaskAdd,
  onQuickAdd,
  onToggle,
  onDelete,
  onUpdate,
  onToggleCollapse,
  onDeleteAllCompleted,
  onDeleteAll,
}) => {
  // Figma 786-22114: пустой день — компактный инвайт-баннер вместо пустой сетки
  const isDayEmpty = tasks.length === 0;

  return (
    <div style={{ overflow: 'visible' }}>
      {/* Figma 786-22114 / 591-19197: компактный баннер 51px — инвайт на пустой день
          или уведомление Recovery. Больше не съедает экран (было ~350px с цитатой). */}
      {/* Figma 786-22114: гапы 12px сверху и снизу баннера (main content gap=12) */}
      {(isRecoveryMode || isDayEmpty) && (
        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
          <RecoveryBanner
            isWindDown={isWindDown}
            currentTime={currentTime}
            language={language}
            isEmptyDay={!isRecoveryMode && isDayEmpty}
            onAddTask={isDayEmpty && !isRecoveryMode ? () => onQuickAdd(activePeriodId) : undefined}
          />
        </div>
      )}

      {/* Figma: панели Task Manager под свитчером нет — блоки идут сразу */}
      <TimeBlockList
        blocks={dynamicBlocks}
        activePeriodId={activePeriodId}
        todayStr={todayStr}
        viewDate={viewDate}
        tasks={tasks}
        collapsedBlocks={collapsedBlocks}
        language={language}
        isRecoveryMode={isRecoveryMode}
        isListView={isListView}
        onQuickAdd={onQuickAdd}
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onToggleCollapse={onToggleCollapse}
      />

      <TaskSheet
        isOpen={isTaskSheetOpen}
        onClose={onCloseTaskSheet || (() => { })}
        onTaskAdd={onTaskAdd}
        activePeriodId={activePeriodId}
        tasks={tasks}
        currentTime={currentTime}
        language={language}
      />
    </div>
  );
};

export default DayView;
