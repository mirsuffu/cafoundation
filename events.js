// ============================================================
// EVENTS SETUP
// ============================================================
function setupEvents() {
  document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => switchSection(item.dataset.section)));

  const themeBtn = document.getElementById('theme-toggle-btn-settings');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const fsBtn = document.getElementById('fullscreen-btn-settings');
  if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

  const fsToggleLabel = document.getElementById('fullscreen-toggle-label');
  if (fsToggleLabel) {
    fsToggleLabel.addEventListener('click', () => {
      data.settings.alwaysFullscreen = !data.settings.alwaysFullscreen;
      saveData();
      renderSettings();
      if (data.settings.alwaysFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
      } else if (!data.settings.alwaysFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
      showToast(data.settings.alwaysFullscreen ? 'Fullscreen always on! Suffu is ready 🖥️' : 'Fullscreen off. Focus is key! 🔍', 'info');
    });
  }

  const editorBtn = document.getElementById('editor-toggle-btn-settings');
  if (editorBtn) editorBtn.addEventListener('click', handleEditorToggle);

  document.getElementById('editor-cancel-btn').addEventListener('click', closeEditorModal);
  document.getElementById('editor-confirm-btn').addEventListener('click', confirmEditorPassword);
  document.getElementById('editor-pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') confirmEditorPassword(); if (e.key === 'Escape') closeEditorModal(); });
  document.getElementById('editor-modal').addEventListener('click', e => { if (e.target === document.getElementById('editor-modal')) closeEditorModal(); });
  document.addEventListener('keydown', e => { if (e.ctrlKey && e.shiftKey && e.key === 'E') { e.preventDefault(); handleEditorToggle(); } });
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
  
  const scrollTodayBtn = document.getElementById('scroll-today-btn');
  if (scrollTodayBtn) scrollTodayBtn.addEventListener('click', scrollToToday);

  const saveNameBtn = document.getElementById('save-name-btn');
  if (saveNameBtn) {
    saveNameBtn.addEventListener('click', () => {
      const n = document.getElementById('setting-user-name').value.trim();
      if (n) { data.settings.userName = n; saveData(); updateTopBar(); showToast('Name saved! Welcome to the grind, ' + n + ' ✨', 'success'); }
      else showToast('Suffu needs to know what to call you! 🤨', 'error');
    });
  }

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportData);

  const importInput = document.getElementById('import-input');
  if (importInput) importInput.addEventListener('change', handleImportFile);

  const importCancelBtn = document.getElementById('import-cancel-btn');
  if (importCancelBtn) importCancelBtn.addEventListener('click', () => { pendingImportFile = null; document.getElementById('import-modal').classList.remove('show'); });

  const importConfirmBtn = document.getElementById('import-confirm-btn');
  if (importConfirmBtn) importConfirmBtn.addEventListener('click', confirmImport);

  const clearDataBtn = document.getElementById('clear-data-btn');
  if (clearDataBtn) clearDataBtn.addEventListener('click', openClearModal);
  
  setupClearDataEvents();

  const addTestBtn = document.getElementById('add-test-btn');
  if (addTestBtn) addTestBtn.addEventListener('click', openTestModal);

  const testCancelBtn = document.getElementById('test-cancel-btn');
  if (testCancelBtn) testCancelBtn.addEventListener('click', closeTestModal);

  const testSaveBtn = document.getElementById('test-save-btn');
  if (testSaveBtn) testSaveBtn.addEventListener('click', saveTestRecord);

  document.querySelectorAll('#tf-confidence-stars .star-pick').forEach(s => s.addEventListener('click', () => updateTestStars(parseInt(s.dataset.val))));

  const testEditCancelBtn = document.getElementById('test-edit-cancel-btn');
  if (testEditCancelBtn) testEditCancelBtn.addEventListener('click', closeTestEditModal);

  const testEditSaveBtn = document.getElementById('test-edit-save-btn');
  if (testEditSaveBtn) testEditSaveBtn.addEventListener('click', saveTestEdit);

  document.querySelectorAll('#te-confidence-stars .star-pick').forEach(s => s.addEventListener('click', () => updateTestEditStars(parseInt(s.dataset.val))));

  const testFilterSubj = document.getElementById('test-filter-subj');
  if (testFilterSubj) testFilterSubj.addEventListener('change', renderTestTable);

  const testFilterType = document.getElementById('test-filter-type');
  if (testFilterType) testFilterType.addEventListener('change', renderTestTable);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', openLogoutModal);

  const logoutCancelBtn = document.getElementById('logout-cancel-btn');
  if (logoutCancelBtn) logoutCancelBtn.addEventListener('click', closeLogoutModal);

  const logoutConfirmBtn = document.getElementById('logout-confirm-btn');
  if (logoutConfirmBtn) logoutConfirmBtn.addEventListener('click', confirmLogout);

  const nameSaveBtn = document.getElementById('name-save-btn');
  if (nameSaveBtn) {
    nameSaveBtn.addEventListener('click', () => {
      const v = document.getElementById('name-input').value.trim();
      if (v) { data.settings.userName = v; saveData(); document.getElementById('name-modal').classList.remove('show'); updateTopBar(); checkAndShowWelcome(); }
      else { const i = document.getElementById('name-input'); i.classList.add('shake'); setTimeout(() => i.classList.remove('shake'), 400); }
    });
  }

  const diveBtn = document.getElementById('welcome-dive-btn');
  if (diveBtn) diveBtn.addEventListener('click', closeWelcome);

  setupLoginEvents();
  setupMobileTabs();

  document.addEventListener('click', (e) => {
    const interactiveSelectors = [
      'button', 'a', 'input', 'select', 'textarea',
      '.nav-item', '.mobile-tab', '.pcard-tick', '.star-pick',
      '.pcard-bulk', '.tcard-edit', '.tcard-del', '.chapter-del',
      '.subject-add-btn', '.whatsapp-btn', '.subject-header',
      '.toggle-switch', '.icon-btn', '.btn', '.star'
    ];
    const target = e.target.closest(interactiveSelectors.join(','));
    if (target) { playSound('click'); triggerHaptic(target.classList.contains('pcard-tick') ? 40 : 10); }
  }, true);
}

