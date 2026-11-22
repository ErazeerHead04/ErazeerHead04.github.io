import * as THREE from '../vendor/three.module.min.js';

/* Procedural printed-comic city: flat color, ink, off-register depth, halftone, motion on twos. */
THREE.ColorManagement.enabled = false;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const PATH = [[0,235,175],[8,165,90],[0,92,8],[0,65,-30],[0,65,-70],[0,64.5,-104],[4,34,-135],[0,7,-175],[-3,6,-250],[0,7,-330],[0,5,-372],[0,-16,-405],[0,-58,-450],[0,-84,-520]];
const LOOK = [[0,70,-60],[0,68,-60],[0,66,-70],[0,65,-90],[0,63,-125],[2,40,-150],[0,8,-225],[0,7,-300],[0,5,-375],[0,-4,-405],[0,-40,-460],[0,-74,-520],[0,-88,-590],[0,-92,-640]];
const C = h => new THREE.Color(h);
const INK = C('#07040f'), MAG = C('#ff2a6d'), CY = C('#19e3ff'), YEL = C('#ffe14d');
const PAL = {
  dusk: { z: C('#120746'), h: C('#3a32b0'), f: C('#181d62'), r: C('#4a4fc8') },
  night: { z: C('#0b052c'), h: C('#3326a0'), f: C('#100f48'), r: C('#4a3bb8') },
  deep: { z: C('#030b2c'), h: C('#10419a'), f: C('#08245f'), r: C('#1f8fe0') },
};
const TINTS = ['#151b50', '#18205e', '#1f1b58', '#2a1c66', '#131845', '#321f6e'].map(C);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

class Ink {
  constructor() { this.p = []; this.c = []; }
  seg(a, b, col = INK) { this.p.push(...a, ...b); for (let i = 0; i < 2; i++) this.c.push(col.r, col.g, col.b); }
  box(x0, y0, z0, x1, y1, z1, col) {
    const c = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a, b]) => this.seg(c[a], c[b], col));
  }
  mesh(fogU) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    return new THREE.LineSegments(g, new THREE.ShaderMaterial({
      uniforms: fogU,
      vertexShader: 'attribute vec3 color;varying vec3 c;varying float d;void main(){c=color;vec4 m=modelViewMatrix*vec4(position,1.);d=-m.z;gl_Position=projectionMatrix*m;gl_Position.z-=.00035*gl_Position.w;}',
      fragmentShader: 'uniform vec3 uFog;uniform float uDensity;varying vec3 c;varying float d;void main(){gl_FragColor=vec4(mix(c,uFog,1.-exp(-d*uDensity)),1.);}',
    }));
  }
}

const SOLID_V = `attribute vec3 aTint;attribute float aWin;varying vec3 vW,vN,vT;varying float vWin,vD;
void main(){vec4 w=instanceMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(instanceMatrix)*normal);vT=aTint;vWin=aWin;vec4 m=viewMatrix*w;vD=-m.z;gl_Position=projectionMatrix*m;}`;
const SOLID_F = `uniform vec3 uFog,uRim;uniform float uDensity;varying vec3 vW,vN,vT;varying float vWin,vD;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec3 n=vN;float l=n.y>.5?1.18:n.x>.5?.74:n.z>.5?1.:n.x<-.5?.56:.42;vec3 c=vT*l;
c=mix(c,uRim,smoothstep(26.,140.,vW.y)*(n.x>.5||n.z>.5?.5:.2));
if(vWin>.5&&abs(n.y)<.5){float a=abs(n.x)>.5?vW.z:vW.x;vec2 g=vec2(a/1.9,vW.y/2.8),id=floor(g),f=fract(g);
float m=step(.24,f.x)*step(f.x,.76)*step(.28,f.y)*step(f.y,.72),r=h(id+vT.xy*91.);
vec3 w=r>.96?vec3(1.,.16,.43):r>.91?vec3(.6,.34,1.):vec3(.1,.56,.95);c=mix(c,r>.86?w:c*.62,m);}
if(n.y>.5&&vWin>.5){float k=sin((vW.x+vW.z)*2.2);c*=k>.72?.72:1.;}
gl_FragColor=vec4(mix(c,uFog,1.-exp(-vD*uDensity)),1.);}`;

