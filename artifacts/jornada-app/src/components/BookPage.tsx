import React from 'react';
import { Play } from 'lucide-react';
import type { Lesson, ContentBlock } from '@/mocks/data';
import type { FlatBlock, DynamicPage } from '@/lib/pagination';
import { TOOLBAR_CLEARANCE_CSS } from '@/lib/readerLayout';
import { PageWatermark } from './PageWatermark';
import { HighlightedText } from './HighlightedText';
import type { WatermarkIdentity } from '@/lib/watermark';
import type { BookHighlight } from '@/lib/highlights';

const IS_TOUCH_DEVICE = typeof window !== 'undefined' && 'ontouchstart' in window;

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
  lesson:             Lesson;
  content:            DynamicPage;
  /** Position of this page in the book's page-number counter (0-based). */
  displayIndex:       number;
  isPortrait?:        boolean;
  watermarkIdentity?: WatermarkIdentity;
  /** When true, text selection is enabled for creating highlights */
  isHighlightMode?:   boolean;
  /** Every highlight in the book — filtered internally per block by its
   *  origin (pageId, blockIdx), since a dynamic page's blocks may come from
   *  more than one originally-authored page. */
  allHighlights?:     BookHighlight[];
  pulsingHighlightId?: string | null;
  /** Off for carousel thumbnails, which draw their own (active-aware) page
   *  number over the scaled-down page — otherwise both would show. */
  showPageNumber?:    boolean;
}

export const BookPage = React.forwardRef<HTMLDivElement, BookPageProps>(
  ({
    lesson, content, displayIndex,
    isPortrait = true,
    watermarkIdentity, isHighlightMode = false,
    allHighlights = [], pulsingHighlightId,
    showPageNumber = true,
  }, ref) => {
    const typo = isPortrait
      ? { body: 19, lineHeight: 1.85, px: 28, py: 28, pyTop: 54 }
      : { body: 17, lineHeight: 1.75, px: 22, py: 22, pyTop: 22 };
    const coverPageId = lesson.pages?.find(p => p.type === 'cover')?.id ?? 0;

    return (
      <div
        ref={ref}
        style={{
          width:          '100%',
          height:         '100%',
          overflow:       'hidden',
          boxSizing:      'border-box',
          position:       'relative',
          // Selection is scoped per-element by <HighlightableText> — never
          // opened up at the page level, or every non-text container (and the
          // gaps between them) becomes draggable-selectable too.
          userSelect:     'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: isHighlightMode ? 'default' : 'none',
        }}
      >
        {/* Cream background */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: C.bg, zIndex: 0 }} />

        {/* Subtle warm vignette */}
        <div
          aria-hidden="true"
          style={{
            position:   'absolute', inset: 0,
            background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 60%, rgba(30,12,0,0.08) 100%)',
            zIndex: 0,
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position:   'relative', zIndex: 1, height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(139,53,255,0.25) 30%, rgba(139,53,255,0.25) 70%, transparent)',
          }}
        />

        {/* Main content */}
        <div
          data-page-content-area="true"
          style={{
            // Bottom clearance for the always-visible toolbar. Shared with
            // BookMeasurer via TOOLBAR_CLEARANCE_CSS so pagination measures
            // against exactly this box — see lib/readerLayout.ts.
            position: 'absolute', top: '1px', left: 0, right: 0,
            bottom: TOOLBAR_CLEARANCE_CSS,
            overflow: 'hidden', zIndex: 2,
            padding: `${typo.pyTop}px ${typo.px}px 0`,
            display: 'flex', flexDirection: 'column',
          }}
        >
          {content.kind === 'cover' ? (
            <CoverContent
              lesson={lesson}
              coverPageId={coverPageId}
              isPortrait={isPortrait}
              isHighlightMode={isHighlightMode}
              /* lessonId is essential here, not redundant: every lesson's
                 cover shares the same page id (1), so filtering on pageId
                 alone would show one lesson's cover highlights on all of
                 them. Block-level filtering happens inside CoverContent. */
              pageHighlights={allHighlights.filter(
                h => h.lessonId === lesson.id && h.pageId === coverPageId
              )}
              pulsingHighlightId={pulsingHighlightId}
            />
          ) : (
            <PageBlocks
              items={content.items}
              typo={typo}
              isPortrait={isPortrait}
              isHighlightMode={isHighlightMode}
              lessonId={lesson.id}
              allHighlights={allHighlights}
              pulsingHighlightId={pulsingHighlightId}
            />
          )}
        </div>

        {/* Page number */}
        {showPageNumber && (
          <div
            style={{
              position: 'absolute', bottom: '10px', right: '16px',
              fontSize: '10px', fontFamily: 'monospace',
              color: C.inkFaint, letterSpacing: '0.06em',
              zIndex: 3, userSelect: 'none',
            }}
          >
            {displayIndex + 1}
          </div>
        )}

        {/* Watermark — always present, never blocks interaction */}
        {watermarkIdentity && <PageWatermark identity={watermarkIdentity} />}
      </div>
    );
  }
);
BookPage.displayName = 'BookPage';

