import type { ExercisePose } from "@health-tracker/shared";
import type { CSSProperties, ReactNode } from "react";

// Animated flat-icon pictograms, one looping motion per pose family (see
// packages/shared/src/exercises.ts). Each figure demonstrates the exercise's
// actual rep — squats dip, curls swing the forearm, cycling pedals — so a
// picked exercise reads like a tiny looping how-to (a self-contained, crisp,
// theme-aware stand-in for a workout GIF; real photos/GIFs can't be sourced
// here — external image hosts are blocked by this session's network policy).
//
// Motion is CSS (see `.ep-move` / `@keyframes ep-*` in index.css), NOT SMIL:
// Chromium throttles SMIL <animateTransform> almost to a standstill, which is
// why the first cut looked frozen. `animate={false}` (the tiny inline
// goal-card badge) renders the exact same shapes without the motion class.

const DOT = 1;

function ground(x1: number, x2: number, y = 21.5) {
  return <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={1.1} opacity={0.45} />;
}

type Motion = {
  kf: "bob" | "rot" | "twist" | "spin";
  dur: string;
  dx?: number;
  dy?: number;
  r?: number; // degrees
  origin?: string; // e.g. "9px 9px" (view-box user units)
  linear?: boolean;
};

/** A group that loops one CSS motion when `on`, or sits still otherwise. */
function M({ on, m, children }: { on: boolean; m: Motion; children: ReactNode }) {
  if (!on) return <g>{children}</g>;
  const style: CSSProperties = {
    ["--ep-kf" as string]: `ep-${m.kf}`,
    ["--ep-d" as string]: m.dur,
    ...(m.linear ? { ["--ep-t" as string]: "linear" } : null),
    ...(m.dx != null ? { ["--ep-dx" as string]: `${m.dx}px` } : null),
    ...(m.dy != null ? { ["--ep-dy" as string]: `${m.dy}px` } : null),
    ...(m.r != null ? { ["--ep-r" as string]: `${m.r}deg` } : null),
    ...(m.origin ? { ["--ep-o" as string]: m.origin } : null),
  };
  return (
    <g className="ep-move" style={style}>
      {children}
    </g>
  );
}

const head = (cx: number, cy: number, r = 2) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
);
const joint = (cx: number, cy: number, r = DOT) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
);

