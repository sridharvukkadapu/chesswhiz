import type { Rank, Kingdom, Power } from "./types";

// ───────── RANKS ─────────
// Thresholds from CLAUDE_CODE_INSTRUCTIONS.md
export const RANKS: Rank[] = [
  { id: "pawn",   name: "Pawn",   icon: "♟", level: 1, xpRequired: 0,     color: "#8A8278" },
  { id: "knight", name: "Knight", icon: "♞", level: 2, xpRequired: 500,   color: "#1B7340" },
  { id: "bishop", name: "Bishop", icon: "♝", level: 3, xpRequired: 1500,  color: "#3B82F6" },
  { id: "rook",   name: "Rook",   icon: "♜", level: 4, xpRequired: 3500,  color: "#C7940A" },
  { id: "queen",  name: "Queen",  icon: "♛", level: 5, xpRequired: 7000,  color: "#9333EA" },
  { id: "king",   name: "King",   icon: "♚", level: 6, xpRequired: 12000, color: "#DC2626" },
];

export function getRankByXP(xp: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xpRequired) current = r;
    else break;
  }
  return current;
}

export function getNextRank(currentRankId: string): Rank | null {
  const idx = RANKS.findIndex((r) => r.id === currentRankId);
  if (idx === -1 || idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1];
}

// ───────── KINGDOMS (placeholder content — matches the Instruction spec) ─────────
// NOTE: kingdom names/bosses/strategies will be replaced verbatim with the
// chesswhiz-kingdom.jsx artifact content when that's provided. For now these
// are plausible placeholders that satisfy the type contract.

