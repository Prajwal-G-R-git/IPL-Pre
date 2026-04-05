// ═══════════════════════════════════════════════
// predictions.js — Prediction Modal & Submission
// ═══════════════════════════════════════════════

let currentMatchId = null;
let selectedWinner = null;
let selectedToss = null;
let selectedRuns = null;
let selectedRisky = null;

// ─── Open modal for a match ───
function openPredictionModal(matchId) {
  const match = allMatches.find(m => m.match_id === matchId);
  if (!match) return;

  currentMatchId = matchId;
  selectedWinner = null;
  selectedToss = null;
  selectedRuns = null;
  selectedRisky = null;

  // Set title
  document.getElementById('modal-match-title').textContent = `${match.team1} vs ${match.team2}`;
  const matchTime = new Date(match.match_time).toLocaleString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  });
  document.getElementById('modal-match-time').textContent = `🕐 ${matchTime} IST • ${match.venue || ''}`;

  // Build winner buttons
  buildTeamButtons('winner-buttons', [match.team1, match.team2], (val) => {
    selectedWinner = val;
  });

  // Build toss buttons
  buildTeamButtons('toss-buttons', [match.team1, match.team2], (val) => {
    selectedToss = val;
  });

  // Reset runs buttons
  document.querySelectorAll('.runs-btn').forEach(b => b.classList.remove('selected'));

  // Reset inputs
  document.getElementById('top-batsman').value = '';
  document.getElementById('total-sixes').value = '';
  document.getElementById('modal-error').textContent = '';
  document.getElementById('ai-suggestion-box').classList.add('hidden');
  document.getElementById('ai-suggestion-box').textContent = '';

  // Build risky options
  buildRiskyOptions(match);

  // Pre-fill if already predicted
  const existing = userPredictions[matchId];
  if (existing) prefillForm(existing);

  // Show modal
  document.getElementById('prediction-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// ─── Close modal ───
function closePredictionModal() {
  document.getElementById('prediction-modal').classList.add('hidden');
  document.body.style.overflow = '';
  currentMatchId = null;
}

// Close on overlay click
document.getElementById('prediction-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('prediction-modal')) {
    closePredictionModal();
  }
});

// ─── Build team choice buttons ───
function buildTeamButtons(containerId, teams, onSelect) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  teams.forEach(team => {
    const btn = document.createElement('button');
    btn.className = 'team-btn';
    btn.textContent = team;
    btn.dataset.value = team;
    btn.onclick = () => {
      container.querySelectorAll('.team-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect(team);
    };
    container.appendChild(btn);
  });
}

// ─── Build risky prediction buttons ───
function buildRiskyOptions(match) {
  const renderGroup = (containerId, options) => {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'risky-btn';
      btn.textContent = opt;
      btn.dataset.value = opt;
      btn.onclick = () => {
        // Deselect ALL risky buttons across all groups
        document.querySelectorAll('.risky-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedRisky = opt;

        // Show the earned title
        const title = RISK_TITLES[opt] || 'Risk Taker 🔥';
        showToast(`🔥 Risky pick! You'll earn: "${title}" if correct!`, 'risky');
      };
      el.appendChild(btn);
    });
  };

  renderGroup('risky-match', RISKY_PREDICTIONS.match);
  renderGroup('risky-player', RISKY_PREDICTIONS.player);
  renderGroup('risky-event', RISKY_PREDICTIONS.event);
}

// ─── Handle runs selection ───
function selectRuns(btn) {
  document.querySelectorAll('.runs-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRuns = btn.dataset.value;
}

// ─── Pre-fill form if editing ───
function prefillForm(pred) {
  // Winner
  if (pred.predicted_winner) {
    const winnerBtns = document.querySelectorAll('#winner-buttons .team-btn');
    winnerBtns.forEach(b => {
      if (b.dataset.value === pred.predicted_winner) {
        b.classList.add('selected');
        selectedWinner = pred.predicted_winner;
      }
    });
  }
  // Toss
  if (pred.predicted_toss) {
    const tossBtns = document.querySelectorAll('#toss-buttons .team-btn');
    tossBtns.forEach(b => {
      if (b.dataset.value === pred.predicted_toss) {
        b.classList.add('selected');
        selectedToss = pred.predicted_toss;
      }
    });
  }
  // Top batsman
  if (pred.predicted_top_batsman) {
    document.getElementById('top-batsman').value = pred.predicted_top_batsman;
  }
  // Runs
  if (pred.predicted_total_runs_range) {
    document.querySelectorAll('.runs-btn').forEach(b => {
      if (b.dataset.value === pred.predicted_total_runs_range) {
        b.classList.add('selected');
        selectedRuns = pred.predicted_total_runs_range;
      }
    });
  }
  // Sixes
  if (pred.predicted_total_sixes) {
    document.getElementById('total-sixes').value = pred.predicted_total_sixes;
  }
  // Risky
  if (pred.risky_prediction) {
    document.querySelectorAll('.risky-btn').forEach(b => {
      if (b.dataset.value === pred.risky_prediction) {
        b.classList.add('selected');
        selectedRisky = pred.risky_prediction;
      }
    });
  }
}

// ─── Submit prediction ───
async function submitPrediction() {
  const errorEl = document.getElementById('modal-error');
  errorEl.textContent = '';

  // Validation
  if (!selectedWinner) { errorEl.textContent = 'Please select a match winner.'; return; }
  if (!selectedToss)   { errorEl.textContent = 'Please select a toss winner.'; return; }
  if (!selectedRuns)   { errorEl.textContent = 'Please select a total runs range.'; return; }

  const topBatsman = document.getElementById('top-batsman').value.trim();
  const totalSixes = parseInt(document.getElementById('total-sixes').value) || 0;

  // Determine if this is an update or insert
  const existing = userPredictions[currentMatchId];

  const payload = {
    user_id: currentUser.id,
    match_id: currentMatchId,
    predicted_winner: selectedWinner,
    predicted_toss: selectedToss,
    predicted_top_batsman: topBatsman,
    predicted_total_runs_range: selectedRuns,
    predicted_total_sixes: totalSixes,
    risky_prediction: selectedRisky || null,
  };

  try {
    let dbError;

    if (existing) {
      // Update
      const { error } = await supabaseClient
        .from('predictions')
        .update(payload)
        .eq('id', existing.id);
      dbError = error;
    } else {
      // Insert
      const { error } = await supabaseClient
        .from('predictions')
        .insert({ ...payload, created_at: new Date().toISOString() });
      dbError = error;
    }

    if (dbError) throw dbError;

    // Update risk_title if risky prediction made
    if (selectedRisky) {
      const newTitle = RISK_TITLES[selectedRisky] || 'Risk Taker 🔥';
      await supabaseClient
        .from('users')
        .update({ risk_title: newTitle })
        .eq('id', currentUser.id);

      currentProfile.risk_title = newTitle;
      updateUserUI();
    }

    // Cache the prediction locally
    userPredictions[currentMatchId] = { ...payload, id: existing?.id || 'temp' };

    closePredictionModal();
    renderMatchCards();

    showToast(
      selectedRisky
        ? `🔥 Prediction locked! Risky pick: "${selectedRisky}" — bold move!`
        : '✅ Prediction submitted! Good luck!',
      selectedRisky ? 'risky' : 'success'
    );

    // Refresh profile prediction count
    loadProfileData();

  } catch (err) {
    errorEl.textContent = err.message || 'Failed to save prediction.';
  }
}
