import GEO from './geo-data.json';
import ACT from './activity.json';
/* Interactive project plates. Real assets where available; toy models are labeled. */
const NS = 'http://www.w3.org/2000/svg';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function el(tag, attrs = {}, parent, text) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
}
const svg = (host, w, h, label) => { const s = el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label }); host.appendChild(s); return s; };
const cap = (host, text) => { const c = document.createElement('figcaption'); c.textContent = text; host.appendChild(c); };
const controls = host => { const d = document.createElement('div'); d.className = 'ctl'; host.appendChild(d); return d; };
function slider(ctl, name, min, max, val, step = 1) {
  const l = document.createElement('label'); l.textContent = name;
  const i = Object.assign(document.createElement('input'), { type: 'range', min, max, value: val, step });
  const o = document.createElement('output'); l.append(i); ctl.append(l, o); return { i, o };
}
const button = (ctl, text) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; ctl.appendChild(b); return b; };
const point = (s, e) => { const r = s.getBoundingClientRect(), v = s.viewBox.baseVal; return [(e.clientX - r.left) / r.width * v.width, (e.clientY - r.top) / r.height * v.height]; };

let tipEl;
const tipOn = (n, text) => {
  const show = e => { tipEl = tipEl || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'chart-tip' })); tipEl.textContent = text; tipEl.style.display = 'block'; const r = e.clientX == null ? n.getBoundingClientRect() : { left: e.clientX, top: e.clientY }; tipEl.style.transform = `translate(${Math.max(8, Math.min(innerWidth - 210, r.left + 12))}px,${Math.max(8, r.top - 40)}px)`; };
  const hide = () => { if (tipEl) tipEl.style.display = 'none'; };
  n.addEventListener('pointerenter', show); n.addEventListener('pointermove', show); n.addEventListener('pointerleave', hide); n.addEventListener('focus', show); n.addEventListener('blur', hide);
};

