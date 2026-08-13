import React from 'react';
import { Play } from 'lucide-react';
import type { Chapter, ChapterPage, ContentBlock } from '@/mocks/data';

interface BookPageProps {
  chapter: Chapter;
  page: ChapterPage;
  pageIndex: number;
  onComplete?: () => void;
}

export const BookPage = React.forwardRef<HTMLDivElement, BookPageProps>(
  ({ chapter, page, pageIndex, onComplete }, ref) => {
    const isLeft = pageIndex % 2 === 0;

    return (
      <div
        ref={ref}
        style={{
          background: '#0A090C',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          position: 'relative',
          userSelect: 'text',
        }}
      >
        {/* Top accent */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(178,102,255,0.2) 30%, rgba(178,102,255,0.2) 70%, transparent)',
        }} />

        {/* Content area */}
        <div style={{
          position: 'absolute',
          top: '1px',
          left: 0,
          right: 0,
          bottom: '22px',
          overflow: 'hidden',
          padding: '22px 24px 0',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {page.type === 'cover'
            ? <CoverContent chapter={chapter} />
            : page.type === 'closing'
            ? <ClosingContent onComplete={onComplete} />
            : <PageBlocks blocks={page.blocks} />}
        </div>

        {/* Page number */}
        <div style={{
          position: 'absolute',
          bottom: '6px',
          [isLeft ? 'left' : 'right']: '14px',
          fontSize: '9px',
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.05em',
        }}>
          {pageIndex + 1}
        </div>
      </div>
    );
  }
);
BookPage.displayName = 'BookPage';

// ─── Cover ────────────────────────────────────────────────────────────────────

function CoverContent({ chapter }: { chapter: Chapter }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <span style={{
        display: 'block',
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.24em',
        color: 'rgba(178,102,255,0.75)',
        marginBottom: '24px',
      }}>
        CAPÍTULO {chapter.number}
      </span>

      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 'clamp(1.4rem, 4vw, 2rem)',
        color: '#F5F5F5',
        lineHeight: 1.2,
        marginBottom: '20px',
        margin: '0 0 20px 0',
      }}>
        {chapter.title}
      </h1>

      <div style={{ width: '28px', height: '1px', background: 'rgba(178,102,255,0.45)', margin: '0 0 20px 0' }} />

      {chapter.intro && (
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: '13px',
          color: 'rgba(245,245,245,0.5)',
          lineHeight: 1.75,
          margin: 0,
        }}>
          "{chapter.intro}"
        </p>
      )}
    </div>
  );
}

// ─── Closing ──────────────────────────────────────────────────────────────────

function ClosingContent({ onComplete }: { onComplete?: () => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.10)', marginBottom: '24px' }} />

      <span style={{
        display: 'block',
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.28)',
        marginBottom: '28px',
      }}>
        FIM DO CAPÍTULO
      </span>

      <p style={{
        fontFamily: "'Playfair Display', serif",
        fontStyle: 'italic',
        fontSize: '13px',
        color: 'rgba(245,245,245,0.52)',
        lineHeight: 1.75,
        marginBottom: '32px',
        maxWidth: '82%',
      }}>
        "A transformação não acontece em um instante. Ela acontece em cada conversa que você decide ter de verdade."
      </p>

      <button
        onClick={onComplete}
        data-testid="button-complete-chapter"
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: '100px',
          padding: '9px 22px',
          color: 'rgba(245,245,245,0.75)',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.04em',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(178,102,255,0.45)';
          (e.currentTarget as HTMLButtonElement).style.color = '#F5F5F5';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.13)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,245,245,0.75)';
        }}
      >
        Concluir capítulo
      </button>
    </div>
  );
}

// ─── Content blocks ───────────────────────────────────────────────────────────

function PageBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {blocks.map((block, idx) => <PageBlock key={idx} block={block} />)}
    </div>
  );
}

function PageBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <p style={{
          fontSize: '14px',
          lineHeight: 1.85,
          color: 'rgba(245,245,245,0.80)',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 300,
          letterSpacing: '0.01em',
          margin: '0 0 14px 0',
        }}>
          {block.content}
        </p>
      );

    case 'image':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <img
              src={block.src}
              alt={block.alt || 'Imagem editorial'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.35) 0%, transparent 60%)' }} />
          </div>
        </div>
      );

    case 'reflection':
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '20px 16px',
          background: 'rgba(12,12,14,0.6)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(178,102,255,0.3), transparent)' }} />
          <span style={{
            display: 'block',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'rgba(178,102,255,0.75)',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            REFLEXÃO
          </span>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'rgba(245,245,245,0.88)',
            lineHeight: 1.65,
            textAlign: 'center',
            margin: '0 0 14px 0',
          }}>
            "{block.question}"
          </p>
          <p style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.18)',
            textAlign: 'center',
            fontStyle: 'italic',
            margin: 0,
          }}>
            Suas anotações ficam apenas com você...
          </p>
        </div>
      );

    case 'practice':
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '20px 16px',
          border: '1px solid rgba(178,102,255,0.18)',
          borderRadius: '10px',
          background: 'rgba(178,102,255,0.04)',
        }}>
          <span style={{
            display: 'block',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'rgba(178,102,255,0.8)',
            textAlign: 'center',
            marginBottom: '14px',
          }}>
            PRÁTICA
          </span>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '14px',
            color: 'rgba(245,245,245,0.88)',
            lineHeight: 1.7,
            textAlign: 'center',
            margin: 0,
          }}>
            {block.instruction}
          </p>
        </div>
      );

    case 'audio':
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 16px',
            background: 'rgba(17,16,20,0.8)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(178,102,255,0.12)',
              border: '1px solid rgba(178,102,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Play style={{ width: '14px', height: '14px', color: '#B266FF', marginLeft: '2px' }} />
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
                ÁUDIO · {block.duration}
              </span>
              <span style={{ display: 'block', fontSize: '13px', color: 'rgba(245,245,245,0.88)', fontWeight: 500 }}>
                {block.title}
              </span>
            </div>
          </div>
        </div>
      );

    case 'video':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
          <div style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: '10px',
            background: 'rgba(12,12,14,0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(178,102,255,0.06) 0%, transparent 70%)' }} />
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              position: 'relative',
            }}>
              <Play style={{ width: '14px', height: '14px', color: 'rgba(245,245,245,0.7)', marginLeft: '2px' }} fill="currentColor" />
            </div>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', position: 'relative' }}>
              VÍDEO · {block.duration}
            </span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: 'rgba(245,245,245,0.7)', position: 'relative' }}>
              {block.title}
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
