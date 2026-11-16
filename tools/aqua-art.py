# Draws aqua.webp, the dream skin's underwater scene (an original drawing, no logos): python3 tools/aqua-art.py writes aqua.svg;
# render it at 900x1600 and save it as WebP (quality 78) as aqua.webp in the repo root.
import random, math
random.seed(7)
W, H = 900, 1600
o = []
o.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
o.append('''<defs>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fdcff"/><stop offset=".22" stop-color="#2fb3ea"/><stop offset=".6" stop-color="#1a7fd0"/><stop offset="1" stop-color="#0d4fa8"/></linearGradient>
<linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="aero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8ff6a" stop-opacity=".95"/><stop offset=".5" stop-color="#57d43a" stop-opacity=".85"/><stop offset="1" stop-color="#1e9e57" stop-opacity=".5"/></linearGradient>
<radialGradient id="bub" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="#bff0ff" stop-opacity=".12"/><stop offset=".9" stop-color="#e8fbff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".75"/></radialGradient>
<radialGradient id="globe" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#bff3ff"/><stop offset=".45" stop-color="#2aa6f0"/><stop offset="1" stop-color="#0b4fb3"/></radialGradient>
<radialGradient id="land" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#e6ff7a"/><stop offset=".6" stop-color="#58d12f"/><stop offset="1" stop-color="#1f8f2a"/></radialGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="heart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ff9a"/><stop offset=".5" stop-color="#b8e83a"/><stop offset="1" stop-color="#6fae12"/></linearGradient>
<linearGradient id="star" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#cfeaff"/><stop offset="1" stop-color="#8fb8e8"/></linearGradient>
<radialGradient id="cd" cx=".5" cy=".5" r=".5"><stop offset=".12" stop-color="#ffffff"/><stop offset=".14" stop-color="#cfd8e6"/><stop offset=".5" stop-color="#f2f6ff"/><stop offset=".7" stop-color="#d9f2ff"/><stop offset="1" stop-color="#b9c7dc"/></radialGradient>
<linearGradient id="rain" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9ad5" stop-opacity=".55"/><stop offset=".35" stop-color="#9af6ff" stop-opacity=".55"/><stop offset=".65" stop-color="#fff59a" stop-opacity=".55"/><stop offset="1" stop-color="#a7a2ff" stop-opacity=".55"/></linearGradient>
<linearGradient id="note" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe2ff"/><stop offset=".5" stop-color="#1b7fe0"/><stop offset="1" stop-color="#0a3fa8"/></linearGradient>
<linearGradient id="dol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd9e6"/><stop offset=".6" stop-color="#8b9db5"/><stop offset="1" stop-color="#5f7290"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd8ff" stop-opacity="0"/><stop offset="1" stop-color="#bff3ff" stop-opacity=".35"/></linearGradient>
</defs>''')
o.append(f'<rect width="{W}" height="{H}" fill="url(#sea)"/>')
# light rays from the surface
for x, w in [(120, 90), (300, 60), (470, 120), (660, 70), (800, 100)]:
    o.append(f'<polygon points="{x},0 {x+w},0 {x+w*3.2},{H} {x-w*0.8},{H}" fill="url(#ray)" opacity=".5"/>')
# caustic floor
o.append(f'<rect y="{H-360}" width="{W}" height="360" fill="url(#floor)"/>')
for i in range(26):
    x = random.randint(0, W); y = random.randint(H-300, H-20); r = random.randint(30, 90)
    o.append(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*0.28:.0f}" fill="none" stroke="#e9fdff" stroke-opacity=".35" stroke-width="3"/>')
# green aero swooshes
o.append(f'<path d="M{W} 120 C {W-260} 380, {W-120} 760, {W-300} 1180 S {W-60} 1500, {W} 1600 Z" fill="url(#aero)" opacity=".75"/>')
o.append(f'<path d="M{W} 260 C {W-170} 520, {W-40} 860, {W-170} 1240 S {W-20} 1480, {W} 1560 Z" fill="#eaffb8" opacity=".35"/>')
o.append('<path d="M0 0 C 200 60, 260 260, 120 420 S 30 640, 0 700 Z" fill="url(#aero)" opacity=".55"/>')
# a rainbow ribbon
o.append('<path d="M-40 980 C 220 860, 380 1120, 620 980 S 900 900, 960 960" fill="none" stroke="url(#rain)" stroke-width="46" stroke-linecap="round"/>')
def bubble(cx, cy, r):
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#bub)" stroke="#ffffff" stroke-opacity=".7" stroke-width="{max(1.5, r/22):.1f}"/>')
    o.append(f'<path d="M{cx-r*0.62:.0f} {cy-r*0.18:.0f} A {r*0.66:.0f} {r*0.66:.0f} 0 0 1 {cx-r*0.05:.0f} {cy-r*0.68:.0f}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="{max(2, r/9):.0f}" stroke-linecap="round"/>')
    o.append(f'<circle cx="{cx+r*0.45:.0f}" cy="{cy+r*0.42:.0f}" r="{max(2, r/12):.0f}" fill="#fff" opacity=".8"/>')
