// Shared 3D parts and chart helpers for DosaClear: a tawa on one burner of an Indian gas stove, a
// thermometer, the dosa's surface drawn on a canvas (spiral ridges, lace of holes, browning), chart
// boards, glowing dots, steam puffs and a sizzle. The numbers live in model.js.
// Scenes are built in "scene units": the 30 cm tawa is 4.4 units across, so 1 unit ≈ 6.8 cm.
import { THREE, M, box, beam, sphere, arrow, clamp, lerp } from './kit.js';
import { audio } from './ui.js';
import { B_PALE, B_GOLD, B_DARK, B_BURNT } from './model.js';

export const TAU = Math.PI * 2;
export const UNIT = 2.2 / 0.15;     // scene units per metre
export const R_T = 2.2;             // tawa radius in scene units
export const R_D = 0.13 * UNIT;     // a 26 cm dosa
export const COL = { hot: '#ff7a59', cold: '#6fb6ff', heat: '#ffb547', water: '#6fb6ff', steam: '#8ef0ff', gold: '#e8b04a', batter: '#f3ead0', ok: '#5ce1a9', latent: '#c49bff', text: '#e8eef8', bad: '#ff5d5d', iron: '#8a93a3' };
export const hex = (c) => new THREE.Color(c).getHex();
export const link = (slug, name, hash = '') => `<a href="https://glassbox.how/${slug}/${hash ? '#' + hash : ''}">${name}</a>`;
export function fmtW(W) { const a = Math.abs(W); return a >= 1000 ? (W / 1000).toFixed(2) + ' kW' : Math.round(a < 0.5 ? 0 : W) + ' W'; }
export const fmtT = (t) => (!isFinite(t) ? 'stays crisp' : t >= 60 ? `${Math.floor(t / 60)} min ${String(Math.floor(t % 60)).padStart(2, '0')} s` : `${t < 10 ? t.toFixed(1) : Math.round(t)} s`);
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- colours of a dosa
const cA = new THREE.Color(), cB = new THREE.Color();
function ramp(stops, k, out) {
  for (let i = 1; i < stops.length; i++) if (k <= stops[i][0] || i === stops.length - 1) {
    const [a, b] = [stops[i - 1], stops[i]];
    return out.copy(cA.set(a[1])).lerp(cB.set(b[1]), clamp((k - a[0]) / (b[0] - a[0]), 0, 1));
  }
  return out;
}
// B is the browning clock of model.js: 0 raw batter, about 1 golden, 1.7 dark, 2.5 burnt.
export const dosaColor = (B, out = new THREE.Color()) => ramp([[0, 0xf3ead0], [B_PALE, 0xebd08a], [B_GOLD, 0xd39630], [1.3, 0xb87220], [B_DARK, 0x7a4418], [B_BURNT, 0x2a1a0e], [3.2, 0x140d08]], B, out);
export const css = (c) => '#' + c.getHexString();

