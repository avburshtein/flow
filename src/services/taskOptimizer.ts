import { Task, TimePeriod, TaskWeight, Priority } from '../types';
import { WEIGHT_CONFIG, BLOCK_CAPACITY } from '../constants';

export type OptimizationStrategy = 'balanced' | 'quick-wins' | 'priority-first';

export interface OptimizationOptions {
  currentPeriod?: TimePeriod;
  strategy?: OptimizationStrategy;
}

/**
 * Оптимизирует порядок задач с помощью детерминированного алгоритма.
 * 
 * Алгоритм учитывает:
 * - Приоритет задачи (high/medium/low)
 * - Вес задачи (quick/focused/deep)
 * - Время суток (утро/день/вечер)
 * - Возраст задачи (старые задачи получают бонус)
 * - Выбранную стратегию оптимизации
 */
export const optimizeTasks = (
  tasks: Task[],
  options: OptimizationOptions = {}
): string[] => {
  if (tasks.length === 0) return [];

  const { currentPeriod = TimePeriod.MORNING, strategy = 'balanced' } = options;

  const priorityScore = { high: 3, medium: 2, low: 1 };
  const weightScore = { quick: 1, focused: 3, deep: 6 };

  // Бонусы для времени суток (в Flow-концепции)
  const periodBonus: Record<TimePeriod, Record<TaskWeight, number>> = {
    [TimePeriod.MORNING]: { deep: 3, focused: 2, quick: 1 },
    [TimePeriod.AFTERNOON]: { focused: 3, deep: 2, quick: 1 },
    [TimePeriod.EVENING]: { quick: 3, focused: 2, deep: 1 },
    [TimePeriod.NIGHT]: { quick: 3, focused: 1, deep: 0 }
  };

  // Расчёт скоринга для одной задачи
  const calculateScore = (task: Task): number => {
    // Базовый скоринг: приоритет важнее всего (умножаем на 10)
    let score = priorityScore[task.priority] * 10;

    switch (strategy) {
      case 'quick-wins':
        // Лёгкие задачи получают бонус для быстрых побед
        score += (7 - weightScore[task.weight]) * 5;
        break;

      case 'priority-first':
        // Только приоритет имеет значение
        score += priorityScore[task.priority] * 5;
        break;

      case 'balanced':
      default:
        // Учёт времени суток для Flow-концепции
        const bonus = periodBonus[currentPeriod]?.[task.weight] || 0;
        score += bonus * 3;
        break;
    }

    // Бонус за возраст задачи (чтобы не висели вечно)
    const ageHours = (Date.now() - task.createdAt) / (1000 * 60 * 60);
    score += Math.min(ageHours / 24, 5); // Макс +5 за старые задачи

    return score;
  };

  // Сортировка задач по убыванию скоринга
  const sorted = [...tasks].sort((a, b) => calculateScore(b) - calculateScore(a));

  return sorted.map(t => t.id);
};

/**
 * Получает рекомендуемый вес задачи на основе простых эвристик.
 * Заменяет AI-функцию suggestWeight.
 * 
 * Эвристики:
 * - Ключевые слова для быстрых задач
 * - Ключевые слова для глубоких задач
 * - Длина названия (короткие = проще)
 */
export const suggestWeight = (title: string): TaskWeight => {
  const normalizedTitle = title.toLowerCase().trim();

  // Ключевые слова для quick задач (< 15 мин)
  const quickKeywords = [
    'email', 'почта', 'письмо', 'звонок', 'call', 'sms', 'message', 'сообщение',
    'coffee', 'кофе', 'чай', 'tea', 'break', 'перерыв',
    'check', 'проверить', 'посмотреть', 'glance',
    'quick', 'быстро', 'легко', 'simple', 'простой',
    'оплатить', 'pay', 'bill', 'счет',
    'купить', 'buy', 'магазин', 'shop', 'store',
    'убрать', 'уборка', 'clean', 'tidy',
    'заказать', 'order', 'доставка', 'delivery'
  ];

  // Ключевые слова для deep задач (2+ часа)
  const deepKeywords = [
    'код', 'code', 'разработать', 'develop', 'программ', 'program',
    'дизайн', 'design', 'проект', 'project', 'систем', 'system',
    'исследование', 'research', 'анализ', 'analyze', 'анализировать',
    'написать', 'write', 'статья', 'article', 'книга', 'book', 'глава', 'chapter',
    'изучить', 'study', 'learn', 'курс', 'course', 'экзамен', 'exam',
    'стратег', 'strateg', 'планирован', 'plann', 'roadmap',
    'презентация', 'presentation', 'доклад', 'report',
    'рефактор', 'refactor', 'оптимиз', 'optimiz', 'миграц', 'migrat',
    'тест', 'test', 'testing', 'тестирован',
    'архитектур', 'architect', 'инфраструктур', 'infrastruct'
  ];

  // Проверка на quick задачи
  const hasQuickKeyword = quickKeywords.some(keyword =>
    normalizedTitle.includes(keyword)
  );

  // Проверка на deep задачи
  const hasDeepKeyword = deepKeywords.some(keyword =>
    normalizedTitle.includes(keyword)
  );

  // Эвристика по длине названия
  const isShortTitle = normalizedTitle.length <= 20;
  const isLongTitle = normalizedTitle.length >= 50;

  // Логика принятия решения
  if (hasDeepKeyword && !hasQuickKeyword) {
    return TaskWeight.deep;
  }

  if (hasQuickKeyword && !hasDeepKeyword) {
    return TaskWeight.quick;
  }

  // Если оба или ни одного — используем эвристику длины
  if (isShortTitle) {
    return TaskWeight.quick;
  }

  if (isLongTitle) {
    return TaskWeight.deep;
  }

  // По умолчанию — focused
  return TaskWeight.focused;
};

