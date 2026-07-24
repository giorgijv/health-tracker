import type { ExercisePose } from "@health-tracker/shared";
import type { ReactNode } from "react";

// Animated flat-icon pictograms, one motion per pose family (see
// packages/shared/src/exercises.ts). The figures loop through the exercise's
// actual rep motion — squats dip, curls swing the forearm, cycling pedals —
// so a picked exercise reads like a tiny looping demo (the self-contained,
// theme-aware, crisp equivalent of a workout GIF) rather than a still icon.
//
// Motion is SMIL <animateTransform> embedded in the SVG: no CSS transform-
// origin headaches, no library, animates at any size. `animate={false}`
// (used for the tiny inline goal-card badge, and honored for users who
// prefer reduced motion) renders the exact same shapes, frozen.

const DOT = 1;
const EASE = "0.42 0 0.58 1";
const splines = (segments: number) => Array(segments).fill(EASE).join(";");

function ground(x1: number, x2: number, y = 21.5) {
  return <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={1.1} opacity={0.45} />;
}

/** A group whose contents loop through one transform, or sit still when off. */
function Move({
  on,
  type = "translate",
  values,
  dur,
  keyTimes = "0;0.5;1",
  linear = false,
  children,
}: {
  on: boolean;
  type?: "translate" | "rotate";
  values: string;
  dur: string;
  keyTimes?: string;
  linear?: boolean;
  children: ReactNode;
}) {
  const segments = keyTimes.split(";").length - 1;
  return (
    <g>
      {on && (
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type={type}
          values={values}
          keyTimes={keyTimes}
          {...(linear
            ? { calcMode: "linear" as const }
            : { calcMode: "spline" as const, keySplines: splines(segments) })}
          dur={dur}
          repeatCount="indefinite"
        />
      )}
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

// Each entry returns the pictogram; `a` = whether to animate.
const PICTOGRAMS: Record<ExercisePose, (a: boolean) => ReactNode> = {
  squat: (a) => (
    <>
      {ground(4, 20)}
      <Move on={a} values="0 0; 0 3; 0 0" dur="1.5s">
        {head(12, 4)}
        <line x1="12" y1="6" x2="12" y2="13" />
        <polyline points="8,10 12,8 17,9" />
        <polyline points="12,13 8,17 9,21" />
        <polyline points="12,13 16,17 15,21" />
        {joint(12, 13)}
        {joint(8, 17)}
        {joint(16, 17)}
      </Move>
    </>
  ),
  lunge: (a) => (
    <>
      {ground(4, 20)}
      <Move on={a} values="0 0; 0 2.2; 0 0" dur="1.6s">
        {head(12, 4)}
        <line x1="12" y1="6" x2="12" y2="13" />
        <line x1="12" y1="8" x2="9" y2="10" />
        <line x1="12" y1="8" x2="15" y2="10" />
        <polyline points="12,13 16,17 16,21" />
        <polyline points="12,13 8,19 6,21" />
        {joint(12, 13)}
        {joint(16, 17)}
        {joint(8, 19)}
      </Move>
    </>
  ),
  deadlift: (a) => (
    <>
      {ground(4, 20)}
      <Move on={a} values="0 2.4; 0 0; 0 2.4" dur="1.7s">
        {head(8, 6)}
        <line x1="9" y1="8" x2="14" y2="13" />
        <line x1="11" y1="10" x2="11" y2="18" />
        <line x1="9" y1="18" x2="13" y2="18" strokeWidth={2.6} />
        {joint(9, 18, 1.3)}
        {joint(13, 18, 1.3)}
        <polyline points="14,13 13,21" />
        <polyline points="14,13 16,21" />
        {joint(14, 13)}
      </Move>
    </>
  ),
  hipThrust: (a) => (
    <>
      {ground(2, 21, 20.5)}
      <Move on={a} values="0 0; 0 -2; 0 0" dur="1.6s">
        {head(4, 18)}
        <line x1="6" y1="18" x2="13" y2="13" />
        <line x1="6" y1="18" x2="3" y2="19" />
        <polyline points="13,13 18,17 19,20" />
        {joint(13, 13)}
        {joint(18, 17)}
      </Move>
    </>
  ),
  calfRaise: (a) => (
    <>
      {ground(4, 20)}
      <line x1="11" y1="21.4" x2="14" y2="21.4" strokeWidth={2} />
      <Move on={a} values="0 0; 0 -1.6; 0 0" dur="1.2s">
        {head(12, 4)}
        <line x1="12" y1="6" x2="12" y2="14" />
        <line x1="12" y1="9" x2="9" y2="11" />
        <line x1="12" y1="9" x2="15" y2="11" />
        <line x1="12" y1="14" x2="11" y2="21" />
        {joint(12, 14)}
      </Move>
    </>
  ),
  pushUp: (a) => (
    <>
      <line x1="7" y1="18" x2="12" y2="18" strokeWidth={1.1} opacity={0.45} />
      <line x1="19" y1="19" x2="22" y2="19" strokeWidth={1.1} opacity={0.45} />
      <Move on={a} values="0 0; 0 2; 0 0" dur="1.5s">
        {head(4, 10)}
        <line x1="6" y1="11" x2="19" y2="15" />
        <line x1="10" y1="12.5" x2="9" y2="17" />
        <line x1="10" y1="12.5" x2="12" y2="17" />
        <line x1="19" y1="15" x2="21" y2="18" />
        {joint(10, 12.5)}
      </Move>
    </>
  ),
  bench: (a) => (
    <>
      {head(4, 14)}
      <line x1="6" y1="14" x2="18" y2="14" />
      <rect x="3" y="15.5" width="16" height="2" rx="1" fill="currentColor" stroke="none" opacity={0.55} />
      <Move on={a} values="0 0; 0 -1.8; 0 0" dur="1.6s">
        <line x1="10" y1="14" x2="10" y2="9" />
        <line x1="14" y1="14" x2="14" y2="9" />
        <line x1="7" y1="9" x2="17" y2="9" strokeWidth={2.4} />
        {joint(7, 9, 1.3)}
        {joint(17, 9, 1.3)}
      </Move>
    </>
  ),
  dip: (a) => (
    <>
      <line x1="9" y1="7" x2="9" y2="14" strokeWidth={2.4} />
      <line x1="15" y1="7" x2="15" y2="14" strokeWidth={2.4} />
      <Move on={a} values="0 0; 0 2.2; 0 0" dur="1.5s">
        {head(12, 4)}
        <line x1="12" y1="6" x2="12" y2="15" />
        <line x1="12" y1="9" x2="9" y2="12" />
        <line x1="12" y1="9" x2="15" y2="12" />
        {joint(12, 9)}
        <line x1="12" y1="15" x2="12" y2="21" />
      </Move>
    </>
  ),
  press: (a) => (
    <>
      {ground(6, 18)}
      {head(12, 4)}
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
      <Move on={a} values="0 0; 0 -1.6; 0 0" dur="1.7s">
        <line x1="12" y1="8" x2="8" y2="3" />
        <line x1="12" y1="8" x2="16" y2="3" />
        {joint(8, 3, 1.2)}
        {joint(16, 3, 1.2)}
      </Move>
    </>
  ),
  pullUp: (a) => (
    <>
      <line x1="4" y1="3" x2="20" y2="3" strokeWidth={2.6} />
      <Move on={a} values="0 0; 0 -2.4; 0 0" dur="1.6s">
        {head(12, 7)}
        <line x1="12" y1="3" x2="9" y2="9" />
        <line x1="12" y1="3" x2="15" y2="9" />
        {joint(9, 9)}
        {joint(15, 9)}
        <line x1="12" y1="9" x2="12" y2="16" />
        <line x1="12" y1="16" x2="10" y2="21" />
        <line x1="12" y1="16" x2="14" y2="21" />
      </Move>
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
      <Move on={a} values="0 0; -2.2 0; 0 0" dur="1.5s">
        <line x1="10" y1="11" x2="14" y2="10" />
        {joint(14, 10)}
      </Move>
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
      <Move on={a} type="rotate" values="0 9 9; -42 9 9; 0 9 9" dur="1.4s">
        <line x1="9" y1="9" x2="10" y2="6" strokeWidth={2.4} />
        {joint(9, 9)}
      </Move>
    </>
  ),
  lateralRaise: (a) => (
    <>
      {ground(2, 22)}
      {head(12, 4)}
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
      <Move on={a} type="rotate" values="0 12 8; -14 12 8; 0 12 8" dur="1.6s">
        <line x1="12" y1="8" x2="4" y2="7" />
        {joint(4, 7, 1.2)}
      </Move>
      <Move on={a} type="rotate" values="0 12 8; 14 12 8; 0 12 8" dur="1.6s">
        <line x1="12" y1="8" x2="20" y2="7" />
        {joint(20, 7, 1.2)}
      </Move>
    </>
  ),
  facePull: (a) => (
    <>
      {ground(6, 18)}
      {head(12, 4)}
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
      <Move on={a} values="0 0; 0 -1; 0 0" dur="1.5s">
        <line x1="12" y1="7" x2="7" y2="5" />
        <line x1="12" y1="7" x2="17" y2="5" strokeWidth={2.2} />
        {joint(7, 5)}
        {joint(17, 5)}
      </Move>
    </>
  ),
  plank: (a) => (
    <Move on={a} values="0 0; 0 -0.6; 0 0" dur="2.6s">
      {head(4, 10)}
      <line x1="6" y1="11" x2="19" y2="14" />
      <line x1="9" y1="12" x2="9" y2="17" />
      <line x1="19" y1="14" x2="21" y2="18" />
      <line x1="7" y1="18" x2="11" y2="18" strokeWidth={1.1} opacity={0.45} />
      <line x1="19" y1="19" x2="22" y2="19" strokeWidth={1.1} opacity={0.45} />
    </Move>
  ),
  crunch: (a) => (
    <>
      <line x1="3" y1="17.5" x2="21" y2="17.5" strokeWidth={1.1} opacity={0.45} />
      <line x1="12" y1="15" x2="17" y2="14" />
      <polyline points="17,14 20,17" />
      {joint(12, 15)}
      <Move on={a} type="rotate" values="0 12 15; -18 12 15; 0 12 15" dur="1.5s">
        {head(6, 10)}
        <line x1="7" y1="11" x2="12" y2="15" />
        <line x1="8" y1="10" x2="4" y2="8" />
      </Move>
    </>
  ),
  twist: (a) => (
    <Move
      on={a}
      type="rotate"
      values="0 12 11; 11 12 11; 0 12 11; -11 12 11; 0 12 11"
      keyTimes="0;0.25;0.5;0.75;1"
      dur="2.2s"
    >
      {head(12, 5)}
      <line x1="12" y1="7" x2="12" y2="13" />
      <line x1="12" y1="9" x2="7" y2="7" />
      <line x1="12" y1="9" x2="17" y2="11" />
      {joint(12, 13)}
      <polyline points="12,13 8,15 6,14" />
      <polyline points="12,13 16,15 18,14" />
    </Move>
  ),
  legRaise: (a) => (
    <>
      <line x1="2" y1="14.5" x2="16" y2="14.5" strokeWidth={1.1} opacity={0.45} />
      {head(4, 14)}
      <line x1="6" y1="14" x2="13" y2="14" />
      <line x1="5" y1="12" x2="3" y2="10" />
      <Move on={a} type="rotate" values="0 13 14; -22 13 14; 0 13 14" dur="1.6s">
        <line x1="13" y1="14" x2="19" y2="4" />
        {joint(13, 14)}
      </Move>
    </>
  ),
  mountainClimber: (a) => (
    <>
      <line x1="7" y1="18" x2="11" y2="18" strokeWidth={1.1} opacity={0.45} />
      <Move on={a} values="0 0; 0 -1.2; 0 0" dur="0.7s">
        {head(4, 10)}
        <line x1="6" y1="11" x2="18" y2="15" />
        <line x1="9" y1="12" x2="9" y2="17" />
        <polyline points="18,15 15,13 13,15" />
        {joint(13, 15)}
      </Move>
    </>
  ),
  run: (a) => (
    <>
      {ground(3, 19)}
      <line x1="18" y1="10" x2="21" y2="9.4" strokeWidth={1} opacity={0.4} />
      <line x1="18" y1="12.5" x2="21.5" y2="12.2" strokeWidth={1} opacity={0.4} />
      <Move on={a} values="0 0; 0 -1.5; 0 0" dur="0.8s">
        {head(13, 4)}
        <line x1="13" y1="6" x2="10" y2="13" />
        <line x1="11" y1="9" x2="16" y2="7" />
        <line x1="11" y1="9" x2="7" y2="11" />
        {joint(10, 13)}
        <polyline points="10,13 15,16 17,14" />
        <polyline points="10,13 6,17 4,17" />
      </Move>
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
      <Move on={a} type="rotate" values="0 12 14; 360 12 14" keyTimes="0;1" dur="2.2s" linear>
        <polyline points="12,14 16,12 15,20" />
        <polyline points="12,14 8,17 12,20" />
        {joint(12, 14)}
      </Move>
    </>
  ),
  rowErg: (a) => (
    <>
      <line x1="2" y1="19.5" x2="20" y2="19.5" strokeWidth={2} />
      <Move on={a} values="0 0; 4 0; 0 0" dur="1.8s">
        {head(17, 8)}
        <line x1="16" y1="9" x2="11" y2="13" />
        <line x1="14" y1="11" x2="4" y2="9" strokeWidth={2.2} />
        {joint(4, 9, 1.2)}
        {joint(11, 13)}
        <polyline points="11,13 8,15 8,20" />
        <polyline points="11,13 14,17 13,20" />
      </Move>
    </>
  ),
  jumpRope: (a) => (
    <>
      {ground(3, 21)}
      <Move on={a} values="0 0; 0 -2.4; 0 0" dur="0.65s">
        {head(12, 3)}
        <line x1="12" y1="5" x2="12" y2="14" />
        <line x1="12" y1="8" x2="8" y2="9" />
        <line x1="12" y1="8" x2="16" y2="9" />
        <path d="M8,9 C4,12 4,18 8,21" strokeWidth={1.4} />
        <path d="M16,9 C20,12 20,18 16,21" strokeWidth={1.4} />
        <polyline points="12,14 9,20" />
        <polyline points="12,14 15,20" />
      </Move>
    </>
  ),
  burpee: (a) => (
    <>
      {ground(2, 22, 18)}
      <Move on={a} values="0 0; 0 3; 0 0" dur="1s">
        {head(5, 12)}
        <line x1="6" y1="13" x2="12" y2="17" />
        <line x1="9" y1="14.5" x2="9" y2="18" />
        {joint(9, 18)}
        <line x1="12" y1="17" x2="21" y2="17" />
        {joint(12, 17)}
      </Move>
    </>
  ),
};

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ExercisePictogram({
  pose,
  size = 32,
  animate,
}: {
  pose: ExercisePose;
  size?: number;
  /** Loop the rep motion. Defaults to on, unless the user prefers reduced
   * motion. Pass false explicitly for tiny/static contexts (goal-card badge). */
  animate?: boolean;
}) {
  const on = (animate ?? true) && !prefersReducedMotion;
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
      {PICTOGRAMS[pose](on)}
    </svg>
  );
}
