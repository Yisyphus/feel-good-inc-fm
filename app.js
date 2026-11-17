(() => {
// Timers that keep time when the window is minimized. A hidden page's own timers are slowed to once a second or
// less, which stretched the fades between songs into long silences; a background worker's timers are not slowed.
const { setTimeout, setInterval, clearTimeout, clearInterval } = (() => {
  const native = { setTimeout: window.setTimeout.bind(window), setInterval: window.setInterval.bind(window), clearTimeout: window.clearTimeout.bind(window), clearInterval: window.clearInterval.bind(window) };
  let w; try { w = new Worker(URL.createObjectURL(new Blob([`const t={};onmessage=e=>{const[k,id,ms]=e.data;if(k==='p')return;if(k==='c'){clearTimeout(t[id]);clearInterval(t[id]);delete t[id];}else if(k==='t')t[id]=setTimeout(()=>{delete t[id];postMessage(id);},ms);else t[id]=setInterval(()=>postMessage(id),ms);};`], { type: 'text/javascript' }))); } catch { return native; }
  const fns = new Map(), once = new Set(), backup = new Map(); let next = 1;
  const fire = id => { const f = fns.get(id); if (!f) return; if (once.has(id)) { fns.delete(id); once.delete(id); native.clearTimeout(backup.get(id)); backup.delete(id); } try { f(); } catch (err) { console.error(err); } };
  w.onmessage = e => fire(e.data);
  w.onerror = () => {};
  // a worker can sit idle and hold its timers until it hears from the page: a light nudge keeps it awake, and every
  // one-off timer also has an ordinary timer as a backup (slowed when minimized, but never lost)
  native.setInterval(() => w.postMessage(['p']), 250);
  const start = (kind, f, ms, args) => {
    const id = next++, wait = Math.max(0, +ms || 0); fns.set(id, args.length ? () => f(...args) : f);
    if (kind === 't') { once.add(id); backup.set(id, native.setTimeout(() => fire(id), wait + 400)); }
    w.postMessage([kind, id, wait]); return id;
  };
  const clear = id => { if (!fns.has(id)) return; fns.delete(id); once.delete(id); native.clearTimeout(backup.get(id)); backup.delete(id); w.postMessage(['c', id]); };
  return { setTimeout: (f, ms, ...a) => start('t', f, ms, a), setInterval: (f, ms, ...a) => start('i', f, ms, a), clearTimeout: clear, clearInterval: clear };
})();
window.PBD_TIMERS = { setTimeout, setInterval, clearTimeout, clearInterval };   // jingles.js uses them too
const R = window.RADIO;
const $ = id => document.getElementById(id);
// Fresh start (R.freshStart, content.js): when it changes, this device forgets what it remembers locally, once: the
// tour, today's mission, the library kept only on this device. Used before Rim gets the radio, after testing.
let freshWipe = false;
try { if (localStorage.getItem('fgi-fresh') !== R.freshStart) { Object.keys(localStorage).filter(k => /^(fgi-|pbd-)/.test(k)).forEach(k => localStorage.removeItem(k)); localStorage.setItem('fgi-fresh', R.freshStart); freshWipe = true; } } catch {}
const rnd = a => a[Math.floor(Math.random() * a.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const THEMES = ['love', 'fun', 'friends', 'freedom', 'rebel', 'dreams', 'self', 'night', 'summer', 'space', 'weird', 'heartbreak', 'hope', 'school', 'dance', 'chill', 'growing-up'];
const MAX_DISCOVERED = 220;

// ---------- state ----------
let lib = { user: [], cache: {}, removed: [], settings: {}, trim: {}, disc: {} };
let S = { talk: 'normal', rate: 100, voice: '', sleep: 0, vol: 80, trim: 5, news: 'on', fade: 3, justMusic: false };
let songs = [];
let current = null, history = [], played = [], upNext = [], planned = null, preload = null;
let batch = null, startAnnounce = null, lastRunSong = null, giftAnnounce = ''; // genre run state
let nextPending = false, nextOverride = null; // a suggested song can take the place of the one chosen to play next
let pl = [null, null], ai = 0, ytReady = false, playing = false, started = false, busy = false;
let runId = 0, speaking = false, airMs = 0, songsSinceBreak = 0;
let sleepAt = 0, candIdx = 0, startWatch = null;

const key = s => (s.a + '|' + s.t).toLowerCase();
// Where the library lives:
// - on the PC, the helper (server.js) keeps data/library.json, a local copy that also works offline;
// - opened from the web with no helper (the phone), a copy is kept in the browser;
// - signed in, the cloud (cloud.js) keeps the shared copy, and the newest copy wins.
let HELPER = false, helperOpens = false;   // helperOpens: this PC's helper opens links in the browser (older ones opened Documents)
const NEEDS_PC = 'That works in the installed app (Settings > My stuff > Get the Windows app). On the website you can paste a YouTube link instead.';
function normalizeLib() {
  if (lib.cacheV !== 2) { lib.cache = {}; lib.cacheV = 2; } // earlier versions cached some wrong videos; search again with the stricter matching
  lib.used = lib.used || {}; lib.b = lib.b || 0; lib.trim = lib.trim || {}; lib.disc = lib.disc || {}; lib.cache = lib.cache || {}; lib.user = lib.user || []; lib.removed = lib.removed || []; lib.lists = lib.lists || [];
  S = Object.assign(S, lib.settings || {});
  if (!S.voices3) { S.voice = ''; S.lunaVoice = ''; S.bulletinVoice = ''; S.voices3 = 1; }   // the new automatic voices (Emily, Brian), once
  if (!S.rate3) { if (!S.rate || S.rate === 88) S.rate = 100; S.rate3 = 1; }   // normal talking speed, the owner's pick, once
  if (!S.fade3) { if (S.fade === 2 || S.fade === undefined) S.fade = 3; else if (S.fade === 4) S.fade = 5; S.fade3 = 1; }   // fades of 3 s (long: 5 s), once
  if (!S.rate2) { if (!S.rate || S.rate === 100) S.rate = 88; S.rate2 = 1; }   // the owner's chosen talking speed, once
  if (!S.roles2) { const v = S.voice, l = S.lunaVoice; S.voice = l || ''; S.lunaVoice = v === '__online' ? '' : (v || ''); S.roles2 = 1; }   // Luna became the host: the two chosen voices change places once
  }
let libLoaded = false;
async function loadLib() {
  const ping = await fetch('/api/ping').then(r => r.ok ? r.json() : null).catch(() => null);
  HELPER = !!(ping && (ping.app === 'feel-good-inc-fm' || ping.app === 'pale-blue-dot')); helperOpens = !!(ping && ping.open >= 2);
  desktopApp = !!(ping && ping.desktop); if (ping && ping.voice) voiceState = ping.voice.state;
  if (HELPER) { try { const r = await fetch('/api/library'); lib = Object.assign(lib, await r.json()); } catch {} }
  if (HELPER && freshWipe) { lib = { user: [], cache: {}, removed: [], settings: {}, trim: {}, disc: {} }; fetch('/api/library', { method: 'POST', body: JSON.stringify(lib) }).catch(() => {}); rlog('fresh start: the library on this PC was cleared'); }
  else { try { const c = JSON.parse(localStorage.getItem('pbd-lib') || 'null'); if (c) lib = Object.assign(lib, c); } catch {} }
  if (window.Cloud && Cloud.enabled) {
    const u = await Promise.race([Cloud.authKnown, sleep(6000)]);
    if (u) await syncWithCloud();
  }
  normalizeLib(); libLoaded = true;
}
// Two copies of the library (this device, and the cloud or another device) are MERGED, never swapped:
// favorites, your songs, removed songs, saved versions, trims and broken-song marks from both are kept.
// Things you deliberately took away are remembered with a date in lib.del, so they do not come back.
// (A plain "newest copy wins" once let a brand-new, empty library replace everything.)
function mergeLib(a, b) {
  a = a || {}; b = b || {};
  const newer = (a.savedAt || 0) >= (b.savedAt || 0) ? a : b, older = newer === a ? b : a;
  const out = Object.assign({}, older, newer);   // settings, history, letter rotation...: from the newer copy
  const del = {};
  ['fav', 'user', 'removed', 'lists', 'focusAdd', 'focusCustom', 'albumLists', 'albumHidden'].forEach(k => {
    del[k] = {};
    [older, newer].forEach(c => Object.entries((c.del || {})[k] || {}).forEach(([key, t]) => { if ((del[k][key] || 0) < t) del[k][key] = t; }));
  });
  out.del = del;
  const alive = (k, key, ts) => !(del[k][key] && del[k][key] >= (ts || 0));
  const byKey = (list, tsOf) => { const m = new Map(); list.forEach(x => { if (!x || !x.key) return; const p = m.get(x.key); if (!p || tsOf(x) >= tsOf(p)) m.set(x.key, x); }); return [...m.values()]; };
  out.fav = byKey([...(older.fav || []), ...(newer.fav || [])], x => x.ts || 0).filter(f => alive('fav', f.key, f.ts)).sort((x, y) => (x.ts || 0) - (y.ts || 0));
  out.user = byKey([...(older.user || []), ...(newer.user || [])], x => x.added || 0).filter(s => alive('user', s.key, s.added));
  out.lists = byKey([...(older.lists || []), ...(newer.lists || [])], x => x.ts || 0).filter(l => alive('lists', l.key, l.ts)).sort((x, y) => (x.created || 0) - (y.created || 0));   // saved lists: per list, the most recently edited wins
  out.removedTs = Object.assign({}, older.removedTs, newer.removedTs);
  out.removed = [...new Set([...(older.removed || []), ...(newer.removed || [])])].filter(k => alive('removed', k, out.removedTs[k]));
  ['cache', 'trim', 'bad'].forEach(k => { out[k] = Object.assign({}, older[k], newer[k]); });
  out.labels = Object.assign({}, older.labels);   // labels: per song, the most recently edited wins
  Object.entries(newer.labels || {}).forEach(([k, v]) => { if (!out.labels[k] || (v.ts || 0) >= (out.labels[k].ts || 0)) out.labels[k] = v; });
  out.lyrOff = Object.assign({}, older.lyrOff, newer.lyrOff);
  out.albumVideos = Object.assign({}, older.albumVideos); Object.entries(newer.albumVideos || {}).forEach(([k, v]) => { if (!out.albumVideos[k] || (v.ts || 0) >= (out.albumVideos[k].ts || 0)) out.albumVideos[k] = v; });   // the videos saved for each album
  out.albumHidden = byKey([...(older.albumHidden || []), ...(newer.albumHidden || [])], x => x.added || 0).filter(x => alive('albumHidden', x.key, x.added));   // albums you removed
  out.albumEdits = Object.assign({}, older.albumEdits); Object.entries(newer.albumEdits || {}).forEach(([k, v]) => { if (!out.albumEdits[k] || (v.ts || 0) >= (out.albumEdits[k].ts || 0)) out.albumEdits[k] = v; });   // albums you renamed
  out.albumLists = byKey([...(older.albumLists || []), ...(newer.albumLists || [])], x => x.added || 0).filter(x => alive('albumLists', x.key, x.added));   // your album playlists   // lyrics timing you corrected, per song
  out.adCleanups = [...new Set([...(older.adCleanups || []), ...(newer.adCleanups || [])])];
  out.adsHidden = [...new Set([...(older.adsHidden || []), ...(newer.adsHidden || [])])];
  out.focusAdd = byKey([...(older.focusAdd || []), ...(newer.focusAdd || [])], x => x.added || 0).filter(x => alive('focusAdd', x.key, x.added));   // tracks you suggested to a Focus station
  out.focusCustom = byKey([...(older.focusCustom || []), ...(newer.focusCustom || [])], x => x.ts || 0).filter(c => alive('focusCustom', c.key, c.added)).sort((x, y) => (x.added || 0) - (y.added || 0));   // your own Focus genres
  out.b = Math.max(older.b || 0, newer.b || 0);
  out.hist = (newer.hist || []).length >= (older.hist || []).length ? newer.hist : older.hist;
  return out;
}
const libSig = l => JSON.stringify([(l.fav || []).map(f => f.key), (l.user || []).map(s => s.key), l.removed || [], Object.keys(l.cache || {}).length, l.del || {}, Object.entries(l.labels || {}).map(([k, v]) => k + v.ts), (l.lists || []).map(x => x.key + x.ts), l.adCleanups || [], (l.adsHidden || []).length, (l.focusAdd || []).map(x => x.key), (l.focusCustom || []).map(c => c.key + c.ts), (l.albumLists || []).map(x => x.key + (x.album || '')), (l.albumHidden || []).map(x => x.key), Object.entries(l.albumVideos || {}).map(([k, v]) => k + v.ts), Object.entries(l.albumEdits || {}).map(([k, v]) => k + v.ts)]);
// Sign-in, or opening the radio signed in: merge with the cloud, keep the result here, and send it up if it differs.
let cloudSyncing = null;
function syncWithCloud() { return cloudSyncing || (cloudSyncing = syncWithCloudNow().finally(() => { cloudSyncing = null; })); }
async function syncWithCloudNow() {
  try {
    const c = await Cloud.pull(); if (!c) return;
    const merged = mergeLib(lib, c.lib ? Object.assign({ savedAt: c.savedAt || 0 }, c.lib) : {});
    const changedHere = libSig(merged) !== libSig(lib), changedThere = !c.lib || libSig(merged) !== libSig(c.lib);
    lib = Object.assign({ user: [], cache: {}, removed: [], settings: {}, trim: {}, disc: {} }, merged);
    if (changedHere && HELPER) fetch('/api/library', { method: 'POST', body: JSON.stringify(lib) }).catch(() => {});   // refresh the local copy
    Cloud.markReady();   // from now on this device may write to the cloud (always merging first)
    setTimeout(() => Cloud.backupDaily(lib), 30000);   // today's backup, if no device has made it yet
    if (changedThere) { lib.savedAt = Date.now(); Cloud.push(lib, true); }
    rlog('cloud sync', { favorites: (lib.fav || []).length, yourSongs: (lib.user || []).length, removed: (lib.removed || []).length, sentUp: changedThere });
  } catch (e) { console.warn('[cloud]', e); rlog('cloud sync refused', { code: e.code || String(e) }); if (Cloud.isAnon && Cloud.isAnon()) { Cloud.status = 'error: ' + (e.code || 'offline'); updateCloudUI(); return; } toast('Cloud: ' + (e.code === 'permission-denied' ? 'this Google account is not allowed.' : 'could not sync right now.')); }
}
// Recording what you deliberately take away, so merging does not bring it back.
function markDeleted(kind, key) { lib.del = lib.del || {}; lib.del[kind] = lib.del[kind] || {}; lib.del[kind][key] = Date.now(); }
let saveT;
// Focus mode never touches the library: the videos it finds are kept apart, on this device, and nothing else of it is saved
function keepFocusOut() {
  let fc = {}; try { fc = JSON.parse(localStorage.getItem('pbd-focus-cache') || '{}'); } catch {}
  let moved = false;
  ['cache', 'trim', 'bad'].forEach(k => Object.keys(lib[k] || {}).forEach(x => { if (/^(focus|album)/.test(x)) { if (k === 'cache') { fc[x] = lib.cache[x]; moved = true; } delete lib[k][x]; } }));
  if (lib.hist) lib.hist = lib.hist.filter(h => !/^(focus|album)/.test(h.k));
  if (moved) try { localStorage.setItem('pbd-focus-cache', JSON.stringify(fc)); } catch {}
}
function saveLib() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    lib.settings = S; lib.savedAt = Date.now();
    keepFocusOut();
    if (HELPER) fetch('/api/library', { method: 'POST', body: JSON.stringify(lib) }).catch(() => {});
    else { try { localStorage.setItem('pbd-lib', JSON.stringify(lib)); } catch {} }
    if (window.Cloud && Cloud.user) Cloud.push(lib);
  }, 400);
}
// A change made on your other device: take it, as long as it is newer than what we have here.
if (window.Cloud) {
  Cloud.merge = mergeLib;
  // signed in later than the start (a slow sign-in, or signing in from Settings): merge first, like at the start
  Cloud.onSignedIn = async () => { if (!libLoaded) return; await syncWithCloud(); normalizeLib(); buildSongs(); updateHeart(); paintJust(); };
}
if (window.Cloud) Cloud.onRemote = ({ lib: rl, savedAt }) => {
  if (!rl) return;
  const merged = mergeLib(lib, Object.assign({ savedAt }, rl));
  if (libSig(merged) === libSig(lib) && savedAt <= (lib.savedAt || 0)) return;
  lib = Object.assign({ user: [], cache: {}, removed: [], settings: {}, trim: {}, disc: {} }, merged);
  normalizeLib(); buildSongs(); updateHeart();
  if (libSig(merged) !== libSig(rl)) { lib.savedAt = Date.now(); Cloud.push(lib); }   // the other device was missing something we have: send the merge back
  if (HELPER) fetch('/api/library', { method: 'POST', body: JSON.stringify(lib) }).catch(() => {});
  else { try { localStorage.setItem('pbd-lib', JSON.stringify(lib)); } catch {} }
};
function buildSongs() {
  // the whole pool: your first songs, the curated catalog, and the songs you added yourself.
  // Songs that the old version pulled in automatically from YouTube mixes ("found for you") are switched off here, but kept in the file.
  const seed = R.songs.map(s => ({ ...s, key: key(s) }));
  const cat = (R.catalog || []).map(s => ({ ...s, key: key(s) }));
  const user = lib.user.filter(s => !s.discovered).map(s => ({ ...s, key: s.key || key(s) }));
  const gift = giftSongs();
  const giftIds = new Map(gift.filter(g => g.cands && g.cands[0]).map(g => [g.key, g.cands[0]]));
  const seen = new Set(); songs = [];
  [...seed, ...cat, ...gift, ...user].forEach(s => { if (seen.has(s.key) || lib.removed.includes(s.key)) return; seen.add(s.key); songs.push(s); });
  songs.forEach(s => {
    if (lib.cache[s.key]) s.cands = lib.cache[s.key];
    else if (R.catalogIds && R.catalogIds[s.key]) { const v = R.catalogIds[s.key]; s.cands = [{ id: v.id, title: v.title, channel: v.channel, seconds: v.seconds || 0 }, ...(v.more || [])]; }   // checked in advance: no search needed, with backups
    const gv = giftIds.get(s.key);   // the owner picked this exact video for a family playlist
    if (gv) s.cands = [gv, ...(s.cands || []).filter(c => c.id !== gv.id)];
    const L = (lib.labels || {})[s.key];   // your own labels (Library > the pencil) win over the catalog's
    if (L) { if (L.genre) s.genre = L.genre; if (L.tags) s.tags = L.tags.slice(); if (L.mood) s.mood = L.mood; if (L.energy) s.energy = L.energy; }
  });
}
const needsLabels = s => !s.genre;
// a saved list's songs, in its order, leaving out the ones you removed since
// The family playlists (content.js R.giftLists): songs as 'Artist|Title|YouTube id', read-only, shown once they have songs
function giftSongs() {
  return (R.giftLists || []).flatMap(L => (L.songs || []).map(line => { const [a, t, id] = String(line).split('|'); const s = { a, t, tags: [], genre: '', mood: 'happy', energy: 3, gift: true }; s.key = key(s); if (id) s.cands = [{ id: id.trim(), title: t, channel: a, seconds: 0 }]; return s; }));
}
const giftLists = () => (R.giftLists || []).map(L => ({ key: L.key, name: L.name, color: L.color, sticker: L.sticker, preset: true, keys: (L.songs || []).map(line => { const [a, t] = String(line).split('|'); return key({ a, t }); }) })).filter(L => L.keys.length);
const allLists = () => [...(lib.lists || []), ...giftLists()];   // newest last: the family lists show first in Playlists
const listSongs = L => { const m = new Map(songs.map(s => [s.key, s])); return (L.keys || []).map(k => m.get(k)).filter(Boolean); };
const genreOptions = first => `<option value="">${first}</option>` + Object.entries(R.genreMap || {}).sort((x, y) => x[1].name.localeCompare(y[1].name)).map(([id, g]) => `<option value="${id}">${g.name}</option>`).join('');
// gives a genre to the songs that have none yet (songs you already labelled keep theirs)
function labelGenre(keys, genre) {
  const now = Date.now(); let n = 0; lib.labels = lib.labels || {};
  keys.forEach(k => {
    const s = songs.find(x => x.key === k); if (!s || s.genre) return;
    lib.labels[k] = Object.assign({}, lib.labels[k], { genre, ts: now }); n++;
    const u = lib.user.find(x => x.key === k); if (u) u.genre = genre;
  });
  return n;
}

// ---------- ui helpers ----------
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); }
function caption(kind, text) { $('cap').classList.toggle('idle', !text); $('capKind').textContent = kind || R.host; $('capText').textContent = text || ''; }
function setPlayIcon(on) { $('playIcon').innerHTML = on ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>'; }
// Artwork on the record label. YouTube answers a missing thumbnail with a small grey placeholder (120 px wide)
// instead of an error, so each image is checked first; then other sizes and the song's other saved versions are tried.
let artToken = 0;
function setArt(s, id) {
  const my = ++artToken, label = $('label');
  if (!id) { label.style.backgroundImage = ''; return; }
  const ids = [id, ...((s && s.cands) || []).map(c => c.id).filter(x => x && x !== id)].slice(0, 3);
  const urls = [];
  ids.forEach(v => ['hqdefault', 'mqdefault', 'sddefault'].forEach(sz => urls.push(`https://i.ytimg.com/vi/${v}/${sz}.jpg`)));
  const tryAt = i => {
    if (my !== artToken) return;
    if (i >= urls.length) { label.style.backgroundImage = ''; rlog('no artwork found', { song: s && s.key }); return; }
    const img = new Image();
    img.onload = () => { if (img.naturalWidth > 120) { if (my === artToken) label.style.backgroundImage = `url(${urls[i]})`; } else tryAt(i + 1); };
    img.onerror = () => tryAt(i + 1);
    img.src = urls[i];
  };
  tryAt(0);
}
function setNow(s, kind) {
  $('kind').textContent = kind || (s && s.podcast ? (s.show === 'concert' ? 'live concert' : 'podcast') : 'now playing');
  $('title').textContent = s ? s.t : R.station;
  $('artist').textContent = s ? s.a : '';
  $('chips').innerHTML = s ? [...(s.tags || []).slice(0, 3), s.genre].filter(Boolean).map(t => `<span class="chip">${t}</span>`).join('') : '';
  const id = s && s.cands && s.cands[0] ? (s.cands[candIdx] || s.cands[0]).id : null;
  setArt(s, id);
  if (s) { let h = 0; for (const c of s.key) h = (h * 31 + c.charCodeAt(0)) >>> 0; const p = 8 + (h % 84); $('needle').style.left = p + '%'; $('freq').textContent = (87.5 + p * 0.2).toFixed(1) + ' FM'; }
  document.title = s ? `${s.t} · ${s.a} · ${R.station}` : R.station;   // always "Feel Good" in it: the minimize watcher finds the window by its title
  updateHeart();
  if ('mediaSession' in navigator && s) navigator.mediaSession.metadata = new MediaMetadata({ title: s.t, artist: s.a, album: R.station });
}
function setLive(on) { $('onair').classList.toggle('live', on); $('vinyl').classList.toggle('on', on); }

// ---------- voice ----------
// Three voices, all English: Luna (the host), Joe (the co-host: Book Nook, readings, banter) and the bulletin.
// Edge's natural voices are preferred; an online voice is the fallback.
let voices = [];
const isEn = v => /^en/i.test(v.lang);
const ONLINE = '__online';
const nice = v => `${v.name.replace('Microsoft ', '').replace(/ Online \(Natural\)/, ' (Natural)')} · ${v.lang}`;
function loadVoices() {
  voices = speechSynthesis.getVoices();
  const en = [...voices].filter(isEn).sort((a, b) => /natural/i.test(b.name) - /natural/i.test(a.name) || a.name.localeCompare(b.name));
  const fill = (id, autoLabel, key, online) => { const el = $(id); if (!el) return; el.innerHTML = ''; const add = (val, label) => { const o = document.createElement('option'); o.value = val; o.textContent = label; el.appendChild(o); };
    add('', autoLabel); if (online) add(ONLINE, 'Online voice (if the others sound wrong)'); en.forEach(v => add(v.name, nice(v))); el.value = S[key] && (S[key] === ONLINE || en.some(v => v.name === S[key])) ? S[key] : ''; };
  fill('voiceSel', 'Automatic (Ava Multilingual, natural)', 'voice', true);
  fill('lunaSel', 'Automatic (Andrew Multilingual, natural)', 'lunaVoice');
  fill('bulletinSel', "Automatic (Joe's voice)", 'bulletinVoice');
  const note = $('voiceNote');
  if (note && !kokoroReady()) note.textContent = voices.some(v => isEn(v) && /natural/i.test(v.name)) ? '' : 'Tip: open the radio in Microsoft Edge for free natural voices (Andrew, Ava, Emma…). Without them an online voice is used.';
}
function hostVoice() {
  if (S.voice === ONLINE) return null;
  if (S.voice) { const v = voices.find(v => v.name === S.voice); if (v) return v; }
  const en = voices.filter(isEn);
  const pref = [/ava multilingual.*natural/i, /ava.*natural/i, /aria.*natural/i, /(emma|jenny|emily).*natural/i, /natural/i, /zira|hazel|susan|aria|jenny|samantha|female/i];   // Luna: Ava Multilingual (the owner's pick), then Ava, Aria
  for (const p of pref) { const v = en.find(v => p.test(v.name)); if (v) return v; }
  return en[0] || null;
}
// Other voices, by the code a script line carries: s = Joe (the co-host), n = the bulletin. Each takes the first installed
// natural voice from its list that is not the host's.
const VOICE_PREFS = {
  s: [/andrew multilingual.*natural/i, /andrew.*natural/i, /brian multilingual.*natural/i, /brian.*natural/i, /guy.*natural/i, /christopher.*natural/i, /eric.*natural/i, /david|mark|george|guy|male/i],   // Joe: Andrew Multilingual (the owner's pick), then Andrew, Brian
  n: [/ryan.*natural/i, /sonia.*natural/i, /libby.*natural/i, /steffan.*natural/i, /jenny.*natural/i, /natural/i],
};
function voiceFor(code) {
  if (code === 'n' && !S.bulletinVoice) return voiceFor('s');   // the bulletin is Joe's
  const chosen = { s: S.lunaVoice, n: S.bulletinVoice }[code];
  if (chosen) { const v = voices.find(v => v.name === chosen); if (v) return v; }
  const host = hostVoice(), en = voices.filter(v => isEn(v) && v !== host);
  for (const p of VOICE_PREFS[code] || []) { const v = en.find(v => p.test(v.name) && (code !== 'n' || v.name !== (voiceFor('s') || {}).name)); if (v) return v; }
  return en.find(v => /natural/i.test(v.name)) || null;
}
speechSynthesis.onvoiceschanged = loadVoices;

let curAudio = null;
const splitParts = text => (text.match(/[^.!?…]+[.!?…]+["')\]]*\s*|[^.!?…]+$/g) || [text]).map(s => s.trim()).filter(Boolean);
// The website opened on a phone (no PC helper). Phone-only fixes apply only there; the PC keeps its own behaviour.
const mobileWeb = () => !HELPER && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
// The online voice: through the PC helper when there is one; otherwise the page asks Google directly.
const ttsUrl = q => HELPER ? '/api/tts?q=' + encodeURIComponent(q) : 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-GB&q=' + encodeURIComponent(q);
function onlineChunks(parts) {
  const out = [];
  parts.forEach(p => {
    while (p.length > 180) {
      let cut = p.lastIndexOf(',', 180);
      if (cut < 60) cut = p.lastIndexOf(' ', 180);
      if (cut < 60) cut = 180;
      out.push(p.slice(0, cut + 1).trim()); p = p.slice(cut + 1).trim();
    }
    if (p) out.push(p);
  });
  return out;
}
// Phones only let a page start sound from a tap: one audio player, unlocked by the first tap, is reused after that.
const ttsPlayer = new Audio(); ttsPlayer.preload = 'auto';
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
function unlockAudio() { if (!mobileWeb()) return; try { ttsPlayer.src = SILENT_WAV; const p = ttsPlayer.play(); if (p) p.catch(() => {}); } catch {} }

// How the voice should say a text: names it would say wrong are rewritten (R.sayAs). The caption keeps the text as written.
const spoken = x => (R.sayAs || []).reduce((t, [re, to]) => t.replace(re, to), String(x));
// Speak a block of text. All sentences are queued at once so there is no gap between them.
// ---------- the desktop app's own voices (Kokoro, made by the PC helper: Luna = Heart, Joe = Adam) ----------
// The installed app asks the helper for a recording of each block of speech. A slow PC makes speech slowly, so what
// the radio will say soon is asked for ahead: a whole break about a minute and a half before the song ends, the next
// lines of a break or the bulletin as soon as it starts. While the voices are not ready (the first start downloads
// them once) and on the website, the browser's own voices speak.
let kLast = false;   // the voice is on the last piece of its block
let voiceState = '', voiceLoadToast = false, desktopApp = false;
const voicesPending = () => desktopApp && voiceState !== 'ready' && voiceState !== 'error';   // the app's voices are still loading
async function waitVoices(ms) {   // a few seconds normally; minutes only if the voices have to be downloaded first
  if (!voicesPending()) return;
  const t0 = Date.now(), cap = $('capText'), keep = cap.textContent;
  while (voicesPending() && Date.now() - t0 < ms) { cap.textContent = 'Getting ' + R.host + "'s and " + R.cohost + "'s voices ready…"; $('cap').classList.remove('idle'); await voicePoll(); await sleep(1000); }
  cap.textContent = keep;
}
const kokoroReady = () => HELPER && voiceState === 'ready';
const kokoroText = t => spoken((R.kokoroSay || []).reduce((x, [re, to]) => x.replace(re, to), String(t)));
const kokoroBody = (text, who, pre) => JSON.stringify({ text: kokoroText(text), who: who || 'h', speed: (S.rate || 100) / 100, pre: !!pre });
// a block in pieces of a sentence or two (the same way the helper would cut it), each recorded on its own
const kPieces = text => { const out = []; let cur = ''; splitParts(String(text).replace(/\b(Inc|Mr|Mrs|Dr|St|Pt|Pts|vs)\. /g, '$1\u2024 ')).map(x => x.replace(/\u2024/g, '.')).forEach(x => { if (cur && (!out.length || (cur + ' ' + x).length > 220)) { out.push(cur); cur = x; } else cur = cur ? cur + ' ' + x : x; }); if (cur) out.push(cur); return out; };   // the first piece is one sentence, so the voice starts sooner
let preList = [], preTimer = 0;
function kokoroPre(text, who) {   // collected, then sent in one list so the helper makes them in this order
  if (!kokoroReady() || !text) return;
  kPieces(text).forEach(t => preList.push({ text: kokoroText(t), who: who || 'h', speed: (S.rate || 100) / 100 }));
  if (!preTimer) preTimer = setTimeout(() => { const items = preList; preList = []; preTimer = 0; fetch('/api/say', { method: 'POST', body: JSON.stringify({ items }) }).catch(() => {}); }, 0);
}
async function voicePoll() {
  if (!HELPER || voiceState === 'ready' || voiceState === 'none') return;
  const p = await fetch('/api/ping').then(r => r.json()).catch(() => null), v = p && p.voice;
  if (!v) { if (p) voiceState = 'none'; return; }
  if (v.state === 'loading' && !voiceLoadToast && v.progress < 100) { voiceLoadToast = true; toast("Getting " + R.host + "'s and " + R.cohost + "'s voices ready (first time only). Until then, a simpler voice speaks."); }
  if (v.state === 'ready' && voiceState && voiceState !== 'ready') toast(R.host + "'s and " + R.cohost + "'s voices are ready.");
  if (v.state !== voiceState) rlog('voices ' + v.state, { progress: v.progress, speed: v.rtf, error: v.error || undefined });
  voiceState = v.state;
  const note = $('voiceNote'); if (note && v.state === 'loading') note.textContent = 'Downloading the voices, once: ' + (v.progress || 0) + '%';
  if (v.state === 'ready') ownVoicesUI();
}
function ownVoicesUI() {
  ['voiceSel', 'lunaSel', 'bulletinSel'].forEach(id => { const el = $(id), row = el && el.closest('.set'); if (row) row.hidden = true; });
  const tip = $('edgeTip'); if (tip) tip.hidden = true;
  const note = $('voiceNote'); if (note) { note.style.color = ''; note.textContent = 'In the app, ' + R.host + ' and ' + R.cohost + ' have voices of their own, made on this PC.'; }
}
setInterval(voicePoll, 2000);
function sayKokoro(text, who) {   // true when it was said (or stopped), false when the helper could not make it
  return new Promise(async res => {
    const id = runId, pieces = kPieces(text); speaking = true;
    let next = get(pieces[0]);   // first in line
    if (pieces.length > 1) fetch('/api/say', { method: 'POST', body: JSON.stringify({ items: pieces.slice(1).map(t => ({ text: kokoroText(t), who: who || 'h', speed: (S.rate || 100) / 100 })) }) }).catch(() => {});   // the rest is made while the first is said
    function get(t) { return withTimeout(fetch('/api/say', { method: 'POST', body: kokoroBody(t, who, false) }), 90000).then(r => r.ok ? r.blob() : null).catch(() => null); }
    for (let k = 0; k < pieces.length; k++) {
      const blob = await (next || get(pieces[k])); next = k + 1 < pieces.length ? get(pieces[k + 1]) : null;
      if (id !== runId) { speaking = false; return res(true); }
      if (!blob) { speaking = false; rlog('voice not made, browser voice instead'); return res(k === 0 ? false : true); }
      kLast = k === pieces.length - 1;
      await playPiece(blob, pieces[k], id);
      kLast = false;
      if (id !== runId) { speaking = false; return res(true); }
    }
    speaking = false; res(true);
  });
}
function playPiece(blob, text, id) {
  return new Promise(res => {
    const url = URL.createObjectURL(blob), a = new Audio(url), parts = splitParts(text), total = parts.reduce((n, x) => n + x.length + 1, 0) || 1;
    let shown = -1, done = false, watch;
    const show = () => { if (id !== runId || !a.duration) return; const k = a.currentTime / a.duration * total; let acc = 0, i = 0; for (; i < parts.length - 1; i++) { acc += parts[i].length + 1; if (acc > k) break; } if (i !== shown) { shown = i; $('capText').textContent = parts[i]; } };
    const fin = () => { if (done) return; done = true; clearInterval(watch); a.ontimeupdate = null; if (curAudio === a) curAudio = null; URL.revokeObjectURL(url); res(); };
    watch = setInterval(() => { if (id !== runId) { try { a.pause(); } catch {} fin(); } }, 300);
    $('capText').textContent = parts[0] || text; shown = 0;
    curAudio = a; a.ontimeupdate = show; a.onended = fin; a.onerror = fin;
    if (!globalPaused) a.play().catch(fin);   // paused meanwhile: Play continues it (resumeAll)
  });
}
async function say(text, who = 'h') {
  if (voicesPending()) await waitVoices(30000);
  if (voicesPending()) return;   // never a stand-in voice in the app: this line is skipped
  if (kokoroReady()) {
    if (await sayKokoro(String(text), who)) return;
    if (desktopApp) { voiceState = 'loading'; await waitVoices(30000); if (kokoroReady()) await sayKokoro(String(text), who); return; }   // the helper restarted or is busy: wait, never a stand-in voice
  }
  return sayBrowser(text, who);
}
function sayBrowser(text, who = 'h') {
  text = String(text);   // shown as written (Rim); only what the voice hears gets the pronunciation fixes (R.sayAs)
  return new Promise(res => {
    const id = runId, parts = splitParts(text);
    const hv = hostVoice();
    speaking = true;
    let finished = false, guard;
    const done = () => { if (finished) return; finished = true; clearInterval(guard); speaking = false; res(); };
    let budget = parts.reduce((n, p) => n + Math.max(2500, p.length * 130), 6000);   // safety net; time spent paused does not count
    guard = setInterval(() => { if (!globalPaused && (budget -= 250) <= 0) done(); }, 250);
    if (!hv) {   // online fallback, the next sentences preloaded
      const list = onlineChunks(parts);
      const auds = list.map(p => { const a = new Audio(ttsUrl(spoken(p))); a.preload = 'auto'; a.playbackRate = who === 'h' ? 1 : 0.95; a._text = p; return a; });
      let i = 0;
      const nextA = () => { if (id !== runId || i >= auds.length) return done(); const a = auds[i]; $('capText').textContent = list[i]; i++; curAudio = a; a.onended = nextA; a.onerror = nextA; a.play().catch(nextA); };
      nextA(); return;
    }
    const gv = who !== 'h' ? voiceFor(who) : null;
    // One utterance for the whole block, so the natural voices never stop between sentences. Very long blocks are
    // cut at a sentence end every ~1500 characters. The caption shows the sentence being said (word boundaries).
    const chunks = []; let cur = [];
    parts.forEach(p => { if (cur.length && cur.join(' ').length + p.length > 1500) { chunks.push(cur); cur = []; } cur.push(p); });
    if (cur.length) chunks.push(cur);
    chunks.forEach((sent, ci) => {
      const said = sent.map(spoken), whole = said.join(' '), starts = []; let at = 0; said.forEach(x => { starts.push(at); at += x.length + 1; });
      const u = new SpeechSynthesisUtterance(whole);
      u.lang = 'en-US'; u.voice = gv || hv;
      u.rate = (S.rate || 100) / 100 * (who === 's' ? 0.96 : 1);
      u.pitch = who !== 'h' && !gv ? (who === 's' ? 1.3 : 1.12) : 1;   // no second voice installed: Luna and the bulletin at another pitch
      let shown = -1; const show = i => { if (id === runId && i !== shown) { shown = i; $('capText').textContent = sent[i]; } };
      u.onstart = () => { show(0); if (globalPaused) { try { speechSynthesis.pause(); } catch {} } };
      u.onboundary = e => { let i = 0; while (i + 1 < starts.length && starts[i + 1] <= e.charIndex) i++; show(i); };
      u.onend = () => { if (ci === chunks.length - 1 || id !== runId) done(); };
      u.onerror = () => { if (id !== runId || ci === chunks.length - 1) done(); };
      speechSynthesis.speak(u);
    });
  });
}
function stopSpeech() { runId++; if (breakSkip) { const b = breakSkip; breakSkip = null; try { b(); } catch {} } speechSynthesis.cancel(); try { if (curAudio) { curAudio.onended = null; curAudio.pause(); curAudio = null; } } catch {} speaking = false; }


// ---------- ambient bed: keeps the air filled during breaks so there is never dead silence ----------
let actx, bed;
function bedOn() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    if (bed) return;
    const g = actx.createGain(); g.gain.value = 0; g.connect(actx.destination);
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(g);
    const lfo = actx.createOscillator(); lfo.frequency.value = 0.07; const lg = actx.createGain(); lg.gain.value = 140; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const oscs = [110, 164.8, 220.3, 277.2, 329.6].map((f, i) => { const o = actx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 2) * 6; const og = actx.createGain(); og.gain.value = 0.22 / (i + 1.2); o.connect(og); og.connect(lp); o.start(); return o; });
    g.gain.linearRampToValueAtTime(0.07, actx.currentTime + 1.5);
    bed = { g, oscs, lfo };
  } catch {}
}
function bedOff(sec = 3) {
  if (!bed) return; const b = bed; bed = null;
  try { b.g.gain.cancelScheduledValues(actx.currentTime); b.g.gain.setValueAtTime(b.g.gain.value, actx.currentTime); b.g.gain.linearRampToValueAtTime(0, actx.currentTime + sec); setTimeout(() => { b.oscs.forEach(o => o.stop()); b.lfo.stop(); b.g.disconnect(); }, sec * 1000 + 300); } catch {}
}

// ---------- youtube: two hidden players, so the next song starts before the last one ends ----------
// Only the playing one streams. The next song is only "cued" on the other one (no stream yet) about a minute before
// the end, then the two hand over with a short fade. That keeps the sound going without a gap: a page that goes
// silent while it is minimized gets slowed down by the browser, which used to hold the next song until it came back.
// Both players are never visible, and small, so YouTube sends a lighter stream.
window.onYouTubeIframeAPIReady = () => {
  let ready = 0;
  [0, 1].forEach(i => {
    pl[i] = new YT.Player('yt' + i, { height: '200', width: '200', playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, iv_load_policy: 3, origin: location.origin }, events: {
      onReady: () => { setVol(pl[i], 0); if (++ready === 2) ytReady = true; },
      onStateChange: e => {
        if (adHook && adHook.idx === i) { adHook.state(e.data); return; }   // a commercial is playing on it
        if (i !== ai) {   // the idle player: the next song was started silently to prime it; stop it at its very start
          if (preload && preload.idx === i && !preload.primed) setVol(pl[i], 0);   // never heard while it is being prepared
          if (preload && preload.idx === i && !preload.primed && e.data === YT.PlayerState.PLAYING) { try { pl[i].pauseVideo(); pl[i].seekTo(0, true); } catch {} preload.primed = true; rlog('next song ready', { song: preload.key }); }
          return;
        }
        if (document.hidden && e.data !== 3) rlog('minimized: player ' + i + ' is now ' + ({ '-1': 'unstarted', 0: 'ended', 1: 'playing', 2: 'paused', 5: 'cued' }[e.data] || e.data), { song: current && current.key });
        if (e.data === YT.PlayerState.PLAYING) { clearTimeout(startWatch); playing = true; setPlayIcon(true); setLive(true); try { pl[i].unMute(); if (Number.isFinite(pl[i]._vol)) pl[i].setVolume(pl[i]._vol); } catch {} }
        else if (e.data === YT.PlayerState.PAUSED) {
          if (newsOn) return;   // the bulletin paused it on purpose
          if (!globalPaused && current && !current._selfPauses) current._selfPauses = 0;
          if (!globalPaused && current) {
            rlog('song paused by itself', { song: current.key, t: Math.round(pl[i].getCurrentTime()), busy, retry: current._selfPauses });
            if (current._selfPauses < 2) { current._selfPauses++; setTimeout(() => { try { if (!globalPaused && pl[ai] === pl[i]) pl[i].playVideo(); } catch {} }, 700); return; }
          }
          if (busy) return; playing = false; setPlayIcon(false); setLive(false);
        }
        else if (e.data === YT.PlayerState.ENDED) { if (started && !busy && !repeatSong()) advance(); }
      },
      onError: e => {
        if (adHook && adHook.idx === i) { adHook.error(e && e.data); return; }
        if (i === ai) { const c = current && current.cands && current.cands[candIdx]; rlog('player error ' + (e && e.data), { song: current && current.key, id: c && c.id }); tryNextCand(e && e.data); }
        else preload = null;
      },
    } });
  });
};
const tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(tag);
const waitYT = async () => { while (!ytReady) await sleep(200); };
const P = () => pl[ai];
window.__radio = { brk: (n, prevPodcast) => {   // test helper: what the break after song n would contain (does not change the saved cycle)
    const keepB = lib.b, keepUsed = JSON.stringify(lib.used); lib.b = n / breakEvery() - 1;
    const p = prevPodcast ? { a: 'x', t: 'y', podcast: true, key: 'p' } : songs[0];
    const out = makeBreak(p, songs[1], false); lib.b = keepB; lib.used = JSON.parse(keepUsed); saveLib();
    return { podcastDue, parts: out.map(s => ({ kind: s.kind, title: s.title, lines: (s.lines || []).map(l => (l.w || 'h') + ': ' + l.t) })) };
  }, welcome: () => makeBreak(null, songs[0], true).map(s => ({ kind: s.kind, lines: (s.lines || []).map(l => l.t) })),
  songsCount: () => songs.length, intro: (k, pk) => { const s = songs.find(x => x.key === k), p = songs.find(x => x.key === pk); return introFor(s, p); }, back: k => backFor(songs.find(x => x.key === k)),
  mask: t => maskWords(t), lib: () => lib, S: () => S, bulletin: () => buildBulletin, state: () => ({ ai, busy, speaking, playing, vol: S.vol, paused: globalPaused, current: current && current.key }) };

