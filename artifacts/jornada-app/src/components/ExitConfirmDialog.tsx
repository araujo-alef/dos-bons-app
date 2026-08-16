import { useState, useEffect } from 'react';

interface ExitConfirmDialogProps {
  onConfirm: () => void;
  onCancel:  () => void;
}

/**
 * Confirms leaving the book when the reader taps the "previous page" zone
 * while already on the first page — that tap would otherwise exit straight
 * away, which reads as an accidental back-swipe rather than a deliberate
 * exit. Visual pattern matches NoteEditor/HighlightsPanel: dark bottom
 * sheet, same backdrop, same two-button footer.
 */
export function ExitConfirmDialog({ onConfirm, onCancel }: ExitConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const dismiss = (action: () => void) => {
    setVisible(false);
    setTimeout(action, 220);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={e => { e.stopPropagation(); dismiss(onCancel); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 210,
          background: 'rgba(0,0,0,0.55)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.22s',
        }}
      />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:   'fixed',
          bottom:     0,
          left:       0,
          right:      0,
          zIndex:     211,
          background: '#100e14',
          border:     '1px solid rgba(255,255,255,0.10)',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0',
          padding:    '22px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
          transform:  visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
          boxShadow:  '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.01em' }}>
          Sair da leitura?
        </span>
        <p style={{ margin: '8px 0 20px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.50)' }}>
          Você vai sair do livro. Seu progresso fica salvo e você continua de onde parou na próxima vez.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => dismiss(onCancel)}
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
            onClick={() => dismiss(onConfirm)}
            style={{
              flex: 2, padding: '11px 0',
              background: 'rgba(139,53,255,0.80)',
              border: '1px solid rgba(178,102,255,0.40)',
              borderRadius: 100, cursor: 'pointer',
              color: '#fff', fontSize: 13, fontWeight: 600,
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </>
  );
}
