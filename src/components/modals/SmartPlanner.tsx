import React from 'react';
import { Sparkles, CircleAlert } from 'lucide-react';
import SideSheet from '../common/SideSheet.tsx';
import { TRANSLATIONS, BLOCK_CAPACITY, WEIGHT_CONFIG } from '../../constants.tsx';
import {
  type Task,
  TimePeriod,
  type Language,
  type TimeBlockConfig,
} from '../../types.ts';

interface SmartPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlockConfig[];
  tasks: Task[];
  todayStr: string;
  language: Language;
}

interface BlockLoad {
  blockId: TimePeriod;
  label: string;
  used: number;
  capacity: number;
  free: number;
}

const SmartPlanner: React.FC<SmartPlannerProps> = ({
  isOpen,
  onClose,
  blocks,
  tasks,
  todayStr,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const loads = React.useMemo<BlockLoad[]>(
    () =>
      blocks
        .filter((b) => b.id !== TimePeriod.NIGHT)
        .map((b) => {
          const used = tasks
            .filter((task) => task.dueDate === todayStr && task.periods.includes(b.id))
            .reduce((sum, task) => sum + WEIGHT_CONFIG[task.weight].points, 0);
          return {
            blockId: b.id,
            label: b.label,
            used,
            capacity: BLOCK_CAPACITY,
            free: Math.max(0, BLOCK_CAPACITY - used),
          };
        }),
    [blocks, tasks, todayStr]
  );

  const insight = React.useMemo(() => {
    if (loads.length === 0) return t.smartPlannerEmpty;

    const overload = loads.find((l) => l.used > l.capacity);
    if (overload) {
      return t.smartPlannerOverload
        .replace('{block}', overload.label)
        .replace('{points}', String(overload.used - overload.capacity));
    }

    const empty = loads.find((l) => l.used === 0);
    if (empty) {
      return t.smartPlannerFreeBlock.replace('{block}', empty.label);
    }

    const mostLoaded = [...loads].sort((a, b) => b.used - a.used)[0];
    return t.smartPlannerBalanced.replace('{block}', mostLoaded.label);
  }, [loads, t]);

  const totalUsed = loads.reduce((s, l) => s + l.used, 0);
  const totalCapacity = loads.length * BLOCK_CAPACITY;

  return (
    <SideSheet
      isOpen={isOpen}
      title={t.smartPlanner}
      onClose={onClose}
      items={loads.map((load) => ({
        id: load.blockId,
        label: load.label,
        overline: `${load.used}/${load.capacity} ${t.pts}`,
        supporting: load.free > 0
          ? t.smartPlannerFree.replace('{points}', String(load.free))
          : t.capacityExceeded,
        icon: load.free > 0 ? Sparkles : CircleAlert,
        onClick: undefined,
      }))}
      footer={
        <div className="pt-4 pb-2 flex flex-col gap-3">
          {/* AI insight banner — Figma: r=16, pad 12/16/12/16 */}
          <div
            className="flex items-start gap-2 rounded-2xl px-4 py-3"
            style={{ background: 'var(--md-sys-color-surface-container-high)' }}
          >
            <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--md-sys-color-primary)' }} />
            <span
              style={{
                color: 'var(--md-sys-color-on-surface)',
                fontSize: 'var(--md-sys-typescale-body-medium-size)',
                lineHeight: 'var(--md-sys-typescale-body-medium-line-height)',
              }}
            >
              {insight}
            </span>
          </div>

          {/* Day progress */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span
                className="font-medium"
                style={{
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontSize: 'var(--md-sys-typescale-label-medium-size)',
                }}
              >
                {t.totalLoad}
              </span>
              <span
                className="font-medium"
                style={{
                  color: 'var(--md-sys-color-primary)',
                  fontSize: 'var(--md-sys-typescale-label-medium-size)',
                }}
              >
                {totalUsed}/{totalCapacity} {t.pts}
              </span>
            </div>
            <div
              className="w-full overflow-hidden"
              style={{
                height: '4px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                background: 'var(--md-sys-color-surface)',
                boxShadow: 'inset 0 0 0 0.2px var(--md-sys-color-on-surface-variant)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (totalUsed / totalCapacity) * 100)}%`,
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  background: 'var(--md-sys-color-primary)',
                }}
              />
            </div>
          </div>
        </div>
      }
    />
  );
};

export default SmartPlanner;