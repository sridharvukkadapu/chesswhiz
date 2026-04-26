"use client";

import Link from "next/link";
import { useEffect } from "react";

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
  emeraldBright: "#22C55E",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
  goldLight: "#F0D060",
  goldPale: "#FDF6E3",
};

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  // What the kid was trying to access — drives the headline copy
  blockedKingdomName?: string;
  blockedKingdomIcon?: string;
}

export default function UpgradeModal({
  open, onClose, blockedKingdomName, blockedKingdomIcon,
}: UpgradeModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const headline = blockedKingdomName
    ? `${blockedKingdomName} awaits!`
    : "Unlock the full Chess Kingdom";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Champion"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(11,17,32,0.72)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "upgradeFade 0.25s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440,
          background: P.cream,
          borderRadius: 24,
          boxShadow: `0 0 0 4px ${P.parchment}, 0 30px 80px rgba(0,0,0,0.4)`,
          padding: "32px 28px 28px",
          position: "relative",
          animation: "upgradePop 0.45s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 12, right: 12,
            width: 32, height: 32, borderRadius: "50%",
            background: "transparent", border: "none",
            color: P.inkLight, cursor: "pointer", fontSize: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >×</button>

        {/* Top icon — locked kingdom or generic crown */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${P.goldPale} 0%, ${P.parchment} 100%)`,
            border: `2px solid ${P.gold}55`,
            fontSize: 36, position: "relative",
            boxShadow: `0 8px 24px rgba(199,148,10,0.18)`,
          }}>
            {blockedKingdomIcon ?? "👑"}
            <span style={{
              position: "absolute", bottom: -4, right: -4,
              width: 28, height: 28, borderRadius: "50%",
              background: P.ink, color: P.cream,
              border: `3px solid ${P.cream}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
            }}>🔒</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span style={{
            fontFamily: "'Caveat', cursive", fontSize: 18, color: P.gold,
          }}>your next adventure →</span>
        </div>
        <h2 style={{
          textAlign: "center",
          fontSize: 26, fontWeight: 900,
          fontFamily: "var(--font-playfair), serif",
          color: P.ink, margin: "0 0 8px", letterSpacing: -0.6,
        }}>{headline}</h2>
        <p style={{
          textAlign: "center", fontSize: 14, lineHeight: 1.65,
          color: P.inkLight, margin: "0 0 22px",
          fontFamily: "var(--font-nunito), sans-serif",
        }}>
          {blockedKingdomName
            ? <>You&apos;ve grown beyond Pawn Village. To enter <strong style={{ color: P.ink }}>{blockedKingdomName}</strong> — and the 5 kingdoms after it — unlock Champion.</>
            : <>Pawn Village is just the beginning. Unlock all 7 kingdoms, 7 bosses, 20 Powers, and your shareable Knight Card.</>}
        </p>

        {/* Champion features */}
        <div style={{
          background: "white",
          border: `1.5px solid ${P.gold}40`,
          borderRadius: 16,
          padding: "18px 18px",
          marginBottom: 18,
          boxShadow: `0 0 0 3px ${P.goldPale}`,
        }}>
          <div style={{
            display: "inline-block",
            background: P.gold, color: "white",
            borderRadius: 6, padding: "3px 10px",
            fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
            fontFamily: "var(--font-nunito), sans-serif",
            marginBottom: 12,
          }}>CHAMPION · $4.99/mo</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {[
              "All 7 kingdoms · 7 bosses to defeat",
              "20 Powers to collect",
              "Knight Card you can share",
              "Unlimited games · all difficulty levels",
              "Mission system + Aha! celebrations",
            ].map((f, i) => (
              <li key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, color: P.inkSoft,
                fontFamily: "var(--font-nunito), sans-serif",
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: P.emerald, color: "white",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800,
                }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA — for now the upgrade flow doesn't exist; route to onboard
            with a flag so we can wire Stripe Checkout later. */}
        <Link
          href="/onboard?from=upgrade"
          onClick={onClose}
          style={{
            display: "block", width: "100%",
            background: P.emerald, color: "white",
            borderRadius: 14, padding: "16px 0",
            textAlign: "center",
            fontSize: 15, fontWeight: 800,
            textDecoration: "none",
            fontFamily: "var(--font-nunito), sans-serif",
            boxShadow: "0 8px 24px rgba(27,115,64,0.28)",
            letterSpacing: 0.3,
          }}
        >
          Start 7-day free trial
        </Link>
        <button
          onClick={onClose}
          style={{
            display: "block", width: "100%",
            background: "transparent", border: "none",
            marginTop: 10, padding: "8px 0",
            fontSize: 13, color: P.inkLight, cursor: "pointer",
            fontFamily: "var(--font-nunito), sans-serif",
            fontWeight: 600,
          }}
        >
          Keep playing in Pawn Village
        </button>
      </div>

      <style>{`
        @keyframes upgradeFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes upgradePop {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
