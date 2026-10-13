import { describe, expect, it } from 'vitest';
import {
  accuracyPercent,
  applyJudgement,
  CLEAN_FLOW_BONUS,
  comboMultiplier,
  createStats,
  determineOutcome,
  gradeForDelta,
  gradeLetter,
  roundOver,
  scaledWindow,
} from './scoring';
import { BASE_WINDOW } from './danceMoves';

describe('timing grades', () => {
  it('grades deltas against the window', () => {
    expect(gradeForDelta(0, BASE_WINDOW)).toBe('perfect');
    expect(gradeForDelta(79, BASE_WINDOW)).toBe('perfect');
    expect(gradeForDelta(120, BASE_WINDOW)).toBe('great');
    expect(gradeForDelta(-200, BASE_WINDOW)).toBe('good');
    expect(gradeForDelta(400, BASE_WINDOW)).toBe('miss');
  });

  it('scales windows by round', () => {
    const w = scaledWindow(BASE_WINDOW, 1.35);
    expect(w.perfect).toBe(108);
    expect(w.great).toBe(216);
  });
});

describe('combo multiplier', () => {
  it('starts at 1x and caps at 2x', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(10)).toBeCloseTo(1.5, 5);
    expect(comboMultiplier(20)).toBe(2);
    expect(comboMultiplier(999)).toBe(2);
  });
});

describe('applyJudgement', () => {
  it('awards deterministic points and builds combo', () => {
    const stats = createStats(4);
    const r1 = applyJudgement(stats, 'perfect', 10);
    expect(r1.points).toBe(120); // (100 + 20) * 1.0
    expect(stats.combo).toBe(1);
    const r2 = applyJudgement(stats, 'great', 100);
    // (70 + 10) * 1.05 = 84
    expect(r2.points).toBe(84);
    expect(stats.combo).toBe(2);
    expect(stats.perfect).toBe(1);
    expect(stats.great).toBe(1);
  });

  it('resets combo and scores zero on miss', () => {
    const stats = createStats(4);
    applyJudgement(stats, 'perfect', 0);
    applyJudgement(stats, 'perfect', 0);
    const miss = applyJudgement(stats, 'miss', null);
    expect(miss.points).toBe(0);
    expect(stats.combo).toBe(0);
    expect(stats.miss).toBe(1);
    expect(stats.maxCombo).toBe(2);
  });
});

describe('round + match results', () => {
  it('adds a clean-flow bonus only when there are no misses', () => {
    const clean = createStats(3);
    applyJudgement(clean, 'perfect', 0);
    roundOver(clean, true);
    expect(clean.score).toBe(120 + CLEAN_FLOW_BONUS);

    const messy = createStats(3);
    applyJudgement(messy, 'miss', null);
    roundOver(messy, true);
    expect(messy.score).toBe(0);
  });

  it('computes outcome and grades', () => {
    expect(determineOutcome(100, 50)).toBe('victory');
    expect(determineOutcome(50, 100)).toBe('defeat');
    expect(determineOutcome(50, 50)).toBe('draw');

    const stats = createStats(4);
    applyJudgement(stats, 'perfect', 0);
    applyJudgement(stats, 'perfect', 0);
    applyJudgement(stats, 'perfect', 0);
    applyJudgement(stats, 'perfect', 0);
    expect(accuracyPercent(stats)).toBe(100);
    expect(gradeLetter(1)).toBe('S');
  });
});