function setupClearDataEvents() {
  // Step 1
  const cancel1 = document.getElementById('clear-cancel-1');
  if (cancel1) cancel1.addEventListener('click', closeClearModal);
  
  const exportNext = document.getElementById('clear-export-then-next');
  if (exportNext) exportNext.addEventListener('click', () => { exportData(); advanceClearStep2(); });

  const next1 = document.getElementById('clear-next-1');
  if (next1) next1.addEventListener('click', advanceClearStep2);

  // Step 2
  const back2 = document.getElementById('clear-back-2');
  if (back2) back2.addEventListener('click', () => showClearStep(1));

  const next2 = document.getElementById('clear-next-2');
  if (next2) next2.addEventListener('click', () => {
    const confirmInput = document.getElementById('clear-confirm-text');
    if (confirmInput && confirmInput.value.toUpperCase() === 'DELETE') {
      const scopeEl = document.querySelector('input[name="clear-scope"]:checked');
      const scope = scopeEl ? scopeEl.value : 'user';
      if (scope === 'user') showClearStep(3); // 3a
      else showClearStep(4); // 3b
    } else {
      const errorEl = document.getElementById('clear-step2-error');
      if (errorEl) errorEl.textContent = 'Please type DELETE exactly.';
    }
  });

  // Step 3a (User Data)
  const cancel3a = document.getElementById('clear-cancel-3a');
  if (cancel3a) cancel3a.addEventListener('click', closeClearModal);

  const confirm3a = document.getElementById('clear-confirm-3a');
  if (confirm3a) confirm3a.addEventListener('click', doClearUserData);

  // Step 3b (Everything)
  const cancel3b = document.getElementById('clear-cancel-3b');
  if (cancel3b) cancel3b.addEventListener('click', closeClearModal);

  const confirm3b = document.getElementById('clear-confirm-3b');
  if (confirm3b) confirm3b.addEventListener('click', advanceClearStep3b);
}

function setupLoginEvents() {
  const loginBtn = document.getElementById('login-submit-btn');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);

  const loginPw = document.getElementById('login-password');
  if (loginPw) loginPw.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
}

function setupMobileTabs() {
  document.querySelectorAll('.mobile-tab').forEach(t => t.addEventListener('click', () => switchSection(t.dataset.section)));
}
