import type { Difficulty, MoveId } from '../types/game';
import { DEFAULT_KEYMAP } from './danceMoves';

export interface GameSettings {
  difficulty: Difficulty;
  keymap: Record<string, MoveId>;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = 'street-sync-settings-v1';

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'intermediate',
  keymap: { ...DEFAULT_KEYMAP },
  musicVolume: 0.6,
  sfxVolume: 0.85,
  muted: false,
  reducedMotion: false,
};

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      keymap: { ...DEFAULT_KEYMAP, ...(parsed.keymap ?? {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/** Move -> code lookup for display. */
export function moveCodeMap(keymap: Record<string, MoveId>): Partial<Record<MoveId, string>> {
  const out: Partial<Record<MoveId, string>> = {};
  Object.entries(keymap).forEach(([code, move]) => {
    if (!out[move]) out[move] = code;
  });
  return out;
}
