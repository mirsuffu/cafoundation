// ============================================================
// TEST RECORDS RENDER & LOGIC
// ============================================================
let testEditId = null;
let testEditConfidenceVal = 3;

// We use this flag to know if the user is converting a scheduled test into a completed test
window.completingScheduledTestId = null;

function renderTestTable() {
  var mobile = isMobile();
  var table = document.getElementById('test-table');
  var cards = document.getElementById('test-cards');
  var tbody = document.getElementById('test-tbody');
  if (!table || !cards || !tbody) return;
  table.style.display = mobile ? 'none' : '';
  cards.style.display = mobile ? 'flex' : 'none';
  tbody.innerHTML = ''; cards.innerHTML = '';
  var empty = 'No test records yet. Hit + Add Test to log one or schedule an upcoming test.';
  if (!data.tests || data.tests.length === 0) {
    if (mobile) cards.innerHTML = '<div id="test-cards-empty">' + empty + '</div>';
    else tbody.innerHTML = '<tr><td colspan="8" class="empty-test">' + empty + '</td></tr>';
    return;
  }

  const fSubj = document.getElementById('test-filter-subj').value;
  const fType = document.getElementById('test-filter-type').value;
  let filteredTests = data.tests.filter(t => {
    let matchSubj = (fSubj === 'ALL') || (t.subject === fSubj);
    // Scheduled is treated as a pseudo-type for filtering
    let isTType = t.isScheduled ? 'Scheduled' : t.type;
    let matchType = (fType === 'ALL') || (isTType === fType);
    return matchSubj && matchType;
  });

  if (filteredTests.length === 0) {
    var noMatch = 'No tests match these filters. Try clearing them.';
    if (mobile) cards.innerHTML = '<div id="test-cards-empty">' + noMatch + '</div>';
    else tbody.innerHTML = '<tr><td colspan="8" class="empty-test">' + noMatch + '</td></tr>';
    return;
  }

  const todayStr = getTodayStr();
  var sorted = [].concat(filteredTests).sort(function (a, b) { return b.date.localeCompare(a.date); });
  
  if (mobile) {
    sorted.forEach(function (t) {
      var isOverdue = t.isScheduled && t.date < todayStr;
      var isDue = t.isScheduled && t.date <= todayStr;
      
      var subjLabel = t.subject === 'all' ? 'All Subjects' : (SUBJECT_LABELS[t.subject] || t.subject);
      var confLevels = { 1: 'Low', 2: 'Medium', 3: 'High' };
      var confLabel = confLevels[t.confidence] || '—';
      var card = document.createElement('div'); 
      card.className = 'tcard' + (isOverdue ? ' overdue' : '');
      
      var r1 = document.createElement('div'); r1.className = 'tcard-row1';
      var de = document.createElement('span'); de.className = 'tcard-date'; de.textContent = formatDateShort(t.date);
      var se = document.createElement('span'); se.className = 'tcard-subj'; se.textContent = subjLabel;
      
      var bg = document.createElement('span'); 
      bg.className = t.isScheduled ? 'test-type-badge test-type-Scheduled' : 'test-type-badge test-type-' + t.type; 
      bg.textContent = t.isScheduled ? 'Scheduled' : t.type;
      
      r1.append(de, se, bg); card.appendChild(r1);
      
      var r2 = document.createElement('div'); r2.className = 'tcard-row2';
      var co = document.createElement('span'); co.className = 'tcard-coverage'; co.textContent = t.coverage || '—';
      var sc = document.createElement('span'); sc.className = 'tcard-score'; 
      sc.textContent = t.isScheduled ? '⏳ Pending' : (t.score ? '🎯 ' + t.score : '');
      
      var st = document.createElement('span'); st.className = 'tcard-stars'; 
      st.textContent = t.isScheduled ? (t.duration ? t.duration + ' mins' : '—') : confLabel;
      
      r2.append(co, sc, st); card.appendChild(r2);
      
      const noteStr = t.isScheduled ? t.note : t.comment;
      if (noteStr) { var cm = document.createElement('div'); cm.className = 'tcard-comment'; cm.textContent = noteStr; card.appendChild(cm); }
      
      var acts = document.createElement('div'); acts.className = 'tcard-actions';
      
      if (isDue) {
        var cb = document.createElement('button'); cb.className = 'mark-completed-btn'; cb.textContent = '✓ Mark Completed';
        (function(id) { cb.addEventListener('click', function() { playSound('click'); markTestCompleted(id); }); })(t.id);
        acts.appendChild(cb);
      }
      
      // Only allow editing for completed tests, but allow deletion for both
      if (!t.isScheduled) {
        var eb = document.createElement('button'); eb.className = 'tcard-edit'; eb.textContent = '✎ Edit';
        (function (id) { eb.addEventListener('click', function () { playSound('click'); openTestEditModal(id); }); })(t.id);
        acts.appendChild(eb);
      }
      
      var db = document.createElement('button'); db.className = 'tcard-del'; db.textContent = '✕ Delete';
      (function (id) { db.addEventListener('click', function () { playSound('click'); data.tests = data.tests.filter(function (x) { return x.id !== id; }); if (typeof window.logActivity === 'function') window.logActivity('Deleted Test Record'); saveData(); renderTestTable(); }); })(t.id);
      
      acts.appendChild(db); 
      card.appendChild(acts);
      cards.appendChild(card);
    });
  } else {
    sorted.forEach(function (t) {
      var isOverdue = t.isScheduled && t.date < todayStr;
      var isDue = t.isScheduled && t.date <= todayStr;
      
      var tr = document.createElement('tr'); 
      tr.className = 'test-row' + (isOverdue ? ' overdue' : '');
      
      var confLevels = { 1: 'Low', 2: 'Medium', 3: 'High' };
      var confLabel = confLevels[t.confidence] || '—';
      var subjLabel = t.subject === 'all' ? 'All Subjects' : (SUBJECT_LABELS[t.subject] || t.subject);
      
      var typeBadgeHtml = t.isScheduled ? '<span class="test-type-badge test-type-Scheduled">Scheduled</span>' : '<span class="test-type-badge test-type-' + t.type + '">' + t.type + '</span>';
      var scoreHtml = t.isScheduled ? '<span style="color:var(--text2);">⏳ Pending</span>' : (t.score || '—');
      var starOrTimeHtml = t.isScheduled ? (t.duration ? t.duration + ' mins' : '—') : ('<span class="test-conf-display" style="font-weight:600;">' + confLabel + '</span>');
      var noteStr = t.isScheduled ? t.note : t.comment;
      
      var actionHtml = '<td style="display:flex;gap:6px;align-items:center;justify-content:flex-end;">';
      if (isDue) {
         actionHtml += '<button class="mark-completed-btn" data-id="' + t.id + '">✓ Completed</button>';
      }
      if (!t.isScheduled) {
         actionHtml += '<span class="test-edit-btn" data-id="' + t.id + '" title="Edit" style="color:var(--accent);opacity:0;cursor:pointer;font-size:13px;margin-left:8px;">✎</span>';
      }
      actionHtml += '<span class="test-del" data-id="' + t.id + '" title="Delete" style="margin-left:8px;">✕</span></td>';

      tr.innerHTML = '<td style="font-family:var(--mono);font-size:12px;">' + formatDateShort(t.date) + '</td>'
        + '<td style="font-weight:600;">' + subjLabel + '</td>'
        + '<td style="font-size:12px;color:var(--text2);">' + (t.coverage || '—') + '</td>'
        + '<td>' + typeBadgeHtml + '</td>'
        + '<td class="score-cell">' + scoreHtml + '</td>'
        + '<td>' + starOrTimeHtml + '</td>'
        + '<td class="comment-cell" title="' + (noteStr || '').replace(/"/g, '&quot;') + '">' + (noteStr || '—') + '</td>'
        + actionHtml;
      
      (function (id) {
        tr.querySelector('.test-del').addEventListener('click', function () { playSound('click'); data.tests = data.tests.filter(function (x) { return x.id !== id; }); if (typeof window.logActivity === 'function') window.logActivity('Deleted Test Record'); saveData(); renderTestTable(); });
        var editBtn = tr.querySelector('.test-edit-btn');
        if(editBtn) editBtn.addEventListener('click', function () { playSound('click'); openTestEditModal(id); });
        var compBtn = tr.querySelector('.mark-completed-btn');
        if(compBtn) compBtn.addEventListener('click', function() { playSound('click'); markTestCompleted(id); });
      })(t.id);
      
      tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll('.test-row').forEach(function (row) {
      row.addEventListener('mouseenter', function () { row.querySelectorAll('.test-edit-btn,.test-del').forEach(function (b) { b.style.opacity = '1'; }); });
      row.addEventListener('mouseleave', function () { row.querySelectorAll('.test-edit-btn,.test-del').forEach(function (b) { b.style.opacity = '0'; }); });
    });
  }
}

function openTestEditModal(id) {
  const t = data.tests.find(x => x.id === id);
  if (!t || t.isScheduled) return;
  testEditId = id;
  testEditConfidenceVal = t.confidence || 3;
  document.getElementById('te-date').value = t.date;
  document.getElementById('te-subject').value = t.subject;
  document.getElementById('te-coverage').value = t.coverage || '';
  document.getElementById('te-type').value = t.type;
  document.getElementById('te-score').value = t.score || '';
  document.getElementById('te-comment').value = t.comment || '';
  initLevelPicker('te-confidence-levels', t.confidence || 2, (v) => { testEditConfidenceVal = v; });
  playSound('pop');
  document.getElementById('test-edit-modal').classList.add('show');
}
function closeTestEditModal() { document.getElementById('test-edit-modal').classList.remove('show'); testEditId = null; }
function initLevelPicker(containerId, initVal, onChangeFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const btns = container.querySelectorAll('.level-btn');
  btns.forEach(btn => {
    const val = parseInt(btn.dataset.val);
    btn.classList.toggle('active', val === initVal);
    btn.onclick = () => {
      playSound('click');
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChangeFn(val);
    };
  });
}
function saveTestEdit() {
  if (!testEditId) return;
  const t = data.tests.find(x => x.id === testEditId);
  if (!t) return;
  t.date = document.getElementById('te-date').value;
  t.subject = document.getElementById('te-subject').value;
  t.coverage = document.getElementById('te-coverage').value.trim();
  t.type = document.getElementById('te-type').value;
  t.score = document.getElementById('te-score').value.trim();
  t.confidence = testEditConfidenceVal;
  t.comment = document.getElementById('te-comment').value.trim();
  if (typeof window.logActivity === 'function') window.logActivity('Edited Test Record', `${t.type} - ${SUBJECT_LABELS[t.subject] || t.subject}`);
  saveData(); closeTestEditModal(); renderTestTable();
  if (currentSection === 'metrics') renderMetrics();
  showToast('Updated! Glow-up applied. Suffu is proud ✨', 'success');
}

// Open Test Modal with optional prefilling from a Scheduled Test
function openTestModal(prefillId = null) {
  testConfidenceVal = 3;
  
  if (prefillId) {
    const st = data.tests.find(x => x.id === prefillId);
    if(st) {
      window.completingScheduledTestId = prefillId;
      document.getElementById('tf-date').value = st.date;
      document.getElementById('tf-subject').value = st.subject;
      document.getElementById('tf-coverage').value = st.coverage || '';
      document.getElementById('tf-type').value = 'RTP'; // default to RTP as scheduled test doesn't have an exam type usually
    }
  } else {
    window.completingScheduledTestId = null;
    document.getElementById('tf-date').value = getTodayStr();
    document.getElementById('tf-subject').value = 'accounts';
    document.getElementById('tf-coverage').value = '';
    document.getElementById('tf-type').value = 'RTP';
  }
  
  document.getElementById('tf-score').value = '';
  document.getElementById('tf-comment').value = '';
  initLevelPicker('tf-confidence-levels', 2, (v) => { testConfidenceVal = v; });
  testConfidenceVal = 2;
  playSound('pop');
  document.getElementById('test-modal').classList.add('show');
}

function closeTestModal() { 
  document.getElementById('test-modal').classList.remove('show'); 
  window.completingScheduledTestId = null;
}
// Removed updateTestStars

function saveTestRecord() {
  const date = document.getElementById('tf-date').value;
  if (!date) { showToast('When did this exam happen? Suffu needs a date 📆', 'error'); return; }
  
  // If we are fulfilling a scheduled test, remove the old scheduled placeholder
  if (window.completingScheduledTestId) {
    data.tests = data.tests.filter(x => x.id !== window.completingScheduledTestId);
    window.completingScheduledTestId = null;
  }
  
  data.tests.push({
    id: generateId('t'),
    date,
    subject: document.getElementById('tf-subject').value,
    coverage: document.getElementById('tf-coverage').value.trim(),
    type: document.getElementById('tf-type').value,
    score: document.getElementById('tf-score').value.trim(),
    confidence: testConfidenceVal,
    comment: document.getElementById('tf-comment').value.trim(),
    isScheduled: false // explicitly state it is a real completed test
  });
  if (typeof window.logActivity === 'function') window.logActivity('Added Test Record', `${document.getElementById('tf-type').value} - ${SUBJECT_LABELS[document.getElementById('tf-subject').value] || document.getElementById('tf-subject').value}`);
  saveData(); closeTestModal(); renderTestTable();
  if (currentSection === 'metrics') renderMetrics();
  showToast('Test logged! Every attempt counts towards your success 📝', 'success');
}

function markTestCompleted(id) {
  openTestModal(id);
}

// --- Schedule Test Modal Logic ---
function openScheduleTestModal() {
  document.getElementById('st-date').value = getTodayStr();
  document.getElementById('st-subject').value = 'accounts';
  document.getElementById('st-coverage').value = '';
  document.getElementById('st-duration').value = '';
  document.getElementById('st-note').value = '';
  playSound('pop');
  document.getElementById('schedule-test-modal').classList.add('show');
}

function closeScheduleTestModal() {
  document.getElementById('schedule-test-modal').classList.remove('show');
}

function saveScheduledTest() {
  const date = document.getElementById('st-date').value;
  if (!date) { showToast('Pick a date to schedule this test! 📆', 'error'); return; }
  
  data.tests.push({
    id: generateId('st'),
    date,
    subject: document.getElementById('st-subject').value,
    coverage: document.getElementById('st-coverage').value.trim(),
    duration: document.getElementById('st-duration').value.trim(),
    note: document.getElementById('st-note').value.trim(),
    isScheduled: true
  });
  
  if (typeof window.logActivity === 'function') window.logActivity('Scheduled Test', SUBJECT_LABELS[document.getElementById('st-subject').value] || document.getElementById('st-subject').value);
  saveData(); closeScheduleTestModal(); renderTestTable();
  showToast('Test scheduled! Mark it on your calendar 🗓️', 'success');
}
