// ============================================================
// AUTH & LOGIN
// ============================================================
function showLoginScreen() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-error').textContent = '';
  setTimeout(() => document.getElementById('login-email').focus(), 120);
}

function hideLoginScreen() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').style.display = '';
}

function showLoginError(msg) {
  document.getElementById('login-error').textContent = msg;
  const inp = document.getElementById('login-password');
  inp.classList.add('shake');
  setTimeout(() => inp.classList.remove('shake'), 400);
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!email || !password) { showLoginError('Email and password required.'); return; }
  const btn = document.getElementById('login-submit-btn');
  btn.textContent = 'Signing in...'; btn.disabled = true;
  try {
    if (!window._fbAuth || !window._signInWithEmailAndPassword) throw new Error('Firebase Auth not available');
    await window._signInWithEmailAndPassword(window._fbAuth, email, password);
    if (typeof window.logActivity === 'function') window.logActivity('User Logged In', email);
  } catch (e) {
    showLoginError(e.message.replace('Firebase: ', ''));
    btn.textContent = 'Sign In'; btn.disabled = false;
  }
}

function openLogoutModal() { playSound('pop'); document.getElementById('logout-modal').classList.add('show'); }
function closeLogoutModal() { document.getElementById('logout-modal').classList.remove('show'); }
async function confirmLogout() {
  if (!window._fbAuth || !window._signOut) return;
  try {
    if (typeof window.logActivity === 'function') window.logActivity('User Logged Out');
    await window._signOut(window._fbAuth);
    location.reload();
  } catch (e) { showToast('Logout failed. You can\'t escape the grind that easily! 🤨', 'error'); }
}
