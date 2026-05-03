// ============================================================
// DATA STORAGE & SYNC
// ============================================================
const getStorageKey = () => currentUser ? `jgsuffu_data_${currentUser.uid}` : 'jgsuffu_data';

function defaultData() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const exam = new Date(now.getFullYear(), now.getMonth() + 4, now.getDate());
  const examD = exam.getFullYear() + '-' + pad(exam.getMonth() + 1) + '-' + pad(exam.getDate());
  return {
    settings: { examDate: examD, plannerStartDate: today, theme: 'dark', userName: '', lastActiveDate: today },
    subjects: SUBJECTS.map(id => ({ id, name: SUBJECT_LABELS[id], chapters: [] })),
    planner: [],
    tests: [],
    schedules: { allDaysExceptSundays: { slots: [] }, sundays: { slots: [] }, periodCycleDays: { slots: [] } },
    logs: [],
    lastModified: Date.now()
  };
}

function isProfileEmpty(d) {
  const hasPlanner = d.planner && d.planner.length > 0;
  const hasTests = d.tests && d.tests.length > 0;
  const hasChapters = d.subjects && d.subjects.some(s => s.chapters && s.chapters.length > 0);
  return !hasPlanner && !hasTests && !hasChapters;
}

async function loadData() {
  let localData = null;
  try {
    const raw = localStorage.getItem(getStorageKey());
    localData = raw ? JSON.parse(raw) : defaultData();
  } catch (e) { localData = defaultData(); }

  data = localData; // Start with local
  normalizeData();

  if (window._fbDb && window._doc && window._getDoc && currentUser) {
    try {
      setConnStatus('syncing');
      const ref = window._doc(window._fbDb, 'users', currentUser.uid, 'data', 'appdata');
      const snap = await window._getDoc(ref);
      if (snap.exists()) {
        const cloudData = JSON.parse(snap.data().appdata);
        if (cloudData && (
          !data.lastModified ||
          cloudData.lastModified > data.lastModified ||
          (isProfileEmpty(data) && !isProfileEmpty(cloudData))
        )) {
          data = cloudData;
          normalizeData();
          localStorage.setItem(getStorageKey(), JSON.stringify(data));
        }
      }
      setConnStatus('online');
    } catch (e) {
      setConnStatus(navigator.onLine ? 'online' : 'offline');
    }
  }
}

function normalizeData() {
  const def = defaultData();
  if (!data.settings) data.settings = def.settings;
  if (!data.settings.plannerStartDate) data.settings.plannerStartDate = def.settings.plannerStartDate;
  if (!data.settings.examDate) data.settings.examDate = def.settings.examDate;
  if (!data.settings.theme) data.settings.theme = 'dark';
  if (data.settings.userName === undefined) data.settings.userName = '';
  if (!data.settings.lastActiveDate) data.settings.lastActiveDate = toDateStrSimple(new Date());
  if (data.settings.plannerStartDate >= data.settings.examDate) {
    data.settings.plannerStartDate = def.settings.plannerStartDate;
    data.settings.examDate = def.settings.examDate;
  }
  if (data.settings.examDate < toDateStrSimple(new Date())) {
    data.settings.examDate = def.settings.examDate;
  }
  if (!data.subjects) data.subjects = def.subjects;
  
  // Backwards compatibility: ensure all chapters have a status
  data.subjects.forEach(subj => {
    if (subj.chapters) {
      subj.chapters.forEach(ch => {
        if (!ch.status) ch.status = 'Pending';
      });
    }
  });

  if (!data.planner) data.planner = [];
  if (!data.tests) data.tests = [];
  if (!data.schedules) data.schedules = def.schedules;
  if (!data.logs) data.logs = [];
  if (!data.lastModified) data.lastModified = Date.now();
  SCHED_KEYS.forEach(k => { if (!data.schedules[k]) data.schedules[k] = { slots: [] }; });
}

