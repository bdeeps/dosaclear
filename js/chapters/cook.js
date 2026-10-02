// Chapter 4: the cook (1 scene unit ≈ 6.8 cm). A 26 cm dosa on a 3 kg cast-iron tawa.
// The model (stepDosa in model.js) is a drying front climbing from the iron:
//   heat flux q = (T_tawa − T_wet) / (1/h_contact + crust / k_crust),
//   h_contact ≈ 500 W/m²K with oil, 250 dry (estimate); k_crust ≈ 0.2 W/m·K (estimate; Venkateshmurthy
//   & Raghavarao 2015 measured 0.42 W/m·K for whole dosa and found conduction from the plate dominant).
//   While water is left the wet zone is pinned at 100 °C and q boils it off at 2,257 kJ/kg.
//   The bottom skin sits at T_tawa − q / h_contact: near 100 °C at first, climbing as the crust
//   thickens and the flux falls. That is why browning starts late.
// Browning: Maillard clock doubling per 10 °C (typical), faster with ferment time and with sugar,
//   chana dal or methi in the batter. Wikipedia's Maillard page gives 140–165 °C as the range
//   where the reaction runs fast.
// The tawa itself: 1,380 J/K, flame × 0.55 in, convection and radiation out, and the dosa's load.
//   A 1.5 mm dosa takes about 100 kJ in all, so the iron sags 30–40 °C even on a high flame.
// Sticking: a rule of thumb (gripOf in model.js), not a measurement.
import { THREE } from '../kit.js';
import { freshDosa, stepDosa, stageOf, verdictOf, stuckOf, moistureOf, crustMm, STAGES, A_DOSA, SHRINK, B_GOLD, B_DARK, T_LO, T_HI } from '../model.js';
import { COL, compact, VIEW, MX, BW, BH, R_D, boardPos, layout, board, panelBg, title, axes, line, legend, dashH, puffs, rng, makeTawa, makeThermo, makeDosa, dosaColor, css, sizzle, fmtT, fmtW, link, TAU, clamp } from '../dosa.js';

const tmpC = new THREE.Color();
const KEYS = ['T0', 'h', 'water', 'ferment', 'oil', 'extra'];

