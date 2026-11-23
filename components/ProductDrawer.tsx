'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, Minus, X } from 'lucide-react';
import type { DeskProduct } from '@/lib/products';
import type { AtmosphereMode } from '@/lib/deskScene';

interface ProductDrawerProps {
  product: DeskProduct | null;
  atmosphere: AtmosphereMode;
  onClose: () => void;
  onFocusInScene: (productId: string) => void;
}

export default function ProductDrawer({
  product,
  atmosphere,
  onClose,
  onFocusInScene,
}: ProductDrawerProps) {
  const isDay = atmosphere === 'day';

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <div
          data-ui-interactive="true"
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-product-title"
        >
          {/* Scrim */}
          <motion.button
            type="button"
            aria-label="Close product specification drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className={`absolute inset-0 ${
              isDay ? 'bg-[#0F2133]/35' : 'bg-[#04090F]/70'
            }`}
          />

          {/* Slide-over Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 flex h-full w-full max-w-[490px] flex-col border-l shadow-2xl ${
              isDay
                ? 'border-[#0F2133]/14 bg-[#F8FAFC] text-[#0F2133]'
                : 'border-[rgba(0,200,150,0.22)] bg-[rgba(15,33,51,0.95)] text-[#F8FAFC]'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-start justify-between gap-4 border-b px-6 py-5 ${
                isDay ? 'border-[#0F2133]/10' : 'border-[rgba(0,200,150,0.18)]'
              }`}
            >
              <div className="min-w-0">
                <div
                  className={`flex items-center gap-2 font-mono text-xs tabular-nums ${
                    isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                  }`}
                >
                  <span className="text-[#00C896]">{product.index}</span>
                  <span aria-hidden="true">·</span>
                  <span>{product.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{product.merchant}</span>
                </div>
                <h2
                  id="drawer-product-title"
                  className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight text-balance"
                >
                  {product.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  isDay
                    ? 'border-[#0F2133]/14 text-[#475569] hover:border-[#008B6B] hover:text-[#0F2133]'
                    : 'border-[rgba(0,200,150,0.22)] text-[#94A3B8] hover:border-[#00C896] hover:text-[#F8FAFC]'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
              {/* Price & Dimensions Strip */}
              <div
                className={`flex items-baseline justify-between border-b pb-5 ${
                  isDay ? 'border-[#0F2133]/10' : 'border-[rgba(0,200,150,0.16)]'
                }`}
              >
                <div>
                  <div
                    className={`font-mono text-[11px] ${
                      isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}
                  >
                    Estimated Studio Retail
                  </div>
                  <div
                    className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                      isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                    }`}
                  >
                    {product.priceFormatted}{' '}
                    <span
                      className={`text-xs font-normal ${
                        isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                      }`}
                    >
                      USD
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs tabular-nums">
                  <div className={isDay ? 'text-[#475569]' : 'text-[#94A3B8]'}>
                    {product.dimensions}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onFocusInScene(product.id);
                      onClose();
                    }}
                    className={`mt-1 hover:underline ${
                      isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                    }`}
                  >
                    Frame in 3D Scene
                  </button>
                </div>
              </div>

              {/* Tactile Hook & Friction Removed */}
              <div className="space-y-4">
                <div>
                  <h3
                    className={`font-mono text-[11px] tracking-wide ${
                      isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}
                  >
                    Tactile Impression
                  </h3>
                  <p
                    className={`mt-1.5 text-[15px] leading-relaxed ${
                      isDay ? 'text-[#0F2133]' : 'text-[#F8FAFC]'
                    }`}
                  >
                    {product.tactileHook}
                  </p>
                </div>

                <div>
                  <h3
                    className={`font-mono text-[11px] tracking-wide ${
                      isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}
                  >
                    Friction Removed
                  </h3>
                  <p
                    className={`mt-1.5 text-sm leading-relaxed ${
                      isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}
                  >
                    {product.frictionRemoved}
                  </p>
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h3
                  className={`font-mono text-[11px] tracking-wide mb-3 ${
                    isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                  }`}
                >
                  Key Specifications
                </h3>
                <dl
                  className={`divide-y border-y ${
                    isDay
                      ? 'divide-[#0F2133]/10 border-[#0F2133]/10'
                      : 'divide-[rgba(0,200,150,0.16)] border-[rgba(0,200,150,0.16)]'
                  }`}
                >
                  {product.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-baseline justify-between gap-4 py-3 text-sm"
                    >
                      <dt className={isDay ? 'text-[#475569]' : 'text-[#94A3B8]'}>
                        {spec.label}
                      </dt>
                      <dd className="text-right font-mono text-xs tabular-nums font-medium">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Honest Verdict: Best For / Skip If */}
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-sm font-semibold">Best For</h3>
                  <ul className="mt-2.5 space-y-2">
                    {product.honestVerdict.bestFor.map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-2.5 text-sm leading-relaxed ${
                          isDay ? 'text-[#1E293B]' : 'text-[#E2E8F0]'
                        }`}
                      >
                        <Check
                          className={`mt-1 h-3.5 w-3.5 shrink-0 ${
                            isDay ? 'text-[#008B6B]' : 'text-[#00C896]'
                          }`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-sm font-semibold">Skip If</h3>
                  <ul className="mt-2.5 space-y-2">
                    {product.honestVerdict.skipIf.map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-2.5 text-sm leading-relaxed ${
                          isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                        }`}
                      >
                        <Minus className="mt-1 h-3.5 w-3.5 shrink-0 text-[#64748B]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Sticky Drawer CTA Footer */}
            <div
              className={`border-t px-6 py-5 space-y-3 ${
                isDay
                  ? 'border-[#0F2133]/10 bg-white'
                  : 'border-[rgba(0,200,150,0.18)] bg-[#08111A]'
              }`}
            >
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                data-cursor="cta"
                className="ak-sheen-btn flex w-full items-center justify-center gap-2 rounded-md bg-[#008B6B] px-5 py-3 text-sm font-semibold text-[#F8FAFC] hover:bg-[#00C896] hover:text-[#08111A] active:scale-[0.99] whitespace-nowrap"
              >
                <span>
                  Inspect &amp; Acquire at {product.merchant} · {product.priceFormatted}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </a>

              <p
                className={`text-[11px] leading-relaxed ${
                  isDay ? 'text-[#475569]' : 'text-[#94A3B8]'
                }`}
              >
                Affiliate disclosure: DeskNest may earn a commission on purchases made
                through partner links at no additional cost to you. Every piece is independently
                selected for material longevity.
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
