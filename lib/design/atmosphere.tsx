"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// ─── Shared rAF time source ───────────────────────────────────────
// One requestAnimationFrame loop for the whole app, not one per
// component. Every useTime() consumer subscribes; the loop runs only
// while there's at least one subscriber AND the tab is visible AND
// the user hasn't requested reduced motion.

type Subscriber = (t: number) => void;
const _subs = new Set<Subscriber>();
let _start: number | null = null;
let _last = 0;
let _rafId: number | null = null;
let _reducedMotion = false;
let _hidden = false;

function _shouldRun(): boolean {
  return _subs.size > 0 && !_hidden && !_reducedMotion;
}

function _tick(now: number) {
  if (_start == null) _start = now;
  _last = (now - _start) / 1000;
  for (const sub of _subs) sub(_last);
  _rafId = _shouldRun() ? requestAnimationFrame(_tick) : null;
}

function _kick() {
  if (_rafId != null) return;
  if (!_shouldRun()) return;
  _rafId = requestAnimationFrame(_tick);
}

function _stop() {
  if (_rafId != null) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    _hidden = document.hidden;
    if (_hidden) _stop();
    else _kick();
  });
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  _reducedMotion = mq.matches;
  mq.addEventListener?.("change", (e) => {
    _reducedMotion = e.matches;
    if (_reducedMotion) _stop();
    else _kick();
  });
}

export function useTime(): number {
  const [t, setT] = useState(_last);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (_reducedMotion) {
      setT(0);
      return;
    }
    const sub: Subscriber = (now) => setT(now);
    _subs.add(sub);
    _kick();
    return () => {
      _subs.delete(sub);
      if (_subs.size === 0) _stop();
    };
  }, []);
  return t;
}

// ─── animate: piecewise eased reveal ─────────────────────────────
type EaseFn = (x: number) => number;
export const Easing = {
  linear: ((x: number) => x) as EaseFn,
  easeOut: ((x: number) => 1 - Math.pow(1 - x, 3)) as EaseFn,
  easeIn: ((x: number) => x * x) as EaseFn,
  easeInOut: ((x: number) =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2) as EaseFn,
  easeOutBack: ((x: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }) as EaseFn,
};

export function animate(opts: {
  from: number;
  to: number;
  start: number;
  end: number;
  ease?: EaseFn;
}) {
  const ease = opts.ease ?? Easing.easeOut;
  return (t: number) => {
    if (t <= opts.start) return opts.from;
    if (t >= opts.end) return opts.to;
    const x = (t - opts.start) / (opts.end - opts.start);
    return opts.from + (opts.to - opts.from) * ease(x);
  };
}

// ─── StarField: warm floating dust motes (replaces dark stars) ───
// On the warm theme, "stars" become soft sunlit dust specks.
export function StarField({
  count = 60, seed = 1, opacity = 0.6,
}: { count?: number; seed?: number; opacity?: number }) {
  const time = useTime();
  const motes = useMemo(() => {
    const out: { x: number; y: number; size: number; phase: number; speed: number }[] = [];
    let s = seed * 9301;
    for (let i = 0; i < count; i++) {
      s = (s * 9301 + 49297) % 233280;
      const x = (s / 233280) * 100;
      s = (s * 9301 + 49297) % 233280;
      const y = (s / 233280) * 100;
      s = (s * 9301 + 49297) % 233280;
      const size = 1.5 + (s / 233280) * 3;
      s = (s * 9301 + 49297) % 233280;
      const phase = (s / 233280) * 6.28;
      s = (s * 9301 + 49297) % 233280;
      const speed = 0.3 + (s / 233280) * 1.0;
      out.push({ x, y, size, phase, speed });
    }
    return out;
  }, [count, seed]);

  return (
    <svg
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none", width: "100%", height: "100%" }}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {motes.map((m, i) => {
        const tw = 0.25 + 0.45 * Math.abs(Math.sin(time * m.speed + m.phase));
        return (
          <circle
            key={i}
            cx={m.x}
            cy={m.y}
            r={m.size * 0.04}
            fill="#FF6B5A"
            opacity={tw * opacity * 0.55}
            style={{ filter: "blur(0.3px)" }}
          />
        );
      })}
    </svg>
  );
}

