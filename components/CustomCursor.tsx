'use client';

import { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  hovered3DProduct: string | null;
}

export default function CustomCursor({ hovered3DProduct }: CustomCursorProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [pointerMode, setPointerMode] = useState<'default' | 'cta' | 'hotspot'>('default');

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    document.documentElement.classList.add('ak-custom-cursor-active');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let visible = false;
    let rafId = 0;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        currentX = targetX;
        currentY = targetY;
        if (ringRef.current) ringRef.current.style.opacity = '1';
        if (dotRef.current) dotRef.current.style.opacity = '1';
      }

      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-cursor="cta"]')) {
        setPointerMode('cta');
      } else if (target?.closest('[data-cursor="hotspot"]')) {
        setPointerMode('hotspot');
      } else if (target?.closest('a, button')) {
        setPointerMode('cta');
      } else {
        setPointerMode('default');
      }
    };

    const onLeave = () => {
      visible = false;
      if (ringRef.current) ringRef.current.style.opacity = '0';
      if (dotRef.current) dotRef.current.style.opacity = '0';
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.documentElement.classList.remove('ak-custom-cursor-active');
    };
  }, []);

  const effectiveMode = hovered3DProduct ? 'hotspot' : pointerMode;
  const isExpanded = effectiveMode !== 'default';

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 flex items-center justify-center rounded-full border transition-[width,height,border-color,background-color] duration-200 ease-out will-change-transform ${
          effectiveMode === 'hotspot'
            ? 'h-14 w-14 border-[#00C896] bg-[#00C896]/14'
            : effectiveMode === 'cta'
              ? 'h-11 w-11 border-[#00C896]/85 bg-[#008B6B]/12'
              : 'h-7 w-7 border-[#94A3B8]/50 bg-transparent'
        }`}
        style={{ opacity: 0 }}
      >
        {effectiveMode === 'hotspot' && (
          <span className="font-mono text-[9px] tracking-[0.14em] text-[#00C896] uppercase">
            Inspect
          </span>
        )}
      </div>
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,background-color] duration-150 will-change-transform ${
          isExpanded ? 'h-1.5 w-1.5 bg-[#00C896]' : 'h-1.5 w-1.5 bg-[#F8FAFC]'
        }`}
        style={{ opacity: 0 }}
      />
    </div>
  );
}
