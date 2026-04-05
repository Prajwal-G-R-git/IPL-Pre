// ═══════════════════════════════════════════════
// config.js — API Keys & Supabase Initialization
// ═══════════════════════════════════════════════

// ⚠️  REPLACE THESE WITH YOUR ACTUAL KEYS
const SUPABASE_URL = 'https://fhqayuldamhpzxfcyzqt.supabase.co';          // e.g. https://xyzabc.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocWF5dWxkYW1ocHp4ZmN5enF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzI0MjUsImV4cCI6MjA5MDk0ODQyNX0.0vRR0f2uK3zfDneFQ_fs6VUQuoGCNvyrADdJKB6Bu7M'; // Public anon key from dashboard


// Initialize Supabase client
// CDN exposes a global called `supabase` (lowercase), not `window.supabase`
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Risk Titles (assigned by risky prediction type) ───
const RISK_TITLES = {
  'Team wins by 50+ runs': 'Danger Analyst ⚡',
  'Team wins by 8+ wickets': 'Risk King 👑',
  'Match goes to super over': 'Jack Gambler 🎲',
  'Team scores 220+ runs': 'High Roller 💰',
  'Powerplay score exceeds 70': 'YOLO Predictor 🔥',
  'Century scored (100 runs)': 'Century Chaser 💯',
  'Bowler takes 4+ wickets': 'Wicket Prophet 🎳',
  'Player hits 5+ sixes': 'Six Seer 🔮',
  'Fastest 50 under 20 balls': 'Speed Freak ⚡',
  'Hat-trick occurs': 'Hat-Trick Oracle 🎩',
  'Direct hit run-out': 'Drama Seeker 🎭',
  'No-ball in final over': 'Chaos Agent 🌪️',
};

// ─── IPL Teams (2025 Season) ───
const IPL_TEAMS = [
  'CSK', 'MI', 'RCB', 'KKR', 'SRH', 'DC', 'PBKS', 'RR', 'LSG', 'GT'
];

// ─── Risky Prediction Categories ───
const RISKY_PREDICTIONS = {
  match: [
    'Team wins by 50+ runs',
    'Team wins by 8+ wickets',
    'Match goes to super over',
    'Team scores 220+ runs',
    'Powerplay score exceeds 70',
  ],
  player: [
    'Century scored (100 runs)',
    'Bowler takes 4+ wickets',
    'Player hits 5+ sixes',
    'Fastest 50 under 20 balls',
  ],
  event: [
    'Hat-trick occurs',
    'Direct hit run-out',
    'No-ball in final over',
  ]
};

// ─── Points Scoring System ───
const POINTS = {
  winner: 10,
  toss: 5,
  topBatsman: 15,
  runsRange: 10,
  sixes: 8,        // per sixes exact match
  risky: 25,       // if risky pred correct
};
