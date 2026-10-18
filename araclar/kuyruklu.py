#!/usr/bin/env python3
"""MPC'nin kuyruklu yıldız listesinden önümüzdeki 90 günde parlaklaşacak olanları seçer.

Kullanım: python3 araclar/kuyruklu.py CometEls.txt docs/kuyruklu.json
Yörüngeler J2000 ekliptik; konum iki cisim (Kepler) çözümüyle hesaplanır.
"""
import json, math, sys, datetime

K = 0.01720209895          # Gauss gravitational constant, rad/day
EPS = math.radians(23.4392911)


def jd(dt):
    return dt.timestamp() / 86400.0 + 2440587.5


def kepler_xyz(q, e, i, node, peri, tp, t):
    """Heliocentric ecliptic J2000 position (AU) at Julian date t."""
    dt = t - tp
    if abs(e - 1.0) < 1e-5:                       # parabola (Barker)
        w = 3 * K / math.sqrt(2 * q ** 3) * dt
        y = math.cbrt(w / 2 + math.sqrt(w * w / 4 + 1))
        s = y - 1 / y
        nu, r = 2 * math.atan(s), q * (1 + s * s)
    elif e < 1.0:                                 # ellipse
        a = q / (1 - e); m = K / a ** 1.5 * dt
        m = math.fmod(m, 2 * math.pi)
        E = m if e < 0.8 else math.pi * (1 if m >= 0 else -1)
        for _ in range(60):
            dE = (E - e * math.sin(E) - m) / (1 - e * math.cos(E)); E -= dE
            if abs(dE) < 1e-12: break
        nu = 2 * math.atan2(math.sqrt(1 + e) * math.sin(E / 2), math.sqrt(1 - e) * math.cos(E / 2))
        r = a * (1 - e * math.cos(E))
    else:                                         # hyperbola
        a = q / (e - 1); m = K / a ** 1.5 * dt
        H = math.asinh(m / e)
        for _ in range(60):
            dH = (e * math.sinh(H) - H - m) / (e * math.cosh(H) - 1); H -= dH
            if abs(dH) < 1e-12: break
        nu = 2 * math.atan(math.sqrt((e + 1) / (e - 1)) * math.tanh(H / 2))
        r = a * (e * math.cosh(H) - 1)
    u = peri + nu
    x = r * (math.cos(node) * math.cos(u) - math.sin(node) * math.sin(u) * math.cos(i))
    y = r * (math.sin(node) * math.cos(u) + math.cos(node) * math.sin(u) * math.cos(i))
    z = r * math.sin(u) * math.sin(i)
    return x, y, z, r


def earth_xyz(t):
    d = t - 2451545.0
    L = math.radians((100.46457 + 0.98560028 * d) % 360)
    w = math.radians(102.93768)
    m = L - w; e = 0.01671123
    E = m
    for _ in range(10): E -= (E - e * math.sin(E) - m) / (1 - e * math.cos(E))
    nu = 2 * math.atan2(math.sqrt(1 + e) * math.sin(E / 2), math.sqrt(1 - e) * math.cos(E / 2))
    r = 1.00000261 * (1 - e * math.cos(E))
    return r * math.cos(nu + w), r * math.sin(nu + w), 0.0


def parse(line):
    try:
        y, mo, d = int(line[14:18]), int(line[19:21]), float(line[22:29])
        tp = jd(datetime.datetime(y, mo, 1, tzinfo=datetime.timezone.utc)) + d - 1
        return dict(name=line[102:158].strip(), tp=tp, q=float(line[30:39]), e=float(line[41:49]),
                    peri=float(line[51:59]), node=float(line[61:69]), i=float(line[71:79]),
                    H=float(line[91:95]), K=float(line[96:100]))
    except ValueError:
        return None


def main(src, dst, limit=12.5):
    now = jd(datetime.datetime.now(datetime.timezone.utc))
    out = []
    for line in open(src, encoding='latin-1'):
        c = parse(line)
        if not c: continue
        best = None
        for day in range(0, 91, 3):
            t = now + day
            x, y, z, r = kepler_xyz(c['q'], c['e'], math.radians(c['i']), math.radians(c['node']), math.radians(c['peri']), c['tp'], t)
            ex, ey, ez = earth_xyz(t)
            delta = math.dist((x, y, z), (ex, ey, ez))
            if r <= 0 or delta <= 0: continue
            mag = c['H'] + 5 * math.log10(delta) + 2.5 * c['K'] * math.log10(r)
            if best is None or mag < best[0]: best = (mag, day, r, delta)
        if best and best[0] <= limit:
            c['peak'] = [round(best[0], 1), best[1]]
            out.append(c)
    out.sort(key=lambda c: c['peak'][0])
    json.dump({'updated': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='minutes'), 'comets': out[:25]},
              open(dst, 'w'), ensure_ascii=False, indent=0)
    print(len(out), 'comets brighter than', limit)
    for c in out[:10]: print(' ', c['name'], 'peak mag', c['peak'][0], 'in', c['peak'][1], 'days')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
