import type { MoveId } from '../types/game';

/**
 * Articulated 2D dancer pose system.
 *
 * A Pose is a set of joint angles (degrees) plus body transform values.
 * Angle conventions (SVG screen space, y-down, positive rotation = clockwise):
 *   shoulder: 0 = arm hanging down, + swings outward/up.
 *   elbow:    0 = straight, + flexes.
 *   hip:      0 = leg straight down, + swings outward.
 *   knee:     0 = straight, + flexes.
 * The right side is mirrored at render time, so + always means "outward".
 */
export interface Pose {
  bodyX: number;
  bodyY: number;
  bodyRot: number;
  scaleX: number;
  scaleY: number;
  torso: number;
  head: number;
  lShoulder: number;
  lElbow: number;
  rShoulder: number;
  rElbow: number;
  lHip: number;
  lKnee: number;
  rHip: number;
  rKnee: number;
}

export const NEUTRAL: Pose = {
  bodyX: 0,
  bodyY: 0,
  bodyRot: 0,
  scaleX: 1,
  scaleY: 1,
  torso: 0,
  head: 0,
  lShoulder: 8,
  lElbow: 10,
  rShoulder: 8,
  rElbow: 10,
  lHip: 4,
  lKnee: 4,
  rHip: 4,
  rKnee: 4,
};

export type Easing = 'linear' | 'in' | 'out' | 'inout';

export interface Keyframe {
  at: number; // 0..1
  ease?: Easing;
  pose: Partial<Pose>;
}

