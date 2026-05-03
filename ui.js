// ============================================================
// UI CORE (Theme, Fullscreen, Navigation, Status)
// ============================================================
function updateTopBar() {
  const dateEl = document.getElementById('topbar-date');
  if (dateEl) dateEl.textContent = getTodayStr('long');
  const daysEl = document.getElementById('days-remaining');
  if (daysEl && data.settings && data.settings.examDate) {
    const d = daysUntil(data.settings.examDate);
    daysEl.textContent = (d > 0 ? d : 0) + ' Days';
  }
  updateTopbarBrand();
}

function updateTopbarBrand() {
  const brandName = document.getElementById('topbar-brand-name');
  if (brandName) {
    const un = data.settings && data.settings.userName;
    brandName.textContent = un ? un.toUpperCase() : 'JG. SUFFU';
  }
}

function updateEditorBadge() {
  const badge = document.getElementById('editor-badge');
  if (!badge) return;
  if (editorUnlocked) {
    badge.textContent = '🔓 UNLOCKED';
    badge.className = 'unlocked';
  } else {
    badge.textContent = '🔒 LOCKED';
    badge.className = 'locked';
  }
}

function applyTheme(theme) {
  if (theme) data.settings.theme = theme;
  updateThemeUI();
}

function setEditorMode(unlocked, options = {}) {
  editorUnlocked = unlocked;
  document.body.classList.toggle('editor-locked', !unlocked);
  updateEditorBadge();
  if (typeof window.logActivity === 'function') window.logActivity(unlocked ? 'Unlocked Editor Mode' : 'Locked Editor Mode');
  if (options.showFeedback !== false) {
    showToast(unlocked ? 'Editor unlocked. Be careful 🔓' : 'Editor locked. Safe mode ON 🔒', 'success');
  }
  if (options.reRenders !== false) {
    if (currentSection === 'subjects') renderSubjectsInternal();
  }
}
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
        var m = parseInt(parts[1], 10) - 1;
        var day = parseInt(parts[2], 10);
        label.textContent = day + ' ' + months[m];
        var lTop = (pct * (trackH - thumbH)) + (thumbH/2) - (label.clientHeight/2);
        label.style.top = lTop + 'px';
      }
    }
  }
  wrap.addEventListener('scroll', function() {
    thumb.classList.add('visible');
    label.classList.add('visible');
    updateThumb();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function() {
      thumb.classList.remove('visible');
      label.classList.remove('visible');
    }, 1500);
  });
  updateThumb();
}

function switchSection(sectionId) {
  currentSection = sectionId;
  document.querySelectorAll('.section').forEach(function(el) { el.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });
  document.querySelectorAll('.mobile-tab').forEach(function(el) { el.classList.remove('active'); });

  var sec = document.getElementById(sectionId + '-section');
  if (sec) sec.classList.add('active');
  var nav = document.querySelector('.nav-item[data-section="' + sectionId + '"]');
  if (nav) nav.classList.add('active');
  var mtab = document.querySelector('.mobile-tab[data-section="' + sectionId + '"]');
  if (mtab) mtab.classList.add('active');

  if (sectionId === 'planner') { renderPlanner(); setTimeout(initPlannerScrollIndicator, 100); }
  else if (sectionId === 'test') renderTestTable();
  else if (sectionId === 'schedule') renderSchedule();
  else if (sectionId === 'subjects') renderSubjectsInternal();
  else if (sectionId === 'metrics') renderMetrics();
  else if (sectionId === 'settings') renderSettings();
}

function updateThemeUI() {
  const isDark = data.settings.theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', isDark ? '#111115' : '#fdf9f4');
  
  const icon = document.getElementById('theme-icon-settings');
  const text = document.getElementById('theme-text-settings');
  if (icon) icon.textContent = isDark ? '🌙' : '☀️';
  if (text) text.textContent = isDark ? 'Dark Mode' : 'Light Mode';
}

