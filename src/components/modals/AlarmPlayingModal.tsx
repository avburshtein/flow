import React from 'react';
import { Bell } from 'lucide-react';
import { UserSettings } from '../../types.ts';
import { TRANSLATIONS, RECOVERY_TIPS } from '../../constants.tsx';

interface AlarmPlayingModalProps {
  settings: UserSettings;
  onStop: () => void;
  onSnooze: () => void;
}

const AlarmPlayingModal: React.FC<AlarmPlayingModalProps> = ({ settings, onStop, onSnooze }) => {
  const t = TRANSLATIONS[settings.language];
  const tipIndex = Math.floor(new Date().getHours() / 5) % 5;
  const tip = RECOVERY_TIPS[settings.language][tipIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-12 text-center modal-enter modal-enter-active"
      style={{ background: 'var(--md-sys-color-scrim)' }}
    >
      <div
        className="modal-enter modal-enter-active flex flex-col items-center w-full max-w-[560px]"
        style={{
          background: 'var(--md-sys-color-surface-container-high)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
          boxShadow: 'var(--md-sys-elevation-shadow-3)',
          minWidth: '280px',
          padding: '24px',
        }}
      >
        <div
          className="w-32 h-32 flex items-center justify-center mb-8"
          style={{
            borderRadius: 'var(--md-sys-shape-corner-full)',
            background: 'var(--md-sys-color-primary-container)',
          }}
        >
          <Bell size={64} style={{ color: 'var(--md-sys-color-on-primary-container)' }} />
        </div>
        <h2 className="md-typescale-headline-small mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {t.flowStart}
        </h2>
        <p className="md-typescale-body-medium mb-10 max-w-md" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          &ldquo;{tip}&rdquo;
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={onStop}
            className="md-state-layer md-focus-ring w-full py-4 md-typescale-label-large"
            style={{
              borderRadius: 'var(--md-sys-shape-corner-large)',
              minHeight: '40px',
              background: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            {t.enterThread}
          </button>
          <button
            type="button"
            onClick={onSnooze}
            className="md-state-layer md-focus-ring w-full py-4 md-typescale-label-large"
            style={{
              borderRadius: 'var(--md-sys-shape-corner-large)',
              minHeight: '40px',
              color: 'var(--md-sys-color-primary)',
            }}
          >
            {t.snooze}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmPlayingModal;
