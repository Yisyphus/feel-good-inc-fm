// Cloud sync with Firebase: your library, favorites, removed songs, chosen versions, the cycle position and the
// commercials live in your own Firestore space (users/<your id>/radio/...), so every device sees the same radio.
// No sign-in needed: each device signs in by itself, anonymously, and keeps everything in one shared space named by
// a secret radio code (radios/<code>/radio/...). Every device with the same code shares and merges the same radio.
// The code lives in this browser, in the helper's data folder on the PC (so a wiped browser finds it again), and on
// the owner's report page. Signing in with Google instead uses that account's own space (users/<uid>/radio/...).
// If firebase-config.js is empty, or the internet is down, the radio simply works without the cloud.
(function () {
  const C = window.Cloud = { enabled: false, user: null, status: 'off', onRemote: null, onStatus: null, onSignedIn: null, merge: null, ready: false };
  // ready: this device has merged with the cloud since it signed in. Until then nothing is written, so a device that
  // starts with an empty or old library can never replace what the cloud holds.
  const cfg = window.FIREBASE_CONFIG;
  const DEVICE = (() => { try { let d = localStorage.getItem('pbd-device'); if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem('pbd-device', d); } return d; } catch { return 'dev-' + Math.random().toString(36).slice(2, 8); } })();
  C.device = DEVICE;
  const setStatus = s => { C.status = s; if (C.onStatus) try { C.onStatus(s); } catch {} };
  let db, authKnown, authResolve;
  C.authKnown = new Promise(r => { authResolve = r; authKnown = r; });
  if (!cfg || !cfg.apiKey || !window.firebase) { authResolve(null); return; }
  try {
    firebase.initializeApp(cfg);
    db = firebase.firestore();
    try { db.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch {}   // works offline, catches up later
    C.enabled = true;
  } catch (e) { console.warn('[cloud] init failed', e); authResolve(null); return; }

  // ---- the radio code: from a link (?code=...), this browser, or the helper; a new one if there is none ----
  const WORDS = 'apple bamboo banana basil beach berry bird blue breeze bubble button cactus candy canyon cherry citrus cloud clover coast cocoa comet coral cosmic cotton crystal daisy desert dolphin dragon dream dune echo ember falcon fern fig firefly flame flute forest fox galaxy garden gecko ginger glow grape harbor hazel honey island ivy jade jasmine jelly jungle kiwi koala lagoon lantern lemon lily lime lotus lunar mango maple marble meadow melon meteor mint mocha moon mosaic nectar neon nova oasis ocean olive orbit orchid otter owl palm panda papaya peach pearl pebble pepper petal pine pixel planet plum pony poppy prism pumpkin puzzle quartz rabbit radio rain raven reef river robin rocket rose ruby saffron sail sapphire shell silver sky snow sparrow spice star storm sugar summer sun sunset swan tango thunder tiger topaz tulip tundra turtle valley velvet violet wave willow wind winter zebra'.split(' ');
  const CODE_RE = /^[a-z]+-[a-z]+-[a-z]+-[a-z]+-[0-9]{3}$/;
  C.newCode = () => { const r = new Uint32Array(5); crypto.getRandomValues(r); return [0, 1, 2, 3].map(i => WORDS[r[i] % WORDS.length]).join('-') + '-' + String(r[4] % 1000).padStart(3, '0'); };
  const norm = c => String(c || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  // the helper's copy carries the fresh start it belongs to: after a fresh start (R.freshStart) the radio gets a new code
  const FRESH = String((window.RADIO || {}).freshStart || '');
  const keepCode = c => { try { localStorage.setItem('fgi-code', c); } catch {} fetch('/api/code', { method: 'POST', body: c + (FRESH ? ' ' + FRESH : '') }).catch(() => {}); };
  C.codeReady = (async () => {
    let c = '';
    try { const q = new URLSearchParams(location.search).get('code'); if (q && CODE_RE.test(norm(q))) { c = norm(q); history.replaceState(null, '', location.pathname); } } catch {}
    let mine = ''; try { mine = localStorage.getItem('fgi-code') || ''; } catch {}
    let helper = ''; try { const r = await fetch('/api/code', { cache: 'no-store' }); if (r.ok) { const [hc, hf] = String(await r.text()).trim().split(' '); if ((hf || '') === FRESH) helper = norm(hc); } } catch {}
    if (!CODE_RE.test(helper)) helper = '';
    c = c || helper || (CODE_RE.test(mine) ? mine : '') || C.newCode();   // on the PC, the helper's copy wins: it outlives the browser
    if (c !== mine || c !== helper) keepCode(c);
    return (C.code = c);
  })();
  C.setCode = async c => { c = norm(c); if (!CODE_RE.test(c)) throw new Error('That is not a radio code (it looks like sunny-tiger-mango-ocean-123).'); await C.flush(); keepCode(c); C.code = c; setTimeout(() => location.reload(), 300); };
  C.isAnon = () => !!(C.user && C.user.isAnonymous);
  const ref = name => (C.isAnon() ? db.collection('radios').doc(C.code) : db.collection('users').doc(C.user.uid)).collection('radio').doc(name);
  // Usage log (no sign-in needed): one small line per listening session, readable only by the radio's owner.
  // It holds the day, the start time, the minutes played, and website or app. Nothing about what was played.
  C.logUsage = (id, data) => db.collection('usage').doc(id).set(data, { merge: true }).catch(e => console.warn('[usage]', e.code || e));
  let unsub = [];
  firebase.auth().onAuthStateChanged(async u => {
    if (!u) {   // nobody signed in: sign in by itself, anonymously (no account, nothing to type)
      try { await firebase.auth().signInAnonymously(); return; }   // onAuthStateChanged comes again with the new user
      catch (e) { console.warn('[cloud] anonymous sign-in failed', e.code || e); C.anonError = e.code || String(e); }
    }
    if (u && u.isAnonymous) await C.codeReady;
    C.user = u || null; C.ready = false;
    unsub.forEach(f => f()); unsub = [];
    setStatus(u ? 'signed in' : 'signed out');
    authKnown(u || null);
    if (u) { listen(); if (C.onSignedIn) Promise.resolve().then(() => C.onSignedIn(u)).catch(() => {}); }
  });
  C.signIn = async () => {
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    try { await firebase.auth().signInWithPopup(p); }
    catch (e) { if (/popup/i.test(e.code || '')) await firebase.auth().signInWithRedirect(p); else throw e; }
  };
  C.signOut = () => firebase.auth().signOut();

  // ---- reading ----
  C.pull = async () => {
    if (!C.user) return null;
    const [m, c, a] = await Promise.all(['main', 'cache', 'ads'].map(n => ref(n).get().then(d => d.exists ? d.data() : null)));
    if (!m) return { empty: true, ads: a };
    const lib = JSON.parse(m.json || '{}');
    if (c && c.json) lib.cache = JSON.parse(c.json);
    return { lib, savedAt: m.savedAt || 0, device: m.device, ads: a };
  };
  // live updates from your other devices
  function listen() {
    unsub.push(ref('main').onSnapshot(d => {
      if (!d.exists || d.metadata.hasPendingWrites) return;
      const m = d.data(); if (m.device === DEVICE) return;
      ref('cache').get().then(c => {
        const lib = JSON.parse(m.json || '{}'); if (c.exists && c.data().json) lib.cache = JSON.parse(c.data().json);
        if (C.onRemote) C.onRemote({ lib, savedAt: m.savedAt || 0 });
      }).catch(() => {});
    }, () => {}));
    unsub.push(ref('ads').onSnapshot(d => {
      if (!d.exists || d.metadata.hasPendingWrites) return;
      const a = d.data(); if (a.device === DEVICE) return;
      if (C.onRemoteAds) C.onRemoteAds(a);
    }, () => {}));
  }

  // ---- writing: grouped, at most every 20 seconds, and at once when the window is hidden or closed ----
  let pending = null, timer = null, lastMain = '', lastCache = '';
  C.push = (lib, now) => {
    if (!C.user) return;
    pending = lib;
    if (!C.ready) return;   // kept, and sent once this device has merged with the cloud
    if (now) return flush();
    if (!timer) timer = setTimeout(flush, 20000);
  };
  async function flush() {
    clearTimeout(timer); timer = null;
    if (!pending || !C.user || !C.ready) return;
    let lib = pending; pending = null;
    // never overwrite: what is in the cloud right now is merged into what we send (favorites, lists, songs from
    // every device are all kept; only what you deliberately removed goes)
    if (C.merge) {
      try {
        const [m, c] = await Promise.all(['main', 'cache'].map(n => ref(n).get().then(d => d.exists ? d.data() : null)));
        if (m && m.json) { const there = JSON.parse(m.json); if (c && c.json) there.cache = JSON.parse(c.json); lib = C.merge(lib, Object.assign(there, { savedAt: m.savedAt || 0 })); lib.savedAt = Math.max(lib.savedAt || 0, Date.now()); }
      } catch (e) { console.warn('[cloud] could not read before saving; not saving now', e); pending = pending || lib; setStatus('error: ' + (e.code || e.message)); return; }
    }
    const { cache, ...rest } = lib;
    const mainJson = JSON.stringify(rest), cacheJson = JSON.stringify(cache || {});
    const savedAt = lib.savedAt || Date.now();
    try {
      setStatus('saving');
      const w = [];
      if (mainJson !== lastMain) w.push(ref('main').set({ json: mainJson, savedAt, device: DEVICE, by: C.user.email || '' }));
      if (cacheJson !== lastCache) w.push(ref('cache').set({ json: cacheJson, savedAt, device: DEVICE }));
      await Promise.all(w);
      lastMain = mainJson; lastCache = cacheJson;
      setStatus('saved');
    } catch (e) { console.warn('[cloud] save failed', e); setStatus('error: ' + (e.code || e.message)); }
  }
  C.flush = flush;
  C.markReady = () => { C.ready = true; if (pending) flush(); };

  // ---- daily backups: one dated copy of the library a day (without the video cache), the last 30 days kept ----
  const day = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  C.backupDaily = async lib => {
    if (!C.user || !C.ready || !lib) return;
    const today = day();
    try {
      const idx = await ref('backups').get(), list = idx.exists ? JSON.parse(idx.data().json || '[]') : [];
      if (list.some(b => b.day === today)) return;
      const { cache, ...rest } = lib;
      await ref('backup-' + today).set({ json: JSON.stringify(rest), savedAt: Date.now(), device: DEVICE });
      list.push({ day: today, fav: (lib.fav || []).length, lists: (lib.lists || []).length, user: (lib.user || []).length });
      list.sort((a, b) => a.day < b.day ? -1 : 1);
      const old = list.splice(0, Math.max(0, list.length - 30));
      await ref('backups').set({ json: JSON.stringify(list), savedAt: Date.now() });
      await Promise.all(old.map(b => ref('backup-' + b.day).delete().catch(() => {})));
    } catch (e) { console.warn('[cloud] daily backup failed', e); }
  };
  C.listBackups = async () => { if (!C.user) return []; const d = await ref('backups').get(); return d.exists ? JSON.parse(d.data().json || '[]').reverse() : []; };
  C.getBackup = async dayId => { if (!C.user) return null; const d = await ref('backup-' + dayId).get(); return d.exists ? JSON.parse(d.data().json || '{}') : null; };
  C.pushAds = async (edits, pool) => {
    if (!C.user) return;
    try { await ref('ads').set({ edits: JSON.stringify(edits || {}), pool: JSON.stringify(pool || []), savedAt: Date.now(), device: DEVICE }); } catch (e) { console.warn('[cloud] ads save failed', e); }
  };
  const bye = () => { if (pending) flush(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bye(); });
  window.addEventListener('pagehide', bye);
})();
