// Figma 98:15937 «Task cards» + 259:18260 «Day View Vertical».
// Вертикальная карточка задачи 326x56: вес-пилюля + чекбокс 48 + заголовок
// + правый слот по приоритету. Grid 2x2 не трогаем — там BubbleBlock.
import React, { useRef } from 'react';
import { useButton, useFocusRing } from 'react-aria';
import { Task, Language, TaskWeight } from '../../types.ts';
import { WEIGHT_CONFIG } from '../../constants.tsx';
import { suggestIcon } from '../../services/iconSuggester.ts';

interface TaskCardProps {
  task: Task;
  lang: Language;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

// Волна high-приоритета по дампу Figma-нод (нода Rectangle 6 ноды 458:16709).
// Точный путь контура карточки из Figma-дампа (viewBox 0 0 326 56).
// Реальная геометрия: впадины x=0, гребни x=4.24 (амплитуда ~4px, волна
// жмётся к левому краю), бампы y 6.5–49.5, выше/ниже — гладкие углы.
const WAVY_FULL =
  'M1.23 1.87C2.19 0.37 4.08 0 5.86 0H314C320.63 0 326 5.37 326 12V44C326 50.63 320.63 56 314 56H7.33C4.62 56 1.77 55.15 0.68 52.67C0.28 51.77 0 50.7 0 49.5C0 45.5 4.21 45 4.21 39.5C4.21 35 0 35 0 28.5C0 24 4.21 22 4.21 17.5C4.21 11 0 11.5 0 6.5C0 4.37 0.57 2.88 1.23 1.87Z';
// Точный путь тинта (лабал-fill ноды 458:16709) для полосы 26×56: та же волна,
// тянется строго вправо (там дамп 325px обрезан фреймом labale 24px).
// Впадины на x=0 (касаются левого края), гребни x=4.24.
// Низ/верх пути h=58 (выходит за viewBox 56) — перекрывает скругление r=12
// карточки и не оставляет «белой полоски» внизу ярлыка.
const WAVY_TINT =
  'M26 0H3.19C3.19 0 -0.45 0.5 0.05 6.5C1.05 10.5 4.24 10.61 4.24 16.88C4.24 21.21 0.05 23.14 0.05 27.48C0.05 33.75 4.24 33.75 4.24 38.09C4.24 43.39 1.05 45 0.05 47.73C-0.45 53.5 4.24 58 4.24 58H26Z';
// ID клипа для ярлыка high — обрезает его фон по форме волны, чтобы
// вершины не торчали влево за волну.
const WAVY_CLIP_ID = 'taskcard-wavy-label-clip';
// Обводка волны (24×58, та же форма, что у тинта, открытый путь).
// Высота 58 перекрывает скругление карточки и не даёт «неравномерного
// бордера» в стыке с прямыми top/bottom (которых у high нет).
const WAVY_STROKE =
  'M26 0H3.19C3.19 0 -0.45 0.5 0.05 6.5C1.05 10.5 4.24 10.61 4.24 16.88C4.24 21.21 0.05 23.14 0.05 27.48C0.05 33.75 4.24 33.75 4.24 38.09C4.24 43.39 1.05 45 0.05 47.73C-0.45 53.5 4.24 58 4.24 58H26';
// Алиас старого имени, которое просит JSX островного слоя (WAVY_PATH).
const WAVY_PATH = WAVY_TINT;
// Расширенный путь для clip-path карточки high: берёт `WAVY_FULL` и расширяет
// за пределы viewBox (x=10000, y=10000), чтобы `border-radius: 12px` на углах
// карточки не обрезался клипом (path должен захватывать весь bbox карточки).
const WAVY_FULL_CLIP_PATH =
  'M1.23 1.87C2.19 0.37 4.08 0 5.86 0H10000V10000H7.33C4.62 56 1.77 55.15 0.68 52.67C0.28 51.77 0 50.7 0 49.5C0 45.5 4.21 45 4.21 39.5C4.21 35 0 35 0 28.5C0 24 4.21 22 4.21 17.5C4.21 11 0 11.5 0 6.5C0 4.37 0.57 2.88 1.23 1.87Z';

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

const TaskCard: React.FC<TaskCardProps> = ({ task, lang, onToggle }) => {
  const checkRef = useRef<HTMLButtonElement>(null);
  const { isFocusVisible, focusProps } = useFocusRing();
  const { buttonProps: checkProps } = useButton(
    { onPress: () => onToggle(task.id), 'aria-label': task.completed ? 'Mark as active' : 'Mark as done' },
    checkRef,
  );

  const tokens = WEIGHT_TOKENS[task.weight];
  const Icon = suggestIcon(task.title);
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
        // high — левый край ведёт волна (clip-path), CSS-радиусы слева не нужны.
        borderTopLeftRadius: isHigh ? '0px' : isMedium ? '12px' : '20px',
        borderBottomLeftRadius: isHigh ? '0px' : isMedium ? '12px' : '20px',
        borderTopRightRadius: '12px',
        borderBottomRightRadius: '12px',
        // High: CSS-бордеры возвращены, обводка идёт по форме волны через
        // `clip-path: url(#${WAVY_CLIP_ID})`. Скругления r=12 справа
        // сохранены (borderTopRightRadius/BottomRightRadius), а слева — 0
        // (clip-path даёт волну, не border-radius). Фон карточки — белый
        // 25% (как у low/medium); ярлык-капсула с тинтом и волной слева.
        // `clip-path` обрезает фон+бордеры по форме волны → скругления r=12
        // справа остаются нативными кругами, без эллипса.
        background: isHigh ? 'rgb(255 255 255 / 0.25)' : 'rgb(255 255 255 / 0.25)',
        borderTop: isHigh ? `1px solid ${tokens.stroke}` : `1px solid ${tokens.stroke}`,
        borderRight: isHigh ? `1px solid ${tokens.stroke}` : `1px solid ${tokens.stroke}`,
        borderBottom: isHigh ? `1px solid ${tokens.stroke}` : `1px solid ${tokens.stroke}`,
        borderLeft: isHigh ? `1px solid ${tokens.stroke}` : `1px solid ${tokens.stroke}`,
        opacity: completed ? 0.6 : 1,
        outline: isFocusVisible ? '2px solid var(--md-sys-color-primary)' : 'none',
        outlineOffset: '2px',
        overflow: 'hidden',
        position: 'relative',
        clipPath: isHigh ? `url(#${WAVY_CLIP_ID})` : undefined,
      }}
    >
      {isHigh && (
        // High: SVG <defs> с <clipPath> для клипа карточки (zIndex 0).
        // Использует `WAVY_FULL_CLIP_PATH` (расширен до 10000x10000) в
        // objectBoundingBox — клип захватывает весь bbox карточки,
        // включая border-radius r=12 по углам (path не обрезает углы).
        <>
            <svg aria-hidden="true" width={0} height={0} style={{ position: 'absolute' }}>
              <defs>
                <clipPath id={WAVY_CLIP_ID} clipPathUnits="objectBoundingBox">
                  <path
                    transform="scale(0.00307 0.01786)"
                    d={WAVY_FULL_CLIP_PATH}
                  />
                </clipPath>
              </defs>
            </svg>
          </>
      )}
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
          // Ярлык повторяет контур карточки: medium — 12 слева, low/high — 20 слева.
          // High: D-капсул r=20 (как у low), но фон обрезан `clip-path` по волне
          // (`WAVY_TINT`, 0..26) — тинт не торчит за вершины слева. Также
          // card-уровневый клип `WAVY_FULL_CLIP_PATH` обрезает всё содержимое
          // карточки по форме волны (бордеры, фон, скругления).
          // High: прямоугольник 24×56 без скруглений — карточка обрезает
          // его слева по волне через свой clip-path (`WAVY_FULL_CLIP_PATH`).
          // Скругления r=20 у low/medium здесь не нужны — форму даёт клип
          // родителя. Свой `clip-path: path('M0 0 H24 V56 H0 Z')` на ярлыке
          // гарантирует прямоугольную форму независимо от border-radius.
          borderTopLeftRadius: isMedium ? '12px' : isHigh ? '0px' : '20px',
          borderBottomLeftRadius: isMedium ? '12px' : isHigh ? '0px' : '20px',
          borderTopRightRadius: '0px',
          borderBottomRightRadius: '0px',
          border: 'none',
          padding: '6px',
          overflow: 'hidden',
          clipPath: isHigh ? `path('M0 0 H24 V56 H0 Z')` : undefined,
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
        <span
          className="block truncate"
          style={{
            color: completed ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-surface)',
            fontSize: 'var(--md-sys-typescale-title-medium-size)',
            fontWeight: 500,
            lineHeight: '24px',
            textDecoration: completed ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>
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