def fish(x, y, s, body, fin, kind, flip=False):
    g = f'<g transform="translate({x} {y}) scale({-s if flip else s} {s})">'
    if kind == 'clown':
        shape = "M-60 0 C -40 -38, 40 -40, 62 -6 C 70 0, 70 6, 62 10 C 40 40, -40 38, -60 0 Z"
        cid = 'clip%d' % random.randint(0, 10**6)
        g += f'<clipPath id="{cid}"><path d="{shape}"/></clipPath>'
        g += '<path d="M-60 0 L -92 -26 L -84 0 L -92 26 Z" fill="#ff7a1a" stroke="#1b1b1b" stroke-width="2"/>'
        g += f'<path d="{shape}" fill="{body}"/>'
        g += f'<g clip-path="url(#{cid})">'
        for bx in (-30, 6, 40):
            g += f'<path d="M{bx} -50 C {bx+12} -14, {bx+12} 14, {bx} 50 L {bx+13} 50 C {bx+25} 14, {bx+25} -14, {bx+13} -50 Z" fill="#fff" stroke="#1b1b1b" stroke-width="3"/>'
        g += '</g>'
        g += f'<path d="{shape}" fill="none" stroke="#1b1b1b" stroke-width="2"/>'
        g += '<circle cx="46" cy="-6" r="6" fill="#111"/><circle cx="48" cy="-8" r="2" fill="#fff"/>'
    elif kind == 'tang':
        g += f'<path d="M-70 0 C -40 -46, 50 -46, 74 -4 C 78 2, 76 8, 70 12 C 44 44, -40 44, -70 0 Z" fill="{body}"/>'
        g += '<path d="M-70 0 L -104 -30 L -94 0 L -104 30 Z" fill="#ffd21a"/>'
        g += '<path d="M-30 -10 C 0 -34, 40 -26, 54 -8 C 30 -14, 10 -2, -6 8 C -20 14, -40 10, -30 -10 Z" fill="#0b1f5c"/>'
        g += '<circle cx="52" cy="-8" r="5" fill="#111"/><circle cx="53" cy="-10" r="1.8" fill="#fff"/>'
    elif kind == 'gold':
        g += f'<path d="M-40 0 C -22 -32, 38 -34, 56 -6 C 60 0, 58 8, 52 12 C 30 34, -22 32, -40 0 Z" fill="{body}"/>'
        g += '<path d="M-40 0 C -70 -50, -120 -40, -110 -10 C -96 0, -96 6, -110 18 C -120 46, -70 50, -40 0 Z" fill="#ffb347" opacity=".85"/>'
        g += '<path d="M0 -26 C 14 -50, 34 -46, 40 -24 Z" fill="#ffb347" opacity=".9"/>'
        g += '<circle cx="40" cy="-6" r="5" fill="#111"/><circle cx="41" cy="-8" r="1.8" fill="#fff"/>'
    else:  # small striped
        g += f'<path d="M-40 0 C -26 -30, 30 -30, 44 -4 C 48 2, 46 6, 42 10 C 28 30, -26 30, -40 0 Z" fill="{body}"/>'
        g += f'<path d="M-40 0 L -62 -18 L -56 0 L -62 18 Z" fill="{fin}"/>'
        for bx in (-14, 4, 22):
            g += f'<rect x="{bx}" y="-24" width="6" height="48" rx="3" fill="{fin}" opacity=".7"/>'
        g += '<circle cx="30" cy="-4" r="4" fill="#111"/>'
    g += '<path d="M-30 -14 C 0 -30, 30 -26, 46 -12" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>'
    o.append(g + '</g>')
