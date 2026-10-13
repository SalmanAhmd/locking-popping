import { describe, expect, it } from 'vitest';
import { BattleEngine } from './gameEngine';
import { ROUND_CONFIGS } from './danceMoves';
import type { AudioEngine } from './audioEngine';
import type { RoundCompletePayload } from './gameEngine';

/** Minimal deterministic clock standing in for the AudioEngine. */
class FakeAudio {
  t = 0;
  started = false;
  startSong() {
    this.started = true;
    this.t = -50;
  }
  stopSong() {
    this.started = false;
  }
  suspend() {}
  resumeClock() {}
  getSongTime() {
    return this.t;
  }
}

function makeEngine(round = 1) {
  const audio = new FakeAudio();
  const engine = new BattleEngine(ROUND_CONFIGS[round - 1], 'beginner', audio as unknown as AudioEngine);
  return { engine, audio };
}

describe('BattleEngine full round', () => {
  it('scores every note when hit perfectly on the beat', () => {
    const { engine, audio } = makeEngine(1);
    engine.start();
    for (const note of engine.notes) {
      audio.t = note.time;
      engine.update();
      engine.press(note.moveId);
    }
    expect(engine.playerStats.hits).toBe(engine.notes.length);
    expect(engine.playerStats.miss).toBe(0);
    expect(engine.playerStats.perfect).toBe(engine.notes.length);
    expect(engine.playerStats.score).toBeGreaterThan(0);
    expect(engine.playerStats.maxCombo).toBe(engine.notes.length);
  });

  it('auto-misses notes when the window passes', () => {
    const { engine, audio } = makeEngine(1);
    engine.start();
    const first = engine.notes[0];
    audio.t = first.time + engine.window.good + 1;
    engine.update();
    expect(engine.playerStats.miss).toBeGreaterThanOrEqual(1);
    expect(engine.playerStats.combo).toBe(0);
  });

  it('penalizes a wrong key while a note is live', () => {
    const { engine, audio } = makeEngine(1);
    engine.start();
    const first = engine.notes[0];
    const wrong = first.moveId === 'lock' ? 'pop' : 'lock';
    audio.t = first.time;
    engine.update();
    engine.press(wrong);
    expect(engine.playerStats.miss).toBe(1);
  });

  it('never scores during pause', () => {
    const { engine, audio } = makeEngine(1);
    engine.start();
    engine.pause();
    audio.t = engine.notes[0].time;
    engine.press(engine.notes[0].moveId);
    engine.update();
    expect(engine.playerStats.hits).toBe(0);
    engine.resume();
    engine.press(engine.notes[0].moveId);
    expect(engine.playerStats.hits).toBe(1);
  });

  it('completes exactly once after all notes resolve', () => {
    const { engine, audio } = makeEngine(1);
    let completes = 0;
    engine.on('complete', (_p: RoundCompletePayload) => {
      completes += 1;
    });
    engine.start();
    for (const note of engine.notes) {
      audio.t = note.time;
      engine.update();
      engine.press(note.moveId);
    }
    audio.t = engine.songDuration + 2000;
    engine.update();
    engine.update();
    expect(completes).toBe(1);
    expect(engine.isFinished).toBe(true);
  });

  it('gives the AI an independent score using the same rules', () => {
    const { engine, audio } = makeEngine(1);
    engine.start();
    // Run the whole round letting the AI resolve naturally, ignoring the player.
    for (const note of engine.notes) {
      audio.t = note.time;
      engine.update();
    }
    audio.t = engine.songDuration + 2000;
    engine.update();
    expect(engine.aiStats.hits + engine.aiStats.miss).toBe(engine.aiNotes.length);
    expect(engine.aiStats.score).toBeGreaterThanOrEqual(0);
  });
});
