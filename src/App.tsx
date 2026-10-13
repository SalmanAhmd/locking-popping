import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GamePhase, RoundResult } from './types/game';
import { ROUND_CONFIGS } from './lib/danceMoves';
import { audioEngine } from './lib/audioEngine';
import { loadSettings, saveSettings, type GameSettings } from './lib/settings';
import { MainMenu } from './components/MainMenu';
import { HowToPlay } from './components/HowToPlay';
import { MoveLibrary } from './components/MoveLibrary';
import { SettingsPanel } from './components/SettingsPanel';
import { PracticeMode } from './components/PracticeMode';
import { RoundIntro } from './components/RoundIntro';
import { ReadyCountdown } from './components/ReadyCountdown';
import { BattleArena } from './components/BattleArena';
import { PauseMenu } from './components/PauseMenu';
import { RoundResults } from './components/RoundResults';
import { ResultsScreen } from './components/ResultsScreen';
import { StageBackdrop } from './components/StageBackdrop';
import type { RoundCompletePayload } from './lib/gameEngine';

export default function App() {
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [overlay, setOverlay] = useState<'library' | 'settings' | null>(null);
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<RoundResult[]>([]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const pendingRef = useRef<number | null>(null);

  const clearPending = useCallback(() => {
    if (pendingRef.current != null) {
      window.clearTimeout(pendingRef.current);
      pendingRef.current = null;
    }
  }, []);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // Apply audio + accessibility settings.
  useEffect(() => {
    audioEngine.setMusicVolume(settings.musicVolume);
    audioEngine.setSfxVolume(settings.sfxVolume);
    audioEngine.setMuted(settings.muted);
    document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
  }, [settings]);

  // Initialise the AudioContext on first user gesture.
  useEffect(() => {
    const init = () => {
      void audioEngine.init().then(() => {
        const s = settingsRef.current;
        audioEngine.setMusicVolume(s.musicVolume);
        audioEngine.setSfxVolume(s.sfxVolume);
        audioEngine.setMuted(s.muted);
      });
    };
    window.addEventListener('pointerdown', init, { once: true });
    window.addEventListener('keydown', init, { once: true });
    return () => {
      window.removeEventListener('pointerdown', init);
      window.removeEventListener('keydown', init);
    };
  }, []);

  // Lock page scroll during the arena.
  useEffect(() => {
    const lock = phase === 'playing' || phase === 'paused' || phase === 'roundIntro' || phase === 'ready';
    document.body.dataset.noScroll = String(lock);
    return () => {
      document.body.dataset.noScroll = 'false';
    };
  }, [phase]);

  useEffect(() => () => clearPending(), [clearPending]);

  const startBattle = useCallback(() => {
    audioEngine.playSfx('ui-confirm');
    clearPending();
    setResults([]);
    setRound(1);
    setOverlay(null);
    setPhase('roundIntro');
  }, [clearPending]);

  const quitToMenu = useCallback(() => {
    clearPending();
    setOverlay(null);
    setResults([]);
    setRound(1);
    setPhase('menu');
  }, [clearPending]);

  const handleRoundComplete = useCallback(
    (payload: RoundCompletePayload) => {
      const result: RoundResult = {
        round: payload.config.round,
        playerScore: payload.playerStats.score,
        aiScore: payload.aiStats.score,
        playerStats: payload.playerStats,
        aiStats: payload.aiStats,
        cleanFlowPlayer: payload.cleanPlayer,
        cleanFlowAI: payload.cleanAI,
      };
      clearPending();
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null;
        setResults((prev) => [...prev, result]);
        if (payload.config.round < 3) {
          setPhase('roundResults');
        } else {
          setPhase('finalResults');
        }
      }, 1500);
    },
    [clearPending],
  );

  const continueRound = useCallback(() => {
    setRound((r) => Math.min(3, r + 1));
    setPhase('roundIntro');
  }, []);

  // Stingers for transitions.
  useEffect(() => {
    if (phase === 'finalResults') {
      const playerTotal = results.reduce((s, r) => s + r.playerScore, 0);
      const aiTotal = results.reduce((s, r) => s + r.aiScore, 0);
      audioEngine.playSfx(playerTotal >= aiTotal ? 'victory' : 'defeat');
    }
  }, [phase, results]);

  const arenaMounted = phase === 'playing' || phase === 'paused';
  const config = ROUND_CONFIGS[Math.min(round, 3) - 1];

  const renderPhase = () => {
    switch (phase) {
      case 'menu':
        return (
          <MainMenu
            settings={settings}
            onUpdate={updateSettings}
            onStart={startBattle}
            onHowTo={() => setPhase('howto')}
            onLibrary={() => setPhase('library')}
            onPractice={() => setPhase('practice')}
            onSettings={() => setPhase('settings')}
          />
        );
      case 'howto':
        return (
          <HowToPlay
            keymap={settings.keymap}
            onBack={() => setPhase('menu')}
            onPractice={() => setPhase('practice')}
          />
        );
      case 'library':
        return (
          <MoveLibrary
            keymap={settings.keymap}
            reducedMotion={settings.reducedMotion}
            onBack={() => setPhase('menu')}
            onPractice={() => setPhase('practice')}
          />
        );
      case 'settings':
        return (
          <SettingsPanel
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setPhase('menu')}
          />
        );
      case 'practice':
        return (
          <PracticeMode
            keymap={settings.keymap}
            reducedMotion={settings.reducedMotion}
            onBack={() => setPhase('menu')}
          />
        );
      case 'roundIntro':
        return <RoundIntro config={config} onDone={() => setPhase('ready')} />;
      case 'ready':
        return <ReadyCountdown accent={config.accent} onDone={() => setPhase('playing')} />;
      case 'roundResults': {
        const latest = results[results.length - 1];
        if (!latest) return <LoadingFallback />;
        return <RoundResults result={latest} onContinue={continueRound} isLast={false} />;
      }
      case 'finalResults':
        return results.length > 0 ? (
          <ResultsScreen rounds={results} onReplay={startBattle} onMenu={quitToMenu} />
        ) : (
          <LoadingFallback />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-void text-white">
      {arenaMounted ? (
        <>
          <BattleArena
            key={round}
            config={config}
            difficulty={settings.difficulty}
            keymap={settings.keymap}
            reducedMotion={settings.reducedMotion}
            paused={phase === 'paused'}
            onRoundComplete={handleRoundComplete}
            onRequestPause={() => setPhase('paused')}
          />

          {phase === 'paused' && !overlay && (
            <PauseMenu
              onResume={() => setPhase('playing')}
              onRestart={startBattle}
              onLibrary={() => setOverlay('library')}
              onSettings={() => setOverlay('settings')}
              onQuit={quitToMenu}
            />
          )}

          {phase === 'paused' && overlay === 'library' && (
            <div className="absolute inset-0 z-[60] bg-void">
              <MoveLibrary
                keymap={settings.keymap}
                reducedMotion={settings.reducedMotion}
                onBack={() => setOverlay(null)}
                onPractice={() => {
                  setOverlay(null);
                  setPhase('practice');
                }}
              />
            </div>
          )}

          {phase === 'paused' && overlay === 'settings' && (
            <div className="absolute inset-0 z-[60] bg-void">
              <SettingsPanel
                settings={settings}
                onUpdate={updateSettings}
                onClose={() => setOverlay(null)}
              />
            </div>
          )}
        </>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="h-full w-full"
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <StageBackdrop accent="#a855f7" />
      <span className="relative z-10 font-display text-2xl uppercase tracking-[0.4em] text-white/60 animate-pulse">
        Loading…
      </span>
    </div>
  );
}