// Volume is tracked by us, never read back from YouTube: right after a video loads, getVolume() returns undefined.
function setVol(p, v) {
  v = Math.max(0, Math.min(100, Math.round(+v)));
  if (!Number.isFinite(v)) v = 0;
  p._vol = v;
  try { p.setVolume(v); } catch {}
}
function fadeP(p, to, ms) {
  return new Promise(res => {
    clearInterval(p._ft);
    p._fadeTo = to;
    const from = Number.isFinite(p._vol) ? p._vol : 0;
    const t0 = performance.now(), len = Math.max(1, ms);
    p._fading = true;
    p._ft = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / len); setVol(p, from + (to - from) * k);
      if (k >= 1) { clearInterval(p._ft); p._fading = false; setVol(p, to); res(); }
    }, 100);
  });
}
// Where a song's video comes from: its saved videos (checked in advance, content13.js), else a search through the PC
// helper, else (the website) a search through public relays.
async function resolve(s) {
  if (s.cands && s.cands.length) return s.cands;
  if (s.focus) return resolveFocus(s);
  if (s.album) return resolveAlbum(s);
  const c = (await ytSearch(s.a + ' ' + s.t, s.a, s.t)).slice(0, 5);
  if (c.length) { s.cands = c; lib.cache[s.key] = c; saveLib(); return c; }
  return [];
}
// A song that does not start: on a slow connection it may only be loading. The radio waits while YouTube is still
// buffering (up to a minute), and only moves to another version when the player really is stuck.
function armStartWatch() {
  clearTimeout(startWatch);
  const t0 = Date.now(), my = current;
  const check = () => {
    if (playing || globalPaused || current !== my) return;
    let st = -1; try { st = P().getPlayerState(); } catch {}
    const waited = Date.now() - t0;
    if ((st === 3 && waited < 45000) || ((st === -1 || st === 5) && waited < 10000)) { startWatch = setTimeout(check, 1500); return; }
    if (document.hidden) {   // minimized: another version would not start either; keep asking this one, and it plays at the latest when the window comes back
      if (!my._hidNote) { my._hidNote = 1; rlog('minimized: the song is waiting to start', { song: my.key, state: st }); }
      try { P().unMute(); P().playVideo(); } catch {}
      startWatch = setTimeout(check, 2000); return;
    }
    rlog('did not start, trying another version', { song: my && my.key, state: st, waited: Math.round(waited / 1000) });
    tryNextCand();
  };
  startWatch = setTimeout(check, 4000);
}
// The handover: the new song starts on the idle player, the old one fades out over Smooth transitions (off, 2 s, 4 s).
const fadeMs = () => (S.fade === 0 ? 0 : (S.fade || 3)) * 1000;
async function startSong(s, startVol, fadeInMs = 0, outMs = fadeMs()) {
  const run = runId;
  await waitYT();
  const c = await resolve(s);
  if (run !== runId) { rlog('stale start ignored', { song: s.key }); return null; }
  if (!c.length) { toast(`Could not find "${s.t}". Skipping.`); return false; }
  const old = pl[ai], n = 1 - ai;
  candIdx = 0; current = s; ai = n; playing = false;
  const np = pl[n];
  setVol(np, fadeInMs ? 0 : startVol);
  try { np.unMute(); } catch {}   // a muted video is paused by the browser while the window is minimized: never start one muted
  const resumed = !!(preload && preload.key === s.key && preload.idx === n && preload.primed);
  if (preload && preload.key === s.key && preload.idx === n) { try { np.seekTo(0, true); } catch {} np.playVideo(); } else np.loadVideoById(c[0].id);   // a primed song only resumes, which works even when minimized
  preload = null;
  s._playedId = c[0].id;
  rlog('start', { song: s.key, id: c[0].id, primed: resumed, minimized: document.hidden });
  const stopOld = () => { try { if (pl[ai] !== old) old.pauseVideo(); } catch {} };
  if (old._fading && old._fadeTo === 0) { const w = setInterval(() => { if (!old._fading) { clearInterval(w); stopOld(); } }, 250); }   // already fading under the host
  else fadeP(old, 0, Math.max(1, outMs)).then(stopOld);
  setNow(s);
  armStartWatch();
  if (fadeInMs) fadeP(np, S.vol, fadeInMs);
  if (!s.podcast && !s.focus && !s.album) {   // remembered across sessions, so the radio does not replay the same songs every time it opens
    lib.hist = lib.hist || []; lib.hist.push({ k: s.key, a: s.a }); if (lib.hist.length > 400) lib.hist.splice(0, lib.hist.length - 400); saveLib();
  }
  return true;
}

// Getting the next song ready on the idle player. A minimized window will not let a YouTube video START, but it will
// let a paused one resume. So the next song is started silently (muted, volume 0) while it is being prepared, and
// paused right at its start (see onStateChange); when its turn comes it only resumes.
function primeNext(p, c) {
  const n = 1 - ai, q = pl[n]; if (!q || !c || !c.length) return;
  try { setVol(q, 0); q.unMute(); preload = { key: p.key, idx: n, primed: false }; q.loadVideoById(c[0].id); setVol(q, 0); } catch {}   // volume 0, not muted (see startSong)
}
function wrongSong() {
  if (!current || !current.cands || current.cands.length < 2 || busy) return toast('No other version to try.');
  const c = current.cands; c.push(c.shift()); // the wrong one goes to the back, so it is remembered
  current.cands = c; lib.cache[current.key] = c;
  const u = lib.user.find(x => x.key === current.key); if (u) u.cands = c;
  if (current.podcast) { current.a = c[0].channel; current.t = cleanTitle(c[0].title); }
  saveLib(); candIdx = 0; P().loadVideoById(c[0].id); setNow(current); toast(current.podcast ? 'Trying another episode.' : 'Trying another version.');
}
// "Try another version": a sheet with search results for the playing song. The chosen upload plays at once and
// replaces the saved version everywhere (library, favorites); the old ones stay behind it as backups.
let verSong = null;
function openVersions() {
  if (!current) return toast('Nothing is playing.');
  if (current.podcast) return wrongSong();   // podcasts keep the quick "next episode" behaviour
  verSong = current;
  $('verq').value = `${current.a} - ${current.t}`;
  openSheet('shVer'); searchVersions();
}
async function searchVersions() {
  const s = verSong, q = $('verq').value.trim(); if (!s || !q) return;
  const box = $('verRes');
  box.innerHTML = '<p style="color:var(--mute)">Searching…</p>';
  try {
    const r = await ytSearch(q);
    if (verSong !== s) return;
    const playingId = current === s && s.cands ? (s.cands[candIdx] || s.cands[0] || {}).id : null;
    const list = (Array.isArray(r) ? r : []).slice(0, 8);
    if (playingId && !list.some(v => v.id === playingId)) { const pv = s.cands.find(c => c.id === playingId); if (pv) list.unshift(pv); }
    if (!list.length) throw 0;
    box.innerHTML = '';
    list.forEach(v => {
      const on = v.id === playingId;
      const d = document.createElement('div'); d.className = 'item';
      d.innerHTML = `<img src="https://i.ytimg.com/vi/${v.id}/default.jpg" width="48" height="36" style="border-radius:6px;object-fit:cover"><div class="meta"><b></b><span></span></div><button class="btn" style="padding:6px 11px"></button>`;
      d.querySelector('b').textContent = cleanTitle(v.title || '');
      d.querySelector('span').textContent = `${v.channel || ''}${v.seconds ? ' · ' + fmt(v.seconds) : ''}${on ? ' · playing now' : ''}`;
      const b = d.querySelector('button'); b.textContent = on ? 'Playing' : 'Use this'; b.disabled = on;
      b.onclick = () => useVersion(s, v);
      box.appendChild(d);
    });
  } catch { box.innerHTML = '<p style="color:var(--mute)">Nothing found, or the search failed. Try other words.</p>'; }
}
function useVersion(s, v) {
  const c = [v, ...(s.cands || []).filter(x => x.id !== v.id)];
  s.cands = c; lib.cache[s.key] = c;
  const u = lib.user.find(x => x.key === s.key); if (u) u.cands = c;
  const f = (lib.fav || []).find(x => x.key === s.key); if (f) f.id = v.id;   // favorites remember the exact version too
  saveLib(); openSheet(null);
  if (current === s) {
    candIdx = 0; playing = false; P().loadVideoById(v.id); setNow(s);
    armStartWatch();
  }
  toast('Saved: this version of "' + s.t + '" will play from now on.');
}
$('verGo').onclick = searchVersions; $('verq').onkeydown = e => { if (e.key === 'Enter') searchVersions(); };

// Playback diagnostics: kept in data/radio-log.txt by the helper, so a silent or skipped song can be explained later.
// The last 80 events are also kept on the device, for Settings > Playback report (useful on the phone, where there is no helper log).
const diag = (() => { try { return JSON.parse(localStorage.getItem('pbd-diag') || '[]'); } catch { return []; } })();
function rlog(msg, data) {
  try {
    console.info('[radio] ' + msg, data || '');
    diag.push(new Date().toLocaleTimeString('en-GB') + '  ' + msg + (data ? '  ' + JSON.stringify(data) : '')); if (diag.length > 80) diag.splice(0, diag.length - 80);
    try { localStorage.setItem('pbd-diag', JSON.stringify(diag)); } catch {}
    if (HELPER) fetch('/api/log', { method: 'POST', body: msg + (data ? ' ' + JSON.stringify(data) : '') }).catch(() => {});
  } catch {}
}
// The Windows app's minimize watcher (server.js): its hide / back steps go into this Report too
let hideSeq = -1;
setInterval(async () => {
  if (!HELPER) return;
  const j = await fetch('/api/hide-log?since=' + Math.max(0, hideSeq)).then(r => r.json()).catch(() => null);
  if (!j) return;
  if (hideSeq >= 0) (j.events || []).forEach(e => rlog(e.line));
  hideSeq = j.seq || 0;
}, 3000);
// code: the YouTube error. 100 = removed, 101/150 = the owner does not allow embedding. Those versions are
// dropped from the saved list for good, so the same broken upload is never tried again.
function tryNextCand(code) {
  if (!current || !current.cands) return skipBroken();
  if ([100, 101, 150].includes(code) && current.cands[candIdx] && !current.podcast) {
    const bad = current.cands[candIdx];
    current.cands = current.cands.filter(c => c.id !== bad.id);
    lib.cache[current.key] = current.cands;
    const u = lib.user.find(x => x.key === current.key); if (u) u.cands = current.cands;
    saveLib();
    candIdx--;   // the list moved up by one, so the next try is the same position
  }
  candIdx++;
  if (candIdx >= current.cands.length) {
    // the saved versions could not play: search YouTube once for other uploads of the same song before giving up
    if (!current.podcast && !current._searched) {
      const s = current; s._searched = true;
      ytSearch(s.a + ' ' + s.t, s.a, s.t).catch(() => [])
        .then(c => {
          if (current !== s) return;
          const more = (Array.isArray(c) ? c : []).filter(x => !s.cands.some(y => y.id === x.id)).slice(0, 5);
          if (!more.length) return skipBroken();
          s.cands = s.cands.concat(more); lib.cache[s.key] = s.cands; saveLib();
          P().loadVideoById(s.cands[candIdx].id); setNow(s);
          armStartWatch();
        });
      return;
    }
    return skipBroken();
  }
  if (current.podcast) { const v = current.cands[candIdx]; current.a = v.channel; current.t = cleanTitle(v.title); }
  P().loadVideoById(current.cands[candIdx].id); setNow(current);
  armStartWatch();
}
function skipBroken() {
  if (!current) return;
  rlog('skip: no playable version', { song: current.key });
  if (!current.podcast) { lib.bad = lib.bad || {}; lib.bad[current.key] = Date.now(); saveLib(); }   // rested for 30 days, then tried again
  toast(`"${current.t}" cannot be played here right now. Skipping.`); played.push(current.key); current = null; busy = false; advance({ noCount: true });
}
const restingBroken = s => lib.bad && lib.bad[s.key] && Date.now() - lib.bad[s.key] < 30 * 864e5;

// ---------- finding similar songs automatically ----------
const cleanTitle = t => t.replace(/\s*[\(\[][^\)\]]*(official|audio|video|lyric|remaster|hd|4k|visuali[sz]er)[^\)\]]*[\)\]]/gi, '').replace(/\s*\|.*$/, '').trim();
function splitTitle(v) {
  const t = cleanTitle(v.title); const m = t.match(/^(.+?)\s[-–—]\s(.+)$/);
  if (m) return { a: m[1].trim(), t: m[2].trim() };
  return { a: v.channel.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim(), t };
}
async function discover(s, id, max = 6) {
  try {
    const list = await (await fetch('/api/similar?id=' + id)).json();
    let n = 0; const have = new Set(songs.map(x => x.key)); const ids = new Set(songs.flatMap(x => (x.cands || []).map(c => c.id)));
    for (const v of list) {
      if (n >= max) break; if (ids.has(v.id)) continue; const p = splitTitle(v);
      const d = { a: p.a, t: p.t, q: `${p.a} ${p.t}`, tags: (s.tags || []).slice(), genre: s.genre || '', user: true, discovered: true, from: s.key, cands: [v] };
      d.key = key(d); if (have.has(d.key)) continue; have.add(d.key); ids.add(v.id);
      lib.user.push(d); lib.cache[d.key] = d.cands; n++;
    }
    if (n) { buildSongs(); saveLib(); }
    return n;
  } catch { return 0; }
}
async function maybeDiscover(s) {
  if (lib.disc[s.key] || lib.user.filter(x => x.discovered).length >= MAX_DISCOVERED) return;
  lib.disc[s.key] = 1;
  const c = s.cands && s.cands[0]; if (!c) return;
  const n = await discover(s, c.id, 5);
  if (n && $('shLib').classList.contains('open')) renderLib();
}

