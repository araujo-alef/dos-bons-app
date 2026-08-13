import React from 'react';
import { Play } from 'lucide-react';
import pageTexture from '@/assets/page-texture.png';
import type { Chapter, ChapterPage, ContentBlock } from '@/mocks/data';

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
    // In portrait (single page), the page number sits bottom-right.
    // In landscape (spread), even index = left page (number bottom-left),
    // odd index = right page (number bottom-right).
    const numSide: 'left' | 'right' =
      isPortrait ? 'right' : pageIndex % 2 === 0 ? 'left' : 'right';

    // Typography scale: portrait pages are wider (full mobile width) so we
    // can afford comfortable reading sizes. Landscape pages are narrower.
    const typo = isPortrait
      ? { body: 15, lineHeight: 1.9, px: 28, py: 28 }
      : { body: 14, lineHeight: 1.8, px: 22, py: 22 };

    return (
      <div
        ref={ref}
        style={{
          /* The CSS fix sets background-color !important on .stf__item (which is
             this element). We intentionally leave the background here alone so the
             CSS provides the solid dark fallback. The actual texture is rendered by
             the child div below, which is not affected by the parent's !important rule. */
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          position: 'relative',
          userSelect: 'text',
        }}
      >
        {/* Background texture — child div is free from the !important CSS on the parent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${pageTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '1px',
            background:
              'linear-gradient(to right, transparent, rgba(178,102,255,0.3) 30%, rgba(178,102,255,0.3) 70%, transparent)',
          }}
        />

        {/* Main content — z-index 2 sits above the dark overlay (z-index 0) */}
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

        {/* Page number */}
        <div
          style={{
            position: 'absolute',
            bottom: '7px',
            [numSide]: '16px',
            fontSize: '9px',
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.05em',
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

function CoverContent({
  chapter,
  isPortrait,
}: {
  chapter: Chapter;
  isPortrait: boolean;
}) {
  const titleSize = isPortrait ? 'clamp(1.6rem, 6vw, 2.4rem)' : 'clamp(1.3rem, 4vw, 1.9rem)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <span
        style={{
          display: 'block',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(178,102,255,0.8)',
          marginBottom: '28px',
        }}
      >
        CAPÍTULO {chapter.number}
      </span>

      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: titleSize,
          color: '#F5F5F5',
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
          background: 'rgba(178,102,255,0.45)',
          margin: '0 0 22px 0',
        }}
      />

      {chapter.intro && (
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: isPortrait ? '15px' : '13px',
            color: 'rgba(245,245,245,0.52)',
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

function ClosingContent({
  onComplete,
  isPortrait,
}: {
  onComplete?: () => void;
  isPortrait: boolean;
}) {
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
          background: 'rgba(255,255,255,0.10)',
          marginBottom: '24px',
        }}
      />

      <span
        style={{
          display: 'block',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.28)',
          marginBottom: '26px',
        }}
      >
        FIM DO CAPÍTULO
      </span>

      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: isPortrait ? '15px' : '13px',
          color: 'rgba(245,245,245,0.55)',
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
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: '100px',
          padding: '10px 24px',
          color: 'rgba(245,245,245,0.78)',
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'border-color 0.25s, color 0.25s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(178,102,255,0.5)';
          e.currentTarget.style.color = '#F5F5F5';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
          e.currentTarget.style.color = 'rgba(245,245,245,0.78)';
        }}
      >
        Concluir capítulo
      </button>
    </div>
  );
}

// ─── Content blocks ───────────────────────────────────────────────────────────

function PageBlocks({
  blocks,
  typo,
  isPortrait,
}: {
  blocks: ContentBlock[];
  typo: TypoTokens;
  isPortrait: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {blocks.map((block, idx) => (
        <PageBlock key={idx} block={block} typo={typo} isPortrait={isPortrait} />
      ))}
    </div>
  );
}

function PageBlock({
  block,
  typo,
  isPortrait,
}: {
  block: ContentBlock;
  typo: TypoTokens;
  isPortrait: boolean;
}) {
  switch (block.type) {
    // ── Text ─────────────────────────────────────────────────────────────────
    case 'text':
      return (
        <p
          style={{
            fontSize: `${typo.body}px`,
            lineHeight: typo.lineHeight,
            color: 'rgba(245,245,245,0.82)',
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
              border: '1px solid rgba(255,255,255,0.06)',
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
                background: 'linear-gradient(to top, rgba(5,5,5,0.3) 0%, transparent 55%)',
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
            background: 'rgba(12,12,14,0.6)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)',
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
              background: 'linear-gradient(to right, transparent, rgba(178,102,255,0.32), transparent)',
            }}
          />
          <span
            style={{
              display: 'block',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              color: 'rgba(178,102,255,0.8)',
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
              fontSize: isPortrait ? '16px' : '14px',
              color: 'rgba(245,245,245,0.9)',
              lineHeight: 1.65,
              textAlign: 'center',
              margin: '0 0 16px 0',
            }}
          >
            "{block.question}"
          </p>
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.18)',
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
            border: '1px solid rgba(178,102,255,0.2)',
            borderRadius: '10px',
            background: 'rgba(178,102,255,0.04)',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              color: 'rgba(178,102,255,0.85)',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            PRÁTICA
          </span>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isPortrait ? '16px' : '14px',
              color: 'rgba(245,245,245,0.9)',
              lineHeight: 1.7,
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
              background: 'rgba(17,16,20,0.85)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(178,102,255,0.12)',
                border: '1px solid rgba(178,102,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Play
                style={{ width: '15px', height: '15px', color: '#B266FF', marginLeft: '2px' }}
              />
            </div>
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '5px',
                }}
              >
                ÁUDIO · {block.duration}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: isPortrait ? '14px' : '13px',
                  color: 'rgba(245,245,245,0.9)',
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
              background: 'rgba(12,12,14,0.85)',
              border: '1px solid rgba(255,255,255,0.06)',
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
                background: 'radial-gradient(ellipse at 50% 40%, rgba(178,102,255,0.07) 0%, transparent 70%)',
              }}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                position: 'relative',
              }}
            >
              <Play
                style={{ width: '15px', height: '15px', color: 'rgba(245,245,245,0.7)', marginLeft: '2px' }}
                fill="currentColor"
              />
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.3)',
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
                color: 'rgba(245,245,245,0.72)',
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
