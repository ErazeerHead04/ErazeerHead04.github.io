import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate } from 'd3-geo';
import GEO from './geo-data.json';

const STOPS = [
  { key: 'ad', name: 'Abu Dhabi', when: '2023', at: [54.43, 24.52] },
  { key: 'paris', name: 'Paris', when: 'Spring 2025', at: [2.35, 48.85] },
  { key: 'ny', name: 'New York', when: 'Fall 2025', at: [-73.99, 40.73] },
  { key: 'ad', name: 'Abu Dhabi', when: '2026', at: [54.43, 24.52] },
];
const NYU = 'assets/logos/nyu-torch.png', AD = NYU, TANDON = NYU;
const CAMPUS = {
  ad: { label: 'NYU Abu Dhabi', groups: [
    { school: 'Computer Science', logo: AD, items: ['Introduction to Computer Science', 'Data Structures', 'Operating Systems', 'Machine Learning', 'Research Seminar in Computer Science', 'Capstone Project in Computer Science'] },
    { school: 'Mathematics', logo: AD, items: ['Calculus', 'Discrete Mathematics', 'Multivariable Calculus', 'Probability and Statistics', 'Statistics for Social and Behavioural Sciences'] },
  ] },
  paris: { label: 'NYU Paris', groups: [
    { school: 'NYU Paris', logo: NYU, items: ['Algorithms', 'Computer Systems Organization', 'Elementary French I'] },
  ] },
  ny: { label: 'NYU New York', groups: [
    { school: 'Courant Institute', logo: NYU, items: ['Computer Vision', 'Agile Software Development & DevOps'] },
    { school: 'Tandon School of Engineering', logo: TANDON, items: ['Linear Algebra', 'Computer Networking'] },
    { school: 'Stern School of Business', logo: NYU, items: ['Projects in Programming and AI'] },
    { school: 'Center for Data Science', logo: NYU, items: ['Introduction to Data Science'] },
  ] },
};
const TOOLS = [
  ['Languages', [['Python', 'python'], ['C', 'c'], ['C++', 'cplusplus'], ['JavaScript', 'javascript'], ['TypeScript', 'typescript'], ['Bash', 'bash']]],
  ['ML + Data', [['PyTorch', 'pytorch'], ['scikit-learn', 'scikitlearn'], ['OpenCV', 'opencv'], ['NumPy', 'numpy'], ['pandas', 'pandas'], ['Matplotlib', 'matplotlib'], ['Jupyter', 'jupyter']]],
  ['Systems', [['FastAPI', 'fastapi'], ['Docker', 'docker'], ['PostgreSQL', 'postgresql'], ['MongoDB', 'mongodb'], ['Supabase', 'supabase'], ['Git', 'git'], ['GitHub', 'github']]],
  ['Design', [['Blender', 'blender'], ['Illustrator', 'illustrator'], ['Photoshop', 'photoshop'], ['Figma', 'figma']]],
];

