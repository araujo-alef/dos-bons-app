import { Link } from 'wouter';
import book3dV2 from '@/assets/book-3d-v2.png';
import { CURRENT_CHAPTER_ID } from '@/mocks/config';

/**
 * JourneyCard — book card on the Home grid.
 *
 * Layer order (bottom → top):
 *   1. Card background (#08070B)
 *   2. Glow primary   — slow breathing radial, #B266FF family
 *   3. Glow secondary — slow drifting, more diffuse
 *   4. Hover boost    — extra glow that fades in on hover (desktop only)
 *   5. Book shadow    — diffuse ellipse below the book, synced with float
 *   6. Book image     — floating animation; hover scale on a wrapper so the
 *                       two transforms live on separate elements
 *   7. Bottom gradient — keeps text legible
 *   8. Text labels
 */
export function JourneyCard() {
  return (
    <Link href={`/jornada/capitulo/${CURRENT_CHAPTER_ID}`} className="block no-underline">
      <div
        className="relative w-full aspect-[4/5] rounded-[14px] overflow-hidden group border border-white/[0.07]"
        style={{ background: '#08070B' }}
        data-testid="card-product-jornada"
      >

        {/* ── Layer 2: Glow primary — breathing purple ─────────────────── */}
        <div
          aria-hidden="true"
          className="book-glow-primary"
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            /* translateX(-50%) is baked into the keyframe so scale stays centered */
            width: '90%',
            height: '68%',
            background:
              'radial-gradient(ellipse at 50% 55%, rgba(178,102,255,0.30) 0%, rgba(139,53,255,0.13) 45%, transparent 70%)',
            filter: 'blur(24px)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Layer 3: Glow secondary — drifting diffuse atmosphere ──── */}
        <div
          aria-hidden="true"
          className="book-glow-secondary"
          style={{
            position: 'absolute',
            top: '14%',
            left: '50%',
            width: '110%',
            height: '58%',
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(139,53,255,0.10) 0%, transparent 65%)',
            filter: 'blur(36px)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Layer 4: Hover boost — desktop only, transition via opacity ─ */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 75% 55% at 50% 38%, rgba(178,102,255,0.13) 0%, transparent 70%)',
          }}
        />

        {/* ── Layer 5: Book shadow — synced ellipse below the book ─────── */}
        <div
          aria-hidden="true"
          className="book-shadow-anim"
          style={{
            position: 'absolute',
            bottom: '13%',
            left: '50%',
            width: '58%',
            height: '9%',
            background:
              'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.58) 0%, transparent 70%)',
            filter: 'blur(9px)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Layer 6: Book image ───────────────────────────────────────── */}
        <div
          className="absolute inset-x-0"
          style={{
            top: '4%',
            height: '82%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/*
            Hover scale lives on this wrapper so it uses a separate DOM element
            from the float animation on the <img> — prevents the two transforms
            from overriding each other on the same element.
          */}
          <div
            className="group-hover:scale-[1.018] transition-transform duration-700 ease-out"
            style={{ width: '88%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img
              src={book3dV2}
              alt="Cachorro dos Bons"
              className="book-float"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center center',
                /* screen blend removes the pure-black photo background,
                   letting the card's dark bg show through cleanly */
                mixBlendMode: 'screen',
                willChange: 'transform',
              }}
              loading="eager"
            />
          </div>
        </div>

        {/* ── Layer 7: Bottom gradient — text legibility ───────────────── */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '55%',
            background:
              'linear-gradient(to top, #08070B 38%, rgba(8,7,11,0.65) 65%, transparent 100%)',
          }}
        />

        {/* ── Layer 8: Text content ─────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 flex flex-col gap-1">
          <span className="text-[9px] font-bold tracking-[0.2em] text-primary/70 leading-none group-hover:text-primary/90 transition-colors duration-500">
            JORNADA
          </span>
          <h3 className="text-white/90 font-sans text-sm font-semibold leading-tight">
            Cachorro dos Bons
          </h3>
        </div>

      </div>
    </Link>
  );
}
