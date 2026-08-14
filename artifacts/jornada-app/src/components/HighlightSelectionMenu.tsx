import { Check, FileText, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface HighlightSelectionMenuProps {
  anchorY: number; // kept in props for API compat — not used for positioning
  onSave:   () => void;
  onNote:   () => void;
  onCancel: () => void;
}

/**
 * Action menu shown after a text selection in highlight mode.
 * Always anchored just above the bottom bar so it never clips on mobile.
 * The toolbar collapsed button sits at calc(26px + safe-area) from bottom
 * and is ~40 px tall, so we place the menu 16 px above that.
 */
export function HighlightSelectionMenu({
  onSave, onNote, onCancel,
}: HighlightSelectionMenuProps) {
  // Ignore the first click after mount — the same tap that triggered the
  // selection fires a trailing `click` which would instantly dismiss the menu.
  const dismissReady = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { dismissReady.current = true; }, 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Full-screen dismiss backdrop */}
      <div
        onClick={() => { if (dismissReady.current) onCancel(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 150 }}
      />

      {/* Menu pill — always above the bottom toolbar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:  'fixed',
          bottom:    'calc(82px + env(safe-area-inset-bottom, 0px))',
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:    151,
          display:   'flex',
          alignItems: 'center',
          gap:       4,
          padding:   '5px 6px',
          background: 'rgba(14,10,20,0.95)',
          border:     '1px solid rgba(255,255,255,0.14)',
          borderRadius: 100,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow:  '0 4px 28px rgba(0,0,0,0.55)',
          animation:  'toolbar-expand 0.20s cubic-bezier(0.34,1.56,0.64,1) both',
          whiteSpace: 'nowrap',
        }}
      >
        <MenuBtn icon={<Check size={13} />} label="Destacar" onClick={onSave} accent />
        <MenuSep />
        <MenuBtn icon={<FileText size={13} />} label="Anotar" onClick={onNote} />
        <MenuSep />
        <MenuBtn icon={<X size={13} />} label="Cancelar" onClick={onCancel} />
      </div>
    </>
  );
}

function MenuBtn({
  icon, label, onClick, accent,
}: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           5,
        padding:       '8px 12px',
        background:    accent ? 'rgba(139,53,255,0.18)' : 'transparent',
        border:        accent ? '1px solid rgba(178,102,255,0.30)' : '1px solid transparent',
        borderRadius:  100,
        cursor:        'pointer',
        color:         accent ? 'rgba(210,160,255,0.95)' : 'rgba(255,255,255,0.75)',
        fontSize:      12,
        fontWeight:    600,
        letterSpacing: '0.02em',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function MenuSep() {
  return <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />;
}