const P = {
  mri(h) {
    const g = document.createElement('div'); g.className = 'mri-grid';
    g.innerHTML = `<div class="mri-view" id="mriV"><img src="assets/img/mri.jpg" alt="Axial brain MRI with a visible meningioma" loading="lazy"><img class="cam" src="assets/img/gradcam.jpg" alt="The same MRI with a Grad-CAM attention heatmap" loading="lazy"><i></i><b>MRI</b><b>Grad-CAM</b></div>
    <div class="mri-side"><figure><img src="assets/img/mri-glioma.jpg" alt="Glioma MRI sample" loading="lazy"><span>Glioma</span></figure><figure><img src="assets/img/mri-menin.jpg" alt="Meningioma MRI sample" loading="lazy"><span>Meningioma</span></figure><figure><img src="assets/img/mri-tumor.jpg" alt="Pituitary class MRI sample" loading="lazy"><span>Tumor</span></figure></div>`;
    h.appendChild(g);
    const v = g.querySelector('.mri-view'), ctl = controls(h), { i, o } = slider(ctl, 'Reveal', 0, 100, 50);
    const set = x => { v.style.setProperty('--x', `${x}%`); i.value = x; o.textContent = `${Math.round(x)}%`; }; set(50);
    i.addEventListener('input', () => set(+i.value));
    let on = false; const mv = e => { const r = v.getBoundingClientRect(); set(Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100))); };
    v.addEventListener('pointerdown', e => { on = true; v.setPointerCapture(e.pointerId); mv(e); }); v.addEventListener('pointermove', e => { if (on) mv(e); }); v.addEventListener('pointerup', () => { on = false; });
    cap(h, 'Real images and Grad-CAM output from my notebook. Public Kaggle Brain Cancer MRI dataset.');
  },
  f1(h) {
    const s = svg(h, 640, 470, 'Autodromo Nazionale Monza circuit with a pit strategy chart');
    const pts = GEO.monza, lat0 = pts.reduce((a, p) => a + p[1], 0) / pts.length, k = Math.cos(lat0 * Math.PI / 180);
    const xs = pts.map(p => p[0] * k), ys = pts.map(p => p[1]), mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys), sc = 430 / (mxy - mny);
    const prj = p => [40 + (p[0] * k - mnx) * sc, 20 + (mxy - p[1]) * sc], xy = pts.map(prj), d = 'M' + xy.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
    el('path', { d, fill: 'none', stroke: '#000', 'stroke-width': 15, 'stroke-linejoin': 'round' }, s);
    el('path', { d, fill: 'none', stroke: '#ff2a6d', 'stroke-width': 7, 'stroke-linejoin': 'round', transform: 'translate(2 1)', opacity: .9 }, s);
    el('path', { d, fill: 'none', stroke: '#19e3ff', 'stroke-width': 7, 'stroke-linejoin': 'round', transform: 'translate(-2 -1)', opacity: .8 }, s);
    const track = el('path', { d, fill: 'none', stroke: '#dff3ff', 'stroke-width': 4, 'stroke-linejoin': 'round' }, s);
    const len = track.getTotalLength();
    el('rect', { x: xy[0][0] - 9, y: xy[0][1] - 2, width: 18, height: 4, fill: '#ffe14d' }, s);
    el('text', { x: 330, y: 34, class: 't', 'font-size': 23 }, s, 'AUTODROMO NAZIONALE MONZA');
    el('text', { x: 330, y: 58, class: 'td', 'font-size': 17 }, s, '5.793 km / real track geometry');
    const car = el('rect', { x: -8, y: -4, width: 16, height: 8, fill: '#ffe14d', stroke: '#000' }, s);
    const X = l => 330 + (l - 1) / 52 * 295, chart = el('path', { class: 'a' }, s), mark = el('line', { class: 'm', y1: 112, y2: 400 }, s);
    el('path', { d: 'M330 112V400H625', class: 's' }, s);
    el('text', { x: 330, y: 100, class: 'td', 'font-size': 17 }, s, 'race time');
    el('text', { x: 625, y: 426, 'text-anchor': 'end', class: 'td', 'font-size': 17 }, s, 'pit lap');
    const laps = 53, total = p => { let t = 22; for (let i = 0; i < p; i++) t += .0074 * i * i + .09 * i; for (let i = 0; i < laps - p; i++) t += .62 + .0014 * i * i + .045 * i; return t; };
    const L = Array.from({ length: 47 }, (_, i) => i + 4), T = L.map(total), lo = Math.min(...T), hi = Math.max(...T), Y = t => 392 - (t - lo) / (hi - lo) * 270;
    chart.setAttribute('d', L.map((l, i) => `${i ? 'L' : 'M'}${X(l).toFixed(1)} ${Y(T[i]).toFixed(1)}`).join(''));
    const best = L[T.indexOf(lo)], ctl = controls(h), { i, o } = slider(ctl, 'Pit on lap', 4, 50, 34);
    const draw = () => { const p = +i.value; mark.setAttribute('x1', X(p)); mark.setAttribute('x2', X(p)); const dv = total(p) - lo; o.textContent = dv < .005 ? 'Optimal' : `+${dv.toFixed(1)} s`; };
    i.addEventListener('input', draw); draw();
    const place = u => { const a = track.getPointAtLength(u * len), b = track.getPointAtLength(((u + .004) % 1) * len); car.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI})`); };
    place(0);
    if (!reduce) { let u = 0; setInterval(() => { if (h.dataset.visible === '1') { u = (u + .0075) % 1; place(u); } }, 83); }
    cap(h, `Real Monza layout. The tire curve is an illustrative toy model, with lap ${best} as its best stop.`);
  },
  park(h) {
    const s = svg(h, 760, 430, 'Map of real parking locations around Washington Square in New York');
    const c = [-73.9965, 40.7295], k = Math.cos(c[1] * Math.PI / 180), sc = 430 / (2 * 2.75 / 111.32), prj = p => [380 + (p[0] - c[0]) * k * sc, 215 - (p[1] - c[1]) * sc];
    const clipId = 'parkClip'; const defs = el('defs', {}, s); el('rect', { width: 760, height: 430 }, el('clipPath', { id: clipId }, defs));
    const g = el('g', { 'clip-path': `url(#${clipId})` }, s);
    el('path', { d: GEO.roads.map(r => 'M' + r.map(p => prj(p).map(v => v.toFixed(0)).join(' ')).join('L')).join(''), fill: 'none', stroke: '#3a4a98', 'stroke-width': 1.2 }, g);
    const dist = p => Math.hypot((p[0] - c[0]) * k, p[1] - c[1]) * 111.32;
    const dots = GEO.parking.map(p => { const [x, y] = prj(p); return { d: dist(p), n: el('rect', { x: x - 3.5, y: y - 3.5, width: 7, height: 7, fill: '#3a4a98' }, g) }; });
    const ring = el('circle', { cx: 380, cy: 215, class: 'a', fill: 'rgba(255,225,77,.07)' }, g);
    el('path', { d: 'M368 215H392M380 203V227', stroke: '#ff2a6d', 'stroke-width': 3 }, g);
    el('text', { x: 394, y: 208, class: 't', stroke: '#000', 'stroke-width': 3, 'paint-order': 'stroke' }, g, 'Washington Sq');
    const ctl = controls(h), { i, o } = slider(ctl, 'Search radius', .3, 2.6, 1, .1);
    const draw = () => { const r = +i.value; ring.setAttribute('r', r / 111.32 * sc); let n = 0; dots.forEach(p => { const on = p.d <= r; n += on; p.n.setAttribute('fill', on ? '#19e3ff' : '#2c3878'); }); o.textContent = `${n} spots`; };
    i.addEventListener('input', draw); draw(); cap(h, 'Real parking locations and major roads. Map data © OpenStreetMap contributors.');
  },
  auction(h) {
    const s = svg(h, 620, 300, 'Simulated estate auction');
    el('rect', { x: 14, y: 14, width: 190, height: 210, class: 's' }, s);
    el('path', { d: 'M38 96h142v18H38zM50 114v82M168 114v82M62 114h94v50H62zM62 139h94', class: 'a' }, s);
    el('text', { x: 109, y: 52, 'text-anchor': 'middle', class: 't' }, s, 'LOT 042');
    el('text', { x: 109, y: 74, 'text-anchor': 'middle', class: 'td' }, s, 'Oak writing desk');
    el('text', { x: 232, y: 44, class: 'td' }, s, 'CURRENT BID');
    const price = el('text', { x: 232, y: 112, fill: '#ffe14d', 'font-size': 72, 'font-weight': 900 }, s);
    const who = el('text', { x: 232, y: 142, class: 't' }, s);
    const fee = el('text', { x: 232, y: 176, class: 'td' }, s), pay = el('text', { x: 232, y: 200, class: 'ta' }, s);
    const barB = el('rect', { x: 14, y: 250, width: 592, height: 12, fill: '#1a2050' }, s), bar = el('rect', { x: 14, y: 250, height: 12, fill: '#ff2a6d' }, s); void barB;
    const clock = el('text', { x: 606, y: 240, 'text-anchor': 'end', class: 't' }, s);
    let bid, lead, left, timer = null;
    const paint = () => { price.textContent = `$${bid}`; who.textContent = left <= 0 ? `SOLD to ${lead}` : `Leading: ${lead}`; fee.textContent = `Flat 3% fee: $${(bid * .03).toFixed(2)}`; pay.textContent = `Seller receives: $${(bid * .97).toFixed(2)}`; bar.setAttribute('width', 592 * Math.max(0, left) / 20); clock.textContent = `${Math.max(0, left)} s`; };
    const stop = () => { clearInterval(timer); timer = null; };
    const run = () => { if (timer || reduce) return; timer = setInterval(() => { if (h.dataset.visible !== '1') return; left--; if (left > 0 && lead === 'You' && Math.random() < .42) { bid += 10; lead = `Bidder ${Math.ceil(Math.random() * 8)}`; if (left < 5) left = 5; } if (left <= 0) stop(); paint(); }, 1000); };
    const reset = () => { stop(); bid = 120; lead = 'Opening bid'; left = 20; paint(); };
    const ctl = controls(h); button(ctl, 'Bid +$10').onclick = () => { if (left <= 0) return; bid += 10; lead = 'You'; if (left < 5) left = 5; paint(); run(); }; button(ctl, 'New auction').onclick = reset;
    reset(); cap(h, 'Simulated auction showing the platform’s bidding and flat 3% fee.');
  },
  trip(h) {
    const s = svg(h, 620, 330, 'Sample three-day Paris itinerary on a map');
    const places = { Eiffel: [2.2945, 48.8584], Arc: [2.295, 48.8738], Louvre: [2.3376, 48.8606], 'Notre-Dame': [2.3499, 48.853], Orsay: [2.3266, 48.86], Montmartre: [2.3431, 48.8867], Pantheon: [2.3464, 48.8462], Marais: [2.3622, 48.8589] };
    const days = [{ r: ['Eiffel', 'Arc', 'Orsay'], b: [90, 42, 30] }, { r: ['Louvre', 'Notre-Dame', 'Pantheon'], b: [70, 55, 18] }, { r: ['Montmartre', 'Marais'], b: [48, 62, 24] }];
    const X = p => 28 + (p[0] - 2.285) / .085 * 372, Y = p => 22 + (48.892 - p[1]) / .05 * 282;
    const seine = [[2.285, 48.846], [2.296, 48.861], [2.312, 48.864], [2.332, 48.859], [2.351, 48.855], [2.368, 48.846]].map(p => `${X(p).toFixed(0)} ${Y(p).toFixed(0)}`);
    el('path', { d: `M${seine.join('L')}`, fill: 'none', stroke: '#19e3ff', 'stroke-width': 7, opacity: .45 }, s);
    el('text', { x: X([2.302, 48.8535]), y: Y([2.302, 48.8535]), class: 'td' }, s, 'Seine');
    const route = el('path', { class: 'm flow' }, s);
    const marks = Object.entries(places).map(([n, p]) => { const g = el('g', { transform: `translate(${X(p)} ${Y(p)})` }, s); const r = el('rect', { x: -5, y: -5, width: 10, height: 10, fill: '#2c3878' }, g); const t = el('text', { x: 9, y: 5, class: 'td' }, g, n); return { n, r, t }; });
    const bars = ['Tickets', 'Food', 'Transit'].map((n, i) => { const y = 66 + i * 58; el('text', { x: 440, y, class: 'td' }, s, n); el('rect', { x: 440, y: y + 7, width: 160, height: 14, fill: '#1a2050' }, s); return { b: el('rect', { x: 440, y: y + 7, height: 14, fill: ['#19e3ff', '#ff2a6d', '#3f7dff'][i] }, s), v: el('text', { x: 600, y, 'text-anchor': 'end', class: 't' }, s) }; });
    el('text', { x: 440, y: 34, class: 't' }, s, 'BUDGET'); const tot = el('text', { x: 440, y: 256, class: 'ta' }, s);
    const ctl = controls(h), btn = days.map((_, i) => button(ctl, `Day ${i + 1}`));
    const set = i => { const d = days[i]; route.setAttribute('d', 'M' + d.r.map(n => `${X(places[n]).toFixed(0)} ${Y(places[n]).toFixed(0)}`).join('L')); marks.forEach(m => { const on = d.r.includes(m.n); m.r.setAttribute('fill', on ? '#ffe14d' : '#2c3878'); m.t.setAttribute('class', on ? 't' : 'td'); }); bars.forEach((x, j) => { x.b.setAttribute('width', d.b[j] / 100 * 160); x.v.textContent = `€${d.b[j]}`; }); tot.textContent = `Day total: €${d.b.reduce((a, b) => a + b)}`; btn.forEach((b, j) => b.setAttribute('aria-pressed', j === i)); };
    btn.forEach((b, i) => { b.onclick = () => set(i); }); set(0); cap(h, 'Sample itinerary showing how trips, maps and budgets connect.');
  },
  neuro(h) {
    const s = svg(h, 620, 270, 'Layers of a convolutional network with forward and backward gradient flow');
    const L = [['CONV', 'W * x'], ['RELU', 'max(0,x)'], ['POOL', 'max'], ['FLAT', 'vec'], ['LINEAR', 'Wx+b']], flows = [];
    L.forEach(([a, b], i) => { const x = 14 + i * 122, sh = 150 - i * 18, y = 112 - sh / 2;
      for (let k = 3; k >= 0; k--) el('rect', { x: x + k * 5, y: y - k * 5, width: 72, height: sh, class: k ? 's' : (i === 0 ? 'm' : 's'), opacity: k ? .3 : 1, fill: k ? 'none' : '#10143a' }, s);
      el('text', { x: x + 36, y: 118, 'text-anchor': 'middle', class: 't' }, s, a); el('text', { x: x + 38, y: 226, 'text-anchor': 'middle', class: 'td' }, s, b);
      if (i < 4) flows.push(el('path', { d: `M${x + 88} 112H${x + 122}`, class: 'a flow' }, s)); });
    const label = el('text', { x: 14, y: 258, class: 'ta' }, s, ''), ctl = controls(h), f = button(ctl, 'Forward'), b = button(ctl, 'Backprop');
    const set = back => { f.setAttribute('aria-pressed', !back); b.setAttribute('aria-pressed', back); flows.forEach(p => p.setAttribute('class', `${back ? 'm' : 'a'} flow${back ? ' rev' : ''}`)); label.textContent = back ? 'backward: gradients derived by hand' : 'forward: activations'; };
    f.onclick = () => set(false); b.onclick = () => set(true); set(false);
  },
  match(h) {
    const s = svg(h, 620, 300, 'Two frames with draggable boxes matched using the Hungarian assignment');
    el('rect', { x: 10, y: 14, width: 285, height: 240, class: 's' }, s); el('rect', { x: 325, y: 14, width: 285, height: 240, class: 's' }, s);
    el('text', { x: 18, y: 36, class: 'td' }, s, 'Frame t'); el('text', { x: 333, y: 36, class: 'td' }, s, 'Frame t+1 (drag boxes)');
    const a = [[40, 60, 62, 60], [170, 50, 72, 50], [64, 165, 48, 66], [186, 150, 70, 76]], st = [[378, 74, 62, 60], [492, 66, 72, 50], [376, 170, 48, 66], [512, 164, 70, 76]], b = st.map(x => [...x]), cols = ['#ff2a6d', '#19e3ff', '#ffe14d', '#e8f1ff'];
    a.forEach((r, i) => el('rect', { x: r[0], y: r[1], width: r[2], height: r[3], fill: 'none', stroke: cols[i], 'stroke-width': 2.5 }, s));
    const lines = a.map((_, i) => el('line', { stroke: cols[i], 'stroke-dasharray': '4 4', 'stroke-width': 1.4 }, s)), rects = b.map(r => el('rect', { width: r[2], height: r[3], class: 'drag', fill: 'rgba(232,241,255,.1)', 'stroke-width': 2.5 }, s)), out = el('text', { x: 10, y: 284, class: 'ta' }, s);
    const iou = (p, q) => { const w = Math.max(0, Math.min(p[0] + p[2], q[0] + q[2]) - Math.max(p[0], q[0])), t = Math.max(0, Math.min(p[1] + p[3], q[1] + q[3]) - Math.max(p[1], q[1])), I = w * t; return I / (p[2] * p[3] + q[2] * q[3] - I); };
    const cost = (p, q0) => { const q = [q0[0] - 315, q0[1], q0[2], q0[3]]; return 1 - iou(p, q) + Math.hypot(p[0] + p[2] / 2 - q[0] - q[2] / 2, p[1] + p[3] / 2 - q[1] - q[3] / 2) / 300; };
    let perms = [[]]; for (let n = 0; n < 4; n++) perms = perms.flatMap(p => [0, 1, 2, 3].filter(v => !p.includes(v)).map(v => [...p, v]));
    const solve = () => { const C = a.map(p => b.map(q => cost(p, q))); let best = perms[0], bc = Infinity; perms.forEach(m => { const c = m.reduce((t, v, i) => t + C[i][v], 0); if (c < bc) { bc = c; best = m; } }); best.forEach((j, i) => { rects[j].setAttribute('stroke', cols[i]); const A = a[i], B = b[j]; lines[i].setAttribute('x1', A[0] + A[2]); lines[i].setAttribute('y1', A[1] + A[3] / 2); lines[i].setAttribute('x2', B[0]); lines[i].setAttribute('y2', B[1] + B[3] / 2); }); b.forEach((r, j) => { rects[j].setAttribute('x', r[0]); rects[j].setAttribute('y', r[1]); }); out.textContent = `Minimum assignment cost: ${bc.toFixed(3)}`; };
    rects.forEach((n, j) => { let off = null; n.addEventListener('pointerdown', e => { const [x, y] = point(s, e); off = [x - b[j][0], y - b[j][1]]; n.setPointerCapture(e.pointerId); e.preventDefault(); }); n.addEventListener('pointermove', e => { if (!off) return; const [x, y] = point(s, e); b[j][0] = Math.max(325, Math.min(610 - b[j][2], x - off[0])); b[j][1] = Math.max(14, Math.min(254 - b[j][3], y - off[1])); solve(); }); n.addEventListener('pointerup', () => { off = null; }); });
    const ctl = controls(h); button(ctl, 'Swap objects').onclick = () => { const t = b[0].slice(0, 2); b[0][0] = b[3][0]; b[0][1] = b[3][1]; b[3][0] = t[0]; b[3][1] = t[1]; solve(); }; button(ctl, 'Reset').onclick = () => { st.forEach((r, i) => { b[i] = [...r]; }); solve(); };
    solve();
  },
  drift(h) {
    const s = svg(h, 520, 300, 'Agreement with myths from step 0 to the last evaluated step for four training runs');
    const X = v => 58 + v / 300 * 280, Y = v => 262 - v * 2.3;
    [0, 25, 50, 75, 100].forEach(v => { el('line', { x1: 58, x2: 338, y1: Y(v), y2: Y(v), stroke: 'rgba(232,241,255,.15)' }, s); el('text', { x: 48, y: Y(v) + 5, 'text-anchor': 'end', class: 'td' }, s, v); });
    el('text', { x: 0, y: 18, class: 'ta' }, s, 'Agreement with myths during training (%)');
    [['Mood-only, seed 1', 250, 92, '#ff2a6d', ''], ['Mood-only, seed 0', 300, 65, '#ff2a6d', '6 4'], ['Ours, seed 1', 250, 49, '#ffe14d', '6 4'], ['Ours, seed 0', 250, 36, '#ffe14d', '']].forEach(([n, st, v, c, dash]) => { el('line', { x1: X(0), y1: Y(49), x2: X(st), y2: Y(v), stroke: c, 'stroke-width': 3.5, 'stroke-dasharray': dash }, s); el('rect', { x: X(st) - 4, y: Y(v) - 4, width: 8, height: 8, fill: c, stroke: '#000' }, s); el('text', { x: X(st) + 10, y: Y(v) + 5, fill: c, class: 'dl' }, s, `${n}: ${v}`); });
    el('rect', { x: X(0) - 4, y: Y(49) - 4, width: 8, height: 8, fill: '#e8f1ff', stroke: '#000' }, s);
    el('text', { x: 198, y: 292, 'text-anchor': 'middle', class: 'td' }, s, 'training step');
    cap(h, 'Start and last evaluated checkpoint for each run.');
  },
  bench(h) {
    const D = [['ResNet-18', 91.5, 99.2], ['AlexNet', 94.8, 97.9], ['ViT', 94.2, 97.5], ['LeNet', 73.6, 81.6]];
    const s = svg(h, 480, 268, 'Test accuracy before and after fine-tuning. ' + D.map(d => `${d[0]}: ${d[1]} to ${d[2]} percent`).join('. '));
    const X = v => 92 + (v - 70) / 30 * 330;
    el('circle', { cx: 8, cy: 14, r: 6, fill: '#19e3ff' }, s); el('text', { x: 20, y: 19, class: 'td' }, s, 'Baseline');
    el('circle', { cx: 106, cy: 14, r: 6, fill: '#ff2a6d' }, s); el('text', { x: 118, y: 19, class: 'td' }, s, 'Fine-tuned');
    [70, 80, 90, 100].forEach(v => { el('line', { x1: X(v), x2: X(v), y1: 38, y2: 232, stroke: 'rgba(232,241,255,.14)' }, s); el('text', { x: X(v), y: 256, 'text-anchor': 'middle', class: 'td' }, s, `${v}%`); });
    D.forEach((d, i) => { const y = 62 + i * 49, g = el('g', { tabindex: 0, 'aria-label': `${d[0]}: ${d[1]}% baseline, ${d[2]}% fine-tuned` }, s);
      el('rect', { x: 0, y: y - 22, width: 480, height: 44, fill: 'transparent' }, g);
      el('text', { x: 0, y: y + 5, class: 't' }, g, d[0]); el('line', { x1: X(d[1]), x2: X(d[2]), y1: y, y2: y, stroke: '#6f8fbd', 'stroke-width': 2 }, g);
      el('circle', { cx: X(d[1]), cy: y, r: 6.5, fill: '#19e3ff', stroke: '#0e1236', 'stroke-width': 2 }, g); el('circle', { cx: X(d[2]), cy: y, r: 6.5, fill: '#ff2a6d', stroke: '#0e1236', 'stroke-width': 2 }, g);
      el('text', { x: X(d[2]) + 11, y: y + 5, class: 't' }, g, d[2].toFixed(1));
      tipOn(g, `${d[0]}: ${d[1]}% to ${d[2]}%`); });
    cap(h, 'Test accuracy from my notebook.');
  },
  heat(h) {
    const start = new Date(`${ACT.start}T00:00:00Z`), off = start.getUTCDay(), n = ACT.counts.length, weeks = Math.ceil((n + off) / 7), c = 12, gap = 2, x0 = 30, y0 = 24;
    const total = ACT.counts.reduce((a, b) => a + b, 0), active = ACT.counts.filter(Boolean).length, max = Math.max(...ACT.counts), R = ['#1a2050', '#1e3f9e', '#2a6dff', '#19e3ff', '#b9f0ff'];
    const W = x0 + weeks * (c + gap) + 4, s = svg(h, W, 150, `GitHub activity in 2026: ${total} contributions on ${active} days`);
    ['Mon', 'Wed', 'Fri'].forEach((d, i) => el('text', { x: 0, y: y0 + (1 + i * 2) * (c + gap) + 10, class: 'td' }, s, d));
    let month = -1;
    ACT.counts.forEach((v, i) => { const d = new Date(start.getTime() + i * 864e5), wk = Math.floor((i + off) / 7), x = x0 + wk * (c + gap), y = y0 + d.getUTCDay() * (c + gap);
      if (d.getUTCMonth() !== month && d.getUTCDate() <= 7) { month = d.getUTCMonth(); el('text', { x, y: 14, class: 'td' }, s, d.toLocaleString('en', { month: 'short', timeZone: 'UTC' })); }
      const top = v === max, r = el('rect', { x, y, width: c, height: c, rx: 2, fill: R[ACT.levels[i]], stroke: top ? '#ff2a6d' : 'none', 'stroke-width': top ? 2 : 0 }, s);
      tipOn(r, `${d.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })}: ${v} contribution${v === 1 ? '' : 's'}`); });
    const f = document.createElement('figcaption'); f.innerHTML = `<b>${total}</b> contributions on <b>${active}</b> days in 2026. Pink marks the busiest ${ACT.counts.filter(v => v === max).length > 1 ? 'days' : 'day'}.`; h.appendChild(f); requestAnimationFrame(() => { h.scrollLeft = h.scrollWidth; });
  },
  langs(h) {
    const D = [['Python', 10], ['Notebook', 3], ['C++', 2], ['JavaScript', 2], ['Other', 3]], s = svg(h, 400, 238, 'Public repositories by primary language: ' + D.map(d => `${d[0]} ${d[1]}`).join(', '));
    D.forEach(([n, v], i) => { const y = 8 + i * 45, g = el('g', {}, s), w = v / 10 * 245; el('text', { x: 0, y: y + 20, class: 't' }, g, n); el('rect', { x: 104, y: y + 4, width: 245, height: 22, fill: '#1a2050' }, g); el('rect', { x: 104, y: y + 4, width: w, height: 22, rx: 3, fill: i ? '#3f7dff' : '#19e3ff' }, g); el('text', { x: 104 + w + 8, y: y + 21, class: 't' }, g, v); tipOn(g, `${n}: ${v} repositories`); });
    cap(h, '20 public repositories.');
  },
  stats(h) {
    const s = svg(h, 620, 270, 'Two normal distributions whose overlap changes with effect size');
    const X = x => 310 + x * 70, Y = v => 230 - v * 480, pdf = (x, m) => Math.exp(-.5 * (x - m) ** 2) / Math.sqrt(2 * Math.PI);
    el('path', { d: 'M20 230H600', class: 's' }, s);
    const p1 = el('path', { class: 'c', fill: 'rgba(57,200,255,.16)' }, s), p2 = el('path', { class: 'm', fill: 'rgba(255,79,147,.16)' }, s);
    const curve = m => { let d = `M${X(-4)} 230`; for (let x = -4; x <= 4; x += .08) d += `L${X(x).toFixed(1)} ${Y(pdf(x, m)).toFixed(1)}`; return d + `L${X(4)} 230Z`; };
    const phi = z => { const t = 1 / (1 + .2316419 * Math.abs(z)), c = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * t * (.31938153 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z > 0 ? 1 - c : c; };
    const lab = el('text', { x: 20, y: 28, class: 'ta' }, s), ctl = controls(h), { i, o } = slider(ctl, "Cohen's d", 0, 2, .3, .05);
    const draw = () => { const v = +i.value; p1.setAttribute('d', curve(-v / 2)); p2.setAttribute('d', curve(v / 2)); o.textContent = v.toFixed(2); lab.textContent = `Distribution overlap: ${(200 * phi(-v / 2)).toFixed(0)}%`; };
    i.addEventListener('input', draw); draw(); cap(h, 'Schematic explaining effect size, not the study data.');
  },
};

export function initPlates() {
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { e.target.dataset.visible = e.isIntersecting ? '1' : '0'; }), { rootMargin: '80px' }) : null;
  document.querySelectorAll('[data-plate]').forEach(h => {
    try { P[h.dataset.plate]?.(h); } catch (e) { console.error('plate', h.dataset.plate, e); }
    if (io) io.observe(h); else h.dataset.visible = '1';
  });
}
