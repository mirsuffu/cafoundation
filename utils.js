// ============================================================
// UTILS & SOUNDS & TOASTS
// ============================================================
const sounds = {
  click: new Audio('click.mp3'),
  pop: new Audio('pop.mp3')
};

function playSound(type) {
  const now = Date.now();
  if (type === 'pop') {
    sounds.pop.currentTime = 0;
    sounds.pop.play().catch(e => {});
    lastSoundType = 'pop';
    lastSoundTime = now;
  } else if (type === 'click') {
    if (lastSoundType === 'pop' && (now - lastSoundTime < 50)) return;
    sounds.click.currentTime = 0;
    sounds.click.play().catch(e => {});
    lastSoundType = 'click';
    lastSoundTime = now;
  }
}

function triggerHaptic(duration = 40) {
  if (navigator.vibrate) {
    try { navigator.vibrate(duration); } catch(e) {}
  }
}

function toDateStrSimple(d) { var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dy=String(d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+dy; }
function toDateStr(d) { return d.toISOString().split('T')[0]; }
function parseDate(s) { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function formatDateShort(s) { return parseDate(s).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}); }
function getDayName(s) { return parseDate(s).toLocaleDateString('en-IN',{weekday:'long'}); }
function getDayNameShort(s) { return parseDate(s).toLocaleDateString('en-IN',{weekday:'short'}); }
function getDaysBetween(a,b) { const r=[],s=parseDate(a),e=parseDate(b),c=new Date(s); while(c<=e){r.push(toDateStr(c));c.setDate(c.getDate()+1);} return r; }
function daysUntil(s) { const t=new Date();t.setHours(0,0,0,0); return Math.ceil((parseDate(s)-t)/86400000); }
function isSunday(s) { return parseDate(s).getDay()===0; }
function getTodayStr() { return toDateStr(new Date()); }

function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function showToast(msg, type = 'info') {
  playSound('pop');
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  el.style.borderLeftColor = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--accent)';
  el.style.borderLeftWidth = '3px';
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => el.remove(), 300); }, 2500);
}

function typewriterEffect(text, el, speed, onDone) {
  el.textContent = '';
  let i = 0;
  function tick() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(tick, speed);
    } else {
      if (onDone) onDone();
    }
  }
  tick();
}
