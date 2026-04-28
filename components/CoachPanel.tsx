"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachMessage } from "@/lib/chess/types";
import type { CoachResponse, FollowUpChip } from "@/lib/coaching/schema";
import { T } from "@/lib/design/tokens";
import CoachPawn from "@/components/CoachPawn";
import VoiceWave from "@/components/VoiceWave";
import { usePrefersReducedMotion } from "@/lib/design/atmosphere";

// ── Typewriter with optional start delay ──────────────────────────────────

function Typewriter({
  text,
  speed = 45,
  delayMs = 0,
  onDone,
}: {
  text: string;
  speed?: number;
  delayMs?: number;
  onDone?: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(reduced ? text.length : 0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    if (reduced) {
      setN(text.length);
      onDone?.();
      return;
    }
    setN(0);
    let raf: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const start = () => {
      const startTime = performance.now();
      const total = text.length;
      const tick = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        const target = Math.min(total, Math.floor(elapsed * speed));
        setN(target);
        if (target < total) {
          raf = requestAnimationFrame(tick);
        } else if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      };
      raf = requestAnimationFrame(tick);
    };

    if (delayMs > 0) {
      timeoutId = setTimeout(start, delayMs);
    } else {
      start();
    }

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [text, speed, delayMs, reduced]);

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
          50%       { opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Thinking dots ──────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, verticalAlign: "middle" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: T.coral,
            display: "inline-block",
            animation: `cpDotBounce 1.4s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes cpDotBounce {
          0%, 80%, 100% { transform: translateY(0) scale(0.7); opacity: 0.4; }
          40% { transform: translateY(-5px) scale(1); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

// ── Coach pawn avatar (emotion-aware) ─────────────────────────────────────

function CoachPawnAvatar({ emotion, loading, voicePlaying }: {
  emotion?: CoachResponse["emotion"];
  loading?: boolean;
  voicePlaying?: boolean;
}) {
  const expression = voicePlaying
    ? "talking"
    : emotion === "excited" || emotion === "happy"
      ? "cheer"
      : emotion === "concerned"
        ? "sad"
        : "idle";

  return <CoachPawn size={78} expression={expression} mode="kid" />;
}

// ── Follow-up chips ────────────────────────────────────────────────────────

function ChipRow({ chips, onTap }: { chips: FollowUpChip[]; onTap: (chip: FollowUpChip) => void }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 10,
        animation: "cpChipsIn 0.3s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {chips.map((chip, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onTap(chip)}
          style={{
            padding: "7px 14px",
            borderRadius: 20,
            border: `1.5px solid ${T.border}`,
            background: "#FFFCF5",
            color: T.ink,
            fontFamily: T.fontUI,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 140ms ease",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.coral;
            (e.currentTarget as HTMLButtonElement).style.color = "white";
            (e.currentTarget as HTMLButtonElement).style.borderColor = T.coral;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#FFFCF5";
            (e.currentTarget as HTMLButtonElement).style.color = T.ink;
            (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
          }}
        >
          {chip.label}
        </button>
      ))}
      <style>{`
        @keyframes cpChipsIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Legacy message bubble (for CoachMessage type — intro/game-end etc) ────

const MSG_STYLES: Record<
  CoachMessage["type"],
  { bg: string; border: string; tail: string }
> = {
  intro:       { bg: "linear-gradient(180deg, rgba(242,201,76,0.10) 0%, rgba(242,201,76,0.04) 100%)", border: "rgba(242,201,76,0.35)", tail: "rgba(242,201,76,0.35)" },
  praise:      { bg: "linear-gradient(180deg, rgba(124,182,158,0.10) 0%, rgba(124,182,158,0.04) 100%)", border: "rgba(124,182,158,0.35)", tail: "rgba(124,182,158,0.35)" },
  tip:         { bg: "#FFFCF5", border: T.border, tail: T.border },
  correction:  { bg: "linear-gradient(180deg, rgba(255,107,90,0.10) 0%, rgba(255,107,90,0.04) 100%)", border: "rgba(255,107,90,0.30)", tail: "rgba(255,107,90,0.30)" },
  celebration: { bg: "linear-gradient(180deg, rgba(255,107,90,0.14) 0%, rgba(242,201,76,0.08) 100%)", border: "rgba(255,107,90,0.35)", tail: "rgba(255,107,90,0.35)" },
};

function LegacyBubble({ msg, isLatest }: { msg: CoachMessage; isLatest: boolean }) {
  const s = MSG_STYLES[msg.type] ?? MSG_STYLES.tip;
  return (
    <div
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
      <div aria-hidden style={{ position: "absolute", left: -11, top: 16, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: `12px solid ${s.tail}` }} />
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.58, color: T.ink, fontFamily: T.fontUI, fontWeight: 500, letterSpacing: "-0.005em" }}>
        {isLatest ? <Typewriter text={msg.text} /> : msg.text}
      </p>
    </div>
  );
}

