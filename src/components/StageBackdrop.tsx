interface Props {
  accent?: string;
  intensity?: number;
}

/** Reusable neon underground stage: spotlights, fog, grid floor, particles. */
export function StageBackdrop({ accent = '#a855f7', intensity = 1 }: Props) {
  const particles = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, rgba(60,20,90,0.55), rgba(5,5,7,0.9) 55%, #050507 100%)',
        }}
      />

      {/* Moving spotlights */}
      <div
        className="absolute -top-1/3 left-1/4 h-[120%] w-[45%] origin-top animate-fogdrift"
        style={{
          background: `conic-gradient(from 190deg at 50% 0%, transparent 0deg, ${accent}33 18deg, transparent 40deg)`,
          filter: 'blur(6px)',
          opacity: 0.9 * intensity,
        }}
      />
      <div
        className="absolute -top-1/3 right-1/4 h-[120%] w-[45%] origin-top animate-fogdrift"
        style={{
          background:
            'conic-gradient(from 130deg at 50% 0%, transparent 0deg, #22d3ee33 18deg, transparent 40deg)',
          filter: 'blur(6px)',
          animationDelay: '-6s',
          opacity: 0.8 * intensity,
        }}
      />

      {/* Fog blobs */}
      <div
        className="absolute bottom-0 left-0 h-1/2 w-2/3 animate-fogdrift rounded-full"
        style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)`, filter: 'blur(40px)' }}
      />
      <div
        className="absolute bottom-0 right-0 h-1/2 w-2/3 animate-fogdrift rounded-full"
        style={{
          background: 'radial-gradient(circle, #ff2d9522, transparent 70%)',
          filter: 'blur(50px)',
          animationDelay: '-8s',
        }}
      />

      {/* Particles */}
      {particles.map((_, i) => {
        const left = (i * 37) % 100;
        const size = 2 + (i % 3);
        const delay = (i % 7) * 1.3;
        return (
          <span
            key={i}
            className="absolute bottom-0 rounded-full"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              background: i % 2 ? '#b6ff3c' : '#22d3ee',
              boxShadow: '0 0 8px currentColor',
              color: i % 2 ? '#b6ff3c' : '#22d3ee',
              animation: `floaty ${8 + (i % 5)}s ease-in-out ${delay}s infinite`,
              opacity: 0.5,
            }}
          />
        );
      })}

      {/* Grid floor */}
      <div className="absolute bottom-0 left-0 right-0 h-[38%] overflow-hidden">
        <div className="stage-grid absolute inset-0 animate-gridpan opacity-70" />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: 'linear-gradient(to top, #050507 10%, transparent)' }}
        />
      </div>

      {/* Vignette + scanlines */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 60px rgba(0,0,0,0.9)' }}
      />
      <div className="scanlines absolute inset-0" />
    </div>
  );
}
