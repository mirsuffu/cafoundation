// ============================================================
// PLANNER RENDER & LOGIC
// ============================================================
function getOrCreatePlannerRow(date) {
  let row = data.planner.find(r => r.date === date);
  if (!row) {
    return { date, ticks: { accounts: false, law: false, maths: false, economics: false }, plans: { accounts: '', law: '', maths: '', economics: '' } };
  }
  if (!row.plans) row.plans = { accounts: '', law: '', maths: '', economics: '' };
  return row;
}

function ensureRowExists(date) {
  let row = data.planner.find(r => r.date === date);
  if (!row) {
    row = { date, ticks: { accounts: false, law: false, maths: false, economics: false }, plans: { accounts: '', law: '', maths: '', economics: '' } };
    data.planner.push(row);
  }
  return row;
}

function getAllPlannerDates() {
  const { plannerStartDate, examDate } = data.settings;
  if (!plannerStartDate || !examDate) return [];
  return getDaysBetween(plannerStartDate, examDate);
}

function renderPlanner() {
  setTimeout(initPlannerScrollIndicator, 100);
  const mobile = isMobile();
  const tbody = document.getElementById('planner-tbody');
  const cards = document.getElementById('planner-cards');
  const table = document.getElementById('planner-table');

  table.style.display = mobile ? 'none' : '';
  cards.style.display = mobile ? 'flex' : 'none';

  tbody.innerHTML = '';
  cards.innerHTML = '';

  const dates = getAllPlannerDates(), today = getTodayStr();
  const emptyMsg = "Nothing here yet! Set your dates in Settings and let&#39;s get to work &#128197;";

  if (dates.length === 0) {
    if (mobile) {
      cards.innerHTML = '<div id="planner-cards-empty">' + emptyMsg + '</div>';
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text2);">' + emptyMsg + '</td></tr>';
    }
    return;
  }

  dates.forEach(date => {
    const row = getOrCreatePlannerRow(date);
    const isSun = isSunday(date);
    const isToday = date === today;

    if (mobile) {
      const card = document.createElement('div');
      card.dataset.date = date; card.className = 'pcard' + (isSun ? ' is-sunday' : '') + (isToday ? ' is-today' : '');

      const hdr = document.createElement('div');
      hdr.className = 'pcard-header';
      const left = document.createElement('div');
      left.style.cssText = 'display:flex;align-items:center;gap:8px;';
      const ds = document.createElement('span'); ds.className = 'pcard-date'; ds.textContent = formatDateShort(date);
      const dy = document.createElement('span'); dy.className = 'pcard-day'; dy.textContent = getDayNameShort(date);
      left.append(ds, dy);

      const bulk = document.createElement('button');
      bulk.className = 'pcard-bulk'; bulk.textContent = 'All ✓';
      bulk.addEventListener('click', () => {
        playSound('click');
        const inputs = card.querySelectorAll('.pcard-plan-input');
        let hasPlans = false;
        SUBJECTS.forEach((s, i) => { if (inputs[i].value.trim() !== '') hasPlans = true; });
        
        if (!hasPlans) {
          showToast('No plans to tick off! Suffu sees an empty schedule 📝', 'error');
          return;
        }
        
        const persistentRow = ensureRowExists(date);
        SUBJECTS.forEach((s, i) => { persistentRow.plans[s] = inputs[i].value.trim(); });
        
        const allT = SUBJECTS.every(s => !persistentRow.plans[s] || persistentRow.plans[s].trim() === '' || persistentRow.ticks[s]);
        SUBJECTS.forEach(s => {
          if (persistentRow.plans[s] && persistentRow.plans[s].trim() !== '') {
            persistentRow.ticks[s] = !allT;
          }
        });
        if (typeof window.logActivity === 'function') window.logActivity('Ticked All Planner Items', date);
        saveData();
        card.querySelectorAll('.pcard-tick').forEach((t, i) => {
          const s = SUBJECTS[i];
          t.className = 'pcard-tick' + (persistentRow.ticks[s] ? ' ticked' : '');
          t.textContent = persistentRow.ticks[s] ? '✓' : '';
        });
        if (currentSection === 'metrics') renderMetrics();
      });
      hdr.append(left, bulk);
      card.appendChild(hdr);

      SUBJECTS.forEach(subj => {
        const wrap = document.createElement('div');
        wrap.className = 'pcard-subj-row';

        const lbl = document.createElement('span');
        lbl.className = 'pcard-subj-label';
        lbl.textContent = SUBJECT_LABELS[subj];

        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'pcard-plan-input';
        inp.value = row.plans[subj] || ''; inp.placeholder = 'Plan…';
        inp.addEventListener('change', () => { const r = ensureRowExists(date); r.plans[subj] = inp.value.trim(); saveData(); });
        inp.addEventListener('blur', () => { const r = ensureRowExists(date); r.plans[subj] = inp.value.trim(); saveData(); });
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') { const r = ensureRowExists(date); r.plans[subj] = inp.value.trim(); saveData(); inp.blur(); }
        });

        const tick = document.createElement('button');
        tick.className = 'pcard-tick' + (row.ticks[subj] ? ' ticked' : '');
        tick.textContent = row.ticks[subj] ? '✓' : '';
        tick.addEventListener('click', () => {
          playSound('click');
          const currentVal = inp.value.trim();
          if (!currentVal) {
            showToast('Plan something first! Don\'t tick into the void 📅', 'error');
            return;
          }
          const r = ensureRowExists(date);
          r.plans[subj] = currentVal;
          r.ticks[subj] = !r.ticks[subj]; 
          if (typeof window.logActivity === 'function') window.logActivity(r.ticks[subj] ? 'Ticked Planner Item' : 'Unticked Planner Item', `${date} - ${SUBJECT_LABELS[subj]}`);
          saveData();
          tick.className = 'pcard-tick' + (r.ticks[subj] ? ' ticked' : '');
          tick.textContent = r.ticks[subj] ? '✓' : '';
          if (currentSection === 'metrics') renderMetrics();
        });

        wrap.append(lbl, inp, tick);
        card.appendChild(wrap);
      });

      cards.appendChild(card);

    } else {
      const tr = document.createElement('tr');
      tr.dataset.date = date; tr.className = 'planner-row' + (isSun ? ' is-sunday' : '') + (isToday ? ' is-today' : '');

      const dtd = document.createElement('td'); dtd.className = 'date-cell'; dtd.textContent = formatDateShort(date); tr.appendChild(dtd);
      const daytd = document.createElement('td'); daytd.className = 'day-cell'; daytd.textContent = getDayNameShort(date); tr.appendChild(daytd);

      SUBJECTS.forEach(subj => {
        const td = document.createElement('td');
        const cell = document.createElement('div'); cell.className = 'subj-cell';

        const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'plan-input';
        inp.value = row.plans[subj] || ''; inp.placeholder = 'Plan…';
        inp.addEventListener('change', () => { const r = ensureRowExists(date); r.plans[subj] = inp.value.trim(); saveData(); });
        inp.addEventListener('blur', () => { const r = ensureRowExists(date); r.plans[subj] = inp.value.trim(); saveData(); });
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') { const r = ensureRowExists(date); r.plans[subj] = inp.value.trim(); saveData(); inp.blur(); }
        });

        const btn = document.createElement('button');
        btn.className = 'tick-btn' + (row.ticks[subj] ? ' ticked' : '');
        btn.textContent = row.ticks[subj] ? '✓' : '';
        btn.title = (row.ticks[subj] ? 'Untick' : 'Tick') + ' ' + SUBJECT_LABELS[subj];
        btn.addEventListener('click', () => {
          playSound('click');
          const currentVal = inp.value.trim();
          if (!currentVal) {
            showToast('Wait! You have no plan here. Suffu is confused 🤨', 'error');
            return;
          }
          const persistentRow = ensureRowExists(date);
          persistentRow.plans[subj] = currentVal;
          persistentRow.ticks[subj] = !persistentRow.ticks[subj]; 
          if (typeof window.logActivity === 'function') window.logActivity(persistentRow.ticks[subj] ? 'Ticked Planner Item' : 'Unticked Planner Item', `${date} - ${SUBJECT_LABELS[subj]}`);
          saveData();
          btn.className = 'tick-btn' + (persistentRow.ticks[subj] ? ' ticked' : '');
          btn.textContent = persistentRow.ticks[subj] ? '✓' : '';
          if (currentSection === 'metrics') renderMetrics();
        });
        cell.append(inp, btn); td.appendChild(cell); tr.appendChild(td);
      });

      const atd = document.createElement('td');
      const abtn = document.createElement('button'); abtn.className = 'bulk-btn'; abtn.textContent = 'All ✓';
      abtn.addEventListener('click', () => {
        playSound('click');
        const inputs = tr.querySelectorAll('.plan-input');
        let hasPlans = false;
        SUBJECTS.forEach((s, i) => { if (inputs[i].value.trim() !== '') hasPlans = true; });

        if (!hasPlans) {
          showToast('Bhai, set a plan first! No shortcuts here 📅', 'error');
          return;
        }
        const persistentRow = ensureRowExists(date);
        SUBJECTS.forEach((s, i) => { persistentRow.plans[s] = inputs[i].value.trim(); });
        
        const allT = SUBJECTS.every(s => !persistentRow.plans[s] || persistentRow.plans[s].trim() === '' || persistentRow.ticks[s]);
        SUBJECTS.forEach(s => {
          if (persistentRow.plans[s] && persistentRow.plans[s].trim() !== '') {
            persistentRow.ticks[s] = !allT;
          }
        });
        if (typeof window.logActivity === 'function') window.logActivity('Ticked All Planner Items', date);
        saveData();
        tr.querySelectorAll('.tick-btn').forEach((b, i) => {
          const s = SUBJECTS[i];
          b.className = 'tick-btn' + (persistentRow.ticks[s] ? ' ticked' : '');
          b.textContent = persistentRow.ticks[s] ? '✓' : '';
        });
        if (currentSection === 'metrics') renderMetrics();
      });
      atd.appendChild(abtn); tr.appendChild(atd);
      tbody.appendChild(tr);
    }
  });

  if (!plannerScrolledToToday) {
    const todayEl = mobile
      ? cards.querySelector('.pcard.is-today')
      : tbody.querySelector('.is-today');
    if (todayEl) {
      setTimeout(() => todayEl.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
      plannerScrolledToToday = true;
    }
  }
}