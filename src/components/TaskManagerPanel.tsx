import React, { useState } from 'react';
import { useButton } from 'react-aria';
import { Trash2, CheckCircle, ListChecks, X } from 'lucide-react';
import { Task, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface TaskManagerPanelProps {
  tasks: Task[];
  language: Language;
  onDeleteAllCompleted: () => void;
  onDeleteAll: () => void;
}

const TaskManagerPanel: React.FC<TaskManagerPanelProps> = ({
  tasks,
  language,
  onDeleteAllCompleted,
  onDeleteAll
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'all' | 'completed' | null>(null);
  const expandRef = React.useRef<HTMLButtonElement>(null);
  const collapseRef = React.useRef<HTMLButtonElement>(null);
  const completedRef = React.useRef<HTMLButtonElement>(null);
  const allRef = React.useRef<HTMLButtonElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const expand = useButton({ onPress: () => setIsExpanded(true) }, expandRef).buttonProps;
  const collapse = useButton({ onPress: () => setIsExpanded(false) }, collapseRef).buttonProps;
  const delCompleted = useButton({ onPress: () => setShowConfirm('completed') }, completedRef).buttonProps;
  const delAll = useButton({ onPress: () => setShowConfirm('all') }, allRef).buttonProps;
  const cancel = useButton({ onPress: () => setShowConfirm(null) }, cancelRef).buttonProps;
  const confirm = useButton({ onPress: () => {
    if (showConfirm === 'all') onDeleteAll(); else onDeleteAllCompleted();
    setShowConfirm(null); setIsExpanded(false);
  } }, confirmRef).buttonProps;

  const t = TRANSLATIONS[language];
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        ref={expandRef}
        {...expand}
        className="w-full min-h-[52px] flex items-center justify-between gap-4 px-4 py-3 rounded-2xl md-state-layer"
        style={{
          background: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--md-sys-color-surface-container-high)' }}
          >
            <ListChecks size={20} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
          </div>
          <div className="text-left">
            <div
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {t.taskManagement}
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.totalTasks}: {stats.total}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-[11px] font-medium"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {t.completed}: {stats.completed}
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: 'var(--md-sys-color-primary)' }}
          >
            {t.active}: {stats.active}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--md-sys-color-surface-container)',
        border: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--md-sys-color-surface-container-high)' }}
          >
            <ListChecks size={20} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.taskManagement}
          </div>
        </div>
        <button
          type="button"
          ref={collapseRef}
          {...collapse}
          aria-label={t.close}
          className="w-[52px] h-[52px] flex items-center justify-center rounded-xl md-state-layer"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center">
        {[
          { value: stats.total, label: t.totalTasks, color: 'var(--md-sys-color-on-surface)' },
          { value: stats.active, label: t.active, color: 'var(--md-sys-color-primary)' },
          { value: stats.completed, label: t.completed, color: 'var(--md-sys-color-on-surface-variant)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3"
            style={{ background: 'var(--md-sys-color-surface-container-high)' }}
          >
            <div className="text-2xl font-semibold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 flex flex-col gap-2">
        {stats.completed > 0 && (
          <button
            type="button"
            ref={completedRef}
            {...delCompleted}
            className="min-h-[52px] w-full px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <CheckCircle size={18} />
            {t.deleteCompleted} ({stats.completed})
          </button>
        )}

        <button
          type="button"
          ref={allRef}
          {...delAll}
          className="min-h-[52px] w-full px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
          style={{
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
          }}
        >
          <Trash2 size={18} />
          {t.deleteAll} ({stats.total})
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgb(var(--md-sys-color-scrim-rgb) / 0.6)' }}
        >
          <div
            className="rounded-3xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200"
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              boxShadow: 'var(--md-sys-elevation-shadow-3)',
            }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {showConfirm === 'all' ? t.confirmDeleteAll : t.confirmDeleteCompleted}
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {showConfirm === 'all' ? t.deleteAllWarning : t.deleteCompletedWarning}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                ref={cancelRef}
                {...cancel}
                className="flex-1 min-h-[52px] rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                ref={confirmRef}
                {...confirm}
                className="flex-1 min-h-[52px] rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                }}
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagerPanel;
