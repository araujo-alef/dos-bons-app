import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface NoteEditorProps {
  selectedText: string;
  initialNote?: string;
  onSave:       (note: string) => void;
  onCancel:     () => void;
}

/**
 * Bottom-sheet note editor.
 * Shown after the user chooses "Adicionar nota" from the selection menu,
 * or when editing an existing highlight's note from the highlights panel.
 */
export function NoteEditor({ selectedText, initialNote = '', onSave, onCancel }: NoteEditorProps) {
  const [note, setNote] = useState(initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
    // Focus textarea after animation starts
    const t = setTimeout(() => textareaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const handleSave = () => onSave(note.trim());
  const handleCancel = () => onCancel();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.22s',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position:   'fixed',
          bottom:     0,
          left:       0,
          right:      0,
          zIndex:     201,
          background: '#100e14',
          border:     '1px solid rgba(255,255,255,0.10)',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0',
          padding:    '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
          transform:  visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
          boxShadow:  '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.80)', letterSpacing: '0.02em' }}>
            Adicionar nota
          </span>
          <button
            onClick={handleCancel}
            aria-label="Cancelar"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.40)', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected text preview */}
        <div style={{
          padding:    '10px 12px',
          background: 'rgba(178,102,255,0.10)',
          border:     '1px solid rgba(178,102,255,0.20)',
          borderRadius: 8,
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 13, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.65)',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            "{selectedText}"
          </span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Escreva uma anotação..."
          rows={3}
          style={{
            width:       '100%',
            background:  'rgba(255,255,255,0.05)',
            border:      '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding:     '10px 12px',
            color:       'rgba(255,255,255,0.85)',
            fontSize:    14,
            lineHeight:  1.6,
            resize:      'none',
            outline:     'none',
            boxSizing:   'border-box',
            fontFamily:  'Inter, sans-serif',
            marginBottom: 12,
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCancel}
            style={{
              flex: 1, padding: '11px 0',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 100, cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: '11px 0',
              background: 'rgba(139,53,255,0.80)',
              border: '1px solid rgba(178,102,255,0.40)',
              borderRadius: 100, cursor: 'pointer',
              color: '#fff', fontSize: 13, fontWeight: 600,
            }}
          >
            Salvar nota
          </button>
        </div>
      </div>
    </>
  );
}