// ─── MoteField: floating warm paper motes drifting upward ───
export function MoteField({
  count = 18, seed = 5, color = "#FF6B5A",
}: { count?: number; seed?: number; color?: string }) {
  const time = useTime();
  const motes = useMemo(() => {
    const out: { x: number; yBase: number; size: number; speed: number; phase: number }[] = [];
    let s = seed * 9301;
    for (let i = 0; i < count; i++) {
      s = (s * 9301 + 49297) % 233280;
      const x = (s / 233280) * 100;
      s = (s * 9301 + 49297) % 233280;
      const yBase = (s / 233280) * 100;
      s = (s * 9301 + 49297) % 233280;
      const size = 4 + (s / 233280) * 8;
      s = (s * 9301 + 49297) % 233280;
      const speed = 0.4 + (s / 233280) * 1.2;
      s = (s * 9301 + 49297) % 233280;
      const phase = (s / 233280) * 6.28;
      out.push({ x, yBase, size, speed, phase });
    }
    return out;
  }, [count, seed]);

  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
    >
      {motes.map((m, i) => {
        const yPct = ((m.yBase - time * m.speed * 0.6) % 100 + 100) % 100;
        const xPct = m.x + Math.sin(time * 0.35 + m.phase) * 1.5;
        const alpha = 0.12 + 0.14 * Math.abs(Math.sin(time * 0.5 + m.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: m.size,
              height: m.size,
              borderRadius: "50%",
              background: color,
              opacity: alpha,
              filter: `blur(${m.size * 0.8}px)`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── WarmDust: subtle paper-grain background texture ─────────────
// Scattered tiny ink dots that give warmth like aged parchment.
export function WarmDust({
  count = 30, seed = 7, opacity = 0.06,
}: { count?: number; seed?: number; opacity?: number }) {
  const shapes = useMemo(() => {
    const out: { x: number; y: number; r: number; rot: number }[] = [];
    let s = seed * 7919;
    for (let i = 0; i < count; i++) {
      s = (s * 7919 + 35149) % 174763;
      const x = (s / 174763) * 100;
      s = (s * 7919 + 35149) % 174763;
      const y = (s / 174763) * 100;
      s = (s * 7919 + 35149) % 174763;
      const r = 6 + (s / 174763) * 28;
      s = (s * 7919 + 35149) % 174763;
      const rot = (s / 174763) * 360;
      out.push({ x, y, r, rot });
    }
    return out;
  }, [count, seed]);

  return (
    <svg
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none", width: "100%", height: "100%" }}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {shapes.map((sh, i) => (
        <ellipse
          key={i}
          cx={sh.x}
          cy={sh.y}
          rx={sh.r * 0.06}
          ry={sh.r * 0.03}
          fill="#1F2A44"
          opacity={opacity}
          transform={`rotate(${sh.rot}, ${sh.x}, ${sh.y})`}
        />
      ))}
    </svg>
  );
}

// ─── GoldFoilText: coral/warm shimmer text ────────────────────────
// In the warm theme the "gold foil" becomes a warm coral-amber sweep.
export function GoldFoilText({
  children, fontSize = 64, italic = true, style = {},
}: {
  children: React.ReactNode;
  fontSize?: number;
  italic?: boolean;
  style?: React.CSSProperties;
}) {
  const time = useTime();
  const sweep = ((time * 6) % 200) - 50;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
        fontStyle: italic ? "italic" : "normal",
        fontWeight: 400,
        fontSize,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        background:
          "linear-gradient(135deg, #E04A3A 0%, #FF6B5A 30%, #FF8E70 50%, #F2C94C 70%, #E04A3A 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        ...style,
      }}
    >
      {children}
      {/* shimmer sweep */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(120deg, transparent ${sweep - 8}%, rgba(255,255,255,0.5) ${sweep}%, transparent ${sweep + 8}%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          pointerEvents: "none",
        }}
      >
        {children}
      </span>
    </span>
  );
}

// ─── SeriffText: DM Serif headline in warm ink ────────────────────
// Convenience wrapper for the display serif font in the warm theme.
export function SeriffText({
  children, fontSize = 64, italic = false, color = "#1F2A44", style = {},
}: {
  children: React.ReactNode;
  fontSize?: number;
  italic?: boolean;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
        fontStyle: italic ? "italic" : "normal",
        fontWeight: 400,
        fontSize,
        letterSpacing: "-0.02em",
        lineHeight: 1.05,
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── useBreakpoint ────────────────────────────────────────────────
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
const BP: Array<[Breakpoint, number]> = [
  ["xs", 0],
  ["sm", 480],
  ["md", 768],
  ["lg", 1024],
  ["xl", 1280],
  ["2xl", 1536],
];

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("xs");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const compute = () => {
      const w = window.innerWidth;
      let cur: Breakpoint = "xs";
      for (const [name, min] of BP) if (w >= min) cur = name;
      setBp(cur);
    };
    compute();
    window.addEventListener("resize", compute, { passive: true });
    return () => window.removeEventListener("resize", compute);
  }, []);
  return bp;
}

export function bpAtLeast(current: Breakpoint, target: Breakpoint): boolean {
  const order: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "2xl"];
  return order.indexOf(current) >= order.indexOf(target);
}

// ─── usePrefersReducedMotion ──────────────────────────────────────
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

// ─── useAtmosphereScale ───────────────────────────────────────────
// Returns a 0–1 scale factor for particle counts. Low-end devices
// (< 4 CPU cores or mobile with narrow viewport) get 0.3 so the
// page doesn't chug. High-end devices get 1.0.
export function useAtmosphereScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 4;
    const isNarrow = window.innerWidth < 600;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    setScale(cores < 4 || (isMobile && isNarrow) ? 0.3 : 1);
  }, []);
  return scale;
}
