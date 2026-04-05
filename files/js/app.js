// ═══════════════════════════════════════════════
// app.js — Main App Controller
// ═══════════════════════════════════════════════

// ─── Initialize app after login ───
async function loadApp() {
  // Hide auth, show app
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');

  // Load user profile
  currentProfile = await fetchProfile(currentUser.id);
  updateUserUI();

  // Default to dashboard
  showPage('dashboard');
}

// ─── Page Navigation ───
function showPage(pageName) {
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageName);
  });

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });

  // Show target page
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
    targetPage.classList.add('active');
  }

  // Load data for page
  switch (pageName) {
    case 'dashboard':
      loadMatches();
      break;
    case 'leaderboard':
      loadLeaderboard();
      break;
    case 'profile':
      loadProfileData();
      break;
  }
}

// ─── Toast Notification ───
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');

  toast.className = `toast ${type}`;
  msgEl.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// ─── Keyboard Shortcut: Escape closes modal ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('prediction-modal');
    if (!modal.classList.contains('hidden')) {
      closePredictionModal();
    }
  }
});

// ─── Boot the app ───
document.addEventListener('DOMContentLoaded', initAuth);