import type { ExercisePose } from "@health-tracker/shared";
import type { ReactNode } from "react";

// Minimal stick-figure line art per pose family — deliberately not one
// drawing per exercise (see packages/shared/src/exercises.ts): exercises
// that look identical at icon scale (Barbell vs Dumbbell Curl) share a pose,
// and the exercise name + cue text carry the rest of the distinction.
const PICTOGRAMS: Record<ExercisePose, ReactNode> = {
  squat: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="13" />
      <polyline points="8,10 12,8 17,9" />
      <polyline points="12,13 8,17 9,21" />
      <polyline points="12,13 16,17 15,21" />
    </>
  ),
  lunge: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="13" />
      <line x1="12" y1="8" x2="9" y2="10" />
      <line x1="12" y1="8" x2="15" y2="10" />
      <polyline points="12,13 16,17 16,21" />
      <polyline points="12,13 8,19 6,21" />
    </>
  ),
  deadlift: (
    <>
      <circle cx="8" cy="6" r="2" />
      <line x1="9" y1="8" x2="14" y2="13" />
      <line x1="11" y1="10" x2="11" y2="18" />
      <line x1="9" y1="18" x2="13" y2="18" />
      <polyline points="14,13 13,21" />
      <polyline points="14,13 16,21" />
    </>
  ),
  hipThrust: (
    <>
      <circle cx="4" cy="18" r="2" />
      <line x1="6" y1="18" x2="13" y2="13" />
      <line x1="6" y1="18" x2="3" y2="19" />
      <polyline points="13,13 18,17 19,20" />
    </>
  ),
  calfRaise: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="14" />
      <line x1="12" y1="9" x2="9" y2="11" />
      <line x1="12" y1="9" x2="15" y2="11" />
      <line x1="12" y1="14" x2="11" y2="21" />
      <line x1="11" y1="21" x2="14" y2="21" />
    </>
  ),
  pushUp: (
    <>
      <circle cx="4" cy="10" r="2" />
      <line x1="6" y1="11" x2="19" y2="15" />
      <line x1="10" y1="12.5" x2="9" y2="17" />
      <line x1="10" y1="12.5" x2="12" y2="17" />
      <line x1="19" y1="15" x2="21" y2="18" />
    </>
  ),
  bench: (
    <>
      <circle cx="4" cy="14" r="2" />
      <line x1="6" y1="14" x2="18" y2="14" />
      <line x1="10" y1="14" x2="10" y2="9" />
      <line x1="14" y1="14" x2="14" y2="9" />
      <line x1="8" y1="9" x2="16" y2="9" />
    </>
  ),
  dip: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="9" x2="9" y2="12" />
      <line x1="12" y1="9" x2="15" y2="12" />
      <line x1="9" y1="8" x2="9" y2="13" />
      <line x1="15" y1="8" x2="15" y2="13" />
      <line x1="12" y1="15" x2="12" y2="21" />
    </>
  ),
  press: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="8" x2="8" y2="3" />
      <line x1="12" y1="8" x2="16" y2="3" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  pullUp: (
    <>
      <line x1="4" y1="3" x2="20" y2="3" />
      <circle cx="12" cy="7" r="2" />
      <line x1="12" y1="3" x2="9" y2="9" />
      <line x1="12" y1="3" x2="15" y2="9" />
      <line x1="12" y1="9" x2="12" y2="16" />
      <line x1="12" y1="16" x2="10" y2="21" />
      <line x1="12" y1="16" x2="14" y2="21" />
    </>
  ),
  row: (
    <>
      <circle cx="6" cy="7" r="2" />
      <line x1="7" y1="9" x2="15" y2="15" />
      <line x1="10" y1="11" x2="14" y2="10" />
      <polyline points="15,15 14,21" />
      <polyline points="15,15 18,20" />
    </>
  ),
  curl: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="8" x2="9" y2="9" />
      <line x1="9" y1="9" x2="10" y2="6" />
      <line x1="12" y1="8" x2="15" y2="10" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  lateralRaise: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="8" x2="4" y2="7" />
      <line x1="12" y1="8" x2="20" y2="7" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  facePull: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="7" x2="7" y2="5" />
      <line x1="12" y1="7" x2="17" y2="5" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  plank: (
    <>
      <circle cx="4" cy="10" r="2" />
      <line x1="6" y1="11" x2="19" y2="14" />
      <line x1="9" y1="12" x2="9" y2="17" />
      <line x1="19" y1="14" x2="21" y2="18" />
    </>
  ),
  crunch: (
    <>
      <circle cx="6" cy="10" r="2" />
      <line x1="7" y1="11" x2="12" y2="15" />
      <line x1="12" y1="15" x2="17" y2="14" />
      <polyline points="17,14 20,17" />
      <line x1="8" y1="10" x2="4" y2="8" />
    </>
  ),
  twist: (
    <>
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="13" />
      <line x1="12" y1="9" x2="7" y2="7" />
      <line x1="12" y1="9" x2="17" y2="11" />
      <polyline points="12,13 8,15 6,14" />
      <polyline points="12,13 16,15 18,14" />
    </>
  ),
  legRaise: (
    <>
      <circle cx="4" cy="14" r="2" />
      <line x1="6" y1="14" x2="13" y2="14" />
      <line x1="13" y1="14" x2="19" y2="4" />
      <line x1="5" y1="12" x2="3" y2="10" />
    </>
  ),
  mountainClimber: (
    <>
      <circle cx="4" cy="10" r="2" />
      <line x1="6" y1="11" x2="18" y2="15" />
      <line x1="9" y1="12" x2="9" y2="17" />
      <polyline points="18,15 15,13 13,15" />
    </>
  ),
  run: (
    <>
      <circle cx="13" cy="4" r="2" />
      <line x1="13" y1="6" x2="10" y2="13" />
      <line x1="11" y1="9" x2="16" y2="7" />
      <line x1="11" y1="9" x2="7" y2="11" />
      <polyline points="10,13 15,16 17,14" />
      <polyline points="10,13 6,17 4,17" />
    </>
  ),
  cycle: (
    <>
      <circle cx="9" cy="6" r="2" />
      <line x1="9" y1="8" x2="12" y2="14" />
      <line x1="10" y1="9" x2="16" y2="10" />
      <polyline points="12,14 16,12 15,20" />
      <polyline points="12,14 8,17 12,20" />
    </>
  ),
  rowErg: (
    <>
      <circle cx="17" cy="8" r="2" />
      <line x1="16" y1="9" x2="11" y2="13" />
      <line x1="14" y1="11" x2="4" y2="9" />
      <polyline points="11,13 8,15 8,20" />
      <polyline points="11,13 14,17 13,20" />
    </>
  ),
  jumpRope: (
    <>
      <circle cx="12" cy="3" r="2" />
      <line x1="12" y1="5" x2="12" y2="14" />
      <line x1="12" y1="8" x2="8" y2="9" />
      <line x1="12" y1="8" x2="16" y2="9" />
      <path d="M8,9 C4,12 4,18 8,21" />
      <path d="M16,9 C20,12 20,18 16,21" />
      <polyline points="12,14 9,20" />
      <polyline points="12,14 15,20" />
    </>
  ),
  burpee: (
    <>
      <circle cx="5" cy="12" r="2" />
      <line x1="6" y1="13" x2="12" y2="17" />
      <line x1="9" y1="14.5" x2="9" y2="19" />
      <line x1="12" y1="17" x2="21" y2="17" />
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
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PICTOGRAMS[pose]}
    </svg>
  );
}
