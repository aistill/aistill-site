// AIStill.ai — Nutritional Intelligence Hub
// Tier 2: AI Results Interpretation
// v1.0 | Built for Cloudflare Pages + Workers
// Auth integration point: search "AUTH STUB" for drop-in hooks

(function initSession(global) {
  'use strict';

  const STORAGE_KEY = 'nih_session';
  const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

  function createSessionId() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return `nih_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function writeSession(payload) {
    const session = {
      sessionId: payload.sessionId || createSessionId(),
      inputType: payload.inputType,
      rawContent: payload.rawContent,
      context: payload.context || {
        ageRange: '',
        medications: '',
        primaryConcern: '',
        currentlySupplemening: null
      },
      timestamp: payload.timestamp || new Date().toISOString(),
      reportData: payload.reportData || null
    };

    // AUTH STUB: replace sessionStorage with server-side session once auth is available.
    global.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function readSession() {
    // AUTH STUB: replace sessionStorage with server-side session once auth is available.
    const raw = global.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      clearSession();
      return null;
    }
  }

  function updateReport(reportData) {
    const session = readSession();
    if (!session) return null;
    session.reportData = reportData;
    session.timestamp = new Date().toISOString();
    // AUTH STUB: replace sessionStorage with server-side session once auth is available.
    global.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    // AUTH STUB: replace sessionStorage with server-side session once auth is available.
    global.sessionStorage.removeItem(STORAGE_KEY);
  }

  function isExpired(session) {
    if (!session || !session.timestamp) return true;
    const created = Date.parse(session.timestamp);
    if (Number.isNaN(created)) return true;
    return Date.now() - created > SESSION_TTL_MS;
  }

  // AUTH HOOK — when user auth is implemented, attach userId from
  // auth session to nih_session before POST. Worker will log to
  // user profile. Replace sessionStorage with server-side session.
  global.NIHSession = {
    writeSession,
    readSession,
    updateReport,
    clearSession,
    isExpired
  };
})(window);
