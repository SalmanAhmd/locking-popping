import { describe, expect, it } from 'vitest';
import { NEUTRAL, POSE_KEYS, integratePose, resetPose, type Pose } from './poseEngine';

function zero(): Pose {
  const out = {} as Pose;
  POSE_KEYS.forEach((k) => (out[k] = 0));
  return out;
}

describe('spring pose solver', () => {
  it('converges toward the target without NaN or blow-up', () => {
    const current: Pose = { ...NEUTRAL };
    const vel = zero();
    const target: Pose = { ...NEUTRAL, lShoulder: 90, lElbow: 70, bodyY: -8, torso: 12 };

    for (let i = 0; i < 150; i += 1) {
      integratePose(current, vel, target, 1 / 60, 1);
    }

    POSE_KEYS.forEach((k) => {
      expect(Number.isFinite(current[k])).toBe(true);
      expect(Math.abs(current[k] - target[k])).toBeLessThan(1.5);
    });
  });

  it('makes distal joints lag behind proximal ones (follow-through)', () => {
    const current: Pose = zero();
    const vel = zero();
    const target: Pose = { ...zero(), lShoulder: 90, lElbow: 90 };

    // A handful of frames only.
    for (let i = 0; i < 4; i += 1) integratePose(current, vel, target, 1 / 60, 1);

    expect(current.lShoulder).toBeGreaterThan(current.lElbow);
  });

  it('resetPose snaps cleanly', () => {
    const current: Pose = { ...NEUTRAL, lShoulder: 90 };
    const vel = zero();
    vel.lShoulder = 40;
    resetPose(current, vel, NEUTRAL);
    expect(current.lShoulder).toBe(NEUTRAL.lShoulder);
    expect(vel.lShoulder).toBe(0);
  });
});