export interface MoveAnim {
  duration: number; // ms
  frames: Keyframe[];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function ease(t: number, kind: Easing = 'inout'): number {
  switch (kind) {
    case 'linear':
      return t;
    case 'in':
      return t * t;
    case 'out':
      return 1 - (1 - t) * (1 - t);
    default:
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}

export function samplePose(anim: MoveAnim, progress: number): Pose {
  const frames = anim.frames;
  const p = Math.max(0, Math.min(1, progress));
  let a = frames[0];
  let b = frames[frames.length - 1];
  for (let i = 0; i < frames.length - 1; i++) {
    if (p >= frames[i].at && p <= frames[i + 1].at) {
      a = frames[i];
      b = frames[i + 1];
      break;
    }
  }
  const span = b.at - a.at || 1;
  const localT = ease((p - a.at) / span, b.ease);
  const out: Pose = { ...NEUTRAL };
  (Object.keys(NEUTRAL) as (keyof Pose)[]).forEach((key) => {
    const av = a.pose[key] ?? NEUTRAL[key];
    const bv = b.pose[key] ?? av;
    out[key] = lerp(av, bv, localT);
  });
  return out;
}

const mk = (duration: number, frames: Keyframe[]): MoveAnim => ({ duration, frames });

export const MOVE_ANIMS: Record<MoveId, MoveAnim> = {
  pop: mk(430, [
    { at: 0, pose: {} },
    { at: 0.07, ease: 'in', pose: { scaleX: 1.06, scaleY: 0.94, bodyY: 3, lShoulder: 24, rShoulder: 24, lElbow: 40, rElbow: 40, head: -6 } },
    { at: 0.2, ease: 'out', pose: { scaleX: 1, scaleY: 1, bodyY: 0, lShoulder: 10, rShoulder: 10, lElbow: 12, rElbow: 12 } },
    { at: 1, pose: {} },
  ]),
  lock: mk(520, [
    { at: 0, pose: {} },
    { at: 0.12, ease: 'out', pose: { rShoulder: 118, rElbow: 44, lShoulder: -14, lElbow: 24, torso: -8, head: -8, bodyRot: -5, scaleY: 1.06 } },
    { at: 0.72, pose: { rShoulder: 118, rElbow: 44, lShoulder: -14, lElbow: 24, torso: -8, head: -8, bodyRot: -5, scaleY: 1 } },
    { at: 1, pose: {} },
  ]),
  point: mk(500, [
    { at: 0, pose: {} },
    { at: 0.14, ease: 'out', pose: { lShoulder: 96, lElbow: 2, rShoulder: -18, rElbow: 70, torso: 8, head: 10, bodyX: 4 } },
    { at: 0.7, pose: { lShoulder: 96, lElbow: 2, rShoulder: -18, rElbow: 70, torso: 8, head: 10, bodyX: 4 } },
    { at: 1, pose: {} },
  ]),
  'wrist-twirl': mk(620, [
    { at: 0, pose: {} },
    { at: 0.12, pose: { lShoulder: 62, lElbow: 72, rShoulder: 62, rElbow: 72 } },
    { at: 0.32, pose: { lShoulder: 52, lElbow: 92, rShoulder: 72, rElbow: 58 } },
    { at: 0.52, pose: { lShoulder: 72, lElbow: 58, rShoulder: 52, rElbow: 92 } },
    { at: 0.72, pose: { lShoulder: 62, lElbow: 72, rShoulder: 62, rElbow: 72 } },
    { at: 1, pose: {} },
  ]),
  'stop-and-go': mk(620, [
    { at: 0, pose: {} },
    { at: 0.18, ease: 'out', pose: { bodyX: 12, bodyRot: 7, torso: 9, lShoulder: 34, rShoulder: 26, lElbow: 30, rElbow: 30, head: 6 } },
    { at: 0.34, ease: 'linear', pose: { bodyX: 12, bodyRot: 7, torso: 9, lShoulder: 34, rShoulder: 26, lElbow: 30, rElbow: 30, head: 6 } },
    { at: 0.52, ease: 'out', pose: { bodyX: -12, bodyRot: -7, torso: -9, lShoulder: 26, rShoulder: 34, lElbow: 30, rElbow: 30, head: -6 } },
    { at: 0.68, ease: 'linear', pose: { bodyX: -12, bodyRot: -7, torso: -9, lShoulder: 26, rShoulder: 34, lElbow: 30, rElbow: 30, head: -6 } },
    { at: 1, pose: {} },
  ]),
  'funky-chicken': mk(660, [
    { at: 0, pose: {} },
    { at: 0.12, pose: { lShoulder: 18, lElbow: 122, rShoulder: 18, rElbow: 122, head: -8, torso: -4 } },
    { at: 0.3, pose: { lShoulder: 18, lElbow: 62, rShoulder: 18, rElbow: 62, head: -4, torso: -2 } },
    { at: 0.48, pose: { lShoulder: 18, lElbow: 122, rShoulder: 18, rElbow: 122, head: -8, torso: -4 } },
    { at: 0.66, pose: { lShoulder: 18, lElbow: 62, rShoulder: 18, rElbow: 62, head: -4, torso: -2 } },
    { at: 1, pose: {} },
  ]),
  scoboot: mk(680, [
    { at: 0, pose: {} },
    { at: 0.18, pose: { rShoulder: 112, rElbow: 84, lShoulder: -22, lElbow: 40, bodyY: -3, head: 6 } },
    { at: 0.42, pose: { rShoulder: 96, rElbow: 70, lHip: 16, lKnee: 24, rHip: -8, bodyY: 2, bodyX: 8 } },
    { at: 0.66, pose: { rShoulder: 44, rElbow: 30, lHip: 4, lKnee: 4, rHip: 4, bodyX: 0 } },
    { at: 1, pose: {} },
  ]),
  'floor-point': mk(680, [
    { at: 0, pose: {} },
    { at: 0.24, ease: 'out', pose: { bodyY: 26, scaleY: 0.82, scaleX: 1.08, torso: 18, head: -8, lShoulder: 120, lElbow: 8, rShoulder: -30, rElbow: 60, lKnee: 30, rKnee: 30 } },
    { at: 0.58, pose: { bodyY: 30, scaleY: 0.78, scaleX: 1.1, torso: 20, head: -10, lShoulder: 136, lElbow: 4, rShoulder: -34, rElbow: 60, lKnee: 34, rKnee: 34 } },
    { at: 1, pose: {} },
  ]),
  'wrist-roll': mk(640, [
    { at: 0, pose: {} },
    { at: 0.22, pose: { lShoulder: 82, lElbow: 62, rShoulder: 58, rElbow: 40, torso: 4 } },
    { at: 0.48, pose: { lShoulder: 40, lElbow: 20, rShoulder: 92, rElbow: 72, torso: -4 } },
    { at: 0.72, pose: { lShoulder: 72, lElbow: 52, rShoulder: 50, rElbow: 30 } },
    { at: 1, pose: {} },
  ]),
  isolation: mk(680, [
    { at: 0, pose: {} },
    { at: 0.18, pose: { head: 24, bodyX: -7, torso: 0 } },
    { at: 0.44, pose: { head: -24, bodyX: 7, torso: 0 } },
    { at: 0.7, pose: { head: 10, bodyX: -3 } },
    { at: 1, pose: {} },
  ]),
  waving: mk(720, [
    { at: 0, pose: {} },
    { at: 0.14, pose: { rShoulder: 150, rElbow: 4, lShoulder: -20, lElbow: 40, torso: -6 } },
    { at: 0.34, pose: { rShoulder: 150, rElbow: 62, lShoulder: 10, torso: -4 } },
    { at: 0.5, pose: { rShoulder: 60, rElbow: 30, lShoulder: 24, lElbow: 62, torso: 0 } },
    { at: 0.66, pose: { lShoulder: 92, lElbow: 44, rShoulder: -10, torso: 6 } },
    { at: 0.82, pose: { lShoulder: 122, lElbow: 4, rShoulder: -20, head: 6 } },
    { at: 1, pose: {} },
  ]),
  tutting: mk(720, [
    { at: 0, pose: {} },
    { at: 0.18, pose: { lShoulder: 92, lElbow: -92, rShoulder: 92, rElbow: -92, head: -4 } },
    { at: 0.44, pose: { lShoulder: 92, lElbow: 0, rShoulder: 92, rElbow: -92 } },
    { at: 0.7, pose: { lShoulder: 92, lElbow: -92, rShoulder: 92, rElbow: 0 } },
    { at: 1, pose: {} },
  ]),
  grabbing: mk(680, [
    { at: 0, pose: {} },
    { at: 0.2, pose: { lShoulder: 102, lElbow: 10, rShoulder: 102, rElbow: 10, torso: 10, head: 6 } },
    { at: 0.5, pose: { lShoulder: 40, lElbow: 104, rShoulder: 40, rElbow: 104, torso: -6, head: -4 } },
    { at: 0.78, pose: { lShoulder: 60, lElbow: 60, rShoulder: 60, rElbow: 60 } },
    { at: 1, pose: {} },
  ]),
  robot: mk(760, [
    { at: 0, pose: {} },
    { at: 0.14, pose: { lShoulder: 92, lElbow: 92 } },
    { at: 0.16, ease: 'linear', pose: { lShoulder: 92, lElbow: 92 } },
    { at: 0.34, pose: { lShoulder: 92, lElbow: 92, rShoulder: 92, rElbow: 92 } },
    { at: 0.36, ease: 'linear', pose: { lShoulder: 92, lElbow: 92, rShoulder: 92, rElbow: 92 } },
    { at: 0.54, pose: { lShoulder: 46, lElbow: 46, rShoulder: 46, rElbow: 46 } },
    { at: 0.56, ease: 'linear', pose: { lShoulder: 46, lElbow: 46, rShoulder: 46, rElbow: 46 } },
    { at: 0.74, pose: { torso: 10, head: -10 } },
    { at: 1, pose: {} },
  ]),
  'dime-stop': mk(620, [
    { at: 0, pose: {} },
    { at: 0.28, ease: 'out', pose: { bodyX: 16, bodyRot: 14, torso: 12, head: 10, lShoulder: 122, lElbow: 20, rShoulder: -42, rElbow: 40, lHip: 12 } },
    { at: 0.4, ease: 'linear', pose: { bodyX: 16, bodyRot: 14, torso: 12, head: 10, lShoulder: 122, lElbow: 20, rShoulder: -42, rElbow: 40, lHip: 12 } },
    { at: 0.92, ease: 'linear', pose: { bodyX: 16, bodyRot: 14, torso: 12, head: 10, lShoulder: 122, lElbow: 20, rShoulder: -42, rElbow: 40, lHip: 12 } },
    { at: 1, pose: {} },
  ]),
  'body-wave': mk(680, [
    { at: 0, pose: {} },
    { at: 0.18, pose: { torso: 14, head: -10, bodyY: -3 } },
    { at: 0.4, pose: { torso: -14, head: 12, bodyY: 3 } },
    { at: 0.62, pose: { torso: 10, head: -6, bodyY: -2 } },
    { at: 0.82, pose: { torso: -6, head: 4 } },
    { at: 1, pose: {} },
  ]),
};

export const MISS_ANIM: MoveAnim = mk(520, [
  { at: 0, pose: {} },
  { at: 0.2, ease: 'out', pose: { bodyX: -14, bodyRot: -10, torso: -8, head: 14, lShoulder: -34, lElbow: 30, rShoulder: -30, rElbow: 30, bodyY: 4 } },
  { at: 0.6, pose: { bodyX: -6, bodyRot: -4, torso: -3, head: 6 } },
  { at: 1, pose: {} },
]);

export const CELEBRATE_ANIM: MoveAnim = mk(1400, [
  { at: 0, pose: {} },
  { at: 0.2, ease: 'out', pose: { lShoulder: 158, lElbow: 8, rShoulder: 158, rElbow: 8, bodyY: -10, head: -8, scaleY: 1.06 } },
  { at: 0.4, pose: { lShoulder: 150, lElbow: 20, rShoulder: 150, rElbow: 20, bodyY: -2 } },
  { at: 0.6, pose: { lShoulder: 162, lElbow: 4, rShoulder: 162, rElbow: 4, bodyY: -12, scaleY: 1.08 } },
  { at: 0.8, pose: { lShoulder: 132, lElbow: 40, rShoulder: 132, rElbow: 40, bodyY: -4 } },
  { at: 1, pose: { lShoulder: 150, lElbow: 10, rShoulder: 150, rElbow: 10 } },
]);

export const DEFEAT_ANIM: MoveAnim = mk(1400, [
  { at: 0, pose: {} },
  { at: 0.3, ease: 'out', pose: { torso: 22, head: 24, bodyY: 12, scaleY: 0.86, lShoulder: -30, lElbow: 20, rShoulder: -30, rElbow: 20, lKnee: 20, rKnee: 20 } },
  { at: 0.7, pose: { torso: 18, head: 20, bodyY: 10, scaleY: 0.9 } },
  { at: 1, pose: { torso: 20, head: 22, bodyY: 11, scaleY: 0.88 } },
]);

/**
 * Idle groove pose driven purely by time (ms). Every dancer calls this every
 * frame when no move is playing, so they always look alive on the beat.
 * Two frequencies (a beat bounce + a slow breathing sway) give it an organic,
 * human weight-shift instead of a metronomic pulse.
 */
export function idlePose(timeMs: number, energy = 1, beatDuration = 550): Pose {
  const b = Math.sin((timeMs / beatDuration) * Math.PI * 2);
  const s = Math.sin(timeMs / 240);
  const c = Math.cos(timeMs / 300);
  const breathe = Math.sin(timeMs / 1400);
  const shift = Math.sin(timeMs / 1900);
  return {
    ...NEUTRAL,
    bodyY: -Math.abs(b) * 4 * energy + breathe * 1.2,
    bodyX: c * 2 * energy + shift * 2.5,
    bodyRot: s * 1.5 * energy + shift * 1.2,
    scaleY: 1 + Math.abs(b) * 0.015 * energy + breathe * 0.006,
    scaleX: 1 - Math.abs(b) * 0.008 * energy,
    torso: s * 3 * energy + breathe * 2,
    head: -s * 3 * energy + shift * 2,
    lShoulder: 10 + c * 10 * energy,
    rShoulder: 10 - c * 10 * energy,
    lElbow: 16 + Math.abs(s) * 12 * energy,
    rElbow: 16 + Math.abs(c) * 12 * energy,
    lHip: 4 + Math.abs(b) * 3 * energy,
    rHip: 4 + Math.abs(b) * 3 * energy,
    lKnee: 4 + Math.abs(b) * 5 * energy,
    rKnee: 4 + Math.abs(b) * 5 * energy,
  };
}

// ---------------------------------------------------------------------------
// Spring / damper solver
//
// Instead of snapping each joint straight to the sampled keyframe target, every
// joint is driven by a critically-damped (slightly under) spring. Distal joints
// (elbows, knees, head) have lower stiffness, so they lag behind the torso —
// this produces natural follow-through and overlap, the core of "human" motion.
// ---------------------------------------------------------------------------

export const POSE_KEYS = Object.keys(NEUTRAL) as (keyof Pose)[];

const BASE_STIFFNESS = 260;
const BASE_DAMPING = 30;
const MAX_STEP = 1 / 240;

/** Per-joint stiffness factor: lower = softer / more lag. */
export const JOINT_STIFFNESS: Record<keyof Pose, number> = {
  bodyX: 0.95,
  bodyY: 0.95,
  bodyRot: 0.9,
  scaleX: 1.1,
  scaleY: 1.1,
  torso: 1.0,
  head: 0.78,
  lShoulder: 0.72,
  rShoulder: 0.72,
  lElbow: 0.52,
  rElbow: 0.52,
  lHip: 0.82,
  rHip: 0.82,
  lKnee: 0.6,
  rKnee: 0.6,
};

/** Per-move stiffness multiplier — snap for robotic moves, soft for fluid ones. */
export const MOVE_STIFFNESS: Record<MoveId, number> = {
  pop: 1.7,
  lock: 1.45,
  point: 1.25,
  'wrist-twirl': 0.95,
  'stop-and-go': 1.35,
  'funky-chicken': 1.2,
  scoboot: 1.1,
  'floor-point': 1.12,
  'wrist-roll': 0.95,
  isolation: 0.85,
  waving: 0.8,
  tutting: 1.3,
  grabbing: 1.05,
  robot: 2.3,
  'dime-stop': 1.6,
  'body-wave': 0.78,
};

export const IDLE_STIFFNESS = 0.72;
export const MISS_STIFFNESS = 1.15;
export const SPECIAL_STIFFNESS = 0.9;

/**
 * Advance the pose one step toward `target` in place using sub-stepped springs.
 * `stiffnessMul` scales overall responsiveness for the current move.
 */
export function integratePose(
  current: Pose,
  vel: Pose,
  target: Pose,
  dtSeconds: number,
  stiffnessMul = 1,
): void {
  let remaining = Math.min(Math.max(dtSeconds, 0), 0.05);
  while (remaining > 0) {
    const step = Math.min(MAX_STEP, remaining);
    remaining -= step;
    for (let i = 0; i < POSE_KEYS.length; i += 1) {
      const key = POSE_KEYS[i];
      const f = JOINT_STIFFNESS[key] * stiffnessMul;
      const k = BASE_STIFFNESS * f;
      const c = BASE_DAMPING * Math.sqrt(f);
      const accel = (target[key] - current[key]) * k - vel[key] * c;
      vel[key] += accel * step;
      current[key] += vel[key] * step;
    }
  }
  // Keep squash/stretch and offsets within sane bounds.
  current.scaleX = clamp(current.scaleX, 0.6, 1.6);
  current.scaleY = clamp(current.scaleY, 0.6, 1.6);
}

/** Snap the solver to a pose (used on reset / round start). */
export function resetPose(current: Pose, vel: Pose, pose: Pose = NEUTRAL): void {
  POSE_KEYS.forEach((k) => {
    current[k] = pose[k];
    vel[k] = 0;
  });
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
