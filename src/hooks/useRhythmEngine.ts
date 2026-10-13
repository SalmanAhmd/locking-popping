import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Difficulty, JudgeEvent, MoveId, RoundConfig } from '../types/game';
import { BattleEngine, type RoundCompletePayload } from '../lib/gameEngine';
import type { AudioEngine } from '../lib/audioEngine';

export type FrameListener = (time: number, engine: BattleEngine) => void;

interface Options {
  config: RoundConfig;
  difficulty: Difficulty;
  audio: AudioEngine;
  onJudge?: (e: JudgeEvent) => void;
  onBeat?: (index: number, time: number) => void;
  onComplete?: (payload: RoundCompletePayload) => void;
}

/**
 * Owns the per-round BattleEngine and a single requestAnimationFrame loop.
 *
 * Visual components that need per-frame updates (prompt lane, dancers) can
 * subscribe with `addFrameListener` and mutate the DOM directly, so React does
 * not re-render on every beat.
 */
export function useRhythmEngine({ config, difficulty, audio, onJudge, onBeat, onComplete }: Options) {
  const engine = useMemo(
    () => new BattleEngine(config, difficulty, audio),
    [config, difficulty, audio],
  );
  const frameListeners = useRef(new Set<FrameListener>());
  const rafRef = useRef<number | null>(null);

  const cbs = useRef({ onJudge, onBeat, onComplete });
  cbs.current = { onJudge, onBeat, onComplete };

  useEffect(() => {
    const offJudge = engine.on('judge', (e) => cbs.current.onJudge?.(e));
    const offBeat = engine.on('beat', ({ index, time }) => cbs.current.onBeat?.(index, time));
    const offComplete = engine.on('complete', (p) => cbs.current.onComplete?.(p));
    return () => {
      offJudge();
      offBeat();
      offComplete();
    };
  }, [engine]);

  useEffect(() => {
    const loop = () => {
      engine.update();
      const t = engine.time;
      frameListeners.current.forEach((cb) => cb(t, engine));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const addFrameListener = useCallback((cb: FrameListener) => {
    frameListeners.current.add(cb);
    return () => frameListeners.current.delete(cb);
  }, []);

  const start = useCallback(() => engine.start(), [engine]);
  const pause = useCallback(() => engine.pause(), [engine]);
  const resume = useCallback(() => engine.resume(), [engine]);
  const stop = useCallback(() => engine.stop(), [engine]);
  const press = useCallback((move: MoveId) => engine.press(move), [engine]);

  return { engine, addFrameListener, start, pause, resume, stop, press };
}
