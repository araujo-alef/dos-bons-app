import { ArrowLeft, Highlighter, BookMarked } from 'lucide-react';

export type ReaderMode = 'reading' | 'highlighting';

interface ReaderToolbarProps {
  mode:               ReaderMode;
  onExit:             (e: React.MouseEvent) => void;
  onHighlight:        (e: React.MouseEvent) => void;
  onViewHighlights:   (e: React.MouseEvent) => void;
}

/** Wraps a handler so the click doesn't bubble to the reader */
const sp = (fn: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn(e);
};

/**
 * Always-expanded reader toolbar. The collapsed pill (and its expand/
 * collapse toggle) is gone for now — the bar is permanently visible, and
 * every page reserves TOOLBAR_CLEARANCE_PX at the bottom for it, so text
 * is never covered regardless of state.
 */
export function ReaderToolbar({
  mode, onExit, onHighlight, onViewHighlights,
}: ReaderToolbarProps) {
  const isHighlighting = mode === 'highlighting';

  return (
    <div
      style={{
        position:   'absolute',
        bottom:     'calc(18px + env(safe-area-inset-bottom, 0px))',
        left:       '50%',
        transform:  'translateX(-50%)',
        zIndex:     20,
        pointerEvents: 'auto',
      }}
      onClick={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
    >
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '2px',
          padding:        '6px 8px',
          background:     'rgba(8,6,11,0.90)',
          border:         '1px solid rgba(255,255,255,0.12)',
          borderRadius:   '100px',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow:      '0 4px 28px rgba(0,0,0,0.45)',
        }}
      >
        <Btn
          icon={<ArrowLeft size={13} />}
          label="Sair"
          onClick={sp(onExit)}
        />
        <Sep />
        <Btn
          icon={<Highlighter size={13} />}
          label={isHighlighting ? 'Modo destaque' : 'Destacar'}
          onClick={sp(onHighlight)}
          active={isHighlighting}
          aria-pressed={isHighlighting}
        />
        <Sep />
        <Btn
          icon={<BookMarked size={13} />}
          label="Destaques"
          onClick={sp(onViewHighlights)}
        />
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

interface BtnProps {
  icon:    React.ReactNode;
  label:   string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  'aria-pressed'?: boolean;
}

function Btn({ icon, label, onClick, active, 'aria-pressed': ariaPresseed }: BtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={ariaPresseed}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '4px',
        padding:        '8px 10px',
        background:     active ? 'rgba(178,102,255,0.14)' : 'transparent',
        border:         active ? '1px solid rgba(178,102,255,0.30)' : '1px solid transparent',
        borderRadius:   '80px',
        cursor:         'pointer',
        color:          active ? 'rgba(210,160,255,0.95)' : 'rgba(255,255,255,0.75)',
        transition:     'background 0.18s, color 0.18s, border-color 0.18s',
        minWidth:       '52px',
      }}
    >
      {icon}
      <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1 }}>
        {label}
      </span>
    </button>
  );
}

function Sep() {
  return (
    <div style={{
      width:      '1px',
      height:     '24px',
      background: 'rgba(255,255,255,0.08)',
      flexShrink: 0,
      margin:     '0 2px',
    }} />
  );
}
