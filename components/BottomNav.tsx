"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const P = {
  cream: "#FBF7F0",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkSoft: "#2E2620",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
};

const TABS = [
  { href: "/play",    label: "Play",    icon: "♟" },
  { href: "/kingdom", label: "Kingdom", icon: "🗺" },
  { href: "/card",    label: "Card",    icon: "🃏" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
      background: "rgba(251,247,240,0.92)",
      backdropFilter: "blur(20px) saturate(1.2)",
      WebkitBackdropFilter: "blur(20px) saturate(1.2)",
      borderTop: `1px solid ${P.inkGhost}50`,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      <div style={{
        maxWidth: 720, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        height: 56,
      }}>
        {TABS.map((t) => {
          const active = pathname === t.href || (t.href === "/kingdom" && pathname.startsWith("/kingdom"));
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2,
                textDecoration: "none",
                color: active ? P.emerald : P.inkLight,
                fontFamily: "var(--font-nunito), sans-serif",
                position: "relative",
                transition: "color 0.2s ease",
              }}
            >
              {active && (
                <span aria-hidden style={{
                  position: "absolute", top: 0, left: "30%", right: "30%",
                  height: 3, borderRadius: "0 0 3px 3px",
                  background: P.emerald,
                }} />
              )}
              <span style={{
                fontSize: 18, lineHeight: 1,
                filter: active ? "none" : "grayscale(0.4)",
                transform: active ? "translateY(-1px)" : "none",
                transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              }}>{t.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
                textTransform: "uppercase",
              }}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
