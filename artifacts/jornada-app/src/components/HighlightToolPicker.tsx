import { Brush, Eraser } from 'lucide-react';

export type HighlightTool = 'brush' | 'eraser';

interface HighlightToolPickerProps {
  tool:     HighlightTool;
  onChange: (tool: HighlightTool) => void;
}

/**
 * Floating tool picker shown while highlight mode is active. Sits just above
 * the reader toolbar, using the same pill language as
 * HighlightSelectionMenu (which appears above this one, after a selection).
 *
 *   brush  — drag over text to select it, then confirm via the selection menu
 *   eraser — tap any word inside an existing highlight to delete it outright
 */
export function HighlightToolPicker({ tool, onChange }: HighlightToolPickerProps) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      style={{
        position:  'fixed',
        bottom:    'calc(88px + env(safe-area-inset-bottom, 0px))',
        left:      '50%',
        transform: 'translateX(-50%)',
        zIndex:    140,
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
        animation:  'toolbar-expand-centered 0.20s cubic-bezier(0.34,1.56,0.64,1) both',
        whiteSpace: 'nowrap',
      }}
    >
      <ToolBtn
        icon={<Brush size={13} />}
        label="Marcar"
        active={tool === 'brush'}
        onClick={() => onChange('brush')}
      />
      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
      <ToolBtn
        icon={<Eraser size={13} />}
        label="Apagar"
        active={tool === 'eraser'}
        onClick={() => onChange('eraser')}
      />
    </div>
  );
}

function ToolBtn({
  icon, label, active, onClick,
}: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           5,
        padding:       '8px 12px',
        background:    active ? 'rgba(139,53,255,0.18)' : 'transparent',
        border:        active ? '1px solid rgba(178,102,255,0.30)' : '1px solid transparent',
        borderRadius:  100,
        cursor:        'pointer',
        color:         active ? 'rgba(210,160,255,0.95)' : 'rgba(255,255,255,0.75)',
        fontSize:      12,
        fontWeight:    600,
        letterSpacing: '0.02em',
        transition:    'background 0.18s, color 0.18s, border-color 0.18s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
