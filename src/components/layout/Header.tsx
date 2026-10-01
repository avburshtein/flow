import React from 'react';
import IconButton from '@mui/material/IconButton';
import { LayoutGrid, GalleryVertical, Moon, Sun } from 'lucide-react';
import { TRANSLATIONS } from '../../constants.tsx';

interface HeaderProps {
  currentTime: Date;
  user: { name: string } | null;
  language: keyof typeof TRANSLATIONS;
  isDarkTheme: boolean;
  isListView: boolean;
  onToggleTheme: () => void;
  onToggleView: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentTime,
  user,
  language,
  isDarkTheme,
  isListView,
  onToggleTheme,
  onToggleView,
}) => {
  const t = TRANSLATIONS[language];

  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return t.goodMorning;
    if (hours < 17) return t.goodAfternoon;
    if (hours < 21) return t.goodEvening;
    return t.goodNight;
  };

  return (
    <header className="flex items-start self-stretch px-4 pb-4 gap-[10px]">
      {/* Текстовая часть */}
      <div className="flex flex-col flex-1">
        <h1
          className="m-0 font-inter font-semibold tracking-[-0.4px] text-primary"
          style={{
            // Figma: Headline 33px / fw 600 / lh 40 / ls -0.4
            fontSize: '33px',
            lineHeight: '40px',
            letterSpacing: '-0.4px',
            color: 'var(--md-sys-color-primary)',
          }}
        >
          {getGreeting()}, {user?.name.split(' ')[0]}
        </h1>
      </div>

      {/* Кнопки переключения */}
      <div className="flex gap-2">
        {/* Toggle View (Сетка / Список) */}
        <IconButton
          onClick={onToggleView}
          aria-label={isListView ? 'Switch to list view' : 'Switch to grid view'}
          aria-pressed={isListView}
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            color: 'var(--md-sys-color-on-surface-variant)',
            position: 'relative',
            // Selected state — фон через ::before
            ...(isListView && {
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backgroundColor: 'var(--md-sys-color-primary)',
                borderRadius: '12px',
                opacity: 0.08,
                zIndex: 0,
              },
            }),
            // Hover state
            '&:hover': {
              backgroundColor: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.08,
            },
            // Active/pressed state
            '&:active': {
              backgroundColor: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.12,
            },
            // Иконка поверх фона
            '& .MuiIconButton-root': {
              zIndex: 1,
            },
          }}
        >
          {isListView ? <GalleryVertical size={24} /> : <LayoutGrid size={24} />}
        </IconButton>

        {/* Toggle Theme (Темная / Светлая) */}
        <IconButton
          onClick={onToggleTheme}
          aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={isDarkTheme}
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            color: 'var(--md-sys-color-on-surface-variant)',
            position: 'relative',
            // Selected state — фон через ::before
            ...(isDarkTheme && {
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backgroundColor: 'var(--md-sys-color-primary)',
                borderRadius: '12px',
                opacity: 0.08,
                zIndex: 0,
              },
            }),
            // Hover state
            '&:hover': {
              backgroundColor: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.08,
            },
            // Active/pressed state
            '&:active': {
              backgroundColor: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.12,
            },
          }}
        >
          {isDarkTheme ? <Sun size={24} /> : <Moon size={24} />}
        </IconButton>
      </div>
    </header>
  );
};

export default Header;