// Draw a dosa seen from above on a square canvas: a disc with the ladle's spiral ridges (thin
// rings brown first), a lace of holes, and an optional fold. opts: { B, holes 0–0.5, seed, wet 0–1,
// rim (fraction of the radius the batter has reached), base (css colour override) }.
export function drawDosa(g, w, h, { B = 0, holes = 0.2, seed = 5, wet = 0, rim = 1, base = null, ridges = true } = {}) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, R = (w / 2 - 4) * rim, rnd = rng(seed), c = new THREE.Color();
  g.save(); g.beginPath();
  for (let i = 0; i <= 90; i++) { const a = (i / 90) * TAU, r = R * (1 + 0.018 * Math.sin(a * 5 + seed) + 0.012 * Math.sin(a * 11)); i ? g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : g.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
  g.closePath(); g.clip();
  g.fillStyle = base || css(dosaColor(B, c)); g.fillRect(0, 0, w, h);
  if (ridges) { // thin rings between the ladle's passes brown a shade more
    g.lineWidth = w * 0.022;
    for (let k = 0; k < 2; k++) {
      g.strokeStyle = k ? `rgba(255,250,230,${0.12 + 0.2 * wet})` : css(dosaColor(B * 1.35 + 0.05, c)); g.globalAlpha = k ? 1 : 0.55; g.beginPath();
      const turns = 3.4, off = k ? 0.5 : 0;
      for (let i = 0; i <= 400; i++) { const t = i / 400, a = t * turns * TAU, r = R * (t + off / turns); if (r > R) break; i ? g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : g.moveTo(cx, cy); }
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  // mottling
  for (let i = 0; i < 260; i++) { const a = rnd() * TAU, r = R * Math.sqrt(rnd()), s = w * (0.01 + 0.03 * rnd()); g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.05)' : css(dosaColor(B * (1.1 + 0.5 * rnd()), c)); g.globalAlpha = 0.25; g.beginPath(); g.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), s, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // the lace: holes where gas bubbles burst and steam left
  const n = Math.round((holes > 0.3 ? 420 : 900) * holes);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = R * Math.sqrt(rnd()), s = w * (0.004 + 0.011 * rnd() * (0.6 + holes)) * (holes > 0.3 ? 2 : 1); g.beginPath(); g.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), s, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  g.restore();
}
// A dosa as a flat disc you can lay on the tawa or a plate. redraw(opts) repaints it.
export function makeDosa(parent, R = R_D, px = 384) {
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, roughness: 0.75, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2; mesh.receiveShadow = true; parent.add(mesh);
  let key = '';
  return { mesh, tex, canvas: c, redraw(o) { const k = JSON.stringify(o); if (k === key) return; key = k; drawDosa(g, px, px, o); tex.needsUpdate = true; } };
}

// ---------------------------------------------------------------- boards (live charts in 3D)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function axes(g, w, h, { x0 = 82, x1 = w - 26, y0 = h - 50, y1 = 66, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', logX = false, logY = false }) {
  const fx = logX ? Math.log : (v) => v, fy = logY ? Math.log : (v) => v;
  const X = (x) => x0 + ((fx(x) - fx(xMin)) / (fx(xMax) - fx(xMin))) * (x1 - x0);
  const Y = (y) => y0 - ((fy(y) - fy(yMin)) / (fy(yMax) - fy(yMin))) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '21px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 27); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 9 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '20px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 - 8);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 8);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 28px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function legend(g, items, x = 24, y = 52, font = 20) {
  g.font = `bold ${font}px sans-serif`;
  for (const [n, c] of items) { g.fillStyle = c; g.fillRect(x, y, 15, 15); g.fillStyle = COL.text; g.fillText(n, x + 21, y + 14); x += 34 + g.measureText(n).width; }
}
export function dashH(g, X0, X1, y, text = '', col = 'rgba(255,255,255,.5)') {
  g.strokeStyle = col; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X0, y); g.lineTo(X1, y); g.stroke(); g.setLineDash([]);
  if (text) { g.font = '19px sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(text, X1 - g.measureText(text).width - 4, y - 7); }
}
export function bars(g, rows, { x = 20, y = 64, w = 600, rowH = 52, labelW = 230, unit = (v) => v, max = null, font = 21 } = {}) {
  const mx = max ?? Math.max(1e-9, ...rows.map((r) => Math.abs(r.value))) * 1.15, span = w - labelW - 20;
  rows.forEach((r, i) => {
    const yy = y + i * rowH, L = clamp(Math.abs(r.value) / mx, 0, 1) * span;
    g.font = `bold ${font}px sans-serif`; g.fillStyle = r.lcol || r.color; g.fillText(r.label, x, yy + 24);
    g.globalAlpha = 0.9; g.fillStyle = r.color; g.fillRect(x + labelW, yy + 6, Math.max(2, L), rowH - 18); g.globalAlpha = 1;
    g.font = `${font - 1}px sans-serif`; g.fillStyle = '#fff'; const t = r.text ?? unit(r.value), tw = g.measureText(t).width;
    const inside = x + labelW + L + 8 + tw > w; if (inside) g.fillStyle = r.dark ? '#111' : '#fff';
    g.fillText(t, inside ? x + labelW + L - tw - 8 : x + labelW + L + 8, yy + 25);
  });
}
export function wrap(g, text, x, y, maxW, lh) {
  let ln = '';
  for (const wd of text.split(' ')) { if (g.measureText(ln + wd).width > maxW && ln) { g.fillText(ln.trim(), x, y); y += lh; ln = ''; } ln += wd + ' '; }
  if (ln.trim()) { g.fillText(ln.trim(), x, y); y += lh; }
  return y;
}

