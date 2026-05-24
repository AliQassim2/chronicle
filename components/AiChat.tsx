"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface AiChatProps {
  onInsertTitle?: (text: string) => void;
  onInsertContent?: (text: string) => void;
}

const MODELS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
];

export default function AiChat({ onInsertTitle, onInsertContent }: AiChatProps) {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "مرحباً! أنا مساعدك الذكي.\n\nاستخدم الوسوم التالية لتغيير أسلوب الرد:\n• <strong>[بحث]</strong> — تقرير أكاديمي فخم<br>• <strong>[تحقيق]</strong> — سيناريو جريمة بوليسية<br>• <strong>[إثبات]</strong> — نظرية علمية معقدة<br><br>بدون وسم، أعمل كمساعد تقني محترف." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", text: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, model }),
      });

      if (res.status === 429) {
        const err = await res.json().catch(() => ({ error: "Rate limited" }));
        setMessages((prev) => [...prev, { role: "assistant", text: err.error || "Rate limited. Try again later." }]);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      const usedModel = res.headers.get("X-Model");
      const modelNote = usedModel && usedModel !== model
        ? `<p class="text-xs text-zinc-400 mt-2">(auto-fell back to ${usedModel})</p>`
        : "";

      if (modelNote) {
        setMessages((prev) => [...prev, { role: "assistant", text: "" }]);
      }

      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantText = modelNote;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", text: assistantText },
        ]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="mt-8 border-t border-zinc-200 pt-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
      >
        <span className="text-xs">{open ? "▾" : "▸"}</span>
        <span>AI Assistant</span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
          {MODELS.find((m) => m.id === model)?.label || model}
        </span>
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-zinc-200 px-2 py-1 font-medium text-zinc-700">[بحث]</span>
              <span className="text-zinc-400">—</span>
              <span className="text-zinc-500">تقرير أكاديمي فخم</span>
              <span className="rounded-md bg-zinc-200 px-2 py-1 font-medium text-zinc-700">[تحقيق]</span>
              <span className="text-zinc-400">—</span>
              <span className="text-zinc-500">سيناريو جريمة بوليسية</span>
              <span className="rounded-md bg-zinc-200 px-2 py-1 font-medium text-zinc-700">[إثبات]</span>
              <span className="text-zinc-400">—</span>
              <span className="text-zinc-500">نظرية علمية فاشلة</span>
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex h-80 flex-col gap-4 overflow-y-auto p-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white rounded-br-md"
                      : "bg-zinc-50 text-zinc-700 border border-zinc-100 rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" && msg.text ? (
                    <div className="prose prose-zinc prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.text }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text || (loading && i === messages.length - 1 ? "" : "")}</p>
                  )}
                  {msg.role === "assistant" && msg.text && onInsertTitle && onInsertContent && (
                    <div className="mt-3 flex gap-2 border-t border-zinc-200 pt-2">
                      <button
                        type="button"
                        onClick={() => onInsertTitle(msg.text.replace(/<[^>]*>/g, "").split("\n")[0].slice(0, 500))}
                        className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700"
                      >
                        Use as title
                      </button>
                      <button
                        type="button"
                        onClick={() => onInsertContent(msg.text)}
                        className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700"
                      >
                        Use as content
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.text === "" && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
                  AI
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-300" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-300" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-300" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-3 border-t border-zinc-200 p-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to help write your story..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="self-end rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
