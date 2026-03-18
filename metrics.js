// ============================================================
// METRICS & CHARTS
// ============================================================
function calcStreak() {
  const dates = getAllPlannerDates(), today = getTodayStr();
  let streak = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i]; if (d > today) continue;
    const r = data.planner.find(x => x.date === d);
    if (r && SUBJECTS.some(s => r.ticks[s])) streak++;
    else if (d < today) break;
  }
  return streak;
}

function drawDonut(canvasId, pct, color) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, r = w / 2;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);
  ctx.beginPath(); ctx.arc(r, r, r - 8, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 10; ctx.stroke();
  ctx.beginPath(); ctx.arc(r, r, r - 8, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (pct / 100))); ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
  ctx.font = 'bold 16px var(--font)'; ctx.fillStyle = 'var(--text)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Math.round(pct) + '%', r, r);
}

function renderMetrics() {
  const dates = getAllPlannerDates(), today = getTodayStr();
  const pastDates = dates.filter(d => d <= today);
  const totalTasks = pastDates.length * SUBJECTS.length;
  let doneTasks = 0;
  pastDates.forEach(d => {
    const r = data.planner.find(x => x.date === d);
    if (r) SUBJECTS.forEach(s => { if (r.ticks[s]) doneTasks++; });
  });

  const overallPct = totalTasks ? (doneTasks / totalTasks) * 100 : 0;
  drawDonut('overall-donut', overallPct, 'var(--accent)');
  
  const compLabel = document.getElementById('overall-completed-label');
  if (compLabel) compLabel.textContent = doneTasks + ' / ' + totalTasks + ' ticks';

  // 1. Subject Bars
  const barWrap = document.getElementById('subj-bars');
  if (barWrap) {
    barWrap.innerHTML = '';
    SUBJECTS.forEach(s => {
      let sDone = 0;
      pastDates.forEach(d => {
        const r = data.planner.find(x => x.date === d);
        if (r && r.ticks[s]) sDone++;
      });
      const pct = pastDates.length ? (sDone / pastDates.length) * 100 : 0;
      const row = document.createElement('div'); row.className = 'subj-bar-row';
      row.innerHTML = `<div class="subj-bar-label"><span>${SUBJECT_LABELS[s]}</span><span>${Math.round(pct)}%</span></div>`
                    + `<div class="subj-bar-track"><div class="subj-bar-fill" style="width:${pct}%;background:${SUBJECT_COLORS[s]}"></div></div>`;
      barWrap.appendChild(row);
    });
  }

  // 2. Confidence & Difficulty Grid
  const confGrid = document.getElementById('conf-grid');
  if (confGrid) {
    confGrid.innerHTML = '';
    SUBJECTS.forEach(s => {
      const subjData = data.subjects.find(x => x.id === s);
      if (!subjData || !subjData.chapters.length) return;
      const avgDiff = (subjData.chapters.reduce((a, c) => a + c.difficulty, 0) / subjData.chapters.length).toFixed(1);
      const avgConf = (subjData.chapters.reduce((a, c) => a + c.confidence, 0) / subjData.chapters.length).toFixed(1);
      const item = document.createElement('div'); item.className = 'conf-item';
      item.innerHTML = `<div class="conf-subj" style="color:${SUBJECT_COLORS[s]}">${SUBJECT_LABELS[s]}</div>`
                     + `<div class="conf-vals"><span>Diff: ${avgDiff}</span><span>Conf: ${avgConf}</span></div>`;
      confGrid.appendChild(item);
    });
  }

  // 3. Streak
  const streakNum = document.getElementById('streak-num');
  if (streakNum) streakNum.textContent = calcStreak();
  
  // 4. Days vs Chapters
  const daysStats = document.getElementById('days-stats');
  if (daysStats) {
    daysStats.innerHTML = '';
    const daysLeft = daysUntil(data.settings.examDate);
    SUBJECTS.forEach(s => {
      const subjData = data.subjects.find(x => x.id === s);
      const totalCh = subjData ? subjData.chapters.length : 0;
      const item = document.createElement('div'); item.className = 'days-stat-item';
      item.innerHTML = `<div class="ds-subj">${SUBJECT_LABELS[s]}</div>`
                     + `<div class="ds-val">${totalCh} <small>Chapters</small></div>`
                     + `<div class="ds-sub">${daysLeft > 0 ? (totalCh / daysLeft).toFixed(1) : '—'} ch/day</div>`;
      daysStats.appendChild(item);
    });
  }

  // 5. Score Trend Chart
  renderScoreTrend();
}

function renderScoreTrend() {
  const canvas = document.getElementById('score-trend-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);
  if (!data.tests || data.tests.length < 2) {
    ctx.fillStyle = 'var(--text2)'; ctx.font = '12px var(--font)'; ctx.textAlign = 'center';
    ctx.fillText('Log at least 2 tests to see trend', w/2, h/2);
    return;
  }

  const scores = data.tests.filter(t => t.score && t.score.includes('/')).map(t => {
    const parts = t.score.split('/');
    return (parseFloat(parts[0]) / parseFloat(parts[1])) * 100;
  }).slice(-10);

  if (scores.length < 2) return;

  ctx.beginPath(); ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  const step = w / (scores.length - 1);
  scores.forEach((s, i) => {
    const x = i * step;
    const y = h - (s / 100) * (h - 20) - 10;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Gradient area
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(124, 111, 205, 0.2)'); grad.addColorStop(1, 'transparent');
  ctx.lineTo((scores.length-1)*step, h); ctx.lineTo(0, h); ctx.fillStyle = grad; ctx.fill();
}
