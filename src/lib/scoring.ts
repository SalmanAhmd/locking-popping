import type { RoundResult, SideStats, TimingGrade, TimingWindow } from '../types/game';

export const GRADE_BASE: Record<TimingGrade, number> = {
  perfect: 100,
  great: 70,
  good: 40,
  miss: 0,
};

/** On-beat accuracy bonus (flat, added once per hit). */
export const GRADE_ACCURACY_BONUS: Record<TimingGrade, number> = {
  perfect: 20,
  great: 10,
  good: 0,
  miss: 0,
};

export const CLEAN_FLOW_BONUS = 300;
export const MAX_COMBO_MULTIPLIER = 2;

/**
 * Deterministic combo multiplier: grows 5% per combo step, capped at 2.0x.
 */
export function comboMultiplier(combo: number): number {
  const steps = Math.max(0, Math.min(combo, 20));
  return Math.min(MAX_COMBO_MULTIPLIER, 1 + steps * 0.05);
}

export function gradeForDelta(deltaMs: number, window: TimingWindow): TimingGrade {
  const d = Math.abs(deltaMs);
  if (d <= window.perfect) return 'perfect';
  if (d <= window.great) return 'great';
  if (d <= window.good) return 'good';
  return 'miss';
}

export function scaledWindow(base: TimingWindow, scale: number): TimingWindow {
  return {
    perfect: Math.round(base.perfect * scale),
    great: Math.round(base.great * scale),
    good: Math.round(base.good * scale),
  };
}

export interface AppliedResult {
  points: number;
  multiplier: number;
  combo: number;
  grade: TimingGrade;
}

export function createStats(totalNotes = 0): SideStats {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    hits: 0,
    totalNotes,
    timingSum: 0,
    timedNotes: 0,
    roundScores: [],
    roundMaxCombos: [],
  };
}

/**
 * Pure scoring application. Mutates the given stats object and returns the result.
 * Combo only advances on a hit and resets on a miss. Points are deterministic.
 */
export function applyJudgement(
  stats: SideStats,
  grade: TimingGrade,
  deltaMs: number | null,
): AppliedResult {
  if (grade === 'miss') {
    stats.combo = 0;
    stats.miss += 1;
    return { points: 0, multiplier: 1, combo: 0, grade };
  }

  const multiplier = comboMultiplier(stats.combo);
  const base = GRADE_BASE[grade] + GRADE_ACCURACY_BONUS[grade];
  const points = Math.round(base * multiplier);

  stats.combo += 1;
  stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
  stats.hits += 1;
  stats[grade] += 1;
  if (deltaMs != null) {
    stats.timingSum += Math.abs(deltaMs);
    stats.timedNotes += 1;
  }
  stats.score += points;

  return { points, multiplier, combo: stats.combo, grade };
}

export function roundOver(stats: SideStats, isPlayer: boolean, cleanBonus = CLEAN_FLOW_BONUS): number {
  const bonus = stats.miss === 0 && stats.totalNotes > 0 ? cleanBonus : 0;
  if (bonus) stats.score += bonus;
  stats.roundScores.push(stats.score);
  stats.roundMaxCombos.push(stats.maxCombo);
  return bonus;
}

/** Accuracy as a 0..1 ratio from timing deltas and misses. */
export function accuracy(stats: SideStats): number {
  if (stats.totalNotes === 0) return 0;
  const weightedHits = stats.perfect + stats.great * 0.8 + stats.good * 0.55;
  return Math.max(0, Math.min(1, weightedHits / stats.totalNotes));
}

export function accuracyPercent(stats: SideStats): number {
  return Math.round(accuracy(stats) * 100);
}

export function gradeLetter(accuracyRatio: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (accuracyRatio >= 0.95) return 'S';
  if (accuracyRatio >= 0.85) return 'A';
  if (accuracyRatio >= 0.7) return 'B';
  if (accuracyRatio >= 0.5) return 'C';
  return 'D';
}

export function determineOutcome(
  playerTotal: number,
  aiTotal: number,
): 'victory' | 'defeat' | 'draw' {
  if (playerTotal > aiTotal) return 'victory';
  if (playerTotal < aiTotal) return 'defeat';
  return 'draw';
}

export function aggregateMatch(roundResults: RoundResult[]) {
  const playerTotal = roundResults.reduce((s, r) => s + r.playerScore, 0);
  const aiTotal = roundResults.reduce((s, r) => s + r.aiScore, 0);
  return { playerTotal, aiTotal, outcome: determineOutcome(playerTotal, aiTotal) };
}
