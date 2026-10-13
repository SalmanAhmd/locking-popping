import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Difficulty, MoveId, RoundConfig, TimingGrade } from '../types/game';
import { BattleHUD } from './BattleHUD';
import { Dancer, type DancerHandle } from './Dancer';
import { KeyHints } from './KeyHints';
import { MovePromptLane } from './MovePromptLane';
import { StageBackdrop } from './StageBackdrop';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useRhythmEngine } from '../hooks/useRhythmEngine';
import type { RoundCompletePayload } from '../lib/gameEngine';
import { audioEngine } from '../lib/audioEngine';
import { AI_PROFILES } from '../lib/aiOpponent';
import { DANCE_MOVES, codeToLabel } from '../lib/danceMoves';
import { moveCodeMap } from '../lib/settings';

interface Props {
  config: RoundConfig;
  difficulty: Difficulty;
  keymap: Record<string, MoveId>;
  reducedMotion: boolean;
  paused: boolean;
  onRoundComplete: (payload: RoundCompletePayload) => void;
  onRequestPause: () => void;
}

const PLAYER_ACCENT = '#22d3ee';
const PLAYER_COLORS = { primary: '#22d3ee', secondary: '#b6ff3c', glow: '#22d3ee' };

const GRADE_META: Record<TimingGrade, { label: string; color: string; icon: string }> = {
  perfect: { label: 'PERFECT', color: '#b6ff3c', icon: '★' },
  great: { label: 'GREAT', color: '#22d3ee', icon: '✦' },
  good: { label: 'GOOD', color: '#a855f7', icon: '●' },
  miss: { label: 'MISS', color: '#ff2d95', icon: '✕' },
};