export const KINGDOMS: Kingdom[] = [
  {
    id: "village",
    name: "Pawn Village",
    subtitle: "Where every grandmaster's journey begins",
    level: 1,
    color: "#8A8278",
    description: "A peaceful village where pawns learn their first steps. No bosses here — just the basics: how each piece moves, captures, and works together.",
    boss: null,
    strategies: [
      { id: "piece_movement", name: "How Pieces Move", description: "Master the movement of each piece.", coachExplanation: "Every piece has its own personality! The knight jumps, the bishop slides on diagonals, the rook rules the ranks and files.", kingdom: "village", prerequisites: [], xpReward: 30 },
      { id: "basic_captures", name: "Captures & Trades", description: "Learn when to trade pieces and when to hold.", coachExplanation: "Not every capture is a good one! Sometimes you give up a pawn to gain a much bigger prize.", kingdom: "village", prerequisites: ["piece_movement"], xpReward: 40 },
      { id: "check_checkmate", name: "Check & Checkmate", description: "Understand the goal of chess.", coachExplanation: "Check means your king is in danger! Checkmate means game over — protect your king at all costs.", kingdom: "village", prerequisites: ["piece_movement"], xpReward: 50 },
    ],
  },
  {
    id: "fork_forest",
    name: "The Fork Forest",
    subtitle: "Where the Knight Twins ambush travelers",
    level: 2,
    color: "#1B7340",
    description: "A dense forest where knights leap from trees, attacking two things at once. To survive, you must learn to see the double threat before it strikes.",
    boss: {
      name: "The Knight Twins",
      emoji: "♞♞",
      personality: "Mischievous, playful, always grinning. They talk as one voice, finishing each other's sentences. They taunt you for playing slow.",
      signature: "Double knight assault — always trying to create forks with both knights working together.",
      dialogue: [
        "Oho! A visitor! Let us show you how the forest really works...",
        "Did you see that one coming? Neither did your queen!",
        "Well played, traveler. You've earned the Fork Power. Use it wisely!",
      ],
    },
    strategies: [
      { id: "knight_forks", name: "Knight Forks", description: "The knight attacks two pieces at once.", coachExplanation: "A fork is like a kid with two hands in the cookie jar — your knight grabs two things at once, and the opponent can only save one!", kingdom: "fork_forest", prerequisites: [], xpReward: 80 },
      { id: "royal_fork", name: "The Royal Fork", description: "Forking king + queen for massive material gain.", coachExplanation: "The king MUST move out of check. So if you fork the king and queen — the queen is yours!", kingdom: "fork_forest", prerequisites: ["knight_forks"], xpReward: 100 },
      { id: "pawn_forks", name: "Pawn Forks", description: "Pawns can fork too!", coachExplanation: "Never underestimate a pawn — a single pawn push can threaten two pieces at once.", kingdom: "fork_forest", prerequisites: ["knight_forks"], xpReward: 60 },
    ],
  },
  {
    id: "pin_palace",
    name: "The Pin Palace",
    subtitle: "Halls guarded by the Shadow Bishop",
    level: 3,
    color: "#3B82F6",
    description: "A vast palace of long corridors where bishops hold their targets frozen in place. Learn to pin pieces to their king — and punish those who try to escape.",
    boss: {
      name: "The Shadow Bishop",
      emoji: "♝",
      personality: "Calm, patient, speaks in whispers. Never rushes. Believes position matters more than material.",
      signature: "Long diagonal pins that freeze your pieces, then slowly wins them one by one.",
      dialogue: [
        "I see you... from a distance. You cannot hide from the long diagonals.",
        "Your knight is pinned. It cannot move. It is... mine now.",
        "You have learned patience. The diagonals are yours to command.",
      ],
    },
    strategies: [
      { id: "absolute_pin", name: "Absolute Pin", description: "Pin a piece to its king — it can't move.", coachExplanation: "When a piece is pinned to the king, it's frozen! The pinned piece LITERALLY can't move because it would leave the king in check.", kingdom: "pin_palace", prerequisites: [], xpReward: 100 },
      { id: "relative_pin", name: "Relative Pin", description: "Pin a piece to a more valuable piece.", coachExplanation: "Even without the king, a pin works if the piece behind is worth more — moving the pinned piece loses the big one.", kingdom: "pin_palace", prerequisites: ["absolute_pin"], xpReward: 90 },
      { id: "pin_exploitation", name: "Exploiting the Pin", description: "Pile on the pinned piece to win it.", coachExplanation: "A pinned piece can't defend itself. Attack it again with a pawn or another piece — and it's yours.", kingdom: "pin_palace", prerequisites: ["absolute_pin"], xpReward: 110 },
    ],
  },
  {
    id: "skewer_spire",
    name: "Skewer Spire",
    subtitle: "Home of the Iron Rook",
    level: 3,
    color: "#F97316",
    description: "A tower where valuable pieces are impaled on long lines. The skewer is the pin's aggressive cousin — the big piece moves first, leaving the small one behind to capture.",
    boss: {
      name: "The Iron Rook",
      emoji: "♜",
      personality: "Gruff, direct, respects strength. Speaks in short sentences. Doesn't waste words or moves.",
      signature: "Rook skewers on open files — forces your king to move, then takes whatever's behind.",
      dialogue: [
        "No tricks in my tower. Just force. Let's see yours.",
        "Your king moves. Your rook falls. That's how it works.",
        "Strong move. The Spire respects you now.",
      ],
    },
    strategies: [
      { id: "rook_skewer", name: "Rook Skewer", description: "Attack a valuable piece with a less valuable one behind.", coachExplanation: "A skewer is like a fork in reverse — the big piece has to move, and the small one gets captured!", kingdom: "skewer_spire", prerequisites: [], xpReward: 110 },
      { id: "king_skewer", name: "King Skewer", description: "Force the king to move, win the piece behind.", coachExplanation: "When you check the king with a skewer, the king MUST move — and whatever's behind it is yours!", kingdom: "skewer_spire", prerequisites: ["rook_skewer"], xpReward: 130 },
    ],
  },
  {
    id: "discovery_depths",
    name: "Discovery Depths",
    subtitle: "The caverns of the Hidden Dragon",
    level: 4,
    color: "#9333EA",
    description: "Dark caves where pieces hide behind each other. Move one — and a hidden attack erupts from behind. Double checks are the most devastating move in chess.",
    boss: {
      name: "The Hidden Dragon",
      emoji: "🐉",
      personality: "Ancient, wise, cryptic. Speaks in riddles. Rewards cleverness over force.",
      signature: "Discovered attacks — moves one piece to reveal a devastating attack from another.",
      dialogue: [
        "What you see is not all there is. Look behind the curtain...",
        "One move. Two attacks. Can you handle both?",
        "You see with the eyes of a master now. Go, use this sight.",
      ],
    },
    strategies: [
      { id: "discovered_attack", name: "Discovered Attack", description: "Move one piece, reveal an attack from another.", coachExplanation: "It's a two-for-one! Your piece moves AND another piece behind it suddenly attacks. Sneaky!", kingdom: "discovery_depths", prerequisites: [], xpReward: 150 },
      { id: "discovered_check", name: "Discovered Check", description: "Move one piece, reveal a check from another.", coachExplanation: "The moving piece can go anywhere — even grab something — because the opponent HAS to deal with the check first!", kingdom: "discovery_depths", prerequisites: ["discovered_attack"], xpReward: 160 },
      { id: "double_check", name: "Double Check", description: "Two pieces check the king at once — king MUST move.", coachExplanation: "Double check is the most powerful weapon in chess. The king can't block or capture — it MUST run!", kingdom: "discovery_depths", prerequisites: ["discovered_check"], xpReward: 200 },
    ],
  },
  {
    id: "strategy_summit",
    name: "Strategy Summit",
    subtitle: "The mountain of the Old Master",
    level: 5,
    color: "#C7940A",
    description: "A peak where battles are won by plans, not tricks. Sacrifice material for position. Control the center. Think ten moves ahead.",
    boss: {
      name: "The Old Master",
      emoji: "🧙",
      personality: "Wise, slow-moving, thoughtful. Has seen it all. Teaches as much as he fights.",
      signature: "Positional sacrifices — gives up a pawn or piece to build an unstoppable position.",
      dialogue: [
        "A young challenger. Come. Show me your plan, not your tricks.",
        "You took my pawn. But look where MY pieces are now...",
        "You see the whole board at last. The Summit bows to you.",
      ],
    },
    strategies: [
      { id: "positional_sacrifice", name: "Positional Sacrifice", description: "Give up material to improve your position.", coachExplanation: "Sometimes losing a pawn is the BEST move — if it gives you a huge advantage in position or king safety!", kingdom: "strategy_summit", prerequisites: [], xpReward: 200 },
      { id: "center_control", name: "Center Control", description: "Dominate the center squares.", coachExplanation: "The center is chess real estate — whoever controls it, controls the game.", kingdom: "strategy_summit", prerequisites: [], xpReward: 150 },
      { id: "deflection", name: "Deflection", description: "Force a defender to move away from its job.", coachExplanation: "If a piece is guarding something important, give it a reason to leave — then strike!", kingdom: "strategy_summit", prerequisites: ["positional_sacrifice"], xpReward: 180 },
    ],
  },
  {
    id: "endgame_throne",
    name: "The Endgame Throne",
    subtitle: "Where the Crown Jester rules the final squares",
    level: 6,
    color: "#DC2626",
    description: "The final kingdom. Few pieces left on the board. Every move matters. Precision beats power — master the endgame and you master chess.",
    boss: {
      name: "The Crown Jester",
      emoji: "🃏",
      personality: "Theatrical, unpredictable, plays for style. Loves tricky endgame studies. Always smiling.",
      signature: "Back-rank mates and king-and-pawn endgames that look lost until the final move.",
      dialogue: [
        "Ahhh! The final challenger! Let's put on a SHOW!",
        "Did you see THAT coming? Oh, the DRAMA!",
        "A worthy jester. The throne is yours — for now.",
      ],
    },
    strategies: [
      { id: "back_rank_mate", name: "Back Rank Mate", description: "Deliver checkmate on the opponent's back rank.", coachExplanation: "A trapped king on the back rank is a dead king — a single rook or queen can end the game!", kingdom: "endgame_throne", prerequisites: [], xpReward: 180 },
      { id: "king_pawn_endgame", name: "King & Pawn Endgames", description: "The king becomes an attacker in the endgame.", coachExplanation: "In the endgame, your king is a fighter! Bring it forward to help your pawns promote.", kingdom: "endgame_throne", prerequisites: [], xpReward: 220 },
      { id: "opposition", name: "Opposition", description: "Master the concept of king opposition.", coachExplanation: "Two kings face to face? The one who moves LAST wins the square war — learn to force your opponent to move first!", kingdom: "endgame_throne", prerequisites: ["king_pawn_endgame"], xpReward: 240 },
    ],
  },
];

