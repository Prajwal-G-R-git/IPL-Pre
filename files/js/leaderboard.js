// ═══════════════════════════════════════════════
// leaderboard.js — Leaderboard + Profile
// ═══════════════════════════════════════════════

async function loadLeaderboard() {
  const listEl = document.getElementById('leaderboard-list');
  listEl.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Loading rankings...</p></div>';

  try {
    const { data: users, error } = await supabaseClient
      .from('users')
      .select('id, username, total_points, streak, risk_title')
      .order('total_points', { ascending: false })
      .limit(50);

    if (error) throw error;

    let playerList = users || [];

    // Always make sure the current user appears, even with 0 points
    const alreadyInList = playerList.some(u => u.id === currentUser.id);
    if (!alreadyInList && currentProfile) {
      playerList.push({
        id: currentUser.id,
        username: currentProfile.username,
        total_points: currentProfile.total_points || 0,
        streak: currentProfile.streak || 0,
        risk_title: currentProfile.risk_title || 'Rookie'
      });
      // Re-sort after adding current user
      playerList.sort((a, b) => b.total_points - a.total_points);
    }

    if (!playerList.length) {
      listEl.innerHTML = '<div class="empty-state">No players yet. Be the first to predict! 🏏</div>';
      return;
    }

    listEl.innerHTML = '';

    playerList.forEach((user, index) => {
      const rank = index + 1;
      const isMe = user.id === currentUser.id;
      const row = document.createElement('div');
      row.className = 'leaderboard-row rank-' + (rank <= 3 ? rank : 'other');

      if (isMe) {
        row.style.borderLeft = '3px solid var(--accent)';
        row.style.background = 'rgba(249,115,22,0.04)';
      }

      const rankDisplay = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;

      row.innerHTML =
        '<span class="lb-rank">' + rankDisplay + '</span>' +
        '<div>' +
          '<div class="lb-name">' + escapeHtml(user.username) + '</div>' +
          (isMe ? '<div style="font-size:10px;color:var(--accent);font-family:var(--font-cond);letter-spacing:2px;text-transform:uppercase;">YOU</div>' : '') +
        '</div>' +
        '<span><span class="lb-title-badge">' + escapeHtml(user.risk_title || 'Rookie') + '</span></span>' +
        '<span class="lb-streak">' + (user.streak > 0 ? '🔥 ' + user.streak : '—') + '</span>' +
        '<span class="lb-points">' + (user.total_points || 0) + '</span>';

      listEl.appendChild(row);
    });

  } catch (err) {
    // Even on error, show current user's own row as fallback
    listEl.innerHTML =
      '<div class="empty-state" style="margin-bottom:12px">⚠️ Could not load full leaderboard.<br><small>' + err.message + '</small></div>';

    if (currentProfile) {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      row.style.borderLeft = '3px solid var(--accent)';
      row.style.background = 'rgba(249,115,22,0.04)';
      row.innerHTML =
        '<span class="lb-rank">—</span>' +
        '<div><div class="lb-name">' + escapeHtml(currentProfile.username) + '</div>' +
          '<div style="font-size:10px;color:var(--accent);font-family:var(--font-cond);letter-spacing:2px;">YOU</div>' +
        '</div>' +
        '<span><span class="lb-title-badge">' + escapeHtml(currentProfile.risk_title || 'Rookie') + '</span></span>' +
        '<span class="lb-streak">—</span>' +
        '<span class="lb-points">' + (currentProfile.total_points || 0) + '</span>';
      listEl.appendChild(row);
    }
  }
}

// ─── Load profile page data ───
async function loadProfileData() {
  if (!currentUser || !currentProfile) return;

  document.getElementById('profile-username').textContent = currentProfile.username;
  document.getElementById('profile-title-badge').textContent = currentProfile.risk_title || 'Rookie';
  document.getElementById('profile-points').textContent = currentProfile.total_points || 0;
  document.getElementById('profile-streak').textContent = (currentProfile.streak || 0) + ' 🔥';

  // Fetch predictions with match info
  const { data: preds, error } = await supabaseClient
    .from('predictions')
    .select('*, matches(team1, team2, match_time)')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const historyEl = document.getElementById('prediction-history');

  if (error || !preds) {
    historyEl.innerHTML = '<div class="empty-state">Could not load predictions.</div>';
    return;
  }

  document.getElementById('profile-pred-count').textContent = preds.length;

  if (!preds.length) {
    historyEl.innerHTML = '<div class="empty-state">No predictions yet. Head to the dashboard! 🏏</div>';
    return;
  }

  historyEl.innerHTML = '';
  preds.forEach(pred => {
    const item = document.createElement('div');
    item.className = 'pred-history-item';
    const matchLabel = pred.matches
      ? pred.matches.team1 + ' vs ' + pred.matches.team2
      : pred.match_id;

    item.innerHTML =
      '<div>' +
        '<div class="pred-match-name">' + escapeHtml(matchLabel) + '</div>' +
        '<div class="pred-winner-pick">Winner pick: <strong>' + escapeHtml(pred.predicted_winner || '—') + '</strong></div>' +
      '</div>' +
      (pred.risky_prediction
        ? '<span class="pred-risky-tag">🔥 ' + escapeHtml(pred.risky_prediction) + '</span>'
        : '');

    historyEl.appendChild(item);
  });
}

// ─── HTML escape helper ───
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}