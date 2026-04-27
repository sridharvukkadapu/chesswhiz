"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachMessage } from "@/lib/chess/types";
import { T } from "@/lib/design/tokens";
import CoachPawn from "@/components/CoachPawn";
import VoiceWave from "@/components/VoiceWave";
import { usePrefersReducedMotion } from "@/lib/design/atmosphere";

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
            background: T.coral,
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
    bg: "linear-gradient(180deg, rgba(242,201,76,0.10) 0%, rgba(242,201,76,0.04) 100%)",
    border: "rgba(242,201,76,0.35)",
    tail: "rgba(242,201,76,0.35)",
    tone: T.butterDeep,
  },
  praise: {
    bg: "linear-gradient(180deg, rgba(124,182,158,0.10) 0%, rgba(124,182,158,0.04) 100%)",
    border: "rgba(124,182,158,0.35)",
    tail: "rgba(124,182,158,0.35)",
    tone: T.sageDeep,
  },
  tip: {
    bg: "#FFFCF5",
    border: T.border,
    tail: T.border,
    tone: T.inkLow,
  },
  correction: {
    bg: "linear-gradient(180deg, rgba(255,107,90,0.10) 0%, rgba(255,107,90,0.04) 100%)",
    border: "rgba(255,107,90,0.30)",
    tail: "rgba(255,107,90,0.30)",
    tone: T.coral,
  },
  celebration: {
    bg: "linear-gradient(180deg, rgba(255,107,90,0.14) 0%, rgba(242,201,76,0.08) 100%)",
    border: "rgba(255,107,90,0.35)",
    tail: "rgba(255,107,90,0.35)",
    tone: T.coral,
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
        background: "#FFFCF5",
        borderRadius: 22,
        padding: "18px 18px 16px",
        border: `1.5px solid ${T.border}`,
        boxShadow: T.shadowSoft,
      }}
    >
      {/* Coach Pawn header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <CoachPawn size={78} expression={expression} mode="kid" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 24,
              color: T.ink,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            Coach Pawn
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            {voicePlaying ? (
              <>
                <VoiceWave scale={0.55} color={T.coral} speaking />
                <span
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 11,
                    color: T.coral,
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
                        background: T.coral,
                        animation: `cpDotPulse 1.4s ease-in-out ${i * 0.18}s infinite`,
                      }}
                    />
                  ))}
                </span>
                <span
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 11,
                    color: T.coral,
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
                    background: T.sage,
                    boxShadow: `0 0 6px ${T.sage}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 11,
                    color: T.inkLow,
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

      {/* Messages */}
      <div
        ref={ref}
        aria-live="polite"
        aria-label="Coach messages"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: 340,
          overflowY: "auto",
          paddingRight: 2,
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
                borderRadius: 16,
                padding: "13px 16px",
                boxShadow: T.e1,
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: -11,
                  top: 16,
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
                  lineHeight: 1.58,
                  color: T.ink,
                  fontFamily: T.fontUI,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {isLatest ? <Typewriter text={msg.text} /> : msg.text}
              </p>
            </div>
          );
        })}

        {loading && (
          <div
            aria-hidden
            className="cp-msg"
            style={{
              position: "relative",
              background: "#FFFCF5",
              border: `1.5px solid ${T.border}`,
              borderRadius: 16,
              padding: "13px 16px",
              width: 72,
              boxShadow: T.e1,
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: -11,
                top: 16,
                width: 0,
                height: 0,
                borderTop: "10px solid transparent",
                borderBottom: "10px solid transparent",
                borderRight: `12px solid ${T.border}`,
              }}
            />
            <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T.coral,
                    animation: `cpDotPulse 1.2s ${i * 0.15}s infinite ease-in-out`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <p
            style={{
              fontSize: 13,
              color: T.inkDim,
              textAlign: "center",
              marginTop: 14,
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
          animation: cpMsgIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cpMsgIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