// ───────── POWERS ─────────
export const POWERS: Power[] = [
  // Fork Forest
  { id: "fork_master",    name: "Fork Master",    icon: "⚔",  tactic: "Knight Forks",   kingdom: "fork_forest",     howToEarn: "Execute a knight fork winning material in a real game", coachCelebration: "YES! You forked two pieces! That's EXACTLY how the Knight Twins do it!", rarity: "common" },
  { id: "royal_forker",   name: "Royal Forker",   icon: "👑", tactic: "Royal Fork",     kingdom: "fork_forest",     howToEarn: "Fork a king and queen in a real game",                  coachCelebration: "A ROYAL FORK! The king had to move — and the queen is YOURS!", rarity: "rare" },
  // Pin Palace
  { id: "pin_weaver",     name: "Pin Weaver",     icon: "📌", tactic: "Absolute Pin",   kingdom: "pin_palace",      howToEarn: "Pin an enemy piece to its king",                         coachCelebration: "PINNED to the king! That piece is frozen solid. The Shadow Bishop approves!", rarity: "common" },
  { id: "pin_exploiter",  name: "Pin Exploiter",  icon: "🎯", tactic: "Pin Exploitation", kingdom: "pin_palace",    howToEarn: "Win a pinned piece by piling attackers on it",           coachCelebration: "You pinned it — then PILED on! That's masterclass pin play.", rarity: "rare" },
  // Skewer Spire
  { id: "skewer_striker", name: "Skewer Striker", icon: "🏹", tactic: "Rook Skewer",    kingdom: "skewer_spire",    howToEarn: "Skewer a valuable piece with a rook or queen",           coachCelebration: "SKEWER! The big piece had to move, and the little one FELL. The Iron Rook nods.", rarity: "common" },
  // Discovery Depths
  { id: "sight_unseen",   name: "Sight Unseen",   icon: "👁",  tactic: "Discovered Attack", kingdom: "discovery_depths", howToEarn: "Land a discovered attack",                          coachCelebration: "A DISCOVERED ATTACK! One move — two threats. The Hidden Dragon is impressed!", rarity: "rare" },
  { id: "double_trouble", name: "Double Trouble", icon: "💥", tactic: "Double Check",   kingdom: "discovery_depths", howToEarn: "Deliver a double check",                              coachCelebration: "DOUBLE CHECK! The king HAS to run — no blocks, no captures. LEGENDARY!", rarity: "legendary" },
  // Strategy Summit
  { id: "positional_sage", name: "Positional Sage", icon: "🧘", tactic: "Positional Sacrifice", kingdom: "strategy_summit", howToEarn: "Sacrifice material for a winning position",    coachCelebration: "A SACRIFICE! You gave up material for something bigger — that's grandmaster thinking!", rarity: "epic" },
  // Endgame Throne
  { id: "back_rank_boss", name: "Back Rank Boss", icon: "♔",  tactic: "Back Rank Mate", kingdom: "endgame_throne",  howToEarn: "Deliver a back rank checkmate",                         coachCelebration: "BACK RANK MATE! The king had nowhere to run. Pure endgame poetry.", rarity: "epic" },
];

export function getPowersForKingdom(kingdomId: string): Power[] {
  return POWERS.filter((p) => p.kingdom === kingdomId);
}

export function getKingdomById(id: string): Kingdom | undefined {
  return KINGDOMS.find((k) => k.id === id);
}

// ───────── XP REWARDS TABLE ─────────
export const XP_REWARDS = {
  winGame: { 1: 30, 2: 40, 3: 50 } as const,
  drawGame: { 1: 15, 2: 20, 3: 25 } as const,
  loseGame: 10,
  puzzleEasy: 10,
  puzzleMedium: 15,
  puzzleHard: 25,
  coachPraise: 5,
  applyTactic: 20,
};

export const STREAK_MULTIPLIERS: { days: number; mult: number }[] = [
  { days: 30, mult: 1.5 },
  { days: 14, mult: 1.3 },
  { days: 7,  mult: 1.2 },
  { days: 3,  mult: 1.1 },
];

export function getStreakMultiplier(streakDays: number): number {
  for (const tier of STREAK_MULTIPLIERS) {
    if (streakDays >= tier.days) return tier.mult;
  }
  return 1.0;
}
