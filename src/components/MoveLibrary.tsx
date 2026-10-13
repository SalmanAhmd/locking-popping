import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { DanceStyle, MoveId } from '../types/game';
import { ALL_MOVES, codeToLabel } from '../lib/danceMoves';
import { moveCodeMap } from '../lib/settings';
import { Dancer, type DancerHandle } from './Dancer';
import { StageBackdrop } from './StageBackdrop';
import { audioEngine } from '../lib/audioEngine';

interface Props {
  keymap: Record<string, MoveId>;
  onBack: () => void;
  onPractice: () => void;
  reducedMotion: boolean;
}

const FILTERS: { id: 'all' | DanceStyle; label: string }[] = [
  { id: 'all', label: 'All Moves' },
  { id: 'locking', label: 'Locking' },
  { id: 'popping', label: 'Popping' },
];

export function MoveLibrary({ keymap, onBack, onPractice, reducedMotion }: Props) {
  const [filter, setFilter] = useState<'all' | DanceStyle>('all');
  const [selected, setSelected] = useState<MoveId>('lock');
  const preview = useRef<DancerHandle | null>(null);
  const codes = useMemo(() => moveCodeMap(keymap), [keymap]);

  const moves = ALL_MOVES.filter((m) => filter === 'all' || m.style === filter);
  const selectedMove = ALL_MOVES.find((m) => m.id === selected)!;

  const select = (id: MoveId) => {
    setSelected(id);
    preview.current?.playMove(id, 'perfect');
    audioEngine.playSfx('key-press');
  };

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <StageBackdrop accent="#22d3ee" />
      <div className="relative z-20 mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="graffiti text-4xl sm:text-5xl">Move Library</h1>
          <div className="flex gap-2">
            <button onClick={onPractice} className="btn btn-ghost text-sm">
              Practice
            </button>
            <button onClick={onBack} className="btn btn-ghost text-sm">
              ← Back
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition"
              style={{
                borderColor: filter === f.id ? '#22d3ee' : 'rgba(255,255,255,0.15)',
                color: filter === f.id ? '#22d3ee' : '#b9b9d4',
                background: filter === f.id ? 'rgba(34,211,238,0.12)' : 'transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
          {/* Preview */}
          <div className="panel panel-pink flex flex-col items-center rounded-xl p-4 lg:sticky lg:top-4 lg:h-[440px]">
            <div className="relative h-[240px] w-full max-w-[240px]">
              <Dancer
                ref={preview}
                colors={{ primary: selectedMove.color, secondary: '#ffffff', glow: selectedMove.color }}
                beatDuration={560}
                reducedMotion={reducedMotion}
              />
            </div>
            <div className="mt-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{selectedMove.icon}</span>
                <span
                  className="font-display text-2xl uppercase"
                  style={{ color: selectedMove.color }}
                >
                  {selectedMove.name}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-white/50">
                <span
                  className="rounded px-2 py-0.5 font-bold"
                  style={{
                    background: selectedMove.style === 'locking' ? '#22d3ee' : '#ff2d95',
                    color: '#050507',
                  }}
                >
                  {selectedMove.style}
                </span>
                <span className="keycap">{codes[selectedMove.id] ? codeToLabel(codes[selectedMove.id]!) : '—'}</span>
                <Stars value={selectedMove.difficulty} />
              </div>
              <p className="mt-3 text-sm leading-snug text-white/70">{selectedMove.tutorial}</p>
              <button
                onClick={() => preview.current?.playMove(selected, 'perfect')}
                className="btn btn-ghost mt-3 w-full text-xs"
              >
                ▶ Preview Move
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {moves.map((m) => {
              const code = codes[m.id];
              const active = selected === m.id;
              return (
                <motion.button
                  key={m.id}
                  layout
                  onClick={() => select(m.id)}
                  whileHover={{ y: -3 }}
                  className="panel rounded-xl p-3 text-left transition"
                  style={{
                    borderColor: active ? m.color : undefined,
                    boxShadow: active ? `0 0 24px ${m.color}55` : undefined,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{m.icon}</span>
                    <span className="keycap" style={{ color: m.color }}>
                      {code ? codeToLabel(code) : '—'}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-lg uppercase" style={{ color: m.color }}>
                    {m.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-widest text-white/45">
                    <span>{m.style}</span>
                    <Stars value={m.difficulty} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-snug text-white/60">{m.tutorial}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-neon-green" title={`Difficulty ${value}/5`}>
      {'★'.repeat(value)}
      <span className="text-white/20">{'★'.repeat(5 - value)}</span>
    </span>
  );
}
