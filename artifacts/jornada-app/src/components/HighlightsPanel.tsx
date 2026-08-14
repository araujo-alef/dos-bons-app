import { useState, useEffect } from 'react';
import { X, Trash2, Pencil } from 'lucide-react';
import { type BookHighlight, removeHighlight, patchHighlightNote, loadAllHighlights } from '@/lib/highlights';
import { NoteEditor } from './NoteEditor';

interface HighlightsPanelProps {
  chapterId:       number;
  chapterTitle:    string;
  onNavigate:      (pageIndex: number, highlightId: string) => void;
  onClose:         () => void;
  onHighlightsChange: () => void;
}

export function HighlightsPanel({
  chapterId, chapterTitle, onNavigate, onClose, onHighlightsChange,
}: HighlightsPanelProps) {
  const [visible, setVisible]     = useState(false);
  const [highlights, setHighlights] = useState<BookHighlight[]>([]);
  const [editingNote, setEditingNote] = useState<BookHighlight | null>(null);

  useEffect(() => {
    setHighlights(loadAllHighlights());
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeHighlight(id);
    setHighlights(loadAllHighlights());
    onHighlightsChange();
  };

  const handleEditNote = (h: BookHighlight, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(h);
  };

  const handleSaveNote = (note: string) => {
    if (!editingNote) return;
    patchHighlightNote(editingNote.id, note);
    setHighlights(loadAllHighlights());
    onHighlightsChange();
    setEditingNote(null);
  };

  const handleTapItem = (h: BookHighlight) => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      onNavigate(h.pageIndex, h.id);
    }, 200);
  };

  const thisChapter = highlights.filter(h => h.chapterId === chapterId);
  const otherChapters = highlights.filter(h => h.chapterId !== chapterId);
  const groups = [
    ...(thisChapter.length > 0   ? [{ label: `Cap. ${chapterId} — ${chapterTitle}`, items: thisChapter }] : []),
    ...(otherChapters.length > 0 ? [{ label: 'Outros capítulos', items: otherChapters }] : []),
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 180,
          background: 'rgba(0,0,0,0.60)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position:   'fixed',
          bottom:     0, left: 0, right: 0,
          zIndex:     181,
          background: '#0e0b13',
          border:     '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0',
          maxHeight:  '75dvh',
          display:    'flex',
          flexDirection: 'column',
          transform:  visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
          boxShadow:  '0 -8px 48px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em' }}>
            Meus destaques
          </span>
          <button
            onClick={handleClose}
            aria-label="Fechar painel de destaques"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 4 }}
          >
            <X size={17} />
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0 calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          {highlights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.30)', fontSize: 13 }}>
              Nenhum destaque salvo ainda.
            </div>
          ) : (
            groups.map(group => (
              <div key={group.label}>
                <div style={{
                  padding:    '10px 20px 6px',
                  fontSize:   10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
                  color:      'rgba(178,102,255,0.70)',
                }}>
                  {group.label}
                </div>
                {group.items.map(h => (
                  <HighlightItem
                    key={h.id}
                    highlight={h}
                    onTap={() => handleTapItem(h)}
                    onDelete={e => handleDelete(h.id, e)}
                    onEditNote={e => handleEditNote(h, e)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note editor (over the panel) */}
      {editingNote && (
        <NoteEditor
          selectedText={editingNote.selectedText}
          initialNote={editingNote.note}
          onSave={handleSaveNote}
          onCancel={() => setEditingNote(null)}
        />
      )}
    </>
  );
}

function HighlightItem({
  highlight: h, onTap, onDelete, onEditNote,
}: {
  highlight: BookHighlight;
  onTap:      () => void;
  onDelete:   (e: React.MouseEvent) => void;
  onEditNote: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        padding:  '12px 20px',
        cursor:   'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(178,102,255,0.55)' }}>
          PÁGINA {h.pageIndex + 1}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <IconBtn label="Editar nota" onClick={onEditNote}><Pencil size={11} /></IconBtn>
          <IconBtn label="Excluir destaque" onClick={onDelete} danger><Trash2 size={11} /></IconBtn>
        </div>
      </div>

      {/* Highlighted text */}
      <p style={{
        margin: 0,
        fontSize: 13, lineHeight: 1.65,
        color: 'rgba(255,255,255,0.78)',
        fontFamily: "'Playfair Display', serif",
        fontStyle: 'italic',
        background: 'rgba(178,102,255,0.10)',
        borderLeft: '2px solid rgba(178,102,255,0.40)',
        padding: '6px 10px',
        borderRadius: '0 6px 6px 0',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        "{h.selectedText}"
      </p>

      {/* Note */}
      {h.note && (
        <p style={{
          margin: '8px 0 0',
          fontSize: 12, lineHeight: 1.55,
          color: 'rgba(255,255,255,0.45)',
          fontStyle: 'italic',
        }}>
          ✎ {h.note}
        </p>
      )}
    </div>
  );
}

function IconBtn({
  children, label, onClick, danger,
}: { children: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none', border: 'none', padding: 4, cursor: 'pointer',
        color: danger ? 'rgba(255,80,80,0.50)' : 'rgba(255,255,255,0.25)',
        borderRadius: 4,
        transition: 'color 0.15s',
        display: 'flex', alignItems: 'center',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = danger ? 'rgba(255,80,80,0.85)' : 'rgba(255,255,255,0.65)')}
      onMouseLeave={e => (e.currentTarget.style.color = danger ? 'rgba(255,80,80,0.50)' : 'rgba(255,255,255,0.25)')}
    >
      {children}
    </button>
  );
}
