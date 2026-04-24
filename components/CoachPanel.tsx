"use client";

import { useEffect, useRef } from "react";
import type { CoachMessage } from "@/lib/chess/types";

const P = {
  cream: "#FBF7F0",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkSoft: "#2E2620",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkFaint: "#B0A898",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
  goldPale: "#FDF6E3",
};

const MSG_STYLES: Record<CoachMessage["type"], { bg: string; border: string; labelColor: string }> = {
  intro:       { bg: P.goldPale,    border: P.gold,    labelColor: P.gold },
  praise:      { bg: P.emeraldPale, border: P.emerald, labelColor: P.emerald },
  tip:         { bg: "white",       border: P.inkGhost, labelColor: P.inkMed },
  correction:  { bg: "#FFF5EB",     border: "#FDBA74", labelColor: "#9A3412" },
  celebration: { bg: P.goldPale,    border: P.gold,    labelColor: P.gold },
};

function CoachIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2z" />
      <path d="M12 12c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" />
    </svg>
  );
}

interface CoachPanelProps {
  messages: CoachMessage[];
  loading: boolean;
}

export default function CoachPanel({ messages, loading }: CoachPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      borderRadius: 16, overflow: "hidden",
      background: "white",
      border: `1px solid ${P.inkGhost}`,
      boxShadow: `0 4px 20px rgba(26,18,16,0.06)`,
      flex: "1 1 0", minHeight: 240, maxHeight: 380,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px",
        borderBottom: `1px solid ${P.parchment}`,
        background: P.cream,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: P.emeraldPale, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1.5px solid ${P.emerald}30`,
          color: P.emerald, flexShrink: 0,
        }}>
          <CoachIcon />
        </div>
        <span style={{
          fontSize: 14, fontWeight: 800, color: P.ink,
          fontFamily: "var(--font-playfair), serif",
          letterSpacing: -0.2,
        }}>Coach Pawn</span>

        {/* Online indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: P.emerald }} />
          <span style={{ fontSize: 10, color: P.emerald, fontFamily: "var(--font-nunito), sans-serif", fontWeight: 600 }}>Online</span>
        </div>

        {/* Thinking dots */}
        {loading && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }} aria-label="Coach is thinking">
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                background: P.gold,
                animation: `dotPulse 1.4s infinite ease-in-out ${i * 0.2}s`,
              }} />
            ))}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={ref}
        style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}
        aria-live="polite"
        aria-label="Coach messages"
      >
        {messages.map((msg) => {
          const s = MSG_STYLES[msg.type] ?? MSG_STYLES.tip;
          return (
            <div
              key={msg.id}
              className="coach-fade"
              style={{
                padding: "10px 14px",
                background: s.bg,
                borderLeft: `3px solid ${s.border}`,
                borderRadius: "2px 12px 12px 12px",
                border: `1px solid ${s.border}30`,
                borderLeftWidth: 3,
              }}
            >
              <p style={{
                margin: 0, fontSize: 13.5, lineHeight: 1.7,
                color: P.inkSoft,
                fontFamily: "var(--font-nunito), sans-serif",
              }}>{msg.text}</p>
            </div>
          );
        })}

        {messages.length === 0 && !loading && (
          <p style={{
            fontSize: 13, color: P.inkFaint, textAlign: "center",
            marginTop: 16, fontStyle: "italic",
            fontFamily: "var(--font-nunito), sans-serif",
          }}>Make your first move to get coaching!</p>
        )}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1); }
        }
        .coach-fade {
          animation: coachFadeIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes coachFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
