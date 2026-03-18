// ============================================================
// WELCOME & DAILY MODALS
// ============================================================
var welcomeTimer;
function startWelcomeCountdown(sec) {
  var el = document.getElementById('welcome-timer'); if (!el) return;
  var remaining = sec;
  el.textContent = 'Auto-closing in ' + remaining + 's...';
  clearInterval(welcomeTimer);
  welcomeTimer = setInterval(function () {
    remaining--;
    if (remaining <= 0) { clearInterval(welcomeTimer); closeWelcome(); }
    else el.textContent = 'Auto-closing in ' + remaining + 's...';
  }, 1000);
}

function closeWelcome() {
  clearInterval(welcomeTimer);
  var overlay = document.getElementById('welcome-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.5s ease forwards';
    setTimeout(function () { overlay.classList.remove('show'); overlay.style.animation = ''; }, 500);
  }
}

function showWelcomeModal(title, bodyText, typeSpeed) {
  document.getElementById('welcome-title').textContent = title;
  document.getElementById('welcome-body').textContent = '';
  document.getElementById('welcome-timer').textContent = '';
  playSound('pop');
  document.getElementById('welcome-overlay').classList.add('show');
  typewriterEffect(bodyText, document.getElementById('welcome-body'), typeSpeed, () => {
    startWelcomeCountdown(120);
  });
}

function showNamePrompt() {
  var modal = document.getElementById('name-modal'); if (!modal) return;
  playSound('pop');
  modal.classList.add('show');
  setTimeout(function () { var i = document.getElementById('name-input'); if (i) i.focus(); }, 300);
}

function checkAndShowWelcome() {
  var un = data.settings && data.settings.userName;
  if (!un) { showNamePrompt(); return; }
  var today = getTodayStr(), last = localStorage.getItem('jgsuffu_last_welcome');
  if (last === today) return;
  localStorage.setItem('jgsuffu_last_welcome', today);
  var days = daysUntil(data.settings.examDate);
  var title = "Welcome back, " + un + "!";
  var msg = "Today is " + getDayName(today) + ". You have " + (days > 0 ? days + " days" : "no days") + " left until your exam. Make every second count!";
  if (days <= 7 && days > 0) msg = "Final stretch, " + un + "! Only " + days + " days left. Give it your 100%!";
  else if (days === 0) msg = "Today is the big day. Take a deep breath. You are ready. Good luck!";
  showWelcomeModal(title, msg, 40);
}

function checkWeeklyBackupNudge() {
  const last = localStorage.getItem('jgsuffu_last_backup_nudge');
  const now = Date.now();
  if (!last || (now - parseInt(last)) > (7 * 24 * 60 * 60 * 1000)) {
    setTimeout(() => {
      showToast('Weekly nudge: Back up your progress! Don\'t let Suffu down 💾', 'info');
      localStorage.setItem('jgsuffu_last_backup_nudge', now.toString());
    }, 5000);
  }
}
