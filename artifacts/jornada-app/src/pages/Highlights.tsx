import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { lessons } from '@/mocks/data';
import {
  type BookHighlight,
  removeHighlightGroup,
  patchHighlightNote,
  loadAllHighlights,
  setPendingHighlightJump,
  groupKey,
} from '@/lib/highlights';
import { NoteEditor } from '@/components/NoteEditor';

/**
 * Full-page version of what used to be HighlightsPanel's bottom sheet —
 * same visual language (dark cards, purple accents, italic serif quotes),
 * just as its own navigable route instead of an overlay. `?from=<lessonId>`
 * is where "Voltar à leitura" returns to.
 */
export default function HighlightsPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const fromLessonId = parseInt(new URLSearchParams(search).get('from') ?? '', 10) || 1;

  const [highlights, setHighlights] = useState<BookHighlight[]>([]);
  const [editingNote, setEditingNote] = useState<BookHighlight | null>(null);

  useEffect(() => {
    setHighlights(loadAllHighlights());
  }, []);

  const handleDelete = (h: BookHighlight, e: React.MouseEvent) => {
    e.stopPropagation();
    removeHighlightGroup(groupKey(h));
    setHighlights(loadAllHighlights());
  };

  const handleEditNote = (h: BookHighlight, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(h);
  };

  const handleSaveNote = (note: string) => {
    if (!editingNote) return;
    patchHighlightNote(editingNote.id, note);
    setHighlights(loadAllHighlights());
    setEditingNote(null);
  };

  const handleTapItem = (h: BookHighlight) => {
    setPendingHighlightJump({ lessonId: h.lessonId, pageId: h.pageId, blockIdx: h.blockIdx, highlightId: h.id });
    setLocation(`/jornada/licao/${h.lessonId}`);
  };

  // A multi-paragraph highlight is stored as one record per paragraph — they
  // must read as a single entry here. Collapse each group into its first
  // record (for addressing) plus the joined text of all its parts.
  //
  // Gap detection: if a middle record was erased with the drag-eraser, the
  // remaining records' partIndex values will not be consecutive (e.g. 0 and 2
  // with 1 missing). A "..." is inserted between parts with a gap so the
  // reader sees: "início da frase ... continuação da frase".
  // Legacy records without partIndex fall back to plain space-joining.
  const groupMap = new Map<string, BookHighlight[]>();
  for (const h of highlights) {
    const key = groupKey(h);
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(h);
  }
  const collapsed: { head: BookHighlight; text: string }[] = [];
  for (const parts of groupMap.values()) {
    const sorted = [...parts].sort((a, b) => {
      // Sort by partIndex when available, fall back to (blockIdx, startOffset)
      if (a.partIndex !== undefined && b.partIndex !== undefined)
        return a.partIndex - b.partIndex;
      if (a.blockIdx !== b.blockIdx) return a.blockIdx - b.blockIdx;
      return a.startOffset - b.startOffset;
    });
    let text = '';
    let prevIdx: number | undefined;
    for (const part of sorted) {
      if (text.length > 0) {
        const hasGap =
          part.partIndex !== undefined &&
          prevIdx  !== undefined &&
          part.partIndex !== prevIdx + 1;
        text += hasGap ? ' \u2026 ' : ' ';
      }
      text += part.selectedText;
      prevIdx = part.partIndex;
    }
    collapsed.push({ head: sorted[0], text });
  }

  // One group per lesson that actually has highlights, in book order.
  const groups = lessons
    .map(lesson => ({ lesson, items: collapsed.filter(c => c.head.lessonId === lesson.id) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-[100dvh] w-full" style={{ background: '#0e0b13' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '18px 20px',
          background: 'rgba(14,11,19,0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <button
          onClick={() => setLocation(`/jornada/licao/${fromLessonId}`)}
          aria-label="Voltar à leitura"
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <ArrowLeft size={19} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em' }}>
          Meus destaques
        </span>
      </div>

      {/* List */}
      <div style={{ padding: '8px 0 calc(32px + env(safe-area-inset-bottom, 0px))' }}>
        {highlights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: 'rgba(255,255,255,0.30)', fontSize: 13 }}>
            Nenhum destaque salvo ainda.
          </div>
        ) : (
          groups.map(group => (
            <div key={group.lesson.id}>
              <div style={{
                padding:    '18px 20px 6px',
                fontSize:   10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
                color:      'rgba(178,102,255,0.70)',
              }}>
                Lição {group.lesson.number} — {group.lesson.title}
              </div>
              {group.items.map(({ head, text }) => (
                <HighlightItem
                  key={head.id}
                  highlight={head}
                  text={text}
                  onTap={() => handleTapItem(head)}
                  onDelete={e => handleDelete(head, e)}
                  onEditNote={e => handleEditNote(head, e)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Note editor (over the page) */}
      {editingNote && (
        <NoteEditor
          selectedText={editingNote.selectedText}
          initialNote={editingNote.note}
          onSave={handleSaveNote}
          onCancel={() => setEditingNote(null)}
        />
      )}
    </div>
  );
}

function HighlightItem({
  highlight: h, text, onTap, onDelete, onEditNote,
}: {
  highlight: BookHighlight;
  /** Full text of the highlight — every paragraph joined, for multi-block
   *  selections whose records are stored one per paragraph. */
  text:       string;
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
        "{text}"
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