// ---------- programming ----------
// ---------- choosing the next song ----------
// It follows the feeling of what is playing: the same or a neighbouring genre, shared lyric themes, a similar mood and
// energy (calmer late at night), then draws at random among the best dozen, so it never becomes predictable.
// Now and then it takes a detour: the same theme in a completely different musical world.
// It never repeats an artist within a few songs, and never replays songs heard in the last sessions.
let lastPick = { key: null, why: '' };
const famOf = g => (R.genreMap && R.genreMap[g] || {}).family;
function energyTarget() { const h = new Date().getHours(); return h < 6 ? 1.6 : h < 11 ? 2.6 : h < 17 ? 3 : h < 21 ? 2.6 : 2.1; }
function similarity(a, b) {
  if (!a) return 0;
  const ma = R.genreMap && R.genreMap[a.genre], mb = R.genreMap && R.genreMap[b.genre];
  let s = 0;
  if (a.genre && a.genre === b.genre) s += 3;
  else if (ma && ma.near.includes(b.genre)) s += 1.8;
  else if (ma && mb && ma.family === mb.family) s += 1;
  const shared = (b.tags || []).filter(t => (a.tags || []).includes(t)).length;
  s += Math.min(shared, 3) * 1.1;
  if (a.mood && a.mood === b.mood) s += 0.8;
  if (a.energy && b.energy) s -= 0.5 * Math.abs(a.energy - b.energy);
  return s;
}
function recentSets() {
  const hist = lib.hist || [];
  const n = Math.max(10, Math.min(250, Math.floor(songs.length * 0.6)));
  const recentKeys = new Set([...hist.slice(-n).map(h => h.k), ...played.slice(-n)]);
  const recentArtists = new Set(hist.slice(-6).map(h => (h.a || '').toLowerCase()));
  if (current && current.a) recentArtists.add(current.a.toLowerCase());
  const byKey = k => songs.find(s => s.key === k);
  const last = hist.slice(-2).map(h => byKey(h.k)).filter(Boolean).concat(current ? [current] : []);
  const streakGenre = last.length >= 3 && last.every(s => s.genre && s.genre === last[0].genre) ? last[0].genre : null;
  const streakFamily = last.length >= 3 && last.every(s => famOf(s.genre) && famOf(s.genre) === famOf(last[0].genre)) ? famOf(last[0].genre) : null;
  const l2 = last.slice(-2), pairGenre = l2.length === 2 && l2[0].genre && l2[0].genre === l2[1].genre ? l2[0].genre : null;
  return { recentKeys, recentArtists, streakGenre, streakFamily, pairGenre };
}
function choose(cur, rs) {
  const target = energyTarget();
  const curT = cur && cur.t ? cur.t.toLowerCase() : null;   // also never the same title twice in a row (two Hallelujahs)
  let pool = songs.filter(s => !s.gift && !rs.recentKeys.has(s.key) && !rs.recentArtists.has((s.a || '').toLowerCase()) && (!cur || s.key !== cur.key) && !restingBroken(s) && (s.t || '').toLowerCase() !== curT);
  if (pool.length < 15) pool = songs.filter(s => !s.gift && (!cur || s.key !== cur.key));
  // never a 4th song of the same genre in a row (a strong match used to beat the penalty)
  if (rs.streakGenre) { const p2 = pool.filter(s => s.genre !== rs.streakGenre); if (p2.length >= 15) pool = p2; }
  if (cur && Math.random() < 0.18) {
    const detour = pool.filter(s => famOf(s.genre) && famOf(s.genre) !== "pop" && famOf(s.genre) !== famOf(cur.genre) && (s.tags || []).some(t => (cur.tags || []).includes(t)) && Math.abs((s.energy || 2) - (cur.energy || 2)) <= 1);
    if (detour.length) return { song: rnd(detour), why: 'detour' };
  }
  const scored = pool.map(s => ({ s, v: similarity(cur, s) - 0.35 * Math.abs((s.energy || 2) - target) + (favIdx(s.key) >= 0 ? 0.4 : 0) - (rs.pairGenre && s.genre === rs.pairGenre ? 1 : 0) - (rs.streakFamily && famOf(s.genre) === rs.streakFamily ? 1.5 : 0) - (famOf(s.genre) === "pop" ? 0.9 : 0) + Math.random() * 2.2 }));
  if (!scored.length) return { song: rnd(songs), why: 'any' };   // nothing left to compare (a library still loading)
  scored.sort((x, y) => y.v - x.v);
  const top = scored.slice(0, 12), low = top[top.length - 1].v;
  const w = top.map(x => Math.pow(x.v - low + 0.5, 2)); let r = Math.random() * w.reduce((p, q) => p + q, 0);
  for (let i = 0; i < top.length; i++) { r -= w[i]; if (r <= 0) return { song: top[i].s, why: 'match' }; }
  return { song: top[0].s, why: 'match' };
}
// Every 8 to 10 songs of the normal mix (R.giftEvery), one song from a family playlist, from a shuffled bag so each
// comes once before any repeats. giftHint remembers it, so the host says which playlist it is from right before it.
let giftHint = null;
function giftTurn() {
  if (S.justMusic || marathon || albumShow) return null;
  const lists = (R.giftLists || []).filter(L => (L.songs || []).length); if (!lists.length) return null;
  const [lo, hi] = R.giftEvery || [8, 10];
  if (!lib.giftAt) lib.giftAt = lo + Math.floor(Math.random() * (hi - lo + 1));
  lib.giftGap = (lib.giftGap || 0) + 1;
  if (lib.giftGap < lib.giftAt) { saveLib(); return null; }
  const of = new Map(); lists.forEach(L => L.songs.forEach(line => { const [a, t] = String(line).split('|'); const k = key({ a, t }); if (!of.has(k)) of.set(k, L.name); }));
  const ok = k => songs.some(s => s.key === k) && !lib.removed.includes(k) && (!current || current.key !== k);
  lib.giftBag = (lib.giftBag || []).filter(k => of.has(k));
  if (!lib.giftBag.length) lib.giftBag = shuffle([...of.keys()]);
  const k = lib.giftBag.find(ok); if (!k) { saveLib(); return null; }
  lib.giftBag = lib.giftBag.filter(x => x !== k); lib.giftGap = 0; lib.giftAt = 0; saveLib();
  const s = songs.find(x => x.key === k);
  giftHint = { key: k, name: of.get(k) };
  rlog('family song in the mix', { song: k, list: giftHint.name });
  return s;
}
function lastHeard() { const h = (lib.hist || []).slice(-1)[0]; return h ? songs.find(s => s.key === h.k) : null; }
function pick() {
  if (upNext.length) return upNext.shift();
  if (focusMode && focusOk()) return focusPick();   // the phone and the web cannot search YouTube for them
  if (batch) { const s = nextFromRun(); if (s) return s; }
  const g = giftTurn(); if (g) return g;
  const c = choose(current || lastHeard(), recentSets());
  lastPick = { key: c.song.key, why: c.why };
  return c.song;
}
// ---------- Homework mode: instrumental only (or ambient sounds), no talking, until you turn it off ----------
// Its tracks (content23.js) live apart from the library; the news still comes every 4 hours.
// Instrumental music is split into stations (R.focusStations): the one you pick plays alone until you change it.
const focusSong = (a, t, st) => { const key = 'focus|' + (a + '|' + t).toLowerCase(), v = (R.focusIds || {})[(a + '|' + t).toLowerCase()]; return { a, t, style: st, genre: 'focus', tags: [], focus: true, key, pin: v ? [].concat(v).map(x => typeof x === 'string' ? { id: x, title: t, channel: a, seconds: 0 } : x) : null }; };
const focusOk = () => HELPER || (R.focusStations || []).length > 0;
const focusStations = (R.focusStations || []).map(st => ({ ...st, songs: st.tracks.map(l => { const [a, t] = l.split('|'); return focusSong(a, t, st.id); }) }));
// Your own genres (Focus > Add a genre, lib.focusCustom, synced): only the tracks you chose for them, in lib.focusAdd
const allStations = () => focusStations.concat((lib.focusCustom || []).map(c => ({ id: c.key, label: c.label, note: 'your genre', songs: [], custom: true })));
const focusStation = id => allStations().find(st => st.id === id);
// A station's tracks: the hand-picked ones, plus the ones you suggested to it (lib.focusAdd, synced; never in the library)
const stationSongs = st => st.songs.concat((lib.focusAdd || []).filter(x => x.st === st.id && !st.songs.some(s => s.key === x.k)).map(x => Object.assign(focusSong(x.a, x.t, st.id), { pin: x.v ? [x.v] : null })));
let focusMode = ''; try { focusMode = localStorage.getItem('pbd-focus') || ''; } catch {}
if (focusMode === 'music') focusMode = focusStations.length ? focusStations[0].id : '';   // from before the stations
function focusPick() {
  if (focusMode === 'sounds') {
    const all = R.focusSounds || []; let used = []; try { used = JSON.parse(localStorage.getItem('pbd-focus-snd') || '[]'); } catch {}
    let pool = all.filter(x => !used.includes(x.label)); if (!pool.length) { used = []; pool = all; }
    const x = rnd(pool); used.push(x.label); try { localStorage.setItem('pbd-focus-snd', JSON.stringify(used)); } catch {}
    const ids = (R.focusSoundIds || {})[x.label];
    return { a: 'Ambient sounds', t: x.label, q: x.q, genre: 'focus', tags: [], focus: true, sounds: true, key: 'focus-sound|' + x.label.toLowerCase(), pin: ids ? ids.map(id => ({ id, title: x.label, channel: 'Ambient sounds', seconds: 0 })) : null };
  }
  let used = []; try { used = JSON.parse(localStorage.getItem('pbd-focus-used') || '[]'); } catch {}
  const playable = x => HELPER || (x.pin && x.pin.length);   // the website cannot search: only tracks with a checked video
  let st = focusStation(focusMode), songs = st ? stationSongs(st).filter(s => !lib.removed.includes(st.id + '>' + s.key) && playable(s)) : [];
  if (!songs.length) { st = focusStations[0]; songs = stationSongs(st).filter(s => !lib.removed.includes(st.id + '>' + s.key) && playable(s)); focusMode = st.id; try { localStorage.setItem('pbd-focus', focusMode); } catch {} paintFocus(); }   // a genre deleted on another device
  let pool = songs.filter(s => !used.includes(s.key) && !restingBroken(s) && (!current || s.a !== current.a)); if (!pool.length) { used = used.filter(k => !songs.some(s => s.key === k)); pool = songs; }
  const s = Object.assign({}, rnd(pool)); used.push(s.key); try { localStorage.setItem('pbd-focus-used', JSON.stringify(used.slice(-120))); } catch {}
  return s;
}
async function resolveFocus(s) {
  let fc = {}; try { fc = JSON.parse(localStorage.getItem('pbd-focus-cache') || '{}'); } catch {}
  if (s.pin) return (s.cands = s.pin);   // a track you suggested: the exact video you picked
  if (!s.sounds && fc[s.key] && fc[s.key].length) return (s.cands = fc[s.key]);
  try {
    let c = s.sounds ? (HELPER ? await fetch('/api/long?q=' + encodeURIComponent(s.q)).then(r => r.json()).catch(() => []) : []) : await ytSearch(s.a + ' ' + s.t, s.a, s.t);
    if (!Array.isArray(c) || !c.length) return [];
    c = s.sounds ? [...c].sort(() => Math.random() - 0.5).slice(0, 5) : c.slice(0, 5);
    s.cands = c; if (!s.sounds) { fc[s.key] = c; try { localStorage.setItem('pbd-focus-cache', JSON.stringify(fc)); } catch {} }
    return c;
  } catch { return []; }
}
function paintFocus() {
  document.body.classList.toggle('dream', !!focusMode);   // the dream skin while Homework mode is on
  const b = $('btnFocus'); if (b) { b.classList.toggle('on', !!focusMode); b.title = focusMode ? 'Homework mode is on (' + (focusMode === 'sounds' ? 'ambient sounds' : (focusStation(focusMode) || { label: 'chill beats' }).label) + ')' : 'Homework mode'; }
  const box = $('focusStations'); box.innerHTML = '';
  allStations().forEach(st => {
    const b = document.createElement('button'); b.dataset.v = st.id; b.setAttribute('role', 'menuitem'); b.innerHTML = '<span></span><em></em>';
    b.firstChild.textContent = st.label; b.lastChild.textContent = st.note;
    if (st.custom) { const e = document.createElement('i'); e.className = 'edit'; e.dataset.edit = st.id; e.title = 'Edit ' + st.label; e.textContent = 'Edit'; b.appendChild(e); }
    box.appendChild(b);
  });
  const add = document.createElement('button'); add.className = 'add'; add.dataset.act = 'add'; add.innerHTML = '<span>+ Make my own station</span><em>from tracks you choose (in the installed app)</em>'; box.appendChild(add);
  document.querySelectorAll('#focusMenu button').forEach(x => x.classList.toggle('on', x.hasAttribute('data-v') && x.dataset.v === focusMode));
}
function setFocus(mode) {
  if (mode === focusMode) return;
  focusMode = mode; try { localStorage.setItem('pbd-focus', mode); } catch {}
  paintFocus(); planned = null; preload = null;
  rlog('focus mode', { mode: mode || 'off' });
  toast(mode === 'sounds' ? 'Homework mode: ambient sounds. No talking.' : mode ? 'Homework mode: ' + (focusStation(mode) || { label: 'chill beats' }).label + '. No talking, no shows. Good luck!' : 'Homework mode off. ' + R.host + ' is back.');
  if (started && !newsOn) { stopSpeech(); advance({ silent: true, noCount: true, quick: true }); }   // switch now, with a crossfade
}
const takePlanned = () => { const p = planned; planned = null; return p || pick(); };
function planPreload() {
  if (albumShow) return albumPreload();
  if (planned || marathon) return;   // a marathon chooses its next part when this one ends
  planned = pick(); if (!planned) return;
  const p = planned;
  resolve(p).then(c => { if (planned !== p || !c.length || !ytReady) return; primeNext(p, c); });
}
// The break after this song, written early so its speech can be recorded in time (desktop voices only). Only when
// the host will talk at that change; anything that changes the plan (Next, a chosen song) simply drops it.
let preBreak = null;
function planBreak() {
  if (!kokoroReady() || !planned || !current || preBreak || busy || marathon || albumShow || S.justMusic || planned.focus || current.podcast) return;
  if (giftHint && giftHint.key === planned.key) return;
  if (songsSinceBreak + 1 < breakEvery() || podcastDue || dedications.has(planned.key)) return;
  if ((lib.adCount || 0) + 1 >= (R.adsEvery || 6)) return;   // the commercials come at that change
  if (lastRunSong && current.key === lastRunSong.key) return;
  preBreak = { next: planned, prev: current, segs: makeBreak(current, planned, false), intro: introFor(planned, current) };
  preSegs(preBreak.segs); kokoroPre(preBreak.intro, 'h');
  rlog('next break prepared', { parts: preBreak.segs.length });
}
const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const period = () => { const h = new Date().getHours(); return h < 5 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; };
// {age}: the listener's age, from the birth date in R.listener (content19.js)
const listenerAge = () => { const b = R.listener && R.listener.born; if (!b) return ''; const [y, m, d] = b.split('-').map(Number), n = new Date(); return n.getFullYear() - y - ((n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < d)) ? 1 : 0); };
const isBirthday = () => { const b = R.listener && R.listener.born; if (!b) return false; const n = new Date(); return b.slice(5) === String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); };
const sub = (text, s, x) => String(text || '').replace(/\{age\}/g, listenerAge()).replace(/\{label\}/g, x && x.label ? x.label : '').replace(/\{min\}/g, x ? x.min : '').replace(/\{topic\}/g, x ? x.topic : '').replace(/\{host\}/g, R.host).replace(/\{station\}/g, R.station).replace(/\{time\}/g, clock()).replace(/\{a\}/g, s ? s.a : '').replace(/\{t\}/g, s ? s.t : '');
const fill = sub;

// Shuffle bag: nothing repeats until everything in its pool has been used. Remembered between sessions.
const idOf = x => typeof x === 'string' ? x.slice(0, 48) : (x.id || x.title || x.name || JSON.stringify(x).slice(0, 48));
function fresh(name, arr) {
  if (!arr || !arr.length) return undefined;
  const used = (lib.used[name] = lib.used[name] || []);
  let avail = arr.filter(x => !used.includes(idOf(x)));
  if (!avail.length) { used.length = 0; avail = arr.slice(); }
  const x = avail[Math.floor(Math.random() * avail.length)];
  used.push(idOf(x)); if (used.length > 500) used.shift(); saveLib();
  return x;
}
const seedByKey = new Map(R.songs.map(s => [key(s), s]));
const scriptFor = s => (seedByKey.has(s.key) && R.songScripts) ? R.songScripts[s.t.toLowerCase()] : null;
const tagOf = s => s.tags && s.tags.length ? (Math.random() < 0.6 ? s.tags[0] : rnd(s.tags)) : 'fun';   // the first theme is the song's main one
// What the host knows about a song (content22.js): its own notes first, otherwise a word about the artist, now and then.
let artistNoteMap = null;
const artistNotesMap = () => artistNoteMap || (artistNoteMap = new Map(Object.entries(R.artistNotes || {}).map(([k, v]) => [fold(k).trim(), v])));
function noteFor(s, back) {
  const own = (R.songNotes || {})[s.key];
  if (own && own.length) return fresh((back ? 'noteb:' : 'note:') + s.key, own);
  const main = artistParts(s.a)[0], an = main && artistNotesMap().get(main);
  return an && Math.random() < (back ? 0.25 : 0.5) ? fresh('anote:' + main, an) : '';
}
const moodLine = s => { const m = R.moodBy && R.moodBy[s.mood]; return m && m.length && Math.random() < 0.7 ? fresh('moodby:' + s.mood, m) : fresh('mood', R.moodLines); };
function energyLine(prev, s) {   // only for a big change, and not every time
  if (!prev || !prev.energy || !s.energy || prev.podcast || Math.random() > 0.7) return '';
  const d = s.energy - prev.energy;
  return d <= -2 && R.energyDown ? fresh('edown', R.energyDown) : d >= 2 && R.energyUp ? fresh('eup', R.energyUp) : '';
}
const themeLine = s => { const tg = tagOf(s); return fresh('theme:' + tg, R.themeLine[tg] || R.themeLine.fun); };
// The artists of the catalog, to tell which bands a fact talks about
let catArtists = null;
const allArtists = () => catArtists || (catArtists = [...new Set([...(R.catalog || []).map(x => x.a), ...Object.keys(R.artistNotes || {})].flatMap(a => artistParts(a)).filter(a => a.length > 2))]);
const namesIn = t => { const f = ' ' + fold(String(t)).replace(/[^a-z0-9& ]+/g, ' ') + ' '; return allArtists().filter(a => f.includes(' ' + a.replace(/[^a-z0-9& ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ')); };
// a fact is fine when every band it names is one of the songs around it (or it names none)
const fitsAround = (t, ...songs) => { const near = new Set(songs.filter(Boolean).flatMap(x => artistParts(x.a))); return namesIn(t).every(a => near.has(a)); };
function genreNote(s, prev) {
  const g = s.genre || ''; const base = R.genreNotes.find(x => x.g === g);
  let pool = [base && base.t, ...((R.genreMore || {})[g] || [])].filter(Boolean).filter(t => fitsAround(t, s, prev));
  return pool.length ? fresh('genre:' + (g || 'any'), pool) : null;
}
// Shout-outs from Add a song: kept only here, in memory, until Joe has said them; never saved, synced or logged.
const dedications = new Map();
function introFor(s, prev) {
  if (s.live && R.liveIntros && R.liveIntros.length && !dedications.has(s.key)) return sub(fresh('live', R.liveIntros), s);
  if (dedications.has(s.key)) {   // a few words from Joe, your words exactly, then the song
    const d = dedications.get(s.key).replace(/[.!?،]+$/, ''); dedications.delete(s.key);
    return sub(fresh('dedication', R.dedicationLines || ['A dedication now. {d}. Here is {a}, {t}.']), s).replace('{d}', () => d);
  }
  // a small bridge when the new song shares a theme with the last one, or a word about the detour
  let bridge = '';
  const shared = prev ? (s.tags || []).filter(t => (prev.tags || []).includes(t)) : [];
  if (lastPick.key === s.key && lastPick.why === 'detour' && shared.length && R.detourLines) bridge = sub(fresh('detour', R.detourLines)).replace('{theme}', shared[0].replace('-', ' '));
  else if (shared.length && R.themeBridges && Math.random() < 0.45) bridge = fresh('tb:' + shared[0], R.themeBridges[shared[0]] || []) || '';
  const sc = scriptFor(s);
  if (sc && sc.intros && sc.intros.length) return (bridge ? bridge + ' ' : '') + sub(fresh('intro:' + s.key, sc.intros), s);
  const mine = s.user && !s.discovered;
  const parts = [];
  if (bridge) parts.push(bridge);
  const el = energyLine(prev, s); if (el) parts.push(el);
  parts.push(sub(fresh(mine ? 'newsong' : 'opener', mine ? R.newSongTemplates : R.introTemplates), s));
  const note = s.fact || noteFor(s);
  s._said = '';
  if (note && Math.random() < 0.85) { parts.push(note); s._said = note; }   // what this song is about comes first
  else {
    // otherwise its main theme, its genre (only when the genre changes), or a line that fits its mood
    const r = Math.random(), newGenre = s.genre && (!prev || prev.genre !== s.genre);
    parts.push(r < 0.4 ? themeLine(s) : r < 0.75 && newGenre ? (genreNote(s, prev) || moodLine(s)) : moodLine(s));
    if (Math.random() < 0.25) parts.push(moodLine(s));
  }
  return parts.join(' ');
}
function backFor(s) {
  if (s.podcast && s.show && R.podShows && R.podShows[s.show]) return sub(fresh('podshowout:' + s.show, R.podShows[s.show].outros), s);
  if (s.podcast) return sub(fresh('podoutro', R.podOutros || ['That was {a}. Back to the music.']), s);
  const sc = scriptFor(s);
  if (sc && sc.backs && sc.backs.length) return sub(fresh('back:' + s.key, sc.backs), s);
  let r = Math.random(), note = r < 0.3 ? noteFor(s, true) : '';
  if (note && note === s._said) { note = ''; r = 0.5; }   // never the same note twice in a row for one song
  return sub(fresh('back', R.backTemplates), s) + (note ? ' ' + note : r < 0.75 ? ' ' + themeLine(s) : '');
}

// Joe speaks after every 2 songs (Settings: a lot = every song, a little = every 4).
const breakEvery = () => S.talk === 'high' ? 1 : S.talk === 'low' ? 4 : 2;
const today = () => new Date().toDateString();

// Programming: a cycle of 64 songs, with at most ONE big part per break. After song 8, 24, 40, 56: a trivia shot, a
// genre trivia bit or a side quest (taking turns); 16: Book Nook with Luna; 32: a note to Rim; 48: Today's Mission
// (when it has not been given yet today); 64: a podcast (Saturdays: a live concert). The cycle position is saved.
// The other breaks may get a small extra (an ident, a bit of banter with Luna, a check-in, genre trivia).
const CYCLE = 64;
function bigPartAt(n) {
  const pos = n % CYCLE;
  if (pos === 0) return 'podcast';
  if (pos % 16 === 8) return 'shot';
  return { 16: 'book', 32: 'note', 48: 'mission' }[pos] || null;
}
let lastBreakN = 0, podcastDue = false;
const lines = (kind, arr, extra) => ({ kind, lines: arr.filter(Boolean).map(x => typeof x === 'string' ? { t: x } : x), ...(extra || {}) });

// Today's Mission: once a day, the first time the radio is on that day. No follow-up later.
function missionSeg(birthday) {
  lib.missionDay = today(); saveLib();
  const m = birthday && R.birthday && R.birthday.mission ? R.birthday.mission : fresh('mission', R.missions);
  return lines("Today's Mission", [sub(fresh('missionhand', R.missionHandovers || ['Joe, mission time.'])), { t: sub(fresh('missionlead', R.missionLeads || ['Okay Rim, mission time.'])), w: 's' }, { t: sub(m), w: 's' }]);
}
const missionDue = () => lib.missionDay !== today() && (R.missions || []).length;
// A trivia shot about the song that is coming (or the one that just played); otherwise a general one.
function triviaSeg(next, prev) {
  for (const s of [next, prev]) {
    if (!s || s.podcast || s.focus) continue;
    const own = (R.songNotes || {})[s.key];
    if (own && own.length) return lines('Trivia shot', [sub(fresh('triviashot', R.triviaLeads || ['Trivia shot.'])), sub(fresh('note:' + s.key, own), s)]);
    const main = artistParts(s.a)[0], an = main && artistNotesMap().get(main);
    if (an && an.length) return lines('Trivia shot', [sub(fresh('triviashot', R.triviaLeads || ['Trivia shot.'])), sub(fresh('anote:' + main, an), s)]);
  }
  const any = (R.triviaShots || []).filter(t => fitsAround(t, next, prev));
  return any.length ? lines('Trivia shot', [sub(fresh('triviashot', R.triviaLeads || ['Trivia shot.'])), sub(fresh('triviaany', any))]) : null;
}
function genreSeg(next, prev) { const n = next && genreNote(next, prev); if (!n) return null; return lines('Genre trivia', [sub(fresh('genrelead', R.genreLeads || ['A little genre trivia.']), next), n], { title: (R.genreMap[next.genre] || {}).name }); }
function sideQuestSeg(next, prev) {
  const kinds = Object.keys(R.sideQuests || {}); if (!kinds.length) return null;
  const k = kinds[(lib.sqTurn = ((lib.sqTurn || 0) + 1)) % kinds.length];
  const pool = (R.sideQuests[k] || []).filter(t => fitsAround(t, next, prev)); if (!pool.length) return null;   // a tip about a band only next to that band
  return lines('Side quest', [sub(fresh('sqlead', R.sideQuestLeads || ['Side quest, if you feel like it.'])), sub(fresh('sq:' + k, pool))], { title: (R.sideQuestNames || {})[k] });
}
function bookSeg() {
  const b = fresh('book', R.bookNook || []); if (!b) return null;
  const out = [{ t: sub(fresh('booklead', R.bookLeads || ['Book Nook time. Luna?']).replace(/\{title\}/g, b.title).replace(/\{by\}/g, b.by)) }];
  (Array.isArray(b.t) ? b.t : [b.t]).forEach(x => out.push({ t: sub(x), w: 's' }));
  if (b.joe) out.push({ t: sub(b.joe) });
  return { kind: 'Book Nook', title: b.title + ' · ' + b.by, lines: out };
}
function noteSeg() { const n = fresh('note', R.notes || []); return n ? lines('A note to Rim', (Array.isArray(n) ? n : [n]).map(x => sub(x))) : null; }
function banterSeg() { const b = fresh('banter', R.banter || []); return b ? { kind: R.station, title: 'Luna & Joe', lines: b.map(l => ({ t: sub(l.t), w: l.w })) } : null; }
function birthdaySegs() {
  lib.bdayDone = today(); saveLib();
  const B = R.birthday || {};
  return [{ kind: 'Happy birthday', jingle: 'party' }, lines('Happy birthday, Rim', (B.show || []).map(x => typeof x === 'string' ? sub(x) : { t: sub(x.t), w: x.w })), missionSeg(true)];
}
const birthdayDue = () => isBirthday() && lib.bdayDone !== today();

function makeBreak(prev, next, first) {
  const out = [], station = R.station;
  podcastDue = false;
  if (first) {
    out.push(lines(station, [sub(fresh('welcome:' + period(), R.welcomes[period()]), next)]));
    if (birthdayDue()) { out.push(...birthdaySegs()); return out; }
    if (missionDue()) out.push(missionSeg());
    return out;
  }
  if (prev) out.push(lines(station, [backFor(prev)]));
  let runAnnounced = false;
  if (prev && lastRunSong && prev.key === lastRunSong.key) { out.push({ kind: 'Genre Mix', title: lastRunSong.label, lines: [{ t: sub(fresh('runend', R.runEnds), null, { label: lastRunSong.label }) }] }); lastRunSong = null; runAnnounced = true; }
  lib.b = (lib.b || 0) + 1; saveLib();
  const n = lib.b * breakEvery();
  lastBreakN = n;
  let big = bigPartAt(n);
  if (big === 'mission' && !missionDue()) big = 'shot';
  podcastDue = big === 'podcast';
  const afterPod = !!(prev && prev.podcast);
  if (birthdayDue() && !afterPod) { out.push(...birthdaySegs()); big = big === 'podcast' ? big : null; }
  else if (missionDue() && !big && !afterPod) out.push(missionSeg());   // the radio was opened without a welcome (after an update): the mission still comes
  if (big === 'shot') {
    const turn = (lib.shotTurn = ((lib.shotTurn || 0) + 1)) % 3;
    out.push(turn === 0 ? triviaSeg(next, prev) : turn === 1 ? (genreSeg(next, prev) || triviaSeg(next, prev)) : (sideQuestSeg(next, prev) || triviaSeg(next, prev)));
  }
  if (big === 'book') { const b = bookSeg(); if (b) out.push(b); }
  if (big === 'note') { const x = noteSeg(); if (x) out.push(x); }
  if (big === 'mission') out.push(missionSeg());
  // small extras: only on breaks with no big part, and never right after a podcast
  if (!big && !adsDue && !runAnnounced && !afterPod && !startAnnounce && Math.random() < 0.6) {
    const r = Math.random();
    const x = r < 0.25 ? lines(station, [sub(fresh('ident', R.idents), next)])
      : r < 0.5 ? banterSeg()
      : r < 0.65 ? lines('Check-in', [sub(fresh('checkin', R.checkins))])
      : r < 0.85 ? genreSeg(next, prev)
      : sideQuestSeg(next, prev);
    if (x) out.push(x);
  }
  // a Genre Mix is announced last, right before its first song; if a podcast comes first, it waits until after it
  if (adsDue) { adsDue = false; lib.adCount = 0; saveLib(); out.push(...adBreakSegs()); }
  if (next && giftHint && giftHint.key === next.key && !giftAnnounce) { const nm = giftHint.name; giftHint = null; out.push({ kind: 'Playlist', title: nm, lines: [{ t: sub(fresh('gifthint', R.giftHints || ['This one comes from {name}.'])).replace(/\{name\}/g, nm) }] }); }
  if (giftAnnounce) { out.push({ kind: 'Playlist', title: giftAnnounce, lines: [{ t: sub(fresh('giftlist', R.giftListLines || ['Here comes {name}.'])).replace(/\{name\}/g, giftAnnounce) }] }); giftAnnounce = ''; }
  if (startAnnounce && !podcastDue) { out.push({ kind: 'Genre Mix', title: startAnnounce, lines: [{ t: sub(fresh('runstart', R.runStarts), null, { label: startAnnounce }) }] }); startAnnounce = null; }
  return out.filter(Boolean);
}

let breakSkip = null, adHook = null, adSkip = null, adsDue = false;
// The commercials: a shuffled bag, so none comes back before all the others have played (kept across sessions).
function nextAd() {
  const all = (R.ads || []).filter(a => a && a.id); if (!all.length) return null;
  lib.adBag = (lib.adBag || []).filter(id => all.some(a => a.id === id));
  if (!lib.adBag.length) { lib.adBag = shuffle(all.map(a => a.id)); if (lib.adBag[0] === lib.adLast && lib.adBag.length > 1) lib.adBag.push(lib.adBag.shift()); }
  const id = lib.adBag.shift(); lib.adLast = id; saveLib();
  return all.find(a => a.id === id);
}
// One commercial on the idle player, at the music's volume. Next skips it. Not started in 12 s: another one is tried.
function playAdVideo(v) {
  return new Promise(res => {
    const idx = 1 - ai, p = pl[idx]; let started = false, done = false, tick;
    const finish = ok => { if (done) return; done = true; clearInterval(tick); adHook = null; adSkip = null; breakSkip = null; try { p.pauseVideo(); setVol(p, 0); } catch {} res(ok); };
    adHook = { idx, state: s => { if (s === YT.PlayerState.PLAYING) { started = true; setLive(true); try { p.unMute(); } catch {} } else if (s === YT.PlayerState.ENDED) finish(true); }, error: () => finish(false) };
    adSkip = () => finish(true); breakSkip = adSkip;
    preload = null;
    try { p.unMute(); } catch {}
    setVol(p, Math.round(S.vol * 0.9)); p.loadVideoById(v.id);
    let waited = 0, stall = 0, last = -1;
    tick = setInterval(() => {
      if (globalPaused) return;
      if (!started) { if ((waited += 500) >= 12000) finish(false); return; }
      let c = 0, d = 0; try { c = p.getCurrentTime() || 0; d = p.getDuration() || 0; } catch {}
      if (c > last + 0.05) { last = c; stall = 0; } else if ((stall += 500) >= 45000) return finish(true);
      if (c >= Math.min(d || v.seconds || 150, 150) - 0.2 && c > 1) finish(true);
    }, 500);
  });
}
async function runAd(id) {
  bedOff(0.5);
  for (let tries = 0; tries < 6 && id === runId; tries++) {
    const ad = nextAd(); if (!ad) return;
    $('kind').textContent = 'commercial'; $('capKind').textContent = 'Commercial'; $('capText').textContent = ad.title;
    rlog('commercial', { id: ad.id, title: ad.title });
    const ok = await playAdVideo(ad);
    if (ok) return;
  }
}
// intro, jingle, commercial, jingle, commercial, jingle, back to the music
function adBreakSegs() {
  const k = 'Commercial break', out = [lines(k, [sub(fresh('adin', R.breakIntros || ['Commercial break!']))])];
  out.push({ kind: k, jingle: S.jingle || Jingles.defaultId, lines: [] });
  for (let a = 0; a < (R.adsPerBreak || 2); a++) { out.push({ kind: k, ad: true, lines: [] }); out.push({ kind: k, jingle: S.jingle || Jingles.defaultId, lines: [] }); }
  out.push(lines(k, [sub(fresh('adout', R.breakOutros || ['And we are back!']))]));
  return out;
}
const getCtx = () => { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; };
async function runJingle(id) {
  $('kind').textContent = 'jingle'; $('capText').textContent = '♪';
  bedOff(0.5);
  const j = Jingles.play(getCtx(), id || S.jingle || Jingles.defaultId);
  breakSkip = () => j.stop();
  await j.done; breakSkip = null;
}

// In a Non-stop session nothing promises music: no "back to the music", "before the next song"…
const MUSIC_TALK = /\b(back to (the )?(music|songs?|it)|more music|right back|be back|back in a (moment|minute)|the (songs?|music) (will )?(wait|return|resume|come back)|(music|songs?) returns?|here comes (more )?(music|a song)|we return|stay with (us|me)|after the break|(before|after|for) the next song|the next song|then we come back|then the music|let the (music|song)|music continues|between songs|up next|coming up)\b/i;
function marathonLines(seg) {
  const last = seg.lines.length - 1;
  return seg.lines.map((l, i) => {
    if (!MUSIC_TALK.test(l.t)) return l;
    if (i === last && seg.lines.length > 2) return null;
    const kept = splitParts(l.t).filter(x => !MUSIC_TALK.test(x)).join(' ');
    return kept ? { ...l, t: kept } : null;
  }).filter(Boolean);
}
const mergeLines = lines => { const merged = []; lines.forEach(l => { const w = l.w || 'h', last = merged[merged.length - 1]; if (last && (last.w || 'h') === w) last.t += ' ' + l.t; else merged.push({ ...l }); }); return merged; };
function preSegs(segs) { if (kokoroReady() && !marathon) segs.forEach(seg => { if (seg && seg.lines && !seg.jingle) mergeLines(seg.lines).forEach(l => kokoroPre(l.t, l.w && l.w !== 'h' ? l.w : 'h')); }); }
async function runSegments(segs, id) {
  preSegs(segs);
  for (let si = 0; si < segs.length; si++) {
    let seg = segs[si];
    if (id !== runId) return false;
    if (marathon && seg.lines) seg = { ...seg, lines: marathonLines(seg) };
    if (curBreak && curBreak.segs === segs) curBreak.idx = si;   // where the bulletin would pick this break up again
    $('vinyl').classList.add('talk');
    $('kind').textContent = seg.kind.toLowerCase();
    $('capKind').textContent = seg.title ? `${seg.kind} · ${seg.title}` : seg.kind;
    if (seg.jingle) { await runJingle(seg.jingle); continue; }
    if (seg.ad) { await runAd(id); continue; }
    bedOn();
    const merged = mergeLines(seg.lines);
    for (const l of merged) {
      if (id !== runId) return false;
      if (l.w === 's') $('capKind').textContent = R.cohost + (seg.title ? ' · ' + seg.title : '');
      else if (merged.some(x => x.w === 's')) $('capKind').textContent = R.host + (seg.title ? ' · ' + seg.title : '');
      breakSkip = () => { speechSynthesis.cancel(); try { if (curAudio && curAudio.onended) curAudio.onended(); } catch {} };   // Next skips the line being said
      await say(l.t, l.w && l.w !== 'h' ? l.w : 'h');
      breakSkip = null;
      if (id !== runId) return false;
    }
  }
  return id === runId;
}

// ---------- podcasts and concerts (song 64 of every cycle) ----------
// Hand-picked episodes only, saved by their exact video (content23.js): never a random search. Played episodes do
// not return until all of that show's have played. Saturdays: a live concert from the hand-picked list instead.
let curBreak = null, curPod = null;
const POD_TURNS = () => Object.keys(R.podShows || {}).filter(k => !(R.podShows[k] || {}).concert);
function pickEpisode(list, tag) {
  lib.pod = lib.pod || [];
  let left = list.filter(e => !lib.pod.includes(e.id));
  if (!left.length) { lib.pod = lib.pod.filter(id => !list.some(e => e.id === id)); left = list.slice(); rlog('all episodes played, starting again', { tag }); }
  return left.length ? rnd(left) : null;
}
function podFrom(e, show) {
  const sh = R.podShows[show] || { name: show };
  return { topic: { label: sh.name }, show, v: { id: e.id, title: e.t, channel: e.ch || sh.name, seconds: e.sec || 0 }, alts: [] };
}
function findShow(show) {
  const eps = (R.podEpisodes || []).filter(e => e.show === show), e = pickEpisode(eps, show);
  return e ? podFrom(e, show) : null;
}
function findConcert() {
  const e = pickEpisode(R.concerts || [], 'concerts');
  return e ? podFrom(Object.assign({ ch: e.src }, e), 'concert') : null;
}
async function findPodcast() {
  if (new Date().getDay() === 6) { const c = findConcert(); if (c) return c; }   // Saturdays: a concert in the podcast slot
  const turns = POD_TURNS(); if (!turns.length) return null;
  const turn = turns[(lib.podTurn || 0) % turns.length]; lib.podTurn = (lib.podTurn || 0) + 1; saveLib();
  return findShow(turn);
}
async function playPodcast(pod, prev, opts, id) {
  curBreak = null; curPod = pod;
  const v = pod.v, live = pod.show === 'concert';
  const ep = { a: v.channel, t: v.title, key: 'podcast|' + v.id, podcast: true, show: pod.show || '', tags: [], genre: 'podcast', cands: [v, ...pod.alts] };
  lib.pod = lib.pod || []; if (!lib.pod.includes(v.id)) { lib.pod.push(v.id); if (lib.pod.length > 400) lib.pod.shift(); saveLib(); }
  const old = P();
  if (!opts.first) fadeP(old, 0, opts.fadeOldMs || fadeMs()).then(() => { try { if (id === runId) old.pauseVideo(); } catch {} });
  bedOn();
  const segs = [];
  if (opts.first) segs.push(lines(R.station, [sub(fresh('welcome:' + period(), R.welcomes[period()]), ep)]));
  else if (prev) segs.push(lines(R.station, [backFor(prev)]));
  const sh = R.podShows[pod.show] || {};
  const extra = { min: Math.max(1, Math.round((v.seconds || 0) / 60)), topic: pod.topic.label };
  segs.push({ kind: live ? 'Live concert' : 'Podcast', title: pod.topic.label, lines: [{ t: sub(fresh('podshow:' + pod.show, sh.intros || ['Podcast time.']), ep, extra) }] });
  const ok = await runSegments(segs, id);
  if (!ok) return;
  const okEp = await startSong(ep, S.vol, 0, 0);
  if (id !== runId) return;
  curPod = null;
  if (!okEp) { busy = false; bedOff(); return advance({ noCount: true }); }
  $('vinyl').classList.remove('talk');
  bedOff(2.5);
  caption((live ? 'Live concert' : 'Podcast') + ' · ' + pod.topic.label, (live ? 'Live now: ' : 'Now playing: ') + ep.t + (marathon ? '.' : '. The music comes back when it ends.'));
  busy = false;
}



// ---------- Repeat: the song (or track, episode, Focus track…) that is playing starts again when it ends ----------
// It stays on until you press it again; Next still moves on (and the next song repeats too).
let repeatOn = false; try { repeatOn = localStorage.getItem('pbd-repeat') === '1'; } catch {}
function repeatSong() {
  if (!repeatOn || !current) return false;
  try { P().seekTo(0, true); P().playVideo(); } catch { return false; }
  rlog('repeat', { song: current.key }); return true;
}
function paintRepeat() { const b = $('btnRepeat'); b.classList.toggle('on', repeatOn); b.setAttribute('aria-pressed', repeatOn ? 'true' : 'false'); b.title = repeatOn ? 'Repeat is on: this song plays again' : 'Repeat this song'; }
$('btnRepeat').onclick = () => { repeatOn = !repeatOn; try { localStorage.setItem('pbd-repeat', repeatOn ? '1' : '0'); } catch {} paintRepeat(); toast(repeatOn ? 'Repeat on: this song plays again and again.' : 'Repeat off.'); };
paintRepeat();

// ---------- Album show: a whole album in its own order, from the artist's YouTube "Topic" channel ----------
// Joe tells the story of the band and the album, plays 3 tracks, pauses to talk about them, and so on to the end
// (content24.js). Never programmed: you start it (Library > Albums, or Settings > Album show). The tracks are kept
// apart from the library, like Focus tracks. Next skips a track, Previous goes back one, ■ stops the show.
let albumShow = null;   // { al, i: next track, said: Set of talk points already said }
const albumSong = (al, i) => ({ a: al.artist, t: al.tracks[i], album: al.id, n: i, genre: 'album', tags: [], key: 'album|' + al.id + '|' + i });
const foldT = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\s*[\(\[][^\)\]]*(remaster|version|mono|stereo|mix|edit|including)[^\)\]]*[\)\]]/g, '').replace(/\s+-\s+.*(remaster|version|mono|mix).*$/, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Only the version from this very album plays. 1) The title must be the track's own title: words like demo, live,
// remix, edit, acoustic or instrumental make it another recording (only "remastered", a year, "mono"… may differ).
// 2) Its YouTube page is opened: a Topic upload names its album, which must be this album (not a box set, a live
// album, a compilation). 3) Anything not proven right is skipped, never played. Kept once found.
const foldTrack = x => String(x || '').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/&/g, ' and ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[\(\[]\s*(including|feat\.?|ft\.?|featuring|with)\s[^\)\]]*[\)\]]/g, ' ').replace(/\s(feat\.?|ft\.?|featuring)\s.*$/, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ')
  .replace(/\b(\d{4}|remaster|remastered|remasters|version|mono|stereo|digital|anniversary|edition|original|album|mix)\b/g, ' ').replace(/\s+/g, ' ').trim();
