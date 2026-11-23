'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Crosshair, X } from 'lucide-react';
import { FULL_SETUP_TOTAL, PRODUCTS, type DeskProduct } from '@/lib/products';
import type { AtmosphereMode } from '@/lib/deskScene';
import { DeskNestWordmark } from './DeskNestLogo';

interface FullSetupModalProps {
  open: boolean;
  atmosphere: AtmosphereMode;
  onClose: () => void;
  onInspectProduct: (product: DeskProduct) => void;
  onFocusInScene: (productId: string) => void;
}

export default function FullSetupModal({
  open,
  atmosphere,
  onClose,
  onInspectProduct,
  onFocusInScene,
}: FullSetupModalProps) {
  const isDay = atmosphere === 'day';

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          data-ui-interactive="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bento-modal-title"
        >
          {/* Scrim */}
          <motion.button
            type="button"
            aria-label="Close full desk setup modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`absolute inset-0 ${isDay ? 'bg-[#0F2133]/40' : 'bg-[#04090F]/78'}`}
          />

          {/* Bento Modal Surface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 flex max-h-[88vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-xl border shadow-2xl ${
              isDay
                ? 'border-[#0F2133]/14 bg-[#F8FAFC] text-[#0F2133]'
                : 'border-[rgba(0,200,150,0.22)] bg-[#08111A] text-[#F8FAFC]'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-start justify-between gap-4 border-b px-6 py-5 ${
                isDay ? 'border-[#0F2133]/10' : 'border-[rgba(0,200,150,0.18)]'
              }`}
            >
              <div>
                <div
                  className={`flex items-center gap-2 font-mono text-xs tabular-nums ${
                    isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                  }`}
                >
                  <span className={isDay ? 'text-[#008B6B]' : 'text-[#00C896]'}>
                    Complete Desk Architecture
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>5 Precision Components</span>
                </div>
                <h2
                  id="bento-modal-title"
                  className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold tracking-tight"
                >
                  Shop the Full <DeskNestWordmark atmosphere={atmosphere} /> Setup
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  isDay
                    ? 'border-[#0F2133]/14 text-[#475569] hover:border-[#008B6B] hover:text-[#0F2133]'
                    : 'border-[rgba(0,200,150,0.22)] text-[#94A3B8] hover:border-[#00C896] hover:text-[#F8FAFC]'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Bento Grid Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {PRODUCTS.map((product, idx) => {
                  const colSpan =
                    idx === 1
                      ? 'md:col-span-4'
                      : idx === 0
                        ? 'md:col-span-2'
                        : 'md:col-span-2';

                  return (
                    <article
                      key={product.id}
                      className={`${colSpan} flex flex-col justify-between rounded-lg border p-5 transition-colors ${
                        isDay
                          ? 'border-[#0F2133]/12 bg-white hover:border-[#008B6B]'
                          : 'border-[rgba(0,200,150,0.2)] bg-[rgba(15,33,51,0.82)] hover:border-[#00C896]'
                      }`}
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <div
                            className={`flex items-center gap-1.5 font-mono text-[11px] tabular-nums ${
                              isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                            }`}
                          >
                            <span className={isDay ? 'text-[#008B6B]' : 'text-[#00C896]'}>
                              {product.index}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{product.category}</span>
                          </div>
                          <span
                            className={`font-mono text-sm font-semibold tabular-nums shrink-0 ${
                              isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                            }`}
                          >
                            {product.priceFormatted}
                          </span>
                        </div>

                        <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug">
                          {product.name}
                        </h3>
                        <p
                          className={`mt-1.5 text-xs leading-relaxed ${
                            isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                          }`}
                        >
                          {product.tagline}
                        </p>

                        <ul
                          className={`mt-4 space-y-1.5 border-t pt-3 font-mono text-[11px] ${
                            isDay
                              ? 'border-[#0F2133]/10 text-[#475569]'
                              : 'border-[rgba(0,200,150,0.14)] text-[#94A3B8]'
                          }`}
                        >
                          {product.specs.map((spec) => (
                            <li
                              key={spec.label}
                              className="flex items-baseline justify-between gap-2"
                            >
                              <span className="opacity-75">{spec.label}</span>
                              <span className="text-right font-medium tabular-nums">
                                {spec.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 flex items-center gap-2 pt-2">
                        <a
                          href={product.affiliateUrl}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          data-cursor="cta"
                          className="ak-sheen-btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#008B6B] px-3 py-2 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap hover:bg-[#00C896] hover:text-[#08111A]"
                        >
                          <span>Buy at {product.merchant.split(' ')[0]}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onInspectProduct(product);
                          }}
                          className={`inline-flex items-center justify-center rounded-md border px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                            isDay
                              ? 'border-[#0F2133]/14 text-[#0F2133] hover:border-[#008B6B]'
                              : 'border-[rgba(0,200,150,0.22)] text-[#F8FAFC] hover:border-[#00C896]'
                          }`}
                        >
                          Specs
                        </button>

                        <button
                          type="button"
                          title={`Frame ${product.shortNavLabel} in 3D`}
                          aria-label={`Frame ${product.name} in 3D`}
                          onClick={() => {
                            onClose();
                            onFocusInScene(product.id);
                          }}
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isDay
                              ? 'border-[#0F2133]/14 text-[#475569] hover:border-[#008B6B] hover:text-[#0F2133]'
                              : 'border-[rgba(0,200,150,0.22)] text-[#94A3B8] hover:border-[#00C896] hover:text-[#F8FAFC]'
                          }`}
                        >
                          <Crosshair className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Footer Total Estimate & Affiliate Disclosure */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t px-6 py-4 ${
                isDay
                  ? 'border-[#0F2133]/10 bg-white'
                  : 'border-[rgba(0,200,150,0.18)] bg-[#060E16]'
              }`}
            >
              <p
                className={`max-w-xl text-[11px] leading-relaxed ${
                  isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                }`}
              >
                Transparent Affiliate Disclosure: Clicking any DeskNest partner link directs
                you to authorized merchants with UTM attribution. We may earn a commission at
                zero extra cost to you.
              </p>

              <div className="flex items-baseline gap-3 shrink-0">
                <span
                  className={`font-mono text-xs ${
                    isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                  }`}
                >
                  Total Setup Estimate
                </span>
                <span
                  className={`font-mono text-xl font-semibold tabular-nums ${
                    isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                  }`}
                >
                  ${FULL_SETUP_TOTAL.toLocaleString()} USD
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
