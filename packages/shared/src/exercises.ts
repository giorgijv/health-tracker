/**
 * Built-in exercise catalog, grouped by muscle group. This is static app
 * content (not user data) — no table, no migration, no API round trip:
 * bundled with the client like the rest of the UI copy.
 *
 * `pose` maps each exercise to one of a small set of illustrated poses in
 * `ExercisePictogram` (apps/web). Distinct exercises that look the same at
 * icon scale (e.g. Barbell Curl vs Dumbbell Curl) intentionally share a pose
 * — the name and cue text still differentiate them.
 */

export const EXERCISE_CATEGORIES = [
  "Abs",
  "Back",
  "Chest",
  "Biceps",
  "Triceps",
  "Shoulders",
  "Legs",
  "Glutes",
  "Cardio",
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const EXERCISE_POSES = [
  "squat",
  "lunge",
  "deadlift",
  "hipThrust",
  "calfRaise",
  "pushUp",
  "bench",
  "dip",
  "press",
  "pullUp",
  "row",
  "curl",
  "lateralRaise",
  "facePull",
  "plank",
  "crunch",
  "twist",
  "legRaise",
  "mountainClimber",
  "run",
  "cycle",
  "rowErg",
  "jumpRope",
  "burpee",
] as const;

export type ExercisePose = (typeof EXERCISE_POSES)[number];

export interface Exercise {
  /** Stable slug — also used as the logged workout's `type` text. */
  id: string;
  name: string;
  category: ExerciseCategory;
  pose: ExercisePose;
  /** One-line form cue shown next to the pictogram. */
  cue: string;
}

export const EXERCISES: Exercise[] = [
  // Abs
  { id: "crunches", name: "Crunches", category: "Abs", pose: "crunch", cue: "Lift shoulder blades off the floor, exhale on the way up." },
  { id: "plank", name: "Plank", category: "Abs", pose: "plank", cue: "Straight line from head to heels, brace your core." },
  { id: "russian-twists", name: "Russian Twists", category: "Abs", pose: "twist", cue: "Lean back slightly, rotate from the torso, not just the arms." },
  { id: "leg-raises", name: "Leg Raises", category: "Abs", pose: "legRaise", cue: "Keep lower back pressed down, lower legs slowly." },
  { id: "mountain-climbers", name: "Mountain Climbers", category: "Abs", pose: "mountainClimber", cue: "Keep hips low, drive knees toward chest quickly." },
  { id: "bicycle-crunches", name: "Bicycle Crunches", category: "Abs", pose: "twist", cue: "Elbow to opposite knee, extend the other leg fully." },

  // Back
  { id: "pull-ups", name: "Pull-ups", category: "Back", pose: "pullUp", cue: "Full hang at the bottom, chin over the bar at the top." },
  { id: "bent-over-row", name: "Bent-over Row", category: "Back", pose: "row", cue: "Flat back, pull the weight to your waist." },
  { id: "deadlift", name: "Deadlift", category: "Back", pose: "deadlift", cue: "Bar close to shins, drive through your heels." },
  { id: "superman", name: "Superman", category: "Back", pose: "plank", cue: "Lift arms and legs together, squeeze at the top." },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "Back", pose: "pullUp", cue: "Pull to your upper chest, avoid leaning back too far." },
  { id: "seated-cable-row", name: "Seated Cable Row", category: "Back", pose: "row", cue: "Keep chest up, squeeze shoulder blades together." },

  // Chest
  { id: "push-ups", name: "Push-ups", category: "Chest", pose: "pushUp", cue: "Straight body line, elbows at about 45°." },
  { id: "bench-press", name: "Bench Press", category: "Chest", pose: "bench", cue: "Lower to mid-chest, feet flat on the floor." },
  { id: "incline-dumbbell-press", name: "Incline Dumbbell Press", category: "Chest", pose: "bench", cue: "Bench at ~30°, press up and slightly in." },
  { id: "dips", name: "Dips", category: "Chest", pose: "dip", cue: "Lean forward slightly to bias the chest, control the descent." },

  // Biceps
  { id: "barbell-curl", name: "Barbell Curl", category: "Biceps", pose: "curl", cue: "Elbows pinned to your sides, no swinging." },
  { id: "dumbbell-curl", name: "Dumbbell Curl", category: "Biceps", pose: "curl", cue: "Rotate palms up as you curl, squeeze at the top." },
  { id: "hammer-curl", name: "Hammer Curl", category: "Biceps", pose: "curl", cue: "Palms face each other throughout the movement." },
  { id: "chin-ups", name: "Chin-ups", category: "Biceps", pose: "pullUp", cue: "Underhand grip, pull with your arms as much as your back." },

  // Triceps
  { id: "tricep-dips", name: "Tricep Dips", category: "Triceps", pose: "dip", cue: "Stay upright, elbows point straight back." },
  { id: "overhead-tricep-extension", name: "Overhead Tricep Extension", category: "Triceps", pose: "press", cue: "Elbows stay close to your head, lower behind the neck." },
  { id: "close-grip-push-up", name: "Close-grip Push-up", category: "Triceps", pose: "pushUp", cue: "Hands under shoulders, elbows brush your sides." },

  // Shoulders
  { id: "overhead-press", name: "Overhead Press", category: "Shoulders", pose: "press", cue: "Brace your core, press straight overhead." },
  { id: "lateral-raise", name: "Lateral Raise", category: "Shoulders", pose: "lateralRaise", cue: "Slight bend in the elbows, raise to shoulder height." },
  { id: "face-pull", name: "Face Pull", category: "Shoulders", pose: "facePull", cue: "Pull toward your face, lead with the elbows high." },

  // Legs
  { id: "squats", name: "Squats", category: "Legs", pose: "squat", cue: "Knees track over toes, hips back and down." },
  { id: "lunges", name: "Lunges", category: "Legs", pose: "lunge", cue: "Front knee over ankle, drop the back knee straight down." },
  { id: "leg-press", name: "Leg Press", category: "Legs", pose: "squat", cue: "Don't lock knees at the top, control the negative." },
  { id: "romanian-deadlift", name: "Romanian Deadlift", category: "Legs", pose: "deadlift", cue: "Soft knees, hinge at the hips, feel it in the hamstrings." },
  { id: "calf-raises", name: "Calf Raises", category: "Legs", pose: "calfRaise", cue: "Full stretch at the bottom, pause at the top." },
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", category: "Legs", pose: "lunge", cue: "Rear foot elevated, most of the weight on the front leg." },

  // Glutes
  { id: "hip-thrust", name: "Hip Thrust", category: "Glutes", pose: "hipThrust", cue: "Chin tucked, drive through your heels, squeeze at the top." },
  { id: "glute-bridge", name: "Glute Bridge", category: "Glutes", pose: "hipThrust", cue: "Flatten your lower back first, then lift your hips." },
  { id: "donkey-kicks", name: "Donkey Kicks", category: "Glutes", pose: "hipThrust", cue: "Keep the knee bent at 90°, kick up without arching your back." },

  // Cardio
  { id: "running", name: "Running", category: "Cardio", pose: "run", cue: "Relaxed shoulders, land under your hips, not out front." },
  { id: "cycling", name: "Cycling", category: "Cardio", pose: "cycle", cue: "Slight bend in the knee at full extension." },
  { id: "rowing", name: "Rowing", category: "Cardio", pose: "rowErg", cue: "Legs, then lean, then arms — reverse the order on the way back." },
  { id: "jump-rope", name: "Jump Rope", category: "Cardio", pose: "jumpRope", cue: "Small hops, rotate from the wrists, not the shoulders." },
  { id: "burpees", name: "Burpees", category: "Cardio", pose: "burpee", cue: "Chest to the floor, explode up into a jump." },
];

export function exercisesByCategory(category: ExerciseCategory): Exercise[] {
  return EXERCISES.filter((e) => e.category === category);
}
