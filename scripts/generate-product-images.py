#!/usr/bin/env python3
"""
Genera una ilustración SVG por componente en public/img/components/<id>.svg
a partir del catálogo (src/app/data/pc-components.ts exportado a JSON).

Uso:  node scripts/export-catalog.cjs > catalog.json && python3 scripts/generate-product-images.py catalog.json
Las fotos reales (<id>.webp) tienen prioridad: si existen, la web las usa en lugar de estas.
"""
import json, re, sys, math, pathlib

RED = '#e11d1d'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'img' / 'components'
OUT.mkdir(parents=True, exist_ok=True)
VENDOR = {'NVIDIA': '#76b900', 'AMD': '#ed1c24', 'Intel': '#0071c5'}

DEFS = '''<defs>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ecf0"/><stop offset=".5" stop-color="#aab0b8"/><stop offset="1" stop-color="#dfe3e8"/></linearGradient>
<linearGradient id="dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2d33"/><stop offset="1" stop-color="#121417"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2d27a"/><stop offset="1" stop-color="#b8892b"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".16"/><stop offset=".45" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity=".07"/></linearGradient>
<linearGradient id="rgb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff2d55"/><stop offset=".33" stop-color="#ffd60a"/><stop offset=".66" stop-color="#30d158"/><stop offset="1" stop-color="#0a84ff"/></linearGradient>
</defs>'''

def esc(t): return t.replace('&', '&amp;').replace('<', '&lt;')

def fan(cx, cy, r, accent=RED, blades=7):
    b = ''.join(f'<ellipse cx="{cx}" cy="{cy - r*.5:.1f}" rx="{r*.17:.1f}" ry="{r*.34:.1f}" transform="rotate({i*360/blades:.1f} {cx} {cy})" fill="#30343a"/>' for i in range(blades))
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#0b0c0e" stroke="#3a3e45" stroke-width="2"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*.92:.1f}" fill="none" stroke="{accent}" stroke-opacity=".55" stroke-width="1.5"/>{b}'
            f'<circle cx="{cx}" cy="{cy}" r="{r*.22:.1f}" fill="#16181b" stroke="{accent}" stroke-width="2"/>')

def label(c):
    name = esc(c['name'])
    size = max(13, min(22, 372 / (0.5 * len(name))))
    return (f'<text x="200" y="256" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#8b9097">{esc(c["brand"])}</text>'
            f'<text x="200" y="278" text-anchor="middle" font-family="Arial Narrow, Arial, Helvetica, sans-serif" font-weight="700" font-size="{size:.0f}" fill="#ffffff">{name}</text>')

def cpu(c):
    amd = c['brand'] == 'AMD'
    pads = ''.join(f'<rect x="{120+i*11}" y="{y}" width="6" height="4" fill="url(#gold)"/>' for i in range(14) for y in (42, 213))
    pads += ''.join(f'<rect x="{x}" y="{52+i*11}" width="4" height="6" fill="url(#gold)"/>' for i in range(14) for x in (113, 283))
    model = esc(re.sub(r'^(Ryzen|Core)\s*', '', c['name']))
    line1 = 'AMD RYZEN' if amd else 'intel CORE'
    return (f'<rect x="108" y="36" width="184" height="184" rx="8" fill="#1d2124" stroke="#3a3f44"/>{pads}'
            f'<rect x="128" y="56" width="144" height="144" rx="10" fill="url(#metal)" stroke="#8a9098"/>'
            f'<rect x="136" y="64" width="128" height="128" rx="6" fill="none" stroke="#7d848c" stroke-width="1.2"/>'
            f'<path d="M128 78 L142 56 L128 56Z" fill="{RED if amd else "#0071c5"}"/>'
            f'<text x="200" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="17" fill="#3b4047">{line1}</text>'
            f'<text x="200" y="146" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="22" fill="#2b2f34">{model}</text>')