var _saveTimer = null;
function saveData() {
  data.lastModified = Date.now();
  // Reset inactivity timer on every save, unless already frozen or testing
  if (!appFrozen && !window._manualFreeze) {
    data.settings.lastActiveDate = toDateStrSimple(new Date());
  }
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch (e) {
    showToast('⚠️ Storage full or blocked! Your progress may not be saved.', 'error');
    console.error('localStorage save failed:', e);
  }
  if (window._fbDb && window._doc && window._setDoc && currentUser) {
    setConnStatus('syncing');
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
      try {
        const ref = window._doc(window._fbDb, 'users', currentUser.uid, 'data', 'appdata');
        await window._setDoc(ref, { appdata: JSON.stringify(data) }, { merge: true });
        setConnStatus('online');
      } catch (e) {
        setConnStatus(navigator.onLine ? 'online' : 'offline');
      }
    }, 800);
  }
}

// ============================================================
// CLOUD VAULT — Tamper-proof Master Backup
// ============================================================
async function checkVaultStatus() {
  const el = document.getElementById('vault-timestamp');
  if (!el) return;
  if (!window._fbDb || !window._doc || !window._getDoc || !currentUser) {
    el.textContent = 'Sign in to use vault';
    return;
  }
  try {
    const ref = window._doc(window._fbDb, 'users', currentUser.uid, 'data', 'master_backup');
    const snap = await window._getDoc(ref);
    if (snap.exists()) {
      const vaultData = JSON.parse(snap.data().appdata);
      if (vaultData._masterTimestamp) {
        const d = new Date(vaultData._masterTimestamp);
        el.textContent = 'Last saved: ' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        el.style.color = 'var(--success)';
      } else {
        el.textContent = 'Vault exists (no timestamp)';
      }
    } else {
      el.textContent = 'No master backup yet';
      el.style.color = 'var(--text2)';
    }
  } catch (e) {
    el.textContent = 'Could not check vault';
    el.style.color = 'var(--warning)';
  }
}

async function createMasterBackup() {
  if (!window._fbDb || !window._doc || !window._setDoc || !currentUser) {
    showToast('You must be signed in to create a vault backup.', 'error');
    return;
  }
  try {
    const vaultPayload = JSON.parse(JSON.stringify(data));
    vaultPayload._isMaster = true;
    vaultPayload._masterTimestamp = Date.now();
    const ref = window._doc(window._fbDb, 'users', currentUser.uid, 'data', 'master_backup');
    await window._setDoc(ref, { appdata: JSON.stringify(vaultPayload) });
    if (typeof window.logActivity === 'function') window.logActivity('Created Master Backup', 'Vault backup created successfully.');
    showToast('🛡️ Master Backup created! Your data is safe in the vault.', 'success');
    checkVaultStatus();
  } catch (e) {
    showToast('Failed to create vault backup. Check your connection.', 'error');
    console.error('Vault create failed:', e);
  }
}

async function restoreMasterBackup() {
  if (!window._fbDb || !window._doc || !window._getDoc || !currentUser) {
    showToast('You must be signed in to restore from vault.', 'error');
    return;
  }
  try {
    const ref = window._doc(window._fbDb, 'users', currentUser.uid, 'data', 'master_backup');
    const snap = await window._getDoc(ref);
    if (!snap.exists()) {
      showToast('No master backup found in vault. Create one first!', 'error');
      return;
    }
    const vaultData = JSON.parse(snap.data().appdata);
    delete vaultData._isMaster;
    delete vaultData._masterTimestamp;
    data = vaultData;
    normalizeData();
    data.lastModified = Date.now();
    // Reset activity clock so vault restore doesn't trigger an immediate freeze
    data.settings.lastActiveDate = toDateStrSimple(new Date());
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
    } catch (e) {
      showToast('⚠️ Storage full or blocked! Your progress may not be saved.', 'error');
    }
    // Also push restored data to the normal cloud sync path
    if (window._setDoc) {
      const appRef = window._doc(window._fbDb, 'users', currentUser.uid, 'data', 'appdata');
      await window._setDoc(appRef, { appdata: JSON.stringify(data) }, { merge: true });
    }
    renderAll();
    if (typeof window.logActivity === 'function') window.logActivity('Restored Master Backup', 'Data restored from vault.');
    showToast('📥 Data restored from vault! Everything is back.', 'success');
  } catch (e) {
    showToast('Failed to restore from vault. Check your connection.', 'error');
    console.error('Vault restore failed:', e);
  }
}