const sameTrack = (got, want) => [].concat(want).some(w => foldTrack(got) === foldTrack(w));
const trackNames = (al, n) => [al.tracks[n], ...((al.aka && al.aka[n]) || [])];   // its title, and how official releases also title it
const albumTitleOk = (got, al) => {
  const foldA = x => String(x || '').replace(/ı/g, 'i').replace(/&/g, ' and ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();   // brackets kept: "(2016 Remix)" counts
  const g = foldA(got), w = foldA(al.ytAlbum || al.title), at = (' ' + g + ' ').indexOf(' ' + w + ' ');
  if (!g || at < 0) return false;   // the album's name, as whole words ("John Lennon/Plastic Ono Band", "Paranoid (Remastered)")
  const rest = (g.slice(0, at) + ' ' + g.slice(at + w.length)).replace(/\b(original )?album mix\b|\boriginal mix\b/g, '').trim();   // "Original Album Mix" is the album itself
  return !/\b(live|remix|remixes|mix|demo|demos|session|sessions|early years|anthology|collection|best of|greatest|hits|essential|years|instrumentals?|acoustic)\b/.test(rest);
};
// 4) The rest of the description: credits and notes can still say it is another recording ("Recorded live at…",
// "Demo", "Remix", "Session"), even under a clean title and album. The album's own name is left out of the search,
// and so is the label line, so "Live" or "Mix" in those does not count.
function otherVersion(desc, al) {
  const own = String(al.ytAlbum || al.title).toLowerCase();
  return String(desc || '').split('\n').slice(1).some(l => {
    const x = l.toLowerCase().replace(own, ' ');
    return /\b(recorded live|live (at|in|from|on)|live recording|in concert|demo|demos|remix|remixed|rehearsal|outtake|alternate take|alternative take|early take|session|bbc)\b/.test(x) && !/^℗|^©|^(producer|composer|lyricist|writer|engineer|mixing|mastering|associated)/.test(x.trim());
  });
}
// 5) The length: within 8 seconds (3% for long tracks) of the track on the original album (content24.js
// lengths, from MusicBrainz and Deezer). Live takes, demos, edits and remixes rarely last the same time.
function albumLenOk(al, n, sec) {
  const want = al.lengths && al.lengths[n]; if (!want) return true;
  if (!sec) return false;   // a length that cannot be read is not a proof
  return [].concat(want).some(w => Math.abs(sec - w) <= Math.max(8, w * 0.03));   // a track can have two official lengths
}
let helperChecks = null;   // does this PC's helper read a video's album? (older helpers cannot)
async function canCheckAlbums() {
  if (helperChecks === null) { try { helperChecks = (await fetch('/api/ytinfo?id=xxxxxxxxxxx')).status !== 404; } catch { helperChecks = false; } }
  return helperChecks;
}
async function resolveAlbum(s) {
  const pv = albumVideo(albumById(s.album) || {}, s.n); if (pv) return (s.cands = [pv]);   // your playlist chose this very version
  let cache = {}; try { cache = JSON.parse(localStorage.getItem('pbd-album-cache6') || '{}'); } catch {}
  if (cache[s.key] && cache[s.key].length) return (s.cands = cache[s.key]);
  if (!(await canCheckAlbums())) return [];
  const al = albumById(s.album), artist = al.ytArtist || al.artist;
  const topic = v => / - Topic$/i.test(v.channel || '');
  const pool = [], seen = new Set();
  for (const q of [artist + ' ' + al.title + ' ' + s.t, artist + ' ' + s.t + ' topic', artist + ' - ' + s.t + ' ' + al.title]) {
    try { const r = await (await fetch('/api/search?q=' + encodeURIComponent(q) + '&a=' + encodeURIComponent(artist) + '&t=' + encodeURIComponent(s.t))).json(); if (Array.isArray(r)) r.forEach(v => { if (v && v.id && !seen.has(v.id)) { seen.add(v.id); pool.push(v); } }); } catch {}
    for (const v of pool.filter(v => topic(v) && sameTrack(v.title, trackNames(al, s.n)) && !v._checked).slice(0, 6)) {
      v._checked = true;
      let info = null; try { const r = await fetch('/api/ytinfo?id=' + v.id); if (r.ok) info = await r.json(); } catch {}
      const len = albumLenOk(al, s.n, (info && info.seconds) || v.seconds);
      if (info && info.topic && albumTitleOk(info.album, al) && sameTrack(info.track || v.title, trackNames(al, s.n)) && !otherVersion(info.desc, al) && len) {
        const c = [v]; cache[s.key] = c; try { localStorage.setItem('pbd-album-cache6', JSON.stringify(cache)); } catch {}
        rlog('album track', { track: s.key, id: v.id, album: info.album, title: info.track || v.title });
        return (s.cands = c);
      }
      rlog('album: not this album, skipped', { track: s.key, id: v.id, album: info && info.album, title: info && (info.track || info.title), seconds: (info && info.seconds) || v.seconds, expected: al.lengths && al.lengths[s.n], lengthOk: len });
    }
  }
  rlog('album: the album version was not found', { track: s.key });
  return [];   // never another version: the track is skipped rather than played wrong
}
// Before the show starts: every track is looked up and checked, so you know at once if something is missing
async function albumCheck(al, onEach) {
  const missing = [];
  for (let i = 0; i < al.tracks.length; i++) { const c = await resolveAlbum(albumSong(al, i)); if (!c.length) missing.push(i + 1 + '. ' + al.tracks[i]); if (onEach) onEach(i + 1, missing.length); }
  return missing;
}
// ---- albums from YouTube playlists: the exact videos, in the playlist's order ----
// A playlist is read once. Its videos are then saved in the album itself (lib.albumVideos, synced to every device)
// and played from there for good: the playlist link is not read again, and YouTube is not searched for those tracks.
// Pasting another playlist (✎) replaces them; leaving it empty goes back to searching with the checks.
const albumHidden = k => (lib.albumHidden || []).some(x => x.key === k);
const plIds = () => [...new Set([...(R.albumPlaylists || []), ...(lib.albumLists || []).map(x => x.key)])].filter(id => !albumHidden('plid:' + id));
const plTitle = v => { const t = splitTitle(v).t || v.title; return foldTrack(String(t).replace(/[\(\[][^\)\]]*[\)\]]/g, ' ')); };
const vid = v => ({ id: v.id, title: v.title, channel: v.channel, seconds: v.seconds });
function plMap(al, items, force) {   // which video is which track: by title (and the album's other official titles), then by position
  const want = al.tracks.map((t, k) => trackNames(al, k).map(x => foldTrack(String(x).replace(/[\(\[][^\)\]]*[\)\]]/g, ' '))));
  const map = {}, used = new Set();
  items.forEach(v => { const f = plTitle(v), i = want.findIndex((w, k) => w.includes(f) && !(k in map)); if (i >= 0) { map[i] = v; used.add(v.id); } });
  const n = Object.keys(map).length;
  if (!force && n < Math.max(3, Math.ceil(al.tracks.length * 0.6))) return null;   // not this album
  if (items.length === al.tracks.length) al.tracks.forEach((t, k) => { if (!(k in map) && !used.has(items[k].id)) map[k] = items[k]; });   // same count: the rest in order
  return map;
}
const savedVideos = id => { const e = (lib.albumVideos || {})[id]; return e && !e.cleared ? e : null; };
async function readAlbumPlaylists() {
  if (!HELPER) return;
  let changed = false;
  for (const id of plIds()) {
    const have = Object.values(lib.albumVideos || {}).some(e => e && e.pl === id);   // read before: its videos are saved
    if (have) continue;
    try {
      const r = await fetch('/api/playlist?list=' + encodeURIComponent(id)); const j = await r.json(); if (!r.ok || !j.items || !j.items.length) throw new Error(j.error || 'empty');
      const items = j.items.map(vid), now = Date.now();
      const forced = (lib.albumLists || []).find(x => x.key === id && x.album), fa = forced && (R.albums || []).find(a => a.id === forced.album);
      let al = fa, map = fa ? plMap(fa, items, true) : null;
      if (!fa) for (const a of R.albums || []) { const m = plMap(a, items); if (m && (!map || Object.keys(m).length > Object.keys(map).length)) { al = a; map = m; } }
      lib.albumVideos = lib.albumVideos || {};
      if (al && map) lib.albumVideos[al.id] = { pl: id, ts: now, map: Object.fromEntries(Object.entries(map).map(([k, v]) => [k, vid(v)])) };
      else lib.albumVideos['pl:' + id] = { pl: id, ts: now, title: j.title || id, items };
      rlog('album playlist saved', { id, title: j.title, videos: items.length, album: al && map ? al.id + ' (' + Object.keys(map).length + ' of ' + al.tracks.length + ' tracks)' : 'an album of its own' });
      changed = true;
    } catch (e) { rlog('album playlist could not be read', { id, error: String(e.message || e) }); }
  }
  if (changed) { saveLib(); if (libTab === 'albums' && $('shLib').classList.contains('open')) renderAlbums(); }
}
function allAlbums() {   // the albums with notes, plus the playlists that are albums of their own
  const own = Object.entries(lib.albumVideos || {}).filter(([k, e]) => k.startsWith('pl:') && e && !e.cleared && e.items).map(([k, e]) => {
    const ch = {}; e.items.forEach(v => { const c = String(v.channel || '').replace(/ - Topic$/i, ''); if (c) ch[c] = (ch[c] || 0) + 1; });
    const artist = Object.keys(ch).sort((x, y) => ch[y] - ch[x])[0] || '';
    return { id: k, artist, title: String(e.title || '').replace(/^Album\s*[-–:]\s*/i, ''), year: '', tracks: e.items.map(v => splitTitle(v).t || v.title), videos: e.items, plain: true, intro: '', notes: [] };
  });
  return (R.albums || []).concat(own).filter(a => !albumHidden(a.id)).map(a => { const e = (lib.albumEdits || {})[a.id]; return e ? { ...a, title: e.title || a.title, artist: e.artist || a.artist } : a; });
}
const albumById = id => allAlbums().find(x => x.id === id);
function albumVideo(al, n) {   // the exact video saved for this track, if any
  const fixed = (R.albumIds || {})[al.id];   // checked in advance (content_ids.js): plays on the website too
  if (fixed && fixed[n] && !savedVideos(al.id)) return { id: fixed[n], title: al.tracks[n], channel: al.artist, seconds: (al.lengths || [])[n] || 0 };
  if (al.videos) return al.videos[n] || null;
  const e = savedVideos(al.id); return (e && e.map && e.map[n]) || null;
}
function albumTalk(id, text, title) {   // Joe speaks between tracks, then the album goes on
  const al = albumShow.al; albumShow.said.add(id);
  const segs = [{ kind: 'Album Party', title: title || al.artist + ' · ' + al.title, lines: [{ t: sub(text) }] }];
  (async () => {
    const run = marathonQuiet(); bedOn(); $('kind').textContent = 'album party';
    curBreak = { segs, idx: 0, next: null };
    const ok = await runSegments(segs, run);
    if (!ok || run !== runId || !albumShow) return;
    curBreak = null; bedOff(1.5); busy = false; caption('Album Party', '');
    await sleep(500); if (run === runId && albumShow) advance();
  })();
}
function albumStep() {
  const sh = albumShow, al = sh.al, i = sh.i, groups = Math.ceil(al.tracks.length / 3);
  if (i === 0 && !sh.said.has('intro')) return albumTalk('intro', al.intro || (R.albumIntroPlain || '').replace(/\{album\}/g, al.title).replace(/\{artist\}/g, al.artist), 'The album · ' + al.artist + ', ' + al.title);
  if (i > 0 && i % 3 === 0 && i < al.tracks.length && !sh.said.has('n' + i)) { if (al.notes[i / 3 - 1]) return albumTalk('n' + i, al.notes[i / 3 - 1]); sh.said.add('n' + i); }   // an album without notes plays straight on
  if (i >= al.tracks.length) {
    if (!sh.said.has('end')) return albumTalk('end', (al.notes[groups - 1] || '') + ' ' + rnd(R.albumOutros || ['That was {album}, by {artist}, from beginning to end. Back to the radio.']).replace(/\{album\}/g, al.title).replace(/\{artist\}/g, al.artist));
    albumShow = null; albumUI(); rlog('album show finished', { album: al.id }); return advance({ silent: true, noCount: true });
  }
  sh.i = i + 1;
  let s = albumSong(al, i); if (planned && planned.key === s.key) { s = planned; } planned = null;
  caption('Album Party', al.artist + ' · ' + al.title + ' · track ' + (i + 1) + ' of ' + al.tracks.length);
  return advance({ song: s, prev: null, silent: true, noCount: true, quick: true, fadeOldMs: 400, marSong: true });
}
function albumPreload() {   // the next track is found and loaded ahead, so tracks follow each other closely
  const sh = albumShow, i = sh.i; if (planned || i >= sh.al.tracks.length || (i % 3 === 0 && !sh.said.has('n' + i))) return;
  const p = planned = albumSong(sh.al, i);
  resolve(p).then(c => { if (planned !== p || !c.length || !ytReady) return; primeNext(p, c); });
}
function albumBack() {   // Previous: the track before this one (its talk is not repeated)
  const sh = albumShow, now = current && current.album === sh.al.id ? current.n : sh.i - 1;
  sh.i = Math.max(0, now - 1); if (sh.i === 0) sh.said.add('intro'); sh.said.add('n' + sh.i);
  planned = null; preload = null; stopSpeech(); albumStep();
}
async function startAlbum(id) {
  const al = albumById(id); if (!al) return;
  if (!started) return toast('Press play first, then choose an album.');
  const ready = al.tracks.every((t, i) => albumVideo(al, i));
  if (!ready && !HELPER) return toast('This album plays in the installed app (it checks each track on YouTube through your PC).');
  if (HELPER) await readAlbumPlaylists();   // your playlists first: their videos are the exact versions
  if (!ready && !(await canCheckAlbums())) return toast('This album needs the newest app helper to check each track. Close the radio with its ✕ and open it again, then try again.');
  openSheet(null); toast('Checking the ' + al.tracks.length + ' tracks of ' + al.title + '…');
  const missing = await albumCheck(al, (n, m) => { $('capKind').textContent = 'Album Party'; $('capText').textContent = 'Getting the album ready: ' + n + ' of ' + al.tracks.length + (m ? ' (' + m + ' not found)' : ''); });
  rlog('album check', { album: al.id, missing });
  if (missing.length === al.tracks.length) return toast('None of the tracks of ' + al.title + ' could be found on YouTube as part of this album. Nothing was played.');
  if (missing.length) toast('Not found as part of this album, so skipped: ' + missing.join(', ') + '. Everything else is the album version.');
  if (marathon) marathon = null;
  if (focusMode) { focusMode = ''; try { localStorage.setItem('pbd-focus', ''); } catch {} paintFocus(); }   // quietly: the show starts itself
  albumShow = { al, i: 0, said: new Set() }; planned = null; preload = null; batch = null;
  rlog('album show', { album: al.id }); toast(al.artist + ', ' + al.title + ': the whole album, in order.');
  openSheet(null); albumUI(); stopSpeech(); albumStep();
}
function stopAlbum() {
  if (!albumShow) return; albumShow = null; albumUI(); toast('Album Party over. ' + R.host + ' is back.');
  if (started) { stopSpeech(); bedOff(1); planned = null; preload = null; advance({ silent: true, noCount: true }); }
}
function albumUI() {
  const b = $('marStop'); b.style.display = albumShow || marathon ? '' : 'none';
  b.innerHTML = albumShow ? '&#9632; stop the album' : '&#9632; stop non-stop';
}
function renderAlbums() {
  const l = $('libList'); l.innerHTML = ''; const all = allAlbums(), shown = all.filter(a => libMatch(a.artist, a.title));
  $('libCount').textContent = `· ${all.length} albums`;
  const add = document.createElement('div'); add.className = 'field'; add.style.cssText = 'margin-bottom:6px';
  add.innerHTML = '<input type="text" placeholder="Paste a YouTube playlist of a whole album (its exact versions)"><button class="btn">Add</button>';
  add.querySelector('button').onclick = async () => {
    const v = add.querySelector('input').value.trim(), m = v.match(/[?&]list=([\w-]+)/) || v.match(/^([\w-]{12,})$/);
    if (!m) return toast('That does not look like a YouTube playlist link.');
    if (!HELPER) return toast(NEEDS_PC);
    lib.albumLists = lib.albumLists || []; if (!lib.albumLists.some(x => x.key === m[1])) lib.albumLists.push({ key: m[1], added: Date.now() }); saveLib();
    toast('Reading the playlist…'); await readAlbumPlaylists();
    const hit = Object.entries(lib.albumVideos || {}).find(([, x]) => x && x.pl === m[1] && !x.cleared);
    toast(!hit ? 'The playlist could not be read. Is it public or unlisted?' : hit[0].startsWith('pl:') ? `Added as an album of its own: ${hit[1].title}. Its videos are saved.` : `Recognised: ${albumById(hit[0]).title}. Its videos are saved, and they are what plays.`);
    renderAlbums();
  };
  l.appendChild(add);
  if (!shown.length) { l.insertAdjacentHTML('beforeend', noMatch()); return; }
  shown.forEach(al => {
    const d = document.createElement('div'); d.className = 'item' + (albumShow && albumShow.al.id === al.id ? ' now' : '');
    const e = savedVideos(al.id), fromPl = al.videos || (e && e.map);
    const nPl = al.videos ? al.tracks.length : e && e.map ? Object.keys(e.map).length : 0;
    d.innerHTML = `<div class="meta"><b></b><span></span></div><button class="mini-btn" title="Edit">&#9998;</button><button class="mini-btn" title="Remove from the albums">&#10005;</button><button class="btn" style="padding:6px 11px">&#9654; Play</button>`;
    d.querySelector('b').textContent = al.title; d.querySelector('span').textContent = [al.artist, al.year, al.tracks.length + ' tracks', fromPl ? (nPl === al.tracks.length ? 'your videos' : `your videos for ${nPl} of ${al.tracks.length}`) : ''].filter(Boolean).join(' · ');
    const [ed, rm, play] = d.querySelectorAll('button');
    play.onclick = () => startAlbum(al.id); ed.onclick = () => editAlbum(al); rm.onclick = () => removeAlbum(al);
    l.appendChild(d);
  });
  const hid = (lib.albumHidden || []).filter(x => !x.key.startsWith('plid:'));
  if (hid.length) {
    const r = document.createElement('div'); r.innerHTML = `<button class="btn ghost" style="width:100%;margin-top:4px">Restore ${hid.length} removed album${hid.length === 1 ? '' : 's'}</button>`;
    r.querySelector('button').onclick = () => { hid.forEach(x => markDeleted('albumHidden', x.key)); lib.albumHidden = (lib.albumHidden || []).filter(x => x.key.startsWith('plid:')); saveLib(); renderAlbums(); toast('Albums restored.'); };
    l.appendChild(r);
  }
  readAlbumPlaylists();
}
// ✎ An album from a playlist of its own: its name and artist. One of the albums with notes: the playlist it plays
// from (paste one with its exact versions, or leave it empty to go back to searching YouTube with the checks).
async function editAlbum(al) {
  if (al.videos) {
    const title = prompt('Name of the album:', al.title); if (title === null) return;
    const artist = prompt('Artist:', al.artist); if (artist === null) return;
    lib.albumEdits = lib.albumEdits || {}; lib.albumEdits[al.id] = { title: title.trim() || al.title, artist: artist.trim() || al.artist, ts: Date.now() };
    saveLib(); renderAlbums(); return toast('Saved.');
  }
  const cur = savedVideos(al.id);
  const v = prompt(`The videos ${al.title} plays are saved from a playlist${cur ? '' : ' (none yet)'}.\nPaste a YouTube playlist link to save its videos instead, or leave it empty to search YouTube (every track checked).`, cur && cur.pl ? 'https://www.youtube.com/playlist?list=' + cur.pl : '');
  if (v === null) return;
  const m = v.trim().match(/[?&]list=([\w-]+)/) || v.trim().match(/^([\w-]{12,})$/);
  if (cur && m && cur.pl === m[1]) return toast('That playlist is already the one saved.');
  lib.albumVideos = lib.albumVideos || {}; lib.albumVideos[al.id] = { cleared: true, ts: Date.now() };   // the old videos go
  if (m) {
    if (!HELPER) { saveLib(); return toast(NEEDS_PC); }
    Object.keys(lib.albumVideos).forEach(k => { const x = lib.albumVideos[k]; if (x && x.pl === m[1] && k !== al.id) lib.albumVideos[k] = { cleared: true, ts: Date.now() }; });   // read it again, for this album
    lib.albumHidden = (lib.albumHidden || []).filter(x => { if (x.key === 'plid:' + m[1]) { markDeleted('albumHidden', x.key); return false; } return true; });
    lib.albumLists = (lib.albumLists || []).filter(x => x.key !== m[1]); lib.albumLists.push({ key: m[1], album: al.id, added: Date.now() });
    saveLib(); toast('Reading the playlist…'); await readAlbumPlaylists();
    const e = savedVideos(al.id); toast(e ? `Saved: ${al.title} now plays your videos (${Object.keys(e.map || {}).length} of ${al.tracks.length} tracks).` : 'The playlist could not be read. Is it public or unlisted?');
  } else {
    if (cur && cur.pl && (R.albumPlaylists || []).includes(cur.pl)) { lib.albumHidden = lib.albumHidden || []; lib.albumHidden.push({ key: 'plid:' + cur.pl, added: Date.now() }); }   // not read again
    if (cur && cur.pl) { lib.albumLists = (lib.albumLists || []).filter(x => { if (x.key === cur.pl) { markDeleted('albumLists', x.key); return false; } return true; }); }
    saveLib(); toast(`${al.title} goes back to searching YouTube, every track checked.`);
  }
  renderAlbums();
}
function removeAlbum(al) {   // ✕ out of the list (Restore brings it back); a playlist of your own is forgotten too
  if (!confirm(`Remove "${al.title}" from your albums?`)) return;
  if (albumShow && albumShow.al.id === al.id) stopAlbum();
  lib.albumHidden = lib.albumHidden || []; lib.albumHidden.push({ key: al.id, added: Date.now() });
  saveLib(); renderAlbums(); toast(`${al.title} was removed. "Restore" at the bottom of the list brings it back.`);
}
$('btnAlbums').onclick = () => { libTab = 'albums'; openSheet('shLib'); renderLib(); };

