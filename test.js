// ============================================================
// TEST RECORDS RENDER & LOGIC
// ============================================================
let testEditId = null;
let testEditConfidenceVal = 3;

function renderTestTable() {
  var mobile = isMobile();
  var table = document.getElementById('test-table');
  var cards = document.getElementById('test-cards');
  var tbody = document.getElementById('test-tbody');
  if (!table || !cards || !tbody) return;
  table.style.display = mobile ? 'none' : '';
  cards.style.display = mobile ? 'flex' : 'none';
  tbody.innerHTML = ''; cards.innerHTML = '';
  var empty = 'No test records yet. Hit + Add Test to log one.';
  if (!data.tests || data.tests.length === 0) {
    if (mobile) cards.innerHTML = '<div id="test-cards-empty">' + empty + '</div>';
    else tbody.innerHTML = '<tr><td colspan="8" class="empty-test">' + empty + '</td></tr>';
    return;
  }

  const fSubj = document.getElementById('test-filter-subj').value;
  const fType = document.getElementById('test-filter-type').value;
  let filteredTests = data.tests.filter(t => {
    let matchSubj = (fSubj === 'ALL') || (t.subject === fSubj);
    let matchType = (fType === 'ALL') || (t.type === fType);
    return matchSubj && matchType;
  });

  if (filteredTests.length === 0) {
    var noMatch = 'No tests match these filters. Try clearing them.';
    if (mobile) cards.innerHTML = '<div id="test-cards-empty">' + noMatch + '</div>';
    else tbody.innerHTML = '<tr><td colspan="8" class="empty-test">' + noMatch + '</td></tr>';
    return;
  }

  var sorted = [].concat(filteredTests).sort(function (a, b) { return b.date.localeCompare(a.date); });
  if (mobile) {
    sorted.forEach(function (t) {
      var subjLabel = t.subject === 'all' ? 'All Subjects' : (SUBJECT_LABELS[t.subject] || t.subject);
      var stars = '★'.repeat(t.confidence || 0) + '☆'.repeat(5 - (t.confidence || 0));
      var card = document.createElement('div'); card.className = 'tcard';
      var r1 = document.createElement('div'); r1.className = 'tcard-row1';
      var de = document.createElement('span'); de.className = 'tcard-date'; de.textContent = formatDateShort(t.date);
      var se = document.createElement('span'); se.className = 'tcard-subj'; se.textContent = subjLabel;
      var bg = document.createElement('span'); bg.className = 'test-type-badge test-type-' + t.type; bg.textContent = t.type;
      r1.append(de, se, bg); card.appendChild(r1);
      var r2 = document.createElement('div'); r2.className = 'tcard-row2';
      var co = document.createElement('span'); co.className = 'tcard-coverage'; co.textContent = t.coverage || '—';
      var sc = document.createElement('span'); sc.className = 'tcard-score'; sc.textContent = t.score ? '🎯 ' + t.score : '';
      var st = document.createElement('span'); st.className = 'tcard-stars'; st.textContent = stars;
      r2.append(co, sc, st); card.appendChild(r2);
      if (t.comment) { var cm = document.createElement('div'); cm.className = 'tcard-comment'; cm.textContent = t.comment; card.appendChild(cm); }
      var acts = document.createElement('div'); acts.className = 'tcard-actions';
      var eb = document.createElement('button'); eb.className = 'tcard-edit'; eb.textContent = '✎ Edit';
      var db = document.createElement('button'); db.className = 'tcard-del'; db.textContent = '✕ Delete';
      (function (id) {
        eb.addEventListener('click', function () { openTestEditModal(id); });
        db.addEventListener('click', function () { data.tests = data.tests.filter(function (x) { return x.id !== id; }); saveData(); renderTestTable(); });
      })(t.id);
      acts.append(eb, db); card.appendChild(acts);
      cards.appendChild(card);
    });
  } else {
    sorted.forEach(function (t) {
      var tr = document.createElement('tr'); tr.className = 'test-row';
      var stars = '★'.repeat(t.confidence || 0) + '☆'.repeat(5 - (t.confidence || 0));
      var subjLabel = t.subject === 'all' ? 'All Subjects' : (SUBJECT_LABELS[t.subject] || t.subject);
      tr.innerHTML = '<td style="font-family:var(--mono);font-size:12px;">' + formatDateShort(t.date) + '</td>'
        + '<td style="font-weight:600;">' + subjLabel + '</td>'
        + '<td style="font-size:12px;color:var(--text2);">' + (t.coverage || '—') + '</td>'
        + '<td><span class="test-type-badge test-type-' + t.type + '">' + t.type + '</span></td>'
        + '<td class="score-cell">' + (t.score || '—') + '</td>'
        + '<td><span class="test-star-display">' + stars + '</span></td>'
        + '<td class="comment-cell" title="' + (t.comment || '').replace(/"/g, '&quot;') + '">' + (t.comment || '—') + '</td>'
        + '<td style="display:flex;gap:6px;align-items:center;">'
        + '<span class="test-edit-btn" data-id="' + t.id + '" title="Edit" style="color:var(--accent);opacity:0;cursor:pointer;font-size:13px;">✎</span>'
        + '<span class="test-del" data-id="' + t.id + '" title="Delete">✕</span></td>';
      (function (id) {
        tr.querySelector('.test-del').addEventListener('click', function () { data.tests = data.tests.filter(function (x) { return x.id !== id; }); saveData(); renderTestTable(); });
        tr.querySelector('.test-edit-btn').addEventListener('click', function () { openTestEditModal(id); });
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
  if (!t) return;
  testEditId = id;
  testEditConfidenceVal = t.confidence || 3;
  document.getElementById('te-date').value = t.date;
  document.getElementById('te-subject').value = t.subject;
  document.getElementById('te-coverage').value = t.coverage || '';
  document.getElementById('te-type').value = t.type;
  document.getElementById('te-score').value = t.score || '';
  document.getElementById('te-comment').value = t.comment || '';
  updateTestEditStars(testEditConfidenceVal);
  playSound('pop');
  document.getElementById('test-edit-modal').classList.add('show');
}
function closeTestEditModal() { document.getElementById('test-edit-modal').classList.remove('show'); testEditId = null; }
function updateTestEditStars(val) {
  testEditConfidenceVal = val;
  document.querySelectorAll('#te-confidence-stars .star-pick').forEach(s => s.classList.toggle('on', parseInt(s.dataset.val) <= val));
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
  saveData(); closeTestEditModal(); renderTestTable();
  showToast('Updated! Glow-up applied. Suffu is proud ✨', 'success');
}

function openTestModal() {
  testConfidenceVal = 3;
  document.getElementById('tf-date').value = getTodayStr();
  document.getElementById('tf-subject').value = 'accounts';
  document.getElementById('tf-coverage').value = '';
  document.getElementById('tf-type').value = 'RTP';
  document.getElementById('tf-score').value = '';
  document.getElementById('tf-comment').value = '';
  updateTestStars(3);
  playSound('pop');
  document.getElementById('test-modal').classList.add('show');
}
function closeTestModal() { document.getElementById('test-modal').classList.remove('show'); }
function updateTestStars(val) {
  testConfidenceVal = val;
  document.querySelectorAll('#tf-confidence-stars .star-pick').forEach(s => s.classList.toggle('on', parseInt(s.dataset.val) <= val));
}
function saveTestRecord() {
  const date = document.getElementById('tf-date').value;
  if (!date) { showToast('When did this exam happen? Suffu needs a date 📆', 'error'); return; }
  data.tests.push({
    id: generateId('t'),
    date,
    subject: document.getElementById('tf-subject').value,
    coverage: document.getElementById('tf-coverage').value.trim(),
    type: document.getElementById('tf-type').value,
    score: document.getElementById('tf-score').value.trim(),
    confidence: testConfidenceVal,
    comment: document.getElementById('tf-comment').value.trim()
  });
  saveData(); closeTestModal(); renderTestTable();
  showToast('Test logged! Every attempt counts towards your success 📝', 'success');
}
