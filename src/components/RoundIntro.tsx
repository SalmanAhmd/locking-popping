import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { RoundConfig } from '../types/game';
import { StageBackdrop } from './StageBackdrop';
import { audioEngine } from '../lib/audioEngine';

interface Props {
  config: RoundConfig;
  onDone: () => void;
}

export function RoundIntro({ config, onDone }: Props) {
  useEffect(() => {
    audioEngine.playSfx('round-start');
    const t = window.setTimeout(onDone, 2800);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <StageBackdrop accent={config.accent} intensity={1.1} />
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-20 px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-lg uppercase tracking-[0.6em] text-white/70"
        >
          Round {config.round} of 3
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, scale: 0.7, skewX: -8 }}
          animate={{ opacity: 1, scale: 1, skewX: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 18 }}
          className="graffiti mt-2 text-5xl sm:text-7xl md:text-8xl"
          style={{ filter: `drop-shadow(0 0 18px ${config.accent})` }}
        >
          {config.name}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mx-auto mt-4 max-w-xl text-sm uppercase tracking-widest text-white/70 sm:text-base"
        >
          {config.theme}
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mx-auto mt-6 h-1 w-48 rounded-full"
          style={{ background: config.accent, boxShadow: `0 0 20px ${config.accent}` }}
        />
      </motion.div>
    </div>
  );
}
