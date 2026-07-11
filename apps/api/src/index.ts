import "dotenv/config";
import cors from "cors";
import express from "express";
import { assessmentsRouter } from "./routes/assessments.js";
import { metricsRouter } from "./routes/metrics.js";
import { profileRouter } from "./routes/profile.js";
import { workoutsRouter } from "./routes/workouts.js";

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/profile", profileRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/workouts", workoutsRouter);
app.use("/api/assessments", assessmentsRouter);

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
