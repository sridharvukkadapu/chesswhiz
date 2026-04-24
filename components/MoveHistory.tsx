"use client";

import { useEffect, useRef } from "react";

const P = {
  cream: "#FBF7F0",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkFaint: "#B0A898",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
};

interface MoveHistoryProps {
  moves: string[];
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [moves]);

  const pairs: { num: number; w: string; b: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ num: Math.floor(i / 2) + 1, w: moves[i], b: moves[i + 1] ?? "" });
  }

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      background: "white",
      border: `1px solid ${P.inkGhost}`,
      boxShadow: `0 4px 20px rgba(26,18,16,0.06)`,
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 16px",
        borderBottom: `1px solid ${P.parchment}`,
        background: P.cream,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: P.inkFaint }} aria-hidden="true">
          <path d="M12 2v10l4 4" /><circle cx="12" cy="12" r="10" />
        </svg>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
          color: P.inkMed, fontFamily: "var(--font-nunito), sans-serif",
        }}>Moves</span>
        {moves.length > 0 && (
          <span style={{
            marginLeft: "auto", fontSize: 10, color: P.inkFaint,
            fontFamily: "var(--font-nunito), sans-serif",
          }}>{Math.ceil(moves.length / 2)} {Math.ceil(moves.length / 2) === 1 ? "move" : "moves"}</span>
        )}
      </div>

      {/* Move list */}
      <div ref={ref} style={{ padding: "8px 12px", overflowY: "auto", maxHeight: 144 }}>
        {pairs.length === 0 ? (
          <span style={{
            fontSize: 12, fontStyle: "italic", color: P.inkFaint,
            fontFamily: "var(--font-nunito), sans-serif",
          }}>Your move first!</span>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr", gap: "2px 8px" }}>
            {pairs.map((p) => (
              <div key={p.num} style={{ display: "contents" }}>
                <span style={{
                  textAlign: "right", fontSize: 11, color: P.inkFaint,
                  fontFamily: "'JetBrains Mono', monospace", lineHeight: "22px",
                }}>{p.num}.</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: P.ink,
                  fontFamily: "'JetBrains Mono', monospace", lineHeight: "22px",
                }}>{p.w}</span>
                <span style={{
                  fontSize: 12, color: P.inkLight,
                  fontFamily: "'JetBrains Mono', monospace", lineHeight: "22px",
                }}>{p.b}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
