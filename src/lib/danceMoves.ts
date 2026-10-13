import type { DanceMove, DanceStyle, MoveId, RoundConfig } from '../types/game';

export const DANCE_MOVES: Record<MoveId, DanceMove> = {
  // ---------------- LOCKING ----------------
  lock: {
    id: 'lock',
    name: 'Lock',
    style: 'locking',
    defaultCode: 'Space',
    icon: '🔒',
    tutorial:
      'Snap into a clean freeze pose and hold it for a beat. The signature "lock" — freeze hard, then release.',
    difficulty: 1,
    baseScore: 100,
    color: '#b6ff3c',
  },
  point: {
    id: 'point',
    name: 'Point',
    style: 'locking',
    defaultCode: 'ArrowLeft',
    icon: '👉',
    tutorial: 'Shoot one arm out to full extension, pointing at the crowd. Accent it on the beat.',
    difficulty: 1,
    baseScore: 100,
    color: '#22d3ee',
  },
  'wrist-twirl': {
    id: 'wrist-twirl',
    name: 'Wrist Twirl',
    style: 'locking',
    defaultCode: 'ArrowUp',
    icon: '🌀',
    tutorial: 'Twirl the wrists in a tight circle, then lock the arms clean. Classic lock detail.',
    difficulty: 2,
    baseScore: 110,
    color: '#a855f7',
  },
  'stop-and-go': {
    id: 'stop-and-go',
    name: 'Stop-and-Go',
    style: 'locking',
    defaultCode: 'ArrowRight',
    icon: '⏸️',
    tutorial: 'Move, freeze, move, freeze. Pendulum rhythm — the "go" powers the "stop".',
    difficulty: 2,
    baseScore: 110,
    color: '#ff2d95',
  },
  'funky-chicken': {
    id: 'funky-chicken',
    name: 'Funky Chicken',
    style: 'locking',
    defaultCode: 'KeyG',
    icon: '🐔',
    tutorial: 'Elbows tucked, forearms flap like wings. Goofy, funky and full of attitude.',
    difficulty: 2,
    baseScore: 110,
    color: '#ffb020',
  },
  scoboot: {
    id: 'scoboot',
    name: 'Scoobot',
    style: 'locking',
    defaultCode: 'KeyH',
    icon: '🎩',
    tutorial: 'Scoot the feet while the hands tip an invisible hat. A smooth travelling lock.',
    difficulty: 3,
    baseScore: 120,
    color: '#b6ff3c',
  },
  'floor-point': {
    id: 'floor-point',
    name: 'Floor Point',
    style: 'locking',
    defaultCode: 'KeyB',
    icon: '👇',
    tutorial: 'Drop low and point hard at the floor. Big level change on the accent.',
    difficulty: 3,
    baseScore: 120,
    color: '#22d3ee',
  },
  'wrist-roll': {
    id: 'wrist-roll',
    name: 'Wrist Roll',
    style: 'locking',
    defaultCode: 'KeyN',
    icon: '🔄',
    tutorial: 'Sweeping wrist rolls into a crisp lock. Keep the elbows loose, finish sharp.',
    difficulty: 3,
    baseScore: 120,
    color: '#a855f7',
  },

  // ---------------- POPPING ----------------
  pop: {
    id: 'pop',
    name: 'Pop / Hit',
    style: 'popping',
    defaultCode: 'KeyJ',
    icon: '💥',
    tutorial:
      'Sharp muscle contraction synchronized with the beat. Hit it hard, release instantly — that snap is the pop.',
    difficulty: 1,
    baseScore: 100,
    color: '#ff2d95',
  },
  isolation: {
    id: 'isolation',
    name: 'Isolation',
    style: 'popping',
    defaultCode: 'KeyA',
    icon: '🧊',
    tutorial: 'Move ONE body part while the rest stays frozen. Head, shoulder or chest only.',
    difficulty: 1,
    baseScore: 100,
    color: '#22d3ee',
  },
  waving: {
    id: 'waving',
    name: 'Waving',
    style: 'popping',
    defaultCode: 'KeyS',
    icon: '🌊',
    tutorial: 'A fluid wave travels through fingers, wrists, elbows, shoulders and torso. Keep it continuous.',
    difficulty: 2,
    baseScore: 110,
    color: '#a855f7',
  },
  tutting: {
    id: 'tutting',
    name: 'Tutting',
    style: 'popping',
    defaultCode: 'KeyD',
    icon: '📐',
    tutorial: 'Angular geometric arms and hands — right angles, boxes and Egyptian shapes.',
    difficulty: 3,
    baseScore: 120,
    color: '#b6ff3c',
  },
  grabbing: {
    id: 'grabbing',
    name: 'Grabbing',
    style: 'popping',
    defaultCode: 'KeyF',
    icon: '✊',
    tutorial: 'Reach out, grab an invisible object, pull it back and place it. Sell the illusion.',
    difficulty: 2,
    baseScore: 110,
    color: '#ffb020',
  },
  robot: {
    id: 'robot',
    name: 'Robot',
    style: 'popping',
    defaultCode: 'KeyK',
    icon: '🤖',
    tutorial: 'Mechanical, segmented movement. Stop at every joint like a machine.',
    difficulty: 3,
    baseScore: 120,
    color: '#22d3ee',
  },
  'dime-stop': {
    id: 'dime-stop',
    name: 'Dime Stop',
    style: 'popping',
    defaultCode: 'KeyL',
    icon: '🛑',
    tutorial: 'Full-speed motion into a sudden, precise stop on a dime. Control is everything.',
    difficulty: 3,
    baseScore: 120,
    color: '#ff2d95',
  },
  'body-wave': {
    id: 'body-wave',
    name: 'Body Wave',
    style: 'popping',
    defaultCode: 'ArrowDown',
    icon: '🎏',
    tutorial: 'A smooth wave rolls through the torso from head to hips. Keep the spine rolling.',
    difficulty: 2,
    baseScore: 110,
    color: '#a855f7',
  },
};

