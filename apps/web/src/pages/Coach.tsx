import type { ChatMessage } from "@health-tracker/shared";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

interface SendResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

const SUGGESTIONS = [
  "How's my week going?",
  "Am I eating enough protein?",
  "What should I focus on next?",
];

export function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nudge, setNudge] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const history = await apiFetch<ChatMessage[]>("/api/chat");
        setMessages(history);
        if (history.length === 0) {
          // Open with a proactive check-in.
          try {
            const { nudge } = await apiFetch<{ nudge: string }>("/api/chat/nudge", {
              method: "POST",
            });
            setNudge(nudge);
          } catch {
            // nudge is best-effort; ignore failures (e.g. missing key)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    setNudge(null);

    // Optimistically show the user turn.
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      userId: "",
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await apiFetch<SendResponse>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      // Replace the optimistic message with the server pair.
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        res.userMessage,
        res.assistantMessage,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  async function clearChat() {
    if (!confirm("Clear the whole conversation?")) return;
    try {
      await apiFetch("/api/chat", { method: "DELETE" });
      setMessages([]);
      setNudge(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clear failed");
    }
  }

  return (
    <div className="coach">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <div className="coach-head">
        <h1>Coach</h1>
        {messages.length > 0 && (
          <button className="clear" onClick={clearChat}>
            Clear
          </button>
        )}
      </div>

      <div className="chat-window">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            {nudge && messages.length === 0 && (
              <div className="msg assistant nudge">{nudge}</div>
            )}
            {messages.length === 0 && !nudge && (
              <p className="empty">Ask me anything about your health and progress.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                {m.content}
              </div>
            ))}
            {sending && <div className="msg assistant thinking">…</div>}
            <div ref={endRef} />
          </>
        )}
      </div>

      {messages.length === 0 && !loading && (
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={sending}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