/**
 * Группирует задачи по матрице Эйзенхауэра.
 * Возвращает задачи в порядке приоритетности.
 */
export const prioritizeEisenhower = (tasks: Task[]): string[] => {
  const quadrants = {
    doFirst: [] as Task[],      // Важно + Срочно (high priority + quick)
    schedule: [] as Task[],     // Важно + Не срочно (high priority)
    delegate: [] as Task[],     // Не важно + Срочно (low priority + quick)
    eliminate: [] as Task[]     // Не важно + Не срочно
  };

  tasks.forEach(task => {
    const isImportant = task.priority === 'high';
    const isUrgent = task.weight === 'quick';

    if (isImportant && isUrgent) {
      quadrants.doFirst.push(task);
    } else if (isImportant) {
      quadrants.schedule.push(task);
    } else if (isUrgent) {
      quadrants.delegate.push(task);
    } else {
      quadrants.eliminate.push(task);
    }
  });

  return [
    ...quadrants.doFirst,
    ...quadrants.schedule,
    ...quadrants.delegate,
    ...quadrants.eliminate
  ].map(t => t.id);
};

/**
 * Вычисляет общее количество баллов для задач в указанном периоде
 */
export const calculatePeriodPoints = (tasks: Task[], period: TimePeriod, date: string): number => {
  return tasks
    .filter(task => task.periods.includes(period) && task.dueDate === date)
    .reduce((sum, task) => sum + WEIGHT_CONFIG[task.weight].points, 0);
};

/**
 * Проверяет, превысит ли добавление задачи вместимость блока
 */
export const wouldExceedCapacity = (
  tasks: Task[],
  period: TimePeriod,
  date: string,
  taskWeight: TaskWeight
): boolean => {
  const currentPoints = calculatePeriodPoints(tasks, period, date);
  console.log(taskWeight)
  const taskPoints = WEIGHT_CONFIG[taskWeight].points;
  return currentPoints + taskPoints > BLOCK_CAPACITY;
};

/**
 * Проверяет, актуален ли период для текущего времени
 * Например, если сейчас вечер, то утро и день уже не актуальны
 */
const isPeriodRelevant = (period: TimePeriod, currentPeriod: TimePeriod): boolean => {
  const periodOrder = [TimePeriod.MORNING, TimePeriod.AFTERNOON, TimePeriod.EVENING];
  const currentIndex = periodOrder.indexOf(currentPeriod);
  const periodIndex = periodOrder.indexOf(period);

  // Период актуален, если он идет ПОСЛЕ текущего или равен ему
  return periodIndex >= currentIndex;
};

/**
 * Находит следующий доступный период/день для задачи
 * Возвращает объект с периодами и датой, или null, если все периоды переполнены
 */
