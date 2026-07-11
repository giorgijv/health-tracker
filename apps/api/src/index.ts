import "dotenv/config";
import cors from "cors";
import express from "express";
import { profileRouter } from "./routes/profile.js";

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/profile", profileRouter);

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
