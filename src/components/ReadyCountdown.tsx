import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StageBackdrop } from './StageBackdrop';
import { audioEngine } from '../lib/audioEngine';

interface Props {
  onDone: () => void;
  accent?: string;
}

const SEQUENCE = ['3', '2', '1', 'DANCE!'];

export function ReadyCountdown({ onDone, accent = '#b6ff3c' }: Props) {
  const [i, setI] = useState(0);

  useEffect(() => {
    audioEngine.playSfx('countdown');
    const id = window.setInterval(() => {
      setI((prev) => {
        const next = prev + 1;
        if (next >= SEQUENCE.length) {
          window.clearInterval(id);
          window.setTimeout(onDone, 300);
          return prev;
        }
        audioEngine.playSfx('countdown');
        return next;
      });
    }, 750);
    return () => window.clearInterval(id);
  }, [onDone]);

  const label = SEQUENCE[Math.min(i, SEQUENCE.length - 1)];
  const isGo = label === 'DANCE!';

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <StageBackdrop accent={accent} />
      <AnimatePresence mode="wait">
        <motion.div
          key={label}
          initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 2.2, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          className="relative z-20 font-display uppercase"
          style={{
            color: isGo ? accent : '#ffffff',
            fontSize: isGo ? 'clamp(3rem, 14vw, 9rem)' : 'clamp(5rem, 22vw, 14rem)',
            textShadow: `0 0 40px ${accent}`,
          }}
        >
          {label}
        </motion.div>
      </AnimatePresence>
      <p className="absolute bottom-24 z-20 text-sm uppercase tracking-[0.4em] text-white/50">
        Get ready to lock &amp; pop
      </p>
    </div>
  );
}
