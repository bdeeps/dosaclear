// Chapter 3: the spread (1 scene unit ≈ 6.8 cm). One ladle of batter poured at the centre of the
// tawa and walked outwards in a spiral with the flat base of the ladle.
// Film thickness = volume / (π R²): 70 mL over a 13 cm radius is 1.3 mm.
// Spiral: an Archimedean spiral with 4 cm between rings (a 5 cm ladle base with some overlap),
//   so turns = R / 4 cm and path length ≈ π R² / 4 cm.
// Flow: batter is shear-thinning, viscosity = K × (shear rate)^(n − 1) with n = 0.45 and K = 2.5 Pa·sⁿ
//   at 68% water (typical values inside the range Ghosh & Chattopadhyay 2011 measured for idli
//   batter: n 0.21–0.86, K 0.38–5.06). Shear rate under the ladle ≈ ladle speed / film thickness.
// Setting: wet batter on hot iron takes heat at about 1,500 W/m²K (estimate); a 0.25 mm skin needs
//   about 35 kJ/m² to reach 68 °C and gelatinise, so it sets in a fraction of a second. If it sets
//   while the ladle's 5 cm base is still passing over it, the ladle drags it and the film tears.
import { THREE, M, beam } from '../kit.js';
import { spreadOf, filmThickness, viscosity, PITCH, LADLE_W, gasFrac, RHO_BATTER, T_LO, T_HI } from '../model.js';
import { COL, compact, MX, BW, BH, R_T, UNIT, viewFor, boardPos, layout, board, panelBg, title, axes, line, dot, makeTawa, makeThermo, fmtT, link, TAU, clamp } from '../dosa.js';

const TILT = 0.62;

