// Chapter 2: the tawa (1 scene unit ≈ 6.8 cm). A 30 cm tawa on one burner of an Indian LPG stove,
// heating from room temperature, with water drops flicked onto it.
// Heat balance (stepTawa in model.js): m c dT/dt = flame × 0.55 − losses from the hot face
//   (convection about 10 W/m²K plus radiation ε σ (T⁴ − T_room⁴) over 0.0707 m²).
//   Cast iron: 3 kg × 460 J/kg·K = 1,380 J/K. Thin aluminium: 0.7 kg × 900 = 630 J/K.
// Water-drop test: drop lifetime against plate temperature after Jearl Walker, "Boiling and the
//   Leidenfrost Effect" (in Halliday & Resnick, Fundamentals of Physics): seconds below the
//   Leidenfrost point, about a minute just above it (about 200 °C on his plate; Wikipedia quotes
//   about 193 °C for water in a pan). First reported by Boerhaave in 1732, studied by Leidenfrost
//   in 1756. Vapour cushion under 0.1 mm at the rim to about 0.2 mm in the middle (Walker).
// Sprinkling 5 g of water takes 5 g × (4.186 × 70 + 2,257) J/g ≈ 12.7 kJ: about 9 °C off a cast-iron
//   tawa, about 20 °C off a thin one.
// Working window 180–200 °C: kitchen and griddle-maker figures run from about 180 to 220 °C; we stop
//   at the Leidenfrost point so the window matches the water-drop test. Not a measured standard.
import { THREE } from '../kit.js';
import { TAWAS, stepTawa, tawaSteady, tawaCap, waterCooling, dropLife, dropRegime, LEIDENFROST, T_LO, T_HI, AMB } from '../model.js';
import { COL, compact, VIEW, MX, BW, BH, R_T, boardPos, layout, board, panelBg, title, axes, line, dot, dashH, dots, puffs, rng, makeTawa, makeThermo, sizzle, fmtW, fmtT, link, TAU, clamp } from '../dosa.js';