export const findAvailableSlot = (
  tasks: Task[],
  date: string,
  taskWeight: TaskWeight,
  currentPeriod?: TimePeriod,
  currentTime?: Date
): { period: TimePeriod; date: string } | null => {
  console.log('🔍 findAvailableSlot called:', { date, taskWeight, currentPeriod, currentTime });

  // Порядок периодов: Morning -> Afternoon -> Evening
  const periodOrder = [TimePeriod.MORNING, TimePeriod.AFTERNOON, TimePeriod.EVENING];

  // Сначала проверяем текущий день, но только актуальные периоды
  console.log('📅 Checking today:', date);

  if (currentPeriod) {
    // Проверяем только периоды, которые еще не прошли
    const relevantPeriods = periodOrder.filter(p => isPeriodRelevant(p, currentPeriod));
    console.log(`  Relevant periods (current: ${currentPeriod}):`, relevantPeriods);

    for (const period of relevantPeriods) {
      const exceeds = wouldExceedCapacity(tasks, period, date, taskWeight);
      const points = calculatePeriodPoints(tasks, period, date);
      console.log(`  - ${period}: ${points}/${BLOCK_CAPACITY} points, exceeds: ${exceeds}, relevant: ${isPeriodRelevant(period, currentPeriod)}`);

      if (!exceeds) {
        console.log(`✅ Found slot today: ${period}`);
        return { period, date };
      }
    }
  } else {
    // Если currentPeriod не указан, проверяем все периоды
    for (const period of periodOrder) {
      const exceeds = wouldExceedCapacity(tasks, period, date, taskWeight);
      const points = calculatePeriodPoints(tasks, period, date);
      console.log(`  - ${period}: ${points}/${BLOCK_CAPACITY} points, exceeds: ${exceeds}`);

      if (!exceeds) {
        console.log(`✅ Found slot today: ${period}`);
        return { period, date };
      }
    }
  }

  // Если все актуальные периоды сегодня переполнены, проверяем завтра
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log('📅 Checking tomorrow:', tomorrowStr);

  // Начинаем с утра следующего дня
  const morningExceeds = wouldExceedCapacity(tasks, TimePeriod.MORNING, tomorrowStr, taskWeight);
  const morningPoints = calculatePeriodPoints(tasks, TimePeriod.MORNING, tomorrowStr);
  console.log(`  - MORNING tomorrow: ${morningPoints}/${BLOCK_CAPACITY} points, exceeds: ${morningExceeds}`);

  if (!morningExceeds) {
    console.log(`✅ Found slot tomorrow morning: ${TimePeriod.MORNING}`);
    return { period: TimePeriod.MORNING, date: tomorrowStr };
  }

  // Если и утро завтра переполнено, пробуем остальные периоды
  for (const period of [TimePeriod.AFTERNOON, TimePeriod.EVENING]) {
    const exceeds = wouldExceedCapacity(tasks, period, tomorrowStr, taskWeight);
    const points = calculatePeriodPoints(tasks, period, tomorrowStr);
    console.log(`  - ${period} tomorrow: ${points}/${BLOCK_CAPACITY} points, exceeds: ${exceeds}`);

    if (!exceeds) {
      console.log(`✅ Found slot tomorrow ${period}`);
      return { period, date: tomorrowStr };
    }
  }

  // Все переполнено
  console.log('❌ All slots full');
  return null;
};

/**
 * Проверяет и корректирует периоды задачи при переполнении
 * Возвращает:
 * - { periods, date, transferred: true } - если задача перенесена
 * - { periods, date, transferred: false, allFull: true } - если все периоды полны
 * - { periods, date, transferred: false } - если перенос не нужен
 */
export const adjustTaskPeriods = (
  tasks: Task[],
  periods: TimePeriod[],
  date: string,
  taskWeight: TaskWeight,
  currentPeriod?: TimePeriod,
  currentTime?: Date
): {
  periods: TimePeriod[];
  date: string;
  transferred: boolean;
  allFull?: boolean;
} => {
  console.log('🔧 adjustTaskPeriods called:', { periods, date, taskWeight, currentPeriod });

  // Проверяем каждый период задачи
  for (const period of periods) {
    if (period === TimePeriod.NIGHT) continue; // Ночной период не лимитирован

    const exceeds = wouldExceedCapacity(tasks, period, date, taskWeight);
    const points = calculatePeriodPoints(tasks, period, date);

    console.log(`  Checking period ${period}: ${points}/${BLOCK_CAPACITY} points, exceeds: ${exceeds}`);

    if (exceeds) {
      console.log(`  ⚠️ Period ${period} is full! Looking for alternative...`);
      // Этот период переполнен - ищем свободный слот
      const available = findAvailableSlot(tasks, date, taskWeight, currentPeriod, currentTime);

      if (available) {
        // Нашли свободное место
        const isNewDay = available.date !== date;
        console.log(`  ✅ Found alternative: ${available.period} on ${available.date} (new day: ${isNewDay})`);
        return {
          periods: [available.period],
          date: available.date,
          transferred: true
        };
      } else {
        // Все периоды переполнены
        console.log(`  ❌ All periods full!`);
        return { periods, date, transferred: false, allFull: true };
      }
    }
  }

  console.log(`  ✅ All periods have capacity, no transfer needed`);
  // Все выбранные периоды имеют место
  return { periods, date, transferred: false };
};

