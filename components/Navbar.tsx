'use client';

import { Moon, Sun } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import type { AtmosphereMode } from '@/lib/deskScene';
import DeskNestLogo from './DeskNestLogo';

interface NavbarProps {
  activeAct: number;
  atmosphere: AtmosphereMode;
  onToggleAtmosphere: () => void;
  onJumpToAct: (actIndex: number) => void;
}

export default function Navbar({
  activeAct,
  atmosphere,
  onToggleAtmosphere,
  onJumpToAct,
}: NavbarProps) {
  const isDay = atmosphere === 'day';

  return (
    <header
      data-ui-interactive="true"
      className={`fixed top-0 inset-x-0 z-40 border-b transition-colors duration-500 ${
        isDay
          ? 'bg-[#F8FAFC]/92 border-[#0F2133]/12 text-[#0F2133]'
          : 'bg-[#08111A]/90 border-[rgba(0,200,150,0.22)] text-[#F8FAFC]'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-8">
        {/* Zone 1: DeskNest Brand Logo & Wordmark */}
        <button
          type="button"
          onClick={() => onJumpToAct(0)}
          aria-label="DeskNest — Return to top"
          className="inline-flex items-center whitespace-nowrap shrink-0 transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00C896]"
        >
          <DeskNestLogo atmosphere={atmosphere} variant="horizontal" size="sm" />
        </button>

        {/* Zone 2: 5 Single-Line Navigation Jump Links */}
        <nav
          aria-label="Desk setup products"
          className="hidden lg:flex items-center gap-7 text-[13px] font-medium"
        >
          {PRODUCTS.map((product, idx) => {
            const actNumber = idx + 1;
            const isActive = activeAct === actNumber;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onJumpToAct(actNumber)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00C896] ${
                  isActive
                    ? isDay
                      ? 'text-[#0F2133]'
                      : 'text-[#F8FAFC]'
                    : isDay
                      ? 'text-[#475569] hover:text-[#0F2133]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {product.shortNavLabel}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-[#008B6B] transition-transform duration-300 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Day / Night Atmosphere Toggle */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleAtmosphere}
            data-cursor="cta"
            aria-label={`Switch lighting atmosphere to ${isDay ? 'Deep Focus Night' : 'Studio Daylight'}`}
            className={`inline-flex items-center gap-2.5 rounded-md border px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C896] ${
              isDay
                ? 'border-[#0F2133]/16 bg-white text-[#0F2133] hover:border-[#008B6B]'
                : 'border-[rgba(0,200,150,0.22)] bg-[rgba(15,33,51,0.82)] text-[#F8FAFC] hover:border-[#00C896]'
            }`}
          >
            {isDay ? (
              <Sun className="h-3.5 w-3.5 text-[#008B6B] shrink-0" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-[#00C896] shrink-0" />
            )}
            <span>{isDay ? 'Studio Daylight' : 'Deep Focus Night'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
