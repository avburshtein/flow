export enum TimePeriod {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night'
}

export enum TaskWeight {
  quick = 'quick',
  focused = 'focused',
  deep = 'deep',
}

export type Priority = 'low' | 'medium' | 'high';

export type Language = 'en' | 'ru' | 'es';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'all-blocks';

export type OptimizationStrategy = 'balanced' | 'quick-wins' | 'priority-first';

export type PrimaryInputMethod = 'voice' | 'text';

export interface AlarmConfig {
  enabled: boolean;
  time: string; // HH:mm
  sound: string; // sound key
}

export interface UserSettings {
  wakeUpTime: string; // HH:mm
  restTime: string;   // HH:mm
  recoveryDays: number[]; // [0-6] where 0 is Sunday
  workHistory: string[]; // List of YYYY-MM-DD strings where tasks were completed
  language: Language;
  alarm: AlarmConfig;
  /** Thumb-driven layout: зеркалит DateNavigator и FlowToolbar */
  isLeftHanded?: boolean;
  /** Определяет иконку центральной FAB в тулбаре */
  primaryInputMethod?: PrimaryInputMethod;
}

export interface Task {
  id: string;
  title: string;
  periods: TimePeriod[];
  completed: boolean;
  createdAt: number;
  originalPeriod?: TimePeriod;
  priority: Priority;
  weight: TaskWeight;
  notes?: string;
  dueDate?: string;
  recurrence?: Recurrence;
}

export interface TimeBlockConfig {
  id: TimePeriod;
  label: string;
  startTime: string;
  endTime: string;
  icon: string;
}

// Added UserProfile interface to fix the "Module '../types' has no exported member 'UserProfile'" error in Auth.tsx
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isGuest: boolean;
}

// Voice Control Types
export enum CommandType {
  ADD_TASK = 'add_task',
  TOGGLE_TASK = 'toggle_task',
  DELETE_TASK = 'delete_task',
  NAVIGATE_DATE = 'navigate_date',
  CHANGE_VIEW = 'change_view',
  UPDATE_TASK = 'update_task',
  UNKNOWN = 'unknown'
}

export interface CommandEntities {
  title?: string;
  index?: number;
  weight?: TaskWeight;
  period?: TimePeriod;
  priority?: Priority;
  date?: Date;
  direction?: 'next' | 'prev' | 'today';
  viewMode?: 'day' | 'week' | 'month' | 'year';
}

export interface VoiceCommand {
  type: CommandType;
  intent: string;
  entities: CommandEntities;
  confidence: number;
  rawText: string;
  silent?: boolean;
}

export interface VoiceSettings {
  enabled: boolean;
  language: 'ru' | 'en' | 'es';
  autoSubmit: boolean;
  requireConfirmation: boolean;
  ttsEnabled: boolean;
  ttsVoice?: string;
  confidenceThreshold: number;
}

export interface VoiceCommandResult {
  success: boolean;
  command?: VoiceCommand;
  error?: string;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}