# the glossy globe
gx, gy, gr = 330, 270, 120
o.append(f'<circle cx="{gx}" cy="{gy}" r="{gr}" fill="url(#globe)"/>')
o.append(f'<path d="M{gx-70} {gy-40} C {gx-40} {gy-90}, {gx+10} {gy-70}, {gx-6} {gy-30} C {gx-20} {gy}, {gx+30} {gy+10}, {gx+10} {gy+50} C {gx-10} {gy+90}, {gx-60} {gy+60}, {gx-50} {gy+20} C {gx-90} {gy+10}, {gx-100} {gy-20}, {gx-70} {gy-40} Z" fill="url(#land)"/>')
o.append(f'<path d="M{gx+40} {gy-80} C {gx+80} {gy-70}, {gx+100} {gy-30}, {gx+70} {gy-10} C {gx+50} {gy+10}, {gx+80} {gy+40}, {gx+60} {gy+60} C {gx+30} {gy+40}, {gx+40} {gy}, {gx+30} {gy-30} Z" fill="url(#land)"/>')
o.append(f'<ellipse cx="{gx-20}" cy="{gy-60}" rx="{gr*0.7:.0f}" ry="{gr*0.38:.0f}" fill="url(#gloss)" opacity=".75"/>')
o.append(f'<circle cx="{gx}" cy="{gy}" r="{gr}" fill="none" stroke="#e9fbff" stroke-width="4" stroke-opacity=".7"/>')
# big bubbles, some with fish inside
bubble(150, 180, 130); fish(150, 190, 0.85, '#ff8a1a', '#ff8a1a', 'gold')
bubble(640, 560, 120); fish(640, 565, 0.75, '#ffe14a', '#2a78ff', 'small')
bubble(170, 1400, 150)
bubble(560, 1280, 70); bubble(780, 840, 46); bubble(110, 700, 54); bubble(420, 760, 34); bubble(830, 1300, 40)
for i in range(70):
    bubble(random.randint(10, W-10), random.randint(40, H-40), random.choice([4, 5, 6, 8, 10, 13, 16]))
# fish
fish(640, 220, 1.25, '#2a5cff', '#ffd21a', 'tang', flip=True)
fish(560, 860, 1.25, '#ff6a00', '#ff6a00', 'clown')
fish(300, 1150, 1.1, '#ff8a1a', '#ff8a1a', 'gold', flip=True)
fish(760, 1040, 0.9, '#ffe14a', '#ff8a00', 'small')
fish(820, 380, 0.75, '#3fe0d0', '#0aa6a0', 'small', flip=True)
fish(250, 900, 0.7, '#ff5a8a', '#ffc0d8', 'small')
fish(470, 1460, 0.95, '#c6f25a', '#ffe14a', 'small', flip=True)
# a dolphin
o.append('<g transform="translate(690 1480) rotate(-18) scale(1.3)"><path d="M-120 10 C -80 -40, 20 -50, 80 -20 C 100 -14, 118 -16, 132 -24 C 124 -12, 118 -4, 112 2 C 90 20, 40 30, -20 26 L -40 50 L -50 24 C -80 22, -104 20, -120 10 Z" fill="url(#dol)"/><path d="M-10 -40 C 4 -66, 20 -70, 24 -44 Z" fill="#8b9db5"/><path d="M-120 10 L -156 -14 L -146 10 L -160 34 Z" fill="#8b9db5"/><circle cx="92" cy="-14" r="3.5" fill="#1b2333"/><path d="M-80 -6 C -30 -30, 40 -34, 80 -18" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/></g>')
# glass stars
def star(cx, cy, r, rot=0):
    pts = []
    for k in range(10):
        a = math.pi / 5 * k - math.pi / 2 + rot; rr = r if k % 2 == 0 else r * 0.48
        pts.append(f'{cx + rr*math.cos(a):.0f},{cy + rr*math.sin(a):.0f}')
    o.append(f'<polygon points="{" ".join(pts)}" fill="url(#star)" stroke="#fff" stroke-width="3" stroke-linejoin="round" opacity=".92"/>')
star(820, 120, 46, 0.2); star(760, 190, 26, -0.3); star(60, 1080, 34, 0.4)
# a shiny CD with a glossy music note
o.append('<g transform="translate(700 1240)"><circle r="110" fill="url(#cd)" stroke="#9fb2cc" stroke-width="2"/><circle r="110" fill="url(#rain)" opacity=".55"/><circle r="22" fill="#5a7da8" opacity=".35"/><circle r="12" fill="#fff"/></g>')
o.append('<g transform="translate(720 1235) scale(1.1)"><path d="M-40 40 m-28 0 a 28 22 -20 1 0 56 0 a 28 22 -20 1 0 -56 0" fill="url(#note)"/><path d="M40 20 m-28 0 a 28 22 -20 1 0 56 0 a 28 22 -20 1 0 -56 0" fill="url(#note)"/><path d="M-16 40 L -16 -90 L 64 -110 L 64 20 L 52 20 L 52 -84 L -4 -72 L -4 40 Z" fill="url(#note)"/><path d="M-12 -84 L 58 -100" stroke="#fff" stroke-opacity=".7" stroke-width="6" stroke-linecap="round"/></g>')
# sparkle
o.append('<g transform="translate(820 640)"><polygon points="0,-60 10,-10 60,0 10,10 0,60 -10,10 -60,0 -10,-10" fill="#fff" opacity=".85"/><circle r="10" fill="#fff"/></g>')
o.append('</svg>')
open('aqua.svg', 'w').write('\n'.join(o))
print('svg bytes', sum(len(x) for x in o))
