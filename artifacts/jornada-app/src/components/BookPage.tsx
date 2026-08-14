import React from 'react';
import { Play } from 'lucide-react';
import type { Chapter, ChapterPage, ContentBlock } from '@/mocks/data';

// Cream palette — matches the inner page of the opening animation
const C = {
  bg:          'linear-gradient(150deg, #f2e9d4 0%, #ece0c4 100%)',
  ink:         'rgba(40,20,8,0.85)',
  inkMid:      'rgba(40,20,8,0.60)',
  inkFaint:    'rgba(40,20,8,0.38)',
  inkGhost:    'rgba(40,20,8,0.22)',
  inkHair:     'rgba(40,20,8,0.12)',
  purple:      'rgba(139,53,255,0.85)',
  purpleFaint: 'rgba(139,53,255,0.20)',
  purpleHair:  'rgba(139,53,255,0.10)',
  shadow:      'rgba(30,12,0,0.12)',
};

interface BookPageProps {
  chapter: Chapter;
  page: ChapterPage;
  pageIndex: number;
  totalPages: number;
  isPortrait?: boolean;
  onComplete?: () => void;
}

export const BookPage = React.forwardRef<HTMLDivElement, BookPageProps>(
  ({ chapter, page, pageIndex, totalPages, isPortrait = true, onComplete }, ref) => {
    const numSide: 'left' | 'right' =
      isPortrait ? 'right' : pageIndex % 2 === 0 ? 'left' : 'right';

    const typo = isPortrait
      ? { body: 19, lineHeight: 1.85, px: 28, py: 28 }
      : { body: 17, lineHeight: 1.75, px: 22, py: 22 };

    return (
      <div
        ref={ref}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          position: 'relative',
          userSelect: 'text',
        }}
      >
        {/* Cream background — same gradient as animation's inner page */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: C.bg,
            zIndex: 0,
          }}
        />

        {/* Subtle warm vignette at edges */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 60%, rgba(30,12,0,0.08) 100%)',
            zIndex: 0,
          }}
        />

        {/* Top accent line — purple, same as animation spine light */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '1px',
            background:
              'linear-gradient(to right, transparent, rgba(139,53,255,0.25) 30%, rgba(139,53,255,0.25) 70%, transparent)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            position: 'absolute',
            top: '1px',
            left: 0,
            right: 0,
            bottom: '24px',
            overflow: 'hidden',
            zIndex: 2,
            padding: `${typo.py}px ${typo.px}px 0`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {page.type === 'cover' ? (
            <CoverContent chapter={chapter} isPortrait={isPortrait} />
          ) : page.type === 'closing' ? (
            <ClosingContent onComplete={onComplete} isPortrait={isPortrait} />
          ) : (
            <PageBlocks blocks={page.blocks} typo={typo} isPortrait={isPortrait} />
          )}
        </div>

        {/* Page number — always bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '16px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: C.inkFaint,
            letterSpacing: '0.06em',
            zIndex: 3,
            userSelect: 'none',
          }}
        >
          {pageIndex + 1}
        </div>
      </div>
    );
  }
);
BookPage.displayName = 'BookPage';

// ─── Typography token shorthand ───────────────────────────────────────────────

interface TypoTokens {
  body: number;
  lineHeight: number;
  px: number;
  py: number;
}

// ─── Cover ────────────────────────────────────────────────────────────────────

function CoverContent({ chapter, isPortrait }: { chapter: Chapter; isPortrait: boolean }) {
  const titleSize = isPortrait ? 'clamp(1.6rem, 6vw, 2.4rem)' : 'clamp(1.3rem, 4vw, 1.9rem)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <span
        style={{
          display: 'block',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: C.purple,
          marginBottom: '28px',
        }}
      >
        CAPÍTULO {chapter.number}
      </span>

      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: titleSize,
          color: '#251508',
          lineHeight: 1.2,
          margin: '0 0 20px 0',
        }}
      >
        {chapter.title}
      </h1>

      <div
        style={{
          width: '28px',
          height: '1px',
          background: C.purpleFaint,
          margin: '0 0 22px 0',
        }}
      />

      {chapter.intro && (
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: isPortrait ? '18px' : '16px',
            color: C.inkMid,
            lineHeight: 1.75,
            margin: 0,
          }}
        >
          "{chapter.intro}"
        </p>
      )}
    </div>
  );
}

// ─── Closing ──────────────────────────────────────────────────────────────────

function ClosingContent({ onComplete, isPortrait }: { onComplete?: () => void; isPortrait: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '1px',
          background: C.inkHair,
          marginBottom: '24px',
        }}
      />

      <span
        style={{
          display: 'block',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: C.inkFaint,
          marginBottom: '26px',
        }}
      >
        FIM DO CAPÍTULO
      </span>

      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: isPortrait ? '18px' : '16px',
          color: C.inkMid,
          lineHeight: 1.78,
          marginBottom: '32px',
          maxWidth: '82%',
        }}
      >
        "A transformação não acontece em um instante. Ela acontece em cada conversa que você decide ter de verdade."
      </p>

      <button
        data-testid="button-complete-chapter"
        onClick={onComplete}
        style={{
          background: 'transparent',
          border: `1px solid ${C.inkHair}`,
          borderRadius: '100px',
          padding: '10px 24px',
          color: C.inkMid,
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'border-color 0.25s, color 0.25s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = C.purpleFaint;
          e.currentTarget.style.color = '#251508';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = C.inkHair;
          e.currentTarget.style.color = C.inkMid;
        }}
      >
        Concluir capítulo
      </button>
    </div>
  );
}

// ─── Content blocks ───────────────────────────────────────────────────────────

function PageBlocks({ blocks, typo, isPortrait }: { blocks: ContentBlock[]; typo: TypoTokens; isPortrait: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {blocks.map((block, idx) => (
        <PageBlock key={idx} block={block} typo={typo} isPortrait={isPortrait} />
      ))}
    </div>
  );
}

function PageBlock({ block, typo, isPortrait }: { block: ContentBlock; typo: TypoTokens; isPortrait: boolean }) {
  switch (block.type) {
    // ── Text ─────────────────────────────────────────────────────────────────
    case 'text':
      return (
        <p
          style={{
            fontSize: `${typo.body}px`,
            lineHeight: typo.lineHeight,
            color: C.ink,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 300,
            letterSpacing: '0.012em',
            margin: '0 0 14px 0',
          }}
        >
          {block.content}
        </p>
      );

    // ── Image ─────────────────────────────────────────────────────────────────
    case 'image':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: '8px',
              overflow: 'hidden',
              border: `1px solid ${C.inkHair}`,
              position: 'relative',
            }}
          >
            <img
              src={block.src}
              alt={block.alt || 'Imagem editorial'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(30,12,0,0.18) 0%, transparent 55%)',
              }}
            />
          </div>
        </div>
      );

    // ── Reflection ────────────────────────────────────────────────────────────
    case 'reflection':
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isPortrait ? '24px 20px' : '18px 16px',
            background: C.inkHair,
            borderRadius: '10px',
            border: `1px solid ${C.inkGhost}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(to right, transparent, ${C.purpleFaint}, transparent)`,
            }}
          />
          <span
            style={{
              display: 'block',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              color: C.purple,
              textAlign: 'center',
              marginBottom: '18px',
            }}
          >
            REFLEXÃO
          </span>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: isPortrait ? '20px' : '18px',
              color: '#251508',
              lineHeight: 1.6,
              textAlign: 'center',
              margin: '0 0 16px 0',
            }}
          >
            "{block.question}"
          </p>
          <p
            style={{
              fontSize: '13px',
              color: C.inkFaint,
              textAlign: 'center',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            Suas reflexões ficam apenas com você…
          </p>
        </div>
      );

    // ── Practice ──────────────────────────────────────────────────────────────
    case 'practice':
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isPortrait ? '24px 20px' : '18px 16px',
            border: `1px solid ${C.purpleFaint}`,
            borderRadius: '10px',
            background: C.purpleHair,
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              color: C.purple,
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            PRÁTICA
          </span>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isPortrait ? '20px' : '18px',
              color: '#251508',
              lineHeight: 1.65,
              textAlign: 'center',
              margin: 0,
            }}
          >
            {block.instruction}
          </p>
        </div>
      );

    // ── Audio ─────────────────────────────────────────────────────────────────
    case 'audio':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: isPortrait ? '18px 20px' : '14px 16px',
              background: C.inkHair,
              borderRadius: '12px',
              border: `1px solid ${C.inkGhost}`,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: C.purpleHair,
                border: `1px solid ${C.purpleFaint}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Play style={{ width: '15px', height: '15px', color: '#8B35FF', marginLeft: '2px' }} />
            </div>
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: C.inkFaint,
                  marginBottom: '5px',
                }}
              >
                ÁUDIO · {block.duration}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: isPortrait ? '17px' : '15px',
                  color: '#251508',
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {block.title}
              </span>
            </div>
          </div>
        </div>
      );

    // ── Video ─────────────────────────────────────────────────────────────────
    case 'video':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '10px',
              background: C.inkHair,
              border: `1px solid ${C.inkGhost}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse at 50% 40%, ${C.purpleHair} 0%, transparent 70%)`,
              }}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: C.inkHair,
                border: `1px solid ${C.inkGhost}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                position: 'relative',
              }}
            >
              <Play
                style={{ width: '15px', height: '15px', color: C.inkMid, marginLeft: '2px' }}
                fill="currentColor"
              />
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: C.inkFaint,
                marginBottom: '5px',
                position: 'relative',
              }}
            >
              VÍDEO · {block.duration}
            </span>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isPortrait ? '14px' : '13px',
                color: C.inkMid,
                position: 'relative',
              }}
            >
              {block.title}
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