def gpu(c):
    accent = VENDOR.get(c['brand'], RED)
    n = 2 if c['price'] < 250 else 3
    xs = [150, 250] if n == 2 else [112, 200, 288]
    r = 40 if n == 2 else 36
    return (f'<rect x="52" y="176" width="290" height="14" fill="url(#gold)"/>'
            f'<rect x="38" y="62" width="14" height="124" fill="url(#metal)"/><rect x="42" y="74" width="6" height="10" fill="#222"/><rect x="42" y="94" width="6" height="10" fill="#222"/><rect x="42" y="114" width="6" height="10" fill="#222"/>'
            f'<rect x="52" y="64" width="310" height="116" rx="8" fill="url(#dark)" stroke="#40444b"/>'
            f'<rect x="52" y="64" width="310" height="5" fill="{RED}"/><rect x="52" y="174" width="310" height="6" fill="{accent}"/>'
            + ''.join(fan(x, 122, r, accent) for x in xs) +
            f'<rect x="340" y="86" width="22" height="70" fill="#1a1c20"/><path d="M344 96h14M344 106h14M344 116h14" stroke="#3a3e45" stroke-width="2"/>')

def board(c):
    atx = c.get('formFactor') == 'ATX'
    w, h = (210, 168) if atx else (168, 168)
    x, y = 200 - w/2, 44
    ram = ''.join(f'<rect x="{x+w-58+i*13}" y="{y+16}" width="8" height="{h*0.5:.0f}" fill="#d9dde2"/>' for i in range(4))
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="#14181d" stroke="#2f353c" stroke-width="2"/>'
            f'<rect x="{x}" y="{y+10}" width="30" height="{h*0.5:.0f}" fill="#8f959c"/>'
            f'<rect x="{x+34}" y="{y+8}" width="{w-110}" height="16" rx="2" fill="url(#dark)" stroke="#40444b"/>'
            f'<rect x="{x+36}" y="{y+34}" width="46" height="46" rx="3" fill="#0b0d10" stroke="#a9afb6" stroke-width="2"/>'
            f'<rect x="{x+46}" y="{y+44}" width="26" height="26" fill="#2a2e33"/>{ram}'
            f'<rect x="{x+36}" y="{y+96}" width="{w-72}" height="10" fill="#0b0d10" stroke="#a9afb6"/>'
            f'<rect x="{x+36}" y="{y+118}" width="{w-72}" height="10" fill="#0b0d10" stroke="#a9afb6"/>'
            f'<rect x="{x+w-58}" y="{y+h*0.62:.0f}" width="40" height="30" fill="url(#dark)" stroke="{RED}" stroke-width="1.5"/>'
            f'<rect x="{x+w-100}" y="{y+h*0.62:.0f}" width="34" height="14" fill="url(#dark)" stroke="#40444b"/>'
            f'<text x="{x+w/2}" y="{y+h-10}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="#6c737b">{esc(c.get("chipset",""))}  •  {c.get("socket","")}</text>')

def ram(c):
    rgb = 'RGB' in c['name'] or 'RGB' in c['specs']
    cap = re.search(r'(\d+)GB', c['name']); cap = (cap.group(1) + 'GB') if cap else ''
    def stick(y):
        pins = ''.join(f'<rect x="{66+i*5.4:.1f}" y="{y+52}" width="3" height="7" fill="url(#gold)"/>' for i in range(58))
        return (f'<rect x="64" y="{y}" width="272" height="52" fill="#16181b"/>{pins}'
                f'<rect x="64" y="{y}" width="272" height="46" rx="3" fill="url(#dark)" stroke="#444850"/>'
                f'<rect x="64" y="{y}" width="272" height="{7 if rgb else 5}" fill="{"url(#rgb)" if rgb else RED}"/>'
                f'<text x="84" y="{y+33}" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="22" fill="#fff">{cap}</text>'
                f'<text x="316" y="{y+33}" text-anchor="end" font-family="Arial, sans-serif" font-weight="700" font-size="16" fill="{RED}">{c["ramType"]}</text>')
    return stick(62) + stick(142)

