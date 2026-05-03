// ============================================================
// METRICS & CHARTS
// ============================================================

function drawDonut(canvasId, pct, color) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 100; // Fixed internal size to prevent scaling bugs
  const r = size / 2;
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, size, size);
  ctx.beginPath(); ctx.arc(r, r, r - 10, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 12; ctx.stroke();
  ctx.beginPath(); ctx.arc(r, r, r - 10, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (pct / 100))); ctx.strokeStyle = color; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
}

function renderMetrics() {
  const dates = getAllPlannerDates();
  
  let possibleTicks = 0;
  let earnedTicks = 0;
  
  dates.forEach(d => {
    const r = data.planner.find(x => x.date === d);
    if (r) {
      SUBJECTS.forEach(s => { 
        if (r.plans && r.plans[s] && r.plans[s].trim() !== '') {
          possibleTicks++;
          if (r.ticks[s]) earnedTicks++; 
        }
      });
    }
  });

  const overallPct = possibleTicks ? (earnedTicks / possibleTicks) * 100 : 0;
  drawDonut('donut-canvas', overallPct, 'var(--accent)');
  
  const pctEl = document.getElementById('donut-pct');
  if (pctEl) pctEl.textContent = Math.round(overallPct) + '%';
  
  const compLabel = document.getElementById('donut-ticks');
  if (compLabel) compLabel.textContent = earnedTicks + ' / ' + possibleTicks + ' ticks';

  // 1. Subject Bars (Based on Chapter Status)
  const barWrap = document.getElementById('subj-bars');
  if (barWrap) {
    barWrap.innerHTML = '';
    SUBJECTS.forEach(s => {
      const subjData = data.subjects.find(x => x.id === s);
      const totalCh = subjData ? subjData.chapters.length : 0;
      const completedCh = subjData ? subjData.chapters.filter(c => c.status === 'Completed').length : 0;
      
      const pct = totalCh ? (completedCh / totalCh) * 100 : 0;
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
      const getLevelLabel = (val) => {
        val = parseFloat(val);
        if (val >= 2.5) return 'High';
        if (val >= 1.5) return 'Medium';
        if (val > 0) return 'Low';
        return '—';
      };
      item.innerHTML = `<div class="conf-subj" style="color:${SUBJECT_COLORS[s]}">${SUBJECT_LABELS[s]}</div>`
                     + `<div class="conf-val-row"><span>Difficulty</span><span class="conf-val-num">${avgDiff} <small style="font-weight:400;opacity:0.6">(${getLevelLabel(avgDiff)})</small></span></div>`
                     + `<div class="conf-val-row"><span>Confidence</span><span class="conf-val-num">${avgConf} <small style="font-weight:400;opacity:0.6">(${getLevelLabel(avgConf)})</small></span></div>`;
      confGrid.appendChild(item);
    });
  }

  // 3. Score Trend Chart
  renderScoreTrend();
  
  if (typeof window.renderLogs === 'function') window.renderLogs();
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

  const validTests = (data.tests || []).filter(t => t.score && t.score.includes('/') && !t.isScheduled).sort((a,b) => a.date.localeCompare(b.date)).slice(-12);

  if (validTests.length < 2) {
    ctx.fillStyle = 'var(--text2)'; ctx.font = '12px var(--font)'; ctx.textAlign = 'center';
    ctx.fillText('Log at least 2 completed tests to see trend', w/2, h/2);
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

window.renderLogs = function() {
  const container = document.getElementById('app-logs-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (!data.logs || data.logs.length === 0) {
    container.innerHTML = '<li style="color:var(--text2);text-align:center;padding:10px;">No activity logs yet.</li>';
    return;
  }
  
  data.logs.forEach(log => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.flexDirection = 'column';
    li.style.borderBottom = '1px solid var(--border)';
    li.style.paddingBottom = '6px';
    
    const d = new Date(log.time);
    const timeStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; color:var(--accent);">${log.action}</span>
        <span style="font-size:10px; color:var(--text2);">${timeStr}</span>
      </div>
      ${log.details ? `<div style="color:var(--text); margin-top:2px;">${log.details}</div>` : ''}
    `;
    container.appendChild(li);
  });
};
