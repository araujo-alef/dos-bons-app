import { Check, FileText, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface HighlightSelectionMenuProps {
  /** Position (viewport coordinates) for the menu */
  anchorY: number;
  onSave:   () => void;
  onNote:   () => void;
  onCancel: () => void;
}

/**
 * Small action menu that appears after a text selection in highlight mode.
 * Positioned near the selection on desktop, fixed at bottom on mobile.
 */
export function HighlightSelectionMenu({
  anchorY, onSave, onNote, onCancel,
}: HighlightSelectionMenuProps) {
  // On small screens anchor to the bottom to avoid clipping
  const isMobile = window.innerWidth < 600;
  const top    = isMobile ? undefined : Math.max(60, anchorY - 60);
  const bottom = isMobile ? 'calc(90px + env(safe-area-inset-bottom, 0px))' : undefined;

  // The dismiss overlay must ignore the click/pointerup that *opened* the menu.
  // On mobile the same tap's `click` event (which fires after `pointerup`) would
  // immediately call onCancel before the user sees anything. We block pointer
  // events for 200 ms after mount so that residual event passes through harmlessly.
  const dismissReady = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { dismissReady.current = true; }, 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Invisible dismiss layer */}
      <div
        onClick={() => { if (dismissReady.current) onCancel(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 150 }}
      />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:  'fixed',
          top,
          bottom,
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:    151,
          display:   'flex',
          gap:       6,
          padding:   '6px 8px',
          background: 'rgba(14,10,20,0.94)',
          border:     '1px solid rgba(255,255,255,0.14)',
          borderRadius: 100,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow:  '0 4px 28px rgba(0,0,0,0.55)',
          animation:  'toolbar-expand 0.20s cubic-bezier(0.34,1.56,0.64,1) both',
          whiteSpace: 'nowrap',
        }}
      >
        <MenuBtn icon={<Check size={12} />} label="Salvar destaque" onClick={onSave} accent />
        <MenuSep />
        <MenuBtn icon={<FileText size={12} />} label="Adicionar nota" onClick={onNote} />
        <MenuSep />
        <MenuBtn icon={<X size={12} />} label="Cancelar" onClick={onCancel} />
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
        padding:       '7px 10px',
        background:    accent ? 'rgba(139,53,255,0.18)' : 'transparent',
        border:        accent ? '1px solid rgba(178,102,255,0.30)' : '1px solid transparent',
        borderRadius:  100,
        cursor:        'pointer',
        color:         accent ? 'rgba(210,160,255,0.95)' : 'rgba(255,255,255,0.75)',
        fontSize:      11,
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
  return <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', alignSelf: 'center' }} />;
}
