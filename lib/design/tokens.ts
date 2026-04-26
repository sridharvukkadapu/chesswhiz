// ═══════════════════════════════════════════════════════════════
// ChessWhiz design tokens — "Reimagined" jewel-tone fantasy theme
// Mirrors the design handoff bundle exactly. Source of truth for
// every color/font/shadow used across the redesigned app.
// ═══════════════════════════════════════════════════════════════

export const T = {
  // ── Backgrounds: obsidian → velvet midnight ──
  obsidian:    "#07050F",
  midnight:    "#0E0A1F",
  velvet:      "#1A1238",
  amethystBg:  "#241845",
  border:        "rgba(245, 230, 200, 0.12)",
  borderStrong:  "rgba(245, 230, 200, 0.22)",

  // ── Jewel accents ──
  amber:       "#F5B638",
  amberGlow:   "#FCD34D",
  amberDeep:   "#B07A0E",
  amberSoft:   "#FFE9A8",

  emerald:     "#34D399",
  emeraldGlow: "#6EE7B7",
  emeraldDeep: "#047857",

  sapphire:     "#7DA8FF",
  sapphireDeep: "#3B5CD9",
  sapphireGlow: "#A5C4FF",

  ruby:     "#FF6B6B",
  rubyDeep: "#B91C1C",
  rubyGlow: "#FCA5A5",

  amethyst:     "#C084FC",
  amethystGlow: "#E0BBFF",
  amethystDeep: "#7E22CE",

  // ── Parchment / cream ──
  parchment: "#F5E9C9",
  ivory:     "#FBF6E8",
  cream:     "#E8DDB5",
  inkDeep:   "#1A1210",

  // ── Text tiers (on dark) ──
  textHi:  "#FBF6E8",
  textMed: "#D6C8A8",
  textLo:  "#9A8FB5",
  textDim: "#6B6285",

  // ── Board (premium wood) ──
  boardLight:   "#EFD9A8",
  boardDark:    "#A6743F",
  boardLightHi: "#F5E2B8",
  boardDarkHi:  "#B88652",
  boardEdge:    "#3D2615",

  // ── Fonts (CSS variables wired in app/layout.tsx) ──
  fontDisplay: 'var(--font-cormorant), Georgia, serif',
  fontBrand:   'var(--font-cormorant), Georgia, serif',
  fontUI:      'var(--font-jakarta), "Inter", system-ui, sans-serif',
  fontHand:    'var(--font-caveat), cursive',
  fontMono:    'var(--font-jetbrains-mono), ui-monospace, monospace',

  // ── Shadows / glows ──
  glowAmber:    "0 0 24px rgba(245, 182, 56, 0.55), 0 0 60px rgba(245, 182, 56, 0.25)",
  glowEmerald:  "0 0 24px rgba(52, 211, 153, 0.55), 0 0 60px rgba(52, 211, 153, 0.25)",
  glowRuby:     "0 0 24px rgba(255, 107, 107, 0.55), 0 0 60px rgba(255, 107, 107, 0.25)",
  glowAmethyst: "0 0 28px rgba(192, 132, 252, 0.55), 0 0 70px rgba(192, 132, 252, 0.30)",
  glowSapphire: "0 0 28px rgba(125, 168, 255, 0.55), 0 0 70px rgba(125, 168, 255, 0.30)",

  shadowCard: "0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)",
  shadowDeep: "0 30px 80px rgba(0,0,0,0.65), 0 4px 12px rgba(0,0,0,0.45)",

  // ── Gradients ──
  bgRadial:        "radial-gradient(ellipse at 50% 30%, #2D1B5C 0%, #15102A 45%, #07050F 100%)",
  bgRadialAmber:   "radial-gradient(ellipse at 50% 40%, #4A2E0F 0%, #1A1238 50%, #07050F 100%)",
  bgRadialEmerald: "radial-gradient(ellipse at 50% 40%, #0E3D2C 0%, #15102A 50%, #07050F 100%)",
  bgRadialRuby:    "radial-gradient(ellipse at 50% 40%, #4A0F1F 0%, #1A1238 50%, #07050F 100%)",
  bgParchment:     "radial-gradient(ellipse at 50% 30%, #FFF8E3 0%, #F5E9C9 60%, #E8DDB5 100%)",

  goldFoil:     "linear-gradient(135deg, #C7940A 0%, #FCD34D 25%, #F5B638 50%, #FFE9A8 65%, #C7940A 100%)",
  amethystFoil: "linear-gradient(135deg, #6B21A8 0%, #C084FC 30%, #E0BBFF 50%, #C084FC 70%, #6B21A8 100%)",
  emeraldFoil:  "linear-gradient(135deg, #047857 0%, #34D399 30%, #6EE7B7 50%, #34D399 70%, #047857 100%)",
} as const;

// Region accent palette — each kingdom gets its own jewel color.
export const KINGDOM_COLORS: Record<string, string> = {
  village:          T.amber,
  fork_forest:      T.emerald,
  pin_palace:       T.sapphire,
  skewer_spire:     T.ruby,
  discovery_depths: "#F97316",
  strategy_summit:  T.amethyst,
  endgame_throne:   T.amberGlow,
};

export const KINGDOM_GLOWS: Record<string, string> = {
  village:          T.glowAmber,
  fork_forest:      T.glowEmerald,
  pin_palace:       T.glowSapphire,
  skewer_spire:     T.glowRuby,
  discovery_depths: "0 0 24px rgba(249,115,22,0.55), 0 0 60px rgba(249,115,22,0.25)",
  strategy_summit:  T.glowAmethyst,
  endgame_throne:   T.glowAmber,
};
