import type Anthropic from "@anthropic-ai/sdk";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/rateLimit.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { formatContext, gatherUserContext } from "../lib/userContext.js";
import { chatReply, generateNudge } from "../lib/chat.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const HISTORY_LIMIT = 20;

function toChatMessage(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

function aiError(res: import("express").Response, err: unknown) {
  const message = err instanceof Error ? err.message : "Unknown error";
  if (message.includes("ANTHROPIC_API_KEY is not set")) {
    res.status(503).json({ error: "AI chat is not configured (missing API key)." });
    return;
  }
  console.error("Chat AI call failed:", message);
  res.status(502).json({ error: "The coach couldn't respond just now — try again." });
}

chatRouter.get("/", async (req: AuthedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data.map(toChatMessage));
});

const sendSchema = z.object({ message: z.string().min(1).max(4000) });

chatRouter.post("/", aiRateLimit, async (req: AuthedRequest, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Persist the user turn first so it survives an AI failure.
  const { data: userMsg, error: insErr } = await supabaseAdmin
    .from("chat_messages")
    .insert({ user_id: req.userId, role: "user", content: parsed.data.message })
    .select()
    .single();

  if (insErr) {
    res.status(500).json({ error: insErr.message });
    return;
  }

  // Load the recent conversation (newest 20), oldest-first for the model.
  const { data: recent } = await supabaseAdmin
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const history: Anthropic.MessageParam[] = (recent ?? [])
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string }));

  let reply: string;
  try {
    const context = formatContext(await gatherUserContext(req.userId!));
    reply = await chatReply(context, history);
  } catch (err) {
    aiError(res, err);
    return;
  }

  const { data: assistantMsg, error: aErr } = await supabaseAdmin
    .from("chat_messages")
    .insert({ user_id: req.userId, role: "assistant", content: reply })
    .select()
    .single();

  if (aErr) {
    res.status(500).json({ error: aErr.message });
    return;
  }

  res.status(201).json({
    userMessage: toChatMessage(userMsg),
    assistantMessage: toChatMessage(assistantMsg),
  });
});

chatRouter.post("/nudge", aiRateLimit, async (req: AuthedRequest, res) => {
  try {
    const context = formatContext(await gatherUserContext(req.userId!));
    const nudge = await generateNudge(context);
    res.json({ nudge });
  } catch (err) {
    aiError(res, err);
  }
});

chatRouter.delete("/", async (req: AuthedRequest, res) => {
  const { error } = await supabaseAdmin.from("chat_messages").delete().eq("user_id", req.userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).end();
});
