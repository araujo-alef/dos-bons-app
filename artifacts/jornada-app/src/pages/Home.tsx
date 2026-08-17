import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { AppHeader } from '@/components/AppHeader';
import { JourneyCard } from '@/components/JourneyCard';
import { LabiaPremiumCard } from '@/components/LabiaPremiumCard';
import { HomeSplash } from '@/components/HomeSplash';
import { useImagePreload } from '@/hooks/useImagePreload';
import { HOME_IMAGES } from '@/lib/preloadImages';
import chainImg      from '@/assets/chain-wide.webp';
import labiaImg      from '@/assets/labia-app-splash-v2.webp';
import instaImg      from '@/assets/codigo-insta-dominante-hq.webp';

export default function Home() {
  const { ready, progress } = useImagePreload(HOME_IMAGES);
  // Kept mounted through the fade-out so the splash dissolves into the home
  // rather than cutting to it.
  const [splashMounted, setSplashMounted] = useState(!ready);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setSplashMounted(false), 340); // ≥ fade duration
    return () => clearTimeout(t);
  }, [ready]);

  // The home is MOUNTED from the very first frame and merely hidden behind
  // the splash — never gated on `ready`. That distinction is the whole
  // point: gating the mount means the real <img> elements are only created
  // once the splash goes away, so the browser re-does the fetch validation
  // and (crucially) the decode right when the user is looking. Mounting up
  // front lets both happen behind the splash, so the reveal is just an
  // opacity change over pixels that are already painted.
  return (
    <>
      {splashMounted && <HomeSplash progress={progress} leaving={ready} />}
      <div
        aria-hidden={!ready}
        style={{
          opacity:    ready ? 1 : 0,
          transition: 'opacity 240ms ease-out',
        }}
      >
        <HomeContent />
      </div>
    </>
  );
}

function HomeContent() {
  return (
    <div className="relative min-h-[100dvh] w-full pb-14" style={{ background: '#050505' }}>

      {/* Ambient layers */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'45%', background:'radial-gradient(ellipse 80% 55% at 60% 0%, rgba(139,53,255,0.10) 0%, transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'65%', background:'radial-gradient(ellipse 90% 60% at 40% 100%, rgba(139,53,255,0.08) 0%, transparent 72%)' }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <AppHeader />

        {/* Chain separator */}
        <div aria-hidden="true" style={{ width:'100%', height:'42px', overflow:'hidden', position:'relative', mixBlendMode:'screen', marginTop:'14px', marginBottom:'32px' }}>
          <img src={chainImg} alt="" style={{ position:'absolute', width:'100%', height:'auto', top:'50%', transform:'translateY(-50%)' }} />
        </div>

        <main className="animate-in fade-in duration-700 ease-out px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">

            {/* ── Card 1: Cachorro dos Bons ──────────────────────────── */}
            <JourneyCard />

            {/* ── Card 2: Lábia de Cachorro — premium 3D object ─────── */}
            <a href="https://pay.cakto.com.br/xuqc3on_733124" target="_blank" rel="noopener noreferrer" className="aspect-[4/5]" style={{ textDecoration:'none', display:'block' }}>
              <LabiaPremiumCard />
            </a>

            {/* ── Card 3: mascote roxo (antigo card 2) ──────────────── */}
            <a href="https://start.labiadecachorro.com/?utm_source=solo.to&sck=1786943312736_17869424946624" target="_blank" rel="noopener noreferrer" className="aspect-[4/5]" style={{ textDecoration:'none', display:'block' }}>
              <div className="group" style={{ borderRadius:16, border:'1px solid rgba(139,53,255,0.28)', background:'#08060b', width:'100%', height:'100%', overflow:'hidden', position:'relative', cursor:'pointer' }}>
                <img
                  src={labiaImg}
                  alt="Lábia de Cachorro — App"
                  style={{ display:'block', width:'100%', height:'100%', objectFit:'contain', objectPosition:'center', transition:'transform 0.3s ease, filter 0.3s ease' }}
                  className="group-hover:scale-[1.02] group-hover:brightness-110"
                />
                <div aria-hidden="true" style={{ position:'absolute', inset:0, borderRadius:16, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(8,6,11,0.55) 100%)', pointerEvents:'none' }} />
              </div>
            </a>

            {/* ── Card 4: Código Insta Dominante ────────────────────── */}
            <a href="https://titiobernardo.com/" target="_blank" rel="noopener noreferrer" className="aspect-[4/5]" style={{ textDecoration:'none', display:'block' }}>
              <div className="group" style={{ borderRadius:16, border:'1px solid rgba(139,53,255,0.28)', background:'#06020d', width:'100%', height:'100%', overflow:'hidden', position:'relative', cursor:'pointer' }}>
                <img
                  src={instaImg}
                  alt="Código Insta Dominante — Perfil + Posicionamento"
                  style={{ display:'block', width:'100%', height:'100%', objectFit:'contain', objectPosition:'center 10%', transition:'transform 0.3s ease, filter 0.3s ease' }}
                  className="group-hover:scale-[1.015] group-hover:brightness-110"
                />
                <div aria-hidden="true" style={{ position:'absolute', inset:0, borderRadius:16, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 58%, rgba(6,2,13,0.60) 100%)', pointerEvents:'none' }} />
              </div>
            </a>

          </div>
        </main>
      </div>
    </div>
  );
}