export default {
  id: 'tawa',
  short: 'The tawa',
  title: 'The tawa and the water-drop test',
  subtitle: 'A heavy slab of hot iron. Flick water on it: below about 200 °C the drops sizzle and vanish, above it they dance.',
  view: VIEW,
  learn: `<p>A dosa <b>tawa</b> (dosa kallu) is a flat, heavy griddle, classically <b>cast iron</b>. A 30 cm one weighs about 3 kg, and that weight is the point. Iron that heavy stores about <b>1.4 kilojoules for every degree</b>, so when cold wet batter lands on it, the surface does not go cold.</p>
    <p>Cooks do not use a thermometer. They flick a few drops of <b>water</b> on the tawa and read the answer:</p>
    <p><b>Too cool</b> (under 100 °C): the drop just sits. <b>Ready</b> (roughly 180 to 200 °C): the drop hisses, spreads and is gone in a second or two. <b>Too hot</b>: the drops pull into shiny beads and <b>skate around</b> for many seconds.</p>
    <p>That last one is the <b>Leidenfrost effect</b>. Above about 200 °C the underside of a drop boils so fast that the drop ends up <b>floating on a cushion of its own steam</b>, about a tenth of a millimetre thick. Steam is a poor conductor, so the floating drop is insulated from the iron and lasts up to a minute, far longer than on a cooler tawa. It is the same physics as in ${link('boilclear', 'BoilClear')}, pushed to the extreme.</p>
    <p>A dancing drop means batter would also ride on steam, set in lumps and tear. So the cook <b>cools the surface</b>: a sprinkle of water, a wipe with a wet cloth, or a rub with <b>half an onion</b> dipped in oil. Each takes heat out as steam (2,257 joules per gram) and the onion leaves a thin, even film of oil with no puddles, so the batter can grip just enough to spread.</p>
    <p><b>Safety:</b> a tawa at 200 °C looks exactly like a cold one. Use the handle with a cloth, and keep your face back when you sprinkle water.</p>
    <p class="tip"><b>Try it:</b> let the tawa heat and watch the drops change from sizzling to dancing as the marker crosses the peak on the chart. Then press "Sprinkle water" and see how far the temperature falls. Switch to the thin tawa and do it again.</p>`,
  terms: [
    { t: 'Tawa', d: 'A flat or slightly dished griddle. For dosa it is flat and heavy: cast iron at home, a thick steel plate in hotels.' },
    { t: 'Leidenfrost effect', d: 'On a surface far hotter than its boiling point, a liquid drop floats on a layer of its own vapour and evaporates slowly.' },
    { t: 'Leidenfrost point', d: 'The surface temperature at which drops last longest. For water on smooth metal it is about 200 °C; roughness and dirt shift it.' },
    { t: 'Heat capacity', d: 'How much heat a thing stores per degree. A 3 kg iron tawa stores about 1,380 joules per °C.' },
    { t: 'Latent heat', d: 'The heat a liquid takes to turn into vapour without getting hotter: 2,257 joules for each gram of water.' },
  ],
  defaults: { flame: 1.6, kind: 'iron', fast: 10, auto: true },
  controls: [
    { key: 'flame', type: 'range', label: 'Flame', min: 0, max: 2.5, step: 0.05, ends: ['off', '2.5 kW'], fmt: (v, s) => (v ? `${v.toFixed(2)} kW · settles near ${Math.round(tawaSteady(v * 1000, TAWAS[s.kind]))} °C` : 'off'), hint: 'An empty tawa left on a high flame goes far past 300 °C. To hold about 200 °C it needs only about 0.5 kW.' },
    { key: 'kind', type: 'seg', label: 'Tawa', options: [{ v: 'iron', label: 'Cast iron, 3 kg' }, { v: 'thin', label: 'Thin non-stick, 0.7 kg' }] },
    { key: 'auto', type: 'toggle', label: 'Keep flicking test drops' },
    { key: 'fast', type: 'seg', label: 'Time', options: [{ v: 1, label: 'Real time' }, { v: 10, label: '×10' }, { v: 30, label: '×30' }] },
    { key: 'go', type: 'buttons', label: 'Your move', items: [
      { label: 'Sprinkle water (5 g)', act: (s, inst) => inst.cool(0.005, 14) },
      { label: 'Wipe with a cut onion', act: (s, inst) => inst.cool(0.003, 0, true) },
      { label: 'Start cold', act: (s, inst) => inst.reset(s) },
    ] },
  ],
  onChange(s, key) { if (key === 'kind') s._reset = true; },
  quiz: [
    { q: 'Water drops skate around the tawa in shiny beads. What does that tell you?', options: ['The tawa is too cold', 'The tawa is above about 200 °C: too hot to spread batter', 'The tawa is perfectly ready', 'The water is dirty'], answer: 1, why: 'Dancing beads are drops floating on their own steam: the Leidenfrost effect. Batter would also lift and clump, so the surface must be cooled first.' },
    { q: 'Why does a drop last longer on a hotter tawa once it starts to dance?', options: ['Hot water is heavier', 'A cushion of steam keeps it from touching the iron, and steam conducts heat poorly', 'The drop freezes', 'The iron stops giving heat'], answer: 1, why: 'The steam layer is about 0.1 mm thick and insulates the drop. On a cooler tawa the drop touches the metal and boils away in a second or two.' },
    { q: 'Why is a heavy cast-iron tawa better than a thin one for dosa?', options: ['It heats up faster', 'It stores more heat, so cold batter cools its surface much less', 'It is lighter to lift', 'Iron is hotter than aluminium at the same temperature'], answer: 1, why: 'A 3 kg iron tawa stores about 1,380 J per degree, more than twice a thin aluminium one. The same batter or the same sprinkle of water cools it less than half as much.' },
  ],
  reel: [
    { ms: 5200, caption: 'A dosa tawa is a heavy slab of iron. Flick water on it: under about 200 °C the drops hiss and vanish in a second.', set: { flame: 0.9, kind: 'iron', fast: 4, auto: true }, act: (s, inst) => inst.preRun(s, 150), spin: 0 },
    { ms: 5400, caption: 'Hotter still, the drops float on their own steam and dance for a minute. That is the Leidenfrost effect, and it means: too hot.', set: { flame: 1.2, kind: 'iron', fast: 4, auto: true }, act: (s, inst) => inst.preRun(s, 232), spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const mdl = new THREE.Group(); mdl.position.x = MX; root.add(mdl);
    const rnd = rng(17), tawa = makeTawa(mdl), th = makeThermo(mdl, stage, { x: 2.6, y: 0.45, h: 3.0 }); th.band(T_LO, T_HI);
    const snd = sizzle();
    let S = s0, st = { T: AMB, t: 0 }, rows = [], key = '', oiled = 0, hiss = 0, cooled = null;
    // water drops on the tawa
    const ND = 22, drops = dots(ND, 0.1, 0x9fd2ff, 10, true); drops.material.roughness = 0.1; drops.material.metalness = 0.2; mdl.add(drops);
    const D = Array.from({ length: ND }, () => ({ life: 0, max: 1, x: 0, z: 0, vx: 0, vz: 0, k: 0, s: 1 }));
    const steam = puffs(mdl, 60, 0.08, 0xdfe8f5, rnd);
    const film = new THREE.Mesh(new THREE.CircleGeometry(R_T - 0.15, 48), new THREE.MeshStandardMaterial({ color: 0xffe9a8, transparent: true, opacity: 0, roughness: 0.1, metalness: 0.3, depthWrite: false }));
    film.rotation.x = -Math.PI / 2; film.position.y = tawa.topY + 0.012; mdl.add(film);
    function spawn(n) {
      for (const d of D) {
        if (n <= 0) break; if (d.life > 0) continue;
        const a = rnd() * TAU, r = (R_T - 0.5) * Math.sqrt(rnd()), reg = dropRegime(st.T).k;
        d.x = r * Math.cos(a); d.z = r * Math.sin(a); d.k = reg; d.s = 0.8 + 0.6 * rnd();
        d.max = d.life = dropLife(st.T) * (0.6 + 0.6 * rnd()); const v = reg === 3 ? 1.6 + rnd() : 0; const b = rnd() * TAU; d.vx = v * Math.cos(b); d.vz = v * Math.sin(b); n--;
      }
    }
    const reset = (s) => { if (s) S = s; st = { T: AMB, t: 0 }; rows = []; oiled = 0; cooled = null; D.forEach((d) => { d.life = 0; }); steam.clear(); };
    const tw = () => TAWAS[S.kind] || TAWAS.iron;
    const log = () => { if (!rows.length || st.t - rows[rows.length - 1][0] >= 2) { rows.push([st.t, st.T]); if (rows.length > 800) rows.splice(0, 2); } };
    const preRun = (s, T) => { S = s; reset(s); const P = 2000; while (st.T < T && st.t < 3000) { stepTawa(st, P, 0.5, tw()); log(); } D.forEach((d) => { d.life = 0; }); spawn(8); };
    function cool(kg, n, oil = false) {
      const dT = waterCooling(kg) / tawaCap(tw()); cooled = { dT, kg, t: st.t, oil }; st.T = Math.max(AMB, st.T - dT);
      if (n) spawn(n); if (oil) oiled = 1; hiss = 1;
    }
    reset();

    const bA = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'How long a water drop lasts', 'after J. Walker');
      const { X, Y, y0, y1 } = axes(g, w, h, { xMin: 100, xMax: 350, yMin: 0.5, yMax: 120, logY: true, xTicks: [100, 150, 200, 250, 300, 350], yTicks: [1, 10, 60], xFmt: (v) => v + '°', yFmt: (v) => v + ' s' });
      g.fillStyle = 'rgba(92,225,169,.16)'; g.fillRect(X(T_LO), y1, X(T_HI) - X(T_LO), y0 - y1);
      g.font = '18px sans-serif'; g.fillStyle = COL.ok; g.fillText('spread here', X(T_LO) + 4, y0 - 8);
      g.strokeStyle = 'rgba(196,155,255,.8)'; g.setLineDash([7, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(LEIDENFROST), y1); g.lineTo(X(LEIDENFROST), y0); g.stroke(); g.setLineDash([]);
      g.fillStyle = COL.latent; g.fillText('Leidenfrost point', X(LEIDENFROST) + 62, y1 + 16);
      const pts = []; for (let T = 100; T <= 350; T += 2) pts.push([T, dropLife(T)]);
      line(g, pts, X, Y, COL.steam, 5);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('sizzles away', X(118), Y(4.5)); g.fillText('floats and dances', X(262), Y(30));
      if (st.T >= 100) dot(g, X(clamp(st.T, 100, 350)), Y(clamp(dropLife(st.T), 0.5, 120)), COL.hot, 10);
    }, boardPos(0));
    const bB = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Tawa temperature', S.fast > 1 ? `time-lapse ×${S.fast}` : 'real time');
      const t1 = Math.max(300, st.t * 1.08), step = t1 > 1800 ? 600 : t1 > 700 ? 300 : 60, xt = []; for (let v = 0; v <= t1; v += step) xt.push(v);
      const peak = Math.max(350, ...rows.map((r) => r[1])), yMax = Math.ceil(peak / 50) * 50, yt = []; for (let v = 0; v <= yMax; v += 100) yt.push(v);
      const { X, Y } = axes(g, w, h, { xMax: t1, yMax, xTicks: xt, yTicks: yt, xFmt: (v) => (v / 60).toFixed(0) + ' min', yFmt: (v) => v + '°' });
      g.fillStyle = 'rgba(92,225,169,.2)'; g.fillRect(X(0), Y(T_HI), X(t1) - X(0), Y(T_LO) - Y(T_HI));
      g.font = '19px sans-serif'; g.fillStyle = COL.ok; g.fillText('ready to spread: 180–200 °C', X(0) + 8, Y(T_HI) - 6);
      dashH(g, X(0), X(t1), Y(100), 'water boils', 'rgba(111,182,255,.8)');
      line(g, rows, X, Y, COL.hot, 5);
    }, boardPos(1));
    const lZone = stage.label('', [0, 2.35, 0], mdl, 'hot'), lT = stage.label('', [2.6, 3.85, 0], mdl, 'hot'), lCush = stage.label('', [-0.7, 1.7, 2.1], mdl);
    lT.element.style.setProperty('--c', COL.hot);

    return {
      reset, preRun, cool,
      dispose() { snd.dispose(); },
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        layout(stage, mdl, [bA, bB], { minor: [lCush, ...th.lbls] });
        if (s._reset) { s._reset = false; reset(s); }
        const n = Math.max(1, Math.round(s.fast)), sim = dt * n;
        for (let i = 0; i < n; i++) stepTawa(st, s.flame * 1000, dt, tw());
        log();
        const reg = dropRegime(st.T);
        // test drops
        const alive = D.filter((d) => d.life > 0).length;
        if (s.auto && alive < 5 && st.T > 60) spawn(1);
        let boil = 0;
        D.forEach((d, i) => {
          if (d.life <= 0) { drops.place(i, 0, -9, 0, 0.0001); return; }
          d.life -= sim; const k = clamp(d.life / d.max, 0, 1);
          if (d.k === 3) { // floating bead: skate, bounce off the lip
            d.x += d.vx * dt; d.z += d.vz * dt; const r = Math.hypot(d.x, d.z), lim = R_T - 0.3;
            if (r > lim) { const nx = d.x / r, nz = d.z / r, vn = d.vx * nx + d.vz * nz; d.vx -= 2 * vn * nx; d.vz -= 2 * vn * nz; d.x = nx * lim; d.z = nz * lim; }
            d.vx += (rnd() - 0.5) * 3 * dt; d.vz += (rnd() - 0.5) * 3 * dt;
            const sc = d.s * (0.45 + 0.75 * Math.cbrt(k)); drops.place(i, d.x, tawa.topY + 0.1 * sc + 0.03, d.z, sc, sc * 0.9);
          } else { // wets the iron: a flat patch that boils away
            const sc = d.s * (1.2 + 0.8 * (1 - k)) * Math.sqrt(k + 0.05); drops.place(i, d.x, tawa.topY + 0.02, d.z, sc, sc * 0.22);
            if (d.k >= 1) boil += 1;
          }
        });
        drops.done();
        hiss = Math.max(0, hiss - dt * 1.5);
        steam.step(dt, boil * 9 + hiss * 60, () => { const d = D[Math.floor(rnd() * ND)], a = rnd() * TAU; return hiss > 0.2 || d.life <= 0 ? [Math.cos(a) * rnd() * 1.8, tawa.topY + 0.1, Math.sin(a) * rnd() * 1.8] : [d.x, tawa.topY + 0.1, d.z]; }, () => [(rnd() - 0.5) * 0.3, 0.8 + rnd() * 0.6, (rnd() - 0.5) * 0.3], 1.4);
        snd.set(0.05 * Math.min(4, boil) + 0.3 * hiss, 3200, 0.5);
        oiled = Math.max(0, oiled - sim / 240); film.material.opacity = 0.22 * oiled;
        tawa.set({ flame: clamp(s.flame / 2.5, 0, 1), T: st.T, kind: s.kind }); tawa.step(dt);
        th.set(st.T);
        const col = st.T < T_LO ? COL.cold : st.T <= T_HI ? COL.ok : COL.hot;
        lZone.element.style.setProperty('--c', col); lZone.element.innerHTML = `<b>${st.T < 100 ? 'Too cool' : st.T < T_LO ? 'Nearly there' : st.T <= T_HI ? 'Ready: spread now' : 'Too hot: cool it first'}</b>`;
        lT.element.innerHTML = `<b>${st.T.toFixed(0)} °C</b>`;
        lCush.element.innerHTML = reg.k === 3 ? 'beads float on a steam cushion about 0.1 mm thick' : reg.k >= 1 ? 'drops wet the iron and boil away' : 'drops just sit';
        const k = `${rows.length}|${Math.round(st.T)}|${s.fast}`;
        if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const reg = dropRegime(st.T), w = tw(), col = st.T < T_LO ? COL.cold : st.T <= T_HI ? COL.ok : COL.hot;
        return compact(stage, `<div class="big" style="color:${col}">${reg.n}</div>
          <div class="row"><span>Tawa surface</span><b style="color:${COL.hot}">${st.T.toFixed(0)} °C</b></div>
          <div class="row"><span>A water drop lasts about</span><b style="color:${COL.steam}">${fmtT(dropLife(st.T))}</b></div>
          <div class="row"><span>Heat in · heat lost</span><b>${fmtW(st.inW || 0)} · ${fmtW(st.lossW || 0)}</b></div>
          <div class="row"><span>Heat stored above room</span><b>${((tawaCap(w) * (st.T - AMB)) / 1000).toFixed(0)} kJ</b></div>
          <div class="row xtra"><span>${w.short} stores</span><b>${(tawaCap(w) / 1000).toFixed(2)} kJ per °C</b></div>
          <div class="row xtra"><span>Time on the flame · LPG</span><b>${fmtT(st.t)} · ${((st.gas || 0) * 1000).toFixed(1)} g</b></div>
          ${cooled && st.t - cooled.t < 60 ? `<div class="row"><span>${cooled.oil ? 'Onion wipe' : 'Sprinkle'} took</span><b style="color:${COL.cold}">${(waterCooling(cooled.kg) / 1000).toFixed(1)} kJ, −${cooled.dT.toFixed(0)} °C</b></div>` : ''}
          <small>${reg.d}</small>`);
      },
    };
  },
};