// ---------- Lyrics: from LRCLIB (lrclib.net, free and open), synced line by line to where the song really is ----------
// The line shown follows the player's own position, so skipping, rewinding or seeking inside the song keeps it right.
// A YouTube upload can start earlier or later than the album version the timing was made for: tap the line being
// sung to set it right (or ±0.5 s), and that correction is kept for the song on every device.
let lyrOn = false; try { lyrOn = localStorage.getItem('pbd-lyrics') === '1'; } catch {}
let lyr = null, lyrLine = -2;   // { key, lines: [{ t, x }] | null, plain, state }
const lyrCache = new Map();
const lyrClean = t => String(t || '').replace(/\s*[\(\[][^\)\]]*(remaster|version|edit|mix|live|mono|stereo|demo|official|audio|video|lyric|feat|ft\.)[^\)\]]*[\)\]]/gi, '').replace(/\s+-\s+(\d{4} )?remaster.*$/i, '').replace(/\s+(feat|ft)\.?\s.*$/i, '').trim();
const lyrArtist = a => String(a || '').split(/\s*(?:,|&| and | x | feat\.?| ft\.?)\s*/i)[0].trim();
function parseLrc(txt) {
  const out = [];
  String(txt || '').split(/\r?\n/).forEach(row => {
    const tags = [...row.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)], x = row.replace(/\[[^\]]*\]/g, '').trim();
    tags.forEach(m => out.push({ t: +m[1] * 60 + +m[2], x }));
  });
  return out.sort((p, q) => p.t - q.t);
}
async function lyrFetch(s, dur) {
  const id = s.key; if (lyrCache.has(id)) return lyrCache.get(id);
  try { return await lyrFind(s, dur); } catch (e) { return { state: 'error', retry: Date.now() + 20000 }; }
}
async function lyrFind(s, dur) {
  const id = s.key;
  // not found is an answer (kept); no answer (offline, busy) is not: it is tried again a little later
  const q = (o) => fetch('https://lrclib.net/api/' + o).then(r => r.ok ? r.json() : r.status === 404 ? null : Promise.reject(new Error('HTTP ' + r.status)));
  const enc = encodeURIComponent, a = s.a, t = lyrClean(s.t);
  let best = await q(`get?artist_name=${enc(a)}&track_name=${enc(t)}` + (dur ? `&duration=${Math.round(dur)}` : ''));
  if (!best || !(best.syncedLyrics || best.instrumental)) {   // not an exact match: search, and take the synced one closest in length
    const list = (await q(`search?artist_name=${enc(lyrArtist(a))}&track_name=${enc(t)}`)) || (await q(`search?q=${enc(lyrArtist(a) + ' ' + t)}`)) || [];
    const ok = list.filter(x => x && (x.syncedLyrics || x.plainLyrics || x.instrumental));
    const gap = x => dur && x.duration ? Math.abs(x.duration - dur) : 30;
    best = ok.filter(x => x.syncedLyrics).sort((p, q2) => gap(p) - gap(q2))[0] || ok[0] || best;
  }
  const r = !best ? { state: 'none' } : best.instrumental ? { state: 'instrumental' }
    : best.syncedLyrics ? { state: 'synced', lines: parseLrc(best.syncedLyrics), dur: best.duration || 0 }
    : best.plainLyrics ? { state: 'plain', plain: best.plainLyrics } : { state: 'none' };
  lyrCache.set(id, r); if (lyrCache.size > 60) lyrCache.delete(lyrCache.keys().next().value);
  return r;
}
// Swear words are masked when lyrics are shown (LRCLIB has the original text): f***, s***…
const SWEAR = /\b(fuck\w*|shit\w*|bitch\w*|nigg\w*|cunt\w*|dick|dicks|pussy|pussies|cock|cocks|whore\w*|slut\w*|asshole\w*|motherf\w*|mothaf\w*|bastard\w*|goddamn\w*|ass|asses|tits|titties|porn\w*|faggot\w*|fag|fags|retard\w*|wank\w*|hoe|hoes|bullshit)\b/gi;
const maskWords = t => String(t || '').replace(SWEAR, w => w[0] + '*'.repeat(Math.max(2, w.length - 1)));
const lyrMsg = t => { const b = $('lyrLines'); b.className = 'lyr-lines'; b.innerHTML = ''; const p = document.createElement('p'); p.className = 'lyr-msg'; p.textContent = t; b.appendChild(p); };
async function lyrLoad() {
  if (!lyrOn) return;
  const s = current;
  lyrLine = -2; $('lyrNote').textContent = '';
  if (!s || s.podcast || s.focus || s.sounds) { lyr = null; return lyrMsg(newsOn ? 'the bulletin' : !s ? '' : s.focus ? 'instrumental' : 'no lyrics for this'); }
  if (lyr && lyr.key === s.key) return lyrPaint(true);
  lyr = { key: s.key, state: 'loading' }; lyrMsg('looking for the lyrics…');
  let dur = 0; try { dur = P().getDuration() || 0; } catch {}
  const r = await lyrFetch(s, dur);
  if (!current || current.key !== s.key) return;
  lyr = { key: s.key, ...r };
  $('lyrNote').textContent = r.state === 'synced' ? 'lrclib.net · tap the line being sung to sync' : r.state === 'plain' ? 'lrclib.net · not synced' : '';
  if (r.state === 'error') return lyrMsg('the lyrics site did not answer. Trying again in a moment…');
  if (r.state === 'none') return lyrMsg('no lyrics found for this song');
  if (r.state === 'instrumental') return lyrMsg('instrumental');
  if (r.state === 'plain') { const b = $('lyrLines'); b.className = 'lyr-lines plain'; b.innerHTML = ''; r.plain.split(/\r?\n/).forEach(l => { const p = document.createElement('p'); p.textContent = maskWords(l) || ' '; b.appendChild(p); }); return; }
  lyrPaint(true);
}
const lyrOffset = () => (lib.lyrOff && lyr && lib.lyrOff[lyr.key]) || 0;
function lyrNow() { try { return (P().getCurrentTime() || 0) + lyrOffset(); } catch { return 0; } }
function lyrPaint(force) {
  if (!lyrOn || !lyr || lyr.state !== 'synced' || !current || current.key !== lyr.key) return;
  const L = lyr.lines, t = lyrNow();
  let i = -1, lo = 0, hi = L.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (L[m].t <= t + 0.15) { i = m; lo = m + 1; } else hi = m - 1; }
  if (i === lyrLine && !force) return;
  lyrLine = i;
  const b = $('lyrLines'); b.className = 'lyr-lines'; b.innerHTML = '';
  for (let k = i - 2; k <= i + 2; k++) {
    const p = document.createElement('p');
    if (k < 0 || k >= L.length) { p.textContent = k === -1 && i === -1 ? '♪' : ' '; b.appendChild(p); continue; }
    p.textContent = maskWords(L[k].x) || '♪'; if (k === i) p.className = 'now'; else if (Math.abs(k - i) === 1) p.className = 'near';
    p.onclick = () => lyrSync(k);
    b.appendChild(p);
  }
}
function lyrSetOffset(v) {
  if (!lyr) return; lib.lyrOff = lib.lyrOff || {};
  lib.lyrOff[lyr.key] = Math.round(v * 10) / 10; if (!lib.lyrOff[lyr.key]) delete lib.lyrOff[lyr.key];
  saveLib(); lyrPaint(true);
}
function lyrSync(k) {   // you tapped the line being sung now: that line starts now
  let pos = 0; try { pos = P().getCurrentTime() || 0; } catch {}
  lyrSetOffset(lyr.lines[k].t - pos); toast('Lyrics synced to this song.');
}
$('lyrEarly').onclick = () => lyrSetOffset(lyrOffset() + 0.5);
$('lyrLate').onclick = () => lyrSetOffset(lyrOffset() - 0.5);
function setLyrics(on) {
  lyrOn = on; try { localStorage.setItem('pbd-lyrics', on ? '1' : '0'); } catch {}
  document.body.classList.toggle('lyr', on); $('btnLyrics').classList.toggle('on', on); $('btnLyrics').setAttribute('aria-pressed', on ? 'true' : 'false');
  if (on) lyrLoad();
}
$('btnLyrics').onclick = () => setLyrics(!lyrOn);
setInterval(() => { if (lyrOn && !document.hidden) { if (current && (!lyr || lyr.key !== current.key || (lyr.state === 'error' && Date.now() > lyr.retry))) { if (lyr && lyr.state === 'error') lyr = null; lyrLoad(); } else if (!current && lyr) { lyr = null; lyrMsg(newsOn ? 'the bulletin' : ''); } else lyrPaint(); } }, 200);
setTimeout(() => setLyrics(lyrOn), 0);

// ---------- Non-stop: chosen parts back to back (songs, Joe & Luna bits, podcasts), until you stop ----------
let marathon = null;   // { kinds, pods, src, i }
// Songs in a marathon: from the sources you ticked (the whole library, favorites, your lists, genre groups), no talk,
// shuffled with nothing repeated until all have played
function marathonPool(src) {
  const m = new Map(), put = l => l.forEach(x => { if (x && x.key && !m.has(x.key)) m.set(x.key, x); });
  src.forEach(id => {
    if (id === 'lib') put(songs);
    else if (id === 'fav') put((lib.fav || []).map(favToSong).filter(s => !lib.removed.includes(s.key)));
    else if (id.startsWith('list:')) { const L = allLists().find(x => 'list:' + x.key === id); if (L) put(listSongs(L)); }
    else if (id.startsWith('run:')) { const r = (R.runs || []).find(x => 'run:' + x.id === id); if (r) put(songs.filter(x => r.genres.includes(x.genre))); }
  });
  return [...m.values()];
}
function marathonSong() {
  const pool = marathon.pool || []; if (!pool.length) return null;
  if (!marathon.bag || !marathon.bag.length) marathon.bag = shuffle(pool);
  const lastA = current && current.a ? current.a.toLowerCase() : '';
  let i = marathon.bag.findIndex(x => (x.a || '').toLowerCase() !== lastA && !restingBroken(x)); if (i < 0) i = 0;
  return marathon.bag.splice(i, 1)[0];
}
const MAR_LABEL = { songs: 'songs', trivia: 'trivia shots', genre: 'genre trivia', sidequest: 'side quests', book: 'Book Nook', note: 'notes to Rim', banter: 'Luna & Joe', podcast: 'podcasts' };
function marathonSegs(kind) {
  const n = songs.length ? rnd(songs) : null;
  const x = kind === 'trivia' ? triviaSeg(n, null) : kind === 'genre' ? (n && genreSeg(n)) : kind === 'sidequest' ? sideQuestSeg() : kind === 'book' ? bookSeg() : kind === 'note' ? noteSeg() : kind === 'banter' ? banterSeg() : null;
  return x ? [x] : null;
}
async function marathonStep() {
  if (marathon.songsOn && (!marathon.kinds.length || marathon.sl > 0)) {   // a song, played like any other but with no host: `every` of them between the other parts
    const s = marathonSong();
    if (s) { marathon.sl--; return marathonPlay({ song: s }); }
  }
  marathon.sl = marathon.every;
  if (!marathon.kinds.length) { busy = false; toast('No song can play right now.'); return stopMarathon(); }
  const id = marathonQuiet();
  for (let tries = 0; tries < marathon.kinds.length + 1; tries++) {
    const kind = marathon.kinds[marathon.i++ % marathon.kinds.length];
    if (kind === 'podcast') {
      if (!marathon.pods.length) continue;
      const which = marathon.pods[(marathon.pi = (marathon.pi || 0) + 1) % marathon.pods.length];
      caption('Non-stop', 'Getting a podcast ready…');
      const pod = which === 'concert' ? findConcert() : findShow(which);
      if (id !== runId || !marathon) return;
      if (!pod) { rlog('marathon: no podcast found', { which }); continue; }
      return marathonPlay({ pod }, id);
    }
    if (kind === 'songs') continue;   // no song could be found: the next part instead
    const segs = marathonSegs(kind); if (!segs) continue;
    return marathonPlay({ kind, segs }, id);
  }
  busy = false; toast('Nothing in this Non-stop can play right now.'); stopMarathon();
}
// Before a spoken part or an episode: stop what is on and let the song fade out
function marathonQuiet() {
  if (globalPaused) clearPause();
  if (newsOn) { newsOn = false; newsBack = null; }
  stopSpeech(); const id = runId; busy = true; curBreak = null; curPod = null; planned = null; preload = null; nextPending = false; nextOverride = null;
  const old = P(); fadeP(old, 0, 2500).then(() => { try { if (pl[ai] === old && id === runId) old.pauseVideo(); } catch {} });
  if (current) { current = null; setNow(null); updateHeart(); }
  $('kind').textContent = 'non-stop';
  return id;
}
// Play one part of the marathon ({ song } | { pod } | { kind, segs }) and remember it, so Previous can go back to it
async function marathonPlay(e, id) {
  marathon.hist = marathon.hist || []; marathon.hist.push(e); if (marathon.hist.length > 40) marathon.hist.shift();
  if (e.song) { marathon.last = 'songs'; caption('Non-stop', ''); return advance({ song: e.song, prev: e.back ? null : undefined, silent: true, noCount: true, quick: !!e.back, marSong: true }); }
  if (id === undefined) id = marathonQuiet();
  if (e.pod) { marathon.last = 'podcast'; return playPodcast(e.pod, null, {}, id); }   // when the episode ends, the marathon goes on
  marathon.last = e.kind;
  curBreak = { segs: e.segs, idx: 0, next: null };
  const ok = await runSegments(e.segs, id);
  if (!ok) return;
  curBreak = null; bedOff(1.5); busy = false; caption('Non-stop', '');
  await sleep(700);
  if (id === runId && marathon) advance();
}
// Previous in a marathon: the part before this one (a song, a letter, a talk, an episode…), from its start
function marathonBack() {
  const h = marathon.hist || [];
  if (h.length < 2) return toast('Nothing earlier yet.');
  h.pop(); const e = h.pop();
  marathonPlay(Object.assign({}, e, { back: true }));
}
function startMarathon(kinds, pods, src = [], every = 2) {
  if (!started) return toast('Press play first, then start Non-stop.');
  if (!kinds.length) return toast('Tick at least one thing.');
  if (kinds.includes('podcast') && !pods.length) return toast('Tick which podcasts.');
  const pool = kinds.includes('songs') ? marathonPool(src) : [];
  if (kinds.includes('songs') && !pool.length) return toast(src.length ? 'No songs there yet.' : 'Tick where the songs come from.');
  const songsOn = kinds.includes('songs');
  marathon = { all: kinds, kinds: shuffle(kinds.filter(k => k !== 'songs')), songsOn, every, sl: every, pods: shuffle(pods), src, pool, i: 0, pi: -1 };
  $('marStop').style.display = '';
  rlog('marathon', { kinds, pods, src, songs: pool.length, every: songsOn && kinds.length > 1 ? every : null });
  toast('Non-stop: ' + kinds.map(k => MAR_LABEL[k]).join(', ') + '. Until you stop it.');
  openSheet(null); advance();
}
function stopMarathon() {
  if (!marathon) return;
  marathon = null; $('marStop').style.display = 'none'; toast('Non-stop over. Back to the radio.');
  if (started) { stopSpeech(); bedOff(1); advance({ silent: true, noCount: true }); }
}
async function advance(opts = {}) {
  if (marathon && !opts.marSong) return marathonStep();
  if (albumShow && !opts.marSong) return albumStep();
  if (globalPaused) clearPause();   // anything new starts un-paused
  if (newsOn) { newsOn = false; newsBack = null; }   // you chose something else during the news
  stopSpeech();
  const id = runId;
  busy = true;
  const prev = opts.prev !== undefined ? opts.prev : current;
  const afterPod = !!(prev && prev.podcast);
  curBreak = null; curPod = null;
  nextPending = false; nextOverride = null;
  let next = opts.song || takePlanned();
  if (!next) { busy = false; return; }
  if (prev && !afterPod) { if (opts.prev !== null) { history.push(prev); if (history.length > 60) history.shift(); } if (!played.includes(prev.key)) played.push(prev.key); }
  heartPrev = prev && !prev.podcast ? prev : null; current = null; updateHeart();   // while the host talks, the heart is for the song that just ended
  if (!opts.noCount && !afterPod && !next.focus) songsSinceBreak++;
  if (!opts.noCount && !afterPod && !next.focus && !S.justMusic && !opts.first && (R.ads || []).length) { lib.adCount = (lib.adCount || 0) + 1; saveLib(); }
  adsDue = !S.justMusic && !next.focus && !opts.first && !opts.replaySegs && !voicesPending() && (R.ads || []).length > 0 && (lib.adCount || 0) >= (R.adsEvery || 6);
  const endRunNow = !!(prev && lastRunSong && prev.key === lastRunSong.key);
  let jmBday = null;   // Just music on her birthday: Joe says a few words once, between two songs
  if (S.justMusic && !opts.first && !opts.silent && !next.focus && !opts.replaySegs && isBirthday() && lib.bdayJM !== today()) { lib.bdayJM = today(); saveLib(); jmBday = [lines('Happy birthday, Rim', [sub((R.birthday || {}).justMusic || 'Happy birthday, Rim!')])]; }
  const talk = !voicesPending() && (!!jmBday || !!opts.replaySegs) || (!voicesPending() && !S.justMusic && !opts.silent && !next.focus && (opts.first || afterPod || endRunNow || songsSinceBreak >= breakEvery() || opts.forceTalk || adsDue || (giftHint && giftHint.key === next.key) || dedications.has(next.key)));
  console.info('[radio] advance', { next: next.t, talk, count: songsSinceBreak, every: breakEvery() });
  if (talk) songsSinceBreak = 0;
  const old = P();
  if (!talk) {
    // no commentary this time: crossfade straight into the next song
    $('kind').textContent = 'tuning'; caption(R.host, ''); $('vinyl').classList.remove('talk');
    const okQ = await startSong(next, S.vol, opts.quick ? 1200 : fadeMs() || 1, opts.fadeOldMs || fadeMs());
    if (id !== runId) return;
    if (!okQ) { busy = false; return advance({ noCount: true }); }
    busy = false; return;
  }
  // commentary: let the old song fade under the host, with a soft bed so the air is never empty
  if (!opts.first) fadeP(old, 0, opts.fadeOldMs || fadeMs()).then(() => { try { if (pl[ai] === old) old.pauseVideo(); } catch {} });
  bedOn();
  nextPending = true; // a song you suggest while the host is talking takes the place of this one
  resolve(next);
  if (jmBday) podcastDue = false;
  const pb = preBreak; preBreak = null;
  const usePb = !!(pb && !opts.replaySegs && !jmBday && !opts.first && pb.next === next && pb.prev === prev);
  const segs = opts.replaySegs || jmBday || (usePb ? pb.segs : makeBreak(prev, next, opts.first));
  const introFor0 = next, introT = jmBday ? '' : usePb ? pb.intro : introFor(next, prev);
  preSegs(segs); if (introT) kokoroPre(introT, 'h');   // the break first, then the intro   // after the bulletin: the rest of the interrupted break
  console.info('[radio] break', lib.b, segs.map(s => s.kind + (s.title ? ' · ' + s.title : '')));
  curBreak = { segs, next, idx: 0 };
  const ok = await runSegments(segs, id);
  if (!ok) return;
  if (nextOverride) { planned = next; next = nextOverride; nextOverride = null; resolve(next); }
  curBreak.next = next;
  if (podcastDue && !opts.first) { // the end of each 64-song cycle: an episode, then the planned song comes after
    const pod = await findPodcast();
    if (id !== runId) return;
    if (pod) { planned = next; return playPodcast(pod, null, { scheduled: true }, id); }
  }
  $('kind').textContent = 'up next';
  const okT = await startSong(next, 14);
  if (id !== runId) return;
  curBreak = null;
  if (!okT) { busy = false; bedOff(); return advance({ noCount: true }); }
  nextPending = false;
  $('vinyl').classList.add('talk');
  $('capKind').textContent = R.host;
  // the song rises to full volume during the host's last 3 seconds (when the voice's length is known), else right after
  let rose = false;
  const rise = () => { if (rose || id !== runId) return; rose = true; bedOff(2.5); fadeP(P(), S.vol, 3000); };
  const nearEnd = setInterval(() => { const a = curAudio; if (kLast && a && a.duration && a.duration - a.currentTime <= 3) rise(); }, 150);
  if (!jmBday) await say(next === introFor0 && introT ? introT : introFor(next, prev), 'h');
  clearInterval(nearEnd);
  $('vinyl').classList.remove('talk');
  if (id !== runId) return;
  caption(R.host, '');
  busy = false;
  if (!rose) { bedOff(2.5); await fadeP(P(), S.vol, 3000); }
}

