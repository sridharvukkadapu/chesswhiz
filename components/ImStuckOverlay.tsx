"use client";

import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";
import { T, Z } from "@/lib/design/tokens";

interface ImStuckOverlayProps {
  open: boolean;
  onClose: () => void;
  onShowHint: () => void;
  onLearnTrick: () => void;
  onStartOver: () => void;
  playerName: string;
}

export default function ImStuckOverlay({ open, onClose, onShowHint, onLearnTrick, onStartOver, playerName }: ImStuckOverlayProps) {
  if (!open) return null;

  const options = [
    { label: "Show me a good move", emoji: "👁", action: onShowHint, color: T.sage },
    { label: "Teach me something", emoji: "📚", action: onLearnTrick, color: "#7FBFE8" },
    { label: "Start this game over", emoji: "🔄", action: onStartOver, color: T.coral },
  ];

  return (
    <>
      <div onClick={onClose} aria-hidden style={{ position: "fixed", inset: 0, zIndex: Z.modal - 10, background: "rgba(10,10,20,0.5)" }} />
      <div role="dialog" aria-modal="true" aria-label="I'm stuck options"
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: Z.modal - 9, background: "#FFFCF5", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", animation: "stuckSheetIn 0.3s cubic-bezier(0.22,1,0.36,1) both", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
          <CoachPawn size={56} expression="idle" mode="kid" />
          <SpeechBubble text={`No worries, ${playerName}! What would help?`} width={240} tail="left" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {options.map((opt) => (
            <button key={opt.label} type="button" onClick={() => { opt.action(); onClose(); }}
              style={{ padding: "16px 20px", borderRadius: 16, border: `1.5px solid ${T.border}`, background: "rgba(31,42,68,0.03)", fontFamily: T.fontUI, fontSize: 16, fontWeight: 600, color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", transition: "all 140ms" }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = opt.color; el.style.background = `${opt.color}18`; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = T.border; el.style.background = "rgba(31,42,68,0.03)"; }}>
              <span style={{ fontSize: 24 }}>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 14, background: "transparent", border: `1px solid ${T.border}`, color: T.inkLow, fontFamily: T.fontUI, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          Actually, I&apos;m fine — keep playing
        </button>
      </div>
      <style>{`@keyframes stuckSheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </>
  );
}
