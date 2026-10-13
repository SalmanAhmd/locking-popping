import { motion } from 'framer-motion';
import type { RoundResult } from '../types/game';
import { accuracyPercent, gradeLetter } from '../lib/scoring';
import { StageBackdrop } from './StageBackdrop';

interface Props {
  rounds: RoundResult[];
  onReplay: () => void;
  onMenu: () => void;
}

export function ResultsScreen({ rounds, onReplay, onMenu }: Props) {
  const playerTotal = rounds.reduce((s, r) => s + r.playerScore, 0);
  const aiTotal = rounds.reduce((s, r) => s + r.aiScore, 0);
  const outcome = playerTotal > aiTotal ? 'victory' : playerTotal < aiTotal ? 'defeat' : 'draw';

  const agg = rounds.reduce(
    (acc, r) => {
      acc.perfect += r.playerStats.perfect;
      acc.great += r.playerStats.great;
      acc.good += r.playerStats.good;
      acc.miss += r.playerStats.miss;
      acc.maxCombo = Math.max(acc.maxCombo, r.playerStats.maxCombo);
      acc.hits += r.playerStats.hits;
      acc.total += r.playerStats.totalNotes;
      acc.accWeighted += r.playerStats.perfect + r.playerStats.great * 0.8 + r.playerStats.good * 0.55;
      return acc;
    },
    { perfect: 0, great: 0, good: 0, miss: 0, maxCombo: 0, hits: 0, total: 0, accWeighted: 0 },
  );

  const accuracy = agg.total > 0 ? agg.accWeighted / agg.total : 0;
  const pct = Math.round(accuracy * 100);
  const grade = gradeLetter(accuracy);

  const headline =
    outcome === 'victory'
      ? 'VICTORY — YOU OWN THE FLOOR!'
      : outcome === 'defeat'
        ? 'DEFEAT — THE OPPONENT TAKES THE CROWN!'
        : 'DRAW — BOTH DANCERS ARE LEGENDS!';

  const accent = outcome === 'victory' ? '#b6ff3c' : outcome === 'defeat' ? '#ff2d95' : '#a855f7';
  const emblem = outcome === 'victory' ? '🏆' : outcome === 'defeat' ? '👑' : '🤝';

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <StageBackdrop accent={accent} intensity={1.2} />
      <div className="relative z-20 mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          className="text-6xl sm:text-7xl"
          style={{ filter: `drop-shadow(0 0 20px ${accent})` }}
        >
          {emblem}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-3 text-center font-display text-3xl uppercase leading-tight tracking-wide sm:text-5xl"
          style={{ color: accent, textShadow: `0 0 24px ${accent}88` }}
        >
          {headline}
        </motion.h1>

        {/* Final score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel mt-6 grid w-full grid-cols-3 items-center gap-2 rounded-xl p-4 text-center"
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50">You</div>
            <div className="font-display text-3xl text-neon-blue sm:text-4xl">
              {playerTotal.toLocaleString()}
            </div>
          </div>
          <div className="font-display text-xl text-white/40">VS</div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50">GLITCH</div>
            <div className="font-display text-3xl text-neon-pink sm:text-4xl">
              {aiTotal.toLocaleString()}
            </div>
          </div>
        </motion.div>

        {/* Grade + stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <Stat label="Grade" value={grade} accent={accent} big />
          <Stat label="Accuracy" value={`${pct}%`} />
          <Stat label="Best Combo" value={`${agg.maxCombo}x`} />
          <Stat label="Perfect Hits" value={`${agg.perfect}`} />
          <Stat label="Great" value={`${agg.great}`} />
          <Stat label="Good" value={`${agg.good}`} />
          <Stat label="Misses" value={`${agg.miss}`} />
          <Stat label="Successful" value={`${agg.hits}/${agg.total}`} />
        </motion.div>

        {/* Round breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="panel mt-4 w-full overflow-hidden rounded-xl"
        >
          <div className="grid grid-cols-4 border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/50">
            <span>Round</span>
            <span className="text-right">You</span>
            <span className="text-right">GLITCH</span>
            <span className="text-right">Result</span>
          </div>
          {rounds.map((r) => {
            const won = r.playerScore > r.aiScore;
            const tied = r.playerScore === r.aiScore;
            return (
              <div
                key={r.round}
                className="grid grid-cols-4 items-center px-4 py-2 text-sm odd:bg-white/[0.02]"
              >
                <span className="font-display uppercase text-white/80">
                  {r.round}. {r.round === 1 ? 'Foundation' : r.round === 2 ? 'Technical' : 'Showdown'}
                </span>
                <span className="text-right font-display text-neon-blue">
                  {r.playerScore.toLocaleString()}
                </span>
                <span className="text-right font-display text-neon-pink">
                  {r.aiScore.toLocaleString()}
                </span>
                <span
                  className="text-right text-xs font-bold uppercase"
                  style={{ color: tied ? '#a855f7' : won ? '#b6ff3c' : '#ff2d95' }}
                >
                  {tied ? 'Draw' : won ? 'Win' : 'Loss'}
                </span>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <button onClick={onReplay} className="btn btn-neon text-lg">
            ↻ Replay Battle
          </button>
          <button onClick={onMenu} className="btn btn-ghost">
            Main Menu
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value: string;
  accent?: string;
  big?: boolean;
}) {
  return (
    <div className="panel rounded-lg px-3 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/45">{label}</div>
      <div
        className={`font-display ${big ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