function buildWorld(scene, low, U) {
  const ink = new Ink(), r = rng(4077), S = [], R = [];
  const add = (x0, y0, z0, x1, y1, z1, tint, win = 1) => { S.push([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, tint, win]); };
  const step = low ? 34 : 27, reach = low ? 125 : 190;
  for (let z = 150; z > -350; z -= step) for (const side of [-1, 1]) for (let o = 27; o < reach; o += step) {
    const w = 11 + r() * 9, d = 10 + r() * 9, x = side * o + (r() - .5) * 3, zz = z + (r() - .5) * 4;
    if (Math.abs(x) < 50 && zz < -12 && zz > -124) continue;
    const near = 1 - Math.min(1, o / reach), h = 16 + r() * r() * 92 + near * 34 + (r() > .93 ? 54 : 0);
    const x0 = x - w, x1 = x + w, z0 = zz - d, z1 = zz + d, t = TINTS[Math.floor(r() * TINTS.length)];
    add(x0, 0, z0, x1, h, z1, t); R.push([x, h + 15, zz]);
    ink.box(x0, 0, z0, x1, h, z1);
    if (r() > .45) { const b = h + 3 + r() * 9; add(x - w * .5, h, zz - d * .5, x + w * .5, b, zz + d * .5, t); ink.box(x - w * .5, h, zz - d * .5, x + w * .5, b, zz + d * .5); }
    const inner = side > 0 ? x0 : x1;
    if (o < 60 && r() > .4) {
      const q = zz + (r() - .5) * d, s = side > 0 ? -1.4 : 1.4;
      for (let y = 5, f = 0; y < h - 4; y += 5, f++) {
        const a = q - 3 + (f % 2) * 6, b = q + 3 - (f % 2) * 6;
        ink.seg([inner + s, y, q - 3.3], [inner + s, y, q + 3.3]); ink.seg([inner + s, y + 1, q - 3.3], [inner + s, y + 1, q + 3.3]);
        ink.seg([inner + s, y, a], [inner + s, y + 5, b]);
      }
    }
    if (r() > .66) { const cx = x + (r() - .5) * w, cz = zz + (r() - .5) * d; add(cx - 1.6, h, cz - 1.6, cx + 1.6, h + 5, cz + 1.6, C('#1a3f7a'), 0); ink.box(cx - 1.6, h, cz - 1.6, cx + 1.6, h + 5, cz + 1.6); }
  }
  for (let z = 150; z > -360; z -= 9) ink.seg([0, .06, z], [0, .06, z - 4.5], YEL);
  for (const s of [-1, 1]) { ink.seg([s * 15, .06, 170], [s * 15, .06, -362], C('#6f8fbd')); add(s * 15, 0, -362, s * 25, .5, 170, C('#14213f'), 0); }
  for (let z = 140; z > -350; z -= 54) for (let x = -14; x <= 14; x += 2.4) ink.seg([x, .06, z], [x, .06, z - 5], C('#7fa6d8'));
  add(-310, -34, -365, 310, -.02, 195, C('#070e22'), 0);

  /* the lab: a real hollow room with openings front and back */
  const L = C('#10244f'), x0 = -26, x1 = 26, zb = -102, zf = -36, top = 118, tk = .8;
  for (const [a, b] of [[zf, zf + tk], [zb - tk, zb]]) { add(x0, 0, a, -8, top, b, L); add(8, 0, a, x1, top, b, L); add(-8, 0, a, 8, 60, b, L); add(-8, 71, a, 8, top, b, L); }
  add(x0, 0, zb, x0 + tk, top, zf, L); add(x1 - tk, 0, zb, x1, top, zf, L);
  add(x0, 59.6, zb, x1, 60, zf, C('#12305f'), 0); add(x0, 71, zb, x1, 71.4, zf, C('#081631'), 0); add(x0, top, zb, x1, top + .5, zf, C('#1b4a90'), 0);
  ink.box(x0, 0, zb, x1, top, zf); ink.box(-8, 60, zf - .1, 8, 71, zf + tk + .1, MAG); ink.box(-8, 60, zb - tk - .1, 8, 71, zb + .1, MAG);
  for (let x = x0; x <= x1; x += 4) ink.seg([x, 60.03, zb], [x, 60.03, zf], C('#1b3a70'));
  for (let z = zb; z <= zf; z += 4) ink.seg([x0, 60.03, z], [x1, 60.03, z], C('#1b3a70'));
  for (let z = zb + 11; z < zf; z += 11) for (const x of [-15, 15]) { add(x - .7, 60, z - .7, x + .7, 71, z + .7, C('#2f86ff'), 0); ink.box(x - .7, 60, z - .7, x + .7, 71, z + .7); }
  for (let z = zb + 6; z < zf - 6; z += 8) for (const s of [-1, 1]) {
    add(s * 9 - 2.6, 61.2, z - 1.7, s * 9 + 2.6, 61.5, z + 1.7, CY, 0); ink.box(s * 9 - 2.6, 61.2, z - 1.7, s * 9 + 2.6, 61.5, z + 1.7);
    add(s * 9 - 1, 61.5, z - .2, s * 9 + 1, 62.8, z, C('#7fe9ff'), 0); ink.box(s * 9 - 1, 61.5, z - .2, s * 9 + 1, 62.8, z);
  }
  for (let z = zb + 3; z < zf - 3; z += 4.4) for (const s of [-1, 1]) { add(s * 23 - 1.3, 60, z - 1.7, s * 23 + 1.3, 67, z + 1.7, z % 3 > 1.5 ? C('#1c5fb5') : C('#143a78'), 1); ink.box(s * 23 - 1.3, 60, z - 1.7, s * 23 + 1.3, 67, z + 1.7); }

  /* harbor and drowned foundations */
  const seaH = (x, z) => -96 + 7 * Math.sin(x * .027 + z * .012) + 5 * Math.cos(z * .031 - x * .012) + 2.4 * Math.sin(x * .09) * Math.cos(z * .07);
  for (let x = -60; x <= 60; x += 24) { add(x - 1, -92, -383, x + 1, 3, -381, C('#1b4d8c'), 0); ink.box(x - 1, -92, -383, x + 1, 3, -381); }
  add(-72, 3, -384, 72, 4, -365, C('#132a55'), 0); ink.box(-72, 3, -384, 72, 4, -365);
  for (let i = 0; i < (low ? 9 : 20); i++) {
    const x = (r() - .5) * 170, z = -505 - r() * 170, w = 4 + r() * 9, d = 4 + r() * 9, t = 4 + r() * 22, b = seaH(x, z) - 2;
    if (Math.abs(x) < 16 && z > -560) continue;
    add(x - w, b, z - d, x + w, b + t, z + d, i % 3 ? C('#0b3c52') : C('#17406f')); ink.box(x - w, b, z - d, x + w, b + t, z + d);
  }

  const E = [], nodes = R.filter((_, i) => i % (low ? 3 : 2) === 0);
  nodes.forEach((a, i) => {
    ink.seg([a[0], a[1] - 15, a[2]], a, C('#173a70'));
    nodes.map((b, j) => [Math.hypot(a[0] - b[0], a[2] - b[2]), j]).filter(v => v[1] > i && v[0] < 72).sort((u, v) => u[0] - v[0]).slice(0, 2).forEach(v => { ink.seg(a, nodes[v[1]], E.length % 3 === 0 ? MAG : C('#7a4dff')); E.push([a, nodes[v[1]]]); });
  });
  const nGeo = new THREE.BufferGeometry(), nPts = new Float32Array(nodes.length * 3); nodes.forEach((a, i) => nPts.set(a, i * 3)); nGeo.setAttribute('position', new THREE.BufferAttribute(nPts, 3));
  scene.add(new THREE.Points(nGeo, new THREE.PointsMaterial({ color: '#19e3ff', size: 1.5, transparent: true, opacity: .9, depthWrite: false })));
  const pulseN = Math.min(low ? 45 : 130, E.length), pulse = new Float32Array(pulseN * 3), pulseE = Array.from({ length: pulseN }, () => Math.floor(r() * E.length)), phase = Array.from({ length: pulseN }, () => r());
  const pulseGeo = new THREE.BufferGeometry(); pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulse, 3)); const pc2 = new Float32Array(pulseN * 3); for (let i = 0; i < pulseN; i++) pc2.set(i % 3 === 0 ? [1, .31, .58] : [.78, .96, 1], i * 3); pulseGeo.setAttribute('color', new THREE.BufferAttribute(pc2, 3));
  const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({ vertexColors: true, size: 2.3, transparent: true, depthWrite: false })); pulses.frustumCulled = false; scene.add(pulses);
  const net = { step(dt) { for (let i = 0; i < pulseN; i++) { phase[i] += dt * (.22 + (i % 5) * .05); if (phase[i] > 1) { phase[i] = 0; pulseE[i] = Math.floor(Math.random() * E.length); } const [a, b] = E[pulseE[i]]; for (let k = 0; k < 3; k++) pulse[i * 3 + k] = a[k] + (b[k] - a[k]) * phase[i]; } pulseGeo.attributes.position.needsUpdate = true; } };
  net.step(0);
  const geo = new THREE.BoxGeometry(1, 1, 1), n = S.length;
  const tint = new Float32Array(n * 3), win = new Float32Array(n);
  S.forEach((s, i) => { tint.set([s[6].r, s[6].g, s[6].b], i * 3); win[i] = s[7]; });
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
  geo.setAttribute('aWin', new THREE.InstancedBufferAttribute(win, 1));
  const mesh = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SOLID_V, fragmentShader: SOLID_F }), n);
  const m = new THREE.Matrix4();
  S.forEach((s, i) => { m.makeScale(s[3], Math.max(.01, s[4]), s[5]); m.setPosition(s[0], s[1], s[2]); mesh.setMatrixAt(i, m); });
  mesh.frustumCulled = false;
  scene.add(mesh, ink.mesh(U));

  const bed = new THREE.PlaneGeometry(460, 380, low ? 70 : 120, low ? 60 : 100); bed.rotateX(-Math.PI / 2); bed.translate(0, 0, -555);
  const pa = bed.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, seaH(pa.getX(i), pa.getZ(i)));
  scene.add(new THREE.Mesh(bed, new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: 'varying float y,d;void main(){y=position.y;vec4 m=modelViewMatrix*vec4(position,1.);d=-m.z;gl_Position=projectionMatrix*m;}',
    fragmentShader: 'uniform vec3 uFog;uniform float uDensity;varying float y,d;void main(){float b=floor((y+112.)/2.6);vec3 c=mix(vec3(.015,.07,.13),vec3(.05,.3,.42),clamp(b/11.,0.,1.));if(fract((y+112.)/2.6)<.1)c*=.35;gl_FragColor=vec4(mix(c,uFog,1.-exp(-d*uDensity)),1.);}' })));

  const wg = new THREE.PlaneGeometry(540, 380, low ? 60 : 110, low ? 60 : 100); wg.rotateX(-Math.PI / 2); wg.translate(0, 0, -556);
  const water = new THREE.Mesh(wg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'uniform float uT;varying vec2 p;varying float d;void main(){vec3 q=position;q.y=.75*sin(q.x*.08+uT*1.3)+.55*sin(q.z*.11-uT*.9);p=q.xz;vec4 m=modelViewMatrix*vec4(q,1.);d=-m.z;gl_Position=projectionMatrix*m;}',
    fragmentShader: 'uniform float uT;varying vec2 p;varying float d;void main(){float w=sin(p.x*.22+sin(p.y*.17+uT)*2.)+sin(p.y*.31-uT*.8);float k=step(1.25,w);vec3 c=mix(vec3(.04,.3,.52),vec3(.5,.88,1.),k);gl_FragColor=vec4(c,(.34+k*.6)*exp(-d*.006));}' }));
  scene.add(water);

  const pc = low ? 240 : 620, pts = new Float32Array(pc * 3);
  for (let i = 0; i < pc; i++) { pts[i * 3] = (r() - .5) * 240; pts[i * 3 + 1] = -92 * r(); pts[i * 3 + 2] = -380 - r() * 280; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const motes = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#d8fbff', size: 1.1, transparent: true, opacity: .75 }));
  motes.visible = false; scene.add(motes);

  const cars = [], body = new THREE.BoxGeometry(3.5, 1.6, 7.5), cab = new THREE.BoxGeometry(3, 1.1, 3.5), be = new THREE.EdgesGeometry(body), ce = new THREE.EdgesGeometry(cab), lm = new THREE.LineBasicMaterial({ color: INK });
  for (let i = 0; i < (low ? 7 : 16); i++) {
    const dir = i % 2 ? 1 : -1, col = [C('#1d3f7c'), C('#173463'), C('#2a5aa8'), C('#a01f4f')][i % 4], o = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: col });
    const a = new THREE.Mesh(body, mat), b = new THREE.Mesh(cab, new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(.5) }));
    a.position.y = 1.1; b.position.set(0, 2.45, -.2); a.add(new THREE.LineSegments(be, lm)); b.add(new THREE.LineSegments(ce, lm)); o.add(a, b);
    o.position.set(dir * (4.5 + (i % 3) * 3.4), 0, 150 - i * 39); o.userData.v = dir * (9 + (i * 7) % 15); scene.add(o); cars.push(o);
  }
  return { water, motes, cars, net };
}