// Amplitudes are in viewBox units (0–24); at the 132px preview badge, 1 unit
// ≈ 5.5px, so these read as clearly visible reps.
const PICTOGRAMS: Record<ExercisePose, (a: boolean) => ReactNode> = {
  squat: (a) => (
    <>
      {ground(4, 20)}
      <M on={a} m={{ kf: "bob", dy: 4, dur: "1.4s" }}>
        {head(12, 4)}
        <line x1="12" y1="6" x2="12" y2="13" />
        <polyline points="8,10 12,8 17,9" />
        <polyline points="12,13 8,17 9,21" />
        <polyline points="12,13 16,17 15,21" />
        {joint(12, 13)}
        {joint(8, 17)}
        {joint(16, 17)}
      </M>
    </>
  ),
  lunge: (a) => (
    <>
      {ground(4, 20)}
      <M on={a} m={{ kf: "bob", dy: 3, dur: "1.5s" }}>
        {head(12, 4)}
        <line x1="12" y1="6" x2="12" y2="13" />
        <line x1="12" y1="8" x2="9" y2="10" />
        <line x1="12" y1="8" x2="15" y2="10" />
        <polyline points="12,13 16,17 16,21" />
        <polyline points="12,13 8,19 6,21" />
        {joint(12, 13)}
        {joint(16, 17)}
        {joint(8, 19)}
      </M>
    </>
  ),
  deadlift: (a) => (
    <>
      {ground(4, 20)}
      <M on={a} m={{ kf: "bob", dy: 3.2, dur: "1.5s" }}>
        {head(8, 6)}
        <line x1="9" y1="8" x2="14" y2="13" />
        <line x1="11" y1="10" x2="11" y2="18" />
        <line x1="9" y1="18" x2="13" y2="18" strokeWidth={2.6} />
        {joint(9, 18, 1.3)}
        {joint(13, 18, 1.3)}
        <polyline points="14,13 13,21" />
        <polyline points="14,13 16,21" />
        {joint(14, 13)}
      </M>
    </>
  ),
  hipThrust: (a) => (
    <>
      {ground(2, 21, 20.5)}
      <M on={a} m={{ kf: "bob", dy: -3, dur: "1.4s" }}>
        {head(4, 18)}
        <line x1="6" y1="18" x2="13" y2="13" />
        <line x1="6" y1="18" x2="3" y2="19" />
        <polyline points="13,13 18,17 19,20" />
        {joint(13, 13)}
        {joint(18, 17)}
      </M>
    </>
  ),
  calfRaise: (a) => (
    <>
      {ground(4, 20)}
      <line x1="11" y1="21.4" x2="14" y2="21.4" strokeWidth={2} />
      <M on={a} m={{ kf: "bob", dy: -2.4, dur: "1s" }}>
        {head(12, 4)}
        <line x1="12" y1="6" x2="12" y2="14" />
        <line x1="12" y1="9" x2="9" y2="11" />
        <line x1="12" y1="9" x2="15" y2="11" />
        <line x1="12" y1="14" x2="11" y2="21" />
        {joint(12, 14)}
      </M>
    </>
  ),
  pushUp: (a) => (
    <>
      <line x1="7" y1="18" x2="12" y2="18" strokeWidth={1.1} opacity={0.45} />
      <line x1="19" y1="19" x2="22" y2="19" strokeWidth={1.1} opacity={0.45} />
      <M on={a} m={{ kf: "bob", dy: 2.6, dur: "1.4s" }}>
        {head(4, 10)}
        <line x1="6" y1="11" x2="19" y2="15" />
        <line x1="10" y1="12.5" x2="9" y2="17" />
        <line x1="10" y1="12.5" x2="12" y2="17" />
        <line x1="19" y1="15" x2="21" y2="18" />
        {joint(10, 12.5)}
      </M>
    </>
  ),
  bench: (a) => (
    <>
      {head(4, 14)}
      <line x1="6" y1="14" x2="18" y2="14" />
      <rect x="3" y="15.5" width="16" height="2" rx="1" fill="currentColor" stroke="none" opacity={0.55} />
      <M on={a} m={{ kf: "bob", dy: -2.6, dur: "1.4s" }}>
        <line x1="10" y1="14" x2="10" y2="9" />
        <line x1="14" y1="14" x2="14" y2="9" />
        <line x1="7" y1="9" x2="17" y2="9" strokeWidth={2.4} />
        {joint(7, 9, 1.3)}
        {joint(17, 9, 1.3)}
      </M>
    </>
  ),
  dip: (a) => (
    <>
      <line x1="9" y1="7" x2="9" y2="14" strokeWidth={2.4} />
      <line x1="15" y1="7" x2="15" y2="14" strokeWidth={2.4} />
      <M on={a} m={{ kf: "bob", dy: 2.8, dur: "1.4s" }}>
        {head(12, 4)}
        <line x1="12" y1="6" x2="12" y2="15" />
        <line x1="12" y1="9" x2="9" y2="12" />
        <line x1="12" y1="9" x2="15" y2="12" />
        {joint(12, 9)}
        <line x1="12" y1="15" x2="12" y2="21" />
      </M>
    </>
  ),
  press: (a) => (
    <>
      {ground(6, 18)}
      {head(12, 4)}
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
      <M on={a} m={{ kf: "bob", dy: -2.2, dur: "1.5s" }}>
        <line x1="12" y1="8" x2="8" y2="3" />
        <line x1="12" y1="8" x2="16" y2="3" />
        {joint(8, 3, 1.2)}
        {joint(16, 3, 1.2)}
      </M>
    </>
  ),
  pullUp: (a) => (
    <>
      <line x1="4" y1="3" x2="20" y2="3" strokeWidth={2.6} />
      <M on={a} m={{ kf: "bob", dy: -3, dur: "1.5s" }}>
        {head(12, 7)}
        <line x1="12" y1="3" x2="9" y2="9" />
        <line x1="12" y1="3" x2="15" y2="9" />
        {joint(9, 9)}
        {joint(15, 9)}
        <line x1="12" y1="9" x2="12" y2="16" />
        <line x1="12" y1="16" x2="10" y2="21" />
        <line x1="12" y1="16" x2="14" y2="21" />
      </M>
    </>
  ),
  row: (a) => (
    <>
      {ground(4, 20)}
      {head(6, 7)}
      <line x1="7" y1="9" x2="15" y2="15" />
      <polyline points="15,15 14,21" />
      <polyline points="15,15 18,20" />
      {joint(15, 15)}
      <M on={a} m={{ kf: "bob", dx: -3, dur: "1.3s" }}>
        <line x1="10" y1="11" x2="14" y2="10" />
        {joint(14, 10)}
      </M>
    </>
  ),
  curl: (a) => (
    <>
      {ground(6, 18)}
      {head(12, 4)}
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="8" x2="9" y2="9" />
      <line x1="12" y1="8" x2="15" y2="10" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
      <M on={a} m={{ kf: "rot", r: -55, origin: "9px 9px", dur: "1.2s" }}>
        <line x1="9" y1="9" x2="10" y2="6" strokeWidth={2.4} />
        {joint(9, 9)}
      </M>
    </>
  ),
  lateralRaise: (a) => (
    <>
      {ground(2, 22)}
      {head(12, 4)}
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
      <M on={a} m={{ kf: "rot", r: -22, origin: "12px 8px", dur: "1.5s" }}>
        <line x1="12" y1="8" x2="4" y2="7" />
        {joint(4, 7, 1.2)}
      </M>
      <M on={a} m={{ kf: "rot", r: 22, origin: "12px 8px", dur: "1.5s" }}>
        <line x1="12" y1="8" x2="20" y2="7" />
        {joint(20, 7, 1.2)}
      </M>
    </>
  ),
  facePull: (a) => (
    <>
      {ground(6, 18)}
      {head(12, 4)}
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
      <M on={a} m={{ kf: "bob", dy: -1.8, dur: "1.3s" }}>
        <line x1="12" y1="7" x2="7" y2="5" />
        <line x1="12" y1="7" x2="17" y2="5" strokeWidth={2.2} />
        {joint(7, 5)}
        {joint(17, 5)}
      </M>
    </>
  ),
  plank: (a) => (
    <M on={a} m={{ kf: "bob", dy: -1, dur: "2.4s" }}>
      {head(4, 10)}
      <line x1="6" y1="11" x2="19" y2="14" />
      <line x1="9" y1="12" x2="9" y2="17" />
      <line x1="19" y1="14" x2="21" y2="18" />
      <line x1="7" y1="18" x2="11" y2="18" strokeWidth={1.1} opacity={0.45} />
      <line x1="19" y1="19" x2="22" y2="19" strokeWidth={1.1} opacity={0.45} />
    </M>
  ),
  crunch: (a) => (
    <>
      <line x1="3" y1="17.5" x2="21" y2="17.5" strokeWidth={1.1} opacity={0.45} />
      <line x1="12" y1="15" x2="17" y2="14" />
      <polyline points="17,14 20,17" />
      {joint(12, 15)}
      <M on={a} m={{ kf: "rot", r: -26, origin: "12px 15px", dur: "1.4s" }}>
        {head(6, 10)}
        <line x1="7" y1="11" x2="12" y2="15" />
        <line x1="8" y1="10" x2="4" y2="8" />
      </M>
    </>
  ),
  twist: (a) => (
    <M on={a} m={{ kf: "twist", r: 16, origin: "12px 11px", dur: "1.8s" }}>
      {head(12, 5)}
      <line x1="12" y1="7" x2="12" y2="13" />
      <line x1="12" y1="9" x2="7" y2="7" />
      <line x1="12" y1="9" x2="17" y2="11" />
      {joint(12, 13)}
      <polyline points="12,13 8,15 6,14" />
      <polyline points="12,13 16,15 18,14" />
    </M>
  ),
  legRaise: (a) => (
    <>
      <line x1="2" y1="14.5" x2="16" y2="14.5" strokeWidth={1.1} opacity={0.45} />
      {head(4, 14)}
      <line x1="6" y1="14" x2="13" y2="14" />
      <line x1="5" y1="12" x2="3" y2="10" />
      <M on={a} m={{ kf: "rot", r: -32, origin: "13px 14px", dur: "1.4s" }}>
        <line x1="13" y1="14" x2="19" y2="4" />
        {joint(13, 14)}
      </M>
    </>
  ),
  mountainClimber: (a) => (
    <>
      <line x1="7" y1="18" x2="11" y2="18" strokeWidth={1.1} opacity={0.45} />
      <M on={a} m={{ kf: "bob", dy: -1.8, dur: "0.55s" }}>
        {head(4, 10)}
        <line x1="6" y1="11" x2="18" y2="15" />
        <line x1="9" y1="12" x2="9" y2="17" />
        <polyline points="18,15 15,13 13,15" />
        {joint(13, 15)}
      </M>
    </>
  ),
  run: (a) => (
    <>
      {ground(3, 19)}
      <line x1="18" y1="10" x2="21" y2="9.4" strokeWidth={1} opacity={0.4} />
      <line x1="18" y1="12.5" x2="21.5" y2="12.2" strokeWidth={1} opacity={0.4} />
      <M on={a} m={{ kf: "bob", dy: -2, dur: "0.65s" }}>
        {head(13, 4)}
        <line x1="13" y1="6" x2="10" y2="13" />
        <line x1="11" y1="9" x2="16" y2="7" />
        <line x1="11" y1="9" x2="7" y2="11" />
        {joint(10, 13)}
        <polyline points="10,13 15,16 17,14" />
        <polyline points="10,13 6,17 4,17" />
      </M>
    </>
  ),
  cycle: (a) => (
    <>
      <circle cx="5" cy="19" r="2.6" />
      <circle cx="19" cy="18" r="2.6" />
      <line x1="5" y1="19" x2="12" y2="14" strokeWidth={2} />
      <line x1="19" y1="18" x2="12" y2="14" strokeWidth={2} />
      <line x1="12" y1="14" x2="10" y2="9" strokeWidth={2} />
      {head(9, 6)}
      <line x1="9" y1="8" x2="12" y2="14" />
      <line x1="10" y1="9" x2="16" y2="10" />
      <M on={a} m={{ kf: "spin", origin: "12px 14px", dur: "1.7s", linear: true }}>
        <polyline points="12,14 16,12 15,20" />
        <polyline points="12,14 8,17 12,20" />
        {joint(12, 14)}
      </M>
    </>
  ),
  rowErg: (a) => (
    <>
      <line x1="2" y1="19.5" x2="20" y2="19.5" strokeWidth={2} />
      <M on={a} m={{ kf: "bob", dx: 5, dur: "1.5s" }}>
        {head(17, 8)}
        <line x1="16" y1="9" x2="11" y2="13" />
        <line x1="14" y1="11" x2="4" y2="9" strokeWidth={2.2} />
        {joint(4, 9, 1.2)}
        {joint(11, 13)}
        <polyline points="11,13 8,15 8,20" />
        <polyline points="11,13 14,17 13,20" />
      </M>
    </>
  ),
  jumpRope: (a) => (
    <>
      {ground(3, 21)}
      <M on={a} m={{ kf: "bob", dy: -3, dur: "0.55s" }}>
        {head(12, 3)}
        <line x1="12" y1="5" x2="12" y2="14" />
        <line x1="12" y1="8" x2="8" y2="9" />
        <line x1="12" y1="8" x2="16" y2="9" />
        <path d="M8,9 C4,12 4,18 8,21" strokeWidth={1.4} />
        <path d="M16,9 C20,12 20,18 16,21" strokeWidth={1.4} />
        <polyline points="12,14 9,20" />
        <polyline points="12,14 15,20" />
      </M>
    </>
  ),
  burpee: (a) => (
    <>
      {ground(2, 22, 18)}
      <M on={a} m={{ kf: "bob", dy: 4, dur: "0.9s" }}>
        {head(5, 12)}
        <line x1="6" y1="13" x2="12" y2="17" />
        <line x1="9" y1="14.5" x2="9" y2="18" />
        {joint(9, 18)}
        <line x1="12" y1="17" x2="21" y2="17" />
        {joint(12, 17)}
      </M>
    </>
  ),
};

export function ExercisePictogram({
  pose,
  size = 32,
  animate = true,
}: {
  pose: ExercisePose;
  size?: number;
  /** Loop the rep motion. Pass false for tiny/static contexts (goal-card badge). */
  animate?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PICTOGRAMS[pose](animate)}
    </svg>
  );
}
