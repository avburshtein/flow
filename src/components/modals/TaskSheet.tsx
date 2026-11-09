import React, { useState, useEffect, useRef } from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import {
    Circle,
    Diamond,
    Star,
    Repeat,
    Check,
    Trash2,
    Save,
} from 'lucide-react';
import { suggestWeight, adjustTaskPeriods } from '../../services/taskOptimizer';
import {
    suggestIcon,
    TASK_ICON_NAMES,
    getTaskIconByName,
    suggestIconName,
    DEFAULT_TASK_ICON,
} from '../../services/iconSuggester';
import { WEIGHT_CONFIG } from '../../constants';
import {
    TimePeriod,
    TaskWeight,
    Priority,
    Recurrence,
    Task,
    Language,
} from '../../types';

interface TaskSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskAdd: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
    // Режим редактирования: если передан — шит открывается в режиме edit.
    editingTask?: Task | null;
    onTaskUpdate?: (id: string, updates: Partial<Task>) => void;
    onTaskDelete?: (id: string) => void;
    activePeriodId: TimePeriod;
    tasks: Task[];
    currentTime: Date;
    language: Language;
}

export default function TaskSheet({
    isOpen,
    onClose,
    onTaskAdd,
    editingTask = null,
    onTaskUpdate,
    onTaskDelete,
    activePeriodId,
    tasks,
    currentTime,
    language,
}: TaskSheetProps) {
    const isEditMode = Boolean(editingTask);
    const [title, setTitle] = useState('');
    const [selectedWeight, setSelectedWeight] = useState<TaskWeight>(TaskWeight.focused);
    const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(activePeriodId);
    const [selectedRecurrence, setSelectedRecurrence] = useState<Recurrence>('none');
    const [selectedIcon, setSelectedIcon] = useState<string>(DEFAULT_TASK_ICON);
    const [isAutoSelected, setIsAutoSelected] = useState(true);
    // Пока true (и пользователь не выбрал иконку вручную) — иконка следует
    // авто-подбору по названию. Ручной выбор фиксирует её.
    const [isIconAuto, setIsIconAuto] = useState(true);
    const [titleError, setTitleError] = useState<string | null>(null);
    const [recurrenceAnchor, setRecurrenceAnchor] = useState<HTMLElement | null>(null);
    const [iconAnchor, setIconAnchor] = useState<HTMLElement | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-suggest weight — только в режиме добавления (в edit вес фиксирован).
    useEffect(() => {
        if (isEditMode) return;
        if (title.trim()) {
            setSelectedWeight(suggestWeight(title));
        }
    }, [title, isEditMode]);

    // Авто-подбор иконки по названию (add-режим), пока пользователь не выбрал
    // иконку вручную. В edit иконка фиксирована (prefill).
    useEffect(() => {
        if (isEditMode || !isIconAuto) return;
        if (title.trim()) {
            setSelectedIcon(suggestIconName(title));
        }
    }, [title, isEditMode, isIconAuto]);

    // Reset (add) или prefill (edit) + фокус на открытии.
    useEffect(() => {
        if (!isOpen) return;
        if (editingTask) {
            setTitle(editingTask.title);
            setSelectedWeight(editingTask.weight);
            setSelectedPriority(editingTask.priority);
            setSelectedPeriod(editingTask.periods[0] ?? activePeriodId);
            setSelectedRecurrence(editingTask.recurrence ?? 'none');
            setSelectedIcon(editingTask.icon ?? suggestIconName(editingTask.title));
            setIsIconAuto(false);
            setIsAutoSelected(false);
            setTitleError(null);
        } else {
            setTitle('');
            setSelectedWeight(TaskWeight.focused);
            setSelectedPriority('medium');
            setSelectedPeriod(activePeriodId);
            setSelectedRecurrence('none');
            setSelectedIcon(DEFAULT_TASK_ICON);
            setIsIconAuto(true);
            setIsAutoSelected(true);
            setTitleError(null);
        }
        requestAnimationFrame(() => inputRef.current?.focus());
        // editingTask намеренно не в deps: prefill должен отрабатывать один раз
        // на открытии, а не на каждый ре-рендер родителя.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activePeriodId]);

    const releaseFocus = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    const handleClose = () => {
        releaseFocus();
        onClose();
    };

    const handleSubmit = () => {
        const trimmed = title.trim();
        if (!trimmed) {
            setTitleError(
                language === 'ru' ? 'Введите название задачи'
                    : language === 'es' ? 'Ingrese el nombre de la tarea'
                        : 'Task name required'
            );
            return;
        }
        if (trimmed.length > 100) {
            setTitleError(
                language === 'ru' ? 'Максимум 100 символов'
                    : language === 'es' ? 'Máximo 100 caracteres'
                        : 'Max 100 characters'
            );
            return;
        }

        releaseFocus();

        // Режим редактирования — обновляем существующую задачу.
        if (isEditMode && editingTask) {
            onTaskUpdate?.(editingTask.id, {
                title: trimmed,
                weight: selectedWeight,
                priority: selectedPriority,
                periods: [selectedPeriod],
                recurrence: selectedRecurrence,
                icon: selectedIcon,
            });
            handleClose();
            return;
        }

        const todayStr = currentTime.toISOString().split('T')[0];
        const adjustment = adjustTaskPeriods(
            tasks, [selectedPeriod], todayStr, selectedWeight, activePeriodId, currentTime
        );

        onTaskAdd({
            title: trimmed,
            periods: adjustment.periods,
            dueDate: adjustment.date,
            weight: selectedWeight,
            priority: selectedPriority,
            recurrence: selectedRecurrence,
            icon: selectedIcon,
        });
        handleClose();
    };

    const handleDelete = () => {
        if (!editingTask) return;
        releaseFocus();
        onTaskDelete?.(editingTask.id);
        handleClose();
    };

    const handlePeriodChange = (_: React.MouseEvent<HTMLElement>, val: TimePeriod | null) => {
        if (val) {
            setSelectedPeriod(val);
            setIsAutoSelected(false);
        }
    };

    const handleRecurrenceSelect = (r: Recurrence) => {
        setSelectedRecurrence(r);
        setRecurrenceAnchor(null);
    };

    // ─── Translations ───
    const t = {
        en: {
            newTask: 'New Task', taskName: 'Task name...', weight: 'Weight',
            priority: 'Priority', period: 'Period', addTask: 'Add Task',
            cancel: 'Cancel', currentlyActive: 'currently active',
            recurrence: 'Set recurrence', once: 'Once', daily: 'Every day',
            weekly: 'Every week', monthly: 'Every month', allBlocks: 'All active blocks',
            chooseDates: 'Choose dates...',
            editTask: 'Edit Task', saveTask: 'Save task', deleteTask: 'Delete task',
            selectIcon: 'Icon', iconAuto: 'Auto',
        },
        ru: {
            newTask: 'Новая задача', taskName: 'Название задачи...', weight: 'Вес',
            priority: 'Приоритет', period: 'Период', addTask: 'Добавить задачу',
            cancel: 'Отмена', currentlyActive: 'сейчас активен',
            recurrence: 'Настроить повтор', once: 'Один раз', daily: 'Каждый день',
            weekly: 'Каждую неделю', monthly: 'Каждый месяц', allBlocks: 'Все активные блоки',
            chooseDates: 'Выбрать даты...',
            editTask: 'Редактировать', saveTask: 'Сохранить задачу', deleteTask: 'Удалить задачу',
            selectIcon: 'Иконка', iconAuto: 'Авто',
        },
        es: {
            newTask: 'Nueva Tarea', taskName: 'Nombre de tarea...', weight: 'Peso',
            priority: 'Prioridad', period: 'Período', addTask: 'Agregar Tarea',
            cancel: 'Cancelar', currentlyActive: 'actualmente activo',
            recurrence: 'Configurar repetición', once: 'Una vez', daily: 'Cada día',
            weekly: 'Cada semana', monthly: 'Cada mes', allBlocks: 'Todos los bloques',
            chooseDates: 'Elegir fechas...',
            editTask: 'Editar Tarea', saveTask: 'Guardar tarea', deleteTask: 'Eliminar tarea',
            selectIcon: 'Icono', iconAuto: 'Auto',
        },
    }[language] || {
        newTask: 'New Task', taskName: 'Task name...', weight: 'Weight',
        priority: 'Priority', period: 'Period', addTask: 'Add Task',
        cancel: 'Cancel', currentlyActive: 'currently active',
        recurrence: 'Set recurrence', once: 'Once', daily: 'Every day',
        weekly: 'Every week', monthly: 'Every month', allBlocks: 'All active blocks',
        chooseDates: 'Choose dates...',
        editTask: 'Edit Task', saveTask: 'Save task', deleteTask: 'Delete task',
        selectIcon: 'Icon', iconAuto: 'Auto',
    };

    const priorityIcons: Record<Priority, React.ElementType> = { low: Circle, medium: Diamond, high: Star };
    const priorityLabels: Record<Priority, string> = {
        low: language === 'ru' ? 'Низкий' : language === 'es' ? 'Bajo' : 'Low',
        medium: language === 'ru' ? 'Средний' : language === 'es' ? 'Medio' : 'Med',
        high: language === 'ru' ? 'Высокий' : language === 'es' ? 'Alto' : 'High',
    };
    const periodNames: Record<TimePeriod, string> = {
        [TimePeriod.MORNING]: language === 'ru' ? 'Утро' : language === 'es' ? 'Mañана' : 'Morning',
        [TimePeriod.AFTERNOON]: language === 'ru' ? 'День' : language === 'es' ? 'Tarde' : 'Afternoon',
        [TimePeriod.EVENING]: language === 'ru' ? 'Вечер' : language === 'es' ? 'Noche' : 'Evening',
        [TimePeriod.NIGHT]: language === 'ru' ? 'Ночь' : language === 'es' ? 'Noche' : 'Night',
    };

    const recurrenceList: Recurrence[] = ['none', 'daily', 'weekly', 'monthly', 'all-blocks'];
    const recurrenceLabels: Record<Recurrence, string> = {
        none: t.once, daily: t.daily, weekly: t.weekly, monthly: t.monthly, 'all-blocks': t.allBlocks,
    };

    // Иконка текущей задачи для цветного хедера (реагирует на выбор веса/иконки).
    const HeaderIcon = getTaskIconByName(selectedIcon);

    // Цвета хедера по весу (Figma ноды 424:17088 / 458:16379 / 458:16380):
    //   Top bar = вес@16%, labale = вес@25%, контент (текст+иконка) = вес-on.
    // Меняются мгновенно при смене selectedWeight (реактивный цвет хедера).
    const weightHeader = {
        [TaskWeight.quick]: {
            bg16: 'color-mix(in srgb, var(--flow-weight-quick-color) 16%, transparent)',
            bg25: 'color-mix(in srgb, var(--flow-weight-quick-color) 25%, transparent)',
            full: 'var(--flow-weight-quick-color)',
            on: 'var(--flow-weight-quick-on-color)',
        },
        [TaskWeight.focused]: {
            bg16: 'color-mix(in srgb, var(--flow-weight-focused-color) 16%, transparent)',
            bg25: 'color-mix(in srgb, var(--flow-weight-focused-color) 25%, transparent)',
            full: 'var(--flow-weight-focused-color)',
            on: 'var(--flow-weight-focused-on-color)',
        },
        [TaskWeight.deep]: {
            bg16: 'color-mix(in srgb, var(--flow-weight-deep-color) 16%, transparent)',
            bg25: 'color-mix(in srgb, var(--flow-weight-deep-color) 25%, transparent)',
            full: 'var(--flow-weight-deep-color)',
            on: 'var(--flow-weight-deep-on-color)',
        },
    }[selectedWeight];
    // Заголовок хедера = название веса (как в Figma: quick/focused/deep).
    const weightHeaderLabel = WEIGHT_CONFIG[selectedWeight].label;

    // ─── Title Small — M3 token, NO uppercase ───
    const titleSmallSx = {
        fontFamily: 'var(--md-sys-typescale-title-small-font)',
        fontSize: 'var(--md-sys-typescale-title-small-size)',
        fontWeight: 'var(--md-sys-typescale-title-small-weight)',
        lineHeight: 'var(--md-sys-typescale-title-small-line-height)',
        letterSpacing: 'var(--md-sys-typescale-title-small-letter-spacing)',
        color: 'var(--md-sys-color-on-surface-variant)',
        display: 'block',
        mb: 1,
    };

    return (
        <SwipeableDrawer
            anchor="bottom"
            open={isOpen}
            onClose={handleClose}
            onOpen={() => { }}
            disableSwipeToOpen
            ModalProps={{
                disableRestoreFocus: true,
            }}
            slotProps={{
                backdrop: {
                    sx: { bgcolor: 'var(--md-sys-color-scrim)', opacity: 0.32 },
                },
            }}
            sx={{
                '& .MuiDrawer-paper': {
                    borderRadius: '28px 28px 0 0',
                    bgcolor: 'var(--md-sys-color-surface-container-low)',
                    color: 'var(--md-sys-color-on-surface)',
                    maxHeight: '90dvh',
                    overflow: 'auto',
                },
            }}
        >
            <Box
                sx={{
                    p: '24px 24px calc(32px + env(safe-area-inset-bottom))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}
            >
                {/* Цветной хедер (Figma ноды 424:17088/458:16379/458:16380):
                    Top bar — вес@16%, внутри labale — вес@25% с заголовком
                    веса слева и иконкой задачи справа (цвет вес-on). Весь
                    блок реактивно меняет цвет при смене выбранного веса. */}
                <Box
                    sx={{
                        // Растягиваем хедер на всю ширину карточки шита,
                        // гася боковые паддинги контейнера (24px), чтобы
                        // фон Top bar шёл от края до края, как в Figma.
                        mx: '-24px',
                        mt: '-24px',
                        mb: '4px',
                        bgcolor: weightHeader.bg16,
                        flexShrink: 0,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            height: '56px',
                            px: '24px',
                            bgcolor: weightHeader.bg25,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '22px',
                                fontWeight: 500,
                                lineHeight: '28px',
                                letterSpacing: '0px',
                                fontFamily: 'var(--md-sys-typescale-title-large-font)',
                                color: weightHeader.on,
                            }}
                        >
                            {weightHeaderLabel}
                        </Typography>
                        <HeaderIcon
                            aria-hidden="true"
                            size={24}
                            color={weightHeader.on}
                        />
                    </Box>
                </Box>

                {/* M3 Outlined TextField */}
                <Box>
                    <Box
                        sx={{
                            // M3 Outlined TextField: малый радиус 4, обводка `outline`,
                            // плавающий лейбл (`Label text`) сидит на верхней борде и
                            // «пробивает» её непрозрачной подложкой под цвет поля.
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            px: '12px',
                            height: '56px',
                            bgcolor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: '4px',
                            border: '1px solid var(--md-sys-color-outline)',
                            transition: 'border-color 200ms ease, border-width 200ms ease',
                            '&:focus-within': {
                                borderColor: 'var(--md-sys-color-primary)',
                                borderWidth: '2px',
                            },
                            // Цвет лейбла при фокусе — primary (геометрию/фон задаёт
                            // инлайн-стиль лейбла, здесь только перекраска).
                            '&:focus-within .tf-label': {
                                color: 'var(--md-sys-color-primary)',
                            },
                        }}
                    >
                        <label
                            htmlFor="task-title-input"
                            className="tf-label"
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: title ? '-8px' : '50%',
                                transform: title ? 'none' : 'translateY(-50%)',
                                padding: '0 4px',
                                background: 'var(--md-sys-color-surface-container-low)',
                                fontSize: title ? '12px' : '16px',
                                fontWeight: 500,
                                lineHeight: title ? '16px' : '24px',
                                color: 'var(--md-sys-color-outline)',
                                transition: 'top 150ms ease, font-size 150ms ease, color 150ms ease',
                                pointerEvents: 'none',
                                fontFamily: 'var(--md-sys-typescale-body-large-font)',
                            }}
                        >
                            {t.taskName}
                        </label>
                        <input
                            id="task-title-input"
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (titleError) setTitleError(null);
                            }}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: '16px',
                                fontWeight: 600,
                                lineHeight: '24px',
                                color: 'var(--md-sys-color-on-surface)',
                                fontFamily: 'var(--md-sys-typescale-body-large-font)',
                            }}
                        />
                        <IconButton
                            onClick={(e) => setRecurrenceAnchor(e.currentTarget)}
                            aria-label={t.recurrence}
                            sx={{
                                color: selectedRecurrence === 'none'
                                    ? 'var(--md-sys-color-on-surface-variant)'
                                    : 'var(--md-sys-color-primary)',
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                            }}
                        >
                            <Repeat size={20} />
                        </IconButton>
                    </Box>
                    {/* Supporting text — Body Small, reserved space */}
                    <Typography
                        sx={{
                            minHeight: '20px',
                            fontFamily: 'var(--md-sys-typescale-body-small-font)',
                            fontSize: 'var(--md-sys-typescale-body-small-size)',
                            fontWeight: 'var(--md-sys-typescale-body-small-weight)',
                            lineHeight: 'var(--md-sys-typescale-body-small-line-height)',
                            letterSpacing: 'var(--md-sys-typescale-body-small-letter-spacing)',
                            color: titleError
                                ? 'var(--md-sys-color-error)'
                                : 'var(--md-sys-color-on-surface-variant)',
                            px: '4px',
                            pt: '4px',
                            display: 'block',
                        }}
                    >
                        {titleError || ' '}
                    </Typography>
                </Box>

                {/* Recurrence Menu */}
                <Menu
                    anchorEl={recurrenceAnchor}
                    open={Boolean(recurrenceAnchor)}
                    onClose={() => setRecurrenceAnchor(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    slotProps={{
                        paper: {
                            sx: {
                                bgcolor: 'var(--md-sys-color-surface-container-high)',
                                borderRadius: '16px',
                                boxShadow: 'var(--md-sys-elevation-shadow-2)',
                                minWidth: '200px',
                            },
                        },
                    }}
                >
                    {recurrenceList.map((r) => (
                        <MenuItem
                            key={r}
                            selected={selectedRecurrence === r}
                            onClick={() => handleRecurrenceSelect(r)}
                            sx={{
                                minHeight: '48px',
                                px: '16px',
                                fontSize: '16px',
                                color: selectedRecurrence === r
                                    ? 'var(--md-sys-color-primary)'
                                    : 'var(--md-sys-color-on-surface-variant)',
                                bgcolor: selectedRecurrence === r
                                    ? 'var(--md-sys-color-secondary-container)'
                                    : 'transparent',
                                '&:hover': {
                                    bgcolor: selectedRecurrence === r
                                        ? 'var(--md-sys-color-secondary-container)'
                                        : 'var(--md-sys-color-surface-container-highest)',
                                },
                            }}
                        >
                            <span style={{ flex: 1 }}>{recurrenceLabels[r]}</span>
                            {selectedRecurrence === r && <Check size={14} />}
                        </MenuItem>
                    ))}
                </Menu>

                {/* Weight Selector */}
                <Box>
                    <Typography sx={titleSmallSx}>{t.weight}</Typography>
                    <ToggleButtonGroup
                        value={selectedWeight}
                        exclusive
                        onChange={(_, val) => val && setSelectedWeight(val)}
                        fullWidth
                        sx={{
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            '& .MuiToggleButton-root': {
                                border: 'none',
                                borderRadius: 0,
                                minHeight: '44px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: 'var(--md-sys-color-on-surface-variant)',
                                bgcolor: 'transparent',
                                textTransform: 'none',
                                '&:not(:last-of-type)': {
                                    borderRight: '1px solid var(--md-sys-color-outline-variant)',
                                },
                                '&.Mui-selected': {
                                    fontWeight: 600,
                                },
                            },
                            '& .MuiToggleButton-root[value="quick"].Mui-selected': {
                                bgcolor: 'var(--flow-weight-quick-color)',
                                color: 'var(--flow-weight-quick-on-color)',
                            },
                            '& .MuiToggleButton-root[value="focused"].Mui-selected': {
                                bgcolor: 'var(--flow-weight-focused-color)',
                                color: 'var(--flow-weight-focused-on-color)',
                            },
                            '& .MuiToggleButton-root[value="deep"].Mui-selected': {
                                bgcolor: 'var(--flow-weight-deep-color)',
                                color: 'var(--flow-weight-deep-on-color)',
                            },
                        }}
                    >
                        <ToggleButton value="quick">Quick</ToggleButton>
                        <ToggleButton value="focused">Focused</ToggleButton>
                        <ToggleButton value="deep">Deep</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Priority Selector */}
                <Box>
                    <Typography sx={titleSmallSx}>{t.priority}</Typography>
                    <ToggleButtonGroup
                        value={selectedPriority}
                        exclusive
                        onChange={(_, val) => val && setSelectedPriority(val)}
                        fullWidth
                        sx={{
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            '& .MuiToggleButton-root': {
                                border: 'none',
                                borderRadius: 0,
                                minHeight: '44px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: 'var(--md-sys-color-on-surface-variant)',
                                bgcolor: 'transparent',
                                textTransform: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                '&:not(:last-of-type)': {
                                    borderRight: '1px solid var(--md-sys-color-outline-variant)',
                                },
                                '&.Mui-selected': {
                                    bgcolor: 'var(--md-sys-color-primary-container)',
                                    color: 'var(--md-sys-color-on-primary-container)',
                                    fontWeight: 600,
                                },
                            },
                        }}
                    >
                        <ToggleButton value="low">
                            <Circle size={16} />
                            {priorityLabels.low}
                        </ToggleButton>
                        <ToggleButton value="medium">
                            <Diamond size={16} />
                            {priorityLabels.medium}
                        </ToggleButton>
                        <ToggleButton value="high">
                            <Star size={16} />
                            {priorityLabels.high}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Period Selector + Label Small hint under selected */}
                <Box>
                    <Typography sx={titleSmallSx}>{t.period}</Typography>
                    <ToggleButtonGroup
                        value={selectedPeriod}
                        exclusive
                        onChange={handlePeriodChange}
                        fullWidth
                        sx={{
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            '& .MuiToggleButton-root': {
                                border: 'none',
                                borderRadius: 0,
                                minHeight: '44px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: 'var(--md-sys-color-on-surface-variant)',
                                bgcolor: 'transparent',
                                textTransform: 'none',
                                '&:not(:last-of-type)': {
                                    borderRight: '1px solid var(--md-sys-color-outline-variant)',
                                },
                                '&.Mui-selected': {
                                    fontWeight: 600,
                                },
                            },
                            // Figma: выбранный сегмент периода = secondary-container
                            // (#e9ddff / #4d3d75) — единый M3 selected-паттерн,
                            // «как у остальных» сегментов. Навешиваем на класс
                            // .Mui-selected (без атрибута value) — матчится всегда,
                            // независимо от регистра значения. Прежние селекторы по
                            // circadian-цветам не давали стабильного selected-чипа.
                            '& .MuiToggleButton-root.Mui-selected': {
                                bgcolor: 'var(--md-sys-color-secondary-container)',
                                color: 'var(--md-sys-color-on-secondary-container)',
                            },
                        }}
                    >
                        <ToggleButton value={TimePeriod.MORNING}>{periodNames[TimePeriod.MORNING]}</ToggleButton>
                        <ToggleButton value={TimePeriod.AFTERNOON}>{periodNames[TimePeriod.AFTERNOON]}</ToggleButton>
                        <ToggleButton value={TimePeriod.EVENING}>{periodNames[TimePeriod.EVENING]}</ToggleButton>
                    </ToggleButtonGroup>
                    {/* Hint row — 3 columns, Label Small under selected period */}
                    <Box sx={{ display: 'flex', mt: 0.5, minHeight: '16px' }}>
                        {[TimePeriod.MORNING, TimePeriod.AFTERNOON, TimePeriod.EVENING].map((period) => (
                            <Box key={period} sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--md-sys-typescale-label-small-font)',
                                        fontSize: 'var(--md-sys-typescale-label-small-size)',
                                        fontWeight: 'var(--md-sys-typescale-label-small-weight)',
                                        lineHeight: 'var(--md-sys-typescale-label-small-line-height)',
                                        letterSpacing: 'var(--md-sys-typescale-label-small-letter-spacing)',
                                        // Figma supporting-text: #4a454e =
                                        // `on-surface-variant` — не очень насыщенный,
                                        // но читаемый (мин. порог контраста на светлом фоне).
                                        // Прежний `flow-block-*-on-color` в ряде тем давал
                                        // белый/неконтрастный текст.
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        // Маркер «currently active» всегда под кнопкой
                                        // РЕАЛЬНО текущего периода суток (activePeriodId),
                                        // независимо от выбора пользователя. Раньше зависел
                                        // от isAutoSelected — гас при клике по блоку дня.
                                        opacity: activePeriodId === period ? 1 : 0,
                                        transition: 'opacity 200ms',
                                    }}
                                >
                                    {activePeriodId === period ? t.currentlyActive : ''}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Icon Selector (Figma: "Select an icon for the task" +
                    tonal icon-button с текущей иконкой; фон = цвет веса). */}
                <Box>
                    <Typography sx={titleSmallSx}>{t.selectIcon}</Typography>
                    <IconButton
                        onClick={(e) => setIconAnchor(e.currentTarget)}
                        aria-label={t.selectIcon}
                        sx={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '16px',
                            bgcolor: weightHeader.full,
                            color: weightHeader.on,
                            '&:hover': { opacity: 0.9 },
                        }}
                    >
                        <HeaderIcon size={24} />
                    </IconButton>
                </Box>

                {/* Icon picker — сетка всех доступных иконок задачи. */}
                <Menu
                    anchorEl={iconAnchor}
                    open={Boolean(iconAnchor)}
                    onClose={() => setIconAnchor(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    slotProps={{
                        paper: {
                            sx: {
                                maxHeight: '320px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 56px)',
                                gap: '4px',
                                p: '8px',
                            },
                        },
                    }}
                >
                    {TASK_ICON_NAMES.map((name) => {
                        const IconCmp = getTaskIconByName(name);
                        return (
                            <MenuItem
                                key={name}
                                selected={name === selectedIcon}
                                onClick={() => {
                                    setSelectedIcon(name);
                                    setIsIconAuto(false);
                                    setIconAnchor(null);
                                }}
                                sx={{
                                    justifyContent: 'center',
                                    borderRadius: '12px',
                                    minWidth: 0,
                                    px: 0,
                                }}
                            >
                                <IconCmp size={22} />
                            </MenuItem>
                        );
                    })}
                </Menu>

                {/* Buttons:
                    edit — «Сохранить задачу» (filled) + «Удалить» (text);
                    add  — «Добавить задачу» (filled) + «Отмена» (text). */}
                {isEditMode ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!title.trim()}
                            startIcon={<Save size={20} />}
                            sx={{
                                flex: 1,
                                minHeight: '52px',
                                borderRadius: '9999px',
                                fontSize: '14px',
                                fontWeight: 500,
                                textTransform: 'none',
                                bgcolor: 'var(--md-sys-color-primary)',
                                color: 'var(--md-sys-color-on-primary)',
                                '&:hover': { opacity: 0.9 },
                                '&.Mui-disabled': {
                                    bgcolor: 'var(--md-sys-color-primary)',
                                    color: 'var(--md-sys-color-on-primary)',
                                    opacity: 0.6,
                                },
                            }}
                        >
                            {t.saveTask}
                        </Button>
                        <Button
                            variant="text"
                            onClick={handleDelete}
                            startIcon={<Trash2 size={20} />}
                            sx={{
                                minHeight: '52px',
                                borderRadius: '9999px',
                                px: '16px',
                                fontSize: '14px',
                                fontWeight: 500,
                                textTransform: 'none',
                                color: 'var(--md-sys-color-on-surface-variant)',
                                '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
                            }}
                        >
                            {t.deleteTask}
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSubmit}
                            disabled={!title.trim()}
                            sx={{
                                minHeight: '52px',
                                borderRadius: '9999px',
                                fontSize: '14px',
                                fontWeight: 500,
                                textTransform: 'none',
                                bgcolor: 'var(--md-sys-color-primary)',
                                color: 'var(--md-sys-color-on-primary)',
                                '&:hover': { opacity: 0.9 },
                                '&.Mui-disabled': {
                                    bgcolor: 'var(--md-sys-color-primary)',
                                    color: 'var(--md-sys-color-on-primary)',
                                    opacity: 0.6,
                                },
                            }}
                        >
                            {t.addTask}
                        </Button>

                        {/* Text Button (Cancel) */}
                        <Button
                            variant="text"
                            onClick={handleClose}
                            sx={{
                                display: 'block',
                                mx: 'auto',
                                minHeight: '44px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: 'var(--md-sys-color-on-surface-variant)',
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
                            }}
                        >
                            {t.cancel}
                        </Button>
                    </>
                )}
            </Box>
        </SwipeableDrawer>
    );
}