// ── CoachResponse bubble ───────────────────────────────────────────────────

function ResponseBubble({
  response,
  hasAnnotation,
  onChipTap,
  onMessageComplete,
}: {
  response: CoachResponse;
  hasAnnotation: boolean;
  onChipTap: (chip: FollowUpChip) => void;
  onMessageComplete?: () => void;
}) {
  const [typewriterDone, setTypewriterDone] = useState(false);
  // 600ms delay when annotation is showing so board draws first
  const delayMs = hasAnnotation ? 600 : 0;

  const bgColor = response.interactionType === "celebration"
    ? "linear-gradient(180deg, rgba(255,107,90,0.14) 0%, rgba(242,201,76,0.08) 100%)"
    : response.interactionType === "warning"
      ? "linear-gradient(180deg, rgba(255,107,90,0.10) 0%, rgba(255,107,90,0.04) 100%)"
      : response.interactionType === "reinforcement"
        ? "linear-gradient(180deg, rgba(124,182,158,0.10) 0%, rgba(124,182,158,0.04) 100%)"
        : "#FFFCF5";

  const borderColor = response.interactionType === "celebration" || response.interactionType === "warning"
    ? "rgba(255,107,90,0.35)"
    : response.interactionType === "reinforcement"
      ? "rgba(124,182,158,0.35)"
      : T.border;

  return (
    <div
      className="cp-msg"
      style={{
        position: "relative",
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 16,
        padding: "13px 16px",
        boxShadow: T.e1,
      }}
    >
      <div aria-hidden style={{ position: "absolute", left: -11, top: 16, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: `12px solid ${borderColor}` }} />
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.58, color: T.ink, fontFamily: T.fontUI, fontWeight: 500, letterSpacing: "-0.005em" }}>
        <Typewriter
          text={response.message}
          speed={45}
          delayMs={delayMs}
          onDone={() => {
            setTypewriterDone(true);
            onMessageComplete?.();
          }}
        />
      </p>
      {typewriterDone && response.followUpChips && response.followUpChips.length > 0 && (
        <ChipRow chips={response.followUpChips} onTap={onChipTap} />
      )}
    </div>
  );
}

// ── Main CoachPanel component ──────────────────────────────────────────────

interface CoachPanelProps {
  // Legacy messages (intro, game-end)
  messages: CoachMessage[];
  // New structured response
  response?: CoachResponse | null;
  onChipTap?: (chip: FollowUpChip) => void;
  onMessageComplete?: () => void;
  loading?: boolean;
  voicePlaying?: boolean;
}

export default function CoachPanel({
  messages,
  response,
  onChipTap,
  onMessageComplete,
  loading = false,
  voicePlaying = false,
}: CoachPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, response]);

  const lastMsg = messages[messages.length - 1];
  const emotion = response?.emotion;
  const hasAnnotation = !!(response?.annotation && response.annotation.type !== "none");

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
        <CoachPawnAvatar emotion={emotion} loading={loading} voicePlaying={voicePlaying} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontWeight: 400, fontSize: 24, color: T.ink, letterSpacing: "-0.01em", lineHeight: 1 }}>
            Coach Pawn
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            {voicePlaying ? (
              <>
                <VoiceWave scale={0.55} color={T.coral} speaking />
                <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.coral, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Speaking</span>
              </>
            ) : loading ? (
              <>
                <ThinkingDots />
                <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.coral, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" }}>Thinking</span>
              </>
            ) : (
              <>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.sage, boxShadow: `0 0 6px ${T.sage}` }} />
                <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkLow, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase" }}>Online · listening</span>
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
        style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto", paddingRight: 2 }}
      >
        {/* Legacy messages */}
        {messages.map((msg, i) => (
          <LegacyBubble key={msg.id} msg={msg} isLatest={i === messages.length - 1 && !response} />
        ))}

        {/* Structured response bubble */}
        {response && response.shouldSpeak && (
          <ResponseBubble
            response={response}
            hasAnnotation={hasAnnotation}
            onChipTap={onChipTap ?? (() => {})}
            onMessageComplete={onMessageComplete}
          />
        )}

        {/* Loading indicator */}
        {loading && (
          <div aria-hidden className="cp-msg" style={{ position: "relative", background: "#FFFCF5", border: `1.5px solid ${T.border}`, borderRadius: 16, padding: "13px 16px", width: 72, boxShadow: T.e1 }}>
            <div aria-hidden style={{ position: "absolute", left: -11, top: 16, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: `12px solid ${T.border}` }} />
            <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.coral, animation: `cpDotPulse 1.2s ${i * 0.15}s infinite ease-in-out` }} />
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !response && !loading && (
          <p style={{ fontSize: 13, color: T.inkDim, textAlign: "center", marginTop: 14, fontStyle: "italic", fontFamily: T.fontUI }}>
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