// ============================================================
// APP FREEZE — 3-day inactivity lock
// ============================================================
function checkAppFreeze() {
  if (appFrozen) return true;
  const lastActive = data.settings.lastActiveDate;
  if (!lastActive) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = parseDate(lastActive);
  const diffDays = Math.floor((today - last) / 86400000);
  return diffDays >= 3;
}

function markActivity() {
  if (appFrozen) return;
  const today = toDateStrSimple(new Date());
  if (data.settings.lastActiveDate !== today) {
    data.settings.lastActiveDate = today;
    saveData();
  }
}

function getFreezeDayCount() {
  const lastActive = data.settings.lastActiveDate;
  if (!lastActive) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = parseDate(lastActive);
  return Math.floor((today - last) / 86400000);
}

function generateFreezePassword() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const un = data.settings && data.settings.userName ? data.settings.userName.toUpperCase().replace(/\s/g, '').slice(0, 4) : '';
  const userPart = un.length >= 4 ? un.slice(0, 4) : 'XXXX';
  return 'JG-SUFFU-' + dd + '-' + mm + '-' + yy + '-' + userPart;
}

function activateFreeze() {
  appFrozen = true;
  const overlay = document.getElementById('freeze-overlay');
  if (overlay) {
    const days = getFreezeDayCount();
    document.getElementById('freeze-days').textContent = days + ' day' + (days !== 1 ? 's' : '');
    overlay.classList.add('show');
    if (typeof window.logActivity === 'function') window.logActivity('App Frozen', `App locked due to ${days} days of inactivity.`);
  }
  // Show the unfreeze button in settings
  const settingsBtn = document.getElementById('unfreeze-settings-btn');
  if (settingsBtn) settingsBtn.style.display = 'flex';
}

async function deactivateFreeze() {
  appFrozen = false;
  window._manualFreeze = false; // Clear test flag if set
  data.settings.lastActiveDate = toDateStrSimple(new Date());
  data.lastModified = Date.now();
  // Save locally first
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch (e) {
    showToast('⚠️ Storage full or blocked!', 'error');
  }
  // Immediate cloud push (bypasses the 800ms debounce so unfreeze persists cross-device)
  if (window._fbDb && window._doc && window._setDoc && currentUser) {
    try {
      const ref = window._doc(window._fbDb, 'users', currentUser.uid, 'data', 'appdata');
      await window._setDoc(ref, { appdata: JSON.stringify(data) }, { merge: true });
    } catch (e) {
      console.warn('Unfreeze cloud sync failed, will retry on next save:', e);
    }
  }
  const overlay = document.getElementById('freeze-overlay');
  if (overlay) overlay.classList.remove('show');
  const settingsBtn = document.getElementById('unfreeze-settings-btn');
  if (settingsBtn) settingsBtn.style.display = 'none';
  document.getElementById('freeze-modal').classList.remove('show');
  renderAll();
  if (typeof window.logActivity === 'function') window.logActivity('App Unfrozen', 'App unlocked successfully.');
  showToast('❄️ App unfrozen! Welcome back — now get to work! 💪', 'success');
}

function attemptUnfreeze(password) {
  const correct = generateFreezePassword();
  if (password === correct) {
    deactivateFreeze();
    return true;
  }
  return false;
}

// DEVELOPER HELPER: Use this to test freeze logic
window.forceFreeze = function() {
  window._manualFreeze = true;
  data.settings.lastActiveDate = '2026-04-28';
  appFrozen = false; // Reset so init can catch it
  saveData();
  location.reload();
};