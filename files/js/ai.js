// ═══════════════════════════════════════════════
// ai.js — Groq API Integration
// ═══════════════════════════════════════════════

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192'; // Fast & free tier

// ─── Get AI Prediction Suggestion ───
async function getAISuggestion() {
  const match = allMatches.find(m => m.match_id === currentMatchId);
  if (!match) return;

  const box = document.getElementById('ai-suggestion-box');
  const btn = document.querySelector('.btn-ai');

  btn.disabled = true;
  btn.innerHTML = `<span class="ai-icon">⏳</span> Analyzing...`;
  box.classList.remove('hidden');
  box.innerHTML = '🤖 Consulting the oracle...';

  const prompt = `You are a witty cricket expert. Give a SHORT (3-4 lines max) pre-match insight for the IPL match: ${match.team1} vs ${match.team2} at ${match.venue || 'TBD'}.

Include:
1. One pitch/conditions comment
2. One team form observation
3. A cheeky prediction (e.g. "Likely high-scoring", "Spin might dominate")

Keep it punchy, fun, and cricket-specific. No bullet points, just flowing text.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'No suggestion available.';

    box.innerHTML = `<strong>🤖 Oracle says:</strong><br>${text}`;

  } catch (err) {
    console.error('AI suggestion error:', err);
    // Fallback to witty static messages if API fails
    const fallbacks = [
      `🏏 ${match.team1} have been on fire lately, but ${match.team2}'s bowling lineup is no joke. Expect a close one — pitch conditions favor pacers in the evening dew. Classic IPL drama incoming!`,
      `⚡ If ${match.team1}'s top order fires early, game over. ${match.team2} needs their spinners to step up in the middle overs. 180+ seems very likely at this venue!`,
      `🎯 Both teams are evenly matched on paper, but IPL is all about momentum. Watch the powerplay — whoever dominates the first 6 overs usually wins. 200+ not out of the question!`,
    ];
    box.innerHTML = `<strong>🤖 Oracle says:</strong><br>${fallbacks[Math.floor(Math.random() * fallbacks.length)]}`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span class="ai-icon">🤖</span> Get AI Prediction`;
  }
}

// ─── Generate AI Roast after match result ───
// Call this after a match completes. Pass the user's prediction and actual result.
async function generateRoast(predictionObj, actualResult, matchName) {
  if (!actualResult || !predictionObj) return null;

  const prompt = `You are a hilarious cricket commentator. Roast this IPL predictor based on their vs actual predictions. Be savage but fun (max 2 sentences).

Match: ${matchName}
Their prediction: Winner=${predictionObj.predicted_winner}, Runs=${predictionObj.predicted_total_runs_range}, Risky=${predictionObj.risky_prediction || 'None'}
What actually happened: ${JSON.stringify(actualResult)}

If they were right, congratulate with dramatic flair. If wrong, roast them mercilessly (but no personal attacks). Keep it cricket-themed and funny.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.95
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    // Fallback roasts
    const roasts = [
      `You predicted ${predictionObj.predicted_total_runs_range}. Even the groundskeeper laughed. Maybe stick to watching, not predicting! 🏏`,
      `Your risky prediction aged like milk in Chennai heat. Bold choice, wrong outcome. The oracle is disappointed. 🔮`,
      `If predictions were fielding, yours would've dropped every catch today. But hey, tomorrow's another match! 😂`,
    ];
    return roasts[Math.floor(Math.random() * roasts.length)];
  }
}