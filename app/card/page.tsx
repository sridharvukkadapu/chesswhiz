"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import KnightCard from "@/components/KnightCard";
import { useGameStore } from "@/stores/gameStore";
import { getRankByXP } from "@/lib/progression/data";

const P = {
  cream: "#FBF7F0",
  creamDeep: "#F5EFE4",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkFaint: "#B0A898",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  gold: "#C7940A",
};

export default function CardPage() {
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
        // Fallback: download
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

  // v1 stats: we don't track per-session games won; use what we have.
  const stats = {
    gamesWon: Math.floor(prog.xp / 40), // rough estimate from XP
    puzzlesSolved: 0,
    longestStreak: prog.streak,
  };

  return (
    <div style={{
      minHeight: "100dvh", background: P.cream, color: P.ink,
      fontFamily: "var(--font-nunito), sans-serif", position: "relative",
    }}>
      {/* Paper grain */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.022'/%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: "10px 20px",
        background: "rgba(251,247,240,0.88)",
        backdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: `1px solid ${P.inkGhost}40`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/kingdom" style={{
          display: "flex", alignItems: "center", gap: 8,
          color: P.inkMed, textDecoration: "none", fontSize: 13, fontWeight: 700,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kingdoms
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>♟</span>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-playfair), serif", color: P.ink }}>
            Knight Card
          </span>
        </div>
        <div style={{ width: 90 }} />
      </header>

      <section style={{ maxWidth: 500, margin: "0 auto", padding: "36px 20px 80px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: 19, color: P.gold,
          display: "block", marginBottom: 6,
        }}>share your chess journey</span>
        <h1 style={{
          margin: "0 0 28px", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 900,
          fontFamily: "var(--font-playfair), serif", color: P.ink, letterSpacing: -0.8,
        }}>Your Knight Card</h1>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <KnightCard
            ref={cardRef}
            playerName={store.playerName || "Chess Traveler"}
            progression={prog}
            rank={rank}
            stats={stats}
          />
        </div>

        <button
          onClick={handleShare}
          style={{
            background: P.emerald, color: "white", border: "none",
            borderRadius: 16, padding: "16px 36px", fontSize: 16,
            fontWeight: 800, cursor: "pointer",
            fontFamily: "var(--font-nunito), sans-serif",
            boxShadow: "0 8px 28px rgba(27,115,64,0.3)",
            transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.03)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share Card
        </button>

        <div style={{ marginTop: 14, color: P.inkFaint, fontSize: 13 }}>
          Share with family, post to your wall, or save as a keepsake.
        </div>
      </section>

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          padding: "12px 22px", borderRadius: 14,
          background: P.ink, color: P.cream,
          fontWeight: 700, fontSize: 14,
          boxShadow: "0 12px 36px rgba(26,18,16,0.35)",
          zIndex: 100,
        }}>{toast}</div>
      )}
    </div>
  );
}