// ---------------------------------------------------------------- 3D pieces
// Dots, one instanced mesh, each with its own colour. lit = true gives shaded balls.
export function dots(n, r, color = 0xffffff, seg = 8, lit = false) {
  const mat = lit ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }) : new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { mesh.setColorAt(i, col); o.position.set(0, -99, 0); o.scale.setScalar(0.0001); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); }
  mesh.place = (i, x, y, z, s = 1, sy = s) => { o.position.set(x, y, z); o.scale.set(Math.max(0.0001, s), Math.max(0.0001, sy), Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
// Little puffs that drift from a source: step(dt, rate, at, vel, life).
export function puffs(parent, n, r, color, rnd) {
  const d = dots(n, r, color); d.material.transparent = true; d.material.opacity = 0.55; d.material.depthWrite = false; parent.add(d);
  const P = Array.from({ length: n }, () => ({ life: 0, max: 1, p: [0, -99, 0], v: [0, 0, 0] }));
  let acc = 0;
  return {
    mesh: d,
    step(dt, rate, at, vel, life = 1.2) {
      acc += rate * dt;
      for (let i = 0; i < n; i++) {
        const q = P[i];
        if (q.life <= 0 && acc >= 1) { acc -= 1; q.life = q.max = life * (0.75 + 0.5 * rnd()); q.p = at(); q.v = vel(q.p); }
        if (q.life > 0) { q.life -= dt; q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; }
        const k = q.life / q.max;
        d.place(i, q.p[0], q.p[1], q.p[2], q.life > 0 ? 0.35 + 0.65 * Math.sin(Math.PI * clamp(k, 0, 1)) : 0.0001);
      }
      if (acc > 20) acc = 20;
      d.done();
    },
    clear() { P.forEach((q) => { q.life = 0; }); acc = 0; },
  };
}
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function flowArrow(color, r = 0.05, head = 0.28) {
  const a = arrow(color, 1, head, r);
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.05) a.visible = false;
  };
  return a;
}

