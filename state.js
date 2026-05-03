// ============================================================
// STATE
// ============================================================
let data = {};
let editorUnlocked = false;
let pendingImportFile = null;
let testConfidenceVal = 3;
let currentSection = 'planner';
let openSubjects = new Set();
let currentUser = null;
let lastSoundTime = 0;
let lastSoundType = null;
let plannerScrolledToToday = false;
let appFrozen = false;
