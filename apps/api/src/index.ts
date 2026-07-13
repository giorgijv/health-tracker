import "dotenv/config";
import cors from "cors";
import express from "express";
import { accountRouter } from "./routes/account.js";
import { bodyPhotosRouter } from "./routes/bodyPhotos.js";
import { foodLogsRouter } from "./routes/foodLogs.js";
import { metricsRouter } from "./routes/metrics.js";
import { profileRouter } from "./routes/profile.js";
import { workoutGoalsRouter } from "./routes/workoutGoals.js";
import { workoutsRouter } from "./routes/workouts.js";

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

// Report the deployed commit so "is the API up to date?" is a one-request
// check instead of a guessing game. Render injects RENDER_GIT_COMMIT for
// every deploy; falls back to "local"/an explicit override elsewhere.
const DEPLOYED_COMMIT =
  process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? "local";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", commit: DEPLOYED_COMMIT });
});

app.use("/api/profile", profileRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/workouts", workoutsRouter);
app.use("/api/workout-goals", workoutGoalsRouter);
app.use("/api/body-photos", bodyPhotosRouter);
app.use("/api/food-logs", foodLogsRouter);
app.use("/api/account", accountRouter);

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
