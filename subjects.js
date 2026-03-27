// ============================================================
// SUBJECTS & CHAPTERS RENDER
// ============================================================
function getPriorityFlag(d, c) {
  if (d >= 3 && c <= 1) return '<span style="color:var(--danger)" title="High Priority">⚑</span>';
  if ((d >= 2 && c <= 1) || (d >= 3 && c <= 2)) return '<span style="color:var(--warning)" title="Medium Priority">⚑</span>';
  return '';
}

function makeLevelGroup(container, initVal, onChangeFn) {
  container.innerHTML = '';
  container.className = 'level-group';
  const levels = [
    { val: 1, label: 'Low' },
    { val: 2, label: 'Med' },
    { val: 3, label: 'High' }
  ];
  levels.forEach(l => {
    const btn = document.createElement('button');
    btn.className = 'level-btn' + (initVal === l.val ? ' active' : '');
    btn.textContent = l.label;
    btn.dataset.level = l.val;
    btn.onclick = () => {
      playSound('click');
      container.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChangeFn(l.val);
    };
    container.appendChild(btn);
  });
}

function renderSubjectsInternal() {
  var body = document.getElementById('subjects-body'); if (!body) return;
  body.innerHTML = '';
  var mobile = isMobile();
  data.subjects.forEach(function (subj) {
    var isOpen = openSubjects.has(subj.id);
    var block = document.createElement('div');
    block.className = 'subject-block' + (isOpen ? ' open' : '');
    block.dataset.subjid = subj.id;
    var avgConf = subj.chapters.length ? (subj.chapters.reduce(function (a, c) { return a + c.confidence; }, 0) / subj.chapters.length).toFixed(1) : '—';
    var flags = subj.chapters.filter(function (c) { 
        return (c.difficulty >= 3 && c.confidence <= 1) || (c.difficulty >= 2 && c.confidence <= 1) || (c.difficulty >= 3 && c.confidence <= 2);
    }).length;
    var header = document.createElement('div'); header.className = 'subject-header';
    header.innerHTML = '<span class="subject-name">' + subj.name + '</span>'
      + '<div class="subject-meta"><span>📖 ' + subj.chapters.length + ' chapters</span>'
      + '<span>⭐ Avg Conf: ' + avgConf + '</span>'
      + (flags ? '<span style="color:var(--warning)">⚑ ' + flags + ' flagged</span>' : '') + '</div>'
      + '<span class="subject-chevron">▶</span>';
    header.addEventListener('click', function () { 
      playSound('click');
      var n = block.classList.toggle('open'); if (n) openSubjects.add(subj.id); else openSubjects.delete(subj.id); 
    });
    var bodyEl = document.createElement('div'); bodyEl.className = 'subject-body';
    var chapterList = document.createElement('div'); chapterList.className = 'chapter-list';
    if (subj.chapters.length === 0 && !editorUnlocked) { chapterList.innerHTML = '<div class="empty-chapters">No chapters yet. Unlock Editor Mode to add chapters.</div>'; }
    subj.chapters.forEach(function (ch, ci) {
      if(!ch.status) ch.status = 'Pending';
      var row = document.createElement('div'); row.className = 'chapter-row';
      if (editorUnlocked) {
        var inp = document.createElement('input'); inp.type = 'text'; inp.className = 'chapter-name-input'; inp.value = ch.name;
        inp.addEventListener('change', function () { ch.name = inp.value; saveData(); });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { ch.name = inp.value; saveData(); inp.blur(); } });
        row.appendChild(inp);
      } else {
        var nm = document.createElement('span'); nm.className = 'chapter-name'; nm.textContent = ch.name; row.appendChild(nm);
      }
      var flag = document.createElement('span'); flag.className = 'priority-flag'; flag.innerHTML = getPriorityFlag(ch.difficulty, ch.confidence);
      
      var statSel = document.createElement('select');
      statSel.className = 'chapter-status-select form-input';
      statSel.style.cssText = 'font-size:11px; padding:2px 6px; border-radius:4px; height:22px; margin-right:6px; cursor:pointer;';
      statSel.innerHTML = '<option value="Pending">Pending</option><option value="In-Progress">In-Progress</option><option value="Completed">Completed</option>';
      statSel.value = ch.status;
      statSel.addEventListener('change', () => { 
        playSound('click');
        ch.status = statSel.value; 
        saveData(); 
        if(currentSection === 'metrics') renderMetrics(); 
      });

      var dl = document.createElement('span'); dl.className = 'rating-label'; dl.textContent = 'Diff';
      var ds = document.createElement('span'); ds.className = 'level-group';
      (function (ch, flag) { makeLevelGroup(ds, ch.difficulty, function (v) { ch.difficulty = v; saveData(); flag.innerHTML = getPriorityFlag(ch.difficulty, ch.confidence); refreshSubjectMeta(subj, header); }); })(ch, flag);
      var cl = document.createElement('span'); cl.className = 'rating-label'; cl.textContent = 'Conf';
      var cs = document.createElement('span'); cs.className = 'level-group';
      (function (ch, flag) { makeLevelGroup(cs, ch.confidence, function (v) { ch.confidence = v; saveData(); flag.innerHTML = getPriorityFlag(ch.difficulty, ch.confidence); refreshSubjectMeta(subj, header); }); })(ch, flag);
      
      if (mobile) {
        var rrow = document.createElement('div'); rrow.className = 'chapter-ratings-mobile';
        rrow.append(statSel, dl, ds, cl, cs, flag);
        if (editorUnlocked) {
          var acts = document.createElement('div'); acts.style.cssText = 'display:flex; gap:8px; margin-left:auto; align-items:center;';
          (function (ci) { up.addEventListener('click', function () { playSound('click'); if (ci > 0) { var t = subj.chapters[ci - 1]; subj.chapters[ci - 1] = subj.chapters[ci]; subj.chapters[ci] = t; saveData(); renderSubjectsInternal(); } }); })(ci);
          (function (ci) { dn.addEventListener('click', function () { playSound('click'); if (ci < subj.chapters.length - 1) { var t = subj.chapters[ci + 1]; subj.chapters[ci + 1] = subj.chapters[ci]; subj.chapters[ci] = t; saveData(); renderSubjectsInternal(); } }); })(ci);
          (function (ci) { del.addEventListener('click', function () { playSound('click'); subj.chapters.splice(ci, 1); saveData(); renderSubjectsInternal(); }); })(ci);
          acts.append(up, dn, del);
          rrow.appendChild(acts);
        }
        row.appendChild(rrow);
      } else {
        cl.style.marginLeft = '10px';
        row.append(statSel, flag, dl, ds, cl, cs);
        if (editorUnlocked) {
          (function (ci) { up.addEventListener('click', function () { playSound('click'); if (ci > 0) { var t = subj.chapters[ci - 1]; subj.chapters[ci - 1] = subj.chapters[ci]; subj.chapters[ci] = t; saveData(); renderSubjectsInternal(); } }); })(ci);
          (function (ci) { dn.addEventListener('click', function () { playSound('click'); if (ci < subj.chapters.length - 1) { var t = subj.chapters[ci + 1]; subj.chapters[ci + 1] = subj.chapters[ci]; subj.chapters[ci] = t; saveData(); renderSubjectsInternal(); } }); })(ci);
          (function (ci) { del.addEventListener('click', function () { playSound('click'); subj.chapters.splice(ci, 1); saveData(); renderSubjectsInternal(); }); })(ci);
          row.append(up, dn, del);
        }
      }
      chapterList.appendChild(row);
    });
    bodyEl.appendChild(chapterList);
    if (editorUnlocked) {
      var ab = document.createElement('button'); ab.className = 'subject-add-btn'; ab.textContent = '+ Add Chapter';
      (function (subj) { ab.addEventListener('click', function () { playSound('click'); openSubjects.add(subj.id); subj.chapters.push({ id: generateId('ch'), name: 'New Chapter', difficulty: 2, confidence: 2, status: 'Pending' }); saveData(); renderSubjectsInternal(); }); })(subj);
      bodyEl.appendChild(ab);
    }
    block.append(header, bodyEl); body.appendChild(block);
  });
}

function refreshSubjectMeta(subj, header) {
  const avgConf = subj.chapters.length ? (subj.chapters.reduce((a, c) => a + c.confidence, 0) / subj.chapters.length).toFixed(1) : '—';
  const flags = subj.chapters.filter(c => (c.difficulty >= 3 && c.confidence <= 1) || (c.difficulty >= 2 && c.confidence <= 1) || (c.difficulty >= 3 && c.confidence <= 2)).length;
  const meta = header.querySelector('.subject-meta');
  if (meta) meta.innerHTML = `<span>📖 ${subj.chapters.length} chapters</span><span>⭐ Avg Conf: ${avgConf}</span>${flags ? `<span style="color:var(--warning)">⚑ ${flags} flagged</span>` : ''}`;
}
