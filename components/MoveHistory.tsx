"use client";

import { useEffect, useRef } from "react";
import { T } from "@/lib/design/tokens";

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
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          fontFamily: T.fontUI,
          fontSize: 11,
          fontWeight: 700,
          color: T.textLo,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Move history{moves.length > 0 ? ` · ${moves.length} ply` : ""}
      </div>

      {pairs.length === 0 ? (
        <div
          style={{
            fontFamily: T.fontUI,
            fontSize: 13,
            fontStyle: "italic",
            color: T.textDim,
          }}
        >
          Your move first!
        </div>
      ) : (
        <div
          ref={ref}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 14px",
            maxHeight: 144,
            overflowY: "auto",
          }}
        >
          {pairs.map((p, idx) => (
            <div key={p.num} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 12,
                  color: T.textDim,
                  width: 22,
                  textAlign: "right",
                }}
              >
                {p.num}.
              </span>
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 13,
                  fontWeight: idx === pairs.length - 1 && !p.b ? 700 : 500,
                  color: idx === pairs.length - 1 && !p.b ? T.emerald : T.textHi,
                }}
              >
                {p.w}
              </span>
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 13,
                  color: T.textLo,
                }}
              >
                {p.b || "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