export default {
  id: 'spread',
  short: 'The spread',
  title: 'One ladle, one spiral',
  subtitle: 'A ladle of batter becomes a film about a millimetre thick in three seconds. The thickness is just volume divided by area.',
  view: viewFor(TILT),
  learn: `<p>The cook pours one <b>ladle</b> of batter in the middle of the tawa, sets the flat base of the ladle on it, and walks it outwards in a <b>spiral</b>, pressing lightly. Three seconds later there is a circle of batter about a <b>millimetre</b> thick.</p>
    <p>How thick? It is plain geometry: <b>thickness = volume ÷ area</b>. A 70 mL ladle spread to a 13 cm radius covers 531 cm², so the film is 1.3 mm. Spread the same ladle to 15 cm and it is 1 mm. A paper roast is half a millimetre.</p>
    <p>Batter helps the cook by being <b>shear-thinning</b>. Left alone it is thick, so it does not run off the tawa. Under the moving ladle it is sheared hundreds of times a second and becomes <b>ten or twenty times runnier</b>, so it spreads with almost no force. Lift the ladle and it thickens again and stays where it was put. The gum from the urad dal is a big part of this. Ketchup and paint behave the same way.</p>
    <p>The spread is also a <b>race</b>. The moment batter touches hot iron, its bottom layer starts to <b>set</b>: the starch swells and grips. That is useful: the set skin holds on to the tawa while the ladle carries the still-liquid top onwards. But if the tawa is too hot or the hand too slow, the skin sets <b>under the ladle</b>, the ladle drags it, and the dosa tears into lumps. That is why the tawa is wiped cool just before pouring, and why the spiral is one quick, confident move.</p>
    <p class="tip"><b>Try it:</b> spread the same ladle wider and watch the thickness fall. Then raise the tawa temperature past 240 °C, or slow the ladle right down, and see the film tear.</p>`,
  terms: [
    { t: 'Film thickness', d: 'How thick the layer of batter is: its volume divided by the area it covers.' },
    { t: 'Shear-thinning', d: 'A fluid that gets runnier the faster it is stirred or spread. Batter, ketchup, paint and blood all do this.' },
    { t: 'Shear rate', d: 'How fast one layer of fluid slides over the next: speed divided by the gap. Under a ladle it is hundreds per second.' },
    { t: 'Viscosity', d: 'A fluid\'s resistance to flowing. Water is about 0.001 Pa·s; batter at rest is a thousand times that.' },
    { t: 'Gelatinise', d: 'What starch does when heated in water to about 60–75 °C: the granules swell, burst and set into a gel.' },
  ],
  defaults: { ml: 70, R: 13, speed: 0.4, water: 0.7, T: 195 },
  controls: [
    { key: 'ml', type: 'range', label: 'Batter in the ladle', min: 40, max: 120, step: 5, fmt: (v) => v + ' mL' },
    { key: 'R', type: 'range', label: 'Spread out to a radius of', min: 7, max: 14.5, step: 0.5, fmt: (v, s) => `${v} cm · ${filmThickness(s.ml, v).toFixed(1)} mm thick` },
    { key: 'speed', type: 'range', label: 'Ladle speed', min: 0.1, max: 0.7, step: 0.02, ends: ['slow', 'fast'], fmt: (v) => v.toFixed(2) + ' m/s' },
    { key: 'water', type: 'range', label: 'Water in the batter', min: 0.62, max: 0.78, step: 0.01, ends: ['thick', 'runny'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'T', type: 'range', label: 'Tawa surface', min: 120, max: 280, step: 5, fmt: (v) => v + ' °C', hint: 'A wipe with a wet cloth or a cut onion takes 10–30 °C off just before pouring.' },
    { key: 'go', type: 'buttons', label: 'Your move', items: [{ label: 'Pour again', act: (s, inst) => inst.restart() }] },
  ],
  quiz: [
    { q: 'You spread the same ladle of batter into a circle twice as wide. The film becomes:', options: ['Half as thick', 'A quarter as thick', 'Twice as thick', 'The same'], answer: 1, why: 'Thickness is volume divided by area, and area grows with the square of the radius. Twice the radius is four times the area.' },
    { q: 'What does "shear-thinning" mean for dosa batter?', options: ['It gets runnier while the ladle is moving through it', 'It gets thicker when stirred', 'It thins out when it ferments', 'It boils at a lower temperature'], answer: 0, why: 'Under the fast-moving ladle the batter\'s viscosity drops many times over, so it spreads easily. At rest it thickens again and stays put.' },
    { q: 'Why does batter tear into lumps on a tawa that is too hot?', options: ['The batter evaporates completely', 'The bottom sets under the ladle, so the ladle drags the set skin along', 'Hot iron repels rice', 'The ladle melts'], answer: 1, why: 'On very hot iron the skin sets faster than the ladle can pass over it. A quick wipe to cool the surface, and a fast hand, fix it.' },
  ],
  reel: [
    { ms: 5600, caption: 'One ladle, one spiral, three seconds. 70 mL spread to a 13 cm radius makes a film just 1.3 mm thick.', set: { ml: 70, R: 13, speed: 0.4, water: 0.7, T: 195 }, act: (s, inst) => inst.restart(), spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const mdl = new THREE.Group(); mdl.position.x = MX; root.add(mdl);
    const tawa = makeTawa(mdl), th = makeThermo(mdl, stage, { x: 2.6, y: 0.45, h: 2.6 }); th.band(T_LO, T_HI);
    let S = s0, tt = 0, slow = 1, key = '', pKey = '';
    // the batter film: painted on a canvas by walking the spiral
    const PX = 512, cv = document.createElement('canvas'); cv.width = cv.height = PX;
    const cg = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const film = new THREE.Mesh(new THREE.CircleGeometry(R_T, 64), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.35, depthWrite: false }));
    film.rotation.x = -Math.PI / 2; film.position.y = tawa.topY + 0.02; film.renderOrder = 2; mdl.add(film);
    const m2px = PX / 2 / 0.15;
    const pathAt = (q, R) => { // q = 0…1 along the spiral plus one closing ring
      const turns = R / PITCH, th = q * (turns + 1) * TAU, r = Math.min(R - LADLE_W / 2, (PITCH * th) / TAU);
      return [r * Math.cos(th), r * Math.sin(th), r];
    };
    function paint(p, sp) {
      const R = S.R / 100;
      cg.clearRect(0, 0, PX, PX);
      const pour = clamp(tt / 0.6, 0, 1);
      cg.fillStyle = '#f3ead0'; cg.beginPath(); cg.arc(PX / 2, PX / 2, (0.012 + 0.022 * pour) * m2px, 0, TAU); cg.fill();
      if (p > 0) {
        const N = Math.max(8, Math.round(260 * p));
        for (let pass = 0; pass < 2; pass++) {
          cg.beginPath();
          for (let i = 0; i <= N; i++) { const [x, y] = pathAt((i / N) * p, R); i ? cg.lineTo(PX / 2 + x * m2px, PX / 2 + y * m2px) : cg.moveTo(PX / 2 + x * m2px, PX / 2 + y * m2px); }
          cg.lineCap = 'round'; cg.lineJoin = 'round';
          if (pass === 0) { cg.strokeStyle = sp.h > 2.2 ? '#f6efd8' : sp.h < 0.8 ? 'rgba(243,234,208,.82)' : '#f3ead0'; cg.lineWidth = (LADLE_W + 0.012) * m2px; cg.setLineDash(sp.ok || S.T < 150 ? [] : [26, 15]); }
          else { cg.strokeStyle = 'rgba(150,120,70,.8)'; cg.lineWidth = 4; cg.setLineDash([]); }
          cg.stroke(); cg.setLineDash([]);
        }
      }
      tex.needsUpdate = true;
    }
    // the ladle: a steel cup with a long handle
    const ladle = new THREE.Group(); mdl.add(ladle);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2), M.metal(0xd3d8e0, { roughness: 0.25, side: THREE.DoubleSide })); cup.position.y = 0.4; cup.castShadow = true; ladle.add(cup);
    ladle.add(beam([0.3, 0.4, -0.15], [1.0, 2.3, -1.2], 0.045, M.metal(0xc4cad4, { roughness: 0.3 })));
    const lV = stage.label('', [0, 1.9, 0], mdl, 'hot'), lS = stage.label('', [-0.5, 1.3, 2.3], mdl), lT = stage.label('', [2.6, 3.45, 0], mdl, 'hot');
    lT.element.style.setProperty('--c', COL.hot);

    const bA = board(root, BW, BH, 632, 364, (g, w, h) => {
      const sp = spreadOf(S);
      panelBg(g, w, h); title(g, 'Thickness = volume ÷ area', `${S.ml} mL ladle`);
      const { X, Y, x0, x1 } = axes(g, w, h, { xMin: 6, xMax: 15, yMax: 6, xTicks: [6, 8, 10, 12, 14], yTicks: [0, 1, 2, 3, 4, 5, 6], xFmt: (v) => v + ' cm', yFmt: (v) => v + ' mm', xLabel: 'radius of the dosa' });
      [[0, 0.8, 'paper roast', 'rgba(232,176,74,.25)'], [0.8, 1.6, 'crisp', 'rgba(92,225,169,.2)'], [1.6, 3, 'soft', 'rgba(111,182,255,.16)'], [3, 6, 'set dosa, uttapam', 'rgba(196,155,255,.14)']].forEach(([a, b, n, c]) => { g.fillStyle = c; g.fillRect(x0, Y(b), x1 - x0, Y(a) - Y(b)); g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '18px sans-serif'; g.fillText(n, x0 + 8, Y(b) + 17); });
      const pts = []; for (let r = 6; r <= 15; r += 0.25) pts.push([r, Math.min(6, filmThickness(S.ml, r))]);
      line(g, pts, X, Y, COL.gold, 5);
      dot(g, X(S.R), Y(Math.min(6, sp.h)), COL.hot, 10);
      g.font = 'bold 22px sans-serif'; g.fillStyle = COL.text; g.fillText(`${sp.h.toFixed(2)} mm`, Math.min(X(S.R) + 14, x1 - 90), Y(Math.min(6, sp.h)) - 12);
    }, boardPos(0, TILT));
    const bB = board(root, BW, BH, 632, 364, (g, w, h) => {
      const sp = spreadOf(S);
      panelBg(g, w, h); title(g, 'Runnier when sheared', 'viscosity, Pa·s');
      const { X, Y } = axes(g, w, h, { xMin: 0.1, xMax: 3000, yMin: 0.005, yMax: 100, logX: true, logY: true, xTicks: [0.1, 1, 10, 100, 1000], yTicks: [0.01, 0.1, 1, 10, 100], xFmt: (v) => v + '/s', yFmt: (v) => v + '', xLabel: 'shear rate' });
      const pts = []; for (let e = -1; e <= 3.48; e += 0.1) pts.push([10 ** e, clamp(viscosity(10 ** e, S.water), 0.005, 100)]);
      line(g, pts, X, Y, COL.steam, 5);
      dot(g, X(1), Y(clamp(sp.rest, 0.005, 100)), COL.cold, 9); dot(g, X(clamp(sp.shear, 0.1, 3000)), Y(clamp(sp.under, 0.005, 100)), COL.hot, 10);
      g.font = '19px sans-serif'; g.fillStyle = COL.cold; g.fillText('at rest', X(1) + 14, Y(clamp(sp.rest, 0.005, 100)) - 8);
      g.fillStyle = COL.hot; g.fillText('under the ladle', X(clamp(sp.shear, 0.1, 3000)) - 150, Y(clamp(sp.under, 0.005, 100)) + 30);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '18px sans-serif'; g.fillText('water is 0.001 Pa·s', X(0.12), Y(0.008));
    }, boardPos(1, TILT));

    return {
      restart(k = 1) { tt = 0; slow = k; },
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        layout(stage, mdl, [bA, bB], { minor: [lS, ...th.lbls], tilt: TILT });
        const sp = spreadOf(s), R = s.R / 100, total = sp.time * (1 + 1 / Math.max(1, sp.turns));
        tt += dt * slow;
        const cycle = 0.8 + total + 2.6; if (tt > cycle && slow === 1) tt = 0;
        const p = clamp((tt - 0.8) / total, 0, 1);
        const pk = `${p.toFixed(3)}|${s.R}|${s.ml}|${sp.ok}|${tt < 0.8 ? tt.toFixed(2) : 1}`;
        if (pk !== pKey) { pKey = pk; paint(p, sp); }
        const [x, y] = pathAt(p, R), up = p >= 1 ? clamp((tt - 0.8 - total) / 0.5, 0, 1) : tt < 0.8 ? 1 - clamp(tt / 0.6, 0, 1) * 0.6 : 0;
        ladle.position.set(x * UNIT, tawa.topY + 0.03 + up * 1.2, y * UNIT); ladle.rotation.z = tt < 0.6 ? -0.9 * (1 - tt / 0.6) : 0;
        tawa.set({ flame: 0.3, T: s.T }); tawa.step(dt); th.set(s.T);
        lV.element.style.setProperty('--c', sp.ok ? COL.ok : COL.bad); lV.element.innerHTML = `<b>${sp.verdict}</b> · ${sp.h.toFixed(1)} mm`;
        lS.element.innerHTML = p > 0 && p < 1 ? `under the ladle: sheared ${Math.round(sp.shear)} times a second` : 'at rest the batter is thick and stays put';
        lT.element.innerHTML = `<b>${s.T} °C</b>`;
        const k = `${s.ml}|${s.R}|${s.speed}|${s.water}|${s.T}`;
        if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const sp = spreadOf(s), g = Math.round(s.ml * RHO_BATTER * (1 - gasFrac(10)) / 1000);
        return compact(stage, `<div class="big" style="color:${sp.ok ? COL.ok : COL.bad}">${sp.verdict}</div>
          <div class="row"><span>Film thickness</span><b style="color:${COL.gold}">${sp.h.toFixed(2)} mm</b></div>
          <div class="row xtra"><span>${s.ml} mL over ${Math.round(Math.PI * s.R * s.R)} cm²</span><b>about ${g} g of batter</b></div>
          <div class="row xtra"><span>Spiral: turns · path · time</span><b>${sp.turns.toFixed(1)} · ${(sp.len * 100).toFixed(0)} cm · ${sp.time.toFixed(1)} s</b></div>
          <div class="row"><span>Shear rate under the ladle</span><b>${Math.round(sp.shear)} per second</b></div>
          <div class="row"><span>Viscosity: at rest → under ladle</span><b>${sp.rest.toFixed(1)} → ${sp.under.toFixed(2)} Pa·s (÷${Math.round(sp.rest / sp.under)})</b></div>
          <div class="row"><span>Skin sets in · ladle passes in</span><b style="color:${sp.set < sp.touch ? COL.bad : COL.text}">${sp.set.toFixed(2)} s · ${sp.touch.toFixed(2)} s</b></div>
          <small>${sp.d}</small>`);
      },
    };
  },
};
