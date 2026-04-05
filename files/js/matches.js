// ═══════════════════════════════════════════════
// matches.js — FIXED VERSION (Stable + Reliable)
// ═══════════════════════════════════════════════

let allMatches = [];
let userPredictions = {};

// ─── Load all matches ───
async function loadMatches() {
  const container = document.getElementById('matches-container');

  container.innerHTML = `
    <div class="loading-state">
      <div class="loader"></div>
      <p>Loading matches...</p>
    </div>
  `;

  try {
    await seedTodaysMatches();

    // ✅ Fetch matches
    const { data: matches, error } = await supabaseClient
      .from('matches')
      .select('*')
      .order('match_time', { ascending: true });

    if (error) throw error;

    allMatches = matches || [];
    console.log("✅ Matches:", allMatches);

    // ✅ Fetch predictions ONLY if user exists
    userPredictions = {};
    if (currentUser) {
      const { data: preds } = await supabaseClient
        .from('predictions')
        .select('*')
        .eq('user_id', currentUser.id);

      (preds || []).forEach(p => {
        userPredictions[p.match_id] = p;
      });
    }

    renderMatchCards();

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="empty-state">
        Failed to load matches ❌<br>
        <small>${err.message}</small>
      </div>
    `;
  }
}

// ─── Render match cards ───
function renderMatchCards() {
  const container = document.getElementById('matches-container');

  if (!allMatches.length) {
    container.innerHTML = `
      <div class="empty-state">
        No matches found 🏏
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  allMatches.forEach(match => {
    container.appendChild(buildMatchCard(match));
  });
}

// ─── Build match card ───
function buildMatchCard(match) {
  const card = document.createElement('div');
  card.className = 'match-card';

  const now = new Date();
  const matchTime = new Date(match.match_time);

  const isStarted = now >= matchTime;
  const isCompleted = !!match.result;
  const predicted = !!userPredictions[match.match_id];

  let statusBadge = '';
  let predictBtn = '';

  if (isCompleted) {
    statusBadge = `<span class="match-badge badge-completed">Completed</span>`;
    predictBtn = `<span class="btn-predict done">Finished</span>`;
    card.classList.add('disabled');

  } else if (isStarted) {
    statusBadge = `<span class="match-badge badge-live">🔴 Live</span>`;
    predictBtn = `<span class="btn-predict done">Locked 🔒</span>`;
    card.classList.add('disabled');

  } else if (predicted) {
    statusBadge = `<span class="match-badge badge-predicted">✅ Predicted</span>`;
    predictBtn = `<button class="btn-predict done" onclick="openPredictionModal('${match.match_id}')">Edit ✏️</button>`;
    card.classList.add('predicted');

  } else {
    statusBadge = `<span class="match-badge badge-upcoming">Upcoming</span>`;
    predictBtn = `<button class="btn-predict" onclick="openPredictionModal('${match.match_id}')">Predict →</button>`;
  }

  const timeStr = matchTime.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const countdown = getCountdown(matchTime);

  card.innerHTML = `
    <div class="match-status">
      ${statusBadge}
      <span class="match-time">${timeStr} IST</span>
    </div>

    <div class="match-teams">
      <span class="team-name">${match.team1}</span>
      <span class="vs-divider">VS</span>
      <span class="team-name">${match.team2}</span>
    </div>

    <div class="match-footer">
      <div>
        <div class="match-venue">🏟️ ${match.venue || 'TBD'}</div>
        ${countdown ? `<div class="match-time" style="color:var(--accent)">⏱ ${countdown}</div>` : ''}
      </div>
      ${predictBtn}
    </div>
  `;

  return card;
}

// ─── Countdown ───
function getCountdown(matchTime) {
  const diff = matchTime - new Date();
  if (diff <= 0) return null;

  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);

  return `${h}h ${m}m left`;
}

// ─── FIXED SEED FUNCTION (ALWAYS FUTURE TIME) ───
async function seedTodaysMatches() {

  const matchTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // +2 hours

  const match = {
    match_id: 'IPL_RCB_CSK_TEST',
    team1: 'RCB',
    team2: 'CSK',
    match_time: matchTime,
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    result: null
  };

  await supabaseClient
    .from('matches')
    .upsert([match], { onConflict: 'match_id' });
}