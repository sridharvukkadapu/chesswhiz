"use client";

import { useEffect, useRef } from "react";
import type { CoachMessage } from "@/lib/chess/types";

interface CoachPanelProps {
  messages: CoachMessage[];
  loading: boolean;
}

const MSG_STYLES: Record<CoachMessage["type"], { bg: string; border: string }> = {
  intro:       { bg: "rgba(91,184,232,0.08)",  border: "#5bb8e8" },
  praise:      { bg: "rgba(196,232,91,0.08)",  border: "#c4e85b" },
  tip:         { bg: "rgba(91,184,232,0.08)",  border: "#5bb8e8" },
  correction:  { bg: "rgba(232,112,91,0.08)",  border: "#e8705b" },
  celebration: { bg: "rgba(196,232,91,0.08)",  border: "#c4e85b" },
};

export default function CoachPanel({ messages, loading }: CoachPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden"
      style={{ background: "#1e1c1a", borderColor: "#3a3633", flex: "1 1 0", minHeight: 240, maxHeight: 380 }}
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#3a3633" }}>
        <span className="text-lg">🐾</span>
        <span className="text-sm font-bold" style={{ color: "#5bb8e8", fontFamily: "'Fredoka', sans-serif", letterSpacing: "0.3px" }}>
          Coach Pawn
        </span>
        {loading && (
          <span className="ml-auto text-xs" style={{ color: "#5a5550", fontFamily: "'Outfit', sans-serif" }}>
            thinking<span className="coach-dots">...</span>
          </span>
        )}
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.map((msg) => {
          const style = MSG_STYLES[msg.type] ?? MSG_STYLES.tip;
          return (
            <div
              key={msg.id}
              className="px-3 py-2 coach-fade"
              style={{
                background: style.bg,
                borderLeft: `3px solid ${style.border}`,
                borderRadius: "2px 12px 12px 12px",
              }}
            >
              <p className="text-sm leading-relaxed m-0" style={{ color: "#c8c0b5", fontFamily: "'Outfit', sans-serif" }}>
                {msg.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
