import type {
  Difficulty,
  JudgeEvent,
  MoveId,
  Note,
  RoundConfig,
  SideStats,
} from '../types/game';
import { BASE_WINDOW, DANCE_MOVES } from './danceMoves';
import { aiMovePoolFor, pickAIMove, rollAIGrade } from './aiOpponent';
import { audioEngine, AudioEngine } from './audioEngine';
import {
  applyJudgement,
  createStats,
  gradeForDelta,
  roundOver,
  scaledWindow,
} from './scoring';
import type { TimingGrade, TimingWindow } from '../types/game';

export interface RoundCompletePayload {
  config: RoundConfig;
  playerStats: SideStats;
  aiStats: SideStats;
  cleanPlayer: boolean;
  cleanAI: boolean;
}

interface EngineEventMap {
  judge: JudgeEvent;
  beat: { index: number; time: number };
  complete: RoundCompletePayload;
}

type Listener<K extends keyof EngineEventMap> = (payload: EngineEventMap[K]) => void;

const LEAD_IN_BEATS = 2;

/**
 * BattleEngine — deterministic rhythm/game logic for a single round.
 *
 * It is intentionally framework-agnostic: React only reads its public state
 * on discrete events (a note being judged) and drives `update()` from a single
 * requestAnimationFrame loop. Time always comes from the AudioEngine clock so
 * prompts stay locked to the music.
 */
export class BattleEngine {
  readonly config: RoundConfig;
  readonly difficulty: Difficulty;
  readonly window: TimingWindow;
  readonly beatDuration: number;
  readonly notes: Note[];
  readonly aiNotes: Note[];

  playerStats: SideStats;
  aiStats: SideStats;

  private pIdx = 0;
  private aIdx = 0;
  private lastBeat = -1;
  private running = false;
  private paused = false;
  private finished = false;
  private endTime = 0;
  private listeners: { [K in keyof EngineEventMap]: Set<Listener<K>> } = {
    judge: new Set(),
    beat: new Set(),
    complete: new Set(),
  };
  private audio: AudioEngine;

  constructor(config: RoundConfig, difficulty: Difficulty, audio: AudioEngine = audioEngine) {
    this.config = config;
    this.difficulty = difficulty;
    this.audio = audio;
    this.window = scaledWindow(BASE_WINDOW, config.windowScale);
    this.beatDuration = 60000 / config.bpm;
    this.notes = generateRoutine(config, 'player');
    this.aiNotes = generateRoutine(config, 'ai');

    this.playerStats = createStats(this.notes.length);
    this.aiStats = createStats(this.aiNotes.length);

    const lastTime = Math.max(
      this.notes[this.notes.length - 1]?.time ?? 0,
      this.aiNotes[this.aiNotes.length - 1]?.time ?? 0,
    );
    this.endTime = lastTime + 1500;
  }

  on<K extends keyof EngineEventMap>(event: K, cb: Listener<K>): () => void {
    this.listeners[event].add(cb as Listener<never> as Listener<K>);
    return () => this.listeners[event].delete(cb as Listener<never> as Listener<K>);
  }

  private emit<K extends keyof EngineEventMap>(event: K, payload: EngineEventMap[K]) {
    this.listeners[event].forEach((cb) => (cb as Listener<K>)(payload));
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get isFinished(): boolean {
    return this.finished;
  }

  get time(): number {
    return this.audio.getSongTime();
  }

  get songDuration(): number {
    return this.endTime;
  }

  get currentPlayerNote(): Note | null {
    return !this.finished && this.pIdx < this.notes.length ? this.notes[this.pIdx] : null;
  }

  start() {
    if (this.running) {
      this.paused = false;
      return;
    }
    this.running = true;
    this.paused = false;
    this.audio.startSong(this.config.bpm);
  }

  pause() {
    if (!this.running || this.paused || this.finished) return;
    this.paused = true;
    this.audio.suspend();
  }

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.audio.resumeClock();
  }

  stop() {
    this.running = false;
    this.paused = false;
    this.audio.stopSong();
  }

  /** Advance one frame. Called from a single rAF loop. */
  update() {
    if (!this.running || this.paused || this.finished) return;
    const t = this.time;
    if (t < 0) return;

    const beatIndex = Math.floor(t / this.beatDuration);
    if (beatIndex !== this.lastBeat && beatIndex >= 0) {
      this.lastBeat = beatIndex;
      this.emit('beat', { index: beatIndex, time: t });
    }

    while (this.pIdx < this.notes.length && this.notes[this.pIdx].judged) this.pIdx += 1;
    if (this.pIdx < this.notes.length) {
      const n = this.notes[this.pIdx];
      if (t > n.time + this.window.good) {
        this.judgePlayer(n, 'miss', null);
      }
    }

    while (this.aIdx < this.aiNotes.length && this.aiNotes[this.aIdx].judged) this.aIdx += 1;
    if (this.aIdx < this.aiNotes.length) {
      const n = this.aiNotes[this.aIdx];
      if (t >= n.time) this.resolveAINote(n);
    }

    const playersDone = this.pIdx >= this.notes.length;
    const aiDone = this.aIdx >= this.aiNotes.length;
    if (playersDone && aiDone && t > this.endTime) this.finish();
  }

