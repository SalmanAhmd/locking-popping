import { useEffect, useRef } from 'react';
import type { Note } from '../types/game';
import { DANCE_MOVES, codeToLabel } from '../lib/danceMoves';
import type { FrameListener } from '../hooks/useRhythmEngine';
import { moveCodeMap } from '../lib/settings';
import type { MoveId } from '../types/game';

interface Props {
  notes: Note[];
  currentIndex: number;
  addFrameListener: (cb: FrameListener) => () => void;
  beatDuration: number;
  keymap: Record<string, MoveId>;
  reducedMotion?: boolean;
  accent?: string;
}

const pxPerMs = 0.22;

/**
 * Horizontal scrolling rhythm lane. Positions are written straight to the DOM
 * inside the rAF frame callback — React never re-renders per frame.
 */
export function MovePromptLane({
  notes,
  currentIndex,
  addFrameListener,
  beatDuration,
  keymap,
  reducedMotion = false,
  accent = '#a855f7',
}: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const chips = useRef(new Map<number, HTMLDivElement>());
  const beatDots = useRef<(HTMLSpanElement | null)[]>([]);
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;
  const codes = moveCodeMap(keymap);

  useEffect(() => {
    const listener: FrameListener = (time) => {
      const el = container.current;
      if (!el) return;
      const hitX = el.clientWidth * 0.18;
      notes.forEach((note) => {
        const chip = chips.current.get(note.id);
        if (!chip) return;
        const x = hitX + (note.time - time) * pxPerMs;
        const judged = note.judged;
        const active = indexRef.current === note.id;
        chip.style.transform = `translate3d(${x}px, 0, 0) translateY(-50%) rotate(${
          active ? 0 : reducedMotion ? 0 : -6
        }deg) scale(${active ? 1.14 : 0.94})`;
        chip.style.opacity = judged ? '0.12' : active ? '1' : '0.82';
        chip.style.pointerEvents = 'none';
      });
      const beat = Math.floor(time / beatDuration);
      beatDots.current.forEach((dot, i) => {
        if (!dot) return;
        const on = ((beat % 4) + 4) % 4 === i;
        dot.style.opacity = on ? '1' : '0.25';
        dot.style.transform = on ? 'scale(1.6)' : 'scale(1)';
      });
    };
    return addFrameListener(listener);
  }, [notes, addFrameListener, beatDuration, reducedMotion]);

  return (
    <div className="relative">
      <div
        ref={container}
        className="relative h-[88px] overflow-hidden rounded-lg border border-white/10 bg-black/50"
      >
        {/* hit line */}
        <div
          className="absolute top-0 bottom-0 z-20 w-[3px]"
          style={{
            left: '18%',
            background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 16px ${accent}`,
          }}
        />
        <div
          className="absolute z-10 h-full w-16 -translate-x-1/2 opacity-30"
          style={{ left: '18%', background: `radial-gradient(closest-side, ${accent}66, transparent)` }}
        />
        {notes.map((note) => {
          const move = DANCE_MOVES[note.moveId];
          const code = codes[note.moveId];
          return (
            <div
              key={note.id}
              ref={(el) => {
                if (el) chips.current.set(note.id, el);
                else chips.current.delete(note.id);
              }}
              className="absolute top-1/2 left-0 flex h-[58px] w-[58px] flex-col items-center justify-center rounded-lg border-2"
              style={{
                borderColor: move.color,
                background: `linear-gradient(180deg, ${move.color}33, rgba(5,5,7,0.9))`,
                boxShadow: `0 0 10px ${move.color}66`,
                willChange: 'transform, opacity',
              }}
            >
              <span className="text-lg leading-none">{move.icon}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase" style={{ color: move.color }}>
                {code ? codeToLabel(code) : move.name.slice(0, 3)}
              </span>
              {note.freestyle && (
                <span className="absolute -top-2 -right-2 rounded bg-neon-green px-1 text-[9px] font-bold text-black">
                  FREE
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Beat</span>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              ref={(el) => (beatDots.current[i] = el)}
              className="block h-2 w-2 rounded-full transition-transform duration-75"
              style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
