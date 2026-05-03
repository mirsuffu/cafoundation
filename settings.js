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

  // iOS fullscreen not supported — show notice
  const fsNote = document.getElementById('fullscreen-ios-note');
  if (fsNote) fsNote.style.display = isIOS() ? 'block' : 'none';

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
  const userRadio = document.getElementById('scope-user');
  if (userRadio) userRadio.checked = true;
  document.getElementById('clear-confirm-text').value = '';
  document.getElementById('clear-step2-error').textContent = '';
  document.getElementById('clear-editor-pw').value = '';
  document.getElementById('clear-step3b-error').textContent = '';
  playSound('pop');
  document.getElementById('clear-modal').classList.add('show');
}
function hideClearModal() { document.getElementById('clear-modal').classList.remove('show'); }

function showClearStep(n) {
  const steps = ['1', '2', '3a', '3b'];
  steps.forEach(s => {
    const el = document.getElementById('clear-step-' + s);
    if (el) el.style.display = (s === String(n)) ? 'block' : 'none';
  });
}

function performClear(scope) {
  if (scope === 'user') {
    doClearUserData();
  } else if (scope === 'both') {
    doClearAllData();
  }
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
  // Clear only planner and test records
  data.planner = [];
  data.tests = [];
  // Reset chapter statuses, difficulty, and confidence — but keep the chapters themselves
  data.subjects.forEach(subj => {
    if (subj.chapters) {
      subj.chapters.forEach(ch => {
        ch.status = 'Pending';
        ch.difficulty = 2;
        ch.confidence = 2;
      });
    }
  });
  if (typeof window.logActivity === 'function') window.logActivity('Cleared Data', 'User Data Only');
  saveData(); renderAll(); hideClearModal();
  showToast('Poof! User data gone. Fresh slate 🧹', 'info');
}

function doClearAllData() {
  data = defaultData(); 
  if (typeof window.logActivity === 'function') window.logActivity('Cleared Data', 'All Data');
  saveData(); renderAll(); hideClearModal();
  showToast('Everything wiped. Time to rebuild, king 👑', 'info');
}
