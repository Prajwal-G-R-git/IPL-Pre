// ═══════════════════════════════════════════════
// admin.js — COMPLETE VERSION ✅
// ═══════════════════════════════════════════════

// 🔹 Submit Match Result
async function submitMatchResult() {

  const matchId = document.getElementById('admin-match-id').value.trim();

  if (!matchId) {
    alert("❌ Enter Match ID");
    return;
  }

  const payload = {
    winner: document.getElementById('admin-winner').value,
    toss_winner: document.getElementById('admin-toss').value,
    top_batsman: document.getElementById('admin-batsman').value,
    total_runs: parseInt(document.getElementById('admin-runs').value) || 0,
    total_sixes: parseInt(document.getElementById('admin-sixes').value) || 0,

    powerplay_runs: parseInt(document.getElementById('admin-powerplay').value) || 0,
    win_margin_runs: parseInt(document.getElementById('admin-win-runs').value) || 0,
    win_margin_wickets: parseInt(document.getElementById('admin-win-wickets').value) || 0,

    is_super_over: document.getElementById('admin-superover').checked,
    century_scored: document.getElementById('admin-century').checked,
    four_wicket_haul: document.getElementById('admin-4w').checked,
    five_sixes_player: document.getElementById('admin-5six').checked,
    fastest_fifty: document.getElementById('admin-fast50').checked,
    hattrick: document.getElementById('admin-hattrick').checked,
    direct_hit_runout: document.getElementById('admin-runout').checked,
    last_over_noball: document.getElementById('admin-noball').checked,

    is_completed: true
  };

  try {
    // ✅ Update match result
    const { error } = await supabaseClient
      .from('matches')
      .update(payload)
      .eq('match_id', matchId);

    if (error) throw error;

    console.log("✅ Match updated");

    // ✅ Calculate points
    await calculatePoints(matchId);

    alert("🏆 Result + Points updated!");

  } catch (err) {
    console.error(err);
    alert("❌ " + err.message);
  }
}


// ═══════════════════════════════════════════════
// 🔥 CALCULATE POINTS
// ═══════════════════════════════════════════════

async function calculatePoints(matchId) {

  console.log("⚡ Calculating points for:", matchId);

  try {

    // ✅ Get match result
    const { data: match, error: matchError } = await supabaseClient
      .from('matches')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (matchError || !match) throw matchError || new Error("Match not found");

    // ✅ Get predictions
    const { data: predictions, error: predError } = await supabaseClient
      .from('predictions')
      .select('*')
      .eq('match_id', matchId);

    if (predError) throw predError;

    if (!predictions || predictions.length === 0) {
      console.warn("⚠️ No predictions found");
      return;
    }

    // 🔁 Loop through predictions
    for (let pred of predictions) {

      let points = 0;

      // ─── BASIC POINTS ───
      if (pred.predicted_winner === match.winner) points += 10;
      if (pred.predicted_toss === match.toss_winner) points += 5;
      if (pred.predicted_top_batsman === match.top_batsman) points += 15;

      // 🎯 Runs Range Logic
      if (pred.predicted_total_runs_range) {
        if (
          (match.total_runs < 150 && pred.predicted_total_runs_range === "Under 150") ||
          (match.total_runs >= 150 && match.total_runs <= 180 && pred.predicted_total_runs_range === "150-180") ||
          (match.total_runs > 180 && match.total_runs <= 200 && pred.predicted_total_runs_range === "180-200") ||
          (match.total_runs > 200 && pred.predicted_total_runs_range === "200+")
        ) {
          points += 10;
        }
      }

      if (pred.predicted_total_sixes === match.total_sixes) points += 8;

      // ─── 🔥 RISKY LOGIC ───
      switch (pred.risky_prediction) {

        case "Team wins by 50+ runs":
          if (match.win_margin_runs >= 50) points += 100;
          break;

        case "Team wins by 8+ wickets":
          if (match.win_margin_wickets >= 8) points += 100;
          break;

        case "Match goes to super over":
          if (match.is_super_over) points += 120;
          break;

        case "Team scores 220+":
          if (match.total_runs >= 220) points += 100;
          break;

        case "Powerplay score exceeds 70":
          if (match.powerplay_runs >= 70) points += 80;
          break;

        case "Century scored":
          if (match.century_scored) points += 120;
          break;

        case "Bowler takes 4+ wickets":
          if (match.four_wicket_haul) points += 100;
          break;

        case "Player hits 5+ sixes":
          if (match.five_sixes_player) points += 90;
          break;

        case "Fastest 50 under 20 balls":
          if (match.fastest_fifty) points += 120;
          break;

        case "Hat-trick occurs":
          if (match.hattrick) points += 150;
          break;

        case "Direct hit run-out":
          if (match.direct_hit_runout) points += 80;
          break;

        case "No-ball in final over":
          if (match.last_over_noball) points += 70;
          break;
      }

      console.log(`👤 ${pred.user_id} → ${points} pts`);

      // ─── UPDATE PREDICTION POINTS ───
      const prevPoints = pred.points_earned || 0;

      await supabaseClient
        .from('predictions')
        .update({ points_earned: points })
        .eq('id', pred.id);

      // ─── UPDATE USER TOTAL ───
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('total_points')
        .eq('id', pred.user_id)
        .single();

      if (userError || !user) {
        console.warn("⚠️ User not found:", pred.user_id);
        continue;
      }

      const newTotal = (user.total_points || 0) - prevPoints + points;

      await supabaseClient
        .from('users')
        .update({ total_points: newTotal })
        .eq('id', pred.user_id);
    }

    console.log("🏆 Points calculation done!");

  } catch (err) {
    console.error("❌ Error calculating points:", err);
    alert("❌ Failed: " + err.message);
  }
}