  /**
   * Real keyboard input routed to the current player note.
   * Returns whether the press scored ("judged") or was ignored, so the UI can
   * still play a free-expression animation for non-scoring presses.
   */
  press(moveId: MoveId): 'judged' | 'ignored' {
    if (!this.running || this.paused || this.finished) return 'ignored';
    const t = this.time;
    if (t < 0) return 'ignored';

    while (this.pIdx < this.notes.length && this.notes[this.pIdx].judged) this.pIdx += 1;
    if (this.pIdx >= this.notes.length) return 'ignored';
    const n = this.notes[this.pIdx];

    if (!n.freestyle && moveId !== n.moveId) {
      // Wrong key: only penalized if the note is live.
      if (Math.abs(t - n.time) <= this.window.good) {
        this.judgePlayer(n, 'miss', null);
        return 'judged';
      }
      return 'ignored';
    }

    // Too early — ignore so mashing doesn't shred the combo.
    if (t < n.time - this.window.good) return 'ignored';

    const delta = t - n.time;
    const grade = gradeForDelta(delta, this.window);
    this.judgePlayer(n, grade, delta);
    return 'judged';
  }

  private judgePlayer(n: Note, grade: TimingGrade, delta: number | null) {
    if (n.judged) return;
    n.judged = true;
    n.grade = grade;
    const res = applyJudgement(this.playerStats, grade, delta);
    const beat = grade === 'perfect' || (grade !== 'miss' && delta != null && Math.abs(delta) <= this.window.perfect);
    this.emit('judge', {
      side: 'player',
      moveId: n.moveId,
      grade,
      delta,
      points: res.points,
      combo: res.combo,
      multiplier: res.multiplier,
      beat,
      freestyle: n.freestyle,
    });
    this.pIdx += 1;
  }

  private resolveAINote(n: Note) {
    if (n.judged) return;
    n.judged = true;
    const grade = rollAIGrade(this.difficulty, this.config.round, Math.random);
    n.grade = grade;
    const res = applyJudgement(this.aiStats, grade, null);
    this.emit('judge', {
      side: 'ai',
      moveId: n.moveId,
      grade,
      delta: null,
      points: res.points,
      combo: res.combo,
      multiplier: res.multiplier,
      beat: grade === 'perfect' || grade === 'great',
      freestyle: n.freestyle,
    });
    this.aIdx += 1;
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    this.audio.stopSong();

    const cleanPlayer = this.playerStats.miss === 0;
    const cleanAI = this.aiStats.miss === 0;
    roundOver(this.playerStats, true);
    roundOver(this.aiStats, false);

    this.emit('complete', {
      config: this.config,
      playerStats: this.playerStats,
      aiStats: this.aiStats,
      cleanPlayer,
      cleanAI,
    });
  }
}

/**
 * Generate a note sequence. The player and AI share the same timing grid so
 * the battle feels synchronized, but each picks moves from its own pool.
 */
export function generateRoutine(config: RoundConfig, side: 'player' | 'ai'): Note[] {
  const beatDuration = 60000 / config.bpm;
  const pool = side === 'ai' ? aiMovePoolFor(config.round, config.pool) : config.pool;
  const count = config.noteCount;
  const freestyleStart = config.freestyleCount > 0 ? count - config.freestyleCount : count;

  const notes: Note[] = [];
  let prev: MoveId | undefined;
  for (let i = 0; i < count; i += 1) {
    let moveId: MoveId;
    if (side === 'ai') {
      moveId = pickAIMove(pool, config.round, Math.random, prev);
    } else {
      moveId = pickMoveFatigued(pool, prev, i);
    }
    prev = moveId;
    const isFreestyle = i >= freestyleStart;
    notes.push({
      id: i,
      moveId,
      time: Math.round((LEAD_IN_BEATS + i * config.intervalBeats) * beatDuration),
      beat: LEAD_IN_BEATS + i * config.intervalBeats,
      freestyle: isFreestyle,
      judged: false,
    });
  }
  return notes;
}

/** Player move selection: avoid long repeats, ease into harder moves. */
function pickMoveFatigued(pool: MoveId[], prev: MoveId | undefined, index: number): MoveId {
  let candidates = pool;
  if (index < 4 && pool.length > 4) {
    candidates = pool.filter((id) => DANCE_MOVES[id].difficulty <= 2);
    if (candidates.length === 0) candidates = pool;
  }
  let pick = candidates[Math.floor(Math.random() * candidates.length)];
  let guard = 0;
  while (prev && pick === prev && candidates.length > 1 && guard < 6) {
    pick = candidates[Math.floor(Math.random() * candidates.length)];
    guard += 1;
  }
  return pick;
}
