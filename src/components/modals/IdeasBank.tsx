import React, { useMemo } from 'react';
import { Lightbulb, Plus } from 'lucide-react';
import SideSheet, { type SideSheetItem } from '../common/SideSheet.tsx';
import { TRANSLATIONS, WEIGHT_CONFIG } from '../../constants.tsx';
import { suggestWeight } from '../../services/taskOptimizer.ts';
import { type Language } from '../../types.ts';

interface IdeasBankProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: string[];
  onAddIdea: (title: string) => void;
  onConvertIdea: (title: string) => void;
  onDeleteIdea: (index: number) => void;
  language: Language;
}

/** Локализованное название когнитивного веса */
export function getWeightLabel(weight: ReturnType<typeof suggestWeight>, t: typeof TRANSLATIONS[Language]): string {
  if (weight === 'quick') return t.weightQuick;
  if (weight === 'deep') return t.weightDeep;
  return t.weightFocused;
}

const IdeasBank: React.FC<IdeasBankProps> = ({
  isOpen,
  onClose,
  ideas,
  onAddIdea,
  onConvertIdea,
  onDeleteIdea,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const items = useMemo<SideSheetItem[]>(
    () =>
      ideas.map((idea, index) => {
        const weight = suggestWeight(idea);
        return {
          id: `idea-${index}`,
          label: idea,
          supporting: `${getWeightLabel(weight, t)} · ${WEIGHT_CONFIG[weight].points} ${t.pts}`,
          icon: Lightbulb,
          onClick: () => onConvertIdea(idea),
        };
      }),
    [ideas, onConvertIdea, t]
  );

  return (
    <SideSheet
      isOpen={isOpen}
      title={t.ideas}
      items={items}
      onClose={onClose}
      footer={
        <div className="pt-4 pb-2">
          <QuickAddIdea language={language} onAdd={onAddIdea} />
        </div>
      }
    />
  );
};

/** Inline-поле быстрого добавления идеи */
const QuickAddIdea: React.FC<{ language: Language; onAdd: (title: string) => void }> = ({
  language,
  onAdd,
}) => {
  const t = TRANSLATIONS[language];
  const [value, setValue] = React.useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder={t.ideaPlaceholder}
        className="flex-1 min-h-[52px] px-4 rounded-xl outline-none"
        style={{
          background: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface)',
          fontSize: 'var(--md-sys-typescale-body-large-size)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        }}
      />
      <button
        type="button"
        onClick={submit}
        aria-label={t.add}
        className="flex items-center justify-center shrink-0 md-state-layer"
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          background: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
        }}
      >
        <Plus size={24} strokeWidth={2} />
      </button>
    </div>
  );
};

export default IdeasBank;