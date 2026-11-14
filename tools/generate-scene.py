"""Genera la escena de la ciudad a la hora dorada (pantalla de carga y acceso) en capas SVG.

    python tools/generate-scene.py

Escribe en web/assets/scene/:
  far.svg     bruma lejana (siluetas en violeta cálido)
  mid.svg     ciudad media con borde dorado del lado del sol
  near.svg    arquitectura cercana: fachadas con patrón de ventanas, torres escalonadas, techo
              inclinado, cúpula, grúa, calle, árboles y faroles
  lights.svg  ventanas encendidas y vestíbulos (capa aparte: se encienden con un fundido)

Todas comparten viewBox 0 0 1920 640 y la línea de suelo en y = 560, así que se apilan con
object-fit: cover y object-position: bottom sin desalinearse. El generador usa una semilla fija:
la escena es siempre la misma.
"""
import math
import os
import random

W, H, BASE = 1920, 640, 560
SUN_X = 780  # el sol bajo queda detrás de este punto (≈40 %): los edificios cercanos son más bajos ahí
OUT = os.path.join(os.path.dirname(__file__), '..', 'web', 'assets', 'scene')
os.makedirs(OUT, exist_ok=True)


def f(n):
    return f'{n:.1f}'.rstrip('0').rstrip('.')


def svg(body, defs=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">'
            f'<defs>{defs}</defs>{body}</svg>\n')


def near_sun(x, w):
    """0 lejos del sol … 1 justo delante: los edificios se abren alrededor del sol."""
    d = abs((x + w / 2) - SUN_X)
    return max(0.0, 1 - d / 420)


def rim(x, y, w, h, color, width):
    """Borde iluminado del lado que mira al sol."""
    cx = x + w / 2
    if cx < SUN_X:
        return f'<rect x="{f(x + w - width)}" y="{f(y)}" width="{f(width)}" height="{f(h)}" fill="{color}"/>'
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(width)}" height="{f(h)}" fill="{color}"/>'


# ---------------------------------------------------------------- lejana
def far():
    r = random.Random(11)
    out = []
    x = -20
    while x < W + 20:
        w = r.randint(46, 110)
        h = r.randint(110, 250) + (r.random() < 0.14) * r.randint(60, 120)
        h *= 1 - 0.35 * near_sun(x, w)
        y = BASE - 40 - h
        out.append(f'<rect x="{x}" y="{f(y)}" width="{w}" height="{f(BASE - y)}"/>')
        if r.random() < 0.18:  # antena
            out.append(f'<rect x="{f(x + w / 2 - 1)}" y="{f(y - 26)}" width="2" height="26"/>')
        x += w + r.randint(-14, 8)
    defs = ('<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#b07a92"/><stop offset="1" stop-color="#7a5576"/></linearGradient>')
    return svg(f'<g fill="url(#g)" opacity=".55">{"".join(out)}</g>', defs)


# ---------------------------------------------------------------- media
def mid():
    r = random.Random(23)
    bodies, rims, wins = [], [], []
    x = -30
    while x < W + 30:
        w = r.randint(54, 120)
        h = r.randint(90, 220) + (r.random() < 0.18) * r.randint(50, 110)
        h *= 1 - 0.45 * near_sun(x, w)
        y = BASE - 18 - h
        bodies.append(f'<rect x="{x}" y="{f(y)}" width="{w}" height="{f(BASE - y)}"/>')
        if r.random() < 0.3:  # remate escalonado
            sw = w * r.uniform(0.35, 0.6)
            sh = r.randint(18, 40)
            bodies.append(f'<rect x="{f(x + (w - sw) / 2)}" y="{f(y - sh)}" width="{f(sw)}" height="{sh}"/>')
        glow = 0.25 + 0.55 * max(0.0, 1 - abs(x + w / 2 - SUN_X) / 900)
        rims.append(rim(x, y, w, BASE - y, f'rgba(255,186,118,{glow:.2f})', 1.6))
        for wy in range(int(y) + 10, BASE - 30, 13):
            for wx in range(x + 6, x + w - 8, 10):
                if r.random() < 0.16:
                    wins.append(f'<rect x="{wx}" y="{wy}" width="4" height="6"/>')
        x += w + r.randint(-10, 10)
    defs = ('<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#5a3d5c"/><stop offset="1" stop-color="#2a2034"/></linearGradient>')
    body = (f'<g fill="url(#g)">{"".join(bodies)}</g><g>{"".join(rims)}</g>'
            f'<g fill="#ffcf8a" opacity=".8">{"".join(wins)}</g>')
    return svg(body, defs)


