// ============================================================
// UI CORE (Theme, Fullscreen, Navigation, Status)
// ============================================================
function initPlannerScrollIndicator() {
  var wrap  = document.getElementById('planner-table-wrap');
  var thumb = document.getElementById('planner-scroll-thumb');
  var label = document.getElementById('planner-scroll-label');
  if (!wrap || !thumb || !label) return;
  var hideTimer;
  function updateThumb() {
    var scrollTop    = wrap.scrollTop;
    var scrollHeight = wrap.scrollHeight - wrap.clientHeight;
    if (scrollHeight <= 0) return;
    var pct = scrollTop / scrollHeight;
    var trackH = wrap.clientHeight;
    var thumbH = Math.max(30, trackH * (wrap.clientHeight / wrap.scrollHeight));
    thumb.style.height = thumbH + 'px';
    thumb.style.top    = (pct * (trackH - thumbH)) + 'px';
    var rows = wrap.querySelectorAll('tr[data-date],div[data-date]');
    var closest = null, closestDist = Infinity;
    rows.forEach(function(r) {
      var top = r.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
      if (top >= 0 && top < closestDist) { closestDist = top; closest = r; }
    });
    if (closest) {
      var d = closest.dataset.date;
      if (d) {
        var parts = d.split('-');
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        label.textContent = parseInt(parts[2]) + ' ' + months[parseInt(parts[1])-1];
        var labelTop = parseFloat(thumb.style.top) + thumbH/2 - 10;
        label.style.top = Math.max(0, labelTop) + 'px';
      }
    }
    thumb.classList.add('visible');
    label.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function() {
      thumb.classList.remove('visible');
      label.classList.remove('visible');
    }, 1500);
  }
  wrap.addEventListener('scroll', updateThumb, { passive: true });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeIcon = document.getElementById('theme-icon-settings');
  const themeText = document.getElementById('theme-text-settings');
  const track = document.getElementById('theme-track');
  const txt = document.getElementById('theme-toggle-text');

  if (theme === 'dark') {
    if (themeIcon) themeIcon.textContent = '🌙';
    if (themeText) themeText.textContent = 'Dark Mode';
    if (track) track.classList.remove('on');
    if (txt) txt.textContent = 'Dark Mode';
  } else {
    if (themeIcon) themeIcon.textContent = '☀️';
    if (themeText) themeText.textContent = 'Light Mode';
    if (track) track.classList.add('on');
    if (txt) txt.textContent = 'Light Mode';
  }
  data.settings.theme = theme;
}
function toggleTheme() { const t = data.settings.theme === 'dark' ? 'light' : 'dark'; applyTheme(t); saveData(); }

function setEditorMode(unlocked, options = { showFeedback: false, reRenders: true }) {
  editorUnlocked = unlocked;
  const badge = document.getElementById('editor-badge');
  const btn = document.getElementById('editor-toggle-btn-settings');
  if (unlocked) {
    if (badge) { badge.className = 'unlocked'; badge.textContent = '🔓 UNLOCKED'; }
    if (btn) btn.textContent = '🔓 Unlock Editor';
    document.body.classList.remove('editor-locked');
    if (options.showFeedback) showToast('Editor Mode Unlocked! Suffu is watching... 👀', 'success');
  } else {
    if (badge) { badge.className = 'locked'; badge.textContent = '🔒 LOCKED'; }
    if (btn) btn.textContent = '🔒 Unlock Editor';
    document.body.classList.add('editor-locked');
    if (options.showFeedback) showToast('Editor Mode Locked. Back to focus! 🔒', 'info');
  }
  if (options.reRenders) {
    renderSchedule();
    renderSubjectsInternal();
  }
}
function handleEditorToggle() { editorUnlocked ? setEditorMode(false, { showFeedback: true, reRenders: true }) : openEditorModal(); }
function openEditorModal() {
  playSound('pop');
  document.getElementById('editor-modal').classList.add('show');
  document.getElementById('editor-pw-input').value = '';
  document.getElementById('editor-pw-error').textContent = '';
  setTimeout(() => document.getElementById('editor-pw-input').focus(), 50);
}
function closeEditorModal() { document.getElementById('editor-modal').classList.remove('show'); }
function confirmEditorPassword() {
  const pw = document.getElementById('editor-pw-input').value;
  if (pw === EDITOR_PASSWORD) { closeEditorModal(); setEditorMode(true, { showFeedback: true, reRenders: true }); }
  else {
    const inp = document.getElementById('editor-pw-input');
    document.getElementById('editor-pw-error').textContent = 'Nice try. Wrong password though 🙃';
    inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400);
  }
}

function updateTopBar() {
  const days = daysUntil(data.settings.examDate), el = document.getElementById('days-remaining');
  if (days > 0) el.textContent = days + ' Days Remaining';
  else if (days === 0) el.textContent = 'Exam Day Today! You\'ve got this 💪';
  else el.textContent = 'Exam\'s done! Results await 🤞';
  el.style.color = days <= 30 ? 'var(--danger)' : days <= 90 ? 'var(--warning)' : 'var(--text)';
  document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  (function () { var un = data.settings && data.settings.userName, bl = document.getElementById('topbar-brand-name'); if (bl) bl.textContent = un || 'JG. SUFFU'; })();
}

function switchSection(id) {
  currentSection = id;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id + '-section').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === id));
  document.querySelectorAll('.mobile-tab').forEach(t => t.classList.toggle('active', t.dataset.section === id));
  if (id === 'metrics') renderMetrics();
  if (id === 'test') renderTestTable();
}

function scrollToToday() {
  var today = getTodayStr();
  var el = document.querySelector('[data-date="' + today + '"]');
  if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  else showToast('Today isn\'t in your planner. Did you forget to set the dates? 🤔', 'info');
}

function isMobile() { return window.innerWidth <= 768; }

function setConnStatus(state) {
  const el = document.getElementById('conn-status');
  const lbl = document.getElementById('conn-label');
  if (!el) return;
  el.className = state;
  if (state === 'online') lbl.textContent = 'Online';
  if (state === 'offline') lbl.textContent = 'Offline';
  if (state === 'syncing') lbl.textContent = 'Syncing…';
}

function initConnStatus() {
  setConnStatus(navigator.onLine ? 'online' : 'offline');
  window.addEventListener('online', () => setConnStatus('online'));
  window.addEventListener('offline', () => setConnStatus('offline'));
}

function toggleFullscreen() {
  const btn = document.getElementById('fullscreen-btn-settings');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => { });
    if (btn) { btn.textContent = '✕ Exit Fullscreen'; }
  } else {
    document.exitFullscreen().catch(() => { });
    if (btn) { btn.textContent = '⛶ Toggle Fullscreen'; }
  }
}
document.addEventListener('fullscreenchange', () => {
  const btn = document.getElementById('fullscreen-btn-settings');
  if (!document.fullscreenElement) {
    if (btn) { btn.textContent = '⛶ Toggle Fullscreen'; }
  } else {
    if (btn) { btn.textContent = '✕ Exit Fullscreen'; }
  }
});

function setupRightClickDisable() {
  document.addEventListener('contextmenu', e => e.preventDefault());
}
