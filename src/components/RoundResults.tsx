import { motion } from 'framer-motion';
import type { RoundResult } from '../types/game';
import { StageBackdrop } from './StageBackdrop';
import { accuracyPercent } from '../lib/scoring';

interface Props {
  result: RoundResult;
  onContinue: () => void;
  isLast: boolean;
}

export function RoundResults({ result, onContinue, isLast }: Props) {
  const playerWon = result.playerScore >= result.aiScore;
  const accent = playerWon ? '#b6ff3c' : '#ff2d95';
  const pAcc = accuracyPercent(result.playerStats);
  const aAcc = accuracyPercent(result.aiStats);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <StageBackdrop accent={accent} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-full max-w-xl px-4 text-center"
      >
        <p className="font-display text-sm uppercase tracking-[0.5em] text-white/50">
          Round {result.round} Complete
        </p>
        <h2
          className="mt-1 font-display text-3xl uppercase sm:text-4xl"
          style={{ color: accent, textShadow: `0 0 24px ${accent}88` }}
        >
          {playerWon ? 'You take the round!' : 'GLITCH steals it!'}
        </h2>

        <div className="panel mt-6 grid grid-cols-2 gap-3 rounded-xl p-4">
          <div className="rounded-lg bg-neon-blue/10 p-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-neon-blue">You</div>
            <motion.div
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className="font-display text-3xl text-white"
            >
              {result.playerScore.toLocaleString()}
            </motion.div>
            <div className="text-[11px] uppercase tracking-widest text-white/50">
              {pAcc}% acc · {result.playerStats.maxCombo}x combo
            </div>
          </div>
          <div className="rounded-lg bg-neon-pink/10 p-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-neon-pink">GLITCH</div>
            <motion.div
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className="font-display text-3xl text-white"
            >
              {result.aiScore.toLocaleString()}
            </motion.div>
            <div className="text-[11px] uppercase tracking-widest text-white/50">
              {aAcc}% acc · {result.aiStats.maxCombo}x combo
            </div>
          </div>
        </div>

        {result.cleanFlowPlayer && (
          <p className="mt-3 font-display text-sm uppercase tracking-widest text-neon-green">
            ✦ Clean Flow Bonus — no misses!
          </p>
        )}

        <button onClick={onContinue} className="btn btn-neon mt-6 text-lg">
          {isLast ? 'See Final Results' : 'Next Round →'}
        </button>
      </motion.div>
    </div>
  );
}
