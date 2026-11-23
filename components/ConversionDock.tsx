'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import { FULL_SETUP_TOTAL, type DeskProduct } from '@/lib/products';
import type { AtmosphereMode } from '@/lib/deskScene';
import { DeskNestWordmark } from './DeskNestLogo';

interface ConversionDockProps {
  activeProduct: DeskProduct | null;
  atmosphere: AtmosphereMode;
  onInspectProduct: (product: DeskProduct) => void;
  onOpenFullSetup: () => void;
}

export default function ConversionDock({
  activeProduct,
  atmosphere,
  onInspectProduct,
  onOpenFullSetup,
}: ConversionDockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isDay = atmosphere === 'day';

  return (
    <>
      {/* ===================================================================== */}
      {/* DESKTOP (> 768px) CONTEXTUAL CONVERSION DOCK                          */}
      {/* ===================================================================== */}
      <div
        data-ui-interactive="true"
        className="hidden min-[769px]:flex fixed bottom-4 left-1/2 z-40 w-[min(780px,calc(100vw-24px))] -translate-x-1/2 flex-col items-center pointer-events-none"
      >
        {/* Compact Collapse / Expand Tab */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={
            collapsed
              ? 'Show contextual conversion dock'
              : 'Hide contextual conversion dock'
          }
          className={`pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px] tracking-wide whitespace-nowrap transition-colors ${
            isDay
              ? 'border-[#0F2133]/14 bg-[#F8FAFC]/95 text-[#475569] hover:text-[#0F2133]'
              : 'border-[rgba(0,200,150,0.22)] bg-[rgba(15,33,51,0.88)] text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          {collapsed ? (
            <>
              <ChevronUp className="h-3 w-3" />
              <span>Show Dock</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              <span>Hide Dock</span>
            </>
          )}
        </button>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="conversion-dock-bar"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto w-full rounded-lg border px-4 py-2.5 shadow-xl transition-colors duration-500 ${
                isDay
                  ? 'border-[#0F2133]/14 bg-[#F8FAFC]/96 text-[#0F2133]'
                  : 'border-[rgba(0,200,150,0.22)] bg-[rgba(15,33,51,0.86)] text-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Currently Framed Product Summary */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                      isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                    }`}
                  >
                    {activeProduct ? activeProduct.index : '00'}
                  </span>

                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-semibold leading-tight">
                      {activeProduct ? (
                        activeProduct.name
                      ) : (
                        <>
                          Complete <DeskNestWordmark atmosphere={atmosphere} /> Setup
                        </>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2 font-mono text-[11px] tabular-nums ${
                        isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                      }`}
                    >
                      <span>
                        {activeProduct
                          ? activeProduct.merchant
                          : '5 Curated Studio Instruments'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-medium ${
                          isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                        }`}
                      >
                        {activeProduct
                          ? activeProduct.priceFormatted
                          : `$${FULL_SETUP_TOTAL.toLocaleString()} est.`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Direct Affiliate CTA + Full Setup Bento Trigger */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeProduct ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onInspectProduct(activeProduct)}
                        className={`inline-flex items-center rounded-md border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                          isDay
                            ? 'border-[#0F2133]/16 text-[#0F2133] hover:border-[#008B6B]'
                            : 'border-[rgba(0,200,150,0.24)] text-[#F8FAFC] hover:border-[#00C896]'
                        }`}
                      >
                        Specs
                      </button>
                      <a
                        href={activeProduct.affiliateUrl}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        data-cursor="cta"
                        className="ak-sheen-btn inline-flex items-center gap-1.5 rounded-md bg-[#008B6B] px-3.5 py-2 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap shrink-0 hover:bg-[#00C896] hover:text-[#08111A]"
                      >
                        <span>Buy {activeProduct.priceFormatted}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </>
                  ) : null}

                  <button
                    type="button"
                    onClick={onOpenFullSetup}
                    data-cursor="cta"
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      !activeProduct
                        ? 'ak-sheen-btn border-[#008B6B] bg-[#008B6B] text-[#F8FAFC] font-semibold hover:border-[#00C896] hover:bg-[#00C896] hover:text-[#08111A]'
                        : isDay
                          ? 'border-[#0F2133]/16 bg-white text-[#0F2133] hover:border-[#008B6B]'
                          : 'border-[rgba(0,200,150,0.22)] bg-[#08111A]/80 text-[#F8FAFC] hover:border-[#00C896]'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                    <span>Shop Full Setup (5 Items)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================================================================== */}
      {/* MOBILE (<= 768px) COMPACT SINGLE-BAR BOTTOM DOCK (NO HIDE PILL)       */}
      {/* ===================================================================== */}
      <div
        data-ui-interactive="true"
        className="flex min-[769px]:hidden fixed bottom-3 left-1/2 z-40 w-[calc(100vw-20px)] max-w-[520px] -translate-x-1/2"
      >
        <div
          className={`flex h-[56px] w-full items-center justify-between gap-2.5 rounded-xl border px-3 py-2 shadow-xl backdrop-blur-[12px] transition-colors duration-500 ${
            isDay
              ? 'border-[#0F2133]/14 bg-[#F8FAFC]/88 text-[#0F2133]'
              : 'border-[rgba(0,200,150,0.22)] bg-[rgba(15,33,51,0.82)] text-[#F8FAFC]'
          }`}
        >
          {/* Left: Product Short Name + Price Stacked Tightly */}
          <button
            type="button"
            onClick={() => {
              if (activeProduct) {
                onInspectProduct(activeProduct);
              } else {
                onOpenFullSetup();
              }
            }}
            className="flex min-w-0 flex-col items-start justify-center text-left leading-tight"
          >
            <span className="font-display text-[13px] font-semibold whitespace-nowrap">
              {activeProduct ? (
                activeProduct.shortNavLabel
              ) : (
                <DeskNestWordmark atmosphere={atmosphere} />
              )}
            </span>
            <span
              className={`font-mono text-[11px] font-medium tabular-nums whitespace-nowrap ${
                isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
              }`}
            >
              {activeProduct
                ? activeProduct.priceFormatted
                : `$${FULL_SETUP_TOTAL.toLocaleString()} · 5 items`}
            </span>
          </button>

          {/* Right: Compact Buy ↗ + Compact Setup (5) Button */}
          <div className="flex items-center gap-2 shrink-0">
            {activeProduct ? (
              <a
                href={activeProduct.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="ak-sheen-btn inline-flex h-9 items-center gap-1 rounded-lg bg-[#008B6B] px-3 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap shrink-0 hover:bg-[#00C896] hover:text-[#08111A] active:scale-[0.98]"
              >
                <span>Buy</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenFullSetup}
                className="ak-sheen-btn inline-flex h-9 items-center gap-1 rounded-lg bg-[#008B6B] px-3 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap shrink-0 hover:bg-[#00C896] hover:text-[#08111A] active:scale-[0.98]"
              >
                <span>Buy</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenFullSetup}
              aria-label="Shop Full Setup (5 Items)"
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isDay
                  ? 'border-[#0F2133]/16 bg-white/85 text-[#0F2133]'
                  : 'border-[rgba(0,200,150,0.22)] bg-[#08111A]/65 text-[#F8FAFC]'
              }`}
            >
              <LayoutGrid
                className={`h-3.5 w-3.5 shrink-0 ${
                  isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                }`}
              />
              <span>Setup (5)</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
