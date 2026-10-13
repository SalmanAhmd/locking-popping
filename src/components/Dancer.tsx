import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { MoveId, TimingGrade } from '../types/game';
import {
  CELEBRATE_ANIM,
  DEFEAT_ANIM,
  IDLE_STIFFNESS,
  MISS_ANIM,
  MISS_STIFFNESS,
  MOVE_ANIMS,
  MOVE_STIFFNESS,
  NEUTRAL,
  POSE_KEYS,
  SPECIAL_STIFFNESS,
  idlePose,
  integratePose,
  resetPose,
  samplePose,
  type MoveAnim,
  type Pose,
} from '../lib/poseEngine';

export interface DancerHandle {
  playMove: (moveId: MoveId, grade: TimingGrade) => void;
  celebrate: () => void;
  defeat: () => void;
  setEnergy: (energy: number) => void;
  setPaused: (paused: boolean) => void;
  reset: () => void;
}

interface DancerProps {
  colors: { primary: string; secondary: string; glow: string };
  flip?: boolean;
  beatDuration?: number;
  reducedMotion?: boolean;
  /** Skin tone for the head, forearms and hands. */
  skin?: string;
}

interface AnimState {
  anim: MoveAnim | null;
  start: number;
  special: 'celebrate' | 'defeat' | null;
  stiffness: number;
}

const PELVIS = '80 170';
const NECK = '80 104';

function zeroPose(): Pose {
  const out = {} as Pose;
  POSE_KEYS.forEach((k) => (out[k] = 0));
  return out;
}

