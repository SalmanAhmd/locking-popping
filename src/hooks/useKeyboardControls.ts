import { useEffect, useRef } from 'react';
import type { MoveId } from '../types/game';

interface Options {
  enabled: boolean;
  keymap: Record<string, MoveId>;
  onMove: (moveId: MoveId, code: string) => void;
  onMoveUp?: (moveId: MoveId, code: string) => void;
  onEscape?: () => void;
  onEnter?: () => void;
}

const ALWAYS_BLOCK = new Set([
  'Space',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
]);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Global keyboard handler for gameplay. Ignores input while typing, blocks
 * default scrolling for gameplay keys, and separates keydown/keyup so moves
 * can play a hold/release animation.
 */
export function useKeyboardControls({
  enabled,
  keymap,
  onMove,
  onMoveUp,
  onEscape,
  onEnter,
}: Options) {
  const keymapRef = useRef(keymap);
  keymapRef.current = keymap;
  const handlers = useRef({ onMove, onMoveUp, onEscape, onEnter });
  handlers.current = { onMove, onMoveUp, onEscape, onEnter };

  useEffect(() => {
    if (!enabled) return;

    const handleDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.code === 'Escape') {
        handlers.current.onEscape?.();
        return;
      }
      if (e.code === 'Enter') {
        handlers.current.onEnter?.();
        return;
      }
      const move = keymapRef.current[e.code];
      if (ALWAYS_BLOCK.has(e.code) || move) e.preventDefault();
      if (!move) return;
      if (e.repeat) return;
      handlers.current.onMove(move, e.code);
    };

    const handleUp = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const move = keymapRef.current[e.code];
      if (!move) return;
      handlers.current.onMoveUp?.(move, e.code);
    };

    window.addEventListener('keydown', handleDown, { passive: false });
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [enabled]);
}
