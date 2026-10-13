import type { DanceMove, Difficulty, MoveId, TimingGrade } from '../types/game';
import { DANCE_MOVES } from './danceMoves';

export interface AIProfile {
  name: string;
  subtitle: string;
  colors: { primary: string; secondary: string; glow: string };
  /** Base skill 0..1 before per-round ramp. */
  skill: number;
  taunts: string[];
  winLines: string[];
  loseLines: string[];
}

export const AI_PROFILES: Record<Difficulty, AIProfile> = {
  beginner: {
    name: 'GLITCH',
    subtitle: 'Street Rookie',
    colors: { primary: '#ff2d95', secondary: '#a855f7', glow: '#ff2d95' },
    skill: 0.42,
    taunts: ['Is that all you got?', 'Warm-up round, huh?', 'Loosen up, rookie.'],
    winLines: ['Too easy.', 'The floor remembers me.', 'Back to the lab.'],
    loseLines: ['Aight... you got flow.', 'Respect. Round one to you.'],
  },
  intermediate: {
    name: 'GLITCH',
    subtitle: 'Circuit Breaker',
    colors: { primary: '#a855f7', secondary: '#22d3ee', glow: '#a855f7' },
    skill: 0.68,
    taunts: ['Feel that pressure?', 'Step your game up.', 'Lock in or lock out.'],
    winLines: ['Systematic. You never stood a chance.', 'Glitch out.'],
    loseLines: ['Clean execution... impressive.', 'You earned that one.'],
  },
  expert: {
    name: 'GLITCH',
    subtitle: 'The Machine',
    colors: { primary: '#b6ff3c', secondary: '#ff2d95', glow: '#b6ff3c' },
    skill: 0.88,
    taunts: ['This is my arena.', 'Every beat is mine.', "You can't out-sync the machine."],
    winLines: ['Flawless. As predicted.', 'I own this floor.'],
    loseLines: ['Recalculating... you are the real deal.', 'Impossible... but respected.'],
  },
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export interface AIGradeRates {
  perfect: number;
  great: number;
  good: number;
  miss: number;
}

export function aiGradeRates(difficulty: Difficulty, round: number): AIGradeRates {
  const skill = clamp(AI_PROFILES[difficulty].skill + (round - 1) * 0.06, 0, 1);
  const miss = clamp(0.42 - skill * 0.45, 0.02, 0.45);
  const good = clamp(0.32 - skill * 0.22, 0.05, 0.35);
  const great = clamp(0.34 - skill * 0.08, 0.2, 0.4);
  let perfect = 1 - miss - good - great;
  if (perfect < 0) perfect = 0;
  const total = perfect + great + good + miss;
  return { perfect: perfect / total, great: great / total, good: good / total, miss: miss / total };
}

export function rollAIGrade(difficulty: Difficulty, round: number, rng: () => number): TimingGrade {
  const r = aiGradeRates(difficulty, round);
  const roll = rng();
  if (roll < r.perfect) return 'perfect';
  if (roll < r.perfect + r.great) return 'great';
  if (roll < r.perfect + r.great + r.good) return 'good';
  return 'miss';
}

/** Choose an AI move; higher rounds permit more technical moves. */
export function pickAIMove(pool: MoveId[], round: number, rng: () => number, prev?: MoveId): MoveId {
  let candidates = pool;
  if (round <= 1) {
    candidates = pool.filter((id) => DANCE_MOVES[id].difficulty <= 2);
  } else if (round === 2) {
    candidates = pool.filter((id) => DANCE_MOVES[id].difficulty <= 4);
  }
  if (candidates.length === 0) candidates = pool;
  let choice = candidates[Math.floor(rng() * candidates.length)];
  let guard = 0;
  while (prev && choice === prev && candidates.length > 1 && guard < 5) {
    choice = candidates[Math.floor(rng() * candidates.length)];
    guard += 1;
  }
  return choice;
}

export function aiMovePoolFor(round: number, pool: MoveId[]): MoveId[] {
  if (round <= 1) return pool.filter((id) => DANCE_MOVES[id].difficulty <= 2);
  if (round === 2) return pool.filter((id) => DANCE_MOVES[id].difficulty <= 4);
  return pool;
}

export function randomMoveName(moves: DanceMove[], rng: () => number): string {
  return moves[Math.floor(rng() * moves.length)]?.name ?? 'move';
}
