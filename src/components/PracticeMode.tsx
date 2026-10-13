import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MoveId } from '../types/game';
import { DANCE_MOVES, codeToLabel } from '../lib/danceMoves';
import { moveCodeMap } from '../lib/settings';
import { Dancer, type DancerHandle } from './Dancer';
import { StageBackdrop } from './StageBackdrop';
import { KeyHints } from './KeyHints';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { audioEngine } from '../lib/audioEngine';

interface Props {
  keymap: Record<string, MoveId>;
  reducedMotion: boolean;
  onBack: () => void;
}

const PRACTICE_BPM = 100;

export function PracticeMode({ keymap, reducedMotion, onBack }: Props) {
  const dancer = useRef<DancerHandle | null>(null);
  const [last, setLast] = useState<MoveId | null>(null);
  const [pressed, setPressed] = useState<MoveId | null>(null);
  const [count, setCount] = useState(0);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const codes = moveCodeMap(keymap);

  useEffect(() => {
    audioEngine.startSong(PRACTICE_BPM);
    let raf = 0;
    const loop = () => {
      const t = audioEngine.getSongTime();
      const beat = Math.floor(t / (60000 / PRACTICE_BPM));
      dots.current.forEach((d, i) => {
        if (!d) return;
        const on = ((beat % 4) + 4) % 4 === i;
        d.style.opacity = on ? '1' : '0.25';
        d.style.transform = on ? 'scale(1.5)' : 'scale(1)';
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      audioEngine.stopSong();
    };
  }, []);

  useKeyboardControls({
    enabled: true,
    keymap,
    onMove: (move) => {
      dancer.current?.playMove(move, 'perfect');
      audioEngine.playSfx('pop-hit');
      setLast(move);
      setCount((c) => c + 1);
      setPressed(move);
      window.setTimeout(() => setPressed((p) => (p === move ? null : p)), 130);
    },
    onEscape: onBack,
  });

  const def = last ? DANCE_MOVES[last] : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <StageBackdrop accent="#b6ff3c" />
      <div className="relative z-20 flex h-full flex-col items-center px-4 py-6">
        <div className="flex w-full max-w-3xl items-center justify-between">
          <h1 className="graffiti text-4xl sm:text-5xl">Practice</h1>
          <button onClick={onBack} className="btn btn-ghost text-sm">
            ← Back
          </button>
        </div>

        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/45">
          Free-play — press any key to hit the move
        </p>

        <div className="relative mt-2 h-[34vh] max-h-[300px] w-full max-w-[260px]">
          <Dancer
            ref={dancer}
            colors={{ primary: '#b6ff3c', secondary: '#22d3ee', glow: '#b6ff3c' }}
            beatDuration={60000 / PRACTICE_BPM}
            reducedMotion={reducedMotion}
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                ref={(el) => (dots.current[i] = el)}
                className="block h-2.5 w-2.5 rounded-full bg-neon-green transition-transform"
                style={{ boxShadow: '0 0 10px #b6ff3c' }}
              />
            ))}
          </div>
          <span className="hud-chip text-white/70">Moves: {count}</span>
        </div>

        <div className="mt-4 h-12">
          {def && (
            <motion.div
              key={count}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl">{def.icon}</span>
              <span className="font-display text-3xl uppercase" style={{ color: def.color }}>
                {def.name}
              </span>
            </motion.div>
          )}
        </div>

        <div className="mt-auto w-full max-w-4xl pb-2">
          <KeyHints keymap={keymap} activeMove={last} pressedMove={pressed} />
        </div>
      </div>
    </div>
  );
}
