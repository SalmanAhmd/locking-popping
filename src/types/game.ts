export type DanceStyle = 'locking' | 'popping';

export type MoveId =
  | 'lock'
  | 'point'
  | 'wrist-twirl'
  | 'stop-and-go'
  | 'funky-chicken'
  | 'scoboot'
  | 'floor-point'
  | 'wrist-roll'
  | 'isolation'
  | 'waving'
  | 'tutting'
  | 'grabbing'
  | 'pop'
  | 'robot'
  | 'dime-stop'
  | 'body-wave';

export interface DanceMove {
  id: MoveId;
  name: string;
  style: DanceStyle;
  /** Default keyboard code, e.g. "KeyA" / "ArrowLeft" / "Space". */
  defaultCode: string;
  icon: string;
  tutorial: string;
  /** 1 (easy) to 5 (hard). */
  difficulty: number;
  /** Base scoring weight used by the scoring module. */
  baseScore: number;
  color: string;
}

export type TimingGrade = 'perfect' | 'great' | 'good' | 'miss';

export type Side = 'player' | 'ai';

export interface TimingWindow {
  perfect: number;
  great: number;
  good: number;
}

export interface RoundConfig {
  round: 1 | 2 | 3;
  name: string;
  theme: string;
  bpm: number;
  /** Notes are placed every `intervalBeats` beats. */
  intervalBeats: number;
  pool: MoveId[];
  noteCount: number;
  /** Multiplies the base timing windows (>1 = more forgiving). */
  windowScale: number;
  aiAccuracy: number;
  /** Number of trailing freestyle notes (round 3 only). */
  freestyleCount: number;
  accent: string;
}

export interface Note {
  id: number;
  moveId: MoveId;
  /** Absolute time in ms from song start. */
  time: number;
  beat: number;
  freestyle: boolean;
  judged: boolean;
  grade?: TimingGrade;
}

export interface SideStats {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  hits: number;
  totalNotes: number;
  /** Sum of |timing delta| in ms for hits (for accuracy). */
  timingSum: number;
  timedNotes: number;
  roundScores: number[];
  roundMaxCombos: number[];
}

export interface RoundResult {
  round: number;
  playerScore: number;
  aiScore: number;
  playerStats: SideStats;
  aiStats: SideStats;
  cleanFlowPlayer: boolean;
  cleanFlowAI: boolean;
}

export interface JudgeEvent {
  side: Side;
  moveId: MoveId;
  grade: TimingGrade;
  delta: number | null;
  points: number;
  combo: number;
  multiplier: number;
  beat: boolean;
  freestyle: boolean;
}

export type GamePhase =
  | 'menu'
  | 'howto'
  | 'library'
  | 'settings'
  | 'practice'
  | 'roundIntro'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'roundResults'
  | 'finalResults';

export type Difficulty = 'beginner' | 'intermediate' | 'expert';

export interface MatchSummary {
  playerTotal: number;
  aiTotal: number;
  rounds: RoundResult[];
  outcome: 'victory' | 'defeat' | 'draw';
  playerGrade: string;
}
