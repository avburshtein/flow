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
  return (
    <div style={{ overflow: 'visible' }}>
      {isRecoveryMode && (
        <RecoveryBanner
          isWindDown={isWindDown}
          currentTime={currentTime}
          language={language}
        />
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
