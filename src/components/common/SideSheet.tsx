import React, { useRef } from 'react';
import { useButton } from 'react-aria';
import { ChevronLeft, X, type LucideIcon } from 'lucide-react';

export interface SideSheetItem {
  id: string;
  overline?: string;
  label: string;
  supporting?: string;
  icon: LucideIcon;
  onClick?: () => void;
}

interface SideSheetProps {
  isOpen: boolean;
  title: string;
  items: SideSheetItem[];
  onClose: () => void;
  onBack?: () => void;
  footer?: React.ReactNode;
}

/**
 * Bottom Side Sheet по спецификации Figma (material-theme-done).
 * Header 390x76: back 48x48, headline 22px/500 ls-0.5, close 48x48.
 */
const SideSheet: React.FC<SideSheetProps> = ({
  isOpen,
  title,
  items,
  onClose,
  onBack,
  footer,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: closeProps } = useButton(
    { onPress: onClose, 'aria-label': 'Close' },
    closeRef
  );
  const { buttonProps: backProps } = useButton(
    { onPress: () => onBack?.(), 'aria-label': 'Back' },
    backRef
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col justify-end"
      style={{ background: 'rgb(var(--md-sys-color-scrim-rgb) / 0.4)' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full flex flex-col overflow-hidden"
        style={{
          maxHeight: '88vh',
          background: 'var(--md-sys-color-surface-container-low)',
          borderTopLeftRadius: 'var(--md-sys-shape-corner-extra-large)',
          borderTopRightRadius: 'var(--md-sys-shape-corner-extra-large)',
          boxShadow: 'var(--md-sys-elevation-shadow-3)',
          animation: 'sheet-in 300ms var(--md-sys-motion-easing-emphasized-decel) both',
        }}
      >
        <SheetHeader title={title} backRef={backRef} backProps={backProps} closeRef={closeRef} closeProps={closeProps} onBack={onBack} />
        <div className="flex flex-col overflow-y-auto" style={{ padding: '16px' }}>
          {items.map((item, index) => (
            <div key={item.id}>
              <SideSheetRow item={item} />
              {index < items.length - 1 && (
                <div style={{ height: '1px', background: 'var(--md-sys-color-outline-variant)' }} />
              )}
            </div>
          ))}
          {footer}
        </div>
      </div>
    </div>
  );
};

interface SheetHeaderProps {
  title: string;
  backRef: React.RefObject<HTMLButtonElement | null>;
  backProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  closeProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  onBack?: () => void;
}

/** Header — Figma: 390x76, pad 12/12/16/4 */
const SheetHeader: React.FC<SheetHeaderProps> = ({
  title, backRef, backProps, closeRef, closeProps, onBack,
}) => (
  <div
    className="flex items-center justify-between shrink-0"
    style={{ padding: '12px 12px 16px 4px', minHeight: '76px' }}
  >
    <div className="flex items-center gap-2 flex-1">
      {onBack && (
        <button
          ref={backRef}
          type="button"
          {...backProps}
          className="flex items-center justify-center md-state-layer md-focus-ring"
          style={{ width: 48, height: 48, color: 'var(--md-sys-color-on-surface)' }}
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
      )}
      <h2
        className="font-medium"
        style={{
          color: 'var(--md-sys-color-on-surface-variant)',
          fontSize: 'var(--md-sys-typescale-title-large-size)',
          lineHeight: 'var(--md-sys-typescale-title-large-line-height)',
          letterSpacing: 'var(--md-sys-typescale-title-large-letter-spacing)',
        }}
      >
        {title}
      </h2>
    </div>
    <button
      ref={closeRef}
      type="button"
      {...closeProps}
      className="flex items-center justify-center shrink-0 md-state-layer md-focus-ring"
      style={{ width: 48, height: 48, color: 'var(--md-sys-color-on-surface)' }}
    >
      <X size={24} strokeWidth={2} />
    </button>
  </div>
);

/** List item — Figma: r=12, gap 12, pad 10/16/10/16, min-height 84px */
const SideSheetRow: React.FC<{ item: SideSheetItem }> = ({ item }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(
    { onPress: () => item.onClick?.(), 'aria-label': item.label },
    ref
  );
  const Icon = item.icon;

  return (
    <button
      ref={ref}
      type="button"
      {...buttonProps}
      className="w-full flex items-center text-left md-state-layer"
      style={{
        gap: '12px',
        padding: '10px 16px',
        minHeight: '84px',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
      }}
    >
      <Icon
        size={20}
        strokeWidth={1.6}
        className="shrink-0"
        style={{ color: 'var(--md-sys-color-on-surface)' }}
      />
      <div className="flex flex-col flex-1">
        {item.overline && (
          <span
            className="font-medium"
            style={{
              color: 'var(--md-sys-color-on-surface-variant)',
              fontSize: 'var(--md-sys-typescale-label-medium-size)',
              lineHeight: 'var(--md-sys-typescale-label-medium-line-height)',
            }}
          >
            {item.overline}
          </span>
        )}
        <span
          className="font-medium"
          style={{
            color: 'var(--md-sys-color-on-surface)',
            fontSize: 'var(--md-sys-typescale-body-large-size)',
            lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
          }}
        >
          {item.label}
        </span>
        {item.supporting && (
          <span
            style={{
              color: 'var(--md-sys-color-on-surface-variant)',
              fontSize: 'var(--md-sys-typescale-body-medium-size)',
              lineHeight: 'var(--md-sys-typescale-body-medium-line-height)',
            }}
          >
            {item.supporting}
          </span>
        )}
      </div>
    </button>
  );
};

export default SideSheet;