def storage(c):
    cap = re.search(r'(\d+)(TB|GB)', c['name']); cap = (cap.group(1) + cap.group(2)) if cap else ''
    fingers = ''.join(f'<rect x="{56+i*5}" y="{116+i%1}" width="3" height="52" fill="url(#gold)"/>' for i in range(8))
    return (f'<rect x="52" y="108" width="296" height="68" rx="4" fill="#1c3a2f" stroke="#2e5a49"/>{fingers}'
            f'<rect x="96" y="120" width="42" height="44" rx="2" fill="#0b0c0e"/><rect x="146" y="120" width="42" height="44" rx="2" fill="#0b0c0e"/>'
            f'<rect x="200" y="116" width="140" height="52" fill="#f1f1ee"/><rect x="200" y="116" width="6" height="52" fill="{RED}"/>'
            f'<text x="214" y="138" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="16" fill="#111">{esc(c["brand"])}</text>'
            f'<text x="214" y="158" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="19" fill="{RED}">{cap}  NVMe</text>'
            f'<circle cx="340" cy="142" r="5" fill="#111"/>')

def power(c):
    w = c['wattage']
    tier = 'GOLD' if 'Gold' in c['name'] or 'Gold' in c['specs'] else 'BRONZE'
    col = '#d4af37' if tier == 'GOLD' else '#cd7f32'
    spokes = ''.join(f'<line x1="150" y1="118" x2="{150+30*math.cos(a):.1f}" y2="{118+30*math.sin(a):.1f}" stroke="#3a3e45" stroke-width="2"/>' for a in [i*math.pi/4 for i in range(8)])
    rings = ''.join(f'<circle cx="150" cy="118" r="{r}" fill="none" stroke="#3a3e45" stroke-width="2"/>' for r in (14, 24, 34))
    return (f'<rect x="76" y="52" width="248" height="152" rx="6" fill="url(#dark)" stroke="#40444b" stroke-width="2"/>'
            f'<circle cx="150" cy="118" r="52" fill="#0b0c0e" stroke="#3a3e45" stroke-width="2"/>{rings}{spokes}'
            f'<circle cx="150" cy="118" r="9" fill="#16181b" stroke="{RED}" stroke-width="2"/>'
            f'<rect x="224" y="76" width="84" height="104" fill="#0f1114" stroke="#2f343a"/>'
            f'<text x="266" y="118" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="30" fill="#fff">{w}W</text>'
            f'<rect x="229" y="130" width="74" height="18" fill="{col}"/><text x="266" y="143" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="10" fill="#111">80+ {tier}</text>'
            f'<rect x="76" y="52" width="248" height="5" fill="{RED}"/>')

def case(c):
    forms = c.get('supportedForms', [])
    pano = 'Panor' in c['name']
    mesh = 'Airflow' in c['name']
    fans = 1 if c['price'] < 50 else 3
    ys = [78, 126, 174] if fans == 3 else [126]
    glass = f'<rect x="152" y="46" width="{150 if pano else 104}" height="180" fill="url(#glass)" stroke="#555a62"/>'
    meshp = ''.join(f'<circle cx="{162+i*9}" cy="{58+j*9}" r="1.8" fill="#3a3e45"/>' for i in range(9) for j in range(17)) if mesh else ''
    return (f'<rect x="132" y="34" width="190" height="198" rx="6" fill="url(#dark)" stroke="#40444b" stroke-width="2"/>'
            f'<rect x="132" y="34" width="190" height="5" fill="{RED}"/>{glass}{meshp}'
            + ''.join(fan(178, y, 20, RED) for y in ys) +
            f'<rect x="206" y="198" width="106" height="26" fill="#0b0c0e" stroke="#2f343a"/>'
            f'<rect x="124" y="232" width="18" height="6" fill="#222"/><rect x="312" y="232" width="18" height="6" fill="#222"/>'
            f'<text x="262" y="215" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="#6c737b">{" / ".join(forms)}</text>')

DRAW = {'cpu': cpu, 'gpu': gpu, 'motherboard': board, 'ram': ram, 'storage': storage, 'power': power, 'case': case}

def main(path):
    items = json.load(open(path))
    for c in items:
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="img" aria-label="{esc(c["name"])}">{DEFS}'
               f'{DRAW[c["category"]](c)}{label(c)}</svg>')
        (OUT / f'{c["id"]}.svg').write_text(svg, encoding='utf-8')
    print(f'{len(items)} imágenes en {OUT}')

if __name__ == '__main__':
    main(sys.argv[1])
