import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { FrameListener } from '../hooks/useRhythmEngine';

interface Props {
  playerName: string;
  aiName: string;
  aiSubtitle: string;
  playerScore: number;
  aiScore: number;
  playerCombo: number;
  aiCombo: number;
  round: number;
  totalRounds: number;
  roundName: string;
  songDuration: number;
  addFrameListener: (cb: FrameListener) => () => void;
  playerAccent: string;
  aiAccent: string;
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Arcade HUD: avatars, live score comparison, round + timer + combos. */
export function BattleHUD({
  playerName,
  aiName,
  aiSubtitle,
  playerScore,
  aiScore,
  playerCombo,
  aiCombo,
  round,
  totalRounds,
  roundName,
  songDuration,
  addFrameListener,
  playerAccent,
  aiAccent,
}: Props) {
  const timerRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const listener: FrameListener = (time) => {
      if (timerRef.current) {
        timerRef.current.textContent = formatTime(songDuration - time);
      }
      if (barRef.current) {
        const total = Math.max(1, playerScore + aiScore);
        barRef.current.style.width = `${(playerScore / total) * 100}%`;
      }
    };
    return addFrameListener(listener);
  }, [addFrameListener, songDuration, playerScore, aiScore]);

  return (
    <div className="relative z-30 w-full px-2 pt-2 sm:px-4">
      <div className="panel flex items-center gap-2 rounded-xl px-2 py-2 sm:gap-4 sm:px-4">
        {/* Player */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar label="YOU" accent={playerAccent} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-sm uppercase tracking-wide sm:text-lg">
                {playerName}
              </span>
              <ComboBadge combo={playerCombo} accent={playerAccent} />
            </div>
            <motion.div
              key={playerScore}
              initial={{ scale: 1.25, color: '#fff' }}
              animate={{ scale: 1, color: playerAccent }}
              transition={{ duration: 0.25 }}
              className="font-display text-xl leading-none sm:text-3xl"
            >
              {playerScore.toLocaleString()}
            </motion.div>
          </div>
        </div>

        {/* Center round / timer */}
        <div className="flex flex-col items-center px-1 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Round
          </span>
          <span className="font-display text-xl leading-none text-white sm:text-3xl">
            {round}
            <span className="text-white/40">/{totalRounds}</span>
          </span>
          <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-widest sm:block" style={{ color: playerAccent }}>
            {roundName}
          </span>
          <span
            ref={timerRef}
            className="mt-1 font-display text-base tabular-nums text-white/80 sm:text-xl"
          >
            0:00
          </span>
        </div>

        {/* AI */}
        <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2 text-right">
          <Avatar label="AI" accent={aiAccent} />
          <div className="min-w-0">
            <div className="flex flex-row-reverse items-center gap-2">
              <span
                className="truncate font-display text-sm uppercase tracking-wide sm:text-lg"
                style={{ color: aiAccent }}
              >
                {aiName}
              </span>
              <ComboBadge combo={aiCombo} accent={aiAccent} />
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              {aiSubtitle}
            </div>
            <motion.div
              key={aiScore}
              initial={{ scale: 1.25, color: '#fff' }}
              animate={{ scale: 1, color: aiAccent }}
              transition={{ duration: 0.25 }}
              className="font-display text-xl leading-none sm:text-3xl"
            >
              {aiScore.toLocaleString()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Score comparison bar */}
      <div className="mx-1 mt-1 h-1.5 overflow-hidden rounded-full bg-neon-pink/40">
        <div
          ref={barRef}
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: '50%', background: `linear-gradient(90deg, ${playerAccent}, #b6ff3c)` }}
        />
      </div>
    </div>
  );
}

function Avatar({ label, accent }: { label: string; accent: string }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 font-display text-[10px] sm:h-12 sm:w-12"
      style={{ borderColor: accent, color: accent, boxShadow: `0 0 14px ${accent}66` }}
    >
      {label}
    </div>
  );
}

function ComboBadge({ combo, accent }: { combo: number; accent: string }) {
  if (combo < 2) return null;
  return (
    <motion.span
      key={combo}
      initial={{ scale: 1.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
      style={{ background: accent, color: '#050507' }}
    >
      {combo}x
    </motion.span>
  );
}
