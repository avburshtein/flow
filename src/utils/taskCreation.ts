import { Task, TimePeriod, TaskWeight, Language, Recurrence } from '../types';
import { TRANSLATIONS } from '../constants';
import { adjustTaskPeriods } from '../services/taskOptimizer';

export interface CapacityNotification {
  type: 'transferred' | 'full';
  message: string;
}

const periodNameKeys = {
  [TimePeriod.MORNING]: 'morning',
  [TimePeriod.AFTERNOON]: 'afternoon',
  [TimePeriod.EVENING]: 'evening',
} as const;

function formatShortDate(dateStr: string, language: Language): string {
  const locale = language === 'ru' ? 'ru-RU' : language === 'es' ? 'es-ES' : 'en-US';
  return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function buildTransferMessage(
  title: string,
  periods: TimePeriod[],
  targetDate: string,
  todayStr: string,
  language: Language,
  includeBlockOverflowSuffix: boolean
): string {
  const t = TRANSLATIONS[language];
  const periodName = periods[0]
    ? t[periodNameKeys[periods[0]] as 'morning' | 'afternoon' | 'evening']
    : '';

  if (targetDate !== todayStr) {
    return t.taskTransferredTomorrow
      .replace('{title}', title)
      .replace('{period}', periodName)
      .replace('{date}', formatShortDate(targetDate, language));
  }

  const base = t.taskTransferred
    .replace('{title}', title)
    .replace('{period}', periodName);

  return includeBlockOverflowSuffix ? `${base} ${t.blockOverflow}` : base;
}

export function resolveTaskPlacement(
  tasks: Task[],
  periods: TimePeriod[],
  targetDate: string,
  weight: TaskWeight,
  activePeriodId: TimePeriod,
  currentTime: Date,
  language: Language,
  todayStr: string,
  options: { title: string; includeBlockOverflowSuffix?: boolean } = { title: '' }
): {
  periods: TimePeriod[];
  date: string;
  notification: CapacityNotification | null;
} {
  const periodsToUse = periods.filter((period) => period !== TimePeriod.NIGHT);
  const adjustment = adjustTaskPeriods(
    tasks,
    periodsToUse,
    targetDate,
    weight,
    activePeriodId,
    currentTime
  );

  if (adjustment.transferred) {
    return {
      periods: adjustment.periods,
      date: adjustment.date,
      notification: {
        type: 'transferred',
        message: buildTransferMessage(
          options.title,
          adjustment.periods,
          adjustment.date,
          todayStr,
          language,
          options.includeBlockOverflowSuffix ?? false
        ),
      },
    };
  }

  if (adjustment.allFull) {
    return {
      periods: periodsToUse,
      date: targetDate,
      notification: {
        type: 'full',
        message: TRANSLATIONS[language].allBlocksFull,
      },
    };
  }

  return {
    periods: periodsToUse,
    date: targetDate,
    notification: null,
  };
}

export function createTaskId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Разворачивает рекуррентные задачи на целевую дату.
 *
 * Задача с recurrence != 'none' хранится один раз (в дне её создания) и
 * материализуется в повтор на нужную дату. Источник истины — поле `dueDate`
 * материнской задачи; результат помечается `recurrenceSourceId`, чтобы
 * отслеживать, какие инстансы уже были развёрнуты (и не создавать дубли).
 */
export function expandRecurringTasks(tasks: Task[], targetDate: string): Task[] {
  const onTarget = tasks.filter((task) => task.dueDate === targetDate);
  const generated: Task[] = [];

  for (const task of tasks) {
    if (!task.recurrence || task.recurrence === 'none' || task.recurrence === 'all-blocks') continue;
    if (!task.dueDate) continue;
    if (!matchesRecurrence(task.dueDate, targetDate, task.recurrence)) continue;

    generated.push({
      ...task,
      id: `${task.id}__${targetDate}`,
      dueDate: targetDate,
      completed: false,
      createdAt: Date.now(),
      // сохраняем исходный период, чтобы все инстансы стартовали одинаково
      originalPeriod: task.originalPeriod,
    });
  }

  return [...onTarget, ...generated];
}

function toUtcDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function matchesRecurrence(fromIso: string, toIso: string, recurrence: Recurrence): boolean {
  const from = toUtcDate(fromIso);
  const to = toUtcDate(toIso);
  if (!from || !to) return false;
  if (to.getTime() <= from.getTime()) return false;

  if (recurrence === 'daily') return true;

  if (recurrence === 'weekly') {
    return to.getUTCDay() === from.getUTCDay();
  }

  if (recurrence === 'monthly') {
    return to.getUTCDate() === from.getUTCDate();
  }

  return false;
}
