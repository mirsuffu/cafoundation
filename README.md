# JG. SUFFU — CA Foundation Tracker

![Welcome Dashboard](https://img.shields.io/badge/Status-Active-success) ![Vanilla](https://img.shields.io/badge/Tech-Vanilla%20JS/CSS/HTML-yellow) ![Firebase](https://img.shields.io/badge/Backend-Firebase%20Auth%20%26%20Firestore-orange)

A highly responsive, perfectly isolated, single-page web app built to organize and track preparation specifically for the **CA Foundation Examinations (September 2026)**.

Designed completely without frameworks, this application prioritizes a lightning-fast offline-first local cache paired with seamlessly debounced Firebase cloud synchronization.

## ✨ Features
1. **📅 Dynamic Planner**: Interactively tick off your daily goals across Accounts, Law, Maths, and Economics.
2. **📊 Real-time Metrics Dashboard**: Visualizes your preparation velocity, streaks, days remaining, and confidence/difficulty graphs.
3. **📚 Subject Tracking**: Manage chapters based on Difficulty and Confidence ratings, automatically highlighting flagged chapters that need priority revision.
4. **📝 Test Logging**: Keep a rigorous history of every RTP, MTP, and PYQ attempt alongside your subjective comments and scores.
5. **🔐 Editor Mode Protection**: Accidental deletions or config overrides are securely locked behind an Editor Password, ensuring your data cannot be easily wiped.
6. **📱 Adaptive UI**: Flawless responsive design matching desktop sidebars natively shifting to a mobile-friendly bottom-navigation tab layout.

## 🛠️ Architecture
- **Frontend Layer**: 100% Vanilla HTML, CSS (`main.css`), and JavaScript (`app.js`). No build steps, no NPM overhead.
- **Backend Syncing**: Firebase v12 (Modular ESM).
- **Authentication**: Gated login screen completely cutting off DOM layout bleed/bypasses before Identity validation.
- **Data Persistence**: Local `localStorage` first approach followed natively by throttling `Firestore setDoc` merge updates to avoid quota overages.

## 🚀 Deployment
This project is completely static and ready to be hosted out-of-the-box on GitHub Pages. Data synchronization is managed entirely via the Firebase Javascript client side APIs.

> *"Not to mention, but someone genuinely wants your success." — JG. SUFFU*
