import { motion } from 'framer-motion';

interface Props {
  onResume: () => void;
  onRestart: () => void;
  onLibrary: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export function PauseMenu({ onResume, onRestart, onLibrary, onSettings, onQuit }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="panel w-full max-w-sm rounded-2xl p-6 text-center"
      >
        <h2 className="graffiti text-4xl">Paused</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/45">Take a breath, dancer</p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={onResume} className="btn btn-neon">
            ▶ Resume Battle
          </button>
          <button onClick={onRestart} className="btn btn-ghost text-sm">
            ↻ Restart Battle
          </button>
          <button onClick={onLibrary} className="btn btn-ghost text-sm">
            Dance Move Library
          </button>
          <button onClick={onSettings} className="btn btn-ghost text-sm">
            Settings
          </button>
          <button onClick={onQuit} className="btn btn-pink text-sm">
            Quit to Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
