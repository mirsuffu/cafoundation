// ============================================================
// FIREBASE SDK
// ============================================================
import { initializeApp }                        from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword,
         signOut, onAuthStateChanged }           from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js';
import { initializeFirestore, persistentLocalCache,
         doc, getDoc, setDoc }                  from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDptAm-v3ttplLXlun9curjnerPv2nvoH0",
  authDomain: "foundation-tracker.firebaseapp.com",
  projectId: "foundation-tracker",
  storageBucket: "foundation-tracker.firebasestorage.app",
  messagingSenderId: "386763220779",
  appId: "1:386763220779:web:2c4fea0ea4270576c5476e"
};

const fbApp  = initializeApp(firebaseConfig);
const fbAuth = getAuth(fbApp);
// initializeFirestore with persistent cache (replaces deprecated enableIndexedDbPersistence)
const fbDb   = initializeFirestore(fbApp, { localCache: persistentLocalCache() });

// Make available globally
window._fbAuth = fbAuth;
window._fbDb   = fbDb;
window._signInWithEmailAndPassword = signInWithEmailAndPassword;
window._signOut = signOut;
window._onAuthStateChanged = onAuthStateChanged;
window._doc    = doc;
window._getDoc = getDoc;
window._setDoc = setDoc;
