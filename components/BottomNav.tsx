"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Gamepad2, Map, IdCard, type LucideIcon } from "lucide-react";
import { T, Z } from "@/lib/design/tokens";
import { useGameStore } from "@/stores/gameStore";

interface Tab {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/play", label: "Play", Icon: Gamepad2 },
  { href: "/kingdom", label: "Kingdom", Icon: Map },
  { href: "/card", label: "Card", Icon: IdCard },
];

const CARD_VISITED_KEY = "chesswhiz.cardLastSeenPowers";

export default function BottomNav() {
  const pathname = usePathname();
  const earnedPowers = useGameStore((s) => s.progression.earnedPowers);
  const [lastSeenCount, setLastSeenCount] = useState<number | null>(null);

  // Hydrate the "last seen powers count" from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CARD_VISITED_KEY);
      setLastSeenCount(raw ? Number(raw) : 0);
    } catch {
      setLastSeenCount(0);
    }
  }, []);

  // When the user lands on /card, mark powers as seen
  useEffect(() => {
    if (pathname !== "/card") return;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CARD_VISITED_KEY, String(earnedPowers.length));
      setLastSeenCount(earnedPowers.length);
    } catch {}
  }, [pathname, earnedPowers.length]);

  const cardBadge =
    lastSeenCount !== null && earnedPowers.length > lastSeenCount
      ? earnedPowers.length - lastSeenCount
      : 0;

  const badgeFor = (href: string): number => (href === "/card" ? cardBadge : 0);

  return (
    <nav
      aria-label="Primary"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Z.overlay,
        background: "rgba(14,10,31,0.92)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderTop: `1px solid ${T.borderStrong}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          height: 64,
        }}
      >
        {TABS.map((t) => {
          const active =
            pathname === t.href || (t.href === "/kingdom" && pathname.startsWith("/kingdom"));
          const badge = badgeFor(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="bn-tap"
              aria-current={active ? "page" : undefined}
              aria-label={badge > 0 ? `${t.label} (${badge} new)` : t.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                textDecoration: "none",
                color: active ? T.amberGlow : T.textLo,
                fontFamily: T.fontUI,
                position: "relative",
              }}
            >
              {active && (
                <>
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "30%",
                      right: "30%",
                      height: 2,
                      background: T.goldFoil,
                      boxShadow: T.glowAmber,
                    }}
                  />
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(ellipse at 50% 100%, rgba(252,211,77,0.18) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                </>
              )}
              <div style={{ position: "relative", lineHeight: 0 }}>
                <t.Icon
                  aria-hidden
                  size={22}
                  strokeWidth={active ? 2.4 : 1.8}
                  style={{
                    filter: active ? "drop-shadow(0 0 6px rgba(252,211,77,0.55))" : "none",
                    transform: active ? "translateY(-1px)" : "none",
                    transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                />
                {badge > 0 && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      background: T.amber,
                      color: T.inkDeep,
                      borderRadius: 8,
                      fontFamily: T.fontUI,
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 0 2px rgba(14,10,31,0.95), 0 0 8px rgba(245,182,56,0.6)",
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