// ─── Typography token shorthand ───────────────────────────────────────────────

interface TypoTokens { body: number; lineHeight: number; px: number; py: number; }

// ─── Highlightable text primitive ──────────────────────────────────────────────
// Any body text that should support highlighting renders through this
// component — it wires the data-block-idx anchor + <HighlightedText> + the
// userSelect toggle. Reused by PageBlock (content pages) and the fixed
// cover/closing layouts, so every text surface gets highlight support
// automatically instead of needing per-page wiring.

interface HighlightableTextProps {
  as?:                 'p' | 'span';
  blockIdx:            number;
  /** Original authored page id this block belongs to — stable identity used
   *  by touch-selection to anchor highlights, independent of which dynamic
   *  page the block currently renders on. Omitted for the cover, which has
   *  no dynamic repagination. */
  originPageId?:       number;
  text:                string;
  isHighlightMode:     boolean;
  blockHighlights:     BookHighlight[];
  pulsingHighlightId?: string | null;
  style?:              React.CSSProperties;
}

function HighlightableText({
  as: Tag = 'p', blockIdx, originPageId, text, isHighlightMode, blockHighlights, pulsingHighlightId, style,
}: HighlightableTextProps) {
  return (
    <Tag
      data-block-idx={blockIdx}
      data-origin-page-id={originPageId}
      style={{ ...style, userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/*
        Native browser selection (user-select:text) is only ever enabled here
        for MOUSE input. Touch devices build their own selection entirely in
        JS (see the touch-drag effect in BookReader + <TouchSelectionOverlay>)
        instead of relying on window.getSelection() — iOS Safari's native
        long-press gesture proved unreliable when a React re-render landed
        mid-gesture. Keeping user-select:none here on touch means there's no
        native gesture for iOS to engage in the first place.
      */}
      <span
        style={{
          userSelect:         (isHighlightMode && !IS_TOUCH_DEVICE) ? 'text' : 'none',
          WebkitUserSelect:   (isHighlightMode && !IS_TOUCH_DEVICE) ? 'text' : 'none',
          WebkitTouchCallout: 'none',
          cursor:             isHighlightMode ? 'text' : 'default',
        }}
      >
        <HighlightedText text={text} blockHighlights={blockHighlights} pulsingId={pulsingHighlightId} />
      </span>
    </Tag>
  );
}

// ─── Cover ────────────────────────────────────────────────────────────────────

// The cover has no real ContentBlocks, so its highlightable pieces get fixed
// synthetic block indices. Intro stays 0 — it was the only highlightable
// element before the title became selectable, and changing it would orphan
// every already-saved cover highlight.
const COVER_INTRO_BLOCK = 0;
const COVER_TITLE_BLOCK = 1;

interface CoverContentProps {
  lesson:              Lesson;
  coverPageId:         number;
  isPortrait:          boolean;
  isHighlightMode:     boolean;
  pageHighlights:      BookHighlight[];
  pulsingHighlightId?: string | null;
}

function CoverContent({ lesson, coverPageId, isPortrait, isHighlightMode, pageHighlights, pulsingHighlightId }: CoverContentProps) {
  const titleSize = isPortrait ? 'clamp(1.6rem, 6vw, 2.4rem)' : 'clamp(1.3rem, 4vw, 1.9rem)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.24em', color: C.purple, marginBottom: '28px' }}>
        LIÇÃO {lesson.number}
      </span>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: titleSize, color: '#251508', lineHeight: 1.2, margin: '0 0 20px 0' }}>
        <HighlightableText
          as="span"
          blockIdx={COVER_TITLE_BLOCK}
          originPageId={coverPageId}
          text={lesson.title}
          isHighlightMode={isHighlightMode}
          blockHighlights={pageHighlights.filter(h => h.blockIdx === COVER_TITLE_BLOCK)}
          pulsingHighlightId={pulsingHighlightId}
        />
      </h1>
      <div style={{ width: '28px', height: '1px', background: C.purpleFaint, margin: '0 0 22px 0' }} />
      {lesson.intro && (
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: isPortrait ? '18px' : '16px', color: C.inkMid, lineHeight: 1.75, margin: 0 }}>
          "<HighlightableText
            as="span"
            blockIdx={COVER_INTRO_BLOCK}
            originPageId={coverPageId}
            text={lesson.intro}
            isHighlightMode={isHighlightMode}
            blockHighlights={pageHighlights.filter(h => h.blockIdx === COVER_INTRO_BLOCK)}
            pulsingHighlightId={pulsingHighlightId}
          />"
        </p>
      )}
    </div>
  );
}