export const Dancer = forwardRef<DancerHandle, DancerProps>(function Dancer(
  { colors, flip = false, beatDuration = 550, reducedMotion = false, skin = '#e8b48c' },
  ref,
) {
  const root = useRef<SVGGElement | null>(null);
  const torso = useRef<SVGGElement | null>(null);
  const head = useRef<SVGGElement | null>(null);
  const lArm = useRef<SVGGElement | null>(null);
  const lElbow = useRef<SVGGElement | null>(null);
  const rArm = useRef<SVGGElement | null>(null);
  const rElbow = useRef<SVGGElement | null>(null);
  const lLeg = useRef<SVGGElement | null>(null);
  const lKnee = useRef<SVGGElement | null>(null);
  const rLeg = useRef<SVGGElement | null>(null);
  const rKnee = useRef<SVGGElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);

  const state = useRef<AnimState>({ anim: null, start: 0, special: null, stiffness: IDLE_STIFFNESS });
  const energy = useRef(1);
  const paused = useRef(false);
  const poseState = useRef<Pose>({ ...NEUTRAL });
  const poseVel = useRef<Pose>(zeroPose());

  const apply = (p: Pose) => {
    root.current?.setAttribute(
      'transform',
      `translate(${p.bodyX} ${p.bodyY}) rotate(${p.bodyRot} ${PELVIS}) translate(80 170) scale(${p.scaleX} ${p.scaleY}) translate(-80 -170)`,
    );
    torso.current?.setAttribute('transform', `rotate(${p.torso} ${PELVIS})`);
    head.current?.setAttribute('transform', `rotate(${p.head} ${NECK})`);
    lArm.current?.setAttribute('transform', `rotate(${p.lShoulder} 62 104)`);
    lElbow.current?.setAttribute('transform', `rotate(${p.lElbow} 62 144)`);
    rArm.current?.setAttribute('transform', `rotate(${-p.rShoulder} 98 104)`);
    rElbow.current?.setAttribute('transform', `rotate(${-p.rElbow} 98 144)`);
    lLeg.current?.setAttribute('transform', `rotate(${p.lHip} 72 170)`);
    lKnee.current?.setAttribute('transform', `rotate(${p.lKnee} 72 210)`);
    rLeg.current?.setAttribute('transform', `rotate(${-p.rHip} 88 170)`);
    rKnee.current?.setAttribute('transform', `rotate(${-p.rKnee} 88 210)`);
  };

  useImperativeHandle(ref, () => ({
    playMove(moveId, grade) {
      const anim = grade === 'miss' ? MISS_ANIM : MOVE_ANIMS[moveId];
      const stiffness = grade === 'miss' ? MISS_STIFFNESS : MOVE_STIFFNESS[moveId] ?? 1;
      state.current = { anim, start: performance.now(), special: null, stiffness };
      if (grade === 'perfect' && wrap.current && !reducedMotion) {
        wrap.current.animate(
          [
            { filter: 'brightness(2.4) drop-shadow(0 0 18px ' + colors.glow + ')' },
            { filter: 'brightness(1) drop-shadow(0 0 0px transparent)' },
          ],
          { duration: 320, easing: 'ease-out' },
        );
      }
    },
    celebrate() {
      state.current = { anim: CELEBRATE_ANIM, start: performance.now(), special: 'celebrate', stiffness: SPECIAL_STIFFNESS };
    },
    defeat() {
      state.current = { anim: DEFEAT_ANIM, start: performance.now(), special: 'defeat', stiffness: SPECIAL_STIFFNESS };
    },
    setEnergy(e) {
      energy.current = Math.max(0.4, Math.min(1.8, e));
    },
    setPaused(v) {
      paused.current = v;
    },
    reset() {
      state.current = { anim: null, start: 0, special: null, stiffness: IDLE_STIFFNESS };
      energy.current = 1;
      resetPose(poseState.current, poseVel.current, NEUTRAL);
      apply(poseState.current);
    },
  }));

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      if (!paused.current) {
        const st = state.current;
        let target: Pose;
        let stiffness: number;
        if (st.anim) {
          const dur = st.anim.duration;
          const raw = (now - st.start) / dur;
          if (raw <= 1) {
            target = samplePose(st.anim, raw);
            stiffness = st.stiffness;
          } else if (st.special === 'celebrate') {
            st.start = now - ((raw % 1) * dur);
            target = samplePose(st.anim, raw % 1);
            stiffness = st.stiffness;
          } else if (st.special === 'defeat') {
            target = samplePose(st.anim, 1);
            stiffness = st.stiffness;
          } else {
            st.anim = null;
            target = idlePose(now, energy.current, beatDuration);
            stiffness = IDLE_STIFFNESS;
          }
        } else {
          target = idlePose(now, energy.current, beatDuration);
          stiffness = IDLE_STIFFNESS;
        }
        integratePose(poseState.current, poseVel.current, target, dt, stiffness);
        apply(poseState.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [beatDuration]);

  const filterId = `glow-${Math.round(Math.abs(hashString(colors.glow)))}`;

  // Clothing / material palette.
  const SHIRT = colors.primary;
  const TRIM = colors.secondary;
  const DENIM = '#4568bd';
  const DENIM_DARK = '#2a4487';
  const DENIM_LIGHT = '#6183d8';
  const HAIR = '#15151f';
  const SHOE = '#f1f2f7';
  const SHOE_SOLE = '#b9bdcb';
  const INK = '#161620';

  return (
    <div
      ref={wrap}
      className="dancer-wrap h-full w-full select-none"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <svg viewBox="0 0 160 260" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`${filterId}-shirt`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id={`${filterId}-denim`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="252" rx="44" ry="9" fill={colors.glow} opacity="0.18" />

        <g ref={root} filter={`url(#${filterId})`} strokeLinecap="round" strokeLinejoin="round">
          {/* ---------- LEGS (baggy jeans, planted outside torso) ---------- */}
          <g ref={lLeg}>
            <line x1="72" y1="168" x2="72" y2="212" stroke={DENIM} strokeWidth="23" />
            <line x1="72" y1="168" x2="72" y2="212" stroke={`url(#${filterId}-denim)`} strokeWidth="23" />
            <g ref={lKnee}>
              <line x1="72" y1="210" x2="72" y2="244" stroke={DENIM} strokeWidth="20" />
              <line x1="72" y1="210" x2="72" y2="244" stroke={`url(#${filterId}-denim)`} strokeWidth="20" />
              {/* folded cuff */}
              <line x1="72" y1="238" x2="72" y2="246" stroke={DENIM_LIGHT} strokeWidth="21" />
              <line x1="63" y1="242" x2="81" y2="242" stroke={DENIM_DARK} strokeWidth="1.6" opacity="0.7" />
              {/* sneaker */}
              <path
                d="M78 243 h-20 q-6 0 -6 6 q0 6 8 6 h18 z"
                fill={SHOE}
                stroke={DENIM_DARK}
                strokeWidth="1.4"
              />
              <rect x="53" y="249" width="26" height="4" rx="2" fill={SHOE_SOLE} />
              <path d="M60 245 q4 3 8 0" fill="none" stroke={TRIM} strokeWidth="1.4" opacity="0.8" />
            </g>
          </g>

          <g ref={rLeg}>
            <line x1="88" y1="168" x2="88" y2="212" stroke={DENIM} strokeWidth="23" />
            <line x1="88" y1="168" x2="88" y2="212" stroke={`url(#${filterId}-denim)`} strokeWidth="23" />
            <g ref={rKnee}>
              <line x1="88" y1="210" x2="88" y2="244" stroke={DENIM} strokeWidth="20" />
              <line x1="88" y1="210" x2="88" y2="244" stroke={`url(#${filterId}-denim)`} strokeWidth="20" />
              <line x1="88" y1="238" x2="88" y2="246" stroke={DENIM_LIGHT} strokeWidth="21" />
              <line x1="79" y1="242" x2="97" y2="242" stroke={DENIM_DARK} strokeWidth="1.6" opacity="0.7" />
              <path
                d="M82 243 h20 q6 0 6 6 q0 6 -8 6 h-18 z"
                fill={SHOE}
                stroke={DENIM_DARK}
                strokeWidth="1.4"
              />
              <rect x="81" y="249" width="26" height="4" rx="2" fill={SHOE_SOLE} />
              <path d="M92 245 q4 3 8 0" fill="none" stroke={TRIM} strokeWidth="1.4" opacity="0.8" />
            </g>
          </g>

          {/* ---------- TORSO + HEAD + ARMS ---------- */}
          <g ref={torso}>
            {/* neck */}
            <rect x="75" y="94" width="10" height="18" rx="4" fill={skin} />

            {/* baggy t-shirt */}
            <path
              d="M61 101 C61 92 68 88 80 88 C92 88 99 92 99 101 L105 176 C105 186 93 188 80 188 C67 188 55 186 55 176 Z"
              fill={SHIRT}
            />
            <path
              d="M61 101 C61 92 68 88 80 88 C92 88 99 92 99 101 L105 176 C105 186 93 188 80 188 C67 188 55 186 55 176 Z"
              fill={`url(#${filterId}-shirt)`}
            />
            {/* collar */}
            <path d="M70 89 Q80 100 90 89" fill="none" stroke={TRIM} strokeWidth="2.6" />
            {/* hem + side trim */}
            <path d="M55 176 C67 186 93 186 105 176" fill="none" stroke={TRIM} strokeWidth="2.2" opacity="0.8" />
            <path d="M61 104 L55 176" stroke={TRIM} strokeWidth="1.4" opacity="0.35" />
            <path d="M99 104 L105 176" stroke={TRIM} strokeWidth="1.4" opacity="0.35" />
            {/* chest print */}
            <circle cx="80" cy="132" r="10.5" fill="none" stroke={TRIM} strokeWidth="2" opacity="0.85" />
            <path d="M80 123.5 v17 M71.5 132 h17" stroke={TRIM} strokeWidth="1.8" opacity="0.85" />
            <path d="M80 122 l3 6 h-6 z" fill={TRIM} opacity="0.9" />

            {/* head */}
            <g ref={head}>
              <ellipse cx="80" cy="79" rx="17" ry="19" fill={skin} />
              <circle cx="62.5" cy="81" r="3.4" fill={skin} />
              <circle cx="97.5" cy="81" r="3.4" fill={skin} />
              {/* hair */}
              <path
                d="M61 80 C61 55 69 49 80 49 C91 49 99 55 99 80 C99 66 91 61 80 61 C69 61 61 66 61 80 Z"
                fill={HAIR}
              />
              <path d="M61.5 78 l-2 11" stroke={HAIR} strokeWidth="5" />
              <path d="M98.5 78 l2 11" stroke={HAIR} strokeWidth="5" />
              {/* knit headband */}
              <rect x="62" y="66" width="36" height="7" rx="3.5" fill={TRIM} />
              <path d="M62 69.5 h36" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
              {/* face */}
              <ellipse cx="73.5" cy="84" rx="2.3" ry="2.6" fill={INK} />
              <ellipse cx="86.5" cy="84" rx="2.3" ry="2.6" fill={INK} />
              <path d="M69.5 79 q4 -2.2 8 0" fill="none" stroke={INK} strokeWidth="1.6" />
              <path d="M82.5 79 q4 -2.2 8 0" fill="none" stroke={INK} strokeWidth="1.6" />
              <path d="M80 86 l-1.5 4 h3 z" fill="#00000022" />
              <path d="M75.5 92 q4.5 3.2 9 0" fill="none" stroke="#7c4436" strokeWidth="1.7" />
            </g>

            {/* arms */}
            <g ref={lArm}>
              <line x1="62" y1="106" x2="62" y2="146" stroke={skin} strokeWidth="10" />
              {/* baggy short sleeve */}
              <line x1="62" y1="101" x2="62" y2="134" stroke={SHIRT} strokeWidth="20" />
              <line x1="62" y1="101" x2="62" y2="134" stroke={`url(#${filterId}-shirt)`} strokeWidth="20" />
              <path d="M52 133 q10 7 20 0" fill="none" stroke={TRIM} strokeWidth="2" opacity="0.75" />
              <g ref={lElbow}>
                <line x1="62" y1="144" x2="62" y2="178" stroke={skin} strokeWidth="9" />
                <line x1="62" y1="171" x2="62" y2="178" stroke={TRIM} strokeWidth="7" />
                <circle cx="62" cy="181.5" r="6" fill={skin} />
                <path d="M59 182 h6" stroke="#00000022" strokeWidth="1" />
              </g>
            </g>

            <g ref={rArm}>
              <line x1="98" y1="106" x2="98" y2="146" stroke={skin} strokeWidth="10" />
              <line x1="98" y1="101" x2="98" y2="134" stroke={SHIRT} strokeWidth="20" />
              <line x1="98" y1="101" x2="98" y2="134" stroke={`url(#${filterId}-shirt)`} strokeWidth="20" />
              <path d="M88 133 q10 7 20 0" fill="none" stroke={TRIM} strokeWidth="2" opacity="0.75" />
              <g ref={rElbow}>
                <line x1="98" y1="144" x2="98" y2="178" stroke={skin} strokeWidth="9" />
                <line x1="98" y1="171" x2="98" y2="178" stroke={TRIM} strokeWidth="7" />
                <circle cx="98" cy="181.5" r="6" fill={skin} />
                <path d="M95 182 h6" stroke="#00000022" strokeWidth="1" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
});

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