// ---------- the fun bulletin: twice a day (around 14:00 and 20:00), in English, about 2 minutes ----------
// Music news (her artists first), game news (Roblox and Dress to Impress first), good and viral stories, the
// Marrakech weather, and who was born on this day in music. A strict filter leaves out anything about crime, war,
// death, drugs, adult topics or anything iffy: when in doubt, a headline is skipped. Each source has its own time
// limit, so a slow one only loses its own headlines. It interrupts a song, then brings it back from the start.
let newsOn = false, newsBack = null, newsJingle = null, newsShown = null, lastNewsSlot = '', newsLineTok = 0;
const BULLETIN_HOURS = [14, 20];
const NEWS_SOURCES = [
  { id: 'pitchfork', name: 'Pitchfork', topic: 'music', urls: ['https://pitchfork.com/feed/feed-news/rss'] },
  { id: 'nme', name: 'NME', topic: 'music', urls: ['https://www.nme.com/news/music/feed'] },
  { id: 'consequence', name: 'Consequence', topic: 'music', urls: ['https://consequence.net/feed/'] },
  { id: 'guardianmusic', name: 'The Guardian music', topic: 'music', urls: ['https://www.theguardian.com/music/rss'] },
  { id: 'rollingstone', name: 'Rolling Stone', topic: 'music', urls: ['https://www.rollingstone.com/music/music-news/feed/'] },
  { id: 'roblox', name: 'Dexerto Roblox', topic: 'games', urls: ['https://www.dexerto.com/feed/category/roblox/'] },
  { id: 'ign', name: 'IGN', topic: 'games', urls: ['https://feeds.feedburner.com/ign/news'] },
  { id: 'gamespot', name: 'GameSpot', topic: 'games', urls: ['https://www.gamespot.com/feeds/news/'] },
  { id: 'eurogamer', name: 'Eurogamer', topic: 'games', urls: ['https://www.eurogamer.net/feed'] },
  { id: 'goodnews', name: 'Good News Network', topic: 'good', urls: ['https://www.goodnewsnetwork.org/feed/'] },
  { id: 'upi', name: 'UPI Odd News', topic: 'good', urls: ['https://rss.upi.com/news/odd_news.rss'] },
];
const NEWS_PLAN = [['music', 3], ['games', 2], ['good', 2]];
// When in doubt, leave it out.
const NOT_FOR_RIM = /\b(dead|dies|died|death|deaths|dying|kill\w*|murder\w*|shoot\w*|shot|shots|gun\w*|war|wars|warfare|attack\w*|bomb\w*|terror\w*|crash\w*|injur\w*|hospital\w*|cancer|tumou?r|suicid\w*|overdos\w*|drug\w*|cocaine|heroin|opioid|arrest\w*|charged|charges|sentenc\w*|prison|jail\w*|police|cops?|court|trial|lawsuit\w*|sue|sues|sued|suing|abuse\w*|assault\w*|harass\w*|sex\w*|nude|nudity|naked|porn\w*|explicit|rape\w*|victims?|tragic|tragedy|funeral|mourn\w*|rip|passes away|passed away|obituar\w*|scandal\w*|controvers\w*|racis\w*|slur|hate|hatred|threat\w*|violen\w*|blood\w*|fight\w*|weapon\w*|knife|stab\w*|disaster\w*|earthquake|flood\w*|hurricane|wildfire|ill|illness|sick|disease|virus|pandemic|politic\w*|election\w*|trump|biden|president\w*|government|congress|senate|israel\w*|gaza|palestin\w*|ukrain\w*|russia\w*|military|army|soldier\w*|nazi\w*|cartel|gang\w*|crime\w*|criminal\w*|steal\w*|stole|stolen|theft|thief|fraud|scam\w*|alcohol|beer|wine|vodka|whisk(e)?y|drunk|cannabis|weed|marijuana|vap(e|ing)|smok\w*|cigarette\w*|casino|gambl\w*|betting|lottery|powerball|onlyfans|horror|gore|satan\w*|demon\w*|layoffs?|fired|lays? off|strike|protest\w*|divorce\w*|cheat\w*|affair|split|breakup|pregnan\w*|surgery|rehab|mental health|depress\w*|anxiety|grief|loss|lost (his|her|their) |missing|kidnap\w*|hostage|refugee\w*|deport\w*|immigra\w*|tax\w*|recession|bankrupt\w*|price hike|tariff\w*|age rating|mature|nsfw|18\+|adult|lingerie|bikini|sexy|hot take|beef|diss|feud|slam\w*|blast\w*|rant|meltdown|drown\w*|scream\w*|rescu\w*|paraly\w*|injur\w*|surviv\w*|trapped|emergency|ambulance|terrif\w*|scary|creepy|haunted|ghost\w*|zombie\w*|gambl\w*|loot ?box\w*|stroke|heart attack|coma|diagnos\w*|gta|grand theft auto|call of duty|mortal kombat|resident evil|witcher|dark souls|elden ring|silent hill|dead space|the last of us|doom|cyberpunk|battlefield|hitman|bloodborne|diablo|god of war|outlast|five nights|dead by daylight|alien|predator)\b/i;
const DULL = /\bcodes?\b|\bpatch notes\b|\bdeals?\b|\bsale\b|\bprice\b|\bpre-?order\w*|\breview\b|\branked\b|\btier list\b/i;   // true but boring on the radio
const HER_ARTISTS = () => { const s = new Set(); (songs || []).forEach(x => artistParts(x.a).forEach(a => a.length > 3 && s.add(a))); return s; };
const GAME_FIRST = /\b(roblox|dress to impress|minecraft|stardew|animal crossing|zelda|mario|pokemon|pokémon|sims|fortnite|nintendo)\b/i;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('no answer')), ms))]);
const RELAYS = [
  u => HELPER ? '/api/fetch?url=' + encodeURIComponent(u) : null,
  u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  u => 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(u),
  u => 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(u),
];
const decodeEnt = t => { const d = document.createElement('textarea'); d.innerHTML = String(t || ''); return d.value; };
function parseFeed(text) {
  if (/^\s*\{/.test(text)) { const j = JSON.parse(text); if (j.status !== 'ok') throw new Error('relay refused'); return (j.items || []).map(x => ({ title: x.title, link: x.link || '', when: Date.parse((x.pubDate || '').replace(' ', 'T') + 'Z') || 0 })); }
  if (!/^\s*(<\?xml|<rss|<feed)/i.test(text)) throw new Error('not a feed');
  const doc = new DOMParser().parseFromString(text, 'text/xml'); if (doc.querySelector('parsererror')) throw new Error('broken feed');
  return [...doc.querySelectorAll('item, entry')].map(el => {
    const g = n => { const e = el.getElementsByTagName(n)[0]; return e ? e.textContent.trim() : ''; };
    const le = el.getElementsByTagName('link')[0];
    return { title: g('title'), link: (le && (le.getAttribute('href') || le.textContent)) || '', when: Date.parse(g('pubDate') || g('published') || g('updated')) || 0 };
  }).filter(x => x.title);
}
async function readSource(src) {
  const errs = [];
  for (const u of src.urls) {
    const order = RELAYS.map((f, i) => f(u) ? i : -1).filter(i => i >= 0);
    try {
      const tryOne = i => withTimeout((async () => { const r = await fetch(RELAYS[i](u)); if (!r.ok) throw new Error('HTTP ' + r.status); const it = parseFeed(await r.text()); if (!it.length) throw new Error('no headlines'); return it; })(), 12000);
      let it = null;
      if (order[0] === 0) { try { it = await tryOne(0); } catch {} }   // the PC first; the public relays only if that fails
      if (!it) it = await Promise.any(order.filter(i => i !== 0).map(tryOne));
      return { ok: true, items: it.map(x => ({ ...x, title: decodeEnt(x.title).replace(/\s+/g, ' ').trim(), src: src.id, name: src.name, topic: src.topic })) };
    } catch (e) { errs.push((e.errors && e.errors[0] && e.errors[0].message) || e.message || String(e)); }
  }
  return { ok: false, error: errs.join(' · ') || 'no answer', items: [] };
}
const headKey = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);
function servedNews() { try { return JSON.parse(localStorage.getItem('fgi-news-served') || '{}'); } catch { return {}; } }
function pickNews(results, test) {
  const now = Date.now(), served = servedNews(), seen = new Set(), mine = HER_ARTISTS();
  Object.keys(served).forEach(k => { if (now - served[k] > 3 * 864e5) delete served[k]; });
  const ok = x => { if (x.title.length < 18 || x.title.length > 170 || NOT_FOR_RIM.test(x.title) || DULL.test(x.title)) return false; if (x.when && now - x.when > 4 * 864e5) return false; const k = headKey(x.title); if (seen.has(k) || (!test && served[k])) return false; seen.add(k); return true; };
  const all = results.flatMap(r => r.items).filter(ok);
  const herScore = x => { const f = ' ' + fold(x.title) + ' '; let n = 0; mine.forEach(a => { if (f.includes(' ' + a + ' ')) n++; }); return n; };
  const picked = [];
  NEWS_PLAN.forEach(([topic, n]) => {
    let pool = all.filter(x => x.topic === topic);
    if (topic === 'music') pool.sort((p, q) => herScore(q) - herScore(p) || (q.when || 0) - (p.when || 0));
    else if (topic === 'games') pool.sort((p, q) => GAME_FIRST.test(q.title) - GAME_FIRST.test(p.title) || (q.when || 0) - (p.when || 0));
    else pool.sort((p, q) => (q.when || 0) - (p.when || 0));
    const bySrc = {}; pool.filter(x => { bySrc[x.src] = (bySrc[x.src] || 0) + 1; return bySrc[x.src] <= 2; }).slice(0, n).forEach(x => picked.push(x));   // no more than two from one site
  });
  if (!test) { picked.forEach(x => { served[headKey(x.title)] = now; }); try { localStorage.setItem('fgi-news-served', JSON.stringify(served)); } catch {} }
  return picked;
}
const WMO = { 0: 'clear skies', 1: 'mostly clear skies', 2: 'a few clouds', 3: 'cloudy skies', 45: 'fog', 48: 'fog', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle', 61: 'light rain', 63: 'rain', 65: 'heavy rain', 71: 'light snow', 73: 'snow', 75: 'heavy snow', 80: 'a few showers', 81: 'showers', 82: 'heavy showers', 95: 'thunderstorms', 96: 'thunderstorms', 99: 'thunderstorms' };
async function weatherNow() {
  const u = 'https://api.open-meteo.com/v1/forecast?latitude=31.63&longitude=-8.01&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Africa%2FCasablanca&forecast_days=2';
  const j = await (await withTimeout(fetch(u), 10000)).json();
  return { now: { temp: Math.round(j.current.temperature_2m), sky: WMO[j.current.weather_code] || '' }, tomorrow: { min: Math.round(j.daily.temperature_2m_min[1]), max: Math.round(j.daily.temperature_2m_max[1]), sky: WMO[j.daily.weather_code[1]] || '' } };
}
// Born on this day, in music (Wikipedia): singers, rappers, musicians. Only births, never deaths.
async function bornToday() {
  const d = new Date(), mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  const j = await (await withTimeout(fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/${mm}/${dd}`), 10000)).json();
  const mine = HER_ARTISTS();
  const list = (j.births || []).filter(b => b.year > 1930 && /\b(singer|rapper|musician|guitarist|drummer|bassist|songwriter|DJ|producer|keyboardist|composer)\b/i.test(b.text) && !NOT_FOR_RIM.test(b.text) && !/\bd\. \d{4}|\(died|\(\d{4}–\d{4}\)/.test(b.text))
    .map(b => { const name = b.text.split(',')[0].trim(); return { year: b.year, name, what: (b.text.split(',').slice(1).join(',').trim() || 'musician').replace(/\s*\(.*$/, ''), mine: mine.has(fold(name).trim()) }; });
  list.sort((p, q) => q.mine - p.mine || q.year - p.year);
  return list[0] || null;
}
async function getNews(manual) {
  const wx = withTimeout(weatherNow(), 15000).catch(() => null), born = withTimeout(bornToday(), 15000).catch(() => null);
  const late = { ok: false, error: 'too slow to answer', items: [] };
  const results = await Promise.all(NEWS_SOURCES.map(s => withTimeout(readSource(s), 30000).catch(() => late)));
  return { items: pickNews(results, manual), weather: await wx, born: await born, sources: NEWS_SOURCES.map((s, i) => ({ id: s.id, name: s.name, ok: results[i].ok, n: results[i].items.length, error: results[i].error || '' })) };
}
const B = () => R.bulletin || {};
function buildBulletin(n) {
  const heads = B().heads || { music: 'Music news.', games: 'In games.', good: 'And some good news.' };
  const out = [], info = [];
  let last = '';
  (n.items || []).forEach(x => {
    const t = x.title.replace(/\s*[|–—-]\s*(NME|Pitchfork|IGN|GameSpot|Eurogamer|Consequence|Rolling Stone|Dexerto)\s*$/i, '').replace(/[“”]/g, '"').replace(/([^.!?"])$/, '$1.');
    out.push(x.topic !== last ? `${heads[x.topic] || ''} ${t}`.trim() : t); info.push({ link: x.link, tag: x.name }); last = x.topic;
  });
  const w = n.weather;
  if (w && w.now) { out.push(sub((B().weather || 'The weather in Marrakech: {now}, {temp} degrees right now. Tomorrow, {sky}, between {min} and {max}.').replace('{now}', w.now.sky || 'nice weather').replace('{temp}', w.now.temp).replace('{sky}', w.tomorrow.sky || 'more of the same').replace('{min}', w.tomorrow.min).replace('{max}', w.tomorrow.max))); info.push({ tag: 'Open-Meteo' }); }
  if (n.born) { out.push(sub((B().born || 'Born on this day in {year}: {name}, {what}.').replace('{year}', n.born.year).replace('{name}', n.born.name).replace('{what}', n.born.what))); info.push({ tag: 'Wikipedia' }); }
  out.info = info; return out;
}
function resumeTarget() {
  if (curPod) return { type: 'pod', pod: curPod };
  if (curBreak) return { type: 'break', segs: curBreak.segs, idx: curBreak.idx || 0, next: curBreak.next };
  if (current) return { type: 'song', song: current };
  return null;
}
let newsEarly = null, lastNewsSources = null, newsLink = '';
async function runNews(manual) {
  if (newsOn) return;
  if (!started) { if (manual) toast('Press play first, then try the bulletin.'); return; }
  newsBack = resumeTarget();
  newsShown = { kind: $('kind').textContent, title: $('title').textContent, artist: $('artist').textContent, chips: $('chips').innerHTML };
  if (globalPaused) clearPause();
  stopSpeech(); newsOn = true;
  const id = runId;
  busy = true; clearTimeout(startWatch); planned = null; preload = null;
  fadeP(P(), 0, 1200).then(() => { try { if (newsOn) P().pauseVideo(); } catch {} });
  bedOff(0.8);
  $('kind').textContent = 'the bulletin'; $('title').textContent = 'The Feel Good Bulletin'; $('artist').textContent = clock(); $('chips').innerHTML = '';
  $('vinyl').classList.add('talk'); setLive(true);
  const early = !manual && newsEarly && Date.now() - newsEarly.at < 15 * 60e3 ? newsEarly.p : null; newsEarly = null;
  const fetched = withTimeout(early || getNews(manual), 45000).catch(() => null);
  await sleep(1000); if (id !== runId) return;
  $('capKind').textContent = R.host;
  await say(sub(fresh('newsin', B().intro || ['It is {time}: time for the Feel Good Bulletin.'])), 'n');
  const n = await fetched;
  if (id !== runId) return;
  if (n) { lastNewsSources = n.sources || null; paintNewsNote(); }
  rlog('bulletin', { items: n && n.items.length, weather: !!(n && n.weather), sources: n && n.sources.map(s => s.id + (s.ok ? ':ok' : ':x')).join(' ') });
  if (!n || (!n.items.length && !n.weather)) { await say(fresh('newsnone', B().none || ['The news wires are taking a nap, so no bulletin this time. Back to the music.']), 'n'); if (id === runId) finishNews(); return; }
  newsJingle = Jingles.play(getCtx(), 'bulletin'); await newsJingle.done; newsJingle = null;
  if (id !== runId) return;
  $('capKind').textContent = 'The Feel Good Bulletin';
  const ls = buildBulletin(n);
  ls.forEach(t => kokoroPre(t, 'n'));
  try { localStorage.setItem('fgi-news-last', JSON.stringify({ at: Date.now(), lines: ls.map((t, i) => ({ said: t, ...(ls.info[i] || {}) })) })); } catch {}
  for (let i = 0; i < ls.length; i++) {
    const tok = ++newsLineTok; newsLink = (ls.info[i] || {}).link || '';
    $('capSrc').textContent = (ls.info[i] || {}).tag || ''; $('cap').classList.toggle('linkable', !!newsLink);
    await say(ls[i], 'n');
    if (id !== runId) return;
    if (tok !== newsLineTok) continue;
    await sleep(120);
  }
  $('capSrc').textContent = ''; newsLink = ''; $('cap').classList.remove('linkable');
  if (id !== runId) return;
  $('capKind').textContent = R.host;
  await say(sub(fresh('newsout', B().outro || ['That was the bulletin. Back to the music.'])), 'n');
  if (id === runId) finishNews();
}
$('cap').addEventListener('click', async e => {   // during the bulletin: the story being read, in the browser
  if (!newsOn || !newsLink || e.target.closest('button')) return;
  const url = newsLink;
  if (helperOpens) { try { const r = await fetch('/api/open?url=' + encodeURIComponent(url)); if (r.ok) return toast('Opened in your browser.'); } catch {} }
  window.open(url, '_blank', 'noopener');
});
function endNews() { if (!newsOn) return; stopSpeech(); if (newsJingle) { try { newsJingle.stop(); } catch {} newsJingle = null; } finishNews(); }
function finishNews() {
  $('capSrc').textContent = ''; newsLink = ''; $('cap').classList.remove('linkable');
  const back = newsBack; newsOn = false; newsBack = null; busy = false;
  $('vinyl').classList.remove('talk'); caption(R.host, '');
  if (newsShown) { $('kind').textContent = newsShown.kind; $('title').textContent = newsShown.title; $('artist').textContent = newsShown.artist; $('chips').innerHTML = newsShown.chips; newsShown = null; }
  if (!back) { setLive(false); return; }
  if (back.type === 'break') return advance({ song: back.next, prev: null, replaySegs: back.segs.slice(back.idx), noCount: true, forceTalk: true });
  if (back.type === 'pod') { busy = true; stopSpeech(); return playPodcast(back.pod, null, { scheduled: true }, runId); }
  return advance({ song: back.song, prev: null, silent: true, noCount: true, quick: true });
}
// Not in Just music, not in Homework mode, not during an Album Party; skipped while the radio is paused.
const bulletinAllowed = () => started && S.news !== 'off' && !S.justMusic && !focusMode && !albumShow && !newsOn;
setInterval(() => {   // gathered 3 minutes before, while the music plays
  if (!bulletinAllowed()) return;
  const e = new Date(Date.now() + 3 * 60e3);
  if (e.getMinutes() === 0 && BULLETIN_HOURS.includes(e.getHours())) {
    const slot = e.toDateString() + ' ' + e.getHours();
    if (!newsEarly || newsEarly.slot !== slot) newsEarly = { slot, at: Date.now(), p: getNews(false).catch(() => null) };
  }
}, 5000);
setInterval(() => {   // at the hour, or at the end of the song that is playing then (up to 10 minutes late), never mid-talk
  if (!bulletinAllowed() || globalPaused) return;
  const d = new Date(); if (!BULLETIN_HOURS.includes(d.getHours()) || d.getMinutes() > 10) return;
  const slot = d.toDateString() + ' ' + d.getHours(); if (slot === lastNewsSlot) return;
  if (busy || speaking) return;
  lastNewsSlot = slot; runNews(false);
}, 5000);
function paintNewsNote() {
  const n = $('newsNote'); if (!n) return;
  if (!lastNewsSources) { n.textContent = 'around 14:00 and 20:00, about 2 minutes'; return; }
  n.textContent = 'last bulletin: ' + lastNewsSources.map(x => `${x.name} ${x.ok ? '✓' : '✗'}`).join(' · ');
}
// ---------- searching YouTube: through the PC helper, or (the website) through public relays ----------
// On the website there is no helper, so the page reads YouTube's results page through the same public relays the
// bulletin uses. A pasted YouTube link always works: its title comes from YouTube's oEmbed, which any page may read.
const ytIdOf = s => { const m = String(s).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) || String(s).trim().match(/^([\w-]{11})$/); return m ? m[1] : ''; };
const secsOf = t => { if (!t) return 0; return String(t).split(':').reduce((n, x) => n * 60 + (+x || 0), 0); };
async function oembed(id) {
  try { const r = await withTimeout(fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id)), 9000); if (!r.ok) return null; const j = await r.json(); return { id, title: j.title || '', channel: j.author_name || '', seconds: 0 }; } catch { return null; }
}
function parseResults(html) {
  const i = html.indexOf('ytInitialData'); if (i < 0) return [];
  const start = html.indexOf('{', i); let depth = 0, end = start;
  for (let k = start; k < html.length; k++) { const c = html[k]; if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) { end = k + 1; break; } } else if (c === '"') { k++; while (k < html.length && html[k] !== '"') { if (html[k] === '\\') k++; k++; } } }
  let data; try { data = JSON.parse(html.slice(start, end)); } catch { return []; }
  const out = [], walk = o => { if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === 'object') { if (o.videoRenderer) { const v = o.videoRenderer, tx = x => x ? (x.simpleText || (x.runs || []).map(r => r.text).join('')) : ''; out.push({ id: v.videoId, title: tx(v.title), channel: tx(v.ownerText || v.longBylineText), seconds: secsOf(tx(v.lengthText)) }); } else Object.values(o).forEach(walk); } };
  walk(data); return out.filter(v => v.id);
}
async function ytSearch(q, a = '', t = '') {
  const id = ytIdOf(q);
  if (id) { const v = await oembed(id); return v ? [v] : []; }
  if (HELPER) {
    try { const r = await fetch('/api/search?q=' + encodeURIComponent(q) + (a ? '&a=' + encodeURIComponent(a) + '&t=' + encodeURIComponent(t) : '')); const j = await r.json(); if (Array.isArray(j)) return j; } catch {}
    return [];
  }
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '&sp=EgIQAQ%253D%253D';
  const relays = RELAYS.slice(1, 4).map(f => f(url));
  try {
    const html = await Promise.any(relays.map(u => withTimeout(fetch(u).then(r => r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status))), 15000).then(h => { if (!/ytInitialData/.test(h)) throw new Error('not YouTube'); return h; })));
    const list = parseResults(html), ft = fold(t || q);
    return list.filter(v => !/#shorts/i.test(v.title)).sort((x, y) => (fold(y.title).includes(ft) - fold(x.title).includes(ft))).slice(0, 8);
  } catch { return []; }
}

// ---------- genre runs: the next 20 to 40 songs come from one genre, then back to the normal mix ----------
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function startRun(id, opts = {}) {
  let favList = null, pack = (R.runs || []).find(p => p.id === id);
  if (id === 'fav') {   // a run made of your favorites
    favList = (lib.fav || []).map(favToSong).filter(s => !lib.removed.includes(s.key));   // a song you removed stays out, even if it was a favorite
    if (!favList.length) return toast('No liked songs yet. Press the ♥ on a song you love.');
    pack = { id: 'fav', label: 'your Liked Songs', short: 'Liked Songs', genres: [], langs: [], songs: [], tags: [], genre: '' };
  }
  const L = id.startsWith('list:') && allLists().find(x => 'list:' + x.key === id);
  if (L) {   // one of your saved lists: all of it, shuffled
    favList = listSongs(L);
    if (!favList.length) return toast('That playlist is empty.');
    pack = { id, label: 'your playlist, ' + L.name, short: L.name, genres: [], langs: [], songs: [], tags: [], genre: '', gift: L.preset ? L.name : '' };
  }
  if (!pack) return;
  const size = Math.random() < 0.15 ? 40 : 20 + Math.floor(Math.random() * 11);
  const rs = recentSets();
  const fits = songs.filter(s => (pack.genres || []).includes(s.genre));
  const fresher = fits.filter(s => !rs.recentKeys.has(s.key));          // songs not heard lately come first
  const list = favList ? (opts.order ? (id === 'fav' ? favList.slice().reverse() : favList.slice()) : shuffle(favList)) : [...shuffle(fresher), ...shuffle(fits.filter(s => rs.recentKeys.has(s.key)))];
  if (!list.length) return toast('No songs of that genre in the library yet.');
  batch = { id, label: pack.label, short: pack.short, left: favList ? list.length : Math.min(size, list.length), list, order: !!opts.order };
  planned = null; preload = null; startAnnounce = pack.label; songsSinceBreak = 99; lastRunSong = null;
  toast(favList ? `${pack.short}: ${batch.left} songs${opts.order ? '' : ', shuffled'}. Starting now.` : `Genre Mix: ${pack.short}, about ${batch.left} songs. It starts after this song.`);
  if (favList && started && !newsOn) { songsSinceBreak = 0; startAnnounce = null; giftAnnounce = pack.gift || ''; stopSpeech(); advance(giftAnnounce && !S.justMusic ? { forceTalk: true, noCount: true } : { quick: true, silent: true, noCount: true }); }
  updateRunUI();
}
function stopRun() { batch = null; startAnnounce = null; planned = null; preload = null; toast('Back to the radio mix.'); updateRunUI(); }
function nextFromRun() {
  const lastA = current && current.a ? current.a.toLowerCase() : '';
  const fresh1 = x => !(batch.done || []).includes(x.key) && !(current && x.key === current.key);
  const s = batch.order ? batch.list.find(fresh1) : (batch.list.find(x => fresh1(x) && (x.a || '').toLowerCase() !== lastA) || batch.list.find(fresh1));
  if (s) (batch.done = batch.done || []).push(s.key);
  if (!s) { batch = null; updateRunUI(); return null; }
  batch.left--;
  if (batch.left <= 0) { lastRunSong = { key: s.key, label: batch.label }; batch = null; }
  updateRunUI();
  return s;
}
function updateRunUI() {
  $('btnRun').classList.toggle('on', !!batch);
  $('runInfo').style.display = batch ? '' : 'none';
  if (batch) $('runInfo').textContent = `${batch.short} · ${batch.left} songs left`;
}
function openRun() {
  const l = $('runList'); l.innerHTML = '';
  const add = (label, sub, active, fn) => { const d = document.createElement('div'); d.className = 'item' + (active ? ' now' : ''); d.innerHTML = '<div class="meta"><b></b><span></span></div>'; d.querySelector('b').textContent = label; d.querySelector('span').textContent = sub; d.onclick = () => { openSheet(null); fn(); }; l.appendChild(d); };
  add('Off: the radio mix', 'Everything, mixed by feeling', !batch, () => { if (batch) stopRun(); else toast('Already on the radio mix.'); });
  (R.runs || []).forEach(p => { const n = songs.filter(s => p.genres.includes(s.genre)).length; add(p.label, `${n} songs`, batch && batch.id === p.id, () => startRun(p.id)); });
  openSheet('shRun');
}

// ---------- controls ----------
// Pause stops everything that makes sound, whatever the radio is doing: the song (either player), the host's voice,
// a jingle, an ad and the soft ambient bed. Play continues exactly where each one was.
let globalPaused = false, pausedPlayers = [];
function pauseAll() {
  globalPaused = true; pausedPlayers = [];
  pl.forEach((p, i) => { try { const s = p.getPlayerState(); if (s === 1 || s === 3) { p.pauseVideo(); pausedPlayers.push(i); } } catch {} });
  try { speechSynthesis.pause(); } catch {}
  try { if (curAudio && !curAudio.paused) curAudio.pause(); } catch {}
  try { if (actx && actx.state === 'running') actx.suspend(); } catch {}
  playing = false; setPlayIcon(false); setLive(false);
}
function resumeAll() {
  globalPaused = false;
  try { if (actx && actx.state === 'suspended') actx.resume(); } catch {}
  try { speechSynthesis.resume(); } catch {}
  try { if (curAudio && curAudio.paused && !curAudio.ended) curAudio.play().catch(() => {}); } catch {}
  pausedPlayers.forEach(i => { try { pl[i].playVideo(); } catch {} }); pausedPlayers = [];
  setPlayIcon(true); if (speaking || busy) setLive(true);
}
function clearPause() {   // leaving the paused state because something new starts (Next, Previous...)
  globalPaused = false; pausedPlayers = [];
  try { if (actx && actx.state === 'suspended') actx.resume(); } catch {}
  try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch {}
  setPlayIcon(true);
}
async function togglePlay() {
  if (!started) return tuneIn();
  if (!ytReady) return;
  if (globalPaused) resumeAll(); else pauseAll();
}
function next() {
  if (!started) return;
  if (newsOn) return endNews();   // Next during the bulletin: stop it and go back to what was playing
  if (globalPaused) resumeAll();
  if (adSkip) { const b = adSkip; adSkip = null; b(); return; }
  if (breakSkip && !curBreak) { const b = breakSkip; breakSkip = null; b(); return; }
  try { // learn where a silent tail begins: if you skip near the end, trim there from now on
    if (current && !current.podcast && !current.focus && !current.album && playing && !busy) { const d = P().getDuration(), c = P().getCurrentTime(); if (d > 60 && d - c < 90 && d - c > 3) { lib.trim[current.key] = Math.max(0, c - 1); saveLib(); toast('Got it. I will end this song right here from now on.'); } }
  } catch {}
  advance({ quick: true, fadeOldMs: 500 });   // Next: the next song (already cued on the other player), the old one gone in half a second; when it is the host's turn (every 2 songs, played or skipped), she talks first
}
function prev() { if (started && globalPaused) resumeAll(); if (started && marathon && !newsOn) return marathonBack(); if (started && albumShow && !newsOn) return albumBack(); if (!started || !history.length) return toast('No earlier song yet.'); const p = history.pop(); advance({ song: p, prev: null, silent: true, noCount: true, quick: true }); }
async function tuneIn() {
  if (!songs.length) { $('tuneSub').textContent = 'one moment, loading your library…'; await bootDone; }   // play pressed while the library (or a slow sign-in) is still loading
  started = true; $('tune').style.display = 'none'; unlockAudio(); usageStart();
  if (!voices.length) loadVoices();
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch {}
  keepAwake();
  await waitVoices(tourSeen() ? 60000 : 180000);   // the app: its own voices first (the welcome or the tour)
  if (!tourSeen() && !updResume) await startTour(false);   // the first time: Joe's tour, out loud, before the music
  setPlayIcon(true);
  const back = updResume; updResume = null;
  if (back && back.song) {   // right after an update: the same song, from where it was, without the welcome
    await advance({ song: back.song, silent: true, noCount: true, prev: null });
    if (current && current.key === back.song.key && back.t > 3) setTimeout(() => { try { P().seekTo(back.t, true); } catch {} }, 1500);
    return;
  }
  await advance({ first: back ? false : true, silent: !!back });
}

// ---------- Update: the newest version now, without closing the radio ----------
// The PC asks its helper to download the new files at once; the web just reloads past the browser's cache. Either way
// the page reloads, and pressing play carries on with the same song from the same moment.
let updResume = null;
try { const r = JSON.parse(sessionStorage.getItem('pbd-resume') || 'null'); sessionStorage.removeItem('pbd-resume'); if (r && Date.now() - r.at < 10 * 60e3) { updResume = r; $('tuneSub').textContent = 'updated · press play to carry on'; } } catch {}
const pageVersion = () => (document.querySelector('meta[name="pbd-version"]') || {}).content || '';
// Every time the radio opens: the newest version, before you press play. The page reloads by itself when there is
// a new one, and a new PC helper takes over at once (helpers from before this need one last restart by hand).
async function autoUpdate() {
  try { if (Date.now() - (+sessionStorage.getItem('pbd-auto') || 0) < 120000) return; sessionStorage.setItem('pbd-auto', Date.now()); } catch { return; }   // once per opening, never a loop
  let version = '', helperLater = false;
  if (HELPER) { const r = await fetch('/api/update', { method: 'POST' }).catch(() => null); if (r && r.ok) { const j = await r.json(); version = j.version || ''; helperLater = !!j.helperLater; } }
  if (!version) { try { version = ((await (await fetch('files.json?t=' + Date.now(), { cache: 'no-store' })).json()) || {}).version || ''; } catch {} }
  if (started) return;   // you already pressed play: it waits for the next opening
  if (helperLater) {
    const r = await fetch('/api/restart', { method: 'POST' }).catch(() => null);
    if (r && r.ok && (await r.json().catch(() => ({}))).restarted) {
      $('tuneSub').textContent = 'updating the radio…';
      for (let i = 0; i < 40; i++) { await sleep(250); if (await fetch('/api/ping', { cache: 'no-store' }).then(x => x.ok).catch(() => false)) break; }
      if (started) return;
      return location.replace(location.pathname + '?u=' + Date.now());
    }
  }
  if (version && version !== pageVersion()) { $('tuneSub').textContent = 'updating the radio…'; rlog('auto update', { from: pageVersion(), to: version }); location.replace(location.pathname + '?u=' + Date.now()); }
}
$('btnUpdate').onclick = async () => {
  const b = $('btnUpdate'); if (b.disabled) return; b.disabled = true; b.textContent = 'Checking…';
  try {
    let version = '', helperLater = false;
    if (HELPER) {
      const r = await fetch('/api/update', { method: 'POST' }).catch(() => null);
      if (r && r.ok) { const j = await r.json(); version = j.version || ''; helperLater = !!j.helperLater; }
    }
    if (!version) { try { version = ((await (await fetch('files.json?t=' + Date.now(), { cache: 'no-store' })).json()) || {}).version || ''; } catch {} }   // unknown: reload anyway
    if (version && version === pageVersion()) { toast(helperLater ? 'You have the newest version. One part of the PC helper takes effect the next time you open the radio.' : 'You have the newest version.'); return; }
    try { sessionStorage.setItem('pbd-resume', JSON.stringify({ at: Date.now(), song: current && !current.podcast && !newsOn ? current : null, t: (() => { try { return P().getCurrentTime(); } catch { return 0; } })() })); } catch {}
    toast('Updating…');
    await sleep(400);
    location.replace(location.pathname + '?u=' + Date.now());
  } catch (e) { toast('Could not check for updates: ' + (e.message || e)); }
  finally { b.disabled = false; b.textContent = 'Update'; }
};

// ---------- panels ----------
const sheets = ['shAdd', 'shLib', 'shSet', 'shRun', 'shVer', 'shReport', 'shMarathon', 'shGenre', 'shAddTo', 'shPlEdit'];
$('btnReport').onclick = () => {
  const head = [`device: ${/Android|iPhone|iPad/i.test(navigator.userAgent) ? (navigator.userAgent.match(/Android[^;)]*|iPhone|iPad/) || [''])[0] : 'computer'} · ${(navigator.userAgent.match(/(EdgA|Edg|Brave|SamsungBrowser|Firefox|Chrome)\/[\d.]+/) || ['browser'])[0]}`,
    `helper on this device: ${HELPER ? 'yes' : 'no'} · cloud: ${window.Cloud && Cloud.user ? 'signed in' : 'not signed in'} · now: ${current ? current.a + ' - ' + current.t : 'nothing'}`, ''];
  $('reportText').textContent = head.concat(diag.slice().reverse()).join('\n') || 'Nothing recorded yet.';
  openSheet('shReport');
};
function openSheet(id) { sheets.forEach(s => $(s).classList.toggle('open', s === id)); }
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => openSheet(null));

async function doSearch() {
  const q = $('addq').value.trim(); if (!q) return;
  $('addRes').innerHTML = '<p style="color:var(--mute)">Searching…</p>';
  try {
    const r = await ytSearch(q);
    if (!r.length) throw 0;
    $('addRes').innerHTML = '';
    r.slice(0, 6).forEach(v => {
      const d = document.createElement('div'); d.className = 'item';
      d.innerHTML = `<img src="https://i.ytimg.com/vi/${v.id}/default.jpg" width="48" height="36" style="border-radius:6px;object-fit:cover"><div class="meta"><b></b><span></span></div><button class="btn" style="padding:6px 11px">Add</button>`;
      d.querySelector('b').textContent = cleanTitle(v.title); d.querySelector('span').textContent = `${v.channel} · ${fmt(v.seconds)}`;
      d.querySelector('button').onclick = () => addSong(v, q);
      $('addRes').appendChild(d);
    });
  } catch { $('addRes').innerHTML = `<p style="color:var(--mute)">Nothing found, or the search did not answer. Try other words${HELPER ? '' : ', or paste the song\'s YouTube link'}.</p>`; }
}
async function addSong(v, q) {
  if (suggestStation()) return addFocus(v);
  // a suggested song is added to your library and plays next. Nothing else is pulled in with it.
  const ts = [];
  const ded = ($('addDed').value || '').trim().slice(0, 200); $('addDed').value = '';
  const { a, t } = splitTitle(v);
  const draft = { a, t, q, tags: ts.length ? ts : (current && current.tags && current.tags.length ? current.tags.slice() : ['fun']), genre: (current && current.genre) || '', user: true, cands: [v], added: Date.now() };
  draft.key = key(draft);
  let s = songs.find(x => (x.cands || []).some(c => c.id === v.id)) || songs.find(x => x.key === draft.key);
  const isNew = !s;
  if (isNew) { lib.user.push(draft); lib.cache[draft.key] = draft.cands; buildSongs(); saveLib(); s = songs.find(x => x.key === draft.key); }
  if (ded) dedications.set(s.key, ded); else dedications.delete(s.key);
  queueNext(s);
  openSheet(null); $('addq').value = '';
  toast(isNew ? '"' + s.t + '" is in Your Library now, and plays next.' : '"' + s.t + '" plays next.');
}
// In Focus mode (a station), Suggest adds the track to that station instead of the library, and plays it next
const suggestStation = () => focusMode && focusMode !== 'sounds' ? focusStation(focusMode) : null;
function addFocus(v) {
  const st = suggestStation(), { a, t } = splitTitle(v);
  const s = Object.assign(focusSong(a, t, st.id), { pin: [v] });
  const known = stationSongs(st).find(x => x.key === s.key || (x.pin && x.pin[0].id === v.id));
  if (!known) { lib.focusAdd = lib.focusAdd || []; lib.focusAdd.push({ key: st.id + '>' + s.key, st: st.id, k: s.key, a, t, v: { id: v.id, title: v.title, channel: v.channel, seconds: v.seconds }, added: Date.now() }); saveLib(); }
  queueNext(known && !known.pin ? Object.assign(known, { pin: [v] }) : s);
  openSheet(null); $('addq').value = '';
  toast(known ? '"' + t + '" plays next.' : '"' + t + '" joins ' + st.label + ' and plays next.');
}
function paintSuggest() {   // the Suggest sheet, for the radio or for the Focus station that is playing
  const st = suggestStation();
  $('addTabs').style.display = st ? 'none' : ''; $('addDed').parentNode.style.display = st ? 'none' : '';
  if (st && addTab === 'list') $('addTabs').querySelector('[data-v="one"]').click();
  $('shAdd').querySelector('.hd h2').textContent = st ? 'Add a track to ' + st.label : 'Add a song';
  $('addq').placeholder = st ? 'Artist - track (instrumental)' : 'Artist - song, or a YouTube link';
  $('addRes').innerHTML = '<p style="color:var(--mute);font-size:13px;line-height:1.5">' + (st ? 'Type an instrumental track and pick the right one. It joins ' + st.label + ' and plays next.' : 'Type a song (or paste its YouTube link) and pick the right one. It goes into Your Library and plays next.') + '</p>';
}
function queueNext(song) {
  if (nextPending && !nextOverride) { nextOverride = song; return; } // the host is mid-break: swap it in before the next song starts
  planned = null; preload = null; upNext.push(song);
}
$('addGo').onclick = doSearch; $('addq').onkeydown = e => { if (e.key === 'Enter') doSearch(); };
$('btnAdd').onclick = () => { paintSuggest(); openSheet('shAdd'); setTimeout(() => (addTab === 'list' ? $('listIn') : $('addq')).focus(), 50); };

// ---------- Suggest > A list: a YouTube playlist link, or one "Artist - Title" per line (no size limit) ----------
// Every song is matched and shown with a tick box before anything is added. Added songs join the library
// with no genre ("Needs labels" in the Library) and, if "Play these next" is ticked, play in order after this song.
let addTab = 'one', listItems = [], listBusy = false;
document.querySelectorAll('#addTabs button').forEach(b => b.onclick = () => {
  addTab = b.dataset.v;
  document.querySelectorAll('#addTabs button').forEach(x => x.classList.toggle('on', x === b));
  $('addOne').style.display = addTab === 'one' ? 'contents' : 'none';
  $('addList').style.display = addTab === 'list' ? 'flex' : 'none';
});
function listEntry(a, t, cands, line) {
  const k = (a + '|' + t).toLowerCase(), v = cands[0];
  const ex = songs.find(s => s.key === k) || songs.find(s => (s.cands || []).some(c => c.id === v.id));
  const removed = lib.removed.includes(k);
  return { a, t, key: k, libKey: ex ? ex.key : k, cands, line, ci: 0, inLib: !!ex, removed, on: !removed };   // songs already in the library are ticked too: they belong to the list, and are not added twice
}
function renderListRes() {
  const box = $('listRes'); box.innerHTML = '';
  listItems.forEach(it => {
    const d = document.createElement('div'); d.className = 'item';
    if (it.missing) { d.innerHTML = `<div class="meta"><b></b><span>${it.failed ? 'YouTube did not answer, try again later' : 'not found on YouTube'}</span></div>`; d.querySelector('b').textContent = it.line; box.appendChild(d); return; }
    const v = it.cands[it.ci];
    d.innerHTML = `<input type="checkbox" style="margin:0 8px 0 0;flex:none"><img src="https://i.ytimg.com/vi/${v.id}/default.jpg" width="48" height="36" style="border-radius:6px;object-fit:cover;flex:none"><div class="meta"><b></b><span></span></div>${it.cands.length > 1 ? '<button class="mini-btn" title="Show the next YouTube result">other</button>' : ''}`;
    const cb = d.querySelector('input'); cb.checked = it.on; cb.onchange = () => { it.on = cb.checked; updateListAdd(); };
    d.querySelector('b').textContent = `${it.a} - ${it.t}`;
    d.querySelector('span').textContent = `${cleanTitle(v.title || '')} · ${v.channel || ''}${it.inLib ? ' · already in your library' : ''}${it.removed ? ' · you removed this before' : ''}`;
    const ob = d.querySelector('.mini-btn'); if (ob) ob.onclick = () => { it.ci = (it.ci + 1) % it.cands.length; renderListRes(); };
    box.appendChild(d);
  });
  updateListAdd();
}
function updateListAdd() {
  const n = listItems.filter(x => x.on && !x.missing).length;
  const named = $('listName').value.trim();
  $('listAdd').style.display = n ? '' : 'none'; $('listAdd').textContent = named ? `Save the list (${n} song${n === 1 ? '' : 's'})` : `Add ${n} song${n === 1 ? '' : 's'}`;
  $('listAll').style.display = listItems.some(x => !x.missing) ? '' : 'none';
  const miss = listItems.filter(x => x.missing).length;
  $('listRetry').style.display = miss && !listBusy ? '' : 'none'; $('listRetry').textContent = `Search the ${miss} missing again`;
  $('listSave').style.display = listItems.some(x => !x.missing) ? 'flex' : 'none';
}
$('listAll').onclick = () => { const anyOff = listItems.some(x => !x.missing && !x.on); listItems.forEach(x => { if (!x.missing) x.on = anyOff; }); renderListRes(); };
// Searching a pasted list, quickly but politely: up to 3 lines at a time, with a shared pace between requests.
// The pace speeds up while YouTube answers and slows right down when it refuses (too many searches in a row);
// a refused line waits and is tried again instead of being called missing. Songs already in the library need no search.
const pace = { gap: 300, next: 0 };
async function slot() { const now = Date.now(), at = Math.max(now, pace.next); pace.next = at + pace.gap; if (at > now) await sleep(at - now); }
const nrm = x => (x || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
let known = null;   // "artist|title" of every library song that already has a video, built once per search
function findKnown(a, t) {
  if (!known) { known = new Map(); songs.forEach(s => { if (s.cands && s.cands.length) known.set(nrm(s.a) + '|' + nrm(s.t), s); }); }
  return a ? known.get(nrm(a) + '|' + nrm(t)) : null;
}
async function findLine(line) {
  const parts = line.split(/\s+[-–—]\s+/), a = parts.length > 1 ? parts[0] : '', t = parts.length > 1 ? parts.slice(1).join(' - ') : line;
  const ex = findKnown(a, t); if (ex) return listEntry(ex.a, ex.t, ex.cands, line);
  const ask = async q => {
    await slot();
    const j = HELPER ? await fetch('/api/search?q=' + q).then(r => r.ok ? r.json() : null).catch(() => null) : await ytSearch(decodeURIComponent(q.split('&')[0]));
    if (!Array.isArray(j)) { pace.gap = 2000; throw new Error('refused'); }
    if (pace.gap > 300) pace.gap = Math.max(300, Math.round(pace.gap * 0.8));   // answering again: speed back up
    return j;
  };
  for (const wait of [0, 10, 30, 60]) {
    for (let w = wait; w > 0 && listBusy; w--) { $('listStatus').textContent = `YouTube is asking us to slow down. Trying again in ${w}s…`; await sleep(1000); }
    if (!listBusy) break;
    try {
      let r = await ask(encodeURIComponent(line) + (a ? '&a=' + encodeURIComponent(a) + '&t=' + encodeURIComponent(t) : ''));
      if (!r.length) r = await ask(encodeURIComponent(line));   // a looser second try
      if (!r.length) return { line, missing: true };
      const c = r.slice(0, 5), s0 = splitTitle(c[0]);
      return listEntry(a || s0.a, a ? t : s0.t, c, line);
    } catch {}
  }
  return { line, missing: true, failed: true };
}
// runs findLine over lines with 3 workers; results land in their own place so the list keeps your order
async function searchLines(lines, put, label) {
  known = null; let next = 0, done = 0;
  const worker = async () => {
    while (listBusy && next < lines.length) {
      const i = next++, it = await findLine(lines[i]);
      if (!listBusy && it.failed) return;   // stopped while waiting
      put(i, it); done++; renderListRes();
      if (!/slow down/.test($('listStatus').textContent) || done === lines.length) $('listStatus').textContent = `${label} ${done} of ${lines.length}…`;
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}
$('listRetry').onclick = async () => {
  if (listBusy) return;
  listBusy = true; $('listGo').textContent = 'Stop'; updateListAdd();
  const todo = listItems.filter(x => x.missing);
  await searchLines(todo.map(x => x.line), (i, it) => { listItems[listItems.indexOf(todo[i])] = it; }, 'Searching again:');
  const miss = listItems.filter(x => x.missing).length;
  $('listStatus').textContent = miss ? `${miss} still missing. Check the spelling, or try again later.` : 'All found.';
  listBusy = false; $('listGo').textContent = 'Read the list'; updateListAdd();
};
// A Spotify playlist or album link: its public embed page lists the songs (title, artists, explicit). Explicit songs are
// left out (clean versions only); the rest are searched on YouTube like songs typed one per line.
const spotifyId = raw => { const m = String(raw).match(/open\.spotify\.com\/(?:intl-\w+\/)?(playlist|album)\/([A-Za-z0-9]{10,})/); return m ? { kind: m[1], id: m[2] } : null; };
async function readSpotify(sp) {
  const u = 'https://open.spotify.com/embed/' + sp.kind + '/' + sp.id;
  let html = '';
  for (const r of RELAYS) {
    const url = r(u); if (!url) continue;
    try { const res = await withTimeout(fetch(url), 15000); if (res.ok) { html = await res.text(); if (/__NEXT_DATA__/.test(html)) break; } } catch {}
  }
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Spotify did not answer (is the playlist public?)');
  const find = o => { if (!o || typeof o !== 'object') return null; if (Array.isArray(o.trackList)) return o; for (const k in o) { const r = find(o[k]); if (r) return r; } return null; };
  const ent = find(JSON.parse(m[1])); if (!ent) throw new Error('no songs found in that link');
  const items = ent.trackList.map(x => ({ t: String(x.title || '').trim(), a: String(x.subtitle || '').split(/,\s*/)[0].replace(/ /g, ' ').trim(), explicit: !!x.isExplicit })).filter(x => x.t && x.a);
  return { title: ent.name || ent.title || 'From Spotify', items };
}
$('listGo').onclick = async () => {
  if (listBusy) { listBusy = false; return; }   // the button reads "Stop" while searching
  const raw = $('listIn').value.trim(); if (!raw) return;
  if (!HELPER && /[?&]list=|^(PL|OL|UU|FL|RD)[\w-]{10,}$/.test(raw)) { $('listStatus').textContent = 'Reading a YouTube playlist link works in the installed app. Here, paste the songs instead, one "Artist - Title" per line.'; return; }
  listItems = []; renderListRes(); listBusy = true; $('listGo').textContent = 'Stop';
  $('listGenre').innerHTML = genreOptions('let the radio decide');
  try {
    const pl = raw.match(/[?&]list=([\w-]+)/) || (/^(PL|OL|UU|FL|RD)[\w-]{10,}$/.test(raw) ? [raw, raw] : null);
    const sp = !pl && spotifyId(raw);
    if (sp) {
      $('listStatus').textContent = 'Reading the Spotify ' + sp.kind + '…';
      const j = await readSpotify(sp), clean = j.items.filter(x => !x.explicit), cut = j.items.length - clean.length;
      if (!$('listName').value.trim()) $('listName').value = j.title;
      const slots = [];
      await searchLines(clean.map(x => x.a + ' - ' + x.t), (i, it) => { slots[i] = it; listItems = slots.filter(Boolean); }, 'Finding them on YouTube:');
      const found = listItems.filter(x => !x.missing).length;
      $('listStatus').textContent = `"${j.title}": ${found} of ${clean.length} found${cut ? `, ${cut} explicit song${cut === 1 ? '' : 's'} left out (clean versions only)` : ''}. Untick any you don't want, then save it as a playlist.`;
      rlog('spotify read', { songs: j.items.length, explicit: cut, found });
    } else if (pl) {
      $('listStatus').textContent = 'Reading the playlist…';
      const r = await fetch('/api/playlist?list=' + encodeURIComponent(pl[1])); const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'the playlist could not be read');
      j.items.forEach(v => { const { a, t } = splitTitle(v); listItems.push(listEntry(a, t, [v], '')); });
      if (j.title) $('listName').value = j.title;
      renderListRes();
      $('listStatus').textContent = `"${j.title}": ${listItems.length} songs. Untick any you don't want, or press "other" for another version.`;
    } else {
      const lines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      if (!$('listName').value.trim()) $('listName').value = 'My playlist, ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const slots = [];
      await searchLines(lines, (i, it) => { slots[i] = it; listItems = slots.filter(Boolean); }, 'Searching:');
      const found = listItems.filter(x => !x.missing).length, refused = listItems.filter(x => x.failed).length;
      $('listStatus').textContent = `${found} of ${lines.length} found${listBusy ? '' : ' (stopped)'}.${refused ? ` YouTube did not answer for ${refused}: press "Search the missing again" in a few minutes.` : ''} Untick any you don't want, or press "other" for another version.`;
    }
  } catch (e) { $('listStatus').textContent = 'Could not read that: ' + (e.message || e); }
  listBusy = false; $('listGo').textContent = 'Read the list'; updateListAdd();
};
$('listName').oninput = updateListAdd;
$('listAdd').onclick = () => {
  const chosen = listItems.filter(x => x.on && !x.missing); if (!chosen.length) return;
  const now = Date.now(), keys = [], added = chosen.filter(it => !it.inLib).length;
  chosen.forEach((it, i) => {
    if (it.inLib) { if (!keys.includes(it.libKey)) keys.push(it.libKey); return; }   // already in the library: only joins the list
    const v = it.cands[it.ci], cands = [v, ...it.cands.filter(c => c.id !== v.id)];
    if (lib.removed.includes(it.key)) { lib.removed = lib.removed.filter(k => k !== it.key); markDeleted('removed', it.key); }   // you ticked a song you had removed: it comes back
    if (!lib.user.some(u => u.key === it.key)) lib.user.push({ a: it.a, t: it.t, q: it.line || `${it.a} - ${it.t}`, tags: [], genre: '', user: true, cands, added: now + i, key: it.key });
    lib.cache[it.key] = cands; if (!keys.includes(it.key)) keys.push(it.key);
  });
  buildSongs();
  const genre = $('listGenre').value, name = $('listName').value.trim();
  if (genre && labelGenre(keys, genre)) buildSongs();
  let L = null;
  if (name) {   // the same name again (a playlist read a second time) adds to that list instead of making a twin
    lib.lists = lib.lists || [];
    L = lib.lists.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (L) { L.keys = [...new Set([...L.keys, ...keys])]; L.ts = now; if (genre) L.genre = genre; }
    else lib.lists.push(L = { key: 'l' + now.toString(36), name, keys, genre, created: now, ts: now, color: rnd(COVER_COLORS), sticker: window.Stickers ? rnd(Stickers.names) : 'cassette' });
  }
  saveLib(); if (window.Cloud && Cloud.user) Cloud.push(lib, true);
  const playNext = $('listPlayNext').checked;
  if (playNext) { planned = null; preload = null; keys.forEach(k => { const s = songs.find(x => x.key === k); if (s) upNext.push(s); }); }
  rlog('list added', { songs: keys.length, new: added, list: name, genre, playNext });
  const left = keys.filter(k => { const s = songs.find(x => x.key === k); return s && !s.genre; }).length;
  toast(`${L ? `Playlist "${L.name}" saved, ${keys.length} songs (${added} new)` : `${added} song${added === 1 ? '' : 's'} added to Your Library`}${playNext ? ', playing next' : ''}.`);
  listItems = []; renderListRes(); $('listIn').value = ''; $('listName').value = ''; openSheet(null);
};



