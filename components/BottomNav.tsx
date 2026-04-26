"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "@/lib/design/tokens";

const TABS = [
  { href: "/play", label: "Play", icon: "♟" },
  { href: "/kingdom", label: "Kingdom", icon: "🗺" },
  { href: "/card", label: "Card", icon: "🃏" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        background: "rgba(14,10,31,0.85)",
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
          height: 60,
        }}
      >
        {TABS.map((t) => {
          const active =
            pathname === t.href || (t.href === "/kingdom" && pathname.startsWith("/kingdom"));
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: active ? T.amberGlow : T.textLo,
                fontFamily: T.fontUI,
                position: "relative",
                transition: "color 200ms ease",
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
              <span
                style={{
                  fontSize: 18,
                  lineHeight: 1,
                  filter: active ? "none" : "grayscale(0.5)",
                  transform: active ? "translateY(-1px)" : "none",
                  transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {t.icon}
              </span>
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
