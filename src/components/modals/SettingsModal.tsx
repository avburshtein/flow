import React, { useState, useEffect } from 'react';
import { X, Mic, AlertTriangle, Trash2 } from 'lucide-react';
import { UserSettings, AlarmConfig, Language, VoiceSettings, PrimaryInputMethod } from '../../types.ts';
import { TRANSLATIONS, VOICE_TRANSLATIONS } from '../../constants.tsx';
import { Button } from '@mui/material';

// Language map for Web Speech API
const LANG_MAP: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES'
};

interface SettingsModalProps {
  settings: UserSettings;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  tempWake: string;
  tempRest: string;
  tempLang: Language;
  tempAlarm: AlarmConfig;
  tempLeftHanded: boolean;
  tempInputMethod: PrimaryInputMethod;
  /** Recovery Mode: auto / on / off */
  tempRecoveryOverride: 'auto' | 'on' | 'off';
  isDirty: boolean;
  error: string | null;
  voiceSettings?: VoiceSettings;
  onSave: () => void;
  onClose: () => void;
  onLogout: () => void;
  onTempWakeChange: (value: string) => void;
  onTempRestChange: (value: string) => void;
  onTempLangChange: (lang: Language) => void;
  onTempLeftHandedChange: (value: boolean) => void;
  onTempInputMethodChange: (value: PrimaryInputMethod) => void;
  onTempRecoveryOverrideChange: (value: 'auto' | 'on' | 'off') => void;
  onVoiceSettingsChange?: (settings: VoiceSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isDarkTheme,
  onToggleTheme,
  tempWake,
  tempRest,
  tempLang,
  tempAlarm,
  tempLeftHanded,
  tempInputMethod,
  tempRecoveryOverride,
  isDirty,
  error,
  voiceSettings,
  onSave,
  onClose,
  onLogout,
  onTempWakeChange,
  onTempRestChange,
  onTempLangChange,
  onTempLeftHandedChange,
  onTempInputMethodChange,
  onTempRecoveryOverrideChange,
  onVoiceSettingsChange
}) => {
  const t = TRANSLATIONS[settings.language];
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [tempVoiceSettings, setTempVoiceSettings] = useState<VoiceSettings>(
    voiceSettings || {
      enabled: false,
      language: settings.language as 'ru' | 'en' | 'es',
      autoSubmit: false,
      requireConfirmation: true,
      ttsEnabled: true,
      confidenceThreshold: 0.7
    }
  );

  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('flow_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkTheme);
    document.documentElement.classList.toggle('light', !darkTheme);
    localStorage.setItem('flow_theme', darkTheme ? 'dark' : 'light');
  }, [darkTheme]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleVoiceToggle = (key: keyof VoiceSettings) => {
    setTempVoiceSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof VoiceSettings]
    }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end">
      <button type="button" className="sheet-scrim absolute inset-0" onClick={onClose} aria-label="Close" />
      <div
        className="sheet-panel modal-enter modal-enter-active w-full relative p-8 pb-12 space-y-6"
        style={{
          background: 'var(--md-sys-color-surface-container-low)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0',
          boxShadow: 'var(--md-sys-elevation-shadow-3)',
        }}
      >
        <div
          className="mx-auto mb-2"
          style={{
            width: 32,
            height: 4,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            background: 'var(--md-sys-color-outline-variant)',
          }}
        />

        <div className="flex items-center justify-between min-h-[56px]">
          <h2 className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {t.settings}
          </h2>
          <button
            onClick={onClose}
            className="md-state-layer md-focus-ring flex items-center justify-center"
            style={{ color: 'var(--md-sys-color-on-surface-variant)', minWidth: 48, minHeight: 48 }}
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center justify-between min-h-[56px]">
            <span className="md-typescale-body-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Dark theme
            </span>
            <button
              type="button"
              onClick={() => setDarkTheme((v) => !v)}
              className={`flow-switch ${darkTheme ? 'flow-switch--on' : ''}`}
              aria-pressed={darkTheme}
            >
              <span className="flow-switch-thumb" style={{ left: darkTheme ? 28 : 4 }} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flow-label">{t.morning} Start</label>
              <input
                type="time"
                value={tempWake}
                onChange={e => onTempWakeChange(e.target.value)}
                className="flow-input md-focus-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="flow-label">{t.night} Rest</label>
              <input
                type="time"
                value={tempRest}
                onChange={e => onTempRestChange(e.target.value)}
                className="flow-input md-focus-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flow-label">{t.language}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['en', 'ru', 'es'] as Language[]).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onTempLangChange(l)}
                  className={`flow-chip ${tempLang === l ? 'flow-chip--selected' : ''}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Theme — перенесено из Header по Figma-структуре */}
          <button
            type="button"
            role="switch"
            aria-checked={isDarkTheme}
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between gap-4 rounded-xl px-4 md-state-layer"
            style={{
              minHeight: '52px',
              background: 'var(--md-sys-color-surface-container)',
            }}
          >
            <span
              className="text-sm font-medium text-left"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.theme}
            </span>
            <span
              className="relative shrink-0 inline-flex items-center"
              style={{
                width: 52,
                height: 32,
                borderRadius: 'var(--md-sys-shape-corner-full)',
                background: isDarkTheme
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-surface-container-highest)',
                transition: 'background var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
              }}
            >
              <span
                className="absolute block"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  background: 'var(--md-sys-color-on-primary)',
                  left: isDarkTheme ? 24 : 4,
                  top: 4,
                  transition: 'left var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-emphasized-decel)',
                }}
              />
            </span>
          </button>

          {/* Method Selection — Figma: Method Selection Dialog */}
          <div className="space-y-2">
            <label className="flow-label">{t.primaryInputMethod}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['text', 'voice'] as PrimaryInputMethod[]).map(m => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={tempInputMethod === m}
                  onClick={() => onTempInputMethodChange(m)}
                  className={`flow-chip ${tempInputMethod === m ? 'flow-chip--selected' : ''}`}
                >
                  {m === 'text' ? t.inputText : t.inputVoice}
                </button>
              ))}
            </div>
          </div>

          {/* Left-handed mode — thumb-driven layout */}
          <button
            type="button"
            role="switch"
            aria-checked={tempLeftHanded}
            onClick={() => onTempLeftHandedChange(!tempLeftHanded)}
            className="w-full flex items-center justify-between gap-4 rounded-xl px-4 md-state-layer"
            style={{
              minHeight: '52px',
              background: 'var(--md-sys-color-surface-container)',
            }}
          >
            <span
              className="text-sm font-medium text-left"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.leftHanded}
            </span>
            <span
              className="relative shrink-0 inline-flex items-center"
              style={{
                width: 52,
                height: 32,
                borderRadius: 'var(--md-sys-shape-corner-full)',
                background: tempLeftHanded
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-surface-container-highest)',
                transition: 'background var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
              }}
            >
              <span
                className="absolute block"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  background: 'var(--md-sys-color-on-primary)',
                  left: tempLeftHanded ? 24 : 4,
                  top: 4,
                  transition: 'left var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-emphasized-decel)',
                }}
              />
            </span>
          </button>

          {/* Recovery Mode — auto (по циркадному времени) / принудительно вкл/выкл.
              Вынесено из кликов по листику в Header: явная настройка вместо скрытого tri-state. */}
          <div className="space-y-2">
            <label className="flow-label">{t.recoveryMode}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'on', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={tempRecoveryOverride === mode}
                  onClick={() => onTempRecoveryOverrideChange(mode)}
                  className={`flow-chip ${tempRecoveryOverride === mode ? 'flow-chip--selected' : ''}`}
                >
                  {mode === 'auto' ? t.recoveryAuto : mode === 'on' ? t.recoveryOn : t.recoveryOff}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Control Section */}
          {voiceSettings && onVoiceSettingsChange && (
            <div className="pt-6 border-t flow-divider border-t space-y-4">
              <div className="flex items-center gap-2">
                <Mic size={18} className="flow-text-muted" />
                <label className="text-[10px] font-black uppercase flow-text-muted tracking-widest">
                  {VOICE_TRANSLATIONS[settings.language].voiceSettings || 'Voice Control'}
                </label>
              </div>

              {/* Enable Voice Control */}
              <div className="flex items-center justify-between">
                <label className="text-sm flow-text-muted">{VOICE_TRANSLATIONS[settings.language].enableVoice || 'Enable Voice'}</label>
                <button
                  onClick={() => {
                    handleVoiceToggle('enabled');
                    onVoiceSettingsChange({ ...tempVoiceSettings, enabled: !tempVoiceSettings.enabled });
                  }}
                  className={`flow-switch ${tempVoiceSettings.enabled ? 'flow-switch--on' : ''}`}
                >
                  <span className="flow-switch-thumb" style={{ left: tempVoiceSettings.enabled ? 28 : 4 }} />
                </button>
              </div>

              {/* Voice Language */}
              <div className="space-y-2">
                <label className="text-sm flow-text-muted">{VOICE_TRANSLATIONS[settings.language].voiceLanguage || 'Language'}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTempVoiceSettings(prev => ({ ...prev, language: 'ru' }));
                      onVoiceSettingsChange({ ...tempVoiceSettings, language: 'ru' });
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${tempVoiceSettings.language === 'ru'
                      ? 'flow-chip flow-chip--selected'
                      : 'flow-chip'
                      }`}
                  >
                    {VOICE_TRANSLATIONS[settings.language].russian || 'RU'}
                  </button>
                  <button
                    onClick={() => {
                      setTempVoiceSettings(prev => ({ ...prev, language: 'en' }));
                      onVoiceSettingsChange({ ...tempVoiceSettings, language: 'en' });
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${tempVoiceSettings.language === 'en'
                      ? 'flow-chip flow-chip--selected'
                      : 'flow-chip'
                      }`}
                  >
                    {VOICE_TRANSLATIONS[settings.language].english || 'EN'}
                  </button>
                  <button
                    onClick={() => {
                      setTempVoiceSettings(prev => ({ ...prev, language: 'es' }));
                      onVoiceSettingsChange({ ...tempVoiceSettings, language: 'es' });
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${tempVoiceSettings.language === 'es'
                      ? 'flow-chip flow-chip--selected'
                      : 'flow-chip'
                      }`}
                  >
                    {VOICE_TRANSLATIONS[settings.language].spanish || 'ES'}
                  </button>
                </div>
              </div>

              {/* Auto Submit */}
              <div className="flex items-center justify-between">
                <label className="text-sm flow-text-muted">{VOICE_TRANSLATIONS[settings.language].autoSubmit || 'Auto Submit'}</label>
                <button
                  onClick={() => {
                    handleVoiceToggle('autoSubmit');
                    onVoiceSettingsChange({ ...tempVoiceSettings, autoSubmit: !tempVoiceSettings.autoSubmit });
                  }}
                  className={`flow-switch ${tempVoiceSettings.autoSubmit ? 'flow-switch--on' : ''}`}
                >
                  <span className="flow-switch-thumb" style={{ left: tempVoiceSettings.autoSubmit ? 28 : 4 }} />
                </button>
              </div>

              {/* Require Confirmation */}
              <div className="flex items-center justify-between">
                <label className="text-sm flow-text-muted">{VOICE_TRANSLATIONS[settings.language].requireConfirmation || 'Require Confirmation'}</label>
                <button
                  onClick={() => {
                    handleVoiceToggle('requireConfirmation');
                    onVoiceSettingsChange({ ...tempVoiceSettings, requireConfirmation: !tempVoiceSettings.requireConfirmation });
                  }}
                  className={`flow-switch ${tempVoiceSettings.requireConfirmation ? 'flow-switch--on' : ''}`}
                >
                  <span className="flow-switch-thumb" style={{ left: tempVoiceSettings.requireConfirmation ? 28 : 4 }} />
                </button>
              </div>

              {/* TTS Feedback */}
              <div className="flex items-center justify-between">
                <label className="text-sm flow-text-muted">{VOICE_TRANSLATIONS[settings.language].enableTTS || 'Voice Feedback'}</label>
                <button
                  onClick={() => {
                    handleVoiceToggle('ttsEnabled');
                    onVoiceSettingsChange({ ...tempVoiceSettings, ttsEnabled: !tempVoiceSettings.ttsEnabled });
                  }}
                  className={`flow-switch ${tempVoiceSettings.ttsEnabled ? 'flow-switch--on' : ''}`}
                >
                  <span className="flow-switch-thumb" style={{ left: tempVoiceSettings.ttsEnabled ? 28 : 4 }} />
                </button>
              </div>

              {/* Voice Selection for TTS */}
              {tempVoiceSettings.ttsEnabled && availableVoices.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm flow-text-muted">Voice</label>
                  <select
                    value={tempVoiceSettings.ttsVoice || ''}
                    onChange={(e) => {
                      const newSettings = { ...tempVoiceSettings, ttsVoice: e.target.value };
                      setTempVoiceSettings(newSettings);
                      onVoiceSettingsChange(newSettings);
                    }}
                    className="flow-input md-focus-ring text-sm"
                  >
                    <option value="" className="bg-gray-800">Default</option>
                    {availableVoices
                      .filter(voice => voice.lang.startsWith(LANG_MAP[tempVoiceSettings.language]?.split('-')[0] || tempVoiceSettings.language))
                      .map(voice => (
                        <option
                          key={voice.name}
                          value={voice.name}
                          className="bg-gray-800"
                        >
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Confidence Threshold */}
              <div className="space-y-2">
                <label className="text-sm flow-text-muted">{VOICE_TRANSLATIONS[settings.language].confidenceThreshold || 'Confidence Threshold'}</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={tempVoiceSettings.confidenceThreshold}
                    onChange={(e) => {
                      const newSettings = {
                        ...tempVoiceSettings,
                        confidenceThreshold: parseFloat(e.target.value)
                      };
                      setTempVoiceSettings(newSettings);
                      onVoiceSettingsChange(newSettings);
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm flow-text-muted w-12 text-right">
                    {Math.round(tempVoiceSettings.confidenceThreshold * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {isDirty && (
            <div className="pt-6 border-t flow-divider border-t flex flex-col gap-3">
              <Button variant="contained" onClick={onSave}>
                {t.save}
              </Button>
              <button
                onClick={onLogout}
                className="w-full py-5 text-[10px] font-black uppercase tracking-widest rounded-3xl transition-all flex items-center justify-center gap-2 md-state-layer"
                style={{ color: 'var(--md-sys-color-error)', minHeight: 48 }}
              >
                <Trash2 size={14} /> {t.rhythm === 'Your Rhythm' ? 'Log Out' : t.rhythm}
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
