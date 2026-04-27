"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachMessage } from "@/lib/chess/types";
import { T } from "@/lib/design/tokens";
import CoachPawn from "@/components/CoachPawn";
import VoiceWave from "@/components/VoiceWave";
import { usePrefersReducedMotion } from "@/lib/design/atmosphere";

// Typewriter — reveals text char-by-char at ~28 chars/sec when first
// mounted. Older coach messages re-render fully (no replay). Used only
// on the most-recent message so back-scroll stays readable.
function Typewriter({ text, speed = 28 }: { text: string; speed?: number }) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) {
      setN(text.length);
      return;
    }
    setN(0);
    const total = text.length;
    let raf: number | null = null;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const target = Math.min(total, Math.floor(elapsed * speed));
      setN(target);
      if (target < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [text, speed, reduced]);

  const visible = text.slice(0, n);
  const done = n >= text.length;
  return (
    <>
      {visible}
      {!done && (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 2,
            height: "0.95em",
            background: T.amberGlow,
            marginLeft: 3,
            verticalAlign: "middle",
            animation: "tpCursor 0.85s ease-in-out infinite",
          }}
        />
      )}
      <style>{`
        @keyframes tpCursor {
          0%, 100% { opacity: 0.2; }
          50%      { opacity: 1; }
        }
      `}</style>
    </>
  );
}

const MSG_STYLES: Record<
  CoachMessage["type"],
  { bg: string; border: string; tail: string; tone: string }
> = {
  intro: {
    bg: "linear-gradient(180deg, rgba(245,182,56,0.10) 0%, rgba(245,182,56,0.04) 100%)",
    border: "rgba(245,182,56,0.28)",
    tail: "rgba(245,182,56,0.28)",
    tone: T.amberGlow,
  },
  praise: {
    bg: "linear-gradient(180deg, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0.04) 100%)",
    border: "rgba(52,211,153,0.28)",
    tail: "rgba(52,211,153,0.28)",
    tone: T.emeraldGlow,
  },
  tip: {
    bg: "rgba(255,255,255,0.04)",
    border: T.border,
    tail: T.border,
    tone: T.textMed,
  },
  correction: {
    bg: "linear-gradient(180deg, rgba(255,107,107,0.10) 0%, rgba(255,107,107,0.04) 100%)",
    border: "rgba(255,107,107,0.28)",
    tail: "rgba(255,107,107,0.28)",
    tone: T.rubyGlow,
  },
  celebration: {
    bg: "linear-gradient(180deg, rgba(245,182,56,0.18) 0%, rgba(245,182,56,0.06) 100%)",
    border: "rgba(252,211,77,0.5)",
    tail: "rgba(252,211,77,0.5)",
    tone: T.amberGlow,
  },
};

interface CoachPanelProps {
  messages: CoachMessage[];
  loading: boolean;
  voicePlaying?: boolean;
}

export default function CoachPanel({ messages, loading, voicePlaying = false }: CoachPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  // Coach expression: cheer if last message is celebration/intro praise,
  // talking if voice is playing, sad on correction-only state, idle otherwise.
  const last = messages[messages.length - 1];
  const expression = voicePlaying
    ? "talking"
    : last?.type === "celebration"
      ? "cheer"
      : last?.type === "correction"
        ? "sad"
        : "idle";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Coach Pawn header — character + name + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <CoachPawn size={84} expression={expression} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontSize: 26,
              fontWeight: 600,
              color: T.textHi,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            Coach Pawn
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            {voicePlaying ? (
              <>
                <VoiceWave scale={0.55} color={T.amberGlow} speaking />
                <span
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 11,
                    color: T.amberGlow,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Speaking
                </span>
              </>
            ) : loading ? (
              <>
                <span style={{ display: "inline-flex", gap: 3 }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: T.amberGlow,
                        animation: `cpDotPulse 1.4s ease-in-out ${i * 0.18}s infinite`,
                      }}
                    />
                  ))}
                </span>
                <span
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 11,
                    color: T.amberGlow,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Thinking
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: T.emerald,
                    boxShadow: `0 0 8px ${T.emerald}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 11,
                    color: T.textLo,
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Online · listening
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div
        ref={ref}
        aria-live="polite"
        aria-label="Coach messages"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: 360,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {messages.map((msg, i) => {
          const s = MSG_STYLES[msg.type] ?? MSG_STYLES.tip;
          const isLatest = i === messages.length - 1;
          return (
            <div
              key={msg.id}
              className="cp-msg"
              style={{
                position: "relative",
                background: s.bg,
                border: `1.5px solid ${s.border}`,
                borderRadius: 18,
                padding: "14px 18px",
                boxShadow: `inset 0 1px 0 rgba(252,211,77,0.05), ${T.e2}`,
              }}
            >
              {/* tail */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: -10,
                  top: 18,
                  width: 0,
                  height: 0,
                  borderTop: "10px solid transparent",
                  borderBottom: "10px solid transparent",
                  borderRight: `12px solid ${s.tail}`,
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: T.textHi,
                  fontFamily: T.fontUI,
                  // typed-text container is anchored here
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {isLatest ? <Typewriter text={msg.text} /> : msg.text}
              </p>
            </div>
          );
        })}

        {messages.length === 0 && !loading && (
          <p
            style={{
              fontSize: 13,
              color: T.textDim,
              textAlign: "center",
              marginTop: 16,
              fontStyle: "italic",
              fontFamily: T.fontUI,
            }}
          >
            Make your first move to get coaching!
          </p>
        )}
      </div>

      <style>{`
        @keyframes cpDotPulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1); }
        }
        .cp-msg {
          animation: cpMsgIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cpMsgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