const SKY_F = `uniform vec3 uZ,uH;uniform float uUnder,uT;varying vec3 vD;
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5),b=fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.5),c=fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.5),d=fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.5);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
void main(){vec3 d=normalize(vD);float y=d.y;float g=smoothstep(-.12,.62,y);g=floor(g*28.)/28.;vec3 c=mix(uH,uZ,g);
vec2 q=d.xz/(abs(y)+.32)*2.4;float f=n(q+uT*.012)*.6+n(q*2.3)*.3+n(q*5.)*.1;float cl=step(.56,f)*smoothstep(.0,.2,y)*(1.-uUnder);c=mix(c,mix(uH,vec3(.3,.5,.9),.3),cl*.2);
vec3 s=normalize(vec3(.42,.2,-.88));float a=dot(d,s);c=mix(c,uH*1.5,smoothstep(.9,.995,a)*.3*(1.-uUnder));c=mix(c,vec3(1.,.16,.43),smoothstep(.95,.999,a)*.42*(1.-uUnder));c+=vec3(.5,.07,.26)*pow(1.-abs(y),9.)*.5*(1.-uUnder);
if(uUnder>.01){float r=sin(d.x*34.+uT*.5)*sin(d.x*13.-uT*.3);c+=uH*step(.42,r)*smoothstep(-.1,.7,y)*.22*uUnder;}gl_FragColor=vec4(c,1.);}`;

