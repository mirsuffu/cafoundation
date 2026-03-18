// ============================================================
// SETTINGS & CLEAR DATA
// ============================================================
function renderSettings() {
  document.getElementById('setting-user-name').value = data.settings.userName || '';
  document.getElementById('setting-exam-date').value = data.settings.examDate || '';
  document.getElementById('setting-start-date').value = data.settings.plannerStartDate || '';
  document.getElementById('settings-user-email').textContent = currentUser ? currentUser.email : 'Not signed in';
  
  const fsText = document.getElementById('fullscreen-toggle-text');
  const fsTrack = document.getElementById('fullscreen-track');
  if (fsText) fsText.textContent = data.settings.alwaysFullscreen ? 'On' : 'Off';
  if (fsTrack) fsTrack.classList.toggle('on', !!data.settings.alwaysFullscreen);

  applyTheme(data.settings.theme);
  setEditorMode(editorUnlocked, { showFeedback: false, reRenders: false });
}

function saveSettings() {
  const ed = document.getElementById('setting-exam-date').value;
  const sd = document.getElementById('setting-start-date').value;
  if (!ed || !sd) { showToast('Both dates please — can\'t build a planner from thin air 📅', 'error'); return; }
  if (sd >= ed) { showToast('Bro, you can\'t study after the exam 💀 Fix those dates.', 'error'); return; }
  data.settings.examDate = ed;
  data.settings.plannerStartDate = sd;
  saveData(); renderAll();
  showToast('Done! Settings locked in. Suffu is satisfied 🔧', 'success');
}

function openClearModal() {
  showClearStep(1);
  document.getElementById('scope-user').checked = true;
  document.getElementById('clear-confirm-text').value = '';
  document.getElementById('clear-step2-error').textContent = '';
  document.getElementById('clear-editor-pw').value = '';
  document.getElementById('clear-step3b-error').textContent = '';
  playSound('pop');
  document.getElementById('clear-modal').classList.add('show');
}
function closeClearModal() { document.getElementById('clear-modal').classList.remove('show'); }

function showClearStep(n) {
  // Map steps to div IDs
  const stepMap = {
    1: 'clear-step-1',
    2: 'clear-step-2',
    3: 'clear-step-3a',
    4: 'clear-step-3b',
    5: 'clear-step-4' // Not in HTML? Let me check
  };
  document.getElementById('clear-step-1').style.display = n === 1 ? 'block' : 'none';
  document.getElementById('clear-step-2').style.display = n === 2 ? 'block' : 'none';
  document.getElementById('clear-step-3a').style.display = n === 3 ? 'block' : 'none';
  document.getElementById('clear-step-3b').style.display = n === 4 ? 'block' : 'none';
}

function advanceClearStep2() {
  const scope = document.querySelector('input[name="clear-scope"]:checked').value;
  if (scope === 'user') {
    document.getElementById('clear-step2-sub').innerHTML = 'Type <strong>DELETE</strong> below to confirm you want to erase your <strong>user data</strong> (progress & chapter ratings).';
  } else {
    document.getElementById('clear-step2-sub').innerHTML = 'Type <strong>DELETE</strong> below to confirm you want to erase <strong>EVERYTHING</strong> (including chapters and settings).';
  }
  showClearStep(2);
}
function advanceClearStep3b() {
  const pw = document.getElementById('clear-editor-pw').value;
  if (pw === EDITOR_PASSWORD) { doClearAllData(); }
  else {
    document.getElementById('clear-step3b-error').textContent = 'Wrong password. Only Suffu knows the way 🤫';
    const inp = document.getElementById('clear-editor-pw');
    inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400);
  }
}

function doClearUserData() {
  const name = data.settings.userName, theme = data.settings.theme, exam = data.settings.examDate, start = data.settings.plannerStartDate;
  data = defaultData();
  data.settings.userName = name; data.settings.theme = theme; data.settings.examDate = exam; data.settings.plannerStartDate = start;
  saveData(); renderAll(); closeClearModal();
  showToast('Poof! User data gone. Fresh slate 🧹', 'info');
}

function doClearAllData() {
  data = defaultData(); saveData(); renderAll(); closeClearModal();
  showToast('Everything wiped. Time to rebuild, king 👑', 'info');
}
