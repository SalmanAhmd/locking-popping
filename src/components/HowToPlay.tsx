import { motion } from 'framer-motion';
import type { MoveId } from '../types/game';
import { StageBackdrop } from './StageBackdrop';
import { KeyHints } from './KeyHints';

interface Props {
  keymap: Record<string, MoveId>;
  onBack: () => void;
  onPractice: () => void;
}

const GRADES = [
  { grade: 'PERFECT', window: '±80ms', points: '100 + 20', color: '#b6ff3c' },
  { grade: 'GREAT', window: '±160ms', points: '70 + 10', color: '#22d3ee' },
  { grade: 'GOOD', window: '±260ms', points: '40', color: '#a855f7' },
  { grade: 'MISS', window: 'outside / wrong key', points: '0', color: '#ff2d95' },
];

const ROUNDS = [
  { n: 1, name: 'Foundation', desc: 'Basic moves: Isolation, Waving, Lock, Pop. Generous timing.' },
  { n: 2, name: 'Technical Flow', desc: 'Tutting, Grabbing, Robot, Body Wave & combos. Faster prompts.' },
  { n: 3, name: 'Final Showdown', desc: 'Full library, freestyle finale, expert AI. Survive the machine.' },
];

export function HowToPlay({ keymap, onBack, onPractice }: Props) {
  return (
    <div className="relative h-full w-full overflow-y-auto">
      <StageBackdrop accent="#a855f7" />
      <div className="relative z-20 mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="graffiti text-4xl sm:text-5xl">How to Play</h1>
          <button onClick={onBack} className="btn btn-ghost text-sm">
            ← Back
          </button>
        </div>

        <div className="panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-xl uppercase text-neon-blue">The Battle</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            You dance against <span className="text-neon-pink">GLITCH</span> across exactly{' '}
            <span className="text-neon-green">3 rounds</span>. Moves slide toward the hit line — press
            the matching key <em>on the beat</em>. Nail the timing, chain combos, and out-score your
            rival. Highest total after Round 3 owns the floor.
          </p>
          <button onClick={onPractice} className="btn btn-neon mt-4 text-sm">
            ▶ Practice the Moves
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel mt-4 rounded-xl p-5"
        >
          <h2 className="font-display text-xl uppercase text-neon-purple">Timing Grades</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {GRADES.map((g) => (
              <div
                key={g.grade}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
                style={{ borderColor: `${g.color}55`, background: `${g.color}12` }}
              >
                <span className="font-display text-lg" style={{ color: g.color }}>
                  {g.grade}
                </span>
                <span className="text-right text-xs uppercase tracking-widest text-white/55">
                  {g.window}
                  <br />
                  <span className="text-white/40">{g.points} pts</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs uppercase tracking-widest text-white/45">
            Combo multiplier rises 5% per consecutive hit (max 2.0x). Clean rounds earn a bonus.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel mt-4 rounded-xl p-5"
        >
          <h2 className="font-display text-xl uppercase text-neon-blue">The Three Rounds</h2>
          <div className="mt-3 space-y-2">
            {ROUNDS.map((r) => (
              <div key={r.n} className="flex gap-3 rounded-lg bg-white/[0.03] p-3">
                <span className="font-display text-3xl text-white/25">{r.n}</span>
                <div>
                  <div className="font-display uppercase text-white/90">{r.name}</div>
                  <div className="text-xs text-white/55">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel mt-4 rounded-xl p-5"
        >
          <h2 className="font-display text-xl uppercase text-neon-green">Controls</h2>
          <p className="mb-3 mt-1 text-xs uppercase tracking-widest text-white/45">
            Highlighted key = the move you need to hit. Press ESC to pause; remap in Settings.
          </p>
          <KeyHints keymap={keymap} activeMove={null} />
        </motion.div>
      </div>
    </div>
  );
}
