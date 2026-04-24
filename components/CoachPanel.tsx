"use client";

import { useEffect, useRef } from "react";
import type { CoachMessage } from "@/lib/chess/types";

interface CoachPanelProps {
  messages: CoachMessage[];
  loading: boolean;
}

const MSG_STYLES: Record<CoachMessage["type"], { bg: string; border: string; labelColor: string }> = {
  intro:       { bg: "rgba(217,119,6,0.07)",   border: "#D97706", labelColor: "#D97706" },
  praise:      { bg: "rgba(34,197,94,0.07)",   border: "#22C55E", labelColor: "#22C55E" },
  tip:         { bg: "rgba(148,163,184,0.07)", border: "#64748B", labelColor: "#94A3B8" },
  correction:  { bg: "rgba(220,38,38,0.07)",   border: "#DC2626", labelColor: "#f87171" },
  celebration: { bg: "rgba(217,119,6,0.1)",    border: "#D97706", labelColor: "#D97706" },
};

function CoachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2z" />
      <path d="M12 12c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" />
      <path d="M9 7l1.5 1.5L13 6" strokeWidth="2" />
    </svg>
  );
}

export default function CoachPanel({ messages, loading }: CoachPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden"
      style={{
        background: "#192134",
        borderColor: "rgba(255,255,255,0.08)",
        flex: "1 1 0",
        minHeight: 240,
        maxHeight: 380,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <span className="flex items-center" style={{ color: "#D97706" }}>
          <CoachIcon />
        </span>
        <span
          className="text-sm font-bold tracking-wide"
          style={{ color: "#D97706", fontFamily: "var(--font-baloo), sans-serif" }}
        >
          Coach Pawn
        </span>
        {loading && (
          <span className="ml-auto flex items-center gap-1" aria-label="Coach is thinking">
            <span className="coach-dot" />
            <span className="coach-dot" />
            <span className="coach-dot" />
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={ref} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" aria-live="polite" aria-label="Coach messages">
        {messages.map((msg) => {
          const s = MSG_STYLES[msg.type] ?? MSG_STYLES.tip;
          return (
            <div
              key={msg.id}
              className="px-3 py-2.5 coach-fade"
              style={{
                background: s.bg,
                borderLeft: `3px solid ${s.border}`,
                borderRadius: "2px 10px 10px 10px",
              }}
            >
              <p
                className="text-sm leading-relaxed m-0"
                style={{ color: "#e2ddd8", fontFamily: "var(--font-nunito), sans-serif" }}
              >
                {msg.text}
              </p>
            </div>
          );
        })}
        {messages.length === 0 && !loading && (
          <p
            className="text-xs italic text-center mt-4"
            style={{ color: "#4a5568", fontFamily: "var(--font-nunito), sans-serif" }}
          >
            Make your first move to get coaching!
          </p>
        )}
      </div>
    </div>
  );
}