export function BattleArena({
  config,
  difficulty,
  keymap,
  reducedMotion,
  paused,
  onRoundComplete,
  onRequestPause,
}: Props) {
  const playerDancer = useRef<DancerHandle | null>(null);
  const aiDancer = useRef<DancerHandle | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  const profile = AI_PROFILES[difficulty];
  const codes = useMemo(() => moveCodeMap(keymap), [keymap]);

  const [hud, setHud] = useState({
    pScore: 0,
    aScore: 0,
    pCombo: 0,
    aCombo: 0,
    currentIndex: 0,
    grade: null as TimingGrade | null,
    gradeNonce: 0,
    points: 0,
    multiplier: 1,
  });
  const [pressed, setPressed] = useState<MoveId | null>(null);
  const [reaction, setReaction] = useState<{ text: string; nonce: number } | null>(null);
  const reactionNonce = useRef(0);

  const flash = useCallback(() => {
    const el = flashRef.current;
    if (!el || reducedMotion) return;
    el.animate([{ opacity: 0.65 }, { opacity: 0 }], { duration: 240, easing: 'ease-out' });
  }, [reducedMotion]);

  const { engine, addFrameListener, start, pause, resume, press } = useRhythmEngine({
    config,
    difficulty,
    audio: audioEngine,
    onJudge: (e) => {
      if (e.side === 'player') {
        playerDancer.current?.playMove(e.moveId, e.grade);
        playerDancer.current?.setEnergy(1 + Math.min(e.combo, 20) * 0.03);
        if (e.grade === 'miss') {
          audioEngine.playSfx('miss');
          const taunt = profile.taunts[Math.floor(Math.random() * profile.taunts.length)];
          reactionNonce.current += 1;
          setReaction({ text: taunt, nonce: reactionNonce.current });
        } else {
          audioEngine.playSfx(e.grade === 'perfect' ? 'pop-hit' : 'key-press');
          if (e.grade === 'perfect') flash();
        }
        if (e.combo > 0 && e.combo % 5 === 0) audioEngine.playSfx('combo');
        setHud((h) => ({
          ...h,
          pScore: engine.playerStats.score,
          pCombo: engine.playerStats.combo,
          currentIndex: engine.currentPlayerNote?.id ?? engine.notes.length,
          grade: e.grade,
          gradeNonce: h.gradeNonce + 1,
          points: e.points,
          multiplier: e.multiplier,
        }));
      } else {
        aiDancer.current?.playMove(e.moveId, e.grade);
        aiDancer.current?.setEnergy(1 + Math.min(e.combo, 20) * 0.03);
        setHud((h) => ({
          ...h,
          aScore: engine.aiStats.score,
          aCombo: engine.aiStats.combo,
        }));
      }
    },
    onBeat: (index) => {
      const pulse = ringRef.current;
      if (pulse && !reducedMotion) {
        const strong = index % 4 === 0;
        pulse.animate(
          [
            { transform: `scale(${strong ? 0.75 : 0.85})`, opacity: strong ? 0.5 : 0.28 },
            { transform: 'scale(1.15)', opacity: 0 },
          ],
          { duration: strong ? 420 : 300, easing: 'ease-out' },
        );
      }
      if (index % 8 === 0 && index > 0) audioEngine.playSfx('crowd');
    },
    onComplete: (payload) => {
      const playerWon = payload.playerStats.score >= payload.aiStats.score;
      if (playerWon) {
        playerDancer.current?.celebrate();
        aiDancer.current?.defeat();
      } else {
        aiDancer.current?.celebrate();
        playerDancer.current?.defeat();
      }
      onRoundComplete(payload);
    },
  });

  // Start the round on mount.
  useEffect(() => {
    start();
    return () => pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause / resume wiring.
  useEffect(() => {
    if (paused) {
      pause();
      playerDancer.current?.setPaused(true);
      aiDancer.current?.setPaused(true);
    } else {
      resume();
      playerDancer.current?.setPaused(false);
      aiDancer.current?.setPaused(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const handleMove = useCallback(
    (move: MoveId) => {
      if (paused) return;
      audioEngine.playSfx('key-press');
      const outcome = press(move);
      if (outcome === 'ignored') playerDancer.current?.playMove(move, 'good');
      setPressed(move);
      window.setTimeout(() => setPressed((p) => (p === move ? null : p)), 130);
    },
    [paused, press],
  );

  useKeyboardControls({
    enabled: !paused,
    keymap,
    onMove: handleMove,
    onEscape: onRequestPause,
  });

  const currentMove = engine.notes[Math.min(hud.currentIndex, engine.notes.length - 1)];
  const currentMoveDef = currentMove ? DANCE_MOVES[currentMove.moveId] : null;
  const isFreestyle = currentMove?.freestyle ?? false;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <StageBackdrop accent={config.accent} intensity={config.round === 3 ? 1.2 : 1} />

      {/* Beat pulse ring */}
      <div
        ref={ringRef}
        className="pointer-events-none absolute left-1/2 top-[52%] h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 opacity-0"
        style={{ borderColor: config.accent, boxShadow: `0 0 40px ${config.accent}` }}
      />

      <div className="relative z-20 flex h-full flex-col">
        <BattleHUD
          playerName="YOU"
          aiName={profile.name}
          aiSubtitle={profile.subtitle}
          playerScore={hud.pScore}
          aiScore={hud.aScore}
          playerCombo={hud.pCombo}
          aiCombo={hud.aCombo}
          round={config.round}
          totalRounds={3}
          roundName={config.name}
          songDuration={engine.songDuration}
          addFrameListener={addFrameListener}
          playerAccent={PLAYER_ACCENT}
          aiAccent={profile.colors.primary}
        />

        {/* Dancers */}
        <div className="relative flex flex-1 items-end justify-between gap-1 px-1 pb-1 sm:px-8">
          <div className="relative h-[34vh] w-[38%] max-w-[320px] sm:h-[42vh]">
            <DancerBanner name="YOU" accent={PLAYER_ACCENT} align="left" />
            <Dancer ref={playerDancer} colors={PLAYER_COLORS} skin="#eab98f" reducedMotion={reducedMotion} />
            <StagePlate accent={PLAYER_ACCENT} />
          </div>

          <div className="pointer-events-none relative flex h-[34vh] flex-col items-center justify-center sm:h-[42vh]">
            <motion.span
              animate={
                reducedMotion
                  ? {}
                  : { scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }
              }
              transition={{ duration: 1.2, repeat: Infinity }}
              className="font-display text-4xl text-white text-outline neon-text sm:text-6xl"
              style={{ color: config.accent }}
            >
              VS
            </motion.span>
            <AnimatePresence>
              {reaction && (
                <motion.div
                  key={reaction.nonce}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onAnimationComplete={() => {
                    const nonce = reaction.nonce;
                    window.setTimeout(
                      () => setReaction((r) => (r && r.nonce === nonce ? null : r)),
                      1400,
                    );
                  }}
                  className="absolute bottom-1 left-1/2 w-40 -translate-x-1/2 -translate-x-1/2 rounded-md border px-2 py-1 text-center text-[11px] font-semibold uppercase"
                  style={{ borderColor: profile.colors.primary, color: profile.colors.primary }}
                >
                  {profile.name}: {reaction.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative h-[34vh] w-[38%] max-w-[320px] sm:h-[42vh]">
            <DancerBanner name={profile.name} accent={profile.colors.primary} align="right" />
            <Dancer
              ref={aiDancer}
              colors={profile.colors}
              skin="#c98a5e"
              flip
              reducedMotion={reducedMotion}
            />
            <StagePlate accent={profile.colors.primary} />
          </div>
        </div>

        {/* Bottom: feedback + prompts + key map */}
        <div className="relative z-20 space-y-2 px-2 pb-3 sm:px-4">
          <div className="flex items-center justify-center gap-3">
            <AnimatePresence mode="popLayout">
              {hud.grade && (
                <motion.div
                  key={hud.gradeNonce}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className="font-display text-3xl sm:text-5xl"
                    style={{ color: GRADE_META[hud.grade].color }}
                  >
                    {GRADE_META[hud.grade].label}
                  </span>
                  {hud.grade !== 'miss' && (
                    <span className="font-display text-lg text-white/70 sm:text-2xl">
                      +{hud.points}
                      {hud.multiplier > 1 && (
                        <span className="ml-1 text-sm" style={{ color: PLAYER_ACCENT }}>
                          x{hud.multiplier.toFixed(2)}
                        </span>
                      )}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
              {isFreestyle ? 'Freestyle — any move!' : 'Next move'}
            </span>
            {currentMoveDef && (
              <span
                className="flex items-center gap-2 font-display text-lg uppercase tracking-wide sm:text-2xl"
                style={{ color: currentMoveDef.color }}
              >
                <span>{currentMoveDef.icon}</span>
                {currentMoveDef.name}
                <span className="keycap" style={{ color: currentMoveDef.color }}>
                  {codes[currentMoveDef.id] ? codeToLabel(codes[currentMoveDef.id]!) : '—'}
                </span>
              </span>
            )}
          </div>

          <MovePromptLane
            notes={engine.notes}
            currentIndex={hud.currentIndex}
            addFrameListener={addFrameListener}
            beatDuration={engine.beatDuration}
            keymap={keymap}
            reducedMotion={reducedMotion}
            accent={config.accent}
          />

          <KeyHints keymap={keymap} activeMove={currentMoveDef?.id ?? null} pressedMove={pressed} />
        </div>
      </div>

      {/* Impact flash */}
      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 z-40 bg-white opacity-0"
      />
    </div>
  );
}

function StagePlate({ accent }: { accent: string }) {
  return (
    <div
      className="pointer-events-none absolute bottom-0 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-[50%] border-t"
      style={{ borderColor: accent, boxShadow: `0 0 30px ${accent}66`, background: `${accent}18` }}
    />
  );
}

function DancerBanner({
  name,
  accent,
  align,
}: {
  name: string;
  accent: string;
  align: 'left' | 'right';
}) {
  return (
    <span
      className={`absolute top-0 ${
        align === 'left' ? 'left-2' : 'right-2'
      } z-10 font-display text-xs uppercase tracking-[0.3em]`}
      style={{ color: accent }}
    >
      {name}
    </span>
  );
}