// ---------- favorites ----------
let libTab = 'all';
// the Library search box: every word must appear in the artist or the title (accents and punctuation ignored)
const fold = x => (x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
const libMatch = (...fields) => { const ws = fold($('libQ').value).split(' ').filter(Boolean); if (!ws.length) return true; const h = ' ' + fields.map(fold).join(' ') + ' '; return ws.every(w => h.includes(w)); };
const noMatch = () => `<p style="color:var(--mute);font-size:13px">Nothing here matches "${$('libQ').value.replace(/[<&"]/g, '')}".</p>`;
const favIdx = k => (lib.fav || []).findIndex(f => f.key === k);

let heartPrev = null;   // the song that just ended, while the host talks before the next one
const heartSong = () => current || (busy ? heartPrev : null);
function updateHeart() {
  const r = $('btnRemoveSong'); if (r) { r.style.display = current && !current.podcast && !current.sounds && !current.album ? '' : 'none'; r.classList.remove('sure'); r.innerHTML = '&#10005; never play this again'; }
  const b = $('btnHeart'); if (!b) return;
  const hs = heartSong(), on = !!hs && favIdx(hs.key) >= 0;
  b.classList.toggle('on', on); b.disabled = !hs || !!hs.podcast || !!hs.focus || !!hs.album;
  b.title = on ? 'Remove from Liked Songs' : 'Add to Liked Songs'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
}
function toggleFav() {
  const s = heartSong();
  if (!s || s.podcast) return;
  lib.fav = lib.fav || []; const i = favIdx(s.key);
  if (i >= 0) { lib.fav.splice(i, 1); markDeleted('fav', s.key); toast('Removed from Liked Songs.'); }
  else {
    const c = s.cands && (s === current ? (s.cands[candIdx] || s.cands[0]) : (s._playedId ? s.cands.find(x => x.id === s._playedId) || s.cands[0] : s.cands[0]));   // the exact version that played
    lib.fav.push({ key: s.key, a: s.a, t: s.t, id: c ? c.id : null, tags: (s.tags || []).slice(), genre: s.genre || '', ts: Date.now() });
    toast(`"${s.t}" is in your Liked Songs.`);
  }
  saveLib(); updateHeart(); if ($('shLib').classList.contains('open')) renderLib();
}
const artistParts = a => String(a || "").split(/\s*(?:,|&|\+|\/|\bfeat\b\.?|\bft\b\.?|\s[x×]\s|\band\b|\bwith\b|\bvs\b\.?)\s*/i).map(x => fold(x).trim()).filter(x => x.length > 1);
function favToSong(f) {
  const ex = songs.find(s => s.key === f.key);
  const cands = f.id ? [{ id: f.id, title: f.t, channel: f.a, seconds: 0 }].concat(((ex && ex.cands) || []).filter(c => c.id !== f.id)) : (ex && ex.cands);
  return Object.assign({}, ex || { a: f.a, t: f.t, q: f.a + ' ' + f.t, tags: f.tags && f.tags.length ? f.tags : ['fun'], genre: f.genre || '' }, { key: f.key, cands });
}
const songSecs = s => ((s && s.cands && s.cands[0] && s.cands[0].seconds) || 0);
const howLong = list => { const m = Math.round(list.reduce((n, s) => n + (songSecs(s) || 210), 0) / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
// a button that needs a second tap (nothing is lost by a slip of the finger)
function twoTap(b, sureText, fn) {
  let sure = 0; const label = b.innerHTML;
  b.onclick = e => { e.stopPropagation(); if (Date.now() > sure) { sure = Date.now() + 4000; b.classList.add('sure'); b.textContent = sureText; setTimeout(() => { if (Date.now() > sure) { b.classList.remove('sure'); b.innerHTML = label; } }, 4100); return; } sure = 0; fn(); };
}
const row = (title, sub, btns, onMeta, now) => {
  const d = document.createElement('div'); d.className = 'item' + (now ? ' now' : '');
  d.innerHTML = `<div class="meta"><b></b><span></span></div>` + btns.map(([icon, tip]) => `<button class="mini-btn" title="${tip}" aria-label="${tip}">${icon}</button>`).join('');
  d.querySelector('b').textContent = title; d.querySelector('span').textContent = sub;
  if (onMeta) d.querySelector('.meta').onclick = onMeta;
  return d;
};
function renderFav() {
  const l = $('libList'); l.innerHTML = ''; const f = lib.fav || [];
  $('libCount').textContent = `· ${f.length} liked`;
  if (!f.length) { l.innerHTML = '<p class="empty">No liked songs yet. Press the ♥ next to the song title while a song plays, and it lands here.</p>'; return; }
  const top = document.createElement('div'); top.className = 'pl-actions'; top.innerHTML = '<button class="btn">&#9654; Play</button><button class="btn ghost">&#8644; Shuffle</button>';
  const [pb, sb] = top.querySelectorAll('button'); pb.onclick = () => { openSheet(null); startRun('fav', { order: true }); }; sb.onclick = () => { openSheet(null); startRun('fav'); };
  l.appendChild(top);
  const fm = f.filter(x => libMatch(x.a, x.t)); if (!fm.length) l.insertAdjacentHTML('beforeend', noMatch());
  fm.slice().reverse().forEach(x => {
    const playNow = () => { openSheet(null); planned = null; preload = null; advance({ song: favToSong(x), quick: true }); };
    const d = row(x.t, x.a, [['&#9654;', 'Play next'], ['&#10005;', 'Remove from Liked Songs']], playNow, current && current.key === x.key);
    const [pn, rm] = d.querySelectorAll('.mini-btn');
    pn.onclick = () => { queueNext(favToSong(x)); toast(`"${x.t}" plays next.`); };
    rm.onclick = () => { lib.fav = lib.fav.filter(y => y.key !== x.key); markDeleted('fav', x.key); saveLib(); updateHeart(); renderLib(); };
    l.appendChild(d);
  });
}
// ---------- Playlists (like Spotify): your own names, a cover (a colour and a sticker), add, remove, play ----------
const COVER_COLORS = ['#ff3ea5', '#00e5ff', '#7cff3a', '#ffe600', '#9b6bff', '#ff8a3d'];
function coverHTML(L, size = 44) {
  const c = L.color || COVER_COLORS[(L.key || '').length % COVER_COLORS.length], st = window.Stickers && Stickers.svg(L.sticker || 'cassette', size * 0.7);
  return `<span class="cover" style="width:${size}px;height:${size}px;background:${c}">${st || ''}</span>`;
}
function newPlaylist(name, keys = []) {
  const now = Date.now(); lib.lists = lib.lists || [];
  const L = { key: 'l' + now.toString(36), name: name.slice(0, 60), keys, genre: '', created: now, ts: now, color: rnd(COVER_COLORS), sticker: window.Stickers ? rnd(Stickers.names) : 'cassette' };
  lib.lists.push(L); saveLib(); return L;
}
function addToPlaylist(L, s) {
  if (!s) return;
  if (!songs.some(x => x.key === s.key)) {   // not in the library yet (a podcast never is): it joins your songs
    if (s.podcast || s.focus || s.album) return toast('Only songs go into playlists.');
    lib.user.push({ a: s.a, t: s.t, q: s.a + ' ' + s.t, tags: s.tags || [], genre: s.genre || '', user: true, cands: s.cands, added: Date.now(), key: s.key }); buildSongs();
  }
  if (L.keys.includes(s.key)) return toast(`"${s.t}" is already in ${L.name}.`);
  L.keys.push(s.key); L.ts = Date.now(); saveLib(); toast(`Added to ${L.name}.`);
}
// the "+ playlist" button on the player: the song that is playing, into one of your playlists (or a new one)
function openAddTo() {
  const s = current; if (!s || s.podcast || s.focus || s.album || s.sounds) return toast('Play a song first, then add it to a playlist.');
  const box = $('addToList'); box.innerHTML = '';
  $('addToSong').textContent = `${s.t} · ${s.a}`;
  const make = document.createElement('div'); make.className = 'field';
  make.innerHTML = '<input id="newPlName" type="text" maxlength="60" placeholder="New playlist name"><button class="btn">Create</button>';
  make.querySelector('button').onclick = () => { const n = make.querySelector('input').value.trim(); if (!n) return toast('Give the playlist a name first.'); const L = newPlaylist(n); addToPlaylist(L, s); openSheet(null); };
  box.appendChild(make);
  (lib.lists || []).slice().reverse().forEach(L => {
    const d = document.createElement('div'); d.className = 'item pl-row'; const has = L.keys.includes(s.key);
    d.innerHTML = coverHTML(L, 40) + '<div class="meta"><b></b><span></span></div>';
    d.querySelector('.meta b').textContent = L.name; d.querySelector('.meta span').textContent = has ? 'already in it' : `${listSongs(L).length} songs`;
    d.onclick = () => { addToPlaylist(L, s); openSheet(null); };
    box.appendChild(d);
  });
  openSheet('shAddTo');
}
function renderLists() {
  const l = $('libList'); l.innerHTML = ''; const ls = allLists();
  $('libCount').textContent = `· ${ls.length} playlist${ls.length === 1 ? '' : 's'}`;
  const make = document.createElement('div'); make.className = 'field';
  make.innerHTML = '<input id="mkPlName" type="text" maxlength="60" placeholder="Name a new playlist"><button class="btn">+ New playlist</button>';
  make.querySelector('button').onclick = () => { const n = make.querySelector('input').value.trim(); if (!n) return toast('Type a name for the playlist first.'); const L = newPlaylist(n); libTab = 'list:' + L.key; renderLib(); toast(`"${L.name}" is ready. Add songs with "+ Add songs", or with "+ playlist" while a song plays.`); };
  l.appendChild(make);
  if (!ls.length) { l.insertAdjacentHTML('beforeend', '<p class="empty">No playlists yet. Name one above, or use Add a song &gt; Import a playlist.</p>'); return; }
  const lm = ls.filter(L => libMatch(L.name) || listSongs(L).some(s => libMatch(s.a, s.t))); if (!lm.length) l.insertAdjacentHTML('beforeend', noMatch());
  lm.slice().reverse().forEach(L => {
    const list = listSongs(L), d = document.createElement('div'); d.className = 'item pl-row' + (batch && batch.id === 'list:' + L.key ? ' now' : '');
    d.innerHTML = coverHTML(L) + '<div class="meta"><b></b><span></span></div><button class="mini-btn" title="Play" aria-label="Play">&#9654;</button>';
    d.querySelector('.meta b').textContent = L.name; d.querySelector('.meta span').textContent = `${list.length} songs · ${howLong(list)}`;
    d.querySelector('.meta').onclick = () => { libTab = 'list:' + L.key; renderLib(); };
    d.querySelector('.mini-btn').onclick = () => { if (!list.length) return toast('That playlist is empty. Add songs to it first.'); openSheet(null); startRun('list:' + L.key, { order: true }); };
    l.appendChild(d);
  });
}
let plAdding = false;
function renderPlaylist(L) {
  const l = $('libList'); l.innerHTML = ''; const list = listSongs(L);
  $('libCount').textContent = `· ${list.length} songs`;
  const h = document.createElement('div'); h.className = 'pl-head';
  h.innerHTML = `<button class="mini-btn" title="Back to your playlists">&larr; Playlists</button><div class="pl-title">${coverHTML(L, 64)}<div><b></b><span class="pl-sub"></span></div></div>
    <div class="pl-actions"><button class="btn">&#9654; Play</button><button class="btn ghost">&#8644; Shuffle</button><button class="btn ghost">+ Add songs</button><button class="btn ghost">&#9998; Edit</button><button class="btn ghost">&#10005; Delete</button></div>`;
  h.querySelector('.pl-title b').textContent = L.name; h.querySelector('.pl-sub').textContent = `${list.length} songs · ${howLong(list)}`;
  const [back, play, shuf, add, edit, del] = h.querySelectorAll('button');
  if (L.preset) [add, edit, del].forEach(b => { b.style.display = 'none'; });   // a family playlist: play and shuffle only
  back.onclick = () => { plAdding = false; libTab = 'lists'; renderLib(); };
  play.onclick = () => { if (!list.length) return toast('Add some songs first.'); openSheet(null); startRun('list:' + L.key, { order: true }); };
  shuf.onclick = () => { if (!list.length) return toast('Add some songs first.'); openSheet(null); startRun('list:' + L.key); };
  add.onclick = () => { plAdding = !plAdding; renderLib(); };
  edit.onclick = () => openPlEdit(L);
  twoTap(del, 'tap again to delete', () => { lib.lists = lib.lists.filter(x => x !== L); markDeleted('lists', L.key); saveLib(); libTab = 'lists'; renderLib(); toast(`"${L.name}" was deleted. Its songs stay in Your Library.`); });
  l.appendChild(h);
  if (plAdding && !L.preset) {   // + Add songs: every song of the library, the search box narrows it
    const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'Tap + to add a song. Use the search box above to find one.'; l.appendChild(p);
    songs.filter(s => !L.keys.includes(s.key) && libMatch(s.a, s.t)).slice(0, 80).forEach(s => {
      const d = row(s.t, s.a, [['+', 'Add to this playlist']], null);
      d.querySelector('.mini-btn').onclick = () => { addToPlaylist(L, s); renderLib(); };
      l.appendChild(d);
    });
    return;
  }
  if (!list.length) { l.insertAdjacentHTML('beforeend', '<p class="empty">Empty for now. Press "+ Add songs", or "+ playlist" on the player while a song you like is on.</p>'); return; }
  list.filter(s => libMatch(s.a, s.t)).forEach(s => {
    const d = row(s.t, s.a, [['&#9654;', 'Play next'], ['&#10005;', 'Take it out of this playlist']], () => { openSheet(null); planned = null; preload = null; advance({ song: s, quick: true }); }, current && current.key === s.key);
    const [pn, rm] = d.querySelectorAll('.mini-btn');
    pn.onclick = () => { queueNext(s); toast(`"${s.t}" plays next.`); };
    rm.onclick = () => { L.keys = L.keys.filter(k => k !== s.key); L.ts = Date.now(); saveLib(); renderLib(); };
    l.appendChild(d);
  });
}
// ✎ a playlist: its name and its cover
let plEdit = null;
function openPlEdit(L) {
  plEdit = { L, color: L.color || COVER_COLORS[0], sticker: L.sticker || 'cassette' };
  $('plName').value = L.name;
  const cs = $('plColors'); cs.innerHTML = ''; COVER_COLORS.forEach(c => { const b = document.createElement('button'); b.className = 'swatch'; b.style.background = c; b.setAttribute('aria-label', 'Colour ' + c); b.onclick = () => { plEdit.color = c; paintPlEdit(); }; b.dataset.c = c; cs.appendChild(b); });
  const ss = $('plStickers'); ss.innerHTML = ''; (window.Stickers ? Stickers.names : []).forEach(n => { const b = document.createElement('button'); b.className = 'stk'; b.innerHTML = Stickers.svg(n, 34); b.dataset.s = n; b.setAttribute('aria-label', n); b.onclick = () => { plEdit.sticker = n; paintPlEdit(); }; ss.appendChild(b); });
  paintPlEdit(); openSheet('shPlEdit');
}
function paintPlEdit() {
  $('plPreview').innerHTML = coverHTML({ key: plEdit.L.key, color: plEdit.color, sticker: plEdit.sticker }, 72);
  document.querySelectorAll('#plColors .swatch').forEach(b => b.classList.toggle('on', b.dataset.c === plEdit.color));
  document.querySelectorAll('#plStickers .stk').forEach(b => b.classList.toggle('on', b.dataset.s === plEdit.sticker));
}
$('plSave').onclick = () => {
  const L = plEdit && plEdit.L; if (!L) return;
  const n = $('plName').value.trim(); if (!n) return toast('A playlist needs a name.');
  Object.assign(L, { name: n.slice(0, 60), color: plEdit.color, sticker: plEdit.sticker, ts: Date.now() }); saveLib();
  libTab = 'list:' + L.key; openSheet('shLib'); renderLib(); toast('Saved.');
};
function renderLib() {
  document.querySelectorAll('#libTabs button').forEach(b => b.classList.toggle('on', b.dataset.v === libTab || (b.dataset.v === 'lists' && libTab.startsWith('list:'))));
  if (libTab === 'fav') return renderFav();
  if (libTab === 'lists') return renderLists();
  if (libTab === 'albums') return renderAlbums();
  const L = libTab.startsWith('list:') && allLists().find(x => 'list:' + x.key === libTab);
  if (libTab.startsWith('list:')) return L ? renderPlaylist(L) : (libTab = 'lists', renderLists());   // deleted on another device
  const all = songs, shown = all.filter(s => libMatch(s.a, s.t));
  $('libCount').textContent = `· ${songs.length} songs` + (shown.length < all.length ? `, ${shown.length} shown` : '');
  const l = $('libList'); l.innerHTML = '';
  if (all.length && !shown.length) l.insertAdjacentHTML('beforeend', noMatch());
  shown.slice(0, 400).forEach(s => {
    const d = row(s.t, `${s.a} · ${(R.genreMap && R.genreMap[s.genre] || {}).name || 'your song'}${s.user ? ' · added by you' : ''}`, [['+', 'Add to a playlist'], ['&#10005;', 'Never play this again']], () => { openSheet(null); planned = null; preload = null; advance({ song: s, quick: true }); }, current && current.key === s.key);
    const [ad, rm] = d.querySelectorAll('.mini-btn');
    ad.onclick = () => { const was = current; current = s; openAddTo(); current = was; };
    twoTap(rm, 'tap again', () => { lib.removed.push(s.key); lib.removedTs = lib.removedTs || {}; lib.removedTs[s.key] = Date.now(); if (lib.user.some(x => x.key === s.key)) markDeleted('user', s.key); lib.user = lib.user.filter(x => x.key !== s.key); buildSongs(); saveLib(); renderLib(); toast(`"${s.t}" will not play again. Settings > My stuff > Bring back removed songs undoes it.`); });
    l.appendChild(d);
  });
  if (shown.length > 400) l.insertAdjacentHTML('beforeend', `<p class="empty">${shown.length - 400} more: type in the search box to find them.</p>`);
}
$('btnRun').onclick = openRun;
$('btnHeart').onclick = toggleFav;
$('btnAddTo').onclick = openAddTo;
document.querySelectorAll('#libTabs button').forEach(b => b.onclick = () => { libTab = b.dataset.v; plAdding = false; renderLib(); });
$('btnLib').onclick = () => { renderLib(); openSheet('shLib'); };
let libQT; $('libQ').oninput = () => { clearTimeout(libQT); libQT = setTimeout(renderLib, 120); };
$('libQ').onkeydown = e => { if (e.key === 'Escape' && $('libQ').value) { e.stopPropagation(); $('libQ').value = ''; renderLib(); } };

function seg(id, k, cast = v => v) { const el = $(id); if (!el) return; const paint = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(S[k]) === b.dataset.v)); el.querySelectorAll('button').forEach(b => b.onclick = () => { S[k] = cast(b.dataset.v); paint(); saveLib(); if (k === 'sleep') setSleep(); }); paint(); }
function setSleep() { sleepAt = S.sleep ? Date.now() + S.sleep * 60000 : 0; if (S.sleep) toast(`Sleep timer: the music stops in ${S.sleep} minutes.`); }
$('btnSet').onclick = () => { openSheet('shSet'); seg('segTalk', 'talk'); seg('segSleep', 'sleep', Number); seg('segFade', 'fade', Number); seg('segNews', 'news'); paintNewsNote(); $('rate').value = S.rate || 100; loadVoices(); };
$('voiceSel').onchange = e => { S.voice = e.target.value; saveLib(); };
$('lunaSel').onchange = e => { S.lunaVoice = e.target.value; saveLib(); };
$('bulletinSel').onchange = e => { S.bulletinVoice = e.target.value; saveLib(); };
$('rate').oninput = e => { S.rate = +e.target.value; saveLib(); };
$('btnTest').onclick = () => { unlockAudio(); stopSpeech(); say(sub(fresh('testjoe', R.testLines && R.testLines.joe || ['Hey Rim, this is Luna. This is how I sound.']))); };
$('btnLunaTest').onclick = () => { unlockAudio(); stopSpeech(); say(sub(fresh('testluna', R.testLines && R.testLines.luna || ['Hi Rim, Joe here.'])), 's'); };
$('btnBulletinTest').onclick = () => { unlockAudio(); stopSpeech(); say(sub(fresh('testnews', R.testLines && R.testLines.bulletin || ['This is the Feel Good Bulletin voice.'])), 'n'); };
$('btnNews').onclick = () => { unlockAudio(); openSheet(null); runNews(true); };
$('btnNewsCheck').onclick = async () => {
  $('reportText').textContent = 'Asking every source… this can take up to a minute.'; openSheet('shReport');
  const res = await Promise.all(NEWS_SOURCES.map(readSource));
  $('reportText').textContent = `Bulletin sources, checked ${new Date().toLocaleString('en-GB')}\n\n` + NEWS_SOURCES.map((s, i) => {
    const r = res[i]; if (!r.ok) return `✗ ${s.name}: ${r.error}`;
    const fine = r.items.filter(x => !NOT_FOR_RIM.test(x.title));
    return `✓ ${s.name}: ${r.items.length} found, ${fine.length} pass the filter\n` + fine.slice(0, 3).map(x => `   · ${x.title}`).join('\n');
  }).join('\n\n');
};
$('btnNewsLast').onclick = () => {
  let last = null; try { last = JSON.parse(localStorage.getItem('fgi-news-last') || 'null'); } catch {}
  $('reportText').textContent = !last ? 'No bulletin has been read on this device yet.' : `Last bulletin, ${new Date(last.at).toLocaleString('en-GB')}\n\n` + last.lines.map((l, i) => [`${i + 1}. ${l.said}`, l.tag && `   ${l.tag}`, l.link && `   ${l.link}`].filter(Boolean).join('\n')).join('\n\n');
  openSheet('shReport');
};
$('reportCopy').onclick = async () => { const t = $('reportText').textContent; try { await navigator.clipboard.writeText(t); toast('Copied.'); } catch { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast('Copied.'); } catch {} a.remove(); } };

// A podcast or a concert, now (the 64-song cycle is not changed)
async function podNow(kind) {
  if (!started) return toast('Press play first, then choose.');
  if (newsOn) return toast('Right after the bulletin.');
  const pod = kind === 'concert' ? findConcert() : findShow(kind);
  if (!pod) return toast('Nothing to play there right now.');
  openSheet(null);
  if (globalPaused) clearPause();
  stopSpeech(); const id = runId; busy = true; clearTimeout(startWatch); planned = null; preload = null;
  rlog('podcast now', { kind });
  await playPodcast(pod, current, {}, id);
}
document.querySelectorAll('#podNow button, #concertNow button').forEach(b => b.onclick = () => podNow(b.dataset.v));

// ---------- Just music: like Spotify without ads. Joe and Luna stay quiet, no shows, no bulletin, nothing interrupts ----------
// Switching it off brings Joe back where the cycle stopped. Her birthday is the one exception: Joe says a few words once.
function paintJust() { const b = $('btnJust'); if (!b) return; b.classList.toggle('on', !!S.justMusic); b.setAttribute('aria-pressed', S.justMusic ? 'true' : 'false'); $('justLabel').textContent = S.justMusic ? 'Just music: on' : 'Just music'; document.body.classList.toggle('just', !!S.justMusic); }
$('btnJust').onclick = () => {
  S.justMusic = !S.justMusic; saveLib(); paintJust();
  toast(S.justMusic ? 'Just music: no talking, no shows, nothing in between. Tap again to bring ' + R.host + ' back.' : R.host + ' is back on the air.');
  if (S.justMusic && started && (speaking || (curBreak && !current))) { stopSpeech(); bedOff(1); advance({ silent: true, noCount: true, quick: true }); }
};

// ---------- Homework mode: a study timer (25 minutes of work, 5 of break), with a soft chime. No talking. ----------
let study = null;   // { phase: 'work'|'break', until, round }
function paintStudy() {
  const b = $('btnStudy'); if (!b) return;
  b.classList.toggle('on', !!study);
  b.textContent = study ? (study.phase === 'work' ? 'Study round ' + study.round + ': ' : 'Break: ') + fmt(Math.max(0, (study.until - Date.now()) / 1000)) + ' · stop' : '⏱ Study timer: 25 min work, 5 min break';
  const t = $('studyTag'); if (t) { t.style.display = study ? '' : 'none'; if (study) t.textContent = (study.phase === 'work' ? '⏱ study ' : '☕ break ') + fmt(Math.max(0, (study.until - Date.now()) / 1000)); }
}
$('btnStudy').onclick = e => { e.stopPropagation(); study ? stopStudy() : startStudy(); };
function startStudy() { study = { phase: 'work', until: Date.now() + 25 * 60e3, round: 1 }; paintStudy(); toast('Study timer on: 25 minutes, then a 5-minute break. You got this.'); }
function stopStudy() { study = null; paintStudy(); toast('Study timer off.'); }
setInterval(() => {
  if (!study) return;
  if (Date.now() >= study.until) {
    try { Jingles.play(getCtx(), 'chime'); } catch {}
    if (study.phase === 'work') { study = { phase: 'break', until: Date.now() + 5 * 60e3, round: study.round }; toast(fresh('studybreak', R.studyLines && R.studyLines.break || ['Break time. Stretch, get some water.'])); }
    else { study = { phase: 'work', until: Date.now() + 25 * 60e3, round: study.round + 1 }; toast(fresh('studyback', R.studyLines && R.studyLines.back || ['Back to it. Round {n}.']).replace('{n}', study.round)); }
  }
  paintStudy();
}, 1000);