// ---------------------------------------------------------------- layout
// The readout covers the upper left of the stage, so the model stays low on the left (centred on
// x = MX) and two chart boards stack on the right. Chapters that look down on the tawa pass a tilt
// (radians): the camera rises by that angle and the boards lean back to face it.
export const MX = -0.8, BW = 4.6, BH = 2.65;
const upOf = (th) => [0, Math.cos(th), -Math.sin(th)];
export function viewFor(th = 0, cx = 2.2, u = 2.7, dist = 11.6) {
  if (th) u -= 0.8;
  const up = upOf(th), t = [cx, 1.5 + u * up[1], u * up[2]];
  return { pos: [cx, t[1] + (dist * Math.sin(th) + 0.8 * Math.cos(th)), t[2] + dist * Math.cos(th) - 0.8 * Math.sin(th)], target: t };
}
export const boardPos = (i, th = 0) => { const u = i ? 1.4 : 4.4, up = upOf(th); return [6.1, 1.5 + u * up[1], u * up[2]]; };
export const VIEW = viewFor(0);
// On a phone the readout is as wide as the stage, so it drops its footnote and any row marked xtra.
export const compact = (stage, html) => (stage.host.clientWidth < 560 ? html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row xtra">[\s\S]*?<\/div>/g, '') : html);
export const inReel = () => document.body.classList.contains('gb-reel');
const views = new Map();
const cached = (k, f) => { if (!views.has(k)) views.set(k, f()); return views.get(k); };
// Call every frame. Normal page: boards on the right. Phone width: hide minor labels, show only
// the first board (in the lower slot) and nudge the picture down, clear of the readout. Wide or square recording: a centred camera. Tall (9:16)
// recording: the model fills the middle of the frame and the first board sits above it.
export function layout(stage, mdl, boards, { minor = [], tilt = 0, scale = 1.2, tallScale = 1.3 } = {}) {
  const narrow = stage.host.clientWidth < 560, r = inReel(), wide = r && stage.camera.aspect > 0.9, tall = r && !wide, up = upOf(tilt);
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !r ? -0.15 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  mdl.scale.setScalar(tall ? tallScale : scale);
  boards.forEach((b, i) => {
    if (tall) { const u = tilt ? 6.2 : 7.3; b.mesh.visible = i === 0; b.mesh.position.set(-0.6, 1.5 + u * up[1], u * up[2]); b.mesh.scale.setScalar(1.9); }
    else if (narrow) { b.mesh.visible = i === 0; b.mesh.position.set(...boardPos(1, tilt)); b.mesh.scale.setScalar(1); }
    else { b.mesh.visible = true; b.mesh.position.set(...boardPos(i, tilt)); b.mesh.scale.setScalar(1); }
    b.mesh.rotation.x = -tilt;
  });
  if (r) {
    const v = tall ? cached('t' + tilt, () => viewFor(tilt, -0.6, tilt ? 2.55 : 1.75, 8.6)) : cached('w' + tilt, () => viewFor(tilt, 1.9, tilt ? 2.4 : 1.6, 12.4));
    stage.controls.autoRotate = false;
    if (stage.home?.pos !== v.pos) stage.setView(v.pos, v.target, 0.01);
  }
  return narrow;
}

// ---------------------------------------------------------------- the tawa on the stove
// A flat 30 cm tawa on one burner. set({ flame 0–1, T, kind }) and step(dt) animate the flame, the
// heat arrows and a faint glow of the iron when it is very hot. topY is the cooking surface.
export function makeTawa(parent, { seed = 7 } = {}) {
  const g = new THREE.Group(); parent.add(g);
  const by = 0.98, th = 0.14, topY = by + th, flames = [], arrows = [];
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x4f9dff, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false });
  const body = box(5.0, 0.2, 4.2, M.metal(0x7d8591, { roughness: 0.45 })); body.position.y = 0.1; g.add(body);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.3, 32), M.metal(0xc9a45a, { roughness: 0.4 })); cup.position.y = 0.35; g.add(cup);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 32), M.matte(0x22252b)); cap.position.y = 0.54; g.add(cap);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.785, c = Math.cos(a), s = Math.sin(a);
    g.add(beam([c * 2.3, 0.2, s * 2.0], [c * 1.8, by - 0.03, s * 1.8], 0.05, M.matte(0x1c1f25)));
    g.add(beam([c * 1.8, by - 0.03, s * 1.8], [c * 0.95, by - 0.03, s * 0.95], 0.05, M.matte(0x1c1f25)));
  }
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * TAU, f = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.42, 8), flameMat);
    f.geometry.translate(0, 0.21, 0); f.position.set(Math.cos(a) * 0.66, 0.5, Math.sin(a) * 0.66); f.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75);
    g.add(f); flames.push(f);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.3, ar = flowArrow(hex(COL.heat), 0.035, 0.18); ar.traverse((o) => { if (o.material) o.material.depthTest = true; });
    ar.userData.at = [Math.cos(a) * 1.25, by - 0.5, Math.sin(a) * 1.25]; g.add(ar); arrows.push(ar);
  }
  // the tawa: a thick disc with a low lip and a handle
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1d1f24, roughness: 0.62, metalness: 0.55 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R_T, R_T - 0.05, th, 72), ironMat); disc.position.y = by + th / 2; disc.castShadow = disc.receiveShadow = true; g.add(disc);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R_T - 0.03, 0.055, 10, 72), ironMat); lip.rotation.x = Math.PI / 2; lip.position.y = topY; g.add(lip);
  const hA = -2.55; // the handle points back and to the left, out of the way of the charts
  const handle = beam([Math.cos(hA) * R_T, topY, Math.sin(hA) * R_T], [Math.cos(hA) * (R_T + 1.0), topY + 0.2, Math.sin(hA) * (R_T + 1.0)], 0.09, M.matte(0x2a2420)); g.add(handle);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.2, 40), new THREE.MeshBasicMaterial({ color: 0xff7a3a, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.position.y = by - 0.02; g.add(glow);
  const st = { flame: 0, T: 30, kind: 'iron' };
  let tt = 0;
  const api = {
    g, topY, st, disc, ironMat,
    set(o) { Object.assign(st, o); return api; },
    step(dt) {
      tt += dt;
      flames.forEach((f, i) => { f.visible = st.flame > 0.02; f.scale.set(1, (0.3 + 1.3 * st.flame) * (0.85 + 0.3 * Math.sin(tt * 23 + i * 1.7)), 1); });
      arrows.forEach((a, i) => { const L = st.flame * (0.5 + 0.1 * Math.sin(tt * 5 + i)); a.aim(a.userData.at, [0, 1, 0], L); a.visible = st.flame > 0.03; });
      glow.material.opacity = 0.45 * st.flame;
      // seasoned iron is black; a thin non-stick tawa is a dark grey with a sheen
      ironMat.color.set(st.kind === 'thin' ? 0x3a3d44 : st.kind === 'bare' ? 0x6b6f78 : 0x1d1f24);
      ironMat.roughness = st.kind === 'thin' ? 0.35 : st.kind === 'bare' ? 0.45 : 0.62;
      ironMat.emissive.setRGB(clamp((st.T - 330) / 400, 0, 0.35), 0, 0);
    },
  };
  return api;
}
// A thermometer standing beside the model: a glass tube whose red column follows T between lo and hi.
export function makeThermo(parent, stage, { x = 0, y = 0.4, h = 3, lo = 0, hi = 350, ticks = [0, 100, 200, 300] } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, 0); parent.add(g);
  const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, h, 20), M.clear(0xdff2ff, 0.22)); tubeM.position.y = h / 2; g.add(tubeM);
  const bulb = sphere(0.19, M.glow(0xff5a3c)); bulb.castShadow = false; g.add(bulb);
  const geo = new THREE.CylinderGeometry(0.055, 0.055, 1, 12); geo.translate(0, 0.5, 0);
  const colm = new THREE.Mesh(geo, M.glow(0xff5a3c)); g.add(colm);
  const yOf = (T) => (clamp((T - lo) / (hi - lo), 0, 1)) * h;
  const lbls = ticks.map((t) => { const m = box(0.3, 0.025, 0.025, M.glow(0xb9c4d6)); m.castShadow = false; m.position.set(0.2, yOf(t), 0); g.add(m); return stage.label(`${t}°`, [0.5, yOf(t), 0], g); });
  const band = box(0.1, 0.01, 0.3, M.glow(0x5ce1a9)); band.castShadow = false; g.add(band);
  return {
    g, yOf, lbls,
    band(a, b) { band.scale.y = Math.max(1, (yOf(b) - yOf(a)) / 0.01); band.position.set(-0.2, (yOf(a) + yOf(b)) / 2, 0); band.visible = b > a; },
    set(T) { colm.scale.y = Math.max(0.01, yOf(T)); },
  };
}

// ---------------------------------------------------------------- sound
// Filtered noise for the sizzle of water on hot iron. The browser only lets a page make sound after
// you touch it, so it starts on the first tap or key.
export function sizzle() {
  let ac = null, src = null, bp = null, gain = null;
  const start = () => {
    if (ac || inReel()) return;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.04 ? 1 : 0.25);
    src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    bp = ac.createBiquadFilter(); bp.type = 'bandpass';
    gain = ac.createGain(); gain.gain.value = 0;
    src.connect(bp).connect(gain).connect(ac.destination); src.start();
  };
  window.addEventListener('pointerdown', start); window.addEventListener('keydown', start);
  return {
    set(level, freq = 2400, q = 0.6) {
      if (!ac) return;
      const t = ac.currentTime;
      gain.gain.setTargetAtTime(audio.muted ? 0 : clamp(level, 0, 0.4), t, 0.12);
      bp.frequency.setTargetAtTime(freq, t, 0.12); bp.Q.setTargetAtTime(q, t, 0.12);
    },
    dispose() {
      window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start);
      try { src?.stop(); ac?.close(); } catch { /* already closed */ }
    },
  };
}
export { clamp, lerp };