function toggleTheme() {
  data.settings.theme = data.settings.theme === 'dark' ? 'light' : 'dark';
  saveData(); updateThemeUI();
  if (currentSection === 'metrics') renderMetrics();
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function updateFullscreenUI() {
  const cb = document.getElementById('fullscreen-track');
  const text = document.getElementById('fullscreen-toggle-text');
  if (cb) cb.classList.toggle('on', !!data.settings.alwaysFullscreen);
  if (text) text.textContent = data.settings.alwaysFullscreen ? 'On' : 'Off';
}

function toggleAlwaysFullscreen() {
  playSound('click');
  data.settings.alwaysFullscreen = !data.settings.alwaysFullscreen;
  saveData(); updateFullscreenUI();
  if (data.settings.alwaysFullscreen) enterFullscreen();
  else exitFullscreen();
}

function enterFullscreen() {
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
  else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen().catch(()=>{});
}

function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(()=>{});
}

function toggleFullscreen() {
  playSound('click');
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

function showToast(msg, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) return;
  var t = document.createElement('div');
  t.className = 'toast';
  if (type === 'error') { t.style.borderLeft = '4px solid var(--danger)'; }
  else if (type === 'success') { t.style.borderLeft = '4px solid var(--success)'; }
  else { t.style.borderLeft = '4px solid var(--accent)'; }
  t.innerHTML = msg;
  container.appendChild(t);
  setTimeout(function() {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(function() { t.remove(); }, 300);
  }, 3000);
}

function scrollToToday() {
  if(currentSection !== 'planner') switchSection('planner');
  var wrap = document.getElementById('planner-table-wrap');
  var today = getTodayStr();
  var el = wrap.querySelector('[data-date="' + today + '"]');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    showToast('Today isn\'t in your planner. Did you forget to set the dates? 🤔', 'info');
  }
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

// ============================================================
// TODAY MODAL LOGIC (New Feature)
// ============================================================
function openTodayModal() {
  const today = getTodayStr();
  
  // 1. Calculate Progress
  const dates = getAllPlannerDates();
  let possible = 0, earned = 0;
  
  dates.forEach(d => {
    const r = data.planner.find(x => x.date === d);
    if(r) {
      SUBJECTS.forEach(s => {
        if(r.plans && r.plans[s] && r.plans[s].trim() !== '') {
          possible++; 
          if(r.ticks[s]) earned++;
        }
      });
    }
  });
  const pct = possible ? Math.round((earned/possible)*100) : 0;
  
  // 2. Fetch Study Plans
  const planRow = data.planner.find(x => x.date === today);
  let plansHtml = '';
  if(planRow && planRow.plans) {
    SUBJECTS.forEach(s => {
       if(planRow.plans[s] && planRow.plans[s].trim() !== '') {
         plansHtml += `<div style="margin-bottom:6px;"><b>${SUBJECT_LABELS[s]}:</b> ${planRow.plans[s]}</div>`;
       }
    });
  }
  if(!plansHtml) plansHtml = '<div style="color:var(--text2);font-size:12px;font-style:italic;">No specific plans jotted down for today.</div>';

  // 3. Fetch Scheduled Tests
  const tests = (data.tests || []).filter(t => t.isScheduled && t.date === today);
  let testsHtml = '';
  tests.forEach(t => {
    testsHtml += `<div style="margin-bottom:6px; padding:6px 10px; background:rgba(124,111,205,0.08); border-radius:6px; border-left:3px solid var(--accent);">
                    <div style="font-weight:700; color:var(--text);">${t.subject === 'all' ? 'All Subjects' : SUBJECT_LABELS[t.subject]}</div>
                    <div style="font-size:12px; color:var(--text2);">${t.coverage || 'General Test'}</div>
                  </div>`;
  });
  if(!testsHtml) testsHtml = '<div style="color:var(--text2);font-size:12px;font-style:italic;">No tests scheduled for today. Enjoy!</div>';

  // Inject into DOM
  const tp = document.getElementById('today-progress');
  if (tp) tp.innerHTML = `<span style="font-size:20px; color:var(--accent);"><b>${pct}%</b></span> <span style="font-size:13px; color:var(--text2);">(${earned}/${possible} ticks completed)</span>`;
  
  const tpl = document.getElementById('today-plans');
  if (tpl) tpl.innerHTML = plansHtml;
  
  const tt = document.getElementById('today-tests');
  if (tt) tt.innerHTML = testsHtml;

  playSound('pop');
  const mod = document.getElementById('today-modal');
  if (mod) mod.classList.add('show');
}

function closeTodayModal() {
  const mod = document.getElementById('today-modal');
  if (mod) mod.classList.remove('show');
}