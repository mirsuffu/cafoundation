// ============================================================
// METRICS & CHARTS
// ============================================================

function drawDonut(canvasId, pct, color) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, r = w / 2;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);
  ctx.beginPath(); ctx.arc(r, r, r - 10, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 12; ctx.stroke();
  ctx.beginPath(); ctx.arc(r, r, r - 10, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (pct / 100))); ctx.strokeStyle = color; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
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
  drawDonut('donut-canvas', overallPct, 'var(--accent)');
  
  const pctEl = document.getElementById('donut-pct');
  if (pctEl) pctEl.textContent = Math.round(overallPct) + '%';
  
  const compLabel = document.getElementById('donut-ticks');
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
      if (!subjData) return;
      const totalCh = subjData.chapters.length;
      const avgDiff = totalCh ? (subjData.chapters.reduce((a, c) => a + c.difficulty, 0) / totalCh).toFixed(1) : '0.0';
      const avgConf = totalCh ? (subjData.chapters.reduce((a, c) => a + c.confidence, 0) / totalCh).toFixed(1) : '0.0';
      
      const item = document.createElement('div'); item.className = 'conf-item';
      item.innerHTML = `<div class="conf-subj" style="color:${SUBJECT_COLORS[s]}">${SUBJECT_LABELS[s]}</div>`
                     + `<div class="conf-vals">`
                     + `<div class="conf-val-row"><span>Difficulty</span><span class="conf-val-num">${avgDiff}</span></div>`
                     + `<div class="conf-val-row"><span>Confidence</span><span class="conf-val-num">${avgConf}</span></div>`
                     + `</div>`;
      confGrid.appendChild(item);
    });
  }

  // 3. Score Trend Chart
  renderScoreTrend();
}

let scoreTrendPoints = [];

function renderScoreTrend() {
  const canvas = document.getElementById('score-trend-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('score-trend-container');
  const w = container.clientWidth, h = container.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);
  scoreTrendPoints = [];

  const validTests = (data.tests || []).filter(t => t.score && t.score.includes('/')).sort((a,b) => a.date.localeCompare(b.date)).slice(-12);

  if (validTests.length < 2) {
    ctx.fillStyle = 'var(--text2)'; ctx.font = '12px var(--font)'; ctx.textAlign = 'center';
    ctx.fillText('Log at least 2 tests to see trend', w/2, h/2);
    return;
  }

  const scores = validTests.map(t => {
    const parts = t.score.split('/');
    const pct = (parseFloat(parts[0]) / parseFloat(parts[1])) * 100;
    return { pct, date: t.date, score: t.score, subj: t.subject };
  });

  const step = w / (scores.length - 1);
  const padding = 20;
  const drawH = h - (padding * 2);

  // Draw line
  ctx.beginPath(); ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  scores.forEach((s, i) => {
    const x = i * step;
    const y = h - padding - (s.pct / 100) * drawH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    scoreTrendPoints.push({ x, y, ...s });
  });
  ctx.stroke();

  // Gradient area
  const grad = ctx.createLinearGradient(0, padding, 0, h);
  grad.addColorStop(0, 'rgba(124, 111, 205, 0.15)'); grad.addColorStop(1, 'transparent');
  ctx.lineTo((scores.length-1)*step, h); ctx.lineTo(0, h); ctx.fillStyle = grad; ctx.fill();

  // Draw dots
  scoreTrendPoints.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--surface)'; ctx.fill();
    ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 2; ctx.stroke();
  });

  // Setup Interactivity
  const tooltip = document.getElementById('score-tooltip');
  let lastClosest = null;
  const handleMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    
    let closest = null, minDist = 25;
    scoreTrendPoints.forEach(p => {
      const d = Math.sqrt((p.x - mx)**2 + (p.y - my)**2);
      if (d < minDist) { minDist = d; closest = p; }
    });

    if (closest) {
      if (lastClosest !== closest) {
        playSound('click');
        lastClosest = closest;
      }
      tooltip.style.display = 'block';
      tooltip.style.left = closest.x + 'px';
      tooltip.style.top = closest.y + 'px';
      const sub = closest.subj === 'all' ? 'All Subjects' : (SUBJECT_LABELS[closest.subj] || closest.subj);
      tooltip.innerHTML = `<div><b>${closest.pct.toFixed(1)}%</b></div>`
                        + `<div style="font-size:10px;margin-top:2px;">${sub}</div>`
                        + `<div style="font-size:10px;color:var(--text2)">${formatDateShort(closest.date)} • ${closest.score}</div>`;
    } else {
      tooltip.style.display = 'none';
      lastClosest = null;
    }
  };

  container.onmousemove = handleMove;
  container.ontouchstart = (e) => { handleMove(e); };
  container.onmouseleave = () => { tooltip.style.display = 'none'; lastClosest = null; };
}
