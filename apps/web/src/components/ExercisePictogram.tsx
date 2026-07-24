import type { ExercisePose } from "@health-tracker/shared";
import type { ReactNode } from "react";

// Flat-icon style pictograms per pose family — deliberately not one drawing
// per exercise (see packages/shared/src/exercises.ts): exercises that look
// identical at icon scale (Barbell vs Dumbbell Curl) share a pose, and the
// exercise name + cue text carry the rest of the distinction.
//
// Style language, applied consistently across poses:
// - solid filled head + small filled joint dots (shoulder/elbow/hip/knee) —
//   reads as a deliberate "figure" rather than a thin wireframe
// - filled equipment silhouettes (bar + plates, bench, pull-up bar, bike
//   wheels) for exercises where the equipment carries most of the meaning
// - a light ground line under standing poses to anchor the figure
// All strokes use `currentColor`, so the pictogram still tracks the
// wrapping badge's theme/accent color with zero extra props.
const DOT = 1;
const GROUND = (x1: number, x2: number, y = 21.5) => (
  <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={1.1} opacity={0.45} />
);

const PICTOGRAMS: Record<ExercisePose, ReactNode> = {
  squat: (
    <>
      {GROUND(4, 20)}
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="13" />
      <polyline points="8,10 12,8 17,9" />
      <polyline points="12,13 8,17 9,21" />
      <polyline points="12,13 16,17 15,21" />
      <circle cx="12" cy="13" r={DOT} fill="currentColor" stroke="none" />
      <circle cx="8" cy="17" r={DOT} fill="currentColor" stroke="none" />
      <circle cx="16" cy="17" r={DOT} fill="currentColor" stroke="none" />
    </>
  ),
  lunge: (
    <>
      {GROUND(4, 20)}
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="13" />
      <line x1="12" y1="8" x2="9" y2="10" />
      <line x1="12" y1="8" x2="15" y2="10" />
      <polyline points="12,13 16,17 16,21" />
      <polyline points="12,13 8,19 6,21" />
      <circle cx="12" cy="13" r={DOT} fill="currentColor" stroke="none" />
      <circle cx="16" cy="17" r={DOT} fill="currentColor" stroke="none" />
      <circle cx="8" cy="19" r={DOT} fill="currentColor" stroke="none" />
    </>
  ),
  deadlift: (
    <>
      {GROUND(4, 20)}
      <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
      <line x1="9" y1="8" x2="14" y2="13" />
      <line x1="11" y1="10" x2="11" y2="18" />
      <line x1="9" y1="18" x2="13" y2="18" strokeWidth={2.6} />
      <circle cx="9" cy="18" r={1.3} fill="currentColor" stroke="none" />
      <circle cx="13" cy="18" r={1.3} fill="currentColor" stroke="none" />
      <polyline points="14,13 13,21" />
      <polyline points="14,13 16,21" />
      <circle cx="14" cy="13" r={DOT} fill="currentColor" stroke="none" />
    </>
  ),
  hipThrust: (
    <>
      {GROUND(2, 21, 20.5)}
      <circle cx="4" cy="18" r="2" fill="currentColor" stroke="none" />
      <line x1="6" y1="18" x2="13" y2="13" />
      <line x1="6" y1="18" x2="3" y2="19" />
      <polyline points="13,13 18,17 19,20" />
      <circle cx="13" cy="13" r={DOT} fill="currentColor" stroke="none" />
      <circle cx="18" cy="17" r={DOT} fill="currentColor" stroke="none" />
    </>
  ),
  calfRaise: (
    <>
      {GROUND(4, 20)}
      <line x1="11" y1="21.4" x2="14" y2="21.4" strokeWidth={2} />
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="14" />
      <line x1="12" y1="9" x2="9" y2="11" />
      <line x1="12" y1="9" x2="15" y2="11" />
      <line x1="12" y1="14" x2="11" y2="21" />
      <circle cx="12" cy="14" r={DOT} fill="currentColor" stroke="none" />
    </>
  ),
  pushUp: (
    <>
      <circle cx="4" cy="10" r="2" fill="currentColor" stroke="none" />
      <line x1="6" y1="11" x2="19" y2="15" />
      <line x1="10" y1="12.5" x2="9" y2="17" />
      <line x1="10" y1="12.5" x2="12" y2="17" />
      <line x1="19" y1="15" x2="21" y2="18" />
      <circle cx="10" cy="12.5" r={DOT} fill="currentColor" stroke="none" />
      <line x1="7" y1="18" x2="12" y2="18" strokeWidth={1.1} opacity={0.45} />
      <line x1="19" y1="19" x2="22" y2="19" strokeWidth={1.1} opacity={0.45} />
    </>
  ),
  bench: (
    <>
      <circle cx="4" cy="14" r="2" fill="currentColor" stroke="none" />
      <line x1="6" y1="14" x2="18" y2="14" />
      <rect x="3" y="15.5" width="16" height="2" rx="1" fill="currentColor" stroke="none" opacity={0.55} />
      <line x1="10" y1="14" x2="10" y2="9" />
      <line x1="14" y1="14" x2="14" y2="9" />
      <line x1="7" y1="9" x2="17" y2="9" strokeWidth={2.4} />
      <circle cx="7" cy="9" r={1.3} fill="currentColor" stroke="none" />
      <circle cx="17" cy="9" r={1.3} fill="currentColor" stroke="none" />
    </>
  ),
  dip: (
    <>
      <line x1="9" y1="7" x2="9" y2="14" strokeWidth={2.4} />
      <line x1="15" y1="7" x2="15" y2="14" strokeWidth={2.4} />
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="9" x2="9" y2="12" />
      <line x1="12" y1="9" x2="15" y2="12" />
      <circle cx="12" cy="9" r={DOT} fill="currentColor" stroke="none" />
      <line x1="12" y1="15" x2="12" y2="21" />
    </>
  ),
  press: (
    <>
      {GROUND(6, 18)}
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="8" x2="8" y2="3" />
      <line x1="12" y1="8" x2="16" y2="3" />
      <circle cx="8" cy="3" r={1.2} fill="currentColor" stroke="none" />
      <circle cx="16" cy="3" r={1.2} fill="currentColor" stroke="none" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  pullUp: (
    <>
      <line x1="4" y1="3" x2="20" y2="3" strokeWidth={2.6} />
      <circle cx="12" cy="7" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="3" x2="9" y2="9" />
      <line x1="12" y1="3" x2="15" y2="9" />
      <circle cx="9" cy="9" r={DOT} fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r={DOT} fill="currentColor" stroke="none" />
      <line x1="12" y1="9" x2="12" y2="16" />
      <line x1="12" y1="16" x2="10" y2="21" />
      <line x1="12" y1="16" x2="14" y2="21" />
    </>
  ),
  row: (
    <>
      {GROUND(4, 20)}
      <circle cx="6" cy="7" r="2" fill="currentColor" stroke="none" />
      <line x1="7" y1="9" x2="15" y2="15" />
      <line x1="10" y1="11" x2="14" y2="10" />
      <circle cx="14" cy="10" r={DOT} fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r={DOT} fill="currentColor" stroke="none" />
      <polyline points="15,15 14,21" />
      <polyline points="15,15 18,20" />
    </>
  ),
  curl: (
    <>
      {GROUND(6, 18)}
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="8" x2="9" y2="9" />
      <line x1="9" y1="9" x2="10" y2="6" strokeWidth={2.4} />
      <circle cx="9" cy="9" r={DOT} fill="currentColor" stroke="none" />
      <line x1="12" y1="8" x2="15" y2="10" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  lateralRaise: (
    <>
      {GROUND(2, 22)}
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="8" x2="4" y2="7" />
      <line x1="12" y1="8" x2="20" y2="7" />
      <circle cx="4" cy="7" r={1.2} fill="currentColor" stroke="none" />
      <circle cx="20" cy="7" r={1.2} fill="currentColor" stroke="none" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  facePull: (
    <>
      {GROUND(6, 18)}
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="7" x2="7" y2="5" />
      <line x1="12" y1="7" x2="17" y2="5" strokeWidth={2.2} />
      <circle cx="7" cy="5" r={DOT} fill="currentColor" stroke="none" />
      <circle cx="17" cy="5" r={DOT} fill="currentColor" stroke="none" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  plank: (
    <>
      <circle cx="4" cy="10" r="2" fill="currentColor" stroke="none" />
      <line x1="6" y1="11" x2="19" y2="14" />
      <line x1="9" y1="12" x2="9" y2="17" />
      <line x1="19" y1="14" x2="21" y2="18" />
      <line x1="7" y1="18" x2="11" y2="18" strokeWidth={1.1} opacity={0.45} />
      <line x1="19" y1="19" x2="22" y2="19" strokeWidth={1.1} opacity={0.45} />
    </>
  ),
  crunch: (
    <>
      <line x1="3" y1="17.5" x2="21" y2="17.5" strokeWidth={1.1} opacity={0.45} />
      <circle cx="6" cy="10" r="2" fill="currentColor" stroke="none" />
      <line x1="7" y1="11" x2="12" y2="15" />
      <line x1="12" y1="15" x2="17" y2="14" />
      <circle cx="12" cy="15" r={DOT} fill="currentColor" stroke="none" />
      <polyline points="17,14 20,17" />
      <line x1="8" y1="10" x2="4" y2="8" />
    </>
  ),
  twist: (
    <>
      <line x1="3" y1="17.5" x2="21" y2="17.5" strokeWidth={1.1} opacity={0.45} />
      <circle cx="12" cy="5" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="7" x2="12" y2="13" />
      <line x1="12" y1="9" x2="7" y2="7" />
      <line x1="12" y1="9" x2="17" y2="11" />
      <circle cx="12" cy="13" r={DOT} fill="currentColor" stroke="none" />
      <polyline points="12,13 8,15 6,14" />
      <polyline points="12,13 16,15 18,14" />
    </>
  ),
  legRaise: (
    <>
      <line x1="2" y1="14.5" x2="16" y2="14.5" strokeWidth={1.1} opacity={0.45} />
      <circle cx="4" cy="14" r="2" fill="currentColor" stroke="none" />
      <line x1="6" y1="14" x2="13" y2="14" />
      <line x1="13" y1="14" x2="19" y2="4" />
      <circle cx="13" cy="14" r={DOT} fill="currentColor" stroke="none" />
      <line x1="5" y1="12" x2="3" y2="10" />
    </>
  ),
  mountainClimber: (
    <>
      <circle cx="4" cy="10" r="2" fill="currentColor" stroke="none" />
      <line x1="6" y1="11" x2="18" y2="15" />
      <line x1="9" y1="12" x2="9" y2="17" />
      <polyline points="18,15 15,13 13,15" />
      <circle cx="13" cy="15" r={DOT} fill="currentColor" stroke="none" />
      <line x1="7" y1="18" x2="11" y2="18" strokeWidth={1.1} opacity={0.45} />
    </>
  ),
  run: (
    <>
      {GROUND(3, 19)}
      <circle cx="13" cy="4" r="2" fill="currentColor" stroke="none" />
      <line x1="13" y1="6" x2="10" y2="13" />
      <line x1="11" y1="9" x2="16" y2="7" />
      <line x1="11" y1="9" x2="7" y2="11" />
      <circle cx="10" cy="13" r={DOT} fill="currentColor" stroke="none" />
      <polyline points="10,13 15,16 17,14" />
      <polyline points="10,13 6,17 4,17" />
      <line x1="18" y1="10" x2="21" y2="9.4" strokeWidth={1} opacity={0.4} />
      <line x1="18" y1="12.5" x2="21.5" y2="12.2" strokeWidth={1} opacity={0.4} />
    </>
  ),
  cycle: (
    <>
      <circle cx="5" cy="19" r="2.6" />
      <circle cx="19" cy="18" r="2.6" />
      <line x1="5" y1="19" x2="12" y2="14" strokeWidth={2} />
      <line x1="19" y1="18" x2="12" y2="14" strokeWidth={2} />
      <line x1="12" y1="14" x2="10" y2="9" strokeWidth={2} />
      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
      <line x1="9" y1="8" x2="12" y2="14" />
      <line x1="10" y1="9" x2="16" y2="10" />
      <circle cx="12" cy="14" r={DOT} fill="currentColor" stroke="none" />
      <polyline points="12,14 16,12 15,20" />
      <polyline points="12,14 8,17 12,20" />
    </>
  ),
  rowErg: (
    <>
      <line x1="2" y1="19.5" x2="20" y2="19.5" strokeWidth={2} />
      <circle cx="17" cy="8" r="2" fill="currentColor" stroke="none" />
      <line x1="16" y1="9" x2="11" y2="13" />
      <line x1="14" y1="11" x2="4" y2="9" strokeWidth={2.2} />
      <circle cx="4" cy="9" r={1.2} fill="currentColor" stroke="none" />
      <circle cx="11" cy="13" r={DOT} fill="currentColor" stroke="none" />
      <polyline points="11,13 8,15 8,20" />
      <polyline points="11,13 14,17 13,20" />
    </>
  ),
  jumpRope: (
    <>
      {GROUND(3, 21)}
      <circle cx="12" cy="3" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="5" x2="12" y2="14" />
      <line x1="12" y1="8" x2="8" y2="9" />
      <line x1="12" y1="8" x2="16" y2="9" />
      <path d="M8,9 C4,12 4,18 8,21" strokeWidth={1.4} />
      <path d="M16,9 C20,12 20,18 16,21" strokeWidth={1.4} />
      <polyline points="12,14 9,20" />
      <polyline points="12,14 15,20" />
    </>
  ),
  burpee: (
    <>
      {GROUND(2, 22, 18)}
      <circle cx="5" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="6" y1="13" x2="12" y2="17" />
      <line x1="9" y1="14.5" x2="9" y2="18" />
      <circle cx="9" cy="18" r={DOT} fill="currentColor" stroke="none" />
      <line x1="12" y1="17" x2="21" y2="17" />
      <circle cx="12" cy="17" r={DOT} fill="currentColor" stroke="none" />
    </>
  ),
};

export function ExercisePictogram({
  pose,
  size = 32,
}: {
  pose: ExercisePose;
  size?: number;
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
      {PICTOGRAMS[pose]}
    </svg>
  );
}
