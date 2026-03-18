// ============================================================
// SCHEDULE RENDER
// ============================================================
function renderSchedule() {
  SCHED_KEYS.forEach((key, i) => {
    const body = document.getElementById('sched-body-' + i); if (!body) return;
    body.innerHTML = '';
    const slots = data.schedules[key].slots;
    if (slots.length === 0 && !editorUnlocked) { body.innerHTML = '<div class="empty-schedule">No slots added yet.</div>'; }
    else {
      slots.forEach((slot, si) => {
        const row = document.createElement('div'); row.className = 'slot-row';
        if (editorUnlocked) {
          const st = document.createElement('input'); st.type = 'time'; st.className = 'slot-time-input'; st.value = slot.start || '';
          st.addEventListener('change', () => { slot.start = st.value; saveData(); });
          const et = document.createElement('input'); et.type = 'time'; et.className = 'slot-time-input'; et.value = slot.end || '';
          et.addEventListener('change', () => { slot.end = et.value; saveData(); });
          const lb = document.createElement('input'); lb.type = 'text'; lb.className = 'slot-label-input'; lb.value = slot.label || ''; lb.placeholder = 'Subject / Activity';
          lb.addEventListener('change', () => { slot.label = lb.value; saveData(); });
          lb.addEventListener('keydown', e => { if (e.key === 'Enter') { slot.label = lb.value; saveData(); lb.blur(); } });
          const del = document.createElement('span'); del.className = 'slot-del'; del.textContent = '✕';
          del.addEventListener('click', () => { data.schedules[key].slots.splice(si, 1); saveData(); renderSchedule(); });
          row.append(st, et, lb, del);
        } else {
          const t = document.createElement('span'); t.className = 'slot-time'; t.textContent = (slot.start || '--:--') + ' – ' + (slot.end || '--:--');
          const l = document.createElement('span'); l.className = 'slot-label'; l.textContent = slot.label || '—';
          row.append(t, l);
        }
        body.appendChild(row);
      });
    }
    if (editorUnlocked) {
      const ab = document.createElement('button'); ab.className = 'add-slot-btn'; ab.textContent = '+ Add Slot';
      ab.addEventListener('click', () => { data.schedules[key].slots.push({ start: '', end: '', label: '' }); saveData(); renderSchedule(); });
      body.appendChild(ab);
    }
  });
}