# ---------------------------------------------------------------- cercana
def near():
    r = random.Random(37)
    bodies, facades, rims, extra, lit = [], [], [], [], []

    def building(x, w, h, kind):
        y = BASE - h
        bodies.append(f'<rect x="{x}" y="{f(y)}" width="{w}" height="{f(h)}"/>')
        top = y
        if kind == 'step':  # torre escalonada
            sw, sh = w * 0.62, r.randint(36, 70)
            bodies.append(f'<rect x="{f(x + (w - sw) / 2)}" y="{f(y - sh)}" width="{f(sw)}" height="{sh}"/>')
            sw2, sh2 = sw * 0.55, r.randint(20, 40)
            bodies.append(f'<rect x="{f(x + (w - sw2) / 2)}" y="{f(y - sh - sh2)}" width="{f(sw2)}" height="{sh2}"/>')
            extra.append(f'<rect x="{f(x + w / 2 - 1)}" y="{f(y - sh - sh2 - 34)}" width="2.2" height="34"/>')
            top = y - sh - sh2
        elif kind == 'slant':  # techo inclinado contemporáneo
            rise = r.randint(26, 48)
            bodies.append(f'<polygon points="{x},{f(y)} {x + w},{f(y)} {x + w},{f(y - rise)}"/>')
        elif kind == 'dome':
            rad = w * 0.36
            cx = x + w / 2
            bodies.append(f'<rect x="{f(cx - rad - 6)}" y="{f(y - 14)}" width="{f(2 * rad + 12)}" height="14"/>')
            bodies.append(f'<path d="M{f(cx - rad)} {f(y - 14)}A{f(rad)} {f(rad)} 0 0 1 {f(cx + rad)} {f(y - 14)}Z"/>')
            extra.append(f'<rect x="{f(cx - 1.2)}" y="{f(y - 14 - rad - 22)}" width="2.4" height="22"/>')
            rims.append(f'<path d="M{f(cx - rad)} {f(y - 14)}A{f(rad)} {f(rad)} 0 0 1 {f(cx + rad)} {f(y - 14)}" '
                        f'fill="none" stroke="rgba(255,196,128,.55)" stroke-width="2"/>')
        # fachada con patrón de ventanas (apagadas) y algunas encendidas, alineadas a la retícula
        fx0, fx1 = x + 8, x + w - 8
        fy0, fy1 = y + 14, BASE - 26
        facades.append(f'<rect x="{fx0}" y="{f(fy0)}" width="{fx1 - fx0}" height="{f(fy1 - fy0)}"/>')
        cols = [c for c in range(0, W, 12) if fx0 <= c + 3 and c + 9 <= fx1]
        rows = [rw for rw in range(0, BASE, 16) if fy0 <= rw + 4 and rw + 13 <= fy1]
        for c in cols:
            for rw in rows:
                if r.random() < 0.34:
                    lit.append(f'<rect x="{c + 3}" y="{rw + 4}" width="6" height="9"/>')
        # vestíbulo iluminado a nivel de calle
        if r.random() < 0.6:
            lw = w * r.uniform(0.35, 0.7)
            lit.append(f'<rect x="{f(x + (w - lw) / 2)}" y="{BASE - 22}" width="{f(lw)}" height="16" opacity=".85"/>')
        glow = 0.4 + 0.6 * max(0.0, 1 - abs(x + w / 2 - SUN_X) / 900)
        rims.append(rim(x, top, w, BASE - top, f'rgba(255,190,120,{glow:.2f})', 2.6))

    x = -40
    kinds = ['step', 'plain', 'slant', 'plain', 'dome', 'plain', 'step', 'slant']
    i = 0
    while x < W + 40:
        w = r.randint(90, 170)
        open_ = near_sun(x, w)
        h = (r.randint(220, 400) + (r.random() < 0.22) * r.randint(70, 130)) * (1 - 0.72 * open_)
        if open_ > 0.55:  # delante del sol: plazas y edificios bajos
            h = r.randint(40, 70)
        kind = kinds[i % len(kinds)] if open_ < 0.4 else 'plain'
        building(x, w, h, kind)
        x += w + r.randint(14, 46)
        i += 1

    # grúa de obra a contraluz (izquierda)
    cx, cy = 300, BASE - 500
    crane = [
        f'<rect x="{cx}" y="{cy}" width="8" height="{BASE - cy}"/>',
        f'<rect x="{cx - 120}" y="{cy}" width="330" height="6"/>',
        f'<rect x="{cx - 120}" y="{cy + 6}" width="44" height="18"/>',
        f'<polygon points="{cx - 6},{cy} {cx + 4},{cy - 38} {cx + 14},{cy}"/>',
        f'<rect x="{cx + 168}" y="{cy + 6}" width="1.4" height="120"/>',
        f'<rect x="{cx + 160}" y="{cy + 126}" width="18" height="12"/>',
    ]
    lattice = ''.join(f'<line x1="{cx}" y1="{cy + 12 + k * 22}" x2="{cx + 8}" y2="{cy + 23 + k * 22}"/>'
                      for k in range((BASE - cy) // 22))
    extra.append(f'<g>{"".join(crane)}<g stroke="#0b0a12" stroke-width="1.4">{lattice}</g></g>')
    extra.append(f'<circle cx="{cx + 4}" cy="{cy - 40}" r="3.2" fill="#ff5a4d"/>')

    # calle, árboles y faroles
    ground = (f'<rect x="0" y="{BASE - 6}" width="{W}" height="{H - BASE + 6}" fill="#08070d"/>'
              f'<rect x="0" y="{BASE + 18}" width="{W}" height="2" fill="rgba(255,196,128,.18)"/>')
    trees = []
    for tx in range(20, W, 64):
        if r.random() < 0.72:
            s = r.uniform(0.8, 1.25)
            ty = BASE - 4
            trees.append(f'<rect x="{f(tx - 1.5)}" y="{f(ty - 22 * s)}" width="3" height="{f(22 * s)}"/>')
            for _ in range(4):
                trees.append(f'<circle cx="{f(tx + r.uniform(-11, 11) * s)}" cy="{f(ty - (26 + r.uniform(0, 16)) * s)}" r="{f(r.uniform(9, 14) * s)}"/>')
    lamps, halos = [], []
    for lx in range(90, W, 180):
        lamps.append(f'<rect x="{lx}" y="{BASE - 52}" width="2" height="52"/><rect x="{lx}" y="{BASE - 52}" width="14" height="2"/>')
        halos.append(f'<circle cx="{lx + 13}" cy="{BASE - 48}" r="16" fill="url(#halo)"/><circle cx="{lx + 13}" cy="{BASE - 49}" r="2.4" fill="#ffe2b0"/>')

    defs = ('<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#261c2e"/><stop offset="1" stop-color="#0c0a13"/></linearGradient>'
            '<pattern id="win" width="12" height="16" patternUnits="userSpaceOnUse">'
            '<rect x="3" y="4" width="6" height="9" fill="#2a2434"/></pattern>'
            '<radialGradient id="halo"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".55"/>'
            '<stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>')
    body = (f'<g fill="url(#g)">{"".join(bodies)}{"".join(extra)}</g>'
            f'<g fill="url(#win)">{"".join(facades)}</g>'
            f'<g>{"".join(rims)}</g>{ground}'
            f'<g fill="#07060b">{"".join(trees)}{"".join(lamps)}</g>{"".join(halos)}')
    return svg(body, defs), svg(f'<g fill="#ffcf8a">{"".join(lit)}</g>')


for name, content in [('far.svg', far()), ('mid.svg', mid())]:
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
        fh.write(content)
near_svg, lights_svg = near()
with open(os.path.join(OUT, 'near.svg'), 'w', encoding='utf-8') as fh:
    fh.write(near_svg)
with open(os.path.join(OUT, 'lights.svg'), 'w', encoding='utf-8') as fh:
    fh.write(lights_svg)
for n in ('far.svg', 'mid.svg', 'near.svg', 'lights.svg'):
    print(n, os.path.getsize(os.path.join(OUT, n)), 'bytes')
