'use client';

import { AnimatePresence, motion } from 'motion/react';
import DeskNestLogo from './DeskNestLogo';

interface LoadingScreenProps {
  progress: number;
  visible: boolean;
}

export default function LoadingScreen({ progress, visible }: LoadingScreenProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="dn-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#08111A] text-[#F8FAFC] px-6"
          role="status"
          aria-live="polite"
          aria-label="Initializing DeskNest 3D desk showcase"
        >
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="mb-8">
              <DeskNestLogo atmosphere="night" variant="stacked" size="lg" />
            </div>

            <div className="w-full">
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-mono text-[11px] text-[#94A3B8]">
                  Calibrating 3D desk &amp; lighting
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-[#00C896]">
                  {String(clamped).padStart(2, '0')}%
                </span>
              </div>

              <div className="h-[2px] w-full bg-[#0F2133] overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#008B6B] to-[#00C896] origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: clamped / 100 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
