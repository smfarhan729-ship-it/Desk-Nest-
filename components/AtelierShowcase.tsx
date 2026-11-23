'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DeskDioramaEngine,
  type AtmosphereMode,
  type HotspotProjection,
} from '@/lib/deskScene';
import { FULL_SETUP_TOTAL, PRODUCTS, type DeskProduct } from '@/lib/products';
import Navbar from './Navbar';
import LoadingScreen from './LoadingScreen';
import CustomCursor from './CustomCursor';
import ProductDrawer from './ProductDrawer';
import ConversionDock from './ConversionDock';
import FullSetupModal from './FullSetupModal';
import DeskNestLogo, { DeskNestWordmark } from './DeskNestLogo';

gsap.registerPlugin(ScrollTrigger);

export default function AtelierShowcase() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DeskDioramaEngine | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const hotspotElsRef = useRef<Record<string, HTMLButtonElement | null>>({});

  const [loadProgress, setLoadProgress] = useState(8);
  const [sceneReady, setSceneReady] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>('night');
  const [activeAct, setActiveAct] = useState<number>(0);
  const [hovered3DProduct, setHovered3DProduct] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DeskProduct | null>(null);
  const [fullSetupOpen, setFullSetupOpen] = useState(false);

  const isDay = atmosphere === 'day';
  const activeProduct = activeAct > 0 ? PRODUCTS[activeAct - 1] ?? null : null;

  // Keep HTML .dark class synced with Atmosphere mode
  useEffect(() => {
    const root = document.documentElement;
    if (atmosphere === 'day') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    engineRef.current?.setAtmosphere(atmosphere);
  }, [atmosphere]);

  const handleOpenProductById = useCallback((productId: string) => {
    const match = PRODUCTS.find((p) => p.id === productId);
    if (match) setSelectedProduct(match);
  }, []);

  const handleHotspotsProject = useCallback((projections: HotspotProjection[]) => {
    for (const p of projections) {
      const el = hotspotElsRef.current[p.id];
      if (!el) continue;
      if (!p.visible) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      } else {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
      }
    }
  }, []);

  // Mount Three.js WebGL Engine once in isolated ref container
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new DeskDioramaEngine(mountEl, {
      onLoadProgress: (pct) => setLoadProgress(pct),
      onReady: () => {
        setLoadProgress(100);
        window.setTimeout(() => setSceneReady(true), 260);
      },
      onWebGLError: (msg) => {
        setWebglError(msg);
        setLoadProgress(100);
        setSceneReady(true);
      },
      onProductHover: (id) => setHovered3DProduct(id),
      onProductClick: (id) => handleOpenProductById(id),
      onHotspotsProject: handleHotspotsProject,
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleHotspotsProject, handleOpenProductById]);

  // Synchronize Lenis smooth scroll with GSAP ScrollTrigger across 6 scroll acts
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: reducedMotion ? 0.01 : 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reducedMotion,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const actElements = gsap.utils.toArray<HTMLElement>('[data-scroll-act]');
      actElements.forEach((sectionEl) => {
        const actIndex = Number(sectionEl.dataset.scrollAct || 0);
        ScrollTrigger.create({
          trigger: sectionEl,
          start: 'top 55%',
          end: 'bottom 45%',
          onEnter: () => {
            setActiveAct(actIndex);
            engineRef.current?.setActiveAct(actIndex);
          },
          onEnterBack: () => {
            setActiveAct(actIndex);
            engineRef.current?.setActiveAct(actIndex);
          },
        });
      });
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToAct = useCallback((actIndex: number) => {
    const target = document.getElementById(`act-${actIndex}`);
    if (!target) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: 0, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveAct(actIndex);
    engineRef.current?.setActiveAct(actIndex);
  }, []);

  const focusProductById = useCallback(
    (productId: string) => {
      const idx = PRODUCTS.findIndex((p) => p.id === productId);
      if (idx >= 0) scrollToAct(idx + 1);
    },
    [scrollToAct]
  );

  const toggleAtmosphere = useCallback(() => {
    setAtmosphere((prev) => (prev === 'night' ? 'day' : 'night'));
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      {/* Subtle Film-Grain Texture Overlay */}
      <div aria-hidden="true" className="ak-film-grain" />

      {/* Minimal Architectural Loading Screen */}
      <LoadingScreen progress={loadProgress} visible={!sceneReady} />

      {/* Smooth Desktop Custom Cursor */}
      <CustomCursor hovered3DProduct={hovered3DProduct} />

      {/* Fixed Full-Viewport Three.js WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 z-0 h-full w-full"
        aria-hidden={Boolean(webglError)}
      />

      {/* Graceful WebGL Fallback Surface (only rendered if WebGL fails) */}
      {webglError && (
        <div
          className={`fixed inset-0 z-0 flex items-center justify-center px-6 ${
            isDay ? 'bg-[#F8FAFC] text-[#0F2133]' : 'bg-[#08111A] text-[#F8FAFC]'
          }`}
        >
          <div
            className={`max-w-md rounded-lg border p-6 text-center ${
              isDay
                ? 'border-[#0F2133]/14 bg-white/95'
                : 'border-[rgba(0,200,150,0.22)] bg-[rgba(15,33,51,0.9)]'
            }`}
          >
            <AlertTriangle className="mx-auto h-6 w-6 text-[#00C896]" />
            <h2 className="mt-3 font-display text-lg font-semibold">
              3D Viewport Paused
            </h2>
            <p
              className={`mt-2 text-sm leading-relaxed ${
                isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
              }`}
            >
              {webglError} All five curated DeskNest hardware breakdowns, technical specs,
              and partner links remain fully accessible below.
            </p>
          </div>
        </div>
      )}

      {/* Floating 3D-to-2D Projected Hotspot Pins (DeskNest Emerald Glow) */}
      {!webglError && (
        <div
          className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
          aria-label="Interactive 3D product hotspots"
        >
          {PRODUCTS.map((product, idx) => {
            const isSpotlighted = activeAct === idx + 1;
            const isHovered = hovered3DProduct === product.id;

            return (
              <button
                key={product.id}
                ref={(el) => {
                  hotspotElsRef.current[product.id] = el;
                }}
                type="button"
                data-cursor="hotspot"
                data-ui-interactive="true"
                onClick={() => setSelectedProduct(product)}
                aria-label={`Inspect ${product.name} (${product.priceFormatted})`}
                style={{ opacity: 0 }}
                className="group fixed top-0 left-0 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00C896]"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
                    isSpotlighted || isHovered
                      ? 'scale-110 border-[#00C896] bg-[#08111A]/90 text-[#00C896] shadow-[0_0_14px_rgba(0,200,150,0.45)]'
                      : isDay
                        ? 'border-[#0F2133]/35 bg-[#F8FAFC]/92 text-[#0F2133] hover:border-[#008B6B] hover:text-[#008B6B]'
                        : 'border-[rgba(0,200,150,0.45)] bg-[#08111A]/82 text-[#F8FAFC] hover:border-[#00C896] hover:text-[#00C896]'
                  }`}
                >
                  <span className="font-mono text-[10px] font-semibold tabular-nums">
                    {product.index}
                  </span>
                </span>

                <span
                  className={`hidden sm:inline-block rounded-md border px-2.5 py-1 font-mono text-[10px] tracking-wide whitespace-nowrap transition-opacity duration-200 ${
                    isSpotlighted || isHovered
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  } ${
                    isDay
                      ? 'border-[#0F2133]/14 bg-[#F8FAFC]/95 text-[#0F2133]'
                      : 'border-[rgba(0,200,150,0.28)] bg-[rgba(15,33,51,0.92)] text-[#F8FAFC]'
                  }`}
                >
                  {product.shortNavLabel} · {product.priceFormatted}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Top Navigation Bar (3 Zones + DeskNest Logo + Day/Night Atmosphere Toggle) */}
      <Navbar
        activeAct={activeAct}
        atmosphere={atmosphere}
        onToggleAtmosphere={toggleAtmosphere}
        onJumpToAct={scrollToAct}
      />

      {/* Scrollable Editorial Layer (6 Full-Viewport Scroll Acts + Footer) */}
      <main className="relative z-20 pointer-events-none">
        {/* ================================================================= */}
        {/* ACT 0: HERO — Architectural Establishing Shot                     */}
        {/* ================================================================= */}
        <section
          id="act-0"
          data-scroll-act="0"
          className="relative flex min-h-screen w-full flex-col justify-between px-5 pt-24 pb-28 sm:px-10 lg:px-14 max-[768px]:justify-end max-[768px]:gap-2.5 max-[768px]:px-3.5 max-[768px]:pt-[44vh] max-[768px]:pb-24"
        >
          {/* Upper Left Hero Brand Kicker & Studio Taxonomy */}
          <div className="mx-auto w-full max-w-[1440px] max-[768px]:hidden">
            <div
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums ${
                isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
              }`}
            >
              <DeskNestWordmark atmosphere={atmosphere} className="text-xs tracking-normal" />
              <span aria-hidden="true">/</span>
              <span>Five-Piece Studio Desk Architecture</span>
              <span aria-hidden="true">/</span>
              <span>Click any 3D object to inspect</span>
            </div>
          </div>

          {/* Lower-Left Editorial Lockup leaving full central/right 3D diorama clear */}
          <div className="mx-auto w-full max-w-[1440px] flex flex-col lg:flex-row lg:items-end justify-between gap-8 max-[768px]:gap-3">
            <div
              data-ui-interactive="true"
              className={`pointer-events-auto max-w-[490px] rounded-xl border p-6 sm:p-7 transition-colors duration-500 max-[768px]:w-full max-[768px]:max-w-none max-[768px]:rounded-2xl max-[768px]:p-[18px] max-[768px]:backdrop-blur-[12px] ${
                isDay
                  ? 'border-[#0F2133]/12 bg-[#F8FAFC]/90 text-[#0F2133] max-[768px]:bg-[rgba(248,250,252,0.82)]'
                  : 'border-[rgba(0,200,150,0.22)] bg-[rgba(15,33,51,0.82)] text-[#F8FAFC] max-[768px]:bg-[rgba(15,33,51,0.78)]'
              }`}
            >
              <div
                className={`hidden max-[768px]:flex items-center gap-2 mb-2 font-mono text-[10px] tabular-nums ${
                  isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                }`}
              >
                <DeskNestWordmark atmosphere={atmosphere} className="text-[11px]" />
                <span aria-hidden="true">·</span>
                <span>Tap any 3D object to inspect</span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] text-balance max-[768px]:text-2xl max-[768px]:leading-[1.1]">
                Sculpted Focus for Tactile Work.
              </h1>
              <p
                className={`mt-4 text-sm sm:text-[15px] leading-relaxed max-[768px]:mt-2 max-[768px]:text-[13px] max-[768px]:leading-snug max-[768px]:line-clamp-2 ${
                  isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                }`}
              >
                An interactive 3D study of five calibrated desk instruments—solid American
                walnut, CNC 6063 aluminum, merino wool, and balanced studio optics—curated by{' '}
                <DeskNestWordmark atmosphere={atmosphere} /> for deep creative sessions.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 max-[768px]:mt-4 max-[768px]:gap-2">
                <button
                  type="button"
                  onClick={() => scrollToAct(1)}
                  data-cursor="cta"
                  className="ak-sheen-btn inline-flex items-center gap-2 rounded-md bg-[#008B6B] px-5 py-2.5 text-sm font-semibold text-[#F8FAFC] whitespace-nowrap hover:bg-[#00C896] hover:text-[#08111A] max-[768px]:flex-1 max-[768px]:justify-center max-[768px]:px-3.5 max-[768px]:py-2 max-[768px]:text-xs"
                >
                  <span>Begin Desk Tour</span>
                  <ArrowDown className="h-4 w-4 shrink-0 max-[768px]:h-3.5 max-[768px]:w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setFullSetupOpen(true)}
                  data-cursor="cta"
                  className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors max-[768px]:px-3 max-[768px]:py-2 max-[768px]:text-xs ${
                    isDay
                      ? 'border-[#0F2133]/18 text-[#0F2133] hover:border-[#008B6B]'
                      : 'border-[rgba(0,200,150,0.26)] text-[#F8FAFC] hover:border-[#00C896]'
                  }`}
                >
                  <span>Full Setup · ${FULL_SETUP_TOTAL.toLocaleString()}</span>
                </button>
              </div>
            </div>

            {/* Quiet Scroll Progress Reference on Right */}
            <div
              className={`hidden lg:flex flex-col items-end font-mono text-xs tabular-nums ${
                isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
              }`}
            >
              <span>00 / 05</span>
              <span className="mt-1">Scroll to frame each instrument</span>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* ACTS 1 TO 5: INDIVIDUAL PRODUCT SPOTLIGHTS                        */}
        {/* ================================================================= */}
        {PRODUCTS.map((product, idx) => {
          const actNumber = idx + 1;
          const isRightAligned = product.alignment === 'right';
          const isCurrent = activeAct === actNumber;

          return (
            <section
              key={product.id}
              id={`act-${actNumber}`}
              data-scroll-act={actNumber}
              className="relative flex min-h-screen w-full items-end lg:items-center px-5 py-28 sm:px-10 lg:px-14 max-[768px]:items-end max-[768px]:px-3.5 max-[768px]:pt-[44vh] max-[768px]:pb-24"
            >
              <div
                className={`mx-auto flex w-full max-w-[1440px] ${
                  isRightAligned ? 'justify-end' : 'justify-start'
                }`}
              >
                <article
                  data-ui-interactive="true"
                  className={`pointer-events-auto w-full max-w-[440px] rounded-xl border p-6 sm:p-7 transition-all duration-500 max-[768px]:max-w-none max-[768px]:rounded-2xl max-[768px]:p-[18px] max-[768px]:backdrop-blur-[12px] ${
                    isDay
                      ? isCurrent
                        ? 'border-[#008B6B]/55 bg-[#F8FAFC]/94 text-[#0F2133] shadow-xl max-[768px]:bg-[rgba(248,250,252,0.84)]'
                        : 'border-[#0F2133]/12 bg-[#F8FAFC]/88 text-[#0F2133] max-[768px]:bg-[rgba(248,250,252,0.8)]'
                      : isCurrent
                        ? 'border-[rgba(0,200,150,0.45)] bg-[rgba(15,33,51,0.86)] text-[#F8FAFC] shadow-2xl max-[768px]:bg-[rgba(15,33,51,0.78)]'
                        : 'border-[rgba(0,200,150,0.22)] bg-[rgba(15,33,51,0.82)] text-[#F8FAFC] max-[768px]:bg-[rgba(15,33,51,0.78)]'
                  }`}
                >
                  {/* Unboxed Editorial Metadata Header */}
                  <div
                    className={`flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums max-[768px]:text-[11px] ${
                      isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                      }`}
                    >
                      {product.index} / 05
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{product.category}</span>
                  </div>

                  {/* Product Headline */}
                  <h2 className="mt-3 font-display text-2xl sm:text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-balance max-[768px]:mt-1.5 max-[768px]:text-[20px] max-[768px]:leading-[1.15]">
                    {product.name}
                  </h2>

                  <p
                    className={`mt-2.5 text-sm font-medium leading-relaxed max-[768px]:mt-1.5 max-[768px]:text-[13px] max-[768px]:leading-snug max-[768px]:line-clamp-2 ${
                      isDay ? 'text-[#1E293B]' : 'text-[#E2E8F0]'
                    }`}
                  >
                    {product.tagline}
                  </p>

                  {/* Tactile Copy (Desktop only; accessible via Quick Specs drawer on mobile) */}
                  <p
                    className={`mt-3 text-sm leading-relaxed max-[768px]:hidden ${
                      isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}
                  >
                    {product.tactileHook}
                  </p>

                  {/* Compact Key Specs List (Collapsed on <=768px mobile cards so 3D product stays clear) */}
                  <dl
                    className={`mt-5 divide-y border-y font-mono text-[11px] max-[768px]:hidden ${
                      isDay
                        ? 'divide-[#0F2133]/10 border-[#0F2133]/10'
                        : 'divide-[rgba(0,200,150,0.16)] border-[rgba(0,200,150,0.16)]'
                    }`}
                  >
                    {product.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="flex items-baseline justify-between gap-3 py-2.5"
                      >
                        <dt className={isDay ? 'text-[#475569]' : 'text-[#94A3B8]'}>
                          {spec.label}
                        </dt>
                        <dd className="text-right font-medium tabular-nums">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Price, Merchant & Coordinates */}
                  <div className="mt-5 flex items-baseline justify-between gap-4 max-[768px]:mt-3">
                    <div>
                      <span
                        className={`font-mono text-xl font-semibold tabular-nums max-[768px]:text-lg ${
                          isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                        }`}
                      >
                        {product.priceFormatted}
                      </span>
                      <span
                        className={`ml-2 font-mono text-[11px] ${
                          isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                        }`}
                      >
                        via {product.merchant}
                      </span>
                    </div>
                    <span
                      className={`hidden sm:inline font-mono text-[10px] tabular-nums max-[768px]:hidden ${
                        isDay ? 'text-[#64748B]' : 'text-[#64748B]'
                      }`}
                    >
                      {product.coordinates}
                    </span>
                  </div>

                  {/* Primary Light-Sheen Affiliate CTA + Secondary Quick Specs */}
                  <div className="mt-5 flex flex-wrap items-center gap-2.5 max-[768px]:mt-3.5 max-[768px]:gap-2">
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      data-cursor="cta"
                      className="ak-sheen-btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#008B6B] px-4 py-2.5 text-sm font-semibold text-[#F8FAFC] whitespace-nowrap hover:bg-[#00C896] hover:text-[#08111A] max-[768px]:px-3.5 max-[768px]:py-2 max-[768px]:text-xs"
                    >
                      <span>Inspect &amp; Buy</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 max-[768px]:h-3.5 max-[768px]:w-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      data-cursor="cta"
                      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors max-[768px]:px-3 max-[768px]:py-2 max-[768px]:text-xs ${
                        isDay
                          ? 'border-[#0F2133]/18 text-[#0F2133] hover:border-[#008B6B]'
                          : 'border-[rgba(0,200,150,0.26)] text-[#F8FAFC] hover:border-[#00C896]'
                      }`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                      <span>Quick Specs</span>
                    </button>
                  </div>
                </article>
              </div>
            </section>
          );
        })}

        {/* ================================================================= */}
        {/* FOOTER & TRANSPARENT AFFILIATE DISCLOSURE                         */}
        {/* ================================================================= */}
        <footer
          data-ui-interactive="true"
          className={`pointer-events-auto relative border-t px-5 pt-14 pb-32 sm:px-10 lg:px-14 max-[768px]:pb-[96px] transition-colors duration-500 ${
            isDay
              ? 'border-[#0F2133]/12 bg-[#F8FAFC]/96 text-[#0F2133]'
              : 'border-[rgba(0,200,150,0.2)] bg-[#08111A]/96 text-[#F8FAFC]'
          }`}
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
              <div className="md:col-span-5 space-y-3.5">
                <DeskNestLogo atmosphere={atmosphere} variant="horizontal" size="md" />
                <p
                  className={`max-w-md text-sm leading-relaxed ${
                    isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                  }`}
                >
                  A curated architectural study of tactile productivity tools built from
                  solid walnut, CNC aluminum, and natural wool.
                </p>
              </div>

              <div className="md:col-span-4 space-y-2.5">
                <div
                  className={`font-mono text-xs ${
                    isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                  }`}
                >
                  Featured Hardware
                </div>
                <ul className="space-y-1.5 text-sm">
                  {PRODUCTS.map((p, idx) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => scrollToAct(idx + 1)}
                        className={`inline-flex items-baseline gap-2 transition-colors hover:text-[#00C896] ${
                          isDay ? 'text-[#0F2133]' : 'text-[#E2E8F0]'
                        }`}
                      >
                        <span
                          className={`font-mono text-xs tabular-nums ${
                            isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                          }`}
                        >
                          {p.index}
                        </span>
                        <span>{p.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-3 flex flex-col items-start md:items-end justify-between gap-4">
                <div className="md:text-right">
                  <div
                    className={`font-mono text-xs ${
                      isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}
                  >
                    Full Desk Estimate
                  </div>
                  <div
                    className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                      isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                    }`}
                  >
                    ${FULL_SETUP_TOTAL.toLocaleString()} USD
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFullSetupOpen(true)}
                  data-cursor="cta"
                  className="ak-sheen-btn inline-flex items-center gap-2 rounded-md bg-[#008B6B] px-4 py-2.5 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap hover:bg-[#00C896] hover:text-[#08111A]"
                >
                  <span>Shop Full Setup (5 Items)</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div
              className={`mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-6 text-xs leading-relaxed ${
                isDay
                  ? 'border-[#0F2133]/10 text-[#475569]'
                  : 'border-[rgba(0,200,150,0.16)] text-[#94A3B8]'
              }`}
            >
              <p className="max-w-2xl">
                Affiliate Disclosure: DeskNest participates in independent hardware affiliate
                programs. Links marked as partner links may earn a referral commission at no
                extra cost to you. Recommendations are strictly editorial.
              </p>
              <span className="font-mono tabular-nums whitespace-nowrap shrink-0">
                © 2026 <DeskNestWordmark atmosphere={atmosphere} />
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Persistent Bottom Contextual Conversion Dock */}
      <ConversionDock
        activeProduct={activeProduct}
        atmosphere={atmosphere}
        onInspectProduct={(p) => setSelectedProduct(p)}
        onOpenFullSetup={() => setFullSetupOpen(true)}
      />

      {/* Slide-Over Affiliate Spec Drawer */}
      <ProductDrawer
        product={selectedProduct}
        atmosphere={atmosphere}
        onClose={() => setSelectedProduct(null)}
        onFocusInScene={focusProductById}
      />

      {/* Full Setup Bento Grid Modal */}
      <FullSetupModal
        open={fullSetupOpen}
        atmosphere={atmosphere}
        onClose={() => setFullSetupOpen(false)}
        onInspectProduct={(p) => setSelectedProduct(p)}
        onFocusInScene={focusProductById}
      />
    </div>
  );
}