// ─── Content blocks ───────────────────────────────────────────────────────────

interface PageBlocksProps {
  items:             FlatBlock[];
  typo:              TypoTokens;
  isPortrait:        boolean;
  isHighlightMode:   boolean;
  lessonId:          number;
  allHighlights:     BookHighlight[];
  pulsingHighlightId?: string | null;
}

function PageBlocks({ items, typo, isPortrait, isHighlightMode, lessonId, allHighlights, pulsingHighlightId }: PageBlocksProps) {
  // Group consecutive center:true text blocks so they land together in the
  // middle of the page (one shared flex slot, small gap between lines)
  // instead of each claiming its own equal third of the vertical space.
  const groups: { centered: boolean; items: FlatBlock[] }[] = [];
  items.forEach(fb => {
    const centered = fb.block.type === 'text' && !!fb.block.center;
    const last = groups[groups.length - 1];
    if (last && last.centered === centered) last.items.push(fb);
    else groups.push({ centered, items: [fb] });
  });

  const renderBlock = (fb: FlatBlock) => (
    <PageBlock
      key={`${fb.originPageId}-${fb.originBlockIdx}`}
      block={fb.block}
      blockIdx={fb.originBlockIdx}
      originPageId={fb.originPageId}
      typo={typo}
      isPortrait={isPortrait}
      isHighlightMode={isHighlightMode}
      blockHighlights={allHighlights.filter(
        h => h.lessonId === lessonId && h.pageId === fb.originPageId && h.blockIdx === fb.originBlockIdx
      )}
      pulsingHighlightId={pulsingHighlightId}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {groups.map((group, gi) =>
        group.centered ? (
          <div key={gi} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
            {group.items.map(renderBlock)}
          </div>
        ) : (
          group.items.map(renderBlock)
        )
      )}
    </div>
  );
}

interface PageBlockProps {
  block:             ContentBlock;
  blockIdx:          number;
  originPageId?:     number;
  typo:              TypoTokens;
  isPortrait:        boolean;
  isHighlightMode:   boolean;
  blockHighlights:   BookHighlight[];
  pulsingHighlightId?: string | null;
}

