import { useEffect, useState } from 'react';
import type { MoveId } from '../types/game';
import { ALL_MOVES, DEFAULT_KEYMAP, codeToLabel } from '../lib/danceMoves';
import type { GameSettings } from '../lib/settings';
import { StageBackdrop } from './StageBackdrop';
import { audioEngine } from '../lib/audioEngine';

interface Props {
  settings: GameSettings;
  onUpdate: (patch: Partial<GameSettings>) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onUpdate, onClose }: Props) {
  const [listening, setListening] = useState<MoveId | null>(null);

  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setListening(null);
        return;
      }
      const keymap = { ...settings.keymap };
      // Release this code from any other move it was bound to.
      delete keymap[e.code];
      // Release the move's previous code.
      Object.entries(keymap).forEach(([code, move]) => {
        if (move === listening) delete keymap[code];
      });
      keymap[e.code] = listening;
      onUpdate({ keymap });
      setListening(null);
      audioEngine.playSfx('ui-confirm');
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listening, settings.keymap, onUpdate]);

  const currentCode = (move: MoveId): string | undefined =>
    Object.entries(settings.keymap).find(([, m]) => m === move)?.[0];

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <StageBackdrop accent="#22d3ee" />
      <div className="relative z-20 mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="graffiti text-4xl sm:text-5xl">Settings</h1>
          <button onClick={onClose} className="btn btn-ghost text-sm">
            ← Back
          </button>
        </div>

        <div className="panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-lg uppercase text-neon-blue">Audio</h2>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              onClick={() => {
                const muted = !settings.muted;
                onUpdate({ muted });
                audioEngine.setMuted(muted);
              }}
              className="btn btn-ghost text-sm"
            >
              {settings.muted ? '🔇 Muted' : '🔊 Sound On'}
            </button>
            <Slider
              label="Music"
              value={settings.musicVolume}
              onChange={(v) => {
                onUpdate({ musicVolume: v });
                audioEngine.setMusicVolume(v);
              }}
            />
            <Slider
              label="SFX"
              value={settings.sfxVolume}
              onChange={(v) => {
                onUpdate({ sfxVolume: v });
                audioEngine.setSfxVolume(v);
              }}
            />
          </div>
        </div>

        <div className="panel mt-4 rounded-xl p-5">
          <h2 className="font-display text-lg uppercase text-neon-purple">Accessibility</h2>
          <label className="mt-3 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => onUpdate({ reducedMotion: e.target.checked })}
              className="h-4 w-4 accent-neon-green"
            />
            <span className="text-sm uppercase tracking-widest text-white/70">
              Reduced motion &amp; flashing
            </span>
          </label>
        </div>

        <div className="panel mt-4 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg uppercase text-neon-green">Controls</h2>
            <button
              onClick={() => {
                onUpdate({ keymap: { ...DEFAULT_KEYMAP } });
                audioEngine.playSfx('ui-click');
              }}
              className="btn btn-ghost text-xs"
            >
              Reset Keys
            </button>
          </div>
          <p className="mt-1 text-xs uppercase tracking-widest text-white/45">
            Click a key, then press the new key to remap.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ALL_MOVES.map((m) => {
              const code = currentCode(m.id);
              const isListening = listening === m.id;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span>{m.icon}</span>
                    <span className="font-semibold" style={{ color: m.color }}>
                      {m.name}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      audioEngine.playSfx('ui-click');
                      setListening(m.id);
                    }}
                    className="keycap min-w-[64px]"
                    style={{
                      color: isListening ? '#b6ff3c' : '#eaeaf5',
                      borderColor: isListening ? '#b6ff3c' : undefined,
                      boxShadow: isListening ? '0 0 14px #b6ff3c88' : undefined,
                      animation: isListening ? 'flicker 1s infinite' : undefined,
                    }}
                  >
                    {isListening ? 'PRESS…' : code ? codeToLabel(code) : '—'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-1 items-center gap-3 text-xs font-semibold uppercase tracking-widest text-white/60">
      {label}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer accent-neon-green"
      />
    </label>
  );
}
