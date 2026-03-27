// ============================================================
// EVENT LISTENERS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Login
  const loginBtn = document.getElementById('login-submit-btn');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  const loginPass = document.getElementById('login-password');
  if (loginPass) loginPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });

  // Navigation
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => { playSound('click'); switchSection(el.dataset.section); });
  });
  document.querySelectorAll('.mobile-tab[data-section]').forEach(el => {
    el.addEventListener('click', () => { playSound('click'); switchSection(el.dataset.section); });
  });

  const toggleEditorLock = () => {
    if (!editorUnlocked) document.getElementById('editor-modal').classList.add('show');
    else setEditorMode(false);
  };
  document.getElementById('editor-badge').addEventListener('click', () => { playSound('click'); toggleEditorLock(); });
  document.getElementById('topbar-brand-name').addEventListener('click', () => { playSound('click'); showNamePrompt(); });
  document.getElementById('editor-toggle-btn-settings').addEventListener('click', () => { playSound('click'); toggleEditorLock(); });
  document.getElementById('editor-cancel-btn').addEventListener('click', () => { 
    playSound('click');
    document.getElementById('editor-modal').classList.remove('show'); 
    document.getElementById('editor-pw-input').value = ''; 
    document.getElementById('editor-pw-error').textContent = ''; 
  });
  document.getElementById('editor-confirm-btn').addEventListener('click', () => {
    playSound('click');
    const inputField = document.getElementById('editor-pw-input');
    if (inputField && inputField.value === EDITOR_PASSWORD) {
      setEditorMode(true);
      document.getElementById('editor-modal').classList.remove('show');
      inputField.value = ''; document.getElementById('editor-pw-error').textContent = '';
    } else { document.getElementById('editor-pw-error').textContent = 'Incorrect password. Nice try!'; }
  });
  const editorPwInput = document.getElementById('editor-pw-input');
  if (editorPwInput) {
    editorPwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('editor-confirm-btn').click();
    });
  }

  // Theme & Fullscreen from settings
  document.getElementById('theme-toggle-btn-settings').addEventListener('click', () => { playSound('click'); toggleTheme(); });
  document.getElementById('fullscreen-toggle-label').addEventListener('click', (e) => { e.preventDefault(); playSound('click'); toggleAlwaysFullscreen(); });
  document.getElementById('fullscreen-btn-settings').addEventListener('click', () => { playSound('click'); toggleFullscreen(); });

  // Planner
  document.getElementById('scroll-today-btn').addEventListener('click', () => {
    playSound('click'); plannerScrolledToToday = false; switchSection('planner');
  });

  // Tests (Add Test)
  document.getElementById('add-test-btn').addEventListener('click', () => { playSound('click'); openTestModal(null); });
  document.getElementById('test-cancel-btn').addEventListener('click', () => { playSound('click'); closeTestModal(); });
  document.getElementById('test-save-btn').addEventListener('click', () => { playSound('click'); saveTestRecord(); });
  const testInputs = ['tf-total-marks', 'tf-marks-obtained', 'tf-coverage'];
  testInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveTestRecord();
    });
  });
  document.querySelectorAll('#tf-confidence-stars .star-pick').forEach(el => {
    el.addEventListener('click', (e) => { playSound('click'); updateTestStars(parseInt(e.target.dataset.val)); });
  });
  // Tests (Edit Test)
  document.getElementById('test-edit-cancel-btn').addEventListener('click', () => { playSound('click'); closeTestEditModal(); });
  document.getElementById('test-edit-save-btn').addEventListener('click', () => { playSound('click'); saveTestEdit(); });
  const testEditInputs = ['te-total-marks', 'te-marks-obtained', 'te-coverage'];
  testEditInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveTestEdit();
    });
  });
  document.querySelectorAll('#te-confidence-stars .star-pick').forEach(el => {
    el.addEventListener('click', (e) => { playSound('click'); updateTestEditStars(parseInt(e.target.dataset.val)); });
  });
  // Filters
  const testSubjFilter = document.getElementById('test-filter-subj');
  const testTypeFilter = document.getElementById('test-filter-type');
  SUBJECTS.forEach(s => { const opt = document.createElement('option'); opt.value = s; opt.textContent = SUBJECT_LABELS[s]; testSubjFilter.appendChild(opt); });
  testSubjFilter.addEventListener('change', renderTestTable);
  testTypeFilter.addEventListener('change', renderTestTable);

  // NEW: Tests (Schedule Test)
  document.getElementById('schedule-test-btn').addEventListener('click', () => { playSound('click'); openScheduleTestModal(); });
  document.getElementById('schedule-test-cancel-btn').addEventListener('click', () => { playSound('click'); closeScheduleTestModal(); });
  document.getElementById('schedule-test-save-btn').addEventListener('click', () => { playSound('click'); saveScheduledTest(); });
  const schedInputs = ['st-coverage', 'st-date'];
  schedInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveScheduledTest();
    });
  });

  // NEW: Today's Plan Button logic
  document.getElementById('topbar-today-btn').addEventListener('click', () => { playSound('click'); openTodayModal(); });
  document.getElementById('mobile-today-btn').addEventListener('click', () => { playSound('click'); openTodayModal(); });
  document.getElementById('close-today-btn').addEventListener('click', () => { playSound('click'); closeTodayModal(); });

  // Settings specific
  document.getElementById('save-name-btn').addEventListener('click', () => {
    playSound('click');
    const val = document.getElementById('setting-user-name').value.trim();
    if(val) { data.settings.userName = val; saveData(); updateTopbarBrand(); showToast('Name updated successfully!', 'success'); }
  });
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    playSound('click');
    data.settings.examDate = document.getElementById('setting-exam-date').value;
    data.settings.plannerStartDate = document.getElementById('setting-start-date').value;
    saveData(); renderPlanner();
    showToast('Exam configuration saved! Planner regenerated 📅', 'success');
  });

  // Import/Export / Clear
  document.getElementById('export-btn').addEventListener('click', () => { playSound('click'); exportData(); });
  document.getElementById('import-input').addEventListener('change', handleImportFile);
  document.getElementById('import-cancel-btn').addEventListener('click', () => {
    playSound('click');
    document.getElementById('import-modal').classList.remove('show'); 
    document.getElementById('import-input').value = '';
    pendingImportFile = null;
  });
  document.getElementById('import-confirm-btn').addEventListener('click', () => { playSound('click'); confirmImport(); });

  // Multi-step Clear Flow
  document.getElementById('clear-data-btn').addEventListener('click', () => {
    playSound('click');
    document.getElementById('clear-modal').classList.add('show');
    showClearStep('1');
  });
  // step 1
  const clearCancel1 = document.getElementById('clear-cancel-1');
  if (clearCancel1) clearCancel1.addEventListener('click', () => { playSound('click'); hideClearModal(); });
  const clearExport = document.getElementById('clear-export-then-next');
  if (clearExport) clearExport.addEventListener('click', () => { playSound('click'); exportData(); });
  const clearNext1 = document.getElementById('clear-next-1');
  if (clearNext1) clearNext1.addEventListener('click', () => { playSound('click'); showClearStep('2'); });
  // step 2
  document.getElementById('clear-back-2').addEventListener('click', () => { playSound('click'); showClearStep('1'); });
  document.getElementById('clear-next-2').addEventListener('click', () => {
    playSound('click');
    const input = document.getElementById('clear-confirm-text').value.trim().toUpperCase();
    if (input === 'DELETE') {
      const scope = document.querySelector('input[name="clear-scope"]:checked').value;
      if (scope === 'user') showClearStep('3a'); else showClearStep('3b');
    } else {
      const err = document.getElementById('clear-step2-error');
      err.textContent = 'Please type DELETE exactly to proceed.';
      err.parentElement.classList.add('shake'); setTimeout(() => err.parentElement.classList.remove('shake'), 400);
    }
  });
  const clearConfirmInput = document.getElementById('clear-confirm-text');
  if (clearConfirmInput) {
    clearConfirmInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('clear-next-2').click();
    });
  }
  // step 3a
  document.getElementById('clear-cancel-3a').addEventListener('click', () => { playSound('click'); hideClearModal(); });
  document.getElementById('clear-confirm-3a').addEventListener('click', () => { playSound('click'); performClear('user'); hideClearModal(); });
  // step 3b
  document.getElementById('clear-cancel-3b').addEventListener('click', () => { playSound('click'); hideClearModal(); });
  document.getElementById('clear-confirm-3b').addEventListener('click', () => {
    playSound('click');
    const pwField = document.getElementById('clear-editor-pw');
    const pw = pwField ? pwField.value : '';
    if (pw === EDITOR_PASSWORD) { performClear('both'); hideClearModal(); }
    else {
      const err = document.getElementById('clear-step3b-error');
      err.textContent = 'Incorrect Editor password.';
      err.parentElement.classList.add('shake'); setTimeout(() => err.parentElement.classList.remove('shake'), 400);
    }
  });
  const clearEditorPwInput = document.getElementById('clear-editor-pw');
  if (clearEditorPwInput) {
    clearEditorPwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('clear-confirm-3b').click();
    });
  }

  // Name prompt flow
  document.getElementById('name-save-btn').addEventListener('click', () => {
    playSound('click');
    const n = document.getElementById('name-input').value.trim();
    if (n) { data.settings.userName = n; saveData(); updateTopbarBrand(); document.getElementById('name-modal').classList.remove('show'); checkDailyWelcome(); }
  });
  const nameInput = document.getElementById('name-input');
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('name-save-btn').click();
    });
  }

  // Planner track scroll click
  document.getElementById('planner-scroll-track').addEventListener('click', (e) => {
    const wrap = document.getElementById('planner-table-wrap');
    const track = document.getElementById('planner-scroll-track');
    const pct = e.offsetY / track.clientHeight;
    wrap.scrollTop = pct * (wrap.scrollHeight - wrap.clientHeight);
  });

  // Welcome Dive In
  document.getElementById('welcome-dive-btn').addEventListener('click', () => { 
    playSound('click'); 
    closeWelcome(); 
  });

  // Sign Out
  document.getElementById('logout-btn').addEventListener('click', () => { 
    playSound('click'); 
    openLogoutModal(); 
  });
  document.getElementById('logout-cancel-btn').addEventListener('click', () => { 
    playSound('click'); 
    closeLogoutModal(); 
  });
  document.getElementById('logout-confirm-btn').addEventListener('click', () => { 
    playSound('click'); 
    confirmLogout(); 
  });

  // Manual Sync
  document.getElementById('sync-btn').addEventListener('click', async () => {
    playSound('click');
    showToast('Syncing data... 🔄', 'info');
    try {
      await loadData();
      renderAll();
      showToast('Sync complete! Fresh app loaded. ✅', 'success');
    } catch (e) {
      showToast('Sync failed. Please check your connection.', 'error');
    }
  });
});
