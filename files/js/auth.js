// ═══════════════════════════════════════════════
// auth.js — Authentication (Supabase Auth)
// ═══════════════════════════════════════════════

// Current session user cache
let currentUser = null;
let currentProfile = null;

// ─── Show/hide auth forms ───
function showLogin() {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('signup-form').classList.add('hidden');
}

function showSignup() {
  document.getElementById('signup-form').classList.remove('hidden');
  document.getElementById('login-form').classList.add('hidden');
}

// ─── Handle Login ───
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    currentUser = data.user;
    await loadApp();
  } catch (err) {
    errorEl.textContent = err.message || 'Login failed. Please try again.';
  }
}

// ─── Handle Signup ───
async function handleSignup() {
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errorEl = document.getElementById('signup-error');

  errorEl.textContent = '';

  if (!username || !email || !password) {
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters.';
    return;
  }

  try {
    // Create auth user
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;

    currentUser = data.user;

    // Insert profile row in Users table
    const { error: profileError } = await supabaseClient.from('users').insert({
      id: currentUser.id,
      username: username,
      total_points: 0,
      streak: 0,
      risk_title: 'Rookie',
    });

    if (profileError && profileError.code !== '23505') { // ignore duplicate
      throw profileError;
    }

    await loadApp();
  } catch (err) {
    errorEl.textContent = err.message || 'Signup failed. Please try again.';
  }
}

// ─── Handle Logout ───
async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-overlay').style.display = 'flex';
  showLogin();
}

// ─── Fetch current user profile from DB ───
async function fetchProfile(userId) {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // Profile may not exist yet (email confirmation flow), create a minimal one
    console.warn('Profile fetch issue:', error.message);
    return { id: userId, username: 'Player', total_points: 0, streak: 0, risk_title: 'Rookie' };
  }

  return data;
}

// ─── Update navbar & dashboard with user info ───
function updateUserUI() {
  if (!currentProfile) return;
  document.getElementById('nav-username').textContent = currentProfile.username;
  document.getElementById('nav-points').textContent = `${currentProfile.total_points} pts`;
  document.getElementById('dash-points').textContent = currentProfile.total_points;
  document.getElementById('dash-streak').textContent = `🔥 ${currentProfile.streak}`;
  document.getElementById('dash-title').textContent = currentProfile.risk_title || 'Rookie';
}

// ─── Initialize Auth State on Page Load ───
async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    currentUser = data.session.user;
    await loadApp();
  } else {
    // Show auth overlay
    document.getElementById('auth-overlay').style.display = 'flex';
  }
}

// ─── Listen for auth state changes ───
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    currentProfile = null;
  }
});
