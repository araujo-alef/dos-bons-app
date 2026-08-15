import { Link } from 'wouter';
import { AppHeader } from '@/components/AppHeader';
import { JourneyCard } from '@/components/JourneyCard';
import { ChainBreakParticles } from '@/components/ChainBreakParticles';
import chainImg      from '@/assets/chain-wide.png';
import labiaNovaImg  from '@/assets/labia-de-cachorro-nova.png';
import labiaImg      from '@/assets/labia-de-cachorro.png';
import instaImg      from '@/assets/codigo-insta-dominante-hq.png';

export default function Home() {
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

            {/* ── Card 2: Lábia de Cachorro — nova arte (estática) ───── */}
            <Link href="/em-breve/comunidade" className="aspect-[4/5]" style={{ textDecoration:'none', display:'block' }}>
              <div className="group" style={{ borderRadius:16, border:'1px solid rgba(185,28,28,0.22)', background:'#080304', width:'100%', height:'100%', overflow:'hidden', position:'relative', cursor:'pointer' }}>
                <img
                  src={labiaNovaImg}
                  alt="Lábia de Cachorro — A lábia que faz ela correr atrás"
                  style={{ display:'block', width:'100%', height:'100%', objectFit:'cover', objectPosition:'center center', transition:'transform 0.3s ease, filter 0.3s ease' }}
                  className="group-hover:scale-[1.02] group-hover:brightness-110"
                />
                <div aria-hidden="true" style={{ position:'absolute', inset:0, borderRadius:16, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 58%, rgba(8,3,4,0.55) 100%)', pointerEvents:'none' }} />
                <ChainBreakParticles left="50%" top="54%" />
              </div>
            </Link>

            {/* ── Card 3: mascote roxo (antigo card 2) ──────────────── */}
            <Link href="/em-breve/comunidade" className="aspect-[4/5]" style={{ textDecoration:'none', display:'block' }}>
              <div className="group" style={{ borderRadius:16, border:'1px solid rgba(139,53,255,0.28)', background:'#08060b', width:'100%', height:'100%', overflow:'hidden', position:'relative', cursor:'pointer' }}>
                <img
                  src={labiaImg}
                  alt="Lábia de Cachorro — Comunidade + Aulas"
                  style={{ display:'block', width:'100%', height:'100%', objectFit:'contain', objectPosition:'center', transition:'transform 0.3s ease, filter 0.3s ease' }}
                  className="group-hover:scale-[1.02] group-hover:brightness-110"
                />
                <div aria-hidden="true" style={{ position:'absolute', inset:0, borderRadius:16, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(8,6,11,0.55) 100%)', pointerEvents:'none' }} />
              </div>
            </Link>

            {/* ── Card 4: Código Insta Dominante ────────────────────── */}
            <Link href="/em-breve/ia" className="aspect-[4/5]" style={{ textDecoration:'none', display:'block' }}>
              <div className="group" style={{ borderRadius:16, border:'1px solid rgba(139,53,255,0.28)', background:'#06020d', width:'100%', height:'100%', overflow:'hidden', position:'relative', cursor:'pointer' }}>
                <img
                  src={instaImg}
                  alt="Código Insta Dominante — Perfil + Posicionamento"
                  style={{ display:'block', width:'100%', height:'100%', objectFit:'contain', objectPosition:'center 10%', transition:'transform 0.3s ease, filter 0.3s ease' }}
                  className="group-hover:scale-[1.015] group-hover:brightness-110"
                />
                <div aria-hidden="true" style={{ position:'absolute', inset:0, borderRadius:16, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 58%, rgba(6,2,13,0.60) 100%)', pointerEvents:'none' }} />
              </div>
            </Link>

          </div>
        </main>
      </div>
    </div>
  );
}
