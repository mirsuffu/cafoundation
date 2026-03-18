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
    settings: { examDate: examD, plannerStartDate: today, theme: 'dark', userName: '' },
    subjects: SUBJECTS.map(id => ({ id, name: SUBJECT_LABELS[id], chapters: [] })),
    planner: [],
    tests: [],
    schedules: { allDaysExceptSundays: { slots: [] }, sundays: { slots: [] }, periodCycleDays: { slots: [] } }
  };
}

async function loadData() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    data = raw ? JSON.parse(raw) : defaultData();
    normalizeData();
  } catch (e) { data = defaultData(); }

  if (window._fbDb && window._doc && window._getDoc && currentUser) {
    try {
      setConnStatus('syncing');
      const ref = window._doc(window._fbDb, 'users', currentUser.uid, 'data', 'appdata');
      const snap = await window._getDoc(ref);
      if (snap.exists()) {
        const cloud = snap.data().appdata;
        if (cloud) {
          data = JSON.parse(cloud);
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
  if (data.settings.plannerStartDate >= data.settings.examDate) {
    data.settings.plannerStartDate = def.settings.plannerStartDate;
    data.settings.examDate = def.settings.examDate;
  }
  if (data.settings.examDate < toDateStrSimple(new Date())) {
    data.settings.examDate = def.settings.examDate;
  }
  if (!data.subjects) data.subjects = def.subjects;
  if (!data.planner) data.planner = [];
  if (!data.tests) data.tests = [];
  if (!data.schedules) data.schedules = def.schedules;
  SCHED_KEYS.forEach(k => { if (!data.schedules[k]) data.schedules[k] = { slots: [] }; });
}

var _saveTimer = null;
function saveData() {
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
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