const POST_F = `precision highp float;uniform sampler2D tD,tZ;uniform vec2 uRes;uniform float uTime,uShift,uNear,uFar,uFocus;uniform vec3 uTint;varying vec2 vUv;
float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float lin(vec2 u){float z=texture2D(tZ,u).x*2.-1.;return 2.*uNear*uFar/(uFar+uNear-z*(uFar-uNear));}
void main(){vec2 px=1./uRes;float z=lin(vUv);float coc=clamp(abs(z-uFocus)/(uFocus*2.6),0.,1.);coc=z>700.?.42:coc;
vec2 o=vec2(.0004+.002*coc+uShift,.00015+.0005*coc);
vec3 c=vec3(texture2D(tD,vUv+o).r,texture2D(tD,vUv-o).gb);
float zl=lin(vUv-vec2(px.x*1.3,0.)),zr=lin(vUv+vec2(px.x*1.3,0.)),zu=lin(vUv+vec2(0.,px.y*1.3)),zd=lin(vUv-vec2(0.,px.y*1.3));
float e=clamp((abs(zl+zr-2.*z)+abs(zu+zd-2.*z))/(z*.045+.08),0.,1.)*(z>700.?0.:1.);c*=1.-smoothstep(.34,.72,e)*.55;
float l=dot(c,vec3(.3,.59,.11));
float a=.5236;mat2 R=mat2(cos(a),-sin(a),sin(a),cos(a));vec2 g=R*(vUv*uRes)/mix(4.4,6.2,coc);vec2 f=fract(g)-.5;
float tone=clamp(1.-l*1.9,0.,1.);float dotM=smoothstep(.47*tone+.03,.47*tone-.05,length(f));c=mix(c,c*vec3(.45,.55,.8),dotM*.26*smoothstep(.04,.34,tone));
float hi=clamp((l-.46)*2.2,0.,1.);float dotH=smoothstep(.36*hi+.02,.36*hi-.04,length(fract(g*1.03+.25)-.5));c+=uTint*dotH*.04;
float dia=fract((gl_FragCoord.x+gl_FragCoord.y)/5.5);if(l<.1)c*=mix(1.,.82,step(.62,dia));
c=mix(c,floor(c*16.+.5)/16.,.14);
float v=smoothstep(1.08,.42,distance(vUv,vec2(.5)));c*=mix(.62,1.,v);c+=(rnd(floor(vUv*uRes/2.)+uTime)-.5)*.014;gl_FragColor=vec4(c,1.);}`;

