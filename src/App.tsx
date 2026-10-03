import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { getIcon } from './constants.tsx';
import {
  Task,
  TimePeriod,
  UserSettings,
  Language,
  AlarmConfig,
  Recurrence,
  UserProfile,
  VoiceSettings,
  PrimaryInputMethod,
  VoiceCommand,
  CommandType,
} from './types.ts';
import { TRANSLATIONS, ALARM_SOUNDS, VOICE_TRANSLATIONS } from './constants.tsx';
import { suggestWeight } from './services/taskOptimizer.ts';
import {
  getActivePeriodId,
  getDynamicBlocks,
  getIsRecoveryMode,
  getIsWindDown,
} from './services/circadian.ts';
import { createTaskId, resolveTaskPlacement, type CapacityNotification } from './utils/taskCreation.ts';
import { createMuiTheme } from './theme/mui-theme.ts';
import Auth from './components/Auth.tsx';
import Header from './components/layout/Header.tsx';
import ViewSwitcher from './components/common/ViewSwitcher.tsx';
import DateNavigator from './components/common/DateNavigator.tsx';
import DayView from './components/views/DayView.tsx';
import WeekView from './components/views/WeekView.tsx';
import MonthView from './components/views/MonthView.tsx';
import YearView from './components/views/YearView.tsx';
import SettingsModal from './components/modals/SettingsModal.tsx';
import AlarmPlayingModal from './components/modals/AlarmPlayingModal.tsx';
import VoiceConfirmDialog from './components/modals/VoiceConfirmDialog.tsx';
import { VoiceControlService } from './services/voice/VoiceControlService.ts';
import { VoiceCommandProcessor } from './services/voice/VoiceCommandProcessor.ts';
import VoiceFeedback from './components/voice/VoiceFeedback.tsx';
import FlowToolbar from './components/layout/FlowToolbar';
import TaskBubble from './components/ui/TaskBubble';
import IdeasBank from './components/modals/IdeasBank.tsx';
import SmartPlanner from './components/modals/SmartPlanner.tsx';

type ViewMode = 'day' | 'week' | 'month' | 'year';

const DEFAULT_SETTINGS: UserSettings = {
  wakeUpTime: '07:00',
  restTime: '23:00',
  recoveryDays: [0, 6],
  workHistory: [],
  language: 'en',
  alarm: { enabled: false, time: '07:00', sound: 'forest' },
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  language: 'en',
  autoSubmit: false,
  requireConfirmation: true,
  ttsEnabled: true,
  confidenceThreshold: 0.7,
};

