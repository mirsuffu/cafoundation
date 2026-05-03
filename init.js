// ============================================================
// INITIALIZATION
// ============================================================
function renderAll() {
  updateTopBar();
  renderPlanner();
  renderSchedule();
  renderSubjectsInternal();
  renderTestTable();
  renderMetrics();
  renderSettings();
}

function hideLoader() {
  const loader = document.getElementById('startup-loader');
  if (loader) loader.classList.add('hidden');
}

async function init() {
  initConnStatus();

  if (window._fbAuth && window._onAuthStateChanged) {
    window._onAuthStateChanged(window._fbAuth, async user => {
      currentUser = user;
      if (user) {
        const emailEl = document.getElementById('settings-user-email');
        if (emailEl) emailEl.textContent = user.email;
        hideLoginScreen();
        await loadData();
        if (typeof window.logActivity === 'function' && !sessionStorage.getItem('appOpened')) {
          window.logActivity('App Opened', user.email);
          sessionStorage.setItem('appOpened', 'true');
        }
        applyTheme(data.settings.theme);
        updateTopBar();
        renderAll();
        checkAndShowWelcome();
        checkWeeklyBackupNudge();
        checkVaultStatus();
        if (checkAppFreeze()) {
          activateFreeze();
        } else {
          markActivity();
        }
        if (data.settings.alwaysFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        }
        hideLoader();
        setInterval(updateTopBar, 60000);
      } else {
        // Load defaults for theme before showing login
        try {
          const raw = localStorage.getItem('jgsuffu_data');
          data = raw ? JSON.parse(raw) : defaultData();
          normalizeData();
        } catch (e) { data = defaultData(); }
        applyTheme(data.settings.theme);
        showLoginScreen();
        hideLoader();
      }
    });
  } else {
    // Fallback if Firebase not ready or local-only mode
    await loadData();
    if (typeof window.logActivity === 'function' && !sessionStorage.getItem('appOpened')) {
      window.logActivity('App Opened', 'Local Mode');
      sessionStorage.setItem('appOpened', 'true');
    }
    renderAll();
    checkAndShowWelcome();
    hideLoader();
  }
}

// Start the app with retry to wait for Firebase module
function startApp() {
  if (window._fbAuth) {
    init();
  } else {
    setTimeout(startApp, 50);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  if (typeof preloadSounds === 'function') preloadSounds();
  startApp();
});
