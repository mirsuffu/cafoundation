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
  document.getElementById('stat-streak').textContent = calcStreak();
  document.getElementById('stat-completed').textContent = doneTasks;

  SUBJECTS.forEach(s => {
    let sTotal = pastDates.length, sDone = 0;
    pastDates.forEach(d => {
      const r = data.planner.find(x => x.date === d);
      if (r && r.ticks[s]) sDone++;
    });
    const sPct = sTotal ? (sDone / sTotal) * 100 : 0;
    drawDonut(s + '-donut', sPct, SUBJECT_COLORS[s]);
  });
}
