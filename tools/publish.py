# bump every ?v= in index.html, stamp the version, regenerate files.json (what the installed app downloads)
# The file list is built from what the page really uses: every local script and stylesheet in index.html, plus the
# page itself, the icon, the background, and the system check page. Nothing has to be added by hand.
import json, hashlib, datetime, re, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
h = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()[:16]
ver = datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')
ix = open('index.html').read()
ix = re.sub(r'(src|href)="([\w.-]+\.(?:js|css|png|webp))\?v=[a-f0-9]+"', lambda m: f'{m.group(1)}="{m.group(2)}?v={h(m.group(2))}"', ix)
ix = re.sub(r'<meta name="pbd-version" content="[^"]*">', f'<meta name="pbd-version" content="{ver}">', ix)
open('index.html', 'w').write(ix)
used = re.findall(r'(?:src|href)="([\w.-]+\.(?:js|css|png|webp))(?:\?v=[a-f0-9]+)?"', ix)
files = sorted(set(used + ['index.html', 'icon.png', 'bg.webp', 'check.html']))
missing = [f for f in files if not os.path.exists(f)]
if missing: raise SystemExit('missing files: ' + ', '.join(missing))
j = {'files': {f: h(f) for f in files}, 'server': h('server.js'), 'version': ver}
json.dump(j, open('files.json', 'w'), indent=1); open('files.json', 'a').write('\n')
print(ver, len(files), 'files')