export const ALL_MOVES: DanceMove[] = Object.values(DANCE_MOVES);

export const MOVES_BY_STYLE: Record<DanceStyle, DanceMove[]> = {
  locking: ALL_MOVES.filter((m) => m.style === 'locking'),
  popping: ALL_MOVES.filter((m) => m.style === 'popping'),
};

export const DEFAULT_KEYMAP: Record<string, MoveId> = ALL_MOVES.reduce(
  (acc, m) => {
    acc[m.defaultCode] = m.id;
    return acc;
  },
  {} as Record<string, MoveId>,
);

const KEY_LABELS: Record<string, string> = {
  Space: 'SPACE',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Enter: 'ENTER',
  Escape: 'ESC',
};

export function codeToLabel(code: string): string {
  if (!code) return '—';
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'N' + code.slice(6);
  return code.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
}

const R1_POOL: MoveId[] = ['isolation', 'waving', 'lock', 'pop', 'point', 'body-wave'];
const R2_POOL: MoveId[] = [
  'lock',
  'point',
  'wrist-twirl',
  'stop-and-go',
  'isolation',
  'waving',
  'tutting',
  'grabbing',
  'robot',
  'body-wave',
  'dime-stop',
  'wrist-roll',
];
const R3_POOL: MoveId[] = ALL_MOVES.map((m) => m.id);

export const ROUND_CONFIGS: RoundConfig[] = [
  {
    round: 1,
    name: 'FOUNDATION',
    theme: 'Basic rhythm & control. Find the beat, own the basics.',
    bpm: 88,
    intervalBeats: 1.25,
    pool: R1_POOL,
    noteCount: 20,
    windowScale: 1.5,
    aiAccuracy: 0.6,
    freestyleCount: 0,
    accent: '#22d3ee',
  },
  {
    round: 2,
    name: 'TECHNICAL FLOW',
    theme: 'Precision, transitions & combinations. Chain your moves.',
    bpm: 100,
    intervalBeats: 1,
    pool: R2_POOL,
    noteCount: 28,
    windowScale: 1.32,
    aiAccuracy: 0.74,
    freestyleCount: 0,
    accent: '#a855f7',
  },
  {
    round: 3,
    name: 'FINAL SHOWDOWN',
    theme: 'Freestyle & performance. Face GLITCH at full power.',
    bpm: 112,
    intervalBeats: 1,
    pool: R3_POOL,
    noteCount: 34,
    windowScale: 1.18,
    aiAccuracy: 0.86,
    freestyleCount: 10,
    accent: '#ff2d95',
  },
];

// Base timing windows (ms) at scale 1.0. Configurable in one place.
export const BASE_WINDOW = { perfect: 80, great: 160, good: 260 };

export const MAX_ROUNDS = 3;
export const TOTAL_LIVES = 1;
