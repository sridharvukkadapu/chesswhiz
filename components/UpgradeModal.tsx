"use client";

import Link from "next/link";
import { useEffect } from "react";
import { T, Z } from "@/lib/design/tokens";
import { GoldFoilText } from "@/lib/design/atmosphere";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  blockedKingdomName?: string;
  blockedKingdomIcon?: string;
}

export default function UpgradeModal({
  open, onClose, blockedKingdomName, blockedKingdomIcon,
}: UpgradeModalProps) {
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

  const headline = blockedKingdomName ? `${blockedKingdomName} awaits!` : "Unlock the full Chess Kingdom";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Champion"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z.modal,
        background: "rgba(31,42,68,0.55)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "umFade 0.25s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#FFFCF5",
          borderRadius: 26,
          border: `1.5px solid ${T.border}`,
          boxShadow: `0 0 0 4px rgba(242,201,76,0.12), ${T.shadowDeep}`,
          padding: "32px 30px 28px",
          position: "relative",
          animation: "umPop 0.45s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <button type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            color: T.inkLow,
            cursor: "pointer",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        {/* Top icon */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              borderRadius: 22,
              background: "linear-gradient(135deg, rgba(242,201,76,0.20) 0%, rgba(124,182,158,0.14) 100%)",
              border: `1.5px solid ${T.butter}`,
              fontSize: 38,
              position: "relative",
              boxShadow: "none",
            }}
          >
            {blockedKingdomIcon ?? "👑"}
            <span
              style={{
                position: "absolute",
                bottom: -6,
                right: -6,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#FFFCF5",
                color: T.butterDeep,
                border: `3px solid ${T.butter}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              🔒
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span
            style={{
              fontFamily: T.fontHand,
              fontSize: 18,
              color: T.coral,
              transform: "rotate(-2deg)",
              display: "inline-block",
            }}
          >
            your next adventure →
          </span>
        </div>
        <h2
          style={{
            textAlign: "center",
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontSize: 28,
            fontWeight: 600,
            color: T.ink,
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            textAlign: "center",
            fontFamily: T.fontUI,
            fontSize: 14,
            lineHeight: 1.65,
            color: T.inkLow,
            margin: "0 0 22px",
          }}
        >
          {blockedKingdomName ? (
            <>You&apos;ve grown beyond Pawn Village. To enter <strong style={{ color: T.coral }}>{blockedKingdomName}</strong> — and the 5 kingdoms after it — unlock Champion.</>
          ) : (
            <>Pawn Village is just the beginning. Unlock all 7 kingdoms, 7 bosses, 20 Powers, and your shareable Knight Card.</>
          )}
        </p>

        <div
          style={{
            background: "rgba(31,42,68,0.03)",
            border: `1.5px solid ${T.border}`,
            borderRadius: 18,
            padding: "18px 18px",
            marginBottom: 18,
            boxShadow: "none",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: T.coral,
              color: "#FFFCF5",
              borderRadius: 6,
              padding: "3px 10px",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.18em",
              fontFamily: T.fontUI,
              marginBottom: 12,
            }}
          >
            CHAMPION · $4.99/mo
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
            {[
              "All 7 kingdoms · 7 bosses to defeat",
              "20 Powers to collect",
              "Knight Card you can share",
              "Unlimited games · all difficulty levels",
              "Mission system + Aha! celebrations",
            ].map((f, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: T.fontUI,
                  fontSize: 13,
                  color: T.ink,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: T.sage,
                    color: "#FFFCF5",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    boxShadow: "none",
                  }}
                >
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/onboard?from=upgrade"
          onClick={onClose}
          style={{
            display: "block",
            width: "100%",
            background: T.coral,
            color: "#FFFCF5",
            borderRadius: 14,
            padding: "16px 0",
            textAlign: "center",
            fontSize: 16,
            fontWeight: 800,
            textDecoration: "none",
            fontFamily: T.fontUI,
            boxShadow: T.glowCoral,
            letterSpacing: "0.05em",
          }}
        >
          ✦ Start 7-day free trial ✦
        </Link>
        <button type="button"
          onClick={onClose}
          style={{
            display: "block",
            width: "100%",
            background: "transparent",
            border: "none",
            marginTop: 10,
            padding: "8px 0",
            fontSize: 13,
            color: T.inkDim,
            cursor: "pointer",
            fontFamily: T.fontUI,
            fontWeight: 600,
          }}
        >
          Keep playing in Pawn Village
        </button>
      </div>

      <style>{`
        @keyframes umFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes umPop {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
