"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// ─── Shared rAF time source ───────────────────────────────────────
// One requestAnimationFrame loop for the whole app, not one per
// component. Every useTime() consumer subscribes; the loop runs only
// while there's at least one subscriber AND the tab is visible AND
// the user hasn't requested reduced motion.
//
// Without this, every CoachPawn / StarField / KnightCard / Board
// would hold its own rAF and re-render every frame independently,
// burning CPU on low-end phones.
//
// API stays the same: useTime() returns elapsed seconds since the
// loop started.

type Subscriber = (t: number) => void;
const _subs = new Set<Subscriber>();
let _start: number | null = null;
let _last = 0; // last published time (so new subscribers get a sane value)
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

// Wire visibility + reduced-motion once per page load
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
  // Fast path on the server / during SSR.
  const [t, setT] = useState(_last);
  useEffect(() => {
    if (typeof window === "undefined") return;
    // If reduced motion is on, freeze at 0 — no subscriber registered.
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

// ─── animate: piecewise linear/eased reveal between [start, end] seconds ───
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

// ─── StarField: twinkling stars across the viewport ───
// Seeded so positions are stable across renders (React.useMemo on count+seed).
export function StarField({
  count = 60, seed = 1, opacity = 0.6,
}: { count?: number; seed?: number; opacity?: number }) {
  const time = useTime();
  const stars = useMemo(() => {
    const out: { x: number; y: number; size: number; phase: number; speed: number }[] = [];
    let s = seed * 9301;
    for (let i = 0; i < count; i++) {
      s = (s * 9301 + 49297) % 233280;
      const x = (s / 233280) * 100;
      s = (s * 9301 + 49297) % 233280;
      const y = (s / 233280) * 100;
      s = (s * 9301 + 49297) % 233280;
      const size = 1 + (s / 233280) * 2.5;
      s = (s * 9301 + 49297) % 233280;
      const phase = (s / 233280) * 6.28;
      s = (s * 9301 + 49297) % 233280;
      const speed = 0.5 + (s / 233280) * 1.5;
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
      {stars.map((st, i) => {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * st.speed + st.phase));
        return (
          <circle
            key={i}
            cx={st.x}
            cy={st.y}
            r={st.size * 0.05}
            fill="#FCD34D"
            opacity={tw * opacity}
            style={{ filter: "drop-shadow(0 0 2px rgba(252,211,77,0.9))" }}
          />
        );
      })}
    </svg>
  );
}

// ─── MoteField: floating warm light motes drifting upward ───
export function MoteField({
  count = 18, seed = 5, color = "#FCD34D",
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
      const size = 3 + (s / 233280) * 6;
      s = (s * 9301 + 49297) % 233280;
      const speed = 0.6 + (s / 233280) * 1.8;
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
        const yPct = ((m.yBase - time * m.speed) % 100 + 100) % 100;
        const xPct = m.x + Math.sin(time * 0.4 + m.phase) * 2;
        const alpha = 0.3 + 0.4 * Math.abs(Math.sin(time * 0.6 + m.phase));
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
              boxShadow: `0 0 ${m.size * 3}px ${color}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── GoldFoilText: brand wordmark with shimmer sweep ───
// The bundle's brand mark uses goldFoil gradient on text. This adds the
// horizontal shimmer that crosses the wordmark every ~6 seconds.
export function GoldFoilText({
  children, fontSize = 64, italic = true, style = {},
}: {
  children: React.ReactNode;
  fontSize?: number;
  italic?: boolean;
  style?: React.CSSProperties;
}) {
  const time = useTime();
  const sweep = ((time * 8) % 200) - 50; // % position
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: 'var(--font-cormorant), Georgia, serif',
        fontStyle: italic ? "italic" : "normal",
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        background:
          "linear-gradient(135deg, #C7940A 0%, #FCD34D 25%, #F5B638 50%, #FFE9A8 65%, #C7940A 100%)",
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
          background: `linear-gradient(120deg, transparent ${sweep - 8}%, rgba(255,255,255,0.55) ${sweep}%, transparent ${sweep + 8}%)`,
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

// ─── usePrefersReducedMotion: respect user OS preference ───
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
