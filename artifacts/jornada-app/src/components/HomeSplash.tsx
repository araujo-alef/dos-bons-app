interface HomeSplashProps {
  /** 0–1 — drives the progress bar. */
  progress: number;
  /** Fades out (without unmounting) once the home screen is ready. */
  leaving?: boolean;
}

/**
 * Loading screen shown while the home screen's artwork downloads, so the
 * cards appear complete instead of popping in image by image. Deliberately
 * uses no images itself — it must paint on the first frame.
 */
export function HomeSplash({ progress, leaving = false }: HomeSplashProps) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Carregando — ${pct}%`}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: '#050505',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 34, padding: '0 32px',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 320ms ease-out',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      {/* Ambient purple wash — mirrors the home screen's own backdrop so the
          handover between splash and home is imperceptible. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 80% 55% at 60% 0%, rgba(139,53,255,0.10) 0%, transparent 70%),' +
            'radial-gradient(ellipse 90% 60% at 40% 100%, rgba(139,53,255,0.08) 0%, transparent 72%)',
        }}
      />

      <p
        style={{
          position: 'relative',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 28, fontWeight: 400, lineHeight: 1.2,
          letterSpacing: '0.01em', color: '#F2F2F2',
          margin: 0, maxWidth: 280, textAlign: 'center',
        }}
      >
        Nem todo cachorro nasceu
        <br />
        pra usar <span style={{ color: '#B266FF' }}>coleira.</span>
      </p>

      {/* Progress track */}
      <div
        style={{
          position: 'relative',
          width: '100%', maxWidth: 200, height: 2,
          background: 'rgba(255,255,255,0.10)',
          borderRadius: 2, overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(to right, rgba(139,53,255,0.7), #B266FF)',
            borderRadius: 2,
            transition: 'width 260ms ease-out',
          }}
        />
      </div>
    </div>
  );
}
