// Figma 98:15937 «Task cards» + 259:18260 «Day View Vertical».
// Вертикальная карточка задачи 326x56: вес-пилюля + чекбокс 48 + заголовок
// + правый слот по приоритету. Grid 2x2 не трогаем — там BubbleBlock.
import React, { useRef } from 'react';
import { useButton, useFocusRing } from 'react-aria';
import { Task, Language, TaskWeight } from '../../types.ts';
import { WEIGHT_CONFIG } from '../../constants.tsx';
import { suggestIconName, getTaskIconByName } from '../../services/iconSuggester.ts';

interface TaskCardProps {
  task: Task;
  lang: Language;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onEditTask?: (task: Task) => void;
}

// === Волна high-приоритета (точная геометрия Figma, нода 458:16709) ===
// Тело карточки = «Rectangle 6» (326×56): белая вуаль 25% + обводка #79590c.
// Левый край волнистый (впадины x=0, гребни x=4.21), правый — прямой r=12.
// Карточка РЕЗИНОВАЯ (родитель flex), поэтому:
//   • правый край + top/bottom-бордер — нативный CSS (r=12 не «ездит»);
//   • волна слева — фиксированный SVG-оверлей (viewBox 1:1, без масштаба);
//   • фон+top/bottom обрезаются clip-path (правый край пути = 99999, чтобы
//     clip не зависел от ширины и не трогал нативный border-radius r=12).
//
// Левый волновой контур (открытый путь): верхняя стыковка (5.86,0.5) →
// нижняя (7.33,55.5). Концы сдвинуты на 0.5px ВНУТРЬ, чтобы stroke (по
// центру пути, width 1) занимал y∈[0,1] и y∈[55,56] — в точности как
// CSS-бордер карточки (тоже внутри элемента) → стык волна↔бордер бесшовный.
const WAVY_LEFT_STROKE =
  'M5.86 0.5C4.08 0.5 2.19 0.87 1.23 1.87C0.57 2.88 0 4.37 0 6.5C0 11.5 4.21 11 4.21 17.5C4.21 22 0 24 0 28.5C0 35 4.21 35 4.21 39.5C4.21 45 0 45.5 0 49.5C0 50.7 0.28 51.77 0.68 52.67C1.77 54.65 4.62 55.5 7.33 55.5';
// Clip-path карточки: полный контур Rectangle 6 (волна слева + прямой
// правый/верх/низ). Правый край = 99999 → clip не зависит от ширины.
const WAVY_CARD_CLIP =
  'M1.23 1.87C2.19 0.37 4.08 0 5.86 0H99999V56H7.33C4.62 56 1.77 55.15 0.68 52.67C0.28 51.77 0 50.7 0 49.5C0 45.5 4.21 45 4.21 39.5C4.21 35 0 35 0 28.5C0 24 4.21 22 4.21 17.5C4.21 11 0 11.5 0 6.5C0 4.37 0.57 2.88 1.23 1.87Z';
// Clip-path ярлыка-тинта (24px): волна слева + прямой правый край x=24
// (labale-fill обрезан фреймом labale). Та же геометрия волны.
const WAVY_TINT_CLIP =
  'M5.86 0H24V56H7.33C4.62 56 1.77 55.15 0.68 52.67C0.28 51.77 0 50.7 0 49.5C0 45.5 4.21 45 4.21 39.5C4.21 35 0 35 0 28.5C0 24 4.21 22 4.21 17.5C4.21 11 0 11.5 0 6.5C0 4.37 0.57 2.88 1.23 1.87C2.19 0.37 4.08 0 5.86 0Z';

