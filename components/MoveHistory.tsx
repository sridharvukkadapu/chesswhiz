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
    <div className="rounded-xl border overflow-hidden" style={{ background: "#1e1c1a", borderColor: "#3a3633" }}>
      <div className="px-3 py-2 border-b" style={{ borderColor: "#3a3633" }}>
        <span className="text-xs font-semibold tracking-wider" style={{ color: "#8a8278", fontFamily: "'Outfit', sans-serif" }}>
          MOVES
        </span>
      </div>
      <div ref={ref} className="px-3 py-2 overflow-y-auto" style={{ maxHeight: 96 }}>
        {pairs.length === 0 ? (
          <span className="text-xs italic" style={{ color: "#5a5550", fontFamily: "'Outfit', sans-serif" }}>
            Your move first!
          </span>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr", gap: "2px 6px" }}>
            {pairs.map((p) => (
              <div key={p.num} style={{ display: "contents" }}>
                <span className="text-right text-xs" style={{ color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.num}.
                </span>
                <span className="text-xs font-semibold" style={{ color: "#f5f0ea", fontFamily: "'JetBrains Mono', monospace" }}>
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
