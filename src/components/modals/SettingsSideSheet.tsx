import React from 'react';
import {
  X, Palette, Clock, BellRing, MoonStar, ShieldCheck, Database, Info,
  ChevronRight, Mic, Type, Hand, Sun, LogOut, Trash2
} from 'lucide-react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import { UserSettings, AlarmConfig, Language, VoiceSettings, PrimaryInputMethod } from '../../types.ts';
import { TRANSLATIONS, VOICE_TRANSLATIONS } from '../../constants.tsx';

// ── Токены M3 (единый источник — tokens.css) ──────────────────────────────
const C = {
  surface: 'var(--md-sys-color-surface-container-low)',
  onSurface: 'var(--md-sys-color-on-surface)',
  onSurfaceVar: 'var(--md-sys-color-on-surface-variant)',      // #4a454e — Supporting/Overline
  outlineVar: 'var(--md-sys-color-outline-variant)',
  secondaryContainer: 'var(--md-sys-color-secondary-container)', // #e9ddff — selected сегмент
  onSecondaryContainer: 'var(--md-sys-color-on-secondary-container)', // #4d3d75
  primary: 'var(--md-sys-color-primary)',
  onPrimary: 'var(--md-sys-color-on-primary)',
  error: 'var(--md-sys-color-error)',
};
const ROW_H = 52;   // строка-ребёнок (Figma)
const CORNER = 'var(--md-sys-shape-corner-extra-large)';

interface SettingsSideSheetProps {
  settings: UserSettings;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  tempWake: string;
  tempRest: string;
  tempLang: Language;
  tempAlarm: AlarmConfig;
  tempLeftHanded: boolean;
  tempInputMethod: PrimaryInputMethod;
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

// ── Заголовок-аккордеон (M3 List item 91px) ────────────────────────────────
const Section: React.FC<{
  icon: React.ReactNode; label: string; supporting: string;
  children: React.ReactNode;
}> = ({ icon, label, supporting, children }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Accordion expanded={open} onChange={() => setOpen((v) => !v)} disableGutters square elevation={0}
      sx={{ background: 'transparent', '&:before': { display: 'none' } }}>
      <AccordionSummary
        expandIcon={<ChevronRight size={20} style={{ color: C.onSurfaceVar, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }} />}
        sx={{ minHeight: '91px !important', px: 2, '& .MuiAccordionSummary-content': { my: '12px', alignItems: 'center', gap: '16px' } }}>
        <Box aria-hidden="true" sx={{ display: 'flex', color: C.onSurfaceVar, minWidth: 20 }}>{icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 500, color: C.onSurface, lineHeight: '24px' }}>{label}</Typography>
          <Typography sx={{ fontSize: 14, color: C.onSurfaceVar, lineHeight: '20px', mt: '2px' }}>{supporting}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 1 }}>{children}</AccordionDetails>
    </Accordion>
  );
};

// ── Строка-ребёнок с Switch (52px) ─────────────────────────────────────────
const SwitchRow: React.FC<{ label: string; supporting?: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }> =
  ({ label, supporting, checked, onChange, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: `${ROW_H}px`, py: 1 }}>
    {icon && <Box aria-hidden="true" sx={{ display: 'flex', color: C.onSurfaceVar, minWidth: 20 }}>{icon}</Box>}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 16, color: C.onSurface, lineHeight: '24px' }}>{label}</Typography>
      {supporting && <Typography sx={{ fontSize: 14, color: C.onSurfaceVar, lineHeight: '20px' }}>{supporting}</Typography>}
    </Box>
    <Switch checked={checked} onChange={(e) => onChange(e.target.checked)}
      sx={{ '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: C.primary, opacity: 1 } }} />
  </Box>
);

// ── Строка-ребёнок со Trailing-значением + chevron (Method, Change PIN…) ────
const ValueRow: React.FC<{ label: string; supporting?: string; value: string; icon?: React.ReactNode; onClick?: () => void }> =
  ({ label, supporting, value, icon, onClick }) => (
  <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: `${ROW_H}px`, py: 1, cursor: onClick ? 'pointer' : 'default', borderRadius: '12px', '&:active': { bgcolor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)' } }}>
    {icon && <Box aria-hidden="true" sx={{ display: 'flex', color: C.onSurfaceVar, minWidth: 20 }}>{icon}</Box>}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 16, color: C.onSurface, lineHeight: '24px' }}>{label}</Typography>
      {supporting && <Typography sx={{ fontSize: 14, color: C.onSurfaceVar, lineHeight: '20px' }}>{supporting}</Typography>}
    </Box>
    <Typography sx={{ fontSize: 14, color: C.onSurfaceVar }}>{value}</Typography>
    <ChevronRight size={20} style={{ color: C.onSurfaceVar }} />
  </Box>
);

