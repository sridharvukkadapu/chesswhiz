// ═══════════════════════════════════════════════════════════════
// ChessWhiz design tokens — "Warm Character" theme
// Implemented from the v2/warm design handoff bundle.
// Light cream/parchment base · coral accent · DM Serif display.
// ═══════════════════════════════════════════════════════════════

export const T = {
  // ── Backgrounds ──
  bg:        "#FBF6EC",
  bgDeep:    "#F5ECDC",
  bgCard:    "#FFFCF5",
  bgDark:    "#1F2A44",

  // ── Borders ──
  border:        "rgba(31, 42, 68, 0.12)",
  borderStrong:  "rgba(31, 42, 68, 0.24)",
  borderCard:    "rgba(61, 42, 27, 0.10)",

  // ── Ink / text ──
  ink:     "#1F2A44",
  inkLow:  "#5C6580",
  inkDim:  "#9BA1B5",

  // Text aliases that map to warm ink scale (for legacy refs in components)
  textHi:  "#1F2A44",
  textMed: "#5C6580",
  textLo:  "#7A859A",
  textDim: "#9BA1B5",

  // ── Jewel accents (warm palette) ──
  coral:     "#FF6B5A",
  coralDeep: "#E04A3A",
  coralLight:"#FFDED9",
  coralGlow: "#FF8E70",

  sage:      "#7CB69E",
  sageDeep:  "#4F8F77",
  sageLow:   "#B4D6C9",

  butter:    "#F2C94C",
  butterDeep:"#C9960F",
  butterGlow:"#FDE27A",

  sky:       "#7FBFE8",
  skyDeep:   "#3B82C4",
  skyGlow:   "#A8D4F0",

  rose:      "#F4A6B8",
  roseDeep:  "#C9456B",

  peach:     "#FFB47A",

  // Legacy aliases used across components
  amber:       "#F2C94C",
  amberGlow:   "#FDE27A",
  amberDeep:   "#C9960F",
  amberSoft:   "#FEF3C7",
  emerald:     "#7CB69E",
  emeraldGlow: "#B4D6C9",
  emeraldDeep: "#4F8F77",
  sapphire:     "#7FBFE8",
  sapphireDeep: "#3B82C4",
  sapphireGlow: "#A8D4F0",
  ruby:     "#FF6B5A",
  rubyDeep: "#E04A3A",
  rubyGlow: "#FFDED9",
  amethyst:     "#C084FC",
  amethystGlow: "#E0BBFF",
  amethystDeep: "#7E22CE",
  amethystBg:   "#F5ECDC",

  // ── Parchment / cream ──
  parchment: "#F5E9C9",
  ivory:     "#FFFCF5",
  cream:     "#E8DDB5",
  inkDeep:   "#1F2A44",

  // ── Board (warm wood) ──
  boardLight:   "#F2E2C2",
  boardDark:    "#C99A6E",
  boardLightHi: "#F8EAD2",
  boardDarkHi:  "#D9AA7E",
  boardEdge:    "#3D2A1B",
  boardFrame:   "#3D2A1B",

  // ── Type scale ──
  textXs:  12,
  textSm:  14,
  textMd:  16,
  textLg:  18,
  text2xl: 22,
  text3xl: 28,
  text4xl: 36,
  text5xl: 56,
  textHero: 84,

  // ── Breakpoints ──
  bpSm: 480,
  bpMd: 768,
  bpLg: 1024,
  bpXl: 1280,
  bp2xl: 1536,

  // ── Spacing ──
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space5: 20,
  space6: 24,
  space8: 32,
  space10: 40,
  space12: 48,
  space16: 64,

  // ── Fonts ──
  fontDisplay: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
  fontBrand:   'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
  fontUI:      'var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
  fontHand:    'var(--font-caveat), cursive',
  fontMono:    'var(--font-jetbrains-mono), ui-monospace, monospace',

  // ── Shadows ──
  shadowSoft: "0 8px 30px rgba(31, 42, 68, 0.10)",
  shadowCard: "0 12px 40px rgba(31, 42, 68, 0.16), 0 2px 8px rgba(31, 42, 68, 0.08)",
  shadowDeep: "0 24px 60px rgba(31, 42, 68, 0.22), 0 4px 12px rgba(31, 42, 68, 0.10)",
  shadowChip: "0 4px 14px rgba(255, 107, 90, 0.25)",

  glowAmber:    "0 0 16px rgba(242, 201, 76, 0.55), 0 0 40px rgba(242, 201, 76, 0.20)",
  glowEmerald:  "0 0 16px rgba(124, 182, 158, 0.55), 0 0 40px rgba(124, 182, 158, 0.20)",
  glowRuby:     "0 0 16px rgba(255, 107, 90, 0.55), 0 0 40px rgba(255, 107, 90, 0.20)",
  glowAmethyst: "0 0 16px rgba(192, 132, 252, 0.40), 0 0 40px rgba(192, 132, 252, 0.20)",
  glowSapphire: "0 0 16px rgba(127, 191, 232, 0.55), 0 0 40px rgba(127, 191, 232, 0.20)",
  glowCoral:    "0 0 20px rgba(255, 107, 90, 0.50), 0 0 50px rgba(255, 107, 90, 0.22)",

  // ── Elevation scale ──
  e0: "none",
  e1: "0 2px 6px rgba(31,42,68,0.08)",
  e2: "0 6px 18px rgba(31,42,68,0.12), 0 2px 4px rgba(31,42,68,0.06)",
  e3: "0 8px 24px rgba(31,42,68,0.16), 0 2px 6px rgba(31,42,68,0.08)",
  e4: "0 12px 40px rgba(31,42,68,0.20), 0 2px 8px rgba(31,42,68,0.08)",
  e5: "0 24px 60px rgba(31,42,68,0.25), 0 4px 12px rgba(31,42,68,0.10)",

  // ── Gradients ──
  bgRadial:        "radial-gradient(ellipse at 50% 30%, #FFF8E3 0%, #F5ECDC 50%, #FBF6EC 100%)",
  bgRadialAmber:   "radial-gradient(ellipse at 50% 40%, #FFF3DC 0%, #F5E9C9 50%, #FBF6EC 100%)",
  bgRadialEmerald: "radial-gradient(ellipse at 50% 40%, #E6F4EE 0%, #F5ECDC 50%, #FBF6EC 100%)",
  bgRadialRuby:    "radial-gradient(ellipse at 50% 40%, #FFE8E5 0%, #F5ECDC 50%, #FBF6EC 100%)",
  bgParchment:     "radial-gradient(ellipse at 50% 30%, #FFFCF5 0%, #F5E9C9 60%, #E8DDB5 100%)",

  goldFoil: "linear-gradient(135deg, #C9960F 0%, #F2C94C 25%, #F5B638 50%, #FDE27A 65%, #C9960F 100%)",
  coralFoil: "linear-gradient(135deg, #E04A3A 0%, #FF6B5A 30%, #FF8E70 50%, #FF6B5A 70%, #E04A3A 100%)",
  sageFoil: "linear-gradient(135deg, #4F8F77 0%, #7CB69E 30%, #B4D6C9 50%, #7CB69E 70%, #4F8F77 100%)",

  // Legacy
  amethystFoil: "linear-gradient(135deg, #6B21A8 0%, #C084FC 30%, #E0BBFF 50%, #C084FC 70%, #6B21A8 100%)",
  emeraldFoil:  "linear-gradient(135deg, #4F8F77 0%, #7CB69E 30%, #B4D6C9 50%, #7CB69E 70%, #4F8F77 100%)",

  // ── Obsidian (legacy) ──
  obsidian:    "#1F2A44",
  midnight:    "#1F2A44",
  velvet:      "#FFFCF5",
} as const;

// Z-index ladder
export const Z = {
  base: 0,
  raised: 10,
  sticky: 20,
  overlay: 40,
  modal: 100,
  toast: 1000,
} as const;

// Kingdom accent palette
export const KINGDOM_COLORS: Record<string, string> = {
  village:          T.coral,
  fork_forest:      T.sage,
  pin_palace:       T.sky,
  skewer_spire:     T.rose,
  discovery_depths: "#F97316",
  strategy_summit:  "#C084FC",
  endgame_throne:   T.butter,
};

export const KINGDOM_GLOWS: Record<string, string> = {
  village:          T.glowCoral,
  fork_forest:      T.glowEmerald,
  pin_palace:       T.glowSapphire,
  skewer_spire:     "0 0 16px rgba(244,166,184,0.55), 0 0 40px rgba(244,166,184,0.20)",
  discovery_depths: "0 0 16px rgba(249,115,22,0.55), 0 0 40px rgba(249,115,22,0.20)",
  strategy_summit:  T.glowAmethyst,
  endgame_throne:   T.glowAmber,
};
