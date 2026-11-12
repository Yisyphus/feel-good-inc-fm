// Prints the listening report (the usage log in the rim-fm database) for the owner, in the job's log.
// Run by .github/workflows/usage-report.yml, only when the repository is private (job logs of a public one are public).
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.SA)) });
const fresh = process.env.FRESH || '', days = +process.env.DAYS || 30;
(async () => {
  const q = await admin.firestore().collection('usage').orderBy('start', 'desc').limit(2000).get();
  const all = q.docs.map(d => d.data()), since = Date.now() - days * 864e5;
  const rows = all.filter(r => (!fresh || r.fresh === fresh) && new Date(r.start) >= since);
  const dev = {}; let n = 0; rows.slice().reverse().forEach(r => { if (!(r.device in dev)) dev[r.device] = 'device ' + (++n); });
  const fmt = d => new Date(d).toLocaleString('en-GB', { timeZone: 'Africa/Casablanca', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  console.log(`USAGE REPORT: last ${days} days${fresh ? ', since the fresh start (' + fresh + ')' : ''}, Marrakech time`);
  console.log(`sessions ${rows.length} | days with music ${new Set(rows.map(r => r.day)).size} | minutes played ${rows.reduce((a, r) => a + (r.minutes || 0), 0)} | website ${rows.filter(r => r.where === 'website').length} | app ${rows.filter(r => r.where === 'app').length} | all-time sessions ${all.length}`);
  rows.forEach(r => console.log(`  ${fmt(r.start)} | ${String(r.minutes || 0).padStart(4)} min | ${r.where === 'app' ? 'Windows app' : 'website    '} | ${dev[r.device]}`));
  if (!rows.length) console.log('  (no listening in this period)');
})().catch(e => { console.error('could not read the usage log:', e.message); process.exit(1); });