// Весовые цвета по спеке Task cards:
// - тело карточки: белый #FFFFFF 25% (вуаль, пигмент только в ярлыке);
// - обводка: отдельный stroke-цвет (#79590c для focused);
// - иконка/текст: weight-on (#5d4200 для focused).
const WEIGHT_TOKENS: Record<TaskWeight, { bg: string; on: string; stroke: string }> = {
  [TaskWeight.quick]: {
    bg: 'var(--flow-weight-quick-color)',
    on: 'var(--flow-weight-quick-on-color)',
    stroke: 'var(--flow-weight-quick-stroke)',
  },
  [TaskWeight.focused]: {
    bg: 'var(--flow-weight-focused-color)',
    on: 'var(--flow-weight-focused-on-color)',
    stroke: 'var(--flow-weight-focused-stroke)',
  },
  [TaskWeight.deep]: {
    bg: 'var(--flow-weight-deep-color)',
    on: 'var(--flow-weight-deep-on-color)',
    stroke: 'var(--flow-weight-deep-stroke)',
  },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, lang, onToggle, onEditTask }) => {
  const checkRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLButtonElement>(null);
  const { isFocusVisible, focusProps } = useFocusRing();
  const { buttonProps: checkProps } = useButton(
    { onPress: () => onToggle(task.id), 'aria-label': task.completed ? 'Mark as active' : 'Mark as done' },
    checkRef,
  );
  // Заголовок — точка входа в редактирование (onPress, тап по всей строке).
  const { buttonProps: titleProps } = useButton(
    {
      onPress: onEditTask ? () => onEditTask(task) : () => {},
      'aria-label': `Edit task: ${task.title}`,
      isDisabled: !onEditTask,
    },
    titleRef,
  );

  const tokens = WEIGHT_TOKENS[task.weight];
  // Явно выбранная пользователем иконка имеет приоритет; иначе авто-подбор.
  const Icon = getTaskIconByName(task.icon ?? suggestIconName(task.title));
  const weightLabel = WEIGHT_CONFIG[task.weight].label.toLowerCase();
  const completed = task.completed;
  const isHigh = task.priority === 'high';
  const isMedium = task.priority === 'medium';
  void lang;

  return (
    <div
      role="listitem"
      aria-label={`${task.title}, ${weightLabel}, ${task.priority} priority${completed ? ', completed' : ''}`}
      className="flex items-center md-focus-ring"
      style={{
        // Строгая высота 56 по сетке: текст ярлыка её больше не растягивает.
        height: '56px',
        // Скругления: low — микс [20 слева / 12 справа], medium — равные 12,
        // high — 0 (левый край ведёт волна-слой ниже, не border-radius).
        borderTopLeftRadius: isHigh ? '0px' : isMedium ? '12px' : '20px',
        borderBottomLeftRadius: isHigh ? '0px' : isMedium ? '12px' : '20px',
        borderTopRightRadius: '12px',
        borderBottomRightRadius: '12px',
        // Low/medium: фон на самой карточке, high — на фоновом слое (clip).
        // Обводка вынесена в отдельный оверлей (z-index 3) поверх контента,
        // иначе тинт ярлыка (z-index 1) перекрывал бы бордер карточки.
        background: isHigh ? 'transparent' : 'rgb(255 255 255 / 0.25)',
        border: 'none',
        opacity: completed ? 0.6 : 1,
        outline: isFocusVisible ? '2px solid var(--md-sys-color-primary)' : 'none',
        outlineOffset: '2px',
        position: 'relative',
      }}
    >
      {isHigh && (
        <>
          {/* Фоновый слой карточки high: белая вуаль 25% + обводка
              top/right/bottom. `clip-path` по `WAVY_CARD_CLIP` (правый край
              99999) обрезает фон+бордер слева по волне, но НЕ трогает
              нативный `border-radius: 0 12px 12px 0` справа (clip там далеко
              за элементом). Волновую обводку рисует отдельный SVG ниже. */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgb(255 255 255 / 0.25)',
              borderTopRightRadius: '12px',
              borderBottomRightRadius: '12px',
              clipPath: `path('${WAVY_CARD_CLIP}')`,
            }}
          />
          {/* Обводка волны (левый контур, 10×56). НЕ клипится родителем
              (clip только на фоновом слое), поэтому stroke виден полностью.
              z-index 2 — поверх ярлыка-тинта. */}
          <svg
            aria-hidden="true"
            width={10}
            height={56}
            viewBox="0 0 10 56"
            style={{ position: 'absolute', left: 0, top: 0, zIndex: 2, overflow: 'visible' }}
          >
            <path
              d={WAVY_LEFT_STROKE}
              fill="none"
              stroke={tokens.stroke}
              strokeWidth={1}
            />
          </svg>
        </>
      )}
      {/* Обводка карточки — оверлей поверх контента (z-index 3), чтобы тинт
          ярлыка (z-index 1) не перекрывал бордер. Для high: левый контур
          рисует волна-SVG (z-index 2), здесь — top/right/bottom, обрезанные
          clip по волне → бесшовный стык. pointer-events: none — клики сквозь. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 3,
          borderRadius: isHigh ? '0 12px 12px 0' : isMedium ? '12px' : '20px 12px 12px 20px',
          borderTop: `1px solid ${tokens.stroke}`,
          borderRight: `1px solid ${tokens.stroke}`,
          borderBottom: `1px solid ${tokens.stroke}`,
          borderLeft: isHigh ? 'none' : `1px solid ${tokens.stroke}`,
          clipPath: isHigh ? `path('${WAVY_CARD_CLIP}')` : undefined,
        }}
      />
      {/* High-приоритетная leading-полоса 6px удалена: в Figma-карточках
          Low/Medium/High её нет (приоритет кодируется правым слотом). */}
      {/* Ярлык веса 24×56: ТОЛЬКО фон, без бордеров.
          Скругления слева повторяют контур карточки (low 20 / medium 12),
          справа — прямые углы. Для high — обычный D-капсул r=20 слева,
          он закрывает SVG-волну сверху и убирает «трапецию»-хвост справа.
          Текст повёрнут внутренним span (снизу вверх) и сдвинут на 3px
          к правому краю ярлыка — утоплен вглубь карточки. */}
      {/* Контент high: ярлык + чекбокс + заголовок + слот — единым flex-слоем
          поверх волны-фона (zIndex 1), под волной-обводкой (zIndex 2).
          Фон ярлыка high прозрачный: заливку даёт только волна-оверлей. */}
      <div className="flex items-center" style={{ position: 'relative', zIndex: 1, height: '56px', flex: 1, minWidth: 0 }}>
      <div
        aria-hidden="true"
        className="flex items-center justify-center"
        style={{
          height: '56px',
          width: '24px',
          flexShrink: 0,
          alignSelf: 'stretch',
          background: `color-mix(in srgb, ${tokens.bg} 25%, transparent)`,
          // Ярлык повторяет контур карточки: medium — 12 слева, low — 20 слева.
          // High: прямоугольник 24×56, фон обрезан `clip-path` по той же
          // волне (`WAVY_TINT_CLIP`, правый край 30 = запас 6px, чтобы не
          // было видимого стыка с телом карточки) — тинт совпадает с
          // контуром карточки. z-index 1 — под волновой обводкой (z 2).
          borderTopLeftRadius: isMedium ? '12px' : isHigh ? '0px' : '20px',
          borderBottomLeftRadius: isMedium ? '12px' : isHigh ? '0px' : '20px',
          borderTopRightRadius: '0px',
          borderBottomRightRadius: '0px',
          border: 'none',
          padding: '6px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          clipPath: isHigh ? `path('${WAVY_TINT_CLIP}')` : undefined,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            marginLeft: '3px',
            color: tokens.on,
            fontSize: '11px',
            fontWeight: 500,
            lineHeight: '16px',
            whiteSpace: 'nowrap',
          }}
        >
          {weightLabel}
        </span>
      </div>
      <button
          ref={checkRef}
          type="button"
          {...checkProps}
          {...focusProps}
          aria-pressed={completed}
          className="flex items-center justify-center md-state-layer"
          style={{ width: '48px', height: '56px', borderRadius: '999px', flexShrink: 0 }}
        >
          <span
            aria-hidden="true"
            className="flex items-center justify-center"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '2px',
              border: `2px solid ${completed ? tokens.on : 'var(--md-sys-color-on-surface-variant)'}`,
              background: completed ? tokens.on : 'transparent',
              color: '#ffffff',
              fontSize: '12px',
              lineHeight: 1,
            }}
          >
            {completed ? '✓' : ''}
          </span>
      </button>
      {/* Заголовок Header 16px/500: отступ 16 от правого слота,
          длинный текст обрезается (скрывается), одна строка. */}
      <div className="flex-1 min-w-0" style={{ paddingInline: '0 16px', overflow: 'hidden' }}>
        <button
          ref={titleRef}
          type="button"
          {...titleProps}
          {...focusProps}
          disabled={!onEditTask}
          className="block truncate md-focus-ring"
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            padding: 0,
            minHeight: '24px',
            cursor: onEditTask ? 'pointer' : 'default',
            color: completed ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-surface)',
            fontSize: 'var(--md-sys-typescale-title-medium-size)',
            fontWeight: 500,
            lineHeight: '24px',
            textDecoration: completed ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </button>
      </div>
      {/* Правый слот 58×56 вплотную к границам: иконка 24 по центру,
          паддинги 16/17 образуются самим контейнером 58×56. Отступ 16 от текста. */}
      {task.priority === 'high' ? (
        <div className="flex items-center justify-center" style={{ width: '58px', height: '56px', flexShrink: 0 }}>
          <Icon size={24} strokeWidth={2} style={{ color: tokens.on }} aria-hidden="true" />
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ width: '58px', height: '56px', flexShrink: 0 }}>
          <span
            aria-hidden="true"
            className="flex items-center justify-center"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: task.priority === 'medium' ? '8px' : '12px',
              border: `2px solid ${tokens.on}`,
            }}
          >
            <Icon size={18} strokeWidth={2} style={{ color: tokens.on }} aria-hidden="true" />
          </span>
        </div>
      )}
      </div>
    </div>
  );
};

export default TaskCard;
