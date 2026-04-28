import type { Rank, Kingdom, Power, Strategy } from "./types";

// ───────── RANKS ─────────

export const RANKS: Rank[] = [
  { id: "pawn", name: "Pawn", icon: "♟", level: 1, xpRequired: 0, color: "#8B7355" },
  { id: "knight", name: "Knight", icon: "♞", level: 2, xpRequired: 500, color: "#22C55E" },
  { id: "bishop", name: "Bishop", icon: "♝", level: 3, xpRequired: 1500, color: "#3B82F6" },
  { id: "rook", name: "Rook", icon: "♜", level: 4, xpRequired: 3500, color: "#EF4444" },
  { id: "queen", name: "Queen", icon: "♛", level: 5, xpRequired: 7000, color: "#A855F7" },
  { id: "king", name: "King", icon: "♚", level: 6, xpRequired: 12000, color: "#EAB308" },
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

// ───────── KINGDOMS ─────────

export const KINGDOMS: Kingdom[] = [
  {
    id: "village",
    name: "Pawn Village",
    subtitle: "Where every journey begins",
    level: 1,
    color: "#8B7355",
    description:
      "A humble village where young chess players learn the basics. The Village Elder teaches board setup, piece movement, and the sacred rules of chess. There is no boss here — only warmth, patience, and the first sparks of understanding.",
    boss: null,
    strategies: [
      {
        id: "board_setup",
        name: "The Board",
        description: "Ranks, files, diagonals, and square names (a1–h8). The foundation of everything.",
        coachExplanation:
          "Think of the board like a city map — every square has an address! a1 is the corner, e4 is the center of town.",
        kingdom: "village",
        prerequisites: [],
        xpReward: 25,
      },
      {
        id: "piece_movement",
        name: "Piece Movement",
        description:
          "How each piece moves: pawns march forward, knights jump in an L, bishops slide diagonally, rooks drive straight, the queen goes anywhere, and the king takes one careful step at a time.",
        coachExplanation:
          "Every piece is a character with their own superpower! The knight is the horse that jumps over everyone. The bishop is the sneaky diagonal slider. Learn how they ALL move and you unlock the whole game!",
        kingdom: "village",
        prerequisites: ["board_setup"],
        xpReward: 50,
      },
      {
        id: "captures_values",
        name: "Captures & Values",
        description:
          "Taking opponent pieces and understanding their worth: Pawn = 1, Knight = 3, Bishop = 3, Rook = 5, Queen = 9. Trading a knight for a rook is winning material!",
        coachExplanation:
          "Imagine each piece has a price tag. Would you trade your $3 knight for their $5 rook? YES! Always try to get more than you give.",
        kingdom: "village",
        prerequisites: ["piece_movement"],
        xpReward: 50,
      },
      {
        id: "check_checkmate",
        name: "Check & Checkmate",
        description:
          "Check means the king is under attack. Checkmate means the king is under attack AND cannot escape — game over! Also learn stalemate (no legal moves but NOT in check = draw).",
        coachExplanation:
          "Check is like saying 'watch out, your king is in danger!' Checkmate is like saying 'game over — your king has NOWHERE to run!' That's how you WIN!",
        kingdom: "village",
        prerequisites: ["captures_values"],
        xpReward: 75,
      },
      {
        id: "special_moves",
        name: "Special Moves",
        description:
          "Three special rules: Castling (king + rook swap to safety), en passant (sneaky pawn capture), and promotion (pawn reaches the end and becomes a queen!).",
        coachExplanation:
          "These are the SECRET MOVES of chess! Castling is like building a fortress for your king. Promotion is like a little pawn growing up to become a QUEEN! And en passant... that's the trickiest one. Even some adults don't know it!",
        kingdom: "village",
        prerequisites: ["piece_movement"],
        xpReward: 75,
      },
    ],
  },
  {
    id: "fork_forest",
    name: "The Fork Forest",
    subtitle: "Where the Knight Twins ambush travelers",
    level: 2,
    color: "#22C55E",
    description:
      "A dark, twisting forest where two mischievous Knight Twins attack travelers from both sides at once. They leap over bushes and fences, always landing between two valuable targets. To pass through the forest, you must learn their trick — and use it against them.",
    boss: {
      name: "The Knight Twins",
      emoji: "♞♞",
      personality:
        "Playful tricksters who never stop giggling. They finish each other's sentences and always attack two things at once.",
      signature:
        "Every single move is a fork. They never attack just one piece — always two. Their knights dance across the board in coordinated L-shaped ambushes.",
      dialogue: [
        "Hehe! We got your rook AND your queen! Didn't see us coming, did you?",
        "You'll never catch us — we jump over EVERYTHING! Try to block THAT!",
        "Wait... did YOU just fork US?! That's... that's OUR move! No fair! ...Okay, fine. You earned it.",
      ],
      signatureLesson: "We move together — one knight here, one knight there. Two attacks at once! That's a Fork, little one. Hehe.",
      openingFEN: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
      defeatTactic: "fork",
      voicedIntro: "Hehe! We are the Knight Twins — and we attack from TWO directions at once!",
    },
    strategies: [
      {
        id: "hanging_pieces",
        name: "Hanging Pieces",
        description:
          "A hanging piece is an unprotected piece — one that nobody is defending. Before every move, scan the board: are any of YOUR pieces hanging? Are any of THEIRS? Free captures win games!",
        coachExplanation:
          "Before you move, always ask: 'Is anything free?' If your opponent left a piece without a bodyguard, go grab it! And make sure YOUR pieces all have friends protecting them.",
        kingdom: "fork_forest",
        prerequisites: ["captures_values"],
        xpReward: 60,
      },
      {
        id: "knight_forks",
        name: "Knight Forks",
        description:
          "The knight is the best forking piece because it jumps in an L-shape and can't be blocked. Look for squares where your knight attacks two valuable pieces at once — especially king + another piece (the king MUST move, so you win the other piece for free!).",
        coachExplanation:
          "The knight is like a sneaky ninja — it hops over everyone and attacks TWO things at once! Like eating from two plates at a buffet! The best fork is when you check the king AND attack something else. The king HAS to move, and you grab the other piece! 🐴",
        kingdom: "fork_forest",
        prerequisites: ["hanging_pieces"],
        xpReward: 80,
      },
      {
        id: "pawn_forks",
        name: "Pawn Forks",
        description:
          "Even the humble pawn can fork! By advancing a pawn, it attacks diagonally left AND right. If two enemy pieces are on those diagonal squares, the pawn forks them. Since pawns are only worth 1 point, forking two pieces worth 3+ is always a great trade.",
        coachExplanation:
          "Don't underestimate the little pawn! It can attack two big pieces at once by moving forward. And since it's the cheapest piece on the board, your opponent HATES losing a knight or bishop to a tiny pawn! 🤏",
        kingdom: "fork_forest",
        prerequisites: ["knight_forks"],
        xpReward: 60,
      },
      {
        id: "queen_forks",
        name: "Queen Forks",
        description:
          "The queen can fork along ranks, files, and diagonals — she has more forking potential than any other piece. But be careful: if your queen forks two pieces but is also attacked, you might lose the queen!",
        coachExplanation:
          "The queen is the ULTIMATE forker because she moves in EVERY direction. But she's also your most valuable piece — so don't put her in danger just for a fork. Make sure she's SAFE while she attacks! 👑",
        kingdom: "fork_forest",
        prerequisites: ["knight_forks"],
        xpReward: 80,
      },
    ],
  },
  {
    id: "pin_palace",
    name: "The Pin Palace",
    subtitle: "Where the Shadow Bishop holds pieces hostage",
    level: 3,
    color: "#3B82F6",
    description:
      "A grand palace of mirrors and shifting shadows where the Shadow Bishop rules with a patient, calculating gaze. Pieces that can see the king behind them dare not move — they are paralyzed by the bishop's diagonal stare. The hallways are lined with geometric traps, and every corridor leads to a pin.",
    boss: {
      name: "The Shadow Bishop",
      emoji: "♝",
      personality:
        "Patient, calculating, speaks in riddles. Never rushes. Waits for pieces to line up on the same diagonal, then strikes with devastating precision.",
      signature:
        "Pins your strongest pieces to your king — you can see the threat coming but you can't escape. Every move creates a new diagonal trap.",
      dialogue: [
        "Your knight wants to move... but dare it abandon its king? I think not.",
        "In my palace, every piece is a prisoner of its own loyalty. The more you protect, the less you can move.",
        "Interesting. You've learned to break my pins. Perhaps you are worthy of leaving this palace... alive.",
      ],
      signatureLesson: "I stare down the diagonal and FREEZE your piece. It cannot move — or your king is exposed. That is the Pin.",
      openingFEN: "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      defeatTactic: "pin",
      voicedIntro: "I am the Shadow Bishop. My gaze freezes everything it touches.",
    },
    strategies: [
      {
        id: "absolute_pins",
        name: "Absolute Pins",
        description:
          "An absolute pin targets a piece that has the KING directly behind it. The pinned piece CANNOT legally move — moving it would expose the king to check, which is illegal. This is the strongest type of pin.",
        coachExplanation:
          "When a piece is pinned to the king, it's FROZEN. It literally can't move — the rules won't let it! It's like pinning someone's cape to the wall. They can see you coming but they can't get out of the way! 📌",
        kingdom: "pin_palace",
        prerequisites: ["knight_forks"],
        xpReward: 80,
      },
      {
        id: "relative_pins",
        name: "Relative Pins",
        description:
          "A relative pin targets a piece with a valuable (but not king) piece behind it. The pinned piece CAN legally move, but doing so loses the more valuable piece behind it. Most players won't move the pinned piece — but sometimes they have to!",
        coachExplanation:
          "A relative pin is like saying 'you CAN move... but it'll cost you your queen!' Most of the time, the opponent just leaves the pinned piece stuck. Then you pile on — attack it with pawns and win it!",
        kingdom: "pin_palace",
        prerequisites: ["absolute_pins"],
        xpReward: 80,
      },
      {
        id: "pin_pile_on",
        name: "Pin & Pile On",
        description:
          "Once a piece is pinned, it can't run away. So attack it again — and again! Move a pawn toward it, aim another piece at it. The pinned piece is a sitting duck. This is one of the most effective strategies in chess.",
        coachExplanation:
          "Step 1: Pin the piece. Step 2: Attack the pinned piece with EVERYTHING. It can't move, so just pile on! It's like tag when someone is stuck — everyone gets to tag them! 🕷️",
        kingdom: "pin_palace",
        prerequisites: ["absolute_pins"],
        xpReward: 100,
      },
      {
        id: "breaking_pins",
        name: "Breaking Pins",
        description:
          "When YOUR piece gets pinned, you need to know how to escape. Options: (1) block the pin with another piece, (2) attack the pinning piece, (3) move the piece behind (if it's not the king), (4) just capture the pinning piece. Knowing how to break pins is as important as knowing how to create them.",
        coachExplanation:
          "Getting pinned is scary — but you're NOT helpless! Can you put something in the way? Can you chase the pinning piece away? Can you move the big piece behind? Always look for a way out! 🔓",
        kingdom: "pin_palace",
        prerequisites: ["relative_pins"],
        xpReward: 80,
      },
    ],
  },
  {
    id: "skewer_spire",
    name: "The Skewer Spire",
    subtitle: "Where the Rook Queen strikes through the line",
    level: 3,
    color: "#EF4444",
    description:
      "A towering crystal spire rising from the mountains where the Rook Queen commands long, straight corridors with absolute authority. She attacks the most valuable piece first — and when it flees in panic, she captures whatever was hiding behind it. Nothing escapes her line of sight.",
    boss: {
      name: "The Rook Queen",
      emoji: "♜",
      personality:
        "Regal, direct, and devastatingly efficient. Never wastes a move. Speaks with the confidence of someone who controls every open file on the board.",
      signature:
        "Skewers your king on open files and ranks, forcing it to flee, then captures the queen or rook that was hiding behind. Her corridors are death traps.",
      dialogue: [
        "Your king flees, but your rook stays. How generous of you to leave it for me.",
        "Never stand behind your king on an open file. I am always watching. Always.",
        "You skewered ME? I... I must admit, I respect that. The student becomes the master.",
      ],
      signatureLesson: "I charge your most powerful piece — and the one hiding BEHIND it gets skewered! The Skewer: big piece first, then the one behind.",
      openingFEN: "r1bqk2r/ppp2ppp/2np1n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
      defeatTactic: "skewer",
      voicedIntro: "I am the Lancer! I charge through your strongest pieces!",
    },
    strategies: [
      {
        id: "king_skewers",
        name: "King Skewers",
        description:
          "Attack the king with a rook, bishop, or queen. The king MUST move (it's in check). Whatever piece was behind the king on the same line gets captured. The most common skewer pattern.",
        coachExplanation:
          "A skewer is like a pin in REVERSE! Instead of trapping the small piece, you attack the BIG piece first. The king runs away, and you grab whatever was hiding behind it! Like a kebab — push the stick through the big piece first! 🍢",
        kingdom: "skewer_spire",
        prerequisites: ["absolute_pins"],
        xpReward: 80,
      },
      {
        id: "queen_skewers",
        name: "Queen Skewers",
        description:
          "Attack the enemy queen with a bishop or rook. The queen must move (it's too valuable to lose). Behind the queen? A rook, a bishop, or even an undefended piece. Queen moves, you capture.",
        coachExplanation:
          "The queen is powerful but she's also a TARGET. If you attack her with a less valuable piece, she HAS to move. And whatever she was protecting behind her? Now it's yours! 👸➡️🏨",
        kingdom: "skewer_spire",
        prerequisites: ["king_skewers"],
        xpReward: 80,
      },
      {
        id: "back_rank_threats",
        name: "Back Rank Threats",
        description:
          "The back rank (rank 1 for white, rank 8 for black) is the most dangerous corridor in chess. If the king is trapped there by its own pawns with no escape square, a single rook or queen on the back rank is CHECKMATE. Always give your king 'luft' (push h3 or a3 to create an escape). And always look for back rank weaknesses in your opponent!",
        coachExplanation:
          "The back rank is like a dead-end alley — if your king is stuck there, one rook slam is game over! Always give your king a window to escape by pushing one pawn. And check if your OPPONENT forgot to do the same... 😈",
        kingdom: "skewer_spire",
        prerequisites: ["king_skewers"],
        xpReward: 100,
      },
    ],
  },
  {
    id: "discovery_depths",
    name: "The Discovery Depths",
    subtitle: "Where the Hidden Army strikes from shadows",
    level: 4,
    color: "#F97316",
    description:
      "Deep underground caverns lit by flickering torchlight where the Phantom General commands an invisible army. One piece moves aside to reveal a devastating attack from the piece behind it — you never see it coming until it's too late. In these depths, the most dangerous move is the one you DON'T see.",
    boss: {
      name: "The Phantom General",
      emoji: "👻",
      personality:
        "Mysterious and ethereal. Speaks in whispers. Appears from nowhere. Every move has a hidden purpose — the real threat is always the one you can't see.",
      signature:
        "Every move reveals a hidden attacker. Discovered attacks, discovered checks, and the devastating double check — two pieces attacking your king at once, leaving no defense except to run.",
      dialogue: [
        "*whisper* I moved my bishop... but it's the rook behind it you should fear. Look again.",
        "Two attackers. One move. Your king has nowhere to hide and nothing can save it. Welcome to the depths.",
        "You've learned to see the invisible. Not many survive these caverns with that wisdom. The depths have taught you well.",
      ],
      signatureLesson: "I hide behind my own pieces. When they step aside — surprise! My power is REVEALED. That is a Discovered Attack.",
      openingFEN: "r1bqkb1r/ppp2ppp/2np1n2/4p3/3PP3/2NB1N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
      defeatTactic: "discovered_attack",
      voicedIntro: "You cannot see me... until it is too late. I am the Hidden Rook!",
    },
    strategies: [
      {
        id: "discovered_attacks",
        name: "Discovered Attacks",
        description:
          "Move one piece out of the way to reveal an attack from a different piece behind it. Now your opponent faces TWO problems: the piece you moved AND the piece you revealed. They can only deal with one!",
        coachExplanation:
          "It's like a magician's trick — your opponent watches the piece you moved, but the REAL danger was the one hiding behind it all along! One move, two threats! 🎩✨",
        kingdom: "discovery_depths",
        prerequisites: ["absolute_pins", "king_skewers"],
        xpReward: 100,
      },
      {
        id: "discovered_check",
        name: "Discovered Check",
        description:
          "A discovered attack where the revealed piece gives CHECK to the king. The king MUST deal with the check, which means the moving piece gets a FREE move — it can capture anything, go anywhere. The opponent can't stop it because they're busy saving their king!",
        coachExplanation:
          "Discovered check is like a free turn! You reveal check with one piece, and while the opponent deals with THAT, your other piece can go ANYWHERE — capture a queen, take a rook, do whatever it wants! 🎯",
        kingdom: "discovery_depths",
        prerequisites: ["discovered_attacks"],
        xpReward: 100,
      },
      {
        id: "double_check",
        name: "Double Check",
        description:
          "The ultimate discovered attack: BOTH the moving piece AND the revealed piece give check simultaneously. The king is attacked by two pieces at once. You can't block two checks. You can't capture two pieces. The king MUST move. This is the most forcing move in chess.",
        coachExplanation:
          "DOUBLE CHECK is the most POWERFUL move in all of chess! Two pieces checking the king at the same time. There's NO block. There's NO capture. The king HAS to run. And wherever it runs... you're probably ready. ⚡⚡",
        kingdom: "discovery_depths",
        prerequisites: ["discovered_check"],
        xpReward: 120,
      },
    ],
  },
  {
    id: "strategy_summit",
    name: "The Strategy Summit",
    subtitle: "Where the Grand Strategist sees the whole board",
    level: 5,
    color: "#A855F7",
    description:
      "The windswept mountain peak above the clouds where chess becomes more than tricks and traps. The Grand Strategist sees patterns that take 10, 20, 30 moves to unfold. Pawn structures, piece coordination, space control — this is where chess transforms from a game of tactics into an art of long-term planning.",
    boss: {
      name: "The Grand Strategist",
      emoji: "🧙",
      personality:
        "Ancient, wise, infinitely patient. Never rushes. Wins without flashy tactics — just relentless, suffocating improvement. Every move makes a position slightly better until you can't breathe.",
      signature:
        "No sacrifices, no flashy forks. Just slowly improving every piece, creating weaknesses in your pawn structure, and squeezing you until you crack. Wins by making you WANT to resign.",
      dialogue: [
        "You captured my pawn. Congratulations. But now your pawn structure is ruined... forever.",
        "Every move I make improves my worst piece. Tell me — what does YOUR move improve?",
        "Tactics win battles. Strategy wins wars. You have climbed the summit. Now you see the whole board. Welcome.",
      ],
      signatureLesson: "I use every piece together. But today's lesson: the Double Check — two checkers at once. The king MUST run!",
      openingFEN: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/4P3/2NP1N2/PPP1BPPP/R1BQ1RK1 w - - 0 8",
      defeatTactic: "double_check",
      voicedIntro: "I am the Elder Queen. Every piece has a purpose — and today, yours must too.",
    },
    strategies: [
      {
        id: "pawn_structure",
        name: "Pawn Structure",
        description:
          "Pawns can't go backwards — every pawn move permanently changes the position. Doubled pawns (two on the same file) are weak. Isolated pawns (no friends on adjacent files) need constant protection. Backward pawns (can't advance safely) are targets. And passed pawns (no enemy pawn can stop them) are gold — escort them to promotion!",
        coachExplanation:
          "Pawns are like the skeleton of your position — they hold everything together. But they can NEVER go backwards! So think carefully before you push one. A ruined pawn structure is like a cracked foundation — everything eventually falls apart. 🧱",
        kingdom: "strategy_summit",
        prerequisites: ["special_moves"],
        xpReward: 120,
      },
      {
        id: "piece_activity",
        name: "Piece Activity",
        description:
          "Every move, look at ALL your pieces and ask: which one is doing the LEAST? A knight stuck on the edge? A bishop blocked by its own pawns? A rook with no open file? Find your laziest piece and give it a better job. A coordinated army beats scattered forces every time.",
        coachExplanation:
          "Imagine your pieces are a band. If the drummer stopped playing, the whole song sounds wrong. Find your laziest piece — the one just sitting around doing nothing — and put it to WORK! Every piece should be jamming! 🎸",
        kingdom: "strategy_summit",
        prerequisites: ["pawn_structure"],
        xpReward: 80,
      },
      {
        id: "open_files",
        name: "Open Files",
        description:
          "An open file is a file (column) with no pawns on it. Rooks are POWERFUL on open files because they can slide all the way up and down without obstruction. If you have an open file, put a rook on it. If you can double rooks on an open file, even better!",
        coachExplanation:
          "Open files are like highways for your rooks! No pawns in the way = your rook can zoom from one end to the other. Put your rook on the highway FIRST, before your opponent does! 🛣️",
        kingdom: "strategy_summit",
        prerequisites: ["pawn_structure"],
        xpReward: 80,
      },
      {
        id: "outposts",
        name: "Outposts",
        description:
          "An outpost is a square that can't be attacked by enemy pawns — usually because the adjacent pawns have already advanced past it. Place a knight on an outpost and it becomes a fortress. The knight controls tons of squares and the opponent can't chase it away with pawns.",
        coachExplanation:
          "An outpost is like a castle on a hilltop — once your knight sits there, nobody can kick it off! No enemy pawns can attack it. The knight just sits there, controlling everything, driving your opponent CRAZY. 🏰",
        kingdom: "strategy_summit",
        prerequisites: ["pawn_structure", "piece_activity"],
        xpReward: 100,
      },
      {
        id: "planning",
        name: "Making a Plan",
        description:
          "The most important strategic skill: HOW TO THINK. Step 1: Find a weakness in your opponent's position. Step 2: Choose it as your TARGET. Step 3: CONCENTRATE your forces toward it. Step 4: ATTACK. Without a plan, you're just making random moves. With a plan, every move has purpose.",
        coachExplanation:
          "Here's the secret that separates good players from great ones: HAVE A PLAN. Don't just move pieces randomly — find something WRONG in your opponent's position, aim ALL your pieces at it, and ATTACK. Think like a general, not a soldier! 🎯",
        kingdom: "strategy_summit",
        prerequisites: ["piece_activity", "open_files"],
        xpReward: 150,
      },
    ],
  },
  {
    id: "endgame_throne",
    name: "The Endgame Throne",
    subtitle: "Where the Immortal King awaits",
    level: 6,
    color: "#EAB308",
    description:
      "The final throne room at the heart of the Chess Kingdom, bathed in golden light. The Immortal King has played a thousand games and never lost an endgame. He sits motionless, watching, waiting. To claim the throne, you must master the art of converting advantages when few pieces remain — the most precise, demanding phase of chess.",
    boss: {
      name: "The Immortal King",
      emoji: "♔",
      personality:
        "Ancient beyond measure. Speaks rarely, and every word carries weight. Moves with absolute precision. Has never lost an endgame in a thousand years. Respects only those who earn his respect through perfect technique.",
      signature:
        "Perfect endgame technique. Opposition, passed pawns, king activity, rook endgame mastery. Converts the smallest advantage into a win with the patience of a glacier and the precision of a surgeon.",
      dialogue: [
        "In the endgame, I am no longer hiding behind my army. I am the army. Watch me fight.",
        "One pawn. One king. That is all I need to defeat you. Do you understand now?",
        "You have reached the throne. The kingdom is yours. But hear me, young champion: the learning... it never ends. Every game teaches something new. Go, and teach others what the Kingdom taught you.",
      ],
      signatureLesson: "I have survived a thousand battles. My weakness? The back rank. Sneak a rook or queen behind my pawns and I fall.",
      openingFEN: "6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1",
      defeatTactic: "back_rank_mate",
      voicedIntro: "I am King Eternal. None have reached my throne. Will you be the first?",
    },
    strategies: [
      {
        id: "king_activation",
        name: "King Activation",
        description:
          "In the opening and middlegame, the king hides. In the endgame, the king FIGHTS. With fewer pieces on the board, the king is safe to march to the center and join the battle. An active king in the endgame is worth almost as much as a minor piece. Bring it forward!",
        coachExplanation:
          "In the endgame, your king takes off his crown, rolls up his sleeves, and marches into battle! He's not hiding anymore — he's FIGHTING. Bring that king to the center and use him! He's worth almost as much as a knight in the endgame! 👑⚔️",
        kingdom: "endgame_throne",
        prerequisites: ["check_checkmate"],
        xpReward: 80,
      },
      {
        id: "opposition",
        name: "Opposition",
        description:
          "When two kings face each other with one square between them, whoever does NOT have to move has the 'opposition.' This is crucial in king and pawn endgames — having the opposition often means the difference between winning and drawing. Learn to count tempi and gain the opposition.",
        coachExplanation:
          "Opposition is like a staring contest between the two kings. The one who has to blink (move) first LOSES because they have to step aside. It sounds simple but it decides THOUSANDS of endgames! 👁️👁️",
        kingdom: "endgame_throne",
        prerequisites: ["king_activation"],
        xpReward: 120,
      },
      {
        id: "passed_pawns",
        name: "Passed Pawns",
        description:
          "A passed pawn is a pawn with no enemy pawns in front of it OR on adjacent files that could block it. It has a clear path to promotion! Passed pawns are incredibly dangerous in the endgame. Escort them forward with your king, clear the path, and promote to a queen.",
        coachExplanation:
          "A passed pawn is like a runner with no one left to block them — it's heading straight for the end zone! Your job: protect it, escort it, clear the path, and turn that little pawn into a QUEEN! 🏃‍♂️🏆",
        kingdom: "endgame_throne",
        prerequisites: ["pawn_structure", "king_activation"],
        xpReward: 100,
      },
      {
        id: "rook_endgames",
        name: "Rook Endgames",
        description:
          "Rook endings are the most common endgame type — they occur in roughly half of all games that reach an endgame. Key concepts: rooks belong BEHIND passed pawns (yours or your opponent's), the Lucena position (building a bridge to promote), and the Philidor position (the drawing technique of defending from behind).",
        coachExplanation:
          "Rook endgames happen in SO many games that learning them is like a cheat code. Two big rules: put your rook BEHIND the passed pawn (not in front!), and learn the 'bridge' technique to promote. These two things will win you games for the rest of your life! 📚",
        kingdom: "endgame_throne",
        prerequisites: ["opposition", "passed_pawns"],
        xpReward: 150,
      },
    ],
  },
];

// ───────── POWERS ─────────

export const POWERS: Power[] = [
  // Bronze (Pawn Village)
  { id: "board_master", name: "Board Master", icon: "📐", tactic: "Board Setup", kingdom: "village", howToEarn: "Complete the board setup tutorial and name 10 squares correctly", coachCelebration: "You know every square on the board! That's the foundation of EVERYTHING! 📐", rarity: "common" },
  { id: "first_blood", name: "First Blood", icon: "⚔️", tactic: "Captures", kingdom: "village", howToEarn: "Win material (capture a piece worth more than what you lost) in a real game", coachCelebration: "You traded up! Getting more than you give — that's SMART chess! ⚔️", rarity: "common" },
  { id: "check_hunter", name: "Check Hunter", icon: "🎯", tactic: "Check", kingdom: "village", howToEarn: "Deliver check 3 times in a single game", coachCelebration: "Three checks in one game! You're keeping that king on his TOES! 🎯", rarity: "common" },
  { id: "castle_keeper", name: "Castle Keeper", icon: "🏰", tactic: "Castling", kingdom: "village", howToEarn: "Castle before move 10 in 3 consecutive games", coachCelebration: "Three games in a row with early castling! Your king is ALWAYS safe with you! 🏰", rarity: "common" },
  { id: "pawn_star", name: "Pawn Star", icon: "⭐", tactic: "Promotion", kingdom: "village", howToEarn: "Promote a pawn to a queen in a real game", coachCelebration: "Your little pawn made it ALL the way! From zero to QUEEN! That's a champion's journey! ⭐", rarity: "common" },

  // Silver (Fork Forest)
  { id: "fork_master", name: "Fork Master", icon: "🍴", tactic: "Knight Forks", kingdom: "fork_forest", howToEarn: "Execute a knight fork that wins material in a real game", coachCelebration: "DOUBLE ATTACK! Your knight just ate from TWO plates at once! The Knight Twins would be proud! 🍴🐴", rarity: "rare" },
  { id: "pawn_forker", name: "Pawn Forker", icon: "♙", tactic: "Pawn Forks", kingdom: "fork_forest", howToEarn: "Execute a pawn fork that wins material in a real game", coachCelebration: "The mighty little pawn strikes TWICE! Never underestimate the smallest piece on the board! ♙💥", rarity: "common" },
  { id: "royal_forker", name: "Royal Forker", icon: "👑", tactic: "Royal Fork", kingdom: "fork_forest", howToEarn: "Fork the king and queen with a knight (the most devastating fork!)", coachCelebration: "THE ROYAL FORK! Knight checks the king AND attacks the queen! The queen is LOST! This is LEGENDARY! 👑🐴⚡", rarity: "epic" },

  // Silver (Pin Palace)
  { id: "pin_wizard", name: "Pin Wizard", icon: "📍", tactic: "Pins", kingdom: "pin_palace", howToEarn: "Pin an opponent's piece to their king or queen in a real game", coachCelebration: "PINNED! They can see the danger but they CAN'T ESCAPE! The Shadow Bishop smiles upon you! 📍✨", rarity: "rare" },
  { id: "pin_crusher", name: "Pin Crusher", icon: "🔨", tactic: "Pin & Pile On", kingdom: "pin_palace", howToEarn: "Pin a piece and then win it by attacking it with a second piece", coachCelebration: "PIN and PILE ON! You pinned the piece, then attacked it again — it couldn't run and it couldn't hide! DEVASTATING! 🔨💎", rarity: "rare" },

  // Silver (Skewer Spire)
  { id: "skewer_king", name: "Skewer King", icon: "🗡️", tactic: "Skewers", kingdom: "skewer_spire", howToEarn: "Execute a skewer that wins material in a real game", coachCelebration: "SKEWERED! You attacked the big piece, it ran, and you grabbed what was hiding behind it! The Rook Queen nods in respect! 🗡️👑", rarity: "rare" },
  { id: "back_rank_hero", name: "Back Rank Hero", icon: "🏁", tactic: "Back Rank Mate", kingdom: "skewer_spire", howToEarn: "Deliver a back rank checkmate in a real game", coachCelebration: "BACK RANK MATE! The king had NOWHERE to run! Trapped by its own pawns! That is DEVASTATING and BEAUTIFUL! 🏁💥", rarity: "epic" },

  // Gold (Discovery Depths)
  { id: "discovery_agent", name: "Discovery Agent", icon: "🕵️", tactic: "Discovered Attacks", kingdom: "discovery_depths", howToEarn: "Execute a discovered attack that wins material in a real game", coachCelebration: "DISCOVERED ATTACK! You moved one piece and REVEALED a secret weapon behind it! The Phantom General's favorite trick! 🕵️💥", rarity: "rare" },
  { id: "double_trouble", name: "Double Trouble", icon: "⚡", tactic: "Double Check", kingdom: "discovery_depths", howToEarn: "Deliver a double check in a real game", coachCelebration: "DOUBLE CHECK! TWO pieces attacking the king at once — there's NO block, NO capture, they MUST RUN! This is ELITE! ⚡⚡👑", rarity: "legendary" },

  // Gold (Strategy Summit)
  { id: "structure_master", name: "Structure Master", icon: "🧱", tactic: "Pawn Structure", kingdom: "strategy_summit", howToEarn: "Create a passed pawn and promote it to win a game", coachCelebration: "You created a passed pawn, escorted it home, and it became a QUEEN! That is master-level endgame play! The Grand Strategist approves! 🧱👑", rarity: "rare" },
  { id: "positional_genius", name: "Positional Genius", icon: "🧠", tactic: "Positional Play", kingdom: "strategy_summit", howToEarn: "Win a game without losing any material — pure outmaneuvering", coachCelebration: "You won WITHOUT losing a single piece! Pure positional DOMINATION! You didn't just beat them — you SUFFOCATED them! The Grand Strategist has a new student! 🧠🏆", rarity: "legendary" },

  // Diamond (Endgame Throne)
  { id: "endgame_warrior", name: "Endgame Warrior", icon: "⚔️", tactic: "King Activation", kingdom: "endgame_throne", howToEarn: "Use your king as an active fighting piece in the endgame to win a game", coachCelebration: "Your king marched into battle and helped WIN THE WAR! In the endgame, the king is a WARRIOR, not a coward! The Immortal King recognizes a kindred spirit! 👑⚔️", rarity: "rare" },
  { id: "opposition_master", name: "Opposition Master", icon: "👁️", tactic: "Opposition", kingdom: "endgame_throne", howToEarn: "Use opposition to promote a pawn in a king+pawn endgame", coachCelebration: "You SEIZED the opposition and marched your pawn to glory! That is the Immortal King's own technique! He bows to you! 👁️👑", rarity: "epic" },
  { id: "throne_claimer", name: "Throne Claimer", icon: "🏆", tactic: "Mastery", kingdom: "endgame_throne", howToEarn: "Defeat the Immortal King (hard bot) in an endgame that goes past move 40", coachCelebration: "You have DEFEATED the Immortal King! The throne is YOURS! A thousand years he waited for a worthy challenger, and YOU are the one. The Chess Kingdom will remember your name! 🏆👑🎆", rarity: "legendary" },
];

// ───────── OPENING STRATEGIES (taught contextually, not part of kingdoms) ─────────

export const OPENING_STRATEGIES: Strategy[] = [
  {
    id: "center_control",
    name: "Control the Center",
    description:
      "The center (d4, d5, e4, e5) is the most important area of the board. Pieces in the center control more squares and have more options. Start by pushing e4 or d4 to stake your claim!",
    coachExplanation:
      "Think of the center like the playground at recess — whoever controls the MIDDLE has the most friends to play with! Push a pawn to e4 or d4 on your first move! 🎯",
    kingdom: "fork_forest",
    prerequisites: ["piece_movement"],
    xpReward: 60,
  },
  {
    id: "develop_pieces",
    name: "Develop Your Pieces",
    description:
      "In the opening, bring out your knights and bishops before doing anything else. Don't move the same piece twice. Don't bring the queen out early (she'll just get chased). Knights before bishops, castle before move 10.",
    coachExplanation:
      "Imagine going to battle with only ONE soldier while the rest of your army is still sleeping in the barracks! Wake them ALL up first! Knights, bishops, castle — THEN think about attacking! 🛴",
    kingdom: "fork_forest",
    prerequisites: ["center_control"],
    xpReward: 60,
  },
  {
    id: "castle_early",
    name: "Castle Early",
    description:
      "Castling does two things at once: tucks your king behind a wall of pawns for safety, AND brings your rook toward the center for action. Try to castle before move 10. Don't move the pawns in front of your castled king unless you absolutely have to — they're your king's bodyguards!",
    coachExplanation:
      "Your king is like a precious gem — put it in a vault (behind your pawns!) before the battle gets wild. Castling is like hiring three bodyguards in one move! 🏰🛡",
    kingdom: "fork_forest",
    prerequisites: ["special_moves", "develop_pieces"],
    xpReward: 50,
  },
  {
    id: "dont_queen_early",
    name: "Don't Bring the Queen Out Early",
    description:
      "The queen is your most powerful piece — but in the opening, she's a TARGET. If you bring her out early, your opponent will develop their pieces while chasing your queen around. You lose time (tempo) and they get a better position. Develop minor pieces first!",
    coachExplanation:
      "I know the queen is exciting — she's the MOST powerful piece! But bringing her out early is like sending your BEST player onto the field before the rest of the team is ready. She'll just get chased around while everyone else gets into position! 🏃‍♀️",
    kingdom: "fork_forest",
    prerequisites: ["develop_pieces"],
    xpReward: 40,
  },
];

// ───────── Helpers ─────────

export function getPowersForKingdom(kingdomId: string): Power[] {
  return POWERS.filter((p) => p.kingdom === kingdomId);
}

export function getKingdomById(id: string): Kingdom | undefined {
  return KINGDOMS.find((k) => k.id === id);
}

// ───────── TIER GATING ─────────
// Free tier: only Pawn Village is unlocked. Champion: everything.
// Single source of truth — every lock check should call this.
export function isKingdomLocked(
  kingdomId: string,
  tier: "free" | "champion"
): boolean {
  if (tier === "champion") return false;
  return kingdomId !== "village";
}

// True once the player has finished enough of Pawn Village to feel
// the lock — used to time the upgrade prompt for maximum impact.
// "Ready" = mastered at least 3 of the 5 village strategies.
export function isReadyForNextKingdom(masteredStrategies: string[]): boolean {
  const village = KINGDOMS.find((k) => k.id === "village");
  if (!village) return false;
  const villageStrategyIds = new Set(village.strategies.map((s) => s.id));
  const completed = masteredStrategies.filter((id) => villageStrategyIds.has(id)).length;
  return completed >= 3;
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