export default {
  id: 'cook',
  short: 'The cook',
  title: 'Steam out, crust up, colour in',
  subtitle: 'Water boils out through the lace, a dry crust climbs from the iron, and only then can the base pass 100 °C and brown.',
  view: VIEW,
  learn: `<p>The batter is about 70% water, and a crisp dosa has almost none in its base. So cooking a dosa is mostly <b>boiling water out of a thin film</b>, fast.</p>
    <p><b>First seconds.</b> The film heats to 100 °C. Its starch <b>gelatinises</b>: the granules swell and set, and the liquid becomes a soft sheet. Gas bubbles from the ferment burst and leave <b>holes</b>.</p>
    <p><b>Steaming.</b> Water boils at the hot face and the steam escapes through those holes. While any part is wet, that part <b>cannot go above 100 °C</b>, however hot the tawa is: the heat goes into making steam, 2,257 joules per gram (see ${link('boilclear', 'BoilClear')}). This is the loud hiss.</p>
    <p><b>Crust.</b> A <b>dry crust</b> grows upwards from the iron. Dry starch is glassy and brittle: that is the crisp. With the water gone from the base, nothing pins it at 100 °C any more, so it climbs past <b>140 °C</b> and the <b>Maillard reaction</b> starts: sugars and amino acids join to make brown colour and the roasted dosa smell. A fermented batter has more free sugars and amino acids, so it browns better. That is also why cooks add a pinch of sugar, a spoon of chana dal or methi seeds for colour.</p>
    <p><b>Oil</b> (or ghee) fills the gaps between crust and iron, so heat crosses faster and more evenly, and the dosa lets go of the tawa.</p>
    <p>Watch the <b>tawa temperature</b> too. One dosa pulls about 100 kJ out of the iron, mostly as steam, so the surface sags by tens of degrees. Cooks spread on a cooled tawa, then <b>raise the flame</b> to roast. How heat travels through metal is in ${link('heatclear', 'HeatClear')}; the flame itself is in ${link('combustionclear', 'CombustionClear')}.</p>
    <p class="tip"><b>Try it:</b> let the default dosa turn golden and press "Lift it off". Then pour at 250 °C (burnt outside before it dries), at 150 °C (pale and leathery), and with no ferment and no oil.</p>`,
  terms: [
    { t: 'Gelatinisation', d: 'Starch granules swelling and setting when heated wet, at about 60–75 °C. It turns liquid batter into a sheet.' },
    { t: 'Maillard reaction', d: 'Sugars reacting with amino acids to make brown pigments and roasted aromas. It runs fast from about 140 °C.' },
    { t: 'Glassy state', d: 'Dry starch that is hard and brittle like glass. Add water and it turns leathery: crisp becomes soft.' },
    { t: 'Drying front', d: 'The moving boundary between dry crust below and wet batter above.' },
    { t: 'Heat flux', d: 'Heat flowing through each square metre per second. Under a fresh dosa it is tens of kilowatts per square metre.' },
  ],
  defaults: { T0: 200, h: 1.5, water: 0.7, ferment: 10, oil: 2, extra: false, flame: 1.6, fast: 4 },
  controls: [
    { key: 'T0', type: 'range', label: 'Tawa when you pour', min: 130, max: 280, step: 5, fmt: (v) => v + ' °C' },
    { key: 'h', type: 'range', label: 'Batter film thickness', min: 0.5, max: 4, step: 0.1, ends: ['paper', 'uttapam'], fmt: (v) => v.toFixed(1) + ' mm' },
    { key: 'water', type: 'range', label: 'Water in the batter', min: 0.62, max: 0.78, step: 0.01, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'ferment', type: 'range', label: 'Fermented for', min: 0, max: 18, step: 1, fmt: (v) => v + ' h' },
    { key: 'oil', type: 'range', label: 'Oil or ghee', min: 0, max: 4, step: 0.5, fmt: (v) => (v ? v + ' g' : 'none'), hint: 'Half a teaspoon is about 2 g.' },
    { key: 'extra', type: 'toggle', label: 'A pinch of sugar, chana dal or methi in the batter' },
    { key: 'flame', type: 'range', label: 'Flame while it cooks', min: 0.4, max: 2.5, step: 0.1, fmt: (v) => v.toFixed(1) + ' kW' },
    { key: 'fast', type: 'seg', label: 'Time', options: [{ v: 1, label: 'Real time' }, { v: 4, label: '×4' }, { v: 10, label: '×10' }] },
    { key: 'go', type: 'buttons', label: 'Your move', items: [{ label: 'Lift it off', act: (s, inst) => inst.lift() }, { label: 'Pour a new dosa', act: (s, inst) => inst.reset(s) }] },
  ],
  onChange(s, key) { if (KEYS.includes(key)) s._reset = true; },
  quiz: [
    { q: 'Why can the base of a dosa not brown in the first few seconds?', options: ['The tawa is still cold', 'It is still wet, and wet food is pinned near 100 °C, too cool for fast browning', 'Browning needs sunlight', 'The oil blocks it'], answer: 1, why: 'Boiling water soaks up the heat and holds the wet batter at 100 °C. Only when a dry crust has formed can the base climb past 140 °C, where the Maillard reaction runs fast.' },
    { q: 'How does steam get out from under a dosa?', options: ['It cannot: it stays inside', 'Through the lace of holes left by the ferment\'s gas bubbles', 'Only round the edge', 'Through the iron'], answer: 1, why: 'Fermented batter is full of small gas bubbles. They burst on the tawa and leave channels that let steam out, which is why a well-fermented dosa cooks evenly and turns lacy.' },
    { q: 'Why does a well-fermented batter give a more golden dosa?', options: ['It contains more oil', 'Fermenting frees sugars and amino acids, the raw materials of the Maillard reaction', 'It is thicker', 'It has less starch'], answer: 1, why: 'Browning needs reducing sugars and amino acids. The ferment\'s microbes and enzymes release both. A pinch of sugar or some chana dal adds more.' },
  ],
  reel: [
    { ms: 5200, caption: 'On the tawa the film hits 100 °C in seconds. Water boils out as steam through the holes the ferment left.', set: { T0: 200, h: 1.5, water: 0.7, ferment: 10, oil: 2, extra: false, flame: 1.6, fast: 3 }, act: (s, inst) => { inst.reset(s); inst.preRun(s, 2); }, spin: 0 },
    { ms: 5400, caption: 'A dry crust climbs from the iron. Only now can the base pass 140 °C and brown: the Maillard reaction.', set: { fast: 5 }, act: (s, inst) => inst.preRun(s, 42), spin: 0 },
    { ms: 5000, caption: 'Golden, glassy, crisp, and the edges let go. About ninety seconds from ladle to plate.', set: { fast: 1 }, act: (s, inst) => { inst.preRun(s, 86); inst.lift(); }, spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const mdl = new THREE.Group(); mdl.position.x = MX; root.add(mdl);
    const rnd = rng(23), tawa = makeTawa(mdl), th = makeThermo(mdl, stage, { x: 2.6, y: 0.45, h: 2.5 }); th.band(T_LO, T_HI);
    const dosa = makeDosa(mdl), steam = puffs(mdl, 90, 0.07, 0xdfe8f5, rnd), smoke = puffs(mdl, 40, 0.12, 0x6d6f76, rnd), snd = sizzle();
    const oil = new THREE.Mesh(new THREE.RingGeometry(R_D - 0.05, R_D + 0.12, 48), new THREE.MeshStandardMaterial({ color: 0xffd97a, transparent: true, opacity: 0.4, roughness: 0.1, depthWrite: false }));
    oil.rotation.x = -Math.PI / 2; oil.position.y = tawa.topY + 0.012; mdl.add(oil);
    let S = s0, st = freshDosa(s0), rows = [], key = '', final = null, liftK = 0;
    const reset = (s) => { if (s) S = s; st = freshDosa(S); rows = []; final = null; liftK = 0; steam.clear(); smoke.clear(); };
    const log = () => { if (!rows.length || st.t - rows[rows.length - 1][0] >= 1) { rows.push([st.t, st.Ts, st.Tb, st.Tf, moistureOf(st) * 100]); if (rows.length > 600) rows.splice(0, 2); } };
    const physics = (dt) => stepDosa(st, S.flame * 1000, dt);
    const preRun = (s, secs) => { S = s; if (st.t > secs || !st.on) reset(s); while (st.t < secs) { physics(0.1); log(); } };
    const lift = () => { if (!st.on) return; final = { ...verdictOf(st), t: st.t, crust: crustMm(st), g: (st.w + st.solids) * A_DOSA * 1000 }; st.on = false; st.tOff = st.t; };
    reset(); log();

    const bA = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Temperatures', S.fast > 1 ? `time-lapse ×${S.fast}` : 'real time');
      const t1 = Math.max(120, st.t * 1.08), stp = t1 > 400 ? 120 : t1 > 180 ? 60 : 30, xt = []; for (let v = 0; v <= t1; v += stp) xt.push(v);
      const { X, Y } = axes(g, w, h, { xMax: t1, yMax: 300, y1: 84, xTicks: xt, yTicks: [0, 100, 200, 300], xFmt: (v) => v + ' s', yFmt: (v) => v + '°' });
      legend(g, [['tawa', COL.iron], ['base of dosa', COL.hot], ['wet top', COL.steam]], 24, 50, 19);
      g.fillStyle = 'rgba(232,176,74,.16)'; g.fillRect(X(0), Y(165), X(t1) - X(0), Y(140) - Y(165));
      g.font = '18px sans-serif'; g.fillStyle = COL.gold; g.fillText('browning runs fast: 140–165 °C', X(t1) - 230, Y(165) - 5);
      dashH(g, X(0), X(t1), Y(100), '', 'rgba(111,182,255,.7)');
      line(g, rows.map((r) => [r[0], r[1]]), X, Y, COL.iron, 4); line(g, rows.map((r) => [r[0], r[3]]), X, Y, COL.steam, 4); line(g, rows.map((r) => [r[0], r[2]]), X, Y, COL.hot, 5);
      if (st.tOff !== null) { g.strokeStyle = COL.ok; g.lineWidth = 2; g.beginPath(); g.moveTo(X(st.tOff), Y(0)); g.lineTo(X(st.tOff), Y(300)); g.stroke(); g.fillStyle = COL.ok; g.fillText('lifted', X(st.tOff) + 5, Y(285)); }
    }, boardPos(0));
    const bB = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Cut through the film', `${S.h.toFixed(1)} mm of batter`);
      const x0 = 20, x1 = 360, yb = h - 70, sc = Math.min(110, 190 / S.h), now = S.h * (1 - (1 - SHRINK) * st.x), ch = crustMm(st) * sc, top = yb - now * sc;
      g.fillStyle = '#23262d'; g.fillRect(x0, yb, x1 - x0, 48); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '19px sans-serif'; g.fillText(`iron tawa  ${st.Ts.toFixed(0)} °C`, x0 + 10, yb + 30);
      if (S.oil > 0) { g.fillStyle = 'rgba(255,217,122,.9)'; g.fillRect(x0, yb - 3, x1 - x0, 3); }
      if (st.on || final) {
        g.fillStyle = css(dosaColor(0.05, tmpC)); g.fillRect(x0, top, x1 - x0, yb - top - 3);                  // wet batter
        g.fillStyle = css(dosaColor(Math.max(0.5, st.B), tmpC)); g.fillRect(x0, yb - 3 - ch, x1 - x0, ch);      // crust
        const r = rng(9), nb = Math.round(40 * st.phi / 0.28);
        g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < nb; i++) { const bx = x0 + 10 + r() * (x1 - x0 - 20), byy = top + 6 + r() * Math.max(1, yb - ch - top - 14); if (byy < yb - ch - 6) { g.beginPath(); g.arc(bx, byy, 3 + 4 * r(), 0, TAU); g.fill(); } }
        const nc = Math.round(4 + 22 * st.holes), act = clamp(st.steam / 0.012, 0, 1);
        for (let i = 0; i < nc; i++) { const cx = x0 + 14 + ((i + 0.5) / nc) * (x1 - x0 - 28); g.strokeStyle = `rgba(142,240,255,${0.35 + 0.5 * act})`; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, yb - 4); g.lineTo(cx, top - 6 - 22 * act); g.stroke(); if (act > 0.05) { g.beginPath(); g.moveTo(cx - 5, top - 22 * act); g.lineTo(cx, top - 10 - 22 * act); g.lineTo(cx + 5, top - 22 * act); g.stroke(); } }
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(x0, yb - 3 - ch); g.lineTo(x1, yb - 3 - ch); g.stroke(); g.setLineDash([]);
      }
      const x = 384; const row = (y, label, val, col) => { g.fillStyle = 'rgba(255,255,255,.65)'; g.font = '19px sans-serif'; g.fillText(label, x, y); g.fillStyle = col; g.font = 'bold 24px sans-serif'; g.fillText(val, x, y + 25); };
      row(78, 'Dry crust', `${crustMm(st).toFixed(2)} mm`, COL.gold);
      row(140, 'Base temperature', `${st.Tb.toFixed(0)} °C`, COL.hot);
      row(202, 'Wet zone', st.x >= 0.999 ? 'dried through' : `${st.Tf.toFixed(0)} °C`, COL.steam);
      row(264, 'Steam leaving', `${(st.steam * A_DOSA * 1000).toFixed(2)} g/s`, COL.latent);
      g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('dashed line: the drying front · blue: steam channels', 20, h - 10);
    }, boardPos(1));
    const lStage = stage.label('', [-0.3, 2.35, 0], mdl, 'hot'), lT = stage.label('', [2.6, 3.3, 0], mdl, 'hot'), lGrip = stage.label('', [-0.7, 1.7, 2.1], mdl);
    lT.element.style.setProperty('--c', COL.hot);

    return {
      reset, preRun, lift,
      dispose() { snd.dispose(); },
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        layout(stage, mdl, [bA, bB], { minor: [lGrip, ...th.lbls] });
        if (s._reset) { s._reset = false; reset(s); }
        const n = Math.max(1, Math.round(s.fast)); for (let i = 0; i < n; i++) physics(dt);
        log();
        const g = stageOf(st), sd = STAGES[g], act = clamp(st.steam / 0.012, 0, 1), stuck = stuckOf(st);
        // the dosa seen from above: the pale top, with the base's colour showing through as it dries
        liftK = st.on ? 0 : Math.min(1, liftK + dt * 1.6);
        const seen = st.on ? st.B * (0.2 + 0.8 * st.x) : (final?.stuck ? st.B * 0.8 : st.B);
        dosa.redraw({ B: Math.round(seen * 25) / 25, holes: Math.round((final?.stuck ? 0.5 : st.holes) * 50) / 50, wet: Math.round((1 - st.x) * 5) / 5, seed: 5, rim: 1 });
        const curl = st.on && !stuck && st.x > 0.7 ? 0.03 : 0;
        dosa.mesh.position.set(0, tawa.topY + 0.025 + curl + liftK * 1.5, liftK * 0.6); dosa.mesh.rotation.x = -Math.PI / 2 + liftK * (final?.stuck ? 0.5 : 1.15);
        oil.material.opacity = 0.1 * s.oil;
        steam.step(dt, act * 70, () => { const a = rnd() * TAU, r = R_D * Math.sqrt(rnd()); return [r * Math.cos(a), tawa.topY + 0.1, r * Math.sin(a)]; }, () => [(rnd() - 0.5) * 0.3, 0.8 + rnd() * 0.7, (rnd() - 0.5) * 0.3], 1.6);
        smoke.step(dt, st.on && st.B > B_DARK ? clamp((st.B - B_DARK) * 25, 4, 40) : 0, () => { const a = rnd() * TAU, r = R_D * Math.sqrt(rnd()); return [r * Math.cos(a), tawa.topY + 0.1, r * Math.sin(a)]; }, () => [(rnd() - 0.5) * 0.35, 0.9 + rnd() * 0.7, (rnd() - 0.5) * 0.35], 2.2);
        snd.set(0.28 * act, 3000, 0.5);
        tawa.set({ flame: clamp(s.flame / 2.5, 0, 1), T: st.Ts }); tawa.step(dt); th.set(st.Ts);
        const head = final ? `On the plate: ${final.stuck ? 'stuck and torn' : final.text}` : sd.n, col = final ? (final.stuck ? COL.bad : final.col) : sd.col;
        lStage.element.style.setProperty('--c', col); lStage.element.innerHTML = `<b>${head}</b>`;
        lT.element.innerHTML = `<b>${st.Ts.toFixed(0)} °C</b>`;
        lGrip.element.innerHTML = !st.on ? '' : st.B >= B_DARK ? 'scorching: far above 150 °C, nothing left to cool it' : stuck ? 'gripping the tawa' : st.x > 0.7 ? 'edges lifting: it has let go' : 'steam leaving through the holes';
        lGrip.visible = lGrip.visible && st.on;
        const k = `${rows.length}|${Math.round(st.B * 20)}|${Math.round(st.x * 100)}|${st.on}|${s.fast}`;
        if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const g = stageOf(st), sd = STAGES[g], v = final || verdictOf(st), stuck = final ? final.stuck : stuckOf(st);
        const win = st.B >= B_DARK ? 'missed' : st.B >= B_GOLD && st.x >= 0.75 ? 'NOW' : st.x > 0.5 ? 'soon' : 'not yet';
        return compact(stage, `<div class="big" style="color:${final ? v.col : sd.col}">${final ? 'Lifted at ' + fmtT(final.t) : sd.n}</div>
          <div class="row"><span>${final ? 'On the plate' : 'If you lift it now'}</span><b style="color:${v.col}">${v.text}</b></div>
          <div class="row"><span>Tawa</span><b style="color:${stuck ? COL.bad : COL.ok}">${stuck ? (st.grip >= 0.75 ? 'stuck fast' : 'gripping, not ready') : 'releases cleanly'}</b></div>
          <div class="row xtra"><span>Time on the tawa</span><b>${fmtT(final ? final.t : st.t)}</b></div>
          <div class="row"><span>Tawa · base of the dosa</span><b>${st.Ts.toFixed(0)} °C · <span style="color:${COL.hot}">${st.Tb.toFixed(0)} °C</span></b></div>
          <div class="row"><span>Dry crust · water left</span><b>${(final ? final.crust : crustMm(st)).toFixed(2)} mm · ${Math.round(moistureOf(st) * 100)}%</b></div>
          <div class="row xtra"><span>Heat into the dosa · steam</span><b>${fmtW(st.q * A_DOSA)} · ${(st.steam * A_DOSA * 1000).toFixed(2)} g/s</b></div>
          <div class="row xtra"><span>Colour · golden at</span><b>${v.shade.n} · ${st.tGold === null ? 'not yet' : fmtT(st.tGold)}</b></div>
          ${final ? '' : `<div class="row"><span>Lift window</span><b style="color:${win === 'NOW' ? COL.ok : win === 'missed' ? COL.bad : COL.text}">${win}</b></div>`}
          <small>${final ? (final.stuck ? 'It gripped the iron and tore. More seasoning, a film of oil, or a hotter tawa at the pour would free it.' : 'Pour a new dosa to try other settings.') : sd.d}</small>`);
      },
    };
  },
};