// ── Segmented (M3) для темы / языка / recovery / input method ───────────────
const segButtonSx = {
  flex: 1, minHeight: 48, textTransform: 'none', fontSize: 14, fontWeight: 500,
  color: C.onSurfaceVar, borderColor: C.outlineVar,
  '&.Mui-selected': { bgcolor: C.secondaryContainer, color: C.onSecondaryContainer, fontWeight: 600 },
};
const Segmented: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string; icon?: React.ReactNode }[] }> =
  ({ value, onChange, options }) => (
  <ToggleButtonGroup value={value} exclusive onChange={(_, v) => v && onChange(v)} fullWidth sx={{ display: 'flex' }}>
    {options.map((o) => (
      <ToggleButton key={o.value} value={o.value} sx={segButtonSx}>
        {o.icon && <Box aria-hidden="true" sx={{ display: 'flex', mr: '6px' }}>{o.icon}</Box>}
        {o.label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);

// ── Строка-ребёнок с time-инпутом (Wake / Rest / Alarm) ────────────────────
const TimeRow: React.FC<{ label: string; value: string; onChange: (v: string) => void }> =
  ({ label, value, onChange }) => {
  // M3 "Direct Input" (Figma): два поля HH:MM в primary-container /
  // on-primary-container, рамка primary. Без нативного ОС-пикера.
  const [hh, mm] = (value || '00:00').split(':');
  const clampNum = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const commit = (h: string, m: string) => {
    const hhN = clampNum(parseInt(h, 10) || 0, 0, 23);
    const mmN = clampNum(parseInt(m, 10) || 0, 0, 59);
    onChange(`${String(hhN).padStart(2, '0')}:${String(mmN).padStart(2, '0')}`);
  };
  const fieldSx = {
    width: '52px', minWidth: 0, flexShrink: 0, padding: 0, height: '44px', textAlign: 'center' as const, fontSize: 16, fontWeight: 500,
    fontFamily: 'inherit', borderRadius: '12px', border: `1px solid var(--md-sys-color-primary)`,
    background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)',
    outline: 'none', '&:focus': { borderColor: 'var(--md-sys-color-primary)' },
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: `${ROW_H}px`, py: 1 }}>
      <Typography sx={{ flex: 1, minWidth: 0, fontSize: 16, color: C.onSurface, lineHeight: '24px' }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <Box
          component="input"
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={hh}
          aria-label={`${label} hours`}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => commit(e.target.value.replace(/\D/g, ''), mm)}
          sx={fieldSx}
        />
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.onSurfaceVar }}>:</Typography>
        <Box
          component="input"
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={mm}
          aria-label={`${label} minutes`}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => commit(hh, e.target.value.replace(/\D/g, ''))}
          sx={fieldSx}
        />
      </Box>
    </Box>
  );
};

