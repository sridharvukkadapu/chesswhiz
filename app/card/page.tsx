"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import KnightCard from "@/components/KnightCard";
import BottomNav from "@/components/BottomNav";
import { useGameStore } from "@/stores/gameStore";
import { getRankByXP } from "@/lib/progression/data";
import { T } from "@/lib/design/tokens";
import { StarField, MoteField, GoldFoilText, useTime } from "@/lib/design/atmosphere";

export default function CardPage() {
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const time = useTime();

  useEffect(() => {
    store.hydrateProgression();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast("Couldn't export card");
          return;
        }
        const file = new File([blob], "chesswhiz-knight-card.png", { type: "image/png" });
        const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
        if (nav.canShare?.({ files: [file] }) && navigator.share) {
          try {
            await navigator.share({
              files: [file],
              title: "My ChessWhiz Knight Card",
              text: "Check out my chess journey!",
            });
            return;
          } catch {
            // User canceled; fall through to download.
          }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "chesswhiz-knight-card.png";
        a.click();
        URL.revokeObjectURL(url);
        showToast("Card saved to your device");
      }, "image/png");
    } catch {
      showToast("Couldn't export card");
    }
  };

  if (!hydrated) return null;

  const prog = store.progression;
  const rank = getRankByXP(prog.xp);
  const playerName = store.playerName || "Player";

  const stats = {
    gamesWon: prog.defeatedBosses.length,
    puzzlesSolved: 0,
    longestStreak: prog.streak,
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bgRadial,
        color: T.textHi,
        fontFamily: T.fontUI,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <StarField count={140} seed={13} opacity={0.7} />
      <MoteField count={20} seed={14} color={T.amberGlow} />

      {/* Light burst behind card */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(90vw, 800px)",
          height: "min(90vw, 800px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,182,56,0.30) 0%, rgba(192,132,252,0.18) 35%, transparent 65%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* Spinning rays */}
      <svg
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%,-50%) rotate(${time * 4}deg)`,
          width: "min(95vw, 900px)",
          height: "min(95vw, 900px)",
          pointerEvents: "none",
        }}
        viewBox="-450 -450 900 900"
      >
        {[...Array(14)].map((_, i) => (
          <polygon
            key={i}
            points="0,-420 6,-120 -6,-120"
            fill="rgba(252,211,77,0.10)"
            transform={`rotate(${(i / 14) * 360})`}
          />
        ))}
      </svg>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(7,5,15,0.6)",
          backdropFilter: "blur(20px) saturate(1.4)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <Link
          href="/play"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: T.textLo,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: T.fontUI,
            letterSpacing: "0.08em",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          BACK
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🃏</span>
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 18,
              color: T.textHi,
              letterSpacing: "-0.01em",
            }}
          >
            Knight Card
          </span>
        </div>
        <button
          onClick={handleShare}
          style={{
            background: T.goldFoil,
            color: T.inkDeep,
            border: "none",
            borderRadius: 10,
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: T.fontUI,
            letterSpacing: "0.05em",
            boxShadow: T.glowAmber,
          }}
        >
          ✦ Share
        </button>
      </header>

      {/* Main */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "calc(100dvh - 70px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px 120px",
          gap: 28,
        }}
      >
        {/* Sub-tag */}
        <div style={{ textAlign: "center", marginTop: -16 }}>
          <div
            style={{
              fontFamily: T.fontUI,
              fontSize: 12,
              fontWeight: 700,
              color: T.amberGlow,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Your identity. Shareable.
          </div>
        </div>

        {/* The card itself */}
        <div ref={cardRef}>
          <KnightCard playerName={playerName} progression={prog} rank={rank} stats={stats} />
        </div>

        {/* Footer caption */}
        <div
          style={{
            textAlign: "center",
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontSize: 22,
            color: T.textHi,
            letterSpacing: "-0.01em",
            maxWidth: 520,
            padding: "0 16px",
          }}
        >
          &ldquo;Mom — look at MY card.&rdquo;
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            borderRadius: 14,
            background: T.amethystBg,
            color: T.textHi,
            border: `1px solid ${T.borderStrong}`,
            fontWeight: 700,
            fontSize: 13,
            fontFamily: T.fontUI,
            boxShadow: T.shadowDeep,
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
