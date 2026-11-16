// Feel Good Inc. FM, the Windows app: its own window (Electron), not a browser tab.
// - It starts the helper (server.js, in the install folder) with the app's own built-in Node, then shows the radio.
// - The window is never slowed down or paused when it is minimized or covered: music and voices go on.
// - Links open in the normal browser; Google sign-in opens in a small window of its own.
const { app, BrowserWindow, shell } = require('electron');
const path = require('path'), http = require('http'), { spawn } = require('child_process');

const DIR = process.env.FGI_DIR || path.dirname(process.execPath);   // the install folder (server.js, public, data...)
const PORT = 8789, URL_HOME = 'http://localhost:' + PORT + '/';

// a minimized page must never be put to sleep: no slowed timers, no "hidden" page, no paused media
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.setAppUserModelId('FeelGoodIncFM');
app.userAgentFallback = app.userAgentFallback.replace(/ Electron\/\S+/, '').replace(/ feel-good-inc-fm\/\S+/i, '');   // a plain Chrome to YouTube and Google

if (!app.requestSingleInstanceLock()) app.quit();

const ping = () => new Promise(res => {
  const r = http.get({ host: '127.0.0.1', port: PORT, path: '/api/ping', timeout: 1500 }, x => { let b = ''; x.on('data', c => b += c); x.on('end', () => { try { res(JSON.parse(b).app === 'feel-good-inc-fm'); } catch { res(false); } }); });
  r.on('error', () => res(false)); r.on('timeout', () => { r.destroy(); res(false); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function startHelper() {
  if (await ping()) return true;
  try {
    spawn(process.execPath, [path.join(DIR, 'server.js')], { cwd: DIR, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', FGI_DESKTOP: '1' }, detached: true, stdio: 'ignore', windowsHide: true }).unref();
  } catch (e) { return false; }
  for (let i = 0; i < 80; i++) { await sleep(250); if (await ping()) return true; }
  return false;
}
const SIGN_IN = /^https:\/\/(accounts\.google\.com|[\w-]+\.firebaseapp\.com|[\w-]+\.web\.app|apis\.google\.com)\//;

let win = null;
async function open() {
  win = new BrowserWindow({
    width: 440, height: 820, minWidth: 360, minHeight: 560, title: 'Feel Good Inc. FM', backgroundColor: '#0b0a14',
    icon: path.join(DIR, 'icon.ico'), autoHideMenuBar: true, show: false,
    webPreferences: { backgroundThrottling: false, contextIsolation: true, sandbox: true, spellcheck: false },
  });
  win.removeMenu();
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (SIGN_IN.test(url)) return { action: 'allow', overrideBrowserWindowOptions: { width: 480, height: 640, autoHideMenuBar: true, parent: win, webPreferences: { backgroundThrottling: false } } };
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(URL_HOME)) { e.preventDefault(); shell.openExternal(url); } });
  win.on('close', () => { closing = true; });
  win.on('closed', () => { win = null; });
  watchHiding();
  const ok = await startHelper();
  if (!ok) { win.loadURL('data:text/html,' + encodeURIComponent('<body style="font:16px sans-serif;background:#0b0a14;color:#eee;padding:24px"><h2>The radio could not start</h2><p>Close this window and open Feel Good Inc. FM again. If it happens again, restart the PC.</p></body>')); return; }
  await updateFirst();
  win.loadURL(URL_HOME);
}
// the newest version of the radio before the window shows it (at most a few seconds; offline, the copy on the PC)
function updateFirst() {
  return new Promise(res => {
    const r = http.request({ host: '127.0.0.1', port: PORT, path: '/api/update', method: 'POST', timeout: 8000 }, x => { x.resume(); x.on('end', res); });
    r.on('error', res); r.on('timeout', () => { r.destroy(); res(); }); r.end();
  });
}
// ---------- minimize = hide, while the radio keeps playing ----------
// YouTube will not START a new song in a window Windows counts as unseen: minimized, sent to the tray (RBTray hides the
// window), or fully covered by another program. The song waits at "buffering" until the window is seen again (proven
// with the radio's logs; a background window that is not slowed down still stalls). So the window is never left unseen:
// it stays shown, but at 1% opacity, click-through and on top. For Windows it is open and uncovered, so songs start;
// for you nothing is there, and your clicks go to what is under it. Its taskbar button, Alt+Tab or the tray icon brings
// it back to normal. The taskbar button stays, so an invisible window always has a way back.
let ghost = false, leftFront = false, unseen = 0, closing = false, shown = false;   // shown: the window has appeared once (before that, not visible only means still starting)
function nlog(msg) {   // the radio's own Report (it also writes data/radio-log.txt); straight to the file if the page can't
  const toFile = () => { try { const r = http.request({ host: '127.0.0.1', port: PORT, path: '/api/log', method: 'POST', timeout: 2000 }, x => x.resume()); r.on('error', () => {}); r.on('timeout', () => r.destroy()); r.end(msg); } catch {} };
  if (!win || win.isDestroyed()) return toFile();
  win.webContents.executeJavaScript('window.__nativeLog ? (window.__nativeLog(' + JSON.stringify(msg) + '), true) : false').then(ok => { if (!ok) toFile(); }).catch(toFile);
}
const alive = () => win && !win.isDestroyed() && !closing;
function hide(why) {
  if (!alive() || ghost) return;
  win.setOpacity(0.01);                 // first, so coming out of "minimized" never flashes
  win.setIgnoreMouseEvents(true);       // click-through
  win.setAlwaysOnTop(true, 'floating'); // never covered
  if (win.isMinimized() || !win.isVisible()) win.showInactive();   // shown again, without taking focus
  ghost = true; leftFront = !win.isFocused(); unseen = 0;
  nlog('window hidden (' + why + '): invisible, still playing');
  setTimeout(() => { if (ghost && alive() && win.isMinimized()) { nlog('window still minimized, restoring it invisible'); win.restore(); } }, 400);
}
function back() {
  if (!alive() || !ghost) return;
  ghost = false;
  win.setAlwaysOnTop(false); win.setIgnoreMouseEvents(false); win.setOpacity(1);
  nlog('window back from hiding');
}
function watchHiding() {
  win.on('show', () => { shown = true; });
  win.on('minimize', () => setImmediate(() => hide('minimize')));
  win.on('blur', () => { if (ghost) leftFront = true; });
  // back only after the window has left the foreground at least once since hiding: a window that kept focus while
  // hiding would otherwise pop straight back
  win.on('focus', () => { if (ghost && leftFront) back(); });
  setInterval(() => {
    if (!alive() || !shown) return;
    if (ghost) {
      if (!win.isFocused()) leftFront = true; else if (leftFront) return back();
      if (win.isMinimized() || !win.isVisible()) { win.setOpacity(0.01); win.showInactive(); }   // minimized or sent to the tray again
      return;
    }
    // sent to the tray (hidden, not minimized): act after half a second (3 checks), so a window that is closing is left alone
    if (!win.isVisible() && !win.isMinimized()) { if (++unseen >= 3) hide('sent to the tray'); } else unseen = 0;
  }, 150);
  setInterval(async () => {   // covered by another program: the page can tell (document.hidden)
    if (!alive() || !shown || ghost || win.isFocused() || !win.isVisible() || win.isMinimized()) return;
    let h = false; try { h = await win.webContents.executeJavaScript('document.hidden'); } catch {}
    if (h && alive() && !ghost && !win.isFocused()) hide('covered by another program');
  }, 1000);
}
app.on('second-instance', () => { if (win) { if (ghost) back(); if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
app.whenReady().then(open);
app.on('window-all-closed', () => {   // closing the window closes the helper too
  const r = http.get({ host: '127.0.0.1', port: PORT, path: '/api/quit', timeout: 1500 }, () => app.quit());
  r.on('error', () => app.quit()); r.on('timeout', () => { r.destroy(); app.quit(); });
});