const DIVIDER = <Box sx={{ height: '1px', background: C.outlineVar, opacity: 0.6 }} />;
// ═══════════════════════════════════════════════════════════════════════════
const SettingsSideSheet: React.FC<SettingsSideSheetProps> = ({
  settings, isDarkTheme, onToggleTheme,
  tempWake, tempRest, tempLang, tempAlarm,
  tempLeftHanded, tempInputMethod, tempRecoveryOverride,
  isDirty, error, onSave, onClose, onLogout,
  onTempWakeChange, onTempRestChange, onTempLangChange,
  onTempLeftHandedChange, onTempInputMethodChange, onTempRecoveryOverrideChange,
  voiceSettings, onVoiceSettingsChange,
}) => {
  const t = TRANSLATIONS[settings.language];

  return (
    <Box role="dialog" aria-label={t.settings} sx={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Scrim */}
      <Box onClick={onClose} sx={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      {/* Side Sheet panel 390px (Figma) */}
      <Box sx={{ position: 'relative', width: { xs: '100%', sm: '390px' }, maxWidth: '100%', height: '100%', background: C.surface, display: 'flex', flexDirection: 'column', boxShadow: 'var(--md-sys-elevation-shadow-3)' }}>
        {/* Header 76px: Back + Headline + Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: 76, px: 1 }}>
          <Box component="button" type="button" onClick={onClose} aria-label="Back"
            sx={{ minWidth: 48, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.onSurface, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '999px', '&:hover': { bgcolor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)' } }}>
            <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
          </Box>
          <Typography sx={{ flex: 1, fontSize: 22, fontWeight: 500, color: C.onSurfaceVar }}>{t.settings}</Typography>
          <Box component="button" type="button" onClick={onClose} aria-label="Close"
            sx={{ minWidth: 48, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.onSurface, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '999px', '&:hover': { bgcolor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)' } }}>
            <X size={24} />
          </Box>
        </Box>
        <Box sx={{ height: '1px', background: C.outlineVar }} />

        {/* Scrollable sections */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 2 }}>
          {/* ── Appearance ── */}
          <Section icon={<Palette size={20} />} label="Appearance" supporting="Switch between light and dark theme and language.">
            <SwitchRow label="Dark theme" checked={isDarkTheme} onChange={onToggleTheme} />
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.onSurface, mt: 1, mb: 1 }}>Language</Typography>
            <Segmented value={tempLang} onChange={(v) => onTempLangChange(v as Language)} options={[
              { value: 'en', label: 'English' }, { value: 'ru', label: 'Русский' }, { value: 'es', label: 'Español' },
            ]} />
          </Section>
          {DIVIDER}


          {/* ── Input & Voice ── */}
          <Section icon={<Mic size={20} />} label="Input & Voice" supporting="Customize how you add tasks and interact with the app.">
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.onSurface, mb: 1 }}>Primary input</Typography>
            <Segmented value={tempInputMethod} onChange={(v) => onTempInputMethodChange(v as PrimaryInputMethod)} options={[
              { value: 'voice', label: 'Voice', icon: <Mic size={16} /> },
              { value: 'text', label: 'Text', icon: <Type size={16} /> },
            ]} />
            <SwitchRow label={t.leftHanded} icon={<Hand size={20} />} checked={tempLeftHanded} onChange={onTempLeftHandedChange} />
            {voiceSettings && onVoiceSettingsChange && (
              <>
                <SwitchRow
                  label={VOICE_TRANSLATIONS[settings.language].enableVoice || 'Enable Voice'}
                  icon={<Mic size={20} />}
                  checked={voiceSettings.enabled}
                  onChange={(v) => onVoiceSettingsChange({ ...voiceSettings, enabled: v })}
                />
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.onSurface, mt: 1, mb: 1 }}>
                  {VOICE_TRANSLATIONS[settings.language].voiceLanguage || 'Language'}
                </Typography>
                <Segmented
                  value={voiceSettings.language}
                  onChange={(v) => onVoiceSettingsChange({ ...voiceSettings, language: v as 'ru' | 'en' | 'es' })}
                  options={[
                    { value: 'ru', label: VOICE_TRANSLATIONS[settings.language].russian || 'RU' },
                    { value: 'en', label: VOICE_TRANSLATIONS[settings.language].english || 'EN' },
                    { value: 'es', label: VOICE_TRANSLATIONS[settings.language].spanish || 'ES' },
                  ]}
                />
                <SwitchRow
                  label={VOICE_TRANSLATIONS[settings.language].autoSubmit || 'Auto Submit'}
                  checked={voiceSettings.autoSubmit}
                  onChange={(v) => onVoiceSettingsChange({ ...voiceSettings, autoSubmit: v })}
                />
                <SwitchRow
                  label={VOICE_TRANSLATIONS[settings.language].requireConfirmation || 'Require Confirmation'}
                  checked={voiceSettings.requireConfirmation}
                  onChange={(v) => onVoiceSettingsChange({ ...voiceSettings, requireConfirmation: v })}
                />
                <SwitchRow
                  label={VOICE_TRANSLATIONS[settings.language].enableTTS || 'Voice Feedback'}
                  checked={voiceSettings.ttsEnabled}
                  onChange={(v) => onVoiceSettingsChange({ ...voiceSettings, ttsEnabled: v })}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: `${ROW_H}px`, py: 1 }}>
                  <Typography sx={{ flex: 1, minWidth: 0, fontSize: 16, color: C.onSurface, lineHeight: '24px' }}>
                    {VOICE_TRANSLATIONS[settings.language].confidenceThreshold || 'Confidence Threshold'}
                  </Typography>
                  <Box
                    component="input"
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={voiceSettings.confidenceThreshold}
                    aria-label="Confidence threshold"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onVoiceSettingsChange({ ...voiceSettings, confidenceThreshold: parseFloat(e.target.value) })
                    }
                    sx={{ width: 140, flexShrink: 0, accentColor: C.primary }}
                  />
                  <Typography sx={{ fontSize: 14, color: C.onSurfaceVar, width: 44, textAlign: 'right', flexShrink: 0 }}>
                    {Math.round(voiceSettings.confidenceThreshold * 100)}%
                  </Typography>
                </Box>
              </>
            )}
          </Section>
          {DIVIDER}

          {/* ── Schedule ── */}
          <Section icon={<Clock size={20} />} label="Schedule" supporting="Set your wake-up and rest times to shape your circadian rhythm.">
            <TimeRow label={`${t.morning} start`} value={tempWake} onChange={onTempWakeChange} />
            <TimeRow label="Rest time" value={tempRest} onChange={onTempRestChange} />
          </Section>
          {DIVIDER}

          {/* ── Alarm & Sleep ── */}
          <Section icon={<BellRing size={20} />} label="Alarm & Sleep" supporting={t.alarm}>
            <SwitchRow label={t.alarm} checked={tempAlarm.enabled} onChange={() => {}} />
            <TimeRow label="Alarm time" value={tempAlarm.time} onChange={() => {}} />
            <ValueRow label="Sound" value={tempAlarm.sound} />
          </Section>
          {DIVIDER}

          {/* ── Circadian Rhythm ── */}
          <Section icon={<MoonStar size={20} />} label="Circadian Rhythm" supporting={t.recoveryMode}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.onSurface, mb: 1 }}>{t.recoveryMode}</Typography>
            <Segmented value={tempRecoveryOverride} onChange={(v) => onTempRecoveryOverrideChange(v as 'auto' | 'on' | 'off')} options={[
              { value: 'auto', label: 'Auto' }, { value: 'on', label: 'On' }, { value: 'off', label: 'Off' },
            ]} />
          </Section>
          {DIVIDER}

          {/* ── Security (каркас; Face/Fingerprint добавим далее) ── */}
          <Section icon={<ShieldCheck size={20} />} label="Security" supporting="Face/Fingerprint and PIN protection.">
            <ValueRow label="Unlock method" value="None" />
          </Section>
          {DIVIDER}

          {/* ── Data & Sync (каркас) ── */}
          <Section icon={<Database size={20} />} label="Data & Sync" supporting="Export your data and manage sync.">
            <ValueRow label="Export data" value="" />
          </Section>
          {DIVIDER}

          {/* ── About (каркас) ── */}
          <Section icon={<Info size={20} />} label="About" supporting="Flow — circadian-rhythm productivity.">
            <ValueRow label="Version" value="1.0.0" />
          </Section>
          {DIVIDER}

          {/* ── Account ── */}
          <Section icon={<Sun size={20} />} label="Account" supporting="Manage your profile and session.">
            <ValueRow label="Profile" value="" />
            <Box sx={{ mt: 1 }}>
              <Button fullWidth variant="text" startIcon={<LogOut size={20} />} onClick={onLogout}
                sx={{ minHeight: 52, borderRadius: '999px', textTransform: 'none', fontSize: 14, fontWeight: 500, color: C.error, '&:hover': { bgcolor: 'color-mix(in srgb, var(--md-sys-color-error) 8%, transparent)' } }}>
                Log out
              </Button>
            </Box>
          </Section>
          <Box sx={{ height: 16 }} />
        </Box>

        {/* Footer: появляется только когда есть несохранённые изменения.
            Тема применяется сразу (onToggleTheme), поэтому при neutral-состоянии
            футер скрыт; при правке wake/rest/lang/режимов isDirty=true → Save. */}
        {isDirty && (
          <Box sx={{ px: 2, pt: 1.5, pb: 2, borderTop: `1px solid ${C.outlineVar}` }}>
            {error && <Typography sx={{ fontSize: 13, color: C.error, mb: 1 }}>{error}</Typography>}
            <Button
              fullWidth variant="contained" onClick={onSave}
              sx={{
                minHeight: 52, borderRadius: '999px', textTransform: 'none', fontSize: 15, fontWeight: 500,
                bgcolor: C.primary, color: C.onPrimary,
                '&:hover': { opacity: 0.9 },
              }}
            >
              {t.save}
            </Button>
            <Button
              fullWidth variant="text" onClick={onClose}
              sx={{ mt: 1, minHeight: 48, borderRadius: '999px', textTransform: 'none', fontSize: 14, fontWeight: 500, color: C.onSurfaceVar, '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}
            >
              {t.cancel}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SettingsSideSheet;

