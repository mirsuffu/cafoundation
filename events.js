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
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('scroll-today-btn').addEventListener('click', scrollToToday);

  document.getElementById('save-name-btn').addEventListener('click', () => {
    const n = document.getElementById('setting-user-name').value.trim();
    if (n) { data.settings.userName = n; saveData(); updateTopBar(); showToast('Name saved! Welcome to the grind, ' + n + ' ✨', 'success'); }
    else showToast('Suffu needs to know what to call you! 🤨', 'error');
  });

  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-input').addEventListener('change', handleImportFile);
  document.getElementById('import-cancel-btn').addEventListener('click', () => { pendingImportFile = null; document.getElementById('import-modal').classList.remove('show'); });
  document.getElementById('import-confirm-btn').addEventListener('click', confirmImport);

  document.getElementById('clear-data-btn').addEventListener('click', openClearModal);
  setupClearDataEvents();

  document.getElementById('add-test-btn').addEventListener('click', openTestModal);
  document.getElementById('tf-cancel-btn').addEventListener('click', closeTestModal);
  document.getElementById('tf-save-btn').addEventListener('click', saveTestRecord);
  document.querySelectorAll('#tf-confidence-stars .star-pick').forEach(s => s.addEventListener('click', () => updateTestStars(parseInt(s.dataset.val))));

  document.getElementById('te-cancel-btn').addEventListener('click', closeTestEditModal);
  document.getElementById('te-save-btn').addEventListener('click', saveTestEdit);
  document.querySelectorAll('#te-confidence-stars .star-pick').forEach(s => s.addEventListener('click', () => updateTestEditStars(parseInt(s.dataset.val))));

  document.getElementById('test-filter-subj').addEventListener('change', renderTestTable);
  document.getElementById('test-filter-type').addEventListener('change', renderTestTable);

  document.getElementById('logout-btn').addEventListener('click', openLogoutModal);
  document.getElementById('logout-cancel-btn').addEventListener('click', closeLogoutModal);
  document.getElementById('logout-confirm-btn').addEventListener('click', confirmLogout);

  document.getElementById('name-save-btn').addEventListener('click', () => {
    const v = document.getElementById('name-input').value.trim();
    if (v) { data.settings.userName = v; saveData(); document.getElementById('name-modal').classList.remove('show'); updateTopBar(); checkAndShowWelcome(); }
    else { const i = document.getElementById('name-input'); i.classList.add('shake'); setTimeout(() => i.classList.remove('shake'), 400); }
  });

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
  document.getElementById('clear-cancel-btn').addEventListener('click', closeClearModal);
  document.getElementById('clear-step1-next').addEventListener('click', advanceClearStep2);
  document.getElementById('clear-step2-next').addEventListener('click', () => {
    if (document.getElementById('clear-confirm-text').value === 'DELETE') { showClearStep(4); }
    else { document.getElementById('clear-step2-error').textContent = 'Please type DELETE exactly.'; }
  });
  document.getElementById('clear-step3-next').addEventListener('click', () => {
    const scope = document.querySelector('input[name="clear-scope"]:checked').value;
    if (scope === 'all') showClearStep(3); else advanceClearStep2();
  });
  document.getElementById('clear-step3b-next').addEventListener('click', advanceClearStep3b);
  document.getElementById('clear-step4-confirm').addEventListener('click', () => {
    const scope = document.querySelector('input[name="clear-scope"]:checked').value;
    if (scope === 'user') doClearUserData(); else doClearAllData();
  });
}

function setupLoginEvents() {
  document.getElementById('login-submit-btn').addEventListener('click', handleLogin);
  document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
}

function setupMobileTabs() {
  document.querySelectorAll('.mobile-tab').forEach(t => t.addEventListener('click', () => switchSection(t.dataset.section)));
  (function () {
    var hbtn = document.getElementById('hamburger-btn'), hmenu = document.getElementById('mobile-topbar-menu');
    if (!hbtn || !hmenu) return;
    hbtn.addEventListener('click', function (e) { e.stopPropagation(); hmenu.classList.toggle('open'); });
    document.addEventListener('click', function (e) { if (!hmenu.contains(e.target) && e.target !== hbtn) hmenu.classList.remove('open'); });
  })();
}
