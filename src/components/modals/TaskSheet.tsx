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
} from 'lucide-react';
import { suggestWeight, adjustTaskPeriods } from '../../services/taskOptimizer';
import { suggestIcon } from '../../services/iconSuggester';
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
    activePeriodId: TimePeriod;
    tasks: Task[];
    currentTime: Date;
    language: Language;
}

export default function TaskSheet({
    isOpen,
    onClose,
    onTaskAdd,
    activePeriodId,
    tasks,
    currentTime,
    language,
}: TaskSheetProps) {
    const [title, setTitle] = useState('');
    const [selectedWeight, setSelectedWeight] = useState<TaskWeight>(TaskWeight.focused);
    const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(activePeriodId);
    const [selectedRecurrence, setSelectedRecurrence] = useState<Recurrence>('none');
    const [isAutoSelected, setIsAutoSelected] = useState(true);
    const [titleError, setTitleError] = useState<string | null>(null);
    const [recurrenceAnchor, setRecurrenceAnchor] = useState<HTMLElement | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-suggest weight
    useEffect(() => {
        if (title.trim()) {
            setSelectedWeight(suggestWeight(title));
        }
    }, [title]);

    // Reset + focus on open
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setSelectedWeight(TaskWeight.focused);
            setSelectedPriority('medium');
            setSelectedPeriod(activePeriodId);
            setSelectedRecurrence('none');
            setIsAutoSelected(true);
            setTitleError(null);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
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

        const todayStr = currentTime.toISOString().split('T')[0];
        const adjustment = adjustTaskPeriods(
            tasks, [selectedPeriod], todayStr, selectedWeight, activePeriodId, currentTime
        );

        releaseFocus();
        onTaskAdd({
            title: trimmed,
            periods: adjustment.periods,
            dueDate: adjustment.date,
            weight: selectedWeight,
            priority: selectedPriority,
            recurrence: selectedRecurrence,
        });
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
        },
        ru: {
            newTask: 'Новая задача', taskName: 'Название задачи...', weight: 'Вес',
            priority: 'Приоритет', period: 'Период', addTask: 'Добавить задачу',
            cancel: 'Отмена', currentlyActive: 'сейчас активен',
            recurrence: 'Настроить повтор', once: 'Один раз', daily: 'Каждый день',
            weekly: 'Каждую неделю', monthly: 'Каждый месяц', allBlocks: 'Все активные блоки',
            chooseDates: 'Выбрать даты...',
        },
        es: {
            newTask: 'Nueva Tarea', taskName: 'Nombre de tarea...', weight: 'Peso',
            priority: 'Prioridad', period: 'Período', addTask: 'Agregar Tarea',
            cancel: 'Cancelar', currentlyActive: 'actualmente activo',
            recurrence: 'Configurar repetición', once: 'Una vez', daily: 'Cada día',
            weekly: 'Cada semana', monthly: 'Cada mes', allBlocks: 'Todos los bloques',
            chooseDates: 'Elegir fechas...',
        },
    }[language] || {
        newTask: 'New Task', taskName: 'Task name...', weight: 'Weight',
        priority: 'Priority', period: 'Period', addTask: 'Add Task',
        cancel: 'Cancel', currentlyActive: 'currently active',
        recurrence: 'Set recurrence', once: 'Once', daily: 'Every day',
        weekly: 'Every week', monthly: 'Every month', allBlocks: 'All active blocks',
        chooseDates: 'Choose dates...',
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
                {/* Drag handle */}
                <Box
                    sx={{
                        width: '32px',
                        height: '4px',
                        borderRadius: '9999px',
                        bgcolor: 'var(--md-sys-color-on-surface-variant)',
                        opacity: 0.4,
                        mx: 'auto',
                        flexShrink: 0,
                    }}
                />

                {/* Title — Title Large */}
                <Typography
                    sx={{
                        fontSize: '22px',
                        fontWeight: 500,
                        lineHeight: '28px',
                        letterSpacing: '0px',
                        color: 'var(--md-sys-color-on-surface)',
                        fontFamily: 'var(--md-sys-typescale-title-large-font)',
                    }}
                >
                    {t.newTask}
                </Typography>

                {/* M3 Outlined TextField */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            px: '12px',
                            height: '56px',
                            bgcolor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: '16px',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            transition: 'border-color 200ms ease, border-width 200ms ease, padding 200ms ease',
                            '&:focus-within': {
                                borderColor: 'var(--md-sys-color-primary)',
                                borderWidth: '2px',
                                px: '11px',
                            },
                            '&:hover:not(:focus-within)': {
                                borderColor: 'var(--md-sys-color-on-surface)',
                                opacity: 0.87,
                            },
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={t.taskName}
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (titleError) setTitleError(null);
                            }}
                            style={{
                                flex: 1,
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
                            '& .MuiToggleButton-root[value="MORNING"].Mui-selected': {
                                bgcolor: 'var(--flow-block-morning)',
                                color: 'var(--flow-block-morning-on-color)',
                            },
                            '& .MuiToggleButton-root[value="AFTERNOON"].Mui-selected': {
                                bgcolor: 'var(--flow-block-afternoon)',
                                color: 'var(--flow-block-afternoon-on-color)',
                            },
                            '& .MuiToggleButton-root[value="EVENING"].Mui-selected': {
                                bgcolor: 'var(--flow-block-evening)',
                                color: 'var(--flow-block-evening-on-color)',
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
                                        color: `var(--flow-block-${period.toLowerCase()}-on-color)`,
                                        opacity: isAutoSelected && selectedPeriod === period ? 0.6 : 0,
                                        transition: 'opacity 200ms',
                                    }}
                                >
                                    {isAutoSelected && selectedPeriod === period ? t.currentlyActive : ''}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Filled Button — custom disabled to keep primary color visible */}
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
            </Box>
        </SwipeableDrawer>
    );
}