'use client';

import type { AtmosphereMode } from '@/lib/deskScene';

interface DeskNestLogoProps {
  atmosphere?: AtmosphereMode;
  variant?: 'horizontal' | 'stacked';
  size?: 'sm' | 'md' | 'lg';
  showArc?: boolean;
}

export function DeskNestWordmark({
  atmosphere = 'night',
  className = '',
}: {
  atmosphere?: AtmosphereMode;
  className?: string;
}) {
  const isDay = atmosphere === 'day';
  return (
    <span className={`font-display font-bold tracking-tight whitespace-nowrap ${className}`}>
      <span className={isDay ? 'text-[#0F2133]' : 'text-[#F8FAFC]'}>Desk</span>
      <span className="text-[#008B6B]">Nest</span>
    </span>
  );
}

export default function DeskNestLogo({
  atmosphere = 'night',
  variant = 'horizontal',
  size = 'md',
  showArc = true,
}: DeskNestLogoProps) {
  const isDay = atmosphere === 'day';
  const primaryInk = isDay ? '#0F2133' : '#F8FAFC';
  const emerald = '#008B6B';

  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-14 w-14',
  };

  const textSizes = {
    sm: 'text-[17px]',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const arcWidths = {
    sm: 'w-[76px]',
    md: 'w-[92px]',
    lg: 'w-[138px]',
  };

  return (
    <span
      className={`inline-flex shrink-0 select-none ${
        variant === 'stacked'
          ? 'flex-col items-center gap-2.5'
          : 'flex-row items-center gap-2.5'
      }`}
    >
      {/* Crisp Inline SVG: Bold geometric "D" framing desk, laptop & two-leaf emerald plant */}
      <svg
        viewBox="0 0 120 112"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSizes[size]} shrink-0`}
        aria-hidden="true"
      >
        {/* Outer Bold Geometric "D" Frame (stops cleanly at left desk edge & bottom diagonal gap) */}
        <path
          d="M22 10H61C89.5 10 110 30.2 110 56C110 81.8 89.5 102 61 102H31.5L37.5 87.5H60.5C80.6 87.5 95.5 73.6 95.5 56C95.5 38.4 80.6 24.5 60.5 24.5H36V62.5H27.5C24.5 62.5 22 64.2 22 66.2V10Z"
          fill={primaryInk}
        />

        {/* Desk Tabletop */}
        <path
          d="M23.5 70.5C23.5 67.4 26 65 29 65H87.5C90.5 65 93 67.4 93 70.5V73.2H23.5V70.5Z"
          fill={primaryInk}
        />

        {/* Left Splayed Desk Leg */}
        <path d="M32.5 72.5H42L29 102H19.5L32.5 72.5Z" fill={primaryInk} />

        {/* Right Splayed Desk Leg */}
        <path d="M77.5 72.5H85.5L91 88.5L83 92L77.5 72.5Z" fill={primaryInk} />

        {/* Minimalist Laptop Silhouette with centered circular cutout */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M44.5 44C43.1 44 42.1 45.3 42.5 46.7L46.4 60.8H40.5C39.6 60.8 39 61.4 39 62.2C39 63 39.6 63.6 40.5 63.6H74.5C75.3 63.6 76 63 76 62.2C76 61.4 75.3 60.8 74.5 60.8H70.4L66.4 46.2C66.1 44.9 64.9 44 63.5 44H44.5ZM56.6 55.6C58.1 55.6 59.3 54.4 59.3 52.9C59.3 51.4 58.1 50.2 56.6 50.2C55.1 50.2 53.9 51.4 53.9 52.9C53.9 54.4 55.1 55.6 56.6 55.6Z"
          fill={primaryInk}
        />

        {/* Small Minimalist Plant Pot */}
        <path d="M76.5 54.2H88.5L86.8 63.6H78.2L76.5 54.2Z" fill={primaryInk} />

        {/* Plant Stem & Two Emerald-Green (#008B6B) Leaves */}
        <path
          d="M82.5 54.2V45.8"
          stroke={emerald}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M82.2 51.8C75.2 50.6 71.2 44.4 72.2 37.8C78.4 38.4 83.2 43.2 82.2 51.8Z"
          fill={emerald}
        />
        <path
          d="M82.8 51.8C89.8 50.6 93.8 44.4 92.8 37.8C86.6 38.4 81.8 43.2 82.8 51.8Z"
          fill={emerald}
        />
      </svg>

      {/* DeskNest Wordmark + Subtle Curved Emerald Arc */}
      <span
        className={`inline-flex flex-col ${
          variant === 'stacked' ? 'items-center' : 'items-start'
        }`}
      >
        <span className={`font-display font-bold leading-none tracking-[-0.02em] whitespace-nowrap ${textSizes[size]}`}>
          <span className={isDay ? 'text-[#0F2133]' : 'text-[#F8FAFC]'}>Desk</span>
          <span className="text-[#008B6B]">Nest</span>
        </span>
        {showArc && (
          <svg
            viewBox="0 0 120 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${arcWidths[size]} h-[6px] mt-0.5`}
            aria-hidden="true"
          >
            <path
              d="M4 8.5C36 1.2 84 1.2 116 8.5C84 4.2 36 4.2 4 8.5Z"
              fill={emerald}
            />
          </svg>
        )}
      </span>
    </span>
  );
}