export function createWorld(canvas, opts = {}) {
  const low = !!opts.low;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, .3, 1100);
  const U = { uFog: { value: PAL.dusk.f.clone() }, uRim: { value: PAL.dusk.r.clone() }, uDensity: { value: .002 } };
  const skyU = { uZ: { value: PAL.dusk.z.clone() }, uH: { value: PAL.dusk.h.clone() }, uUnder: { value: 0 }, uT: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: SKY_F }));
  sky.renderOrder = -10; scene.add(sky);
  const W = buildWorld(scene, low, U);

  const path = new THREE.CatmullRomCurve3(PATH.map(p => V(...p)), false, 'centripetal');
  const look = new THREE.CatmullRomCurve3(LOOK.map(p => V(...p)), false, 'centripetal');
  const rt = new THREE.WebGLRenderTarget(2, 2, { samples: 0, depthTexture: new THREE.DepthTexture(2, 2, THREE.UnsignedIntType) });
  rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter;
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const post = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, fragmentShader: POST_F,
    uniforms: { tD: { value: rt.texture }, tZ: { value: rt.depthTexture }, uRes: { value: new THREE.Vector2() }, uTime: { value: 0 }, uShift: { value: 0 }, uNear: { value: camera.near }, uFar: { value: camera.far }, uFocus: { value: 60 }, uTint: { value: CY.clone() } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}' });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

  const pos = V(0, 0, 0), tgt = V(0, 0, 0); let last = 0, clock = 0, mx = 0, my = 0;
  const resize = () => {
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, low ? 1 : 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); rt.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
    post.uniforms.uRes.value.set(w * dpr, h * dpr); camera.aspect = w / h; camera.fov = w < h ? 76 : 58; camera.updateProjectionMatrix();
  };
  resize();

  function render(t, now, vel = 0, still = false) {
    const dt = Math.min(.15, (now - last) / 1000 || 0); last = now;
    path.getPoint(t, pos); look.getPoint(t, tgt);
    if (!still) { mx += ((opts.mouse?.x || 0) - mx) * .08; my += ((opts.mouse?.y || 0) - my) * .08; const inside = smooth(.2, .28, t) * (1 - smooth(.36, .42, t)); pos.x += mx * (2.2 - inside * 1.4); pos.y += my * (1.2 - inside * .8); }
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(tgt); camera.rotateZ(Math.PI * (1 - smooth(0, .17, t)));
    sky.position.copy(pos);

    const under = smooth(1.5, -8, pos.y), n = smooth(.3, .62, t);
    skyU.uZ.value.copy(PAL.dusk.z).lerp(PAL.night.z, n).lerp(PAL.deep.z, under); skyU.uH.value.copy(PAL.dusk.h).lerp(PAL.night.h, n).lerp(PAL.deep.h, under); skyU.uUnder.value = under;
    U.uFog.value.copy(PAL.dusk.f).lerp(PAL.night.f, n).lerp(PAL.deep.f, under); U.uRim.value.copy(PAL.dusk.r).lerp(PAL.night.r, n).lerp(PAL.deep.r, under);
    U.uDensity.value = .0013 + .0009 * smooth(.08, .3, t) + .0052 * under;
    post.uniforms.uTint.value.copy(CY); post.uniforms.uFocus.value = 30 + 70 * (1 - smooth(0, .22, t));
    post.uniforms.uShift.value = still ? 0 : Math.min(.012, Math.abs(vel) * .5);
    W.motes.visible = under > .02;

    if (!still) {
      clock += dt;
      if (clock > 1 / 12) {
        const s = clock; clock = 0; post.uniforms.uTime.value = Math.floor(now / 83) % 97; skyU.uT.value = now / 1000;
        W.cars.forEach(c => { c.position.z += c.userData.v * s; if (c.position.z > 160) c.position.z = -355; if (c.position.z < -355) c.position.z = 160; });
        if (W.motes.visible) { const a = W.motes.geometry.attributes.position; for (let i = 1; i < a.array.length; i += 3) { a.array[i] += s * (.5 + (i % 7) * .16); if (a.array[i] > -1) a.array[i] = -92; } a.needsUpdate = true; }
        W.water.material.uniforms.uT.value = now / 1000; W.net.step(s);
      }
    }
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    return pos.y;
  }
  return { render, resize, elevAt: u => path.getPoint(u, V(0, 0, 0)).y };
}
