import type { MoveId } from '../types/game';
import { ALL_MOVES, codeToLabel } from '../lib/danceMoves';
import { moveCodeMap } from '../lib/settings';

interface Props {
  keymap: Record<string, MoveId>;
  activeMove: MoveId | null;
  pressedMove?: MoveId | null;
}

const ORDER: MoveId[] = [
  'lock',
  'point',
  'wrist-twirl',
  'stop-and-go',
  'funky-chicken',
  'scoboot',
  'floor-point',
  'wrist-roll',
  'isolation',
  'waving',
  'tutting',
  'grabbing',
  'pop',
  'robot',
  'dime-stop',
  'body-wave',
];

/** Visual keyboard mapping shown at the bottom of the arena. */
export function KeyHints({ keymap, activeMove, pressedMove }: Props) {
  const codes = moveCodeMap(keymap);
  const moves = ORDER.map((id) => ALL_MOVES.find((m) => m.id === id)!).filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {moves.map((m) => {
        const active = activeMove === m.id;
        const pressed = pressedMove === m.id;
        const code = codes[m.id];
        return (
          <div
            key={m.id}
            className="flex items-center gap-1.5 rounded border px-1.5 py-1 transition-all duration-100"
            style={{
              borderColor: active ? m.color : 'rgba(255,255,255,0.12)',
              background: active ? `${m.color}22` : 'rgba(8,8,14,0.7)',
              boxShadow: active ? `0 0 14px ${m.color}88` : 'none',
              transform: pressed ? 'translateY(2px) scale(0.96)' : active ? 'scale(1.06)' : 'none',
            }}
            title={`${m.name} — ${m.style}`}
          >
            <span
              className="keycap"
              style={{ color: active ? m.color : '#cfcfe6', minWidth: 26 }}
            >
              {code ? codeToLabel(code) : '—'}
            </span>
            <span
              className="hidden text-[11px] font-semibold uppercase tracking-wide sm:inline"
              style={{ color: active ? m.color : '#9a9ab5' }}
            >
              {m.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