export function initEducation() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => s.replace(/&/g, '&amp;');
  const tabs = document.getElementById('tabs'), panel = document.getElementById('courses'), routeEl = document.getElementById('route'), leg = document.getElementById('leg');
  routeEl.innerHTML = STOPS.map(s => `<li>${s.name}<small>${s.when}</small></li>`).join('');
  document.getElementById('tools').innerHTML = TOOLS.map(([g, list]) => `<div class="tool-group"><span>${g}</span><div class="tool-row">${list.map(([n, f]) => `<span class="tool"><img src="assets/logos/${f}.svg" alt="" loading="lazy" width="24" height="24">${n}</span>`).join('')}</div></div>`).join('');
  const keys = ['ad', 'paris', 'ny'];
  tabs.innerHTML = keys.map(k => `<button role="tab" data-k="${k}" aria-selected="false" aria-controls="courses">${CAMPUS[k].label}</button>`).join('');
  const show = k => {
    panel.innerHTML = CAMPUS[k].groups.map(g => `<div><div class="school-head"><span class="logo"><img src="${g.logo}" alt="" onerror="this.parentNode.remove()"></span><strong>${esc(g.school)}</strong></div><ul class="course-list">${g.items.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`).join('');
    tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.k === k));
  };
  show('ad');

  const canvas = document.getElementById('globe'), ctx = canvas.getContext('2d'), S = 720;
  const proj = geoOrthographic().scale(S / 2 - 18).translate([S / 2, S / 2]).clipAngle(90), path = geoPath(proj, ctx), grid = geoGraticule10();
  const arcs = [0, 1, 2].map(i => geoInterpolate(STOPS[i].at, STOPS[i + 1].at));
  const lineTo = (i, f) => { const c = []; for (let k = 0; k <= 40; k++) c.push(arcs[i](f * k / 40)); return { type: 'LineString', coordinates: c }; };
  let p = 0, target = null, last = 0, hold = 1.2, visible = false, lastStop = -1;
  const position = q => { const i = Math.min(2, Math.floor(q)); return arcs[i](q - i); };

  function draw() {
    const c = position(p); proj.rotate([-c[0], -c[1] * .72, 0]);
    ctx.clearRect(0, 0, S, S);
    ctx.beginPath(); path({ type: 'Sphere' }); const g = ctx.createRadialGradient(290, 250, 40, 360, 360, 350); g.addColorStop(0, '#161f66'); g.addColorStop(.75, '#0f1448'); g.addColorStop(1, '#0a0d2e'); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(57,200,255,.13)'; for (let y = 6; y < S; y += 9) for (let x = (y % 18 ? 0 : 4.5); x < S; x += 9) { const r = Math.max(0, (Math.hypot(x - 470, y - 520) / 420 - .28)) * 2.5; if (r > .15) { ctx.beginPath(); ctx.arc(x, y, Math.min(2.6, r), 0, 6.3); ctx.fill(); } } ctx.restore();
    ctx.beginPath(); path(grid); ctx.strokeStyle = 'rgba(255,246,230,.13)'; ctx.lineWidth = 1; ctx.stroke();
    for (const [dx, dy, col] of [[1.5, 1, 'rgba(255,42,109,.6)'], [-1.5, -1, '#19e3ff']]) { ctx.save(); ctx.translate(dx, dy); ctx.beginPath(); path(GEO.land); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
    ctx.beginPath(); path(GEO.land); ctx.fillStyle = '#3a3fb0'; ctx.fill(); ctx.strokeStyle = '#19e3ff'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.strokeStyle = 'rgba(57,200,255,.65)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const f = Math.max(0, Math.min(1, p - i)); if (f <= 0) continue; ctx.beginPath(); path(lineTo(i, f)); ctx.strokeStyle = '#07040f'; ctx.lineWidth = 8; ctx.stroke(); ctx.beginPath(); path(lineTo(i, f)); ctx.strokeStyle = '#ff2a6d'; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.font = "900 34px Shoulders, Impact, sans-serif"; ctx.textBaseline = 'middle';
    const seen = new Set();
    STOPS.forEach(s => { if (seen.has(s.name)) return; seen.add(s.name); path.pointRadius(1); const pt = proj(s.at), r = proj.rotate(); const a = Math.acos(Math.max(-1, Math.min(1, Math.sin(s.at[1] * Math.PI / 180) * Math.sin(-r[1] * Math.PI / 180) + Math.cos(s.at[1] * Math.PI / 180) * Math.cos(-r[1] * Math.PI / 180) * Math.cos((s.at[0] + r[0]) * Math.PI / 180)))); if (a > Math.PI / 2 || !pt) return;
      ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.fillRect(pt[0] - 8, pt[1] - 8, 16, 16); ctx.strokeRect(pt[0] - 8, pt[1] - 8, 16, 16);
      const w = ctx.measureText(s.name).width; const left = pt[0] > S * .62; const tx = left ? pt[0] - w - 26 : pt[0] + 18; ctx.fillStyle = '#ffe14d'; ctx.fillRect(tx, pt[1] - 21, w + 12, 40); ctx.strokeRect(tx, pt[1] - 21, w + 12, 40); ctx.fillStyle = '#000'; ctx.fillText(s.name, tx + 6, pt[1] - 1); });
    const here = proj(c); if (here) { ctx.fillStyle = '#19e3ff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(here[0], here[1], 10, 0, 6.3); ctx.fill(); ctx.stroke(); }
    const stop = Math.floor(p + .001), near = Math.abs(p - Math.round(p)) < .03 ? Math.round(p) : -1;
    routeEl.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', i <= stop));
    if (near !== lastStop) { lastStop = near; if (near >= 0) { leg.textContent = `${STOPS[near].name}, ${STOPS[near].when}`; show(STOPS[near].key); } else if (Math.floor(p) < 3) leg.textContent = `${STOPS[Math.floor(p)].name} to ${STOPS[Math.floor(p) + 1].name}`; }
  }
  draw(); if (document.fonts?.ready) document.fonts.ready.then(draw);

  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k; show(k); const idx = STOPS.findIndex(s => s.key === k); target = idx; hold = 3; if (reduce) { p = idx; target = null; draw(); show(k); } });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: .15 }).observe(canvas); else visible = true;
  if (reduce) return;
  const tick = now => {
    requestAnimationFrame(tick);
    if (!visible || document.hidden || now - last < 41) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (target != null) { const d = target - p; if (Math.abs(d) < .012) { p = target; target = null; hold = 4; } else p += Math.sign(d) * Math.min(Math.abs(d), dt * 1.05); draw(); return; }
    if (hold > 0) { hold -= dt; return; }
    const next = Math.floor(p + 1.0001);
    if (next > 3) { p = 0; hold = 1.4; draw(); return; }
    p = Math.min(next, p + dt * .42); if (p >= next - .0001) { p = next; hold = next === 3 ? 3 : 1.6; } draw();
  };
  requestAnimationFrame(tick);
}
