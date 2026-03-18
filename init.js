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
        hideLoginScreen();
        await loadData();
        renderAll();
        checkAndShowWelcome();
        checkWeeklyBackupNudge();
        if (data.settings.alwaysFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        }
      } else {
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