export function PageBlock({ block, blockIdx, originPageId, typo, isPortrait, isHighlightMode, blockHighlights, pulsingHighlightId }: PageBlockProps) {
  switch (block.type) {
    // ── Text ─────────────────────────────────────────────────────────────────
    // WebkitTouchCallout:none (set inside HighlightableText) suppresses the iOS
    // native Copy/Paste popup, which fires spurious collapsed selectionchange
    // events that would otherwise kill our confirm-menu timer.
    case 'text':
      if (block.center) {
        // No flex wrapper here — PageBlocks groups consecutive centered
        // blocks into one shared centered container, so this just needs to
        // render as a centered line within that group.
        return (
          <HighlightableText
            blockIdx={blockIdx}
            originPageId={originPageId}
            text={block.content}
            isHighlightMode={isHighlightMode}
            blockHighlights={blockHighlights}
            pulsingHighlightId={pulsingHighlightId}
            style={{
              fontSize: `${typo.body}px`, lineHeight: typo.lineHeight,
              color: C.ink, fontFamily: 'Inter, sans-serif',
              fontWeight: 300, letterSpacing: '0.012em',
              textAlign: 'center', margin: 0,
            }}
          />
        );
      }
      return (
        <HighlightableText
          blockIdx={blockIdx}
          originPageId={originPageId}
          text={block.content}
          isHighlightMode={isHighlightMode}
          blockHighlights={blockHighlights}
          pulsingHighlightId={pulsingHighlightId}
          style={{
            fontSize: `${typo.body}px`, lineHeight: typo.lineHeight,
            color: C.ink, fontFamily: 'Inter, sans-serif',
            fontWeight: 300, letterSpacing: '0.012em',
            margin: '0 0 8px 0',
          }}
        />
      );

    // ── Image ─────────────────────────────────────────────────────────────────
    case 'image':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
          <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${C.inkHair}`, position: 'relative' }}>
            <img src={block.src} alt={block.alt || 'Imagem editorial'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,12,0,0.18) 0%, transparent 55%)' }} />
          </div>
        </div>
      );

    // ── Reflection ────────────────────────────────────────────────────────────
    case 'reflection':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isPortrait ? '24px 20px' : '18px 16px', background: C.inkHair, borderRadius: '10px', border: `1px solid ${C.inkGhost}`, position: 'relative', overflow: 'hidden', userSelect: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(to right, transparent, ${C.purpleFaint}, transparent)` }} />
          <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.24em', color: C.purple, textAlign: 'center', marginBottom: '18px' }}>REFLEXÃO</span>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: isPortrait ? '20px' : '18px', color: '#251508', lineHeight: 1.6, textAlign: 'center', margin: '0 0 16px 0' }}>
            "<HighlightableText
              as="span"
              blockIdx={blockIdx}
              originPageId={originPageId}
              text={block.question}
              isHighlightMode={isHighlightMode}
              blockHighlights={blockHighlights}
              pulsingHighlightId={pulsingHighlightId}
            />"
          </p>
          <p style={{ fontSize: '13px', color: C.inkFaint, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Suas reflexões ficam apenas com você…</p>
        </div>
      );

    // ── Practice ──────────────────────────────────────────────────────────────
    case 'practice':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isPortrait ? '24px 20px' : '18px 16px', border: `1px solid ${C.purpleFaint}`, borderRadius: '10px', background: C.purpleHair, userSelect: 'none' }}>
          <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.24em', color: C.purple, textAlign: 'center', marginBottom: '16px' }}>PRÁTICA</span>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: isPortrait ? '20px' : '18px', color: '#251508', lineHeight: 1.65, textAlign: 'center', margin: 0 }}>
            <HighlightableText
              as="span"
              blockIdx={blockIdx}
              originPageId={originPageId}
              text={block.instruction}
              isHighlightMode={isHighlightMode}
              blockHighlights={blockHighlights}
              pulsingHighlightId={pulsingHighlightId}
            />
          </p>
        </div>
      );

    // ── Audio ─────────────────────────────────────────────────────────────────
    case 'audio':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: isPortrait ? '18px 20px' : '14px 16px', background: C.inkHair, borderRadius: '12px', border: `1px solid ${C.inkGhost}`, cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: C.purpleHair, border: `1px solid ${C.purpleFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Play style={{ width: '15px', height: '15px', color: '#8B35FF', marginLeft: '2px' }} />
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', color: C.inkFaint, marginBottom: '5px' }}>ÁUDIO · {block.duration}</span>
              <span style={{ display: 'block', fontSize: isPortrait ? '17px' : '15px', color: '#251508', fontWeight: 500, lineHeight: 1.3 }}>{block.title}</span>
            </div>
          </div>
        </div>
      );

    // ── Video ─────────────────────────────────────────────────────────────────
    case 'video':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
          <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '10px', background: C.inkHair, border: `1px solid ${C.inkGhost}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', userSelect: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${C.purpleHair} 0%, transparent 70%)` }} />
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: C.inkHair, border: `1px solid ${C.inkGhost}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', position: 'relative' }}>
              <Play style={{ width: '15px', height: '15px', color: C.inkMid, marginLeft: '2px' }} fill="currentColor" />
            </div>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', color: C.inkFaint, marginBottom: '5px', position: 'relative' }}>VÍDEO · {block.duration}</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: isPortrait ? '14px' : '13px', color: C.inkMid, position: 'relative' }}>{block.title}</span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
