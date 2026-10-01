import React from 'react';
import { X, Bell, ChevronDown } from 'lucide-react';
import { UserSettings, AlarmConfig } from '../../types.ts';
import { TRANSLATIONS, ALARM_SOUNDS } from '../../constants.tsx';

interface AlarmModalProps {
  settings: UserSettings;
  tempAlarm: AlarmConfig;
  onSave: () => void;
  onClose: () => void;
  onTempAlarmChange: (alarm: AlarmConfig) => void;
}

const AlarmModal: React.FC<AlarmModalProps> = ({
  settings,
  tempAlarm,
  onSave,
  onClose,
  onTempAlarmChange,
}) => {
  const t = TRANSLATIONS[settings.language];

  return (
    <div className="fixed inset-0 z-[110] flex items-end">
      <button type="button" className="sheet-scrim absolute inset-0" onClick={onClose} aria-label="Close" />
      <div
        className="sheet-panel modal-enter modal-enter-active w-full relative p-8 pb-12 space-y-8"
        style={{
          background: 'var(--md-sys-color-surface-container-low)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0',
          boxShadow: 'var(--md-sys-elevation-shadow-3)',
          minWidth: '280px',
          maxWidth: '560px',
          margin: '0 auto',
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
            {t.alarm}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="md-state-layer md-focus-ring flex items-center justify-center"
            style={{ color: 'var(--md-sys-color-on-surface-variant)', minWidth: 48, minHeight: 48 }}
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-8">
          <div
            className="flex items-center justify-between p-6 min-h-[56px]"
            style={{
              background: 'var(--md-sys-color-surface-container)',
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  background: tempAlarm.enabled
                    ? 'var(--md-sys-color-primary-container)'
                    : 'var(--md-sys-color-surface-container-high)',
                  color: tempAlarm.enabled
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                <Bell size={22} />
              </div>
              <div>
                <h3 className="md-typescale-title-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {t.enableAlarm}
                </h3>
                <span className="md-typescale-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Smooth wake-up sequence
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTempAlarmChange({ ...tempAlarm, enabled: !tempAlarm.enabled })}
              className="relative w-14 h-8 rounded-full"
              style={{
                background: tempAlarm.enabled
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-outline-variant)',
              }}
            >
              <span
                className="absolute top-1 w-6 h-6 rounded-full transition-all duration-md-short4"
                style={{
                  background: 'var(--md-sys-color-on-primary)',
                  left: tempAlarm.enabled ? 28 : 4,
                }}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <label className="md-typescale-label-large" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Wake Time
              </label>
              <input
                type="time"
                value={tempAlarm.time}
                onChange={(e) => onTempAlarmChange({ ...tempAlarm, time: e.target.value })}
                className="md-focus-ring w-full p-4 md-typescale-title-large"
                style={{
                  background: 'var(--md-sys-color-surface-container-highest)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  color: 'var(--md-sys-color-on-surface)',
                  minHeight: '48px',
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="md-typescale-label-large" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.sound}
              </label>
              <div className="relative">
                <select
                  value={tempAlarm.sound}
                  onChange={(e) => onTempAlarmChange({ ...tempAlarm, sound: e.target.value })}
                  className="md-focus-ring w-full p-4 md-typescale-body-large appearance-none"
                  style={{
                    background: 'var(--md-sys-color-surface-container-highest)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    color: 'var(--md-sys-color-on-surface)',
                    minHeight: '48px',
                  }}
                >
                  {ALARM_SOUNDS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label[settings.language as keyof typeof s.label]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSave}
            className="md-state-layer md-focus-ring w-full py-4 md-typescale-label-large transition-all duration-md-short4"
            style={{
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
              minHeight: '48px',
              background: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              boxShadow: 'var(--md-sys-elevation-shadow-2)',
            }}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmModal;
