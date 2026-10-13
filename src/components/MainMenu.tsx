import { motion } from 'framer-motion';
import type { Difficulty } from '../types/game';
import type { GameSettings } from '../lib/settings';
import { StageBackdrop } from './StageBackdrop';
import { audioEngine } from '../lib/audioEngine';

interface Props {
  settings: GameSettings;
  onUpdate: (patch: Partial<GameSettings>) => void;
  onStart: () => void;
  onHowTo: () => void;
  onLibrary: () => void;
  onPractice: () => void;
  onSettings: () => void;
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'Forgiving windows, chill AI', color: '#22d3ee' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Balanced battle', color: '#a855f7' },
  { id: 'expert', label: 'Expert', desc: 'Tight timing, ruthless AI', color: '#ff2d95' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

export function MainMenu({ settings, onUpdate, onStart, onHowTo, onLibrary, onPractice, onSettings }: Props) {
  return (
    <div className="relative h-full w-full overflow-y-auto">
      <StageBackdrop accent="#a855f7" />

      <div className="relative z-20 mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center px-4 py-10">
        <motion.div variants={container} initial="hidden" animate="show" className="w-full text-center">
          <motion.p
            variants={item}
            className="mb-1 font-display text-sm uppercase tracking-[0.6em] text-neon-blue"
          >
            Underground Dance Battle
          </motion.p>

          <motion.h1
            variants={item}
            className="graffiti animate-flicker text-6xl leading-[0.85] sm:text-8xl md:text-9xl"
          >
            Street
            <br />
            Sync
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-3 font-display text-base uppercase tracking-[0.3em] text-white/80 sm:text-xl"
          >
            Feel the Beat. Hit the Pop. Own the Floor.
          </motion.p>

          {/* Difficulty */}
          <motion.div variants={item} className="mt-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              Select Difficulty
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {DIFFICULTIES.map((d) => {
                const active = settings.difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      audioEngine.playSfx('ui-click');
                      onUpdate({ difficulty: d.id });
                    }}
                    className="group rounded-lg border px-4 py-2 text-left transition-all"
                    style={{
                      borderColor: active ? d.color : 'rgba(255,255,255,0.15)',
                      background: active ? `${d.color}1f` : 'rgba(8,8,14,0.6)',
                      boxShadow: active ? `0 0 20px ${d.color}55` : 'none',
                    }}
                  >
                    <div
                      className="font-display text-sm uppercase tracking-wider"
                      style={{ color: active ? d.color : '#d8d8ee' }}
                    >
                      {d.label}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-white/45">{d.desc}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Primary CTA */}
          <motion.div variants={item} className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={onStart}
              className="btn btn-neon w-full max-w-sm text-lg sm:text-2xl"
            >
              ▶ Enter the Battle
            </button>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={onHowTo} className="btn btn-ghost text-sm">
                How to Play
              </button>
              <button onClick={onLibrary} className="btn btn-ghost text-sm">
                Dance Move Library
              </button>
              <button onClick={onPractice} className="btn btn-ghost text-sm">
                Practice Mode
              </button>
              <button onClick={onSettings} className="btn btn-ghost text-sm">
                Settings
              </button>
            </div>
          </motion.div>

          {/* Audio controls */}
          <motion.div
            variants={item}
            className="panel mx-auto mt-8 flex max-w-md flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
          >
            <button
              onClick={() => {
                const muted = !settings.muted;
                onUpdate({ muted });
                audioEngine.setMuted(muted);
                if (!muted) audioEngine.playSfx('ui-confirm');
              }}
              className="btn btn-ghost px-3 py-2 text-sm"
              aria-pressed={settings.muted}
            >
              {settings.muted ? '🔇 Muted' : '🔊 Sound On'}
            </button>
            <label className="flex flex-1 items-center gap-3 text-xs font-semibold uppercase tracking-widest text-white/60">
              Music
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.musicVolume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onUpdate({ musicVolume: v });
                  audioEngine.setMusicVolume(v);
                }}
                className="h-1 flex-1 cursor-pointer accent-neon-green"
              />
            </label>
          </motion.div>

          <motion.p variants={item} className="mt-6 text-xs uppercase tracking-widest text-white/35">
            Keyboard gameplay is recommended — best on desktop.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
