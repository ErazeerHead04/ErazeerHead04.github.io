import { initPlates } from './plates.js';
import { initEducation } from './education.js';

const $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const low = coarse || innerWidth < 800 || (navigator.hardwareConcurrency || 8) <= 4;
const mouse = { x: 0, y: 0 };

initPlates();
try { initEducation(); } catch (e) { console.error('education', e); }

const nav = $('#nav'), menu = $('#menu');
const closeMenu = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', open); });
$$('a', nav).forEach(a => a.addEventListener('click', closeMenu));
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

const reveal = $$('.panel,.job,.build,.edu-top,.course-panel,#tools');
let hidden = reduce ? [] : reveal;
hidden.forEach(n => n.classList.add('rv'));
const showVisible = () => { if (!hidden.length) return; const lim = innerHeight * 1.04; hidden = hidden.filter(n => { if (n.getBoundingClientRect().top < lim) { n.classList.add('in'); return false; } return true; }); };
addEventListener('scroll', showVisible, { passive: true }); addEventListener('resize', showVisible); showVisible();

const stops = $$('[data-t]');
let map = [], maxY = 1;
function measure() {
  maxY = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  map = stops.map(s => ({ y: Math.min(maxY, s.getBoundingClientRect().top + scrollY), t: +s.dataset.t, id: s.id }));
  map[0].y = 0; map[map.length - 1].y = maxY;
}
function worldT(y) {
  for (let i = 0; i < map.length - 1; i++) { const a = map[i], b = map[i + 1]; if (y <= b.y) return a.t + (b.t - a.t) * Math.max(0, (y - a.y) / Math.max(1, b.y - a.y)); }
  return 1;
}
measure(); addEventListener('load', measure); document.fonts?.ready.then(measure);
if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

const speed = $$('[data-speed]').map(n => ({ n, s: +n.dataset.speed }));
const links = $$('a', nav), rail = $('#rRail'), hud = $('.hud');
let active = '';
function chrome(y) {
  let cur = map[0]; for (const m of map) if (y + innerHeight * .42 >= m.y) cur = m;
  if (cur.id !== active) { active = cur.id; links.forEach(a => { const on = a.getAttribute('href') === `#${cur.id}`; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); }); }
  rail.style.transform = `scaleX(${y / maxY})`;
  hud.classList.toggle('solid', y > innerHeight * .6);
  if (!reduce) speed.forEach(({ n, s }) => { if (innerWidth < 800) { n.style.transform = n.closest('h1') ? 'none' : ''; if (n.closest('h1')) return; } const r = n.parentElement.getBoundingClientRect(); if (r.bottom > -100 && r.top < innerHeight + 100) n.style.transform = `translate3d(${((r.top + r.height / 2 - innerHeight / 2) * s).toFixed(1)}px,0,0)`; });
}
addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = -(e.clientY / innerHeight * 2 - 1); }, { passive: true });

const loader = $('#loader'), pct = $('#loadPct');
const finishLoad = () => { pct.textContent = '100'; setTimeout(() => { loader?.classList.add('done'); setTimeout(() => loader?.remove(), 650); }, reduce ? 0 : 160); };

async function start() {
  let world = null; pct.textContent = '32';
  try {
    if (!document.createElement('canvas').getContext('webgl2')) throw new Error('WebGL2 unavailable');
    const { createWorld } = await import('./scene.js');
    pct.textContent = '68'; await new Promise(r => setTimeout(r, 20));
    world = createWorld($('#world'), { low, mouse });
  } catch (e) { document.documentElement.classList.add('no-gl'); console.warn('Using 2D fallback:', e.message); }
  addEventListener('resize', () => { world?.resize(); measure(); });

  let t = worldT(scrollY), lastY = scrollY, vel = 0, lastFrame = 0, key = '';
  const frame = now => {
    requestAnimationFrame(frame);
    if (document.hidden || now - lastFrame < 40) return;       /* 24 fps: the animated-on-twos look */
    lastFrame = now; const y = scrollY;
    vel += ((y - lastY) / Math.max(1, innerHeight) - vel) * .35; lastY = y;
    chrome(y);
    if (!world) return;
    if (reduce) { let cur = map[0]; for (const m of map) if (y + innerHeight * .42 >= m.y) cur = m; if (cur.id !== key) { key = cur.id; world.render(cur.t, now, 0, true); } return; }
    t += (worldT(y) - t) * .22; world.render(t, now, vel);
  };
  requestAnimationFrame(frame); finishLoad();
}
start();
