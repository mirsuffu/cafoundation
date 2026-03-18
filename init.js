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

async function init() {
  initConnStatus();
  setupRightClickDisable();
  setupEvents();

  if (window._fbAuth && window._onAuthStateChanged) {
    window._onAuthStateChanged(window._fbAuth, async user => {
      currentUser = user;
      if (user) {
        const emailEl = document.getElementById('settings-user-email');
        if (emailEl) emailEl.textContent = user.email;
        hideLoginScreen();
        await loadData();
        applyTheme(data.settings.theme);
        updateTopBar();
        renderAll();
        checkAndShowWelcome();
        checkWeeklyBackupNudge();
        if (data.settings.alwaysFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        }
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
      }
    });
  } else {
    // Fallback if Firebase not ready or local-only mode
    await loadData();
    renderAll();
    checkAndShowWelcome();
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
