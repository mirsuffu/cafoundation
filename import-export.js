// ============================================================
// IMPORT & EXPORT
// ============================================================
function exportData() {
  const today = toDateStr(new Date());
  const exportPayload = {
    ...data,
    _signature: APP_SIGNATURE,
    _exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'jgsuffu-backup-' + today + '.json'; a.click();
  URL.revokeObjectURL(url); showToast('Backed up! A smart move by a smart student 💾', 'success');
}

function handleImportFile(e) {
  const file = e.target.files[0]; if (!file) return;
  pendingImportFile = file;
  playSound('pop');
  document.getElementById('import-modal').classList.add('show');
  e.target.value = '';
}

function confirmImport() {
  if (!pendingImportFile) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported._signature !== APP_SIGNATURE) {
        showToast('Unauthorized file! You can\'t bypass Suffu\'s security 🚫', 'error');
        pendingImportFile = null;
        document.getElementById('import-modal').classList.remove('show');
        return;
      }
      data = imported;
      if (!data.tests) data.tests = [];
      saveData(); renderAll();
      showToast('Data imported! Welcome back to the grind, let\'s crush it 💪', 'success');
    }
    catch { showToast('That file is cooked 🤌 Not valid JSON.', 'error'); }
    pendingImportFile = null; document.getElementById('import-modal').classList.remove('show');
  };
  reader.readAsText(pendingImportFile);
}