// ---------- the welcome tour: the first time, Joe walks her through the main buttons, out loud ----------
// Each step is shown and read by Joe; when he finishes, the next one comes by itself. Next skips to the next step
// at once (cutting him off), Skip ends it. The first time, it plays before the music starts.
const tourSeen = () => { try { return localStorage.getItem('fgi-tour') === '1'; } catch { return true; } };
function startTour(force) {
  if (tourSeen() && !force) return Promise.resolve();
  const steps = (R.tour || []).filter(s => document.querySelector(s.el)); if (!steps.length) return Promise.resolve();
  return new Promise(resolve => {
    let i = 0, timer = null; const box = $('tour'), p = started && ytReady ? P() : null, vol0 = p && p._vol;
    if (p && playing) fadeP(p, Math.min(S.vol, 20), 600);   // played again from Settings: the music goes quiet under the host
    stopSpeech(); bedOn();
    steps.forEach(s => kokoroPre(sub(s.t), 's'));
    const end = () => {
      clearTimeout(timer); document.querySelectorAll('.tour-spot').forEach(x => x.classList.remove('tour-spot'));
      box.hidden = true; try { localStorage.setItem('fgi-tour', '1'); } catch {}
      stopSpeech(); bedOff(1); caption(R.host, '');
      if (p && playing && Number.isFinite(vol0)) fadeP(p, S.vol, 1200);
      resolve();
    };
    const show = async () => {
      clearTimeout(timer); document.querySelectorAll('.tour-spot').forEach(x => x.classList.remove('tour-spot'));
      if (i >= steps.length) return end();
      const s = steps[i], el = document.querySelector(s.el); el.classList.add('tour-spot');
      const text = sub(s.t);
      $('tourText').textContent = text; $('tourStep').textContent = `${i + 1} of ${steps.length}`; $('tourNext').textContent = i === steps.length - 1 ? 'Got it' : 'Next';
      box.hidden = false;
      const r = el.getBoundingClientRect(), below = r.top < window.innerHeight / 2;
      box.style.top = below ? Math.min(window.innerHeight - 170, r.bottom + 12) + 'px' : 'auto';
      box.style.bottom = below ? 'auto' : Math.max(12, window.innerHeight - r.top + 12) + 'px';
      stopSpeech(); const my = runId; $('capKind').textContent = R.cohost + ' · the tour';
      await say(text, 's');
      if (my === runId && !box.hidden) timer = setTimeout(() => { i++; show(); }, 1400);   // finished: the next step comes by itself
    };
    $('tourNext').onclick = () => { i++; show(); };
    $('tourSkip').onclick = () => { i = steps.length; show(); };
    show();
  });
}
$('btnTour').onclick = () => { unlockAudio(); openSheet(null); startTour(true); };
$('btnTourNext').onclick = () => { try { localStorage.removeItem('fgi-tour'); } catch {} rlog('tour set for the next opening'); toast('Done: the tour plays once, the next time the radio opens.'); };

// ---------- her birthday: a banner all day ----------
function paintBirthday() {
  const b = $('bday'); if (!b) return;
  const on = isBirthday(); b.hidden = !on;
  if (on) $('bdayText').textContent = sub((R.birthday && R.birthday.banner) || 'Happy birthday, Rim!');
}
setInterval(paintBirthday, 60000);

// ---------- Get the Windows app (the installed version), and the system check ----------
$('btnGetApp').onclick = () => window.open(R.appDownload || 'https://github.com/Yisyphus/feel-good-inc-fm/releases/latest', '_blank', 'noopener');
$('btnCheckPc').onclick = () => window.open('check.html', '_blank', 'noopener');

// ---------- usage log: when the radio is used (day, start, minutes played, website or app), nothing else ----------
// One line per listening session in the rim-fm database (Cloud.logUsage), readable only by the radio's owner
// (report.html, or the private usage-report job). No sign-in needed, and nothing about what was played or searched.
let usage = null, usageDirty = false;
function usageWrite() { if (!usage || !window.Cloud || !Cloud.logUsage) return; usageDirty = false; Cloud.logUsage(usage.id, { day: usage.day, start: usage.start, minutes: usage.minutes, where: usage.where, fresh: usage.fresh, device: usage.device, code: (window.Cloud && Cloud.code) || '', lastSeen: new Date().toISOString() }); }
function usageStart() {
  if (usage || !window.Cloud || !Cloud.logUsage || !Cloud.enabled) return;
  const now = new Date();
  usage = { id: (Cloud.device || 'device') + '-' + now.getTime(), day: now.toLocaleDateString('en-CA'), start: now.toISOString(), minutes: 0, where: HELPER ? 'app' : 'website', fresh: R.freshStart || '', device: Cloud.device || '' };
  usageWrite();
}
setInterval(() => { if (!usage) return; if (!globalPaused && (playing || speaking)) { usage.minutes = Math.min(1440, usage.minutes + 1); usageDirty = true; } if (usageDirty && usage.minutes % 5 === 0) usageWrite(); }, 60000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && usageDirty) usageWrite();
  if (document.hidden && HELPER && started) fetch('/api/hide', { method: 'POST' }).catch(() => {});   // can't be seen (covered): the helper hides the window, so songs keep starting
  if (!started) return;
  const ps = [0, 1].map(i => { try { const q = pl[i]; return [q.getPlayerState(), Math.round(q.getCurrentTime()), q._vol, q.isMuted() ? 'muted' : 'on'].join(' '); } catch { return '?'; } });
  rlog(document.hidden ? 'window minimized' : 'window back', { playing, busy, speaking, song: current && current.key, active: ai, players: ps, next: preload && (preload.key + (preload.primed ? ' ready' : ' preparing')), audio: actx && actx.state, tone: !!keepTone });
});
window.addEventListener('pagehide', () => { if (usageDirty) usageWrite(); });

// A tiny, inaudible tone while the radio is on: a page that goes completely silent while it is minimized is slowed
// down by the browser, which could hold the next song or Joe's next line until the window came back.
let keepTone = null;
function keepAwake() { try { const ctx = getCtx(); if (keepTone) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 20; g.gain.value = 0.001; o.connect(g); g.connect(ctx.destination); o.start(); keepTone = o; } catch {} }
$('btnFocus').onclick = e => { e.stopPropagation(); $('focusMenu').classList.toggle('open'); paintFocus(); };
$('focusMenu').onclick = e => {
  const ed = e.target.closest('[data-edit]'), b = e.target.closest('button'); if (!b) return;
  $('focusMenu').classList.remove('open');
  if (ed) return openGenre(ed.dataset.edit);
  if (b.dataset.act === 'add') return openGenre(null);
  if (b.hasAttribute('data-v')) setFocus(b.dataset.v);
};

// ---------- Focus > Add a genre: your own station, from 3 or more tracks you choose (nothing is found for you) ----------
// Kept with your data and synced (lib.focusCustom, its tracks in lib.focusAdd); never in the library. Suggest adds to it later.
let gEdit = null, gTracks = [];
function openGenre(id) {
  if (!HELPER) return toast('Making your own station works in the installed app (it searches YouTube through your PC).');
  const st = id && focusStation(id); gEdit = st ? id : null;
  gTracks = st ? (lib.focusAdd || []).filter(x => x.st === id).map(x => ({ a: x.a, t: x.t, k: x.k, v: x.v, key: x.key })) : [];
  $('genreName').value = st ? st.label : ''; $('genreQ').value = ''; $('genreRes').innerHTML = '';
  $('genreTitle').textContent = st ? 'Edit ' + st.label : 'Add a genre';
  $('genreDel').style.display = st ? '' : 'none';
  paintGenre(); openSheet('shGenre'); setTimeout(() => $(st ? 'genreQ' : 'genreName').focus(), 50);
}
function paintGenre() {
  const box = $('genreTracks'); box.innerHTML = '';
  gTracks.forEach((x, i) => {
    const d = document.createElement('div'); d.className = 'item';
    d.innerHTML = `<div class="meta"><b></b><span></span></div><button class="btn ghost" style="padding:6px 11px">Remove</button>`;
    d.querySelector('b').textContent = x.t; d.querySelector('span').textContent = x.a;
    d.querySelector('button').onclick = () => { gTracks.splice(i, 1); paintGenre(); };
    box.appendChild(d);
  });
  const need = gEdit ? 1 : 3, n = gTracks.length;
  $('genreCount').textContent = n < need ? (gEdit ? 'Keep at least one track.' : `Choose at least 3 tracks to start the station (${n} so far). Only instrumentals: the station plays nothing else.`) : `${n} track${n === 1 ? '' : 's'}. You can add more later with Suggest while it plays.`;
  $('genreSave').textContent = gEdit ? 'Save' : 'Create the station';
  $('genreSave').disabled = n < need || !$('genreName').value.trim();
}
async function genreSearch() {
  const q = $('genreQ').value.trim(); if (!q) return;
  $('genreRes').innerHTML = '<p style="color:var(--mute)">Searching…</p>';
  try {
    const r = await (await fetch('/api/search?q=' + encodeURIComponent(q))).json(); if (!r.length) throw 0;
    $('genreRes').innerHTML = '';
    r.slice(0, 5).forEach(v => {
      const d = document.createElement('div'); d.className = 'item';
      d.innerHTML = `<img src="https://i.ytimg.com/vi/${v.id}/default.jpg" width="48" height="36" style="border-radius:6px;object-fit:cover"><div class="meta"><b></b><span></span></div><button class="btn" style="padding:6px 11px">Add</button>`;
      d.querySelector('b').textContent = cleanTitle(v.title); d.querySelector('span').textContent = `${v.channel} · ${fmt(v.seconds)}`;
      d.querySelector('button').onclick = () => {
        const { a, t } = splitTitle(v), k = focusSong(a, t, '').key;
        if (!gTracks.some(x => x.k === k || (x.v && x.v.id === v.id))) gTracks.push({ a, t, k, v: { id: v.id, title: v.title, channel: v.channel, seconds: v.seconds } });
        $('genreRes').innerHTML = ''; $('genreQ').value = ''; paintGenre(); $('genreQ').focus();
      };
      $('genreRes').appendChild(d);
    });
  } catch { $('genreRes').innerHTML = '<p style="color:var(--mute)">Nothing found, or the search failed. Try different words.</p>'; }
}
function genreSave() {
  const label = $('genreName').value.trim().slice(0, 40); if (!label) return;
  const now = Date.now(), id = gEdit || 'my-' + now.toString(36);
  const was = (lib.focusCustom || []).find(c => c.key === id);
  lib.focusCustom = (lib.focusCustom || []).filter(c => c.key !== id);
  lib.focusCustom.push({ key: id, label, added: (was && was.added) || now, ts: now });
  lib.focusAdd = lib.focusAdd || [];
  const keep = new Set(gTracks.map(x => id + '>' + x.k));
  lib.focusAdd = lib.focusAdd.filter(x => { if (x.st !== id || keep.has(x.key)) return true; markDeleted('focusAdd', x.key); return false; });
  gTracks.forEach(x => { const k = id + '>' + x.k; if (!lib.focusAdd.some(y => y.key === k)) lib.focusAdd.push({ key: k, st: id, k: x.k, a: x.a, t: x.t, v: x.v, added: now }); });
  lib.focusCustom.sort((x, y) => (x.added || 0) - (y.added || 0));
  saveLib(); openSheet(null); paintFocus();
  if (gEdit) toast(label + ' saved.'); else setFocus(id);
}
function genreDelete() {
  const st = gEdit && focusStation(gEdit); if (!st || !confirm('Delete the station "' + st.label + '" and its tracks? Your library is not touched.')) return;
  markDeleted('focusCustom', st.id); lib.focusCustom = (lib.focusCustom || []).filter(c => c.key !== st.id);
  lib.focusAdd = (lib.focusAdd || []).filter(x => { if (x.st !== st.id) return true; markDeleted('focusAdd', x.key); return false; });
  saveLib(); openSheet(null);
  if (focusMode === st.id) setFocus(focusStations[0].id); else paintFocus();
  toast(st.label + ' was deleted.');
}
$('genreGo').onclick = genreSearch; $('genreQ').onkeydown = e => { if (e.key === 'Enter') genreSearch(); };
$('genreName').oninput = paintGenre; $('genreSave').onclick = genreSave; $('genreDel').onclick = genreDelete;
document.addEventListener('click', e => { if (!e.target.closest('#focusMenu, #btnFocus')) $('focusMenu').classList.remove('open'); });
paintFocus();

// The Non-stop sheet: three groups (songs, Joe & Luna bits, podcasts). A group's box ticks or clears all of it
// (Songs starts from the whole library); ticking anything inside ticks the group.
const chip = (v, label) => { const l = document.createElement('label'); l.innerHTML = '<input type="checkbox"><span></span>'; l.firstChild.value = v; l.lastChild.textContent = label; return l; };
function marGroups() { return [...document.querySelectorAll('#marBox .mar-g')].map(g => ({ g, head: g.querySelector('.mar-h input'), kids: [...g.querySelectorAll('.mar-c input')] })); }
function marPaint() {
  marGroups().forEach(({ g, head, kids }) => {
    if (!kids.length) return;
    const n = kids.filter(k => k.checked).length;
    head.checked = n > 0; head.indeterminate = false;
    g.querySelector('.mar-h em').textContent = n ? (g.dataset.g === 'songs' ? n + ' chosen' : n + ' of ' + kids.length) : '';
  });
  const gs = marGroups(), songsOn = gs[0].head.checked, others = gs.slice(1).some(x => x.head.checked);
  $('marEvery').style.display = songsOn && others ? '' : 'none';   // how many songs between the other parts: only when there are both
}
$('marBox').addEventListener('change', e => {
  const grp = marGroups().find(x => x.g.contains(e.target)); if (!grp) return;
  if (e.target === grp.head && grp.kids.length) {
    if (grp.g.dataset.g === 'songs') grp.kids.forEach(k => { k.checked = grp.head.checked && k.value === 'lib'; });
    else grp.kids.forEach(k => { k.checked = grp.head.checked; });
  }
  marPaint();
});
let marEvery = 2;
document.querySelectorAll('#marEvery button').forEach(b => b.onclick = () => { marEvery = +b.dataset.v; document.querySelectorAll('#marEvery button').forEach(x => x.classList.toggle('on', x === b)); });
$('btnMarathon').onclick = () => {
  const sel = S.marathon || { kinds: ['songs'], src: ['lib'], pods: Object.keys(R.podShows || {}) };
  const src = $('marSrc'); src.innerHTML = '';
  src.appendChild(chip('lib', `Your Library · ${songs.length}`)); src.appendChild(chip('fav', `Liked Songs · ${(lib.fav || []).length}`));
  allLists().forEach(L => src.appendChild(chip('list:' + L.key, `${L.name} · ${listSongs(L).length}`)));
  const gen = $('marGenres'); gen.innerHTML = '';
  (R.runs || []).forEach(r => gen.appendChild(chip('run:' + r.id, `${r.short} · ${songs.filter(x => r.genres.includes(x.genre)).length}`)));
  const on = sel.src || [];
  document.querySelectorAll('#marBox .mar-g').forEach(g => g.querySelectorAll('input').forEach(i => {
    const v = i.value, kind = g.dataset.g;
    i.checked = kind === 'songs' ? v !== 'songs' && sel.kinds.includes('songs') && on.includes(v)
      : kind === 'podcast' ? v !== 'podcast' && sel.kinds.includes('podcast') && sel.pods.includes(v)
      : sel.kinds.includes(v);
  }));
  $('marBox').querySelector('.mar-more').open = on.some(v => v.startsWith('run:'));
  marEvery = sel.every || 2; document.querySelectorAll('#marEvery button').forEach(b => b.classList.toggle('on', +b.dataset.v === marEvery));
  marPaint();
  $('marNote').textContent = marathon ? 'Non-stop is playing now: ' + marathon.all.map(k => MAR_LABEL[k]).join(', ') + '.' : '';
  openSheet('shMarathon');
};
$('marGo').onclick = () => {
  const val = q => [...document.querySelectorAll(q)].map(i => i.value);
  const src = val('#marBox [data-g="songs"] .mar-c input:checked'), pods = val('#marPods input:checked');
  const kinds = [...(src.length ? ['songs'] : []), ...val('#marBox [data-g="voices"] .mar-c input:checked'), ...(pods.length ? ['podcast'] : [])];
  S.marathon = { kinds, pods, src, every: marEvery }; saveLib();
  if (marathon) { marathon = null; }
  startMarathon(kinds, pods, src, marEvery);
};
$('marEnd').onclick = () => { openSheet(null); stopMarathon(); };
$('marStop').onclick = e => { e.stopPropagation(); if (albumShow) stopAlbum(); else stopMarathon(); };

document.addEventListener('pointerdown', () => { if (!ttsPlayer.src) unlockAudio(); }, { once: true, capture: true });
$('btnReset').onclick = () => { lib.removed.forEach(k => markDeleted('removed', k)); lib.removed = []; buildSongs(); saveLib(); toast('All the songs you removed are back.'); };

$('vol').oninput = e => { S.vol = +e.target.value; if (ytReady && !busy && !P()._fading) setVol(P(), S.vol); saveLib(); };
$('btnWrong').onclick = openVersions;
// Remove the song that is playing: from the library on the radio, from the station in Focus mode. It takes a second tap,
// so a slip of the finger removes nothing. Settings > Restore removed songs brings everything back.
let removeSure = 0;
$('btnRemoveSong').onclick = () => {
  const s = current, b = $('btnRemoveSong'); if (!s || s.podcast || s.sounds) return;
  if (Date.now() > removeSure) { removeSure = Date.now() + 4000; b.classList.add('sure'); b.textContent = 'tap again to confirm'; setTimeout(() => { if (Date.now() > removeSure) { b.classList.remove('sure'); b.innerHTML = '&#10005; never play this again'; } }, 4100); return; }
  removeSure = 0;
  const st = s.focus && focusStation(s.style), k = st ? st.id + '>' + s.key : s.key;
  if (!lib.removed.includes(k)) lib.removed.push(k);
  lib.removedTs = lib.removedTs || {}; lib.removedTs[k] = Date.now();
  if (!st) { if (lib.user.some(x => x.key === s.key)) markDeleted('user', s.key); lib.user = lib.user.filter(x => x.key !== s.key); buildSongs(); }
  if (marathon && marathon.bag) marathon.bag = marathon.bag.filter(x => x.key !== s.key);
  if (marathon && marathon.pool) marathon.pool = marathon.pool.filter(x => x.key !== s.key);
  saveLib();
  toast('"' + s.t + '" ' + (st ? 'is out of ' + st.label : 'will not play again') + '. Settings > My stuff > Bring back removed songs undoes it.');
  next();
};
$('btnPlay').onclick = togglePlay; $('btnNext').onclick = next; $('btnPrev').onclick = prev; $('btnTune').onclick = tuneIn;
$('bar').onclick = e => { if (!ytReady || !playing) return; const r = $('bar').getBoundingClientRect(); P().seekTo(P().getDuration() * (e.clientX - r.left) / r.width, true); };
$('btnMini').onclick = () => { const m = document.body.classList.toggle('mini'); try { window.resizeTo(m ? 420 : 440, m ? 220 : 760); } catch {} };
$('btnClose').onclick = async () => { if (!confirm('Turn the radio off?')) return; stopSpeech(); try { pl.forEach(p => p.pauseVideo()); } catch {} try { await fetch('/api/quit'); } catch {} window.close(); document.body.innerHTML = '<p style="padding:40px;font-family:system-ui;color:#ff3ea5">Feel Good Inc. FM is off. See you soon, Rim.</p>'; };
document.addEventListener('keydown', e => { if (/input|select/i.test(e.target.tagName)) return; if (e.code === 'Space') { if (e.target.tagName === 'BUTTON') return; e.preventDefault(); togglePlay(); } if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); });
if ('mediaSession' in navigator) { navigator.mediaSession.setActionHandler('play', togglePlay); navigator.mediaSession.setActionHandler('pause', togglePlay); navigator.mediaSession.setActionHandler('nexttrack', next); navigator.mediaSession.setActionHandler('previoustrack', prev); }

// ---------- ticker: progress, end-of-song trimming, preparing the next song ----------
setInterval(() => {
  if (!started) return;
  if (playing || speaking) airMs += 500;
  if (ytReady && playing && !busy && !P()._fading && Number.isFinite(P()._vol) && P()._vol !== S.vol) setVol(P(), S.vol);
  if (ytReady && playing && current && !busy) {
    try {
      const d = P().getDuration(), c = P().getCurrentTime(), rem = d - c;
      $('tcur').textContent = fmt(c); $('tdur').textContent = fmt(d); $('barfill').style.width = d ? (100 * c / d) + '%' : '0';
      const isPod = current.podcast;
      if (!isPod && !repeatOn && d > 30 && c >= 6) planPreload();
      if (!isPod && !repeatOn && d > 30 && rem < 95 && rem > 10) planBreak();   // a few seconds into the song: the next one is cued on the other player, so Next and the end are instant
      const trimAt = lib.trim[current.key];
      if (repeatOn && d > 5 && (rem <= 0.8 || (trimAt && c >= trimAt))) repeatSong();   // repeat: back to the start, no fade, no next song
      // end the song a little early (and learn-trim) so trailing silence never reaches you
      if (!repeatOn && !isPod && !current.album && d > 30 && (rem <= Math.max(S.trim || 0, S.fade || 0) || (trimAt && c >= trimAt))) {   // the last seconds fade out under what comes next
        console.info('[radio] trim trigger', { d, c, rem, trimAt, trim: S.trim, key: current.key }); advance({ fadeOldMs: trimAt && c >= trimAt ? 4000 : Math.max(2000, Math.round(rem * 1000)) }); }   // fade over what is left of the song
    } catch {}
  }
  if (sleepAt && Date.now() > sleepAt) { sleepAt = 0; S.sleep = 0; stopSpeech(); bedOff(); busy = true; (async () => { try { if (!S.justMusic) await say(sub(fresh('sleep', R.sleepLines || ['That is the sleep timer. Goodnight, Rim.'])), 'h'); await fadeP(P(), 0, 6000); if (current) current._selfPauses = 99; P().pauseVideo(); setVol(P(), S.vol); } catch {} busy = false; })(); }
}, 500);

// keeps the helper alive while the radio window is open (the installed version closes the helper when the window is gone)
setInterval(() => { if (HELPER) fetch('/api/ping').catch(() => {}); }, 20000);   // keeps the PC helper alive; nothing to ping on the web

// ---------- silence watchdog: what the screen says is playing must really be audible ----------
// Every 2 s, while a song is shown as playing and nothing else is happening: unmute a player the browser muted,
// restore a volume left low by an interrupted transition, restart a player that stopped by itself, and move on
// from one that is stuck. Everything it fixes is written to data/radio-log.txt.
let wd = { stuck: 0, lastT: -1, muted: 0, armed: false };
function armUnmute() {   // the browser refuses to unmute without a click: the next click anywhere turns the sound on
  if (wd.armed) return; wd.armed = true;
  toast('The browser muted the music. Click anywhere to turn the sound on.');
  document.addEventListener('pointerdown', () => { wd.armed = false; try { P().unMute(); setVol(P(), S.vol); } catch {} rlog('unmuted after click'); }, { once: true, capture: true });
}
setInterval(() => {
  if (!started || !ytReady || globalPaused || busy || !playing || !current) { wd.stuck = 0; wd.lastT = -1; return; }
  const p = P();
  try {
    const st = p.getPlayerState(), t = p.getCurrentTime(), v = p.getVolume();
    if (p.isMuted()) {
      p.unMute(); setVol(p, S.vol);
      if (++wd.muted >= 2) { rlog('player muted by the browser', { song: current.key }); armUnmute(); wd.muted = 0; }
    } else wd.muted = 0;
    if (!p._fading && Number.isFinite(v) && v < S.vol - 4) { rlog('volume was left low, restored', { song: current.key, v, want: S.vol }); setVol(p, S.vol); }
    if (st === YT.PlayerState.PLAYING) {
      if (t === wd.lastT) wd.stuck++; else wd.stuck = 0;
      wd.lastT = t;
      if (wd.stuck >= 4) { rlog('stuck: time not moving', { song: current.key, t }); wd.stuck = 0; tryNextCand(0); }
    } else if (st === YT.PlayerState.PAUSED || st === YT.PlayerState.CUED || st === -1) {
      // shown as playing but the player stopped by itself (not your pause button): start it again, then try another version
      if (++wd.stuck === 2) { rlog('player stopped by itself, restarting', { song: current.key, st }); p.playVideo(); }
      else if (wd.stuck >= 5) { rlog('player would not restart, next version', { song: current.key, st }); wd.stuck = 0; tryNextCand(0); }
    } else if (st === YT.PlayerState.BUFFERING) {
      if (++wd.stuck >= 45) { rlog('buffering for 90 s, next version', { song: current.key }); wd.stuck = 0; tryNextCand(0); }   // a slow connection: wait, do not skip
    }
  } catch {}
}, 2000);

// ---------- cloud sync button (Settings) ----------
function updateCloudUI() {
  const b = $('btnCloud'), n = $('cloudNote'); if (!b || !n) return;
  if (!window.Cloud || !Cloud.enabled) { b.disabled = true; b.textContent = 'Sign in with Google'; n.textContent = window.FIREBASE_CONFIG ? 'unavailable (offline?)' : 'not set up yet'; return; }
  b.disabled = false;
  const st = Cloud.status === 'saving' ? ' · saving…' : /^error/.test(Cloud.status) ? ' · ' + Cloud.status : '';
  if (Cloud.isAnon && Cloud.isAnon()) { b.textContent = 'Radio code'; n.textContent = (/^error/.test(Cloud.status) ? 'kept on this device for now; it goes up to the cloud as soon as it can' : 'on, by itself (no account needed)' + st); if ($('codeText')) $('codeText').textContent = Cloud.code || ''; return; }
  if (!Cloud.user && Cloud.anonError) { b.textContent = 'Sign in with Google'; n.textContent = 'only on this device for now (cloud saving is not switched on yet)'; return; }
  if (Cloud.user) { b.textContent = 'Sign out'; n.textContent = `synced as ${Cloud.user.email}` + (Cloud.status === 'saving' ? ' · saving…' : /^error/.test(Cloud.status) ? ' · ' + Cloud.status : ''); }
  else { b.textContent = 'Sign in with Google'; n.textContent = 'off: sign in to keep your playlists and liked songs on every device'; }
}
if (window.Cloud) Cloud.onStatus = updateCloudUI;
// Library backup: a file with everything; restoring MERGES it in (like a second device), it never replaces.
$('btnLibSave').onclick = () => {
  const blob = new Blob([JSON.stringify(lib)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'feel-good-inc-fm-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
};
$('btnLibRestore').onclick = () => $('libFile').click();
$('btnLibDays').onclick = async () => {
  if (!window.Cloud || !Cloud.user) return toast('Sign in (Cloud sync) to see the daily backups.');
  const list = await Cloud.listBackups().catch(() => []);
  const box = $('libDays'); box.innerHTML = list.length ? '' : '<p style="color:var(--mute);font-size:12px">No daily backup yet. The first one is made today.</p>';
  list.forEach(b => {
    const r = document.createElement('div'); r.className = 'set'; r.style.padding = '6px 0';
    r.innerHTML = `<span style="font-size:13px">${b.day}<br><small style="color:var(--mute);font-size:11px">${b.fav} favorites · ${b.lists} lists · ${b.user} songs</small></span><button class="btn ghost">Merge back</button>`;
    r.querySelector('button').onclick = async () => {
      const old = await Cloud.getBackup(b.day).catch(() => null); if (!old) return toast('Could not read that backup.');
      const before = { fav: (lib.fav || []).length, lists: (lib.lists || []).length, user: (lib.user || []).length };
      lib = Object.assign({ user: [], cache: {}, removed: [], settings: {}, trim: {}, disc: {} }, mergeLib(lib, Object.assign(old, { savedAt: 0 })));
      normalizeLib(); buildSongs(); updateHeart(); saveLib(); Cloud.push(lib, true);
      const d = k => (lib[k] || []).length - before[k];
      toast(`Merged ${b.day}: ${d('fav')} liked songs, ${d('lists')} playlists and ${d('user')} songs came back.`);
    };
    box.appendChild(r);
  });
  box.style.display = 'block';
};
$('libFile').onchange = async e => {
  const files = [...e.target.files]; e.target.value = '';
  let n = 0; const before = { fav: (lib.fav || []).length, lists: (lib.lists || []).length, user: (lib.user || []).length };
  for (const f of files) {
    try {
      const j = JSON.parse(await f.text()), old = j.lib && !j.fav ? j.lib : j;   // the helper's library.json, or a backup from here
      if (!old || typeof old !== 'object' || !(old.fav || old.lists || old.user || old.removed)) throw new Error('not a radio library');
      const merged = mergeLib(lib, Object.assign({}, old, { savedAt: 0 }));   // the file counts as older: your current settings stay
      lib = Object.assign({ user: [], cache: {}, removed: [], settings: {}, trim: {}, disc: {} }, merged); n++;
    } catch (err) { toast(f.name + ': ' + (err.message || 'could not read it')); }
  }
  if (!n) return;
  normalizeLib(); buildSongs(); updateHeart(); saveLib();
  if (window.Cloud && Cloud.user) Cloud.push(lib, true);
  const d = k => (lib[k] || []).length - before[k];
  toast(`Restored: ${d('fav')} liked songs, ${d('lists')} playlists and ${d('user')} songs added back.`);
  rlog('library restored', { files: n, favorites: (lib.fav || []).length, lists: (lib.lists || []).length, yourSongs: (lib.user || []).length });
};
const codeLink = () => location.origin + location.pathname.replace(/[^/]*$/, '') + '?code=' + encodeURIComponent(Cloud.code || '');
$('btnCodeCopy').onclick = async () => { try { await navigator.clipboard.writeText(codeLink()); toast('Link copied. Open it on your other device.'); } catch { toast(codeLink()); } };
$('btnCodeUse').onclick = async () => {
  const c = $('codeIn').value; if (!c.trim()) return;
  try { await Cloud.setCode(c); toast('Got it. Connecting to that radio…'); } catch (e) { toast(e.message || String(e)); }
};
$('btnGoogle').onclick = async e => { e.preventDefault(); try { await Cloud.flush(); await Cloud.signIn(); if (Cloud.user && !Cloud.isAnon()) { await syncWithCloud(); normalizeLib(); buildSongs(); updateHeart(); paintJust(); toast('Signed in with Google.'); } } catch (err) { toast('Sign-in did not work: ' + (err.message || err)); } updateCloudUI(); };
$('btnCloud').onclick = async () => {
  if (!window.Cloud || !Cloud.enabled) return;
  if (Cloud.isAnon && Cloud.isAnon()) { const box = $('codeBox'); $('codeText').textContent = Cloud.code || ''; box.style.display = box.style.display === 'none' ? 'block' : 'none'; return; }
  try {
    if (Cloud.user) { await Cloud.flush(); await Cloud.signOut(); toast('Signed out. This device keeps a copy of your stuff.'); }
    else {
      await Cloud.signIn();
      if (Cloud.user) { await syncWithCloud(); normalizeLib(); buildSongs(); updateHeart(); paintJust(); toast('Signed in. Your stuff is saved on all your devices now.'); }
    }
  } catch (e) { toast('Sign-in did not work: ' + (e.message || e)); }
  updateCloudUI();
};

// ---------- boot ----------
let booted; const bootDone = new Promise(r => { booted = r; });
(async () => {
  await loadLib(); buildSongs(); booted(); loadVoices(); autoUpdate().catch(() => {});
  $('vol').value = S.vol;
  setNow(null); updateCloudUI(); paintJust(); paintBirthday(); paintStudy();
  if (isBirthday() && (lib.fav || []).length && lib.bdayDone !== today()) shuffle(lib.fav).slice(0, 5).forEach(f => upNext.push(favToSong(f)));   // her birthday: her liked songs first
})();
})();
