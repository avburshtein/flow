import React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Check } from 'lucide-react';
import { TRANSLATIONS } from '../../constants.tsx';

type ViewMode = 'day' | 'week' | 'month' | 'year';

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  language: keyof typeof TRANSLATIONS;
}

const VIEW_MODES: ViewMode[] = ['day', 'week', 'month', 'year'];


const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onModeChange, language }) => {
  const t = TRANSLATIONS[language];

  const handleChange = (_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      onModeChange(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleChange}
      aria-label="View mode"
      sx={{
        display: 'flex',
        width: '100%',
        backgroundColor: 'transparent',
        // Figma: Segmented button 358x52, обводка outline на всём контроле
        border: '1px solid var(--md-sys-color-outline)',
        borderRadius: 'var(--md-sys-shape-corner-full)',
        overflow: 'hidden',
        '& .MuiToggleButtonGroup-grouped': {
          border: 'none',
          borderRadius: '0 !important',
          margin: 0,
          flex: 1,
          // Figma: container 90x44 внутри сегмента 90x52
          minHeight: '52px',
          padding: '4px 12px',
          gap: '8px',
          color: 'var(--md-sys-color-on-surface)',
          textTransform: 'none',
          fontSize: 'var(--md-sys-typescale-label-large-size)',
          fontWeight: 500,
          letterSpacing: '0.1px',
          backgroundColor: 'transparent',
          '&:not(:last-of-type)': {
            borderRight: '1px solid var(--md-sys-color-outline)',
          },
          '&:first-of-type': {
            borderTopLeftRadius: 'var(--md-sys-shape-corner-full)',
            borderBottomLeftRadius: 'var(--md-sys-shape-corner-full)',
          },
          '&:last-of-type': {
            borderTopRightRadius: 'var(--md-sys-shape-corner-full)',
            borderBottomRightRadius: 'var(--md-sys-shape-corner-full)',
          },
          // Figma: selected segment fill #E9DDFF, label #4D3D75
          '&.Mui-selected': {
            backgroundColor: 'var(--md-sys-color-secondary-container)',
            color: 'var(--md-sys-color-on-secondary-container)',
            '&:hover': {
              backgroundColor: 'var(--md-sys-color-secondary-container)',
            },
          },
          '&:hover': {
            backgroundColor: 'var(--md-sys-color-surface-container)',
          },
        },
      }}
    >
      {VIEW_MODES.map((mode) => (
        <ToggleButton
          key={mode}
          value={mode}
          aria-label={t[mode]}
        >
          {mode === viewMode && <Check size={18} strokeWidth={2} />}
          <span>{t[mode]}</span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default ViewSwitcher;