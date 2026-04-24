"use client";

import { useEffect, useRef } from "react";

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
    <div className="rounded-xl border overflow-hidden" style={{ background: "#192134", borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
      <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#475569", fontFamily: "var(--font-nunito), sans-serif" }}>
          MOVES
        </span>
      </div>
      <div ref={ref} className="px-3 py-2 overflow-y-auto" style={{ maxHeight: 144 }}>
        {pairs.length === 0 ? (
          <span className="text-xs italic" style={{ color: "#475569", fontFamily: "var(--font-nunito), sans-serif" }}>
            Your move first!
          </span>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr", gap: "2px 6px" }}>
            {pairs.map((p) => (
              <div key={p.num} style={{ display: "contents" }}>
                <span className="text-right text-xs" style={{ color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.num}.
                </span>
                <span className="text-xs font-semibold" style={{ color: "#f1ede8", fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.w}
                </span>
                <span className="text-xs" style={{ color: "#8a8278", fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.b}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