function readStoredJson<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'auth' | 'ready'>(() =>
    localStorage.getItem('flow_user') ? 'ready' : 'splash'
  );
  const [user, setUser] = useState<UserProfile | null>(() => readStoredJson('flow_user', null));
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [viewDate, setViewDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>(() => readStoredJson('flow_tasks', []));
  const [settings, setSettings] = useState<UserSettings>(() => readStoredJson('flow_settings', DEFAULT_SETTINGS));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [lastAlarmTriggeredAt, setLastAlarmTriggeredAt] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem('flow_theme') === 'dark');
  const [isListView, setIsListView] = useState(false);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});
  const [selectedPeriods, setSelectedPeriods] = useState<TimePeriod[]>([TimePeriod.MORNING]);
  const [selectedRecurrence, setSelectedRecurrence] = useState<Recurrence>('none');
  const [tempWake, setTempWake] = useState(settings.wakeUpTime);
  const [tempRest, setTempRest] = useState(settings.restTime);
  const [tempLang, setTempLang] = useState<Language>(settings.language);
  const [tempAlarm, setTempAlarm] = useState<AlarmConfig>(settings.alarm);
  const [tempLeftHanded, setTempLeftHanded] = useState<boolean>(settings.isLeftHanded ?? false);
  const [tempInputMethod, setTempInputMethod] = useState<PrimaryInputMethod>(settings.primaryInputMethod ?? 'text');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [capacityNotification, setCapacityNotification] = useState<CapacityNotification | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() =>
    readStoredJson('flow_voice_settings', { ...DEFAULT_VOICE_SETTINGS, language: settings.language })
  );
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isRecoveryForced, setIsRecoveryForced] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceConfidence, setVoiceConfidence] = useState<number | undefined>();
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'error' | 'success'>('idle');
  const [voiceError, setVoiceError] = useState<string | undefined>();
  const [showVoiceConfirmation, setShowVoiceConfirmation] = useState(false);
  const [pendingVoiceCommand, setPendingVoiceCommand] = useState<VoiceCommand | null>(null);
  const [showIdeas, setShowIdeas] = useState(false);
  const [showSmartPlanner, setShowSmartPlanner] = useState(false);
  const [ideas, setIdeas] = useState<string[]>(() => readStoredJson<string[]>('flow_ideas', []));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const voiceServiceRef = useRef<VoiceControlService | null>(null);
  const voiceProcessorRef = useRef<VoiceCommandProcessor | null>(null);

  const t = TRANSLATIONS[settings.language];
  const todayStr = currentTime.toISOString().split('T')[0];
  const muiTheme = useMemo(() => createMuiTheme(isDarkTheme ? 'dark' : 'light'), [isDarkTheme]);

  const isSettingsDirty = useMemo(() => {
    return tempWake !== settings.wakeUpTime ||
      tempRest !== settings.restTime ||
      tempLang !== settings.language ||
      JSON.stringify(tempAlarm) !== JSON.stringify(settings.alarm);
  }, [tempWake, tempRest, tempLang, tempAlarm, settings]);

  const isWindDown = useMemo(
    () => getIsWindDown(settings.restTime, currentTime),
    [settings.restTime, currentTime]
  );
  const activePeriodId = useMemo(
    () => getActivePeriodId(settings, currentTime),
    [settings, currentTime]
  );
  const isRecoveryMode = useMemo(
    () => isRecoveryForced || getIsRecoveryMode(settings, currentTime, activePeriodId, isWindDown),
    [settings, currentTime, activePeriodId, isWindDown, isRecoveryForced]
  );
  // Кольцевой индикатор в Header: доля выполненных задач дня (Figma: «50%»)
  const dayProgress = useMemo(() => {
    const today = tasks.filter((task) => task.dueDate === todayStr);
    if (today.length === 0) return 0;
    return today.filter((task) => task.completed).length / today.length;
  }, [tasks, todayStr]);
  const dynamicBlocks = useMemo(
    () => getDynamicBlocks(settings, {
      morning: t.morning,
      afternoon: t.afternoon,
      evening: t.evening,
      night: t.night,
    }),
    [settings, t.morning, t.afternoon, t.evening, t.night]
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
    document.documentElement.classList.toggle('light', !isDarkTheme);
    localStorage.setItem('flow_theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  useEffect(() => {
    if (appState !== 'splash') return;
    const timer = setTimeout(() => setAppState(user ? 'ready' : 'auth'), 3000);
    return () => clearTimeout(timer);
  }, [appState, user]);

  useEffect(() => {
    localStorage.setItem('flow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('flow_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (user) localStorage.setItem('flow_user', JSON.stringify(user));
    else localStorage.removeItem('flow_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('flow_voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    localStorage.setItem('flow_ideas', JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    if (!voiceSettings.enabled) {
      voiceServiceRef.current?.dispose();
      voiceServiceRef.current = null;
      voiceProcessorRef.current = null;
      return;
    }

    const service = new VoiceControlService(voiceSettings);
    const processor = new VoiceCommandProcessor(voiceSettings.language);
    voiceServiceRef.current = service;
    voiceProcessorRef.current = processor;

    return () => service.dispose();
  }, [voiceSettings.enabled]);

  useEffect(() => {
    if (!voiceSettings.enabled) return;
    voiceServiceRef.current?.updateSettings(voiceSettings);
    voiceProcessorRef.current?.setLanguage(voiceSettings.language);
  }, [voiceSettings]);

  useEffect(() => {
    if (appState !== 'ready' || activePeriodId === TimePeriod.NIGHT) return;
    setSelectedPeriods((prev) =>
      prev.length === 1 && prev[0] === TimePeriod.MORNING ? [activePeriodId] : prev
    );
  }, [activePeriodId, appState]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (!settings.alarm.enabled || isAlarmPlaying) return;

      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      if (timeStr === settings.alarm.time && lastAlarmTriggeredAt !== timeStr) {
        triggerAlarm();
        setLastAlarmTriggeredAt(timeStr);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.alarm, isAlarmPlaying, lastAlarmTriggeredAt]);

  function showNotification(notification: CapacityNotification) {
    setCapacityNotification(notification);
    setTimeout(() => setCapacityNotification(null), 5000);
  }

  function commitTask(draft: Omit<Task, 'id' | 'createdAt' | 'completed'>, includeBlockOverflowSuffix = true) {
    const targetDate = draft.dueDate || todayStr;
    let notification: CapacityNotification | null = null;

    setTasks((prev) => {
      const placement = resolveTaskPlacement(
        prev,
        draft.periods,
        targetDate,
        draft.weight,
        activePeriodId,
        currentTime,
        settings.language,
        todayStr,
        { title: draft.title, includeBlockOverflowSuffix }
      );

      notification = placement.notification;

      return [
        ...prev,
        {
          ...draft,
          id: createTaskId(),
          createdAt: Date.now(),
          completed: false,
          periods: placement.periods,
          dueDate: placement.date,
        },
      ];
    });

    if (notification) {
      showNotification(notification);
    }
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function updateTask(id: string, updates: Partial<Task>) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));
  }

  function addIdea(title: string) {
    setIdeas((prev) => [...prev, title]);
  }

  /** Конвертирует идею в задачу текущего блока и убирает её из банка */
  function convertIdea(title: string) {
    commitTask({
      title,
      periods: [activePeriodId],
      priority: 'medium',
      weight: suggestWeight(title),
      recurrence: 'none',
      dueDate: todayStr,
    });
    setIdeas((prev) => prev.filter((idea) => idea !== title));
    setShowIdeas(false);
    setIsTaskSheetOpen(true);
  }

  function navigateDate(direction: number) {
    setViewDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'day') next.setDate(next.getDate() + direction);
      else if (viewMode === 'week') next.setDate(next.getDate() + direction * 7);
      else if (viewMode === 'month') next.setMonth(next.getMonth() + direction);
      else next.setFullYear(next.getFullYear() + direction);
      return next;
    });
  }

  function goToToday() {
    setViewDate(new Date());
    setViewMode('day');
  }

  function openTaskSheet() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsTaskSheetOpen(true);
  }

  function handleQuickAdd(period: TimePeriod) {
    if (period === TimePeriod.NIGHT) return;
    setSelectedPeriods([period]);
    openTaskSheet();
  }

  function getVoiceFeedback(commandType: CommandType): string {
    const translations = VOICE_TRANSLATIONS[voiceSettings.language];
    switch (commandType) {
      case CommandType.ADD_TASK:
        return translations.taskAdded;
      case CommandType.DELETE_TASK:
        return translations.taskDeleted;
      case CommandType.TOGGLE_TASK:
        return translations.taskCompleted;
      case CommandType.NAVIGATE_DATE:
        return translations.navigated;
      case CommandType.CHANGE_VIEW:
        return translations.viewChanged;
      case CommandType.UPDATE_TASK:
        return translations.taskUpdated;
      default:
        return translations.navigated;
    }
  }

  function executeVoiceCommand(command: VoiceCommand) {
    switch (command.type) {
      case CommandType.ADD_TASK: {
        if (!command.entities.title) break;

        const weight = suggestWeight(command.entities.title);
        const periods =
          selectedRecurrence === 'all-blocks'
            ? [TimePeriod.MORNING, TimePeriod.AFTERNOON, TimePeriod.EVENING]
            : selectedPeriods.length > 0
              ? [...selectedPeriods]
              : [activePeriodId];

        commitTask({
          title: command.entities.title,
          periods,
          priority: 'medium',
          weight,
          recurrence: 'none',
          dueDate: todayStr,
        }, false);
        break;
      }

      case CommandType.UPDATE_TASK: {
        if (!command.entities.index) break;
        const taskIndex = command.entities.index - 1;
        setTasks((prev) =>
          prev.map((task, index) =>
            index === taskIndex
              ? {
                ...task,
                weight: command.entities.weight ?? task.weight,
                periods: command.entities.period ? [command.entities.period] : task.periods,
                priority: command.entities.priority ?? task.priority,
              }
              : task
          )
        );
        break;
      }

      case CommandType.TOGGLE_TASK: {
        if (command.entities.index) {
          const taskIndex = command.entities.index - 1;
          setTasks((prev) =>
            prev.map((task, index) =>
              index === taskIndex ? { ...task, completed: !task.completed } : task
            )
          );
        } else if (command.entities.title) {
          const title = command.entities.title.toLowerCase();
          setTasks((prev) =>
            prev.map((task) =>
              task.title.toLowerCase().includes(title) ? { ...task, completed: !task.completed } : task
            )
          );
        }
        break;
      }

      case CommandType.DELETE_TASK: {
        if (command.entities.index) {
          const taskIndex = command.entities.index - 1;
          setTasks((prev) => prev.filter((_, index) => index !== taskIndex));
        } else if (command.entities.title) {
          const title = command.entities.title.toLowerCase();
          setTasks((prev) => prev.filter((task) => !task.title.toLowerCase().includes(title)));
        }
        break;
      }

      case CommandType.NAVIGATE_DATE: {
        if (command.entities.direction === 'next') navigateDate(1);
        else if (command.entities.direction === 'prev') navigateDate(-1);
        else if (command.entities.direction === 'today') goToToday();
        break;
      }

      case CommandType.CHANGE_VIEW: {
        if (command.entities.viewMode) setViewMode(command.entities.viewMode);
        break;
      }
    }
  }

  function handleVoiceCommand(command: VoiceCommand) {
    if (command.silent) {
      setIsVoiceProcessing(false);
      setVoiceStatus('idle');
      return;
    }

    setIsVoiceProcessing(true);
    setVoiceStatus('processing');

    try {
      if (command.confidence < voiceSettings.confidenceThreshold && voiceSettings.requireConfirmation) {
        voiceServiceRef.current?.stopListening();
        setPendingVoiceCommand(command);
        setShowVoiceConfirmation(true);
        setVoiceStatus('idle');
        return;
      }

      executeVoiceCommand(command);

      if (voiceSettings.ttsEnabled && voiceServiceRef.current) {
        voiceServiceRef.current.speak(getVoiceFeedback(command.type));
      }

      setVoiceStatus('success');
      setTimeout(() => setVoiceStatus('idle'), 2000);
    } catch {
      setVoiceStatus('error');
      setVoiceError('Failed to execute command');

      if (voiceSettings.ttsEnabled && voiceServiceRef.current) {
        voiceServiceRef.current.speak(VOICE_TRANSLATIONS[voiceSettings.language].error);
      }

      setTimeout(() => {
        setVoiceStatus('idle');
        setVoiceError(undefined);
      }, 3000);
    } finally {
      setIsVoiceProcessing(false);
    }
  }

  function toggleVoiceListening() {
    const service = voiceServiceRef.current;
    const processor = voiceProcessorRef.current;
    if (!service || !processor) return;

    if (isVoiceListening || voiceStatus === 'listening') {
      service.stopListening();
      setIsVoiceListening(false);
      setVoiceStatus('idle');
      setVoiceTranscript('');
      setVoiceConfidence(undefined);
      setShowVoiceConfirmation(false);
      setPendingVoiceCommand(null);
      return;
    }

    setVoiceStatus('listening');
    setIsVoiceListening(true);

    service.startListening(
      (transcript, isFinal, confidence) => {
        setVoiceTranscript(transcript);

        const effectiveConfidence =
          confidence === undefined || confidence === 0
            ? voiceSettings.confidenceThreshold + 0.1
            : confidence;

        setVoiceConfidence(effectiveConfidence);

        if (isFinal) {
          handleVoiceCommand(processor.parseCommand(transcript, effectiveConfidence));
          setIsVoiceListening(false);
        }
      },
      (error) => {
        setVoiceStatus('error');
        setVoiceError(error);
        setIsVoiceListening(false);
        setTimeout(() => {
          setVoiceStatus('idle');
          setVoiceError(undefined);
        }, 3000);
      }
    );
  }

  function handleVoiceConfirmation(confirmed: boolean) {
    setShowVoiceConfirmation(false);

    if (confirmed && pendingVoiceCommand) {
      executeVoiceCommand(pendingVoiceCommand);
      if (voiceSettings.ttsEnabled && voiceServiceRef.current) {
        voiceServiceRef.current.speak(getVoiceFeedback(pendingVoiceCommand.type));
      }
    }

    setPendingVoiceCommand(null);
  }

  function triggerAlarm() {
    const sound = ALARM_SOUNDS.find((item) => item.id === settings.alarm.sound);
    if (!sound || isAlarmPlaying) return;

    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = 0;
    audio.play().catch((error) => console.error('Audio playback blocked', error));
    audioRef.current = audio;
    setIsAlarmPlaying(true);

    const fadeTime = 15000;
    const steps = 100;
    let currentStep = 0;
    fadeIntervalRef.current = window.setInterval(() => {
      currentStep += 1;
      if (audioRef.current) {
        audioRef.current.volume = Math.min(1, currentStep / steps);
      }
      if (currentStep >= steps && fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    }, fadeTime / steps);
  }

  function stopAlarm() {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsAlarmPlaying(false);
  }

  function snoozeAlarm() {
    stopAlarm();
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const newTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setSettings((prev) => ({ ...prev, alarm: { ...prev.alarm, time: newTime } }));
  }

  function handleSaveSettings() {
    const [wH, wM] = tempWake.split(':').map(Number);
    const [rH, rM] = tempRest.split(':').map(Number);
    const wakeM = wH * 60 + wM;
    const restM = rH * 60 + rM;
    const diff = (wakeM + 1440 - restM) % 1440;

    if (diff < 420) {
      setSettingsError(t.sleepGapError);
      return;
    }

    setSettings({
      ...settings,
      wakeUpTime: tempWake,
      restTime: tempRest,
      language: tempLang,
      alarm: tempAlarm,
      isLeftHanded: tempLeftHanded,
      primaryInputMethod: tempInputMethod,
    });
    setSettingsError(null);
    setShowSettings(false);
  }

  function handleLogout() {
    setUser(null);
    setAppState('auth');
    localStorage.removeItem('flow_user');
    window.location.reload();
  }

  function handleTaskAdd(draft: Omit<Task, 'id' | 'createdAt' | 'completed'>) {
    commitTask(draft);
    setIsTaskSheetOpen(false);
    setSelectedRecurrence('none');
    if (activePeriodId !== TimePeriod.NIGHT) {
      setSelectedPeriods([activePeriodId]);
    }
  }

  if (appState === 'splash') {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background: 'var(--md-sys-color-background)',
            color: 'var(--md-sys-color-on-background)',
          }}
        >
          <div className="relative mb-12">
            {getIcon('refresh', 'animate-[spin_10s_linear_infinite]', 80)}
            <div className="absolute inset-0 flex items-center justify-center">
              {getIcon('auto_awesome', 'animate-pulse', 22)}
            </div>
          </div>
          <h1 className="mb-4 text-5xl font-light tracking-tighter">Flow</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Harmonize your day</p>
        </div>
      </ThemeProvider>
    );
  }

  if (appState === 'auth') {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Auth
          lang={settings.language}
          onAuth={(profile) => {
            setUser(profile);
            setAppState('ready');
          }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />

      {/* pb = 88px тулбар + 4px гап до последнего блока (Figma) */}
      <div className="relative mx-auto min-h-screen max-w-lg px-4 pb-[92px] pt-6">
        {isAlarmPlaying && (
          <AlarmPlayingModal settings={settings} onStop={stopAlarm} onSnooze={snoozeAlarm} />
        )}

        <Header
          currentTime={currentTime}
          user={user}
          language={settings.language}
          progress={dayProgress}
          isListView={isListView}
          isRecoveryMode={isRecoveryMode}
          onToggleView={() => setIsListView((prev) => !prev)}
          onToggleRecovery={() => setIsRecoveryForced((prev) => !prev)}
        />

        <VoiceFeedback
          isListening={isVoiceListening}
          isProcessing={isVoiceProcessing}
          transcript={voiceTranscript}
          confidence={voiceConfidence}
          status={voiceStatus}
          errorMessage={voiceError}
          language={voiceSettings.language}
        />

        <Snackbar
          open={capacityNotification !== null}
          autoHideDuration={5000}
          onClose={() => setCapacityNotification(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ top: { xs: 96 } }}
        >
          <Alert
            onClose={() => setCapacityNotification(null)}
            severity={capacityNotification?.type === 'full' ? 'warning' : 'success'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {capacityNotification?.message}
          </Alert>
        </Snackbar>

        <VoiceConfirmDialog
          open={showVoiceConfirmation}
          command={pendingVoiceCommand}
          language={voiceSettings.language}
          onConfirm={() => handleVoiceConfirmation(true)}
          onCancel={() => handleVoiceConfirmation(false)}
        />

        <IdeasBank
          isOpen={showIdeas}
          onClose={() => setShowIdeas(false)}
          ideas={ideas}
          onAddIdea={addIdea}
          onConvertIdea={convertIdea}
          onDeleteIdea={(index) => setIdeas((prev) => prev.filter((_, i) => i !== index))}
          language={settings.language}
        />

        <SmartPlanner
          isOpen={showSmartPlanner}
          onClose={() => setShowSmartPlanner(false)}
          blocks={dynamicBlocks}
          tasks={tasks}
          todayStr={todayStr}
          language={settings.language}
        />

        {/* Figma: гап между кольцом прогресса и свитчером строго 20px */}
        <div style={{ marginTop: '20px' }}>
          <ViewSwitcher
            viewMode={viewMode}
            onModeChange={setViewMode}
            language={settings.language}
          />
        </div>

        {/* Figma-скриншот: свитчер → 20px → DateNavigator (390x44) → 12px → блоки */}
        <div style={{ marginTop: '20px' }}>
          <DateNavigator
            viewDate={viewDate}
            viewMode={viewMode}
            todayStr={todayStr}
            language={settings.language}
            onNavigate={navigateDate}
            onToday={goToToday}
          />
        </div>

        <main
          className="animate-in fade-in duration-500"
          style={{ marginTop: '12px', paddingInline: '2px' }}
        >
          {viewMode === 'day' && (
            <DayView
              isRecoveryMode={isRecoveryMode}
              isWindDown={isWindDown}
              isListView={isListView}
              currentTime={currentTime}
              dynamicBlocks={dynamicBlocks}
              activePeriodId={activePeriodId}
              todayStr={todayStr}
              viewDate={viewDate}
              tasks={tasks}
              collapsedBlocks={collapsedBlocks}
              language={settings.language}
              isTaskSheetOpen={isTaskSheetOpen}
              onCloseTaskSheet={() => setIsTaskSheetOpen(false)}
              onTaskAdd={handleTaskAdd}
              onQuickAdd={handleQuickAdd}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onToggleCollapse={(blockId) =>
                setCollapsedBlocks((prev) => ({ ...prev, [blockId]: !prev[blockId] }))
              }
              onDeleteAllCompleted={() => setTasks((prev) => prev.filter((task) => !task.completed))}
              onDeleteAll={() => setTasks([])}
            />
          )}

          {viewMode === 'week' && (
            <WeekView
              viewDate={viewDate}
              tasks={tasks}
              settings={settings}
              todayStr={todayStr}
              language={settings.language}
              activePeriodId={activePeriodId}
              onDayClick={(day) => {
                setViewDate(day);
                setViewMode('day');
              }}
            />
          )}

          {viewMode === 'month' && (
            <MonthView
              viewDate={viewDate}
              tasks={tasks}
              settings={settings}
              todayStr={todayStr}
              onDayClick={(day) => {
                setViewDate(day);
                setViewMode('day');
              }}
            />
          )}

          {viewMode === 'year' && (
            <YearView viewDate={viewDate} tasks={tasks} language={settings.language} />
          )}
        </main>

        {showSettings && (
          <SettingsModal
            settings={settings}
            isDarkTheme={isDarkTheme}
            onToggleTheme={() => setIsDarkTheme((prev) => !prev)}
            tempWake={tempWake}
            tempRest={tempRest}
            tempLang={tempLang}
            tempAlarm={tempAlarm}
            isDirty={isSettingsDirty}
            error={settingsError}
            voiceSettings={voiceSettings}
            onVoiceSettingsChange={setVoiceSettings}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
            onTempWakeChange={setTempWake}
            onTempRestChange={setTempRest}
            onTempLangChange={setTempLang}
            tempLeftHanded={tempLeftHanded}
            tempInputMethod={tempInputMethod}
            onTempLeftHandedChange={setTempLeftHanded}
            onTempInputMethodChange={setTempInputMethod}
          />
        )}

        <FlowToolbar
          onSettingsClick={() => setShowSettings(true)}
          onIdeasClick={() => setShowIdeas(true)}
          onVoiceClick={toggleVoiceListening}
          onAddTaskClick={openTaskSheet}
          onSmartPlannerClick={() => setShowSmartPlanner(true)}
          isVoiceListening={isVoiceListening}
          language={settings.language}
          primaryInputMethod={settings.primaryInputMethod}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;