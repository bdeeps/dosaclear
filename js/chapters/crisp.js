// Chapter 5: crisp, then soft (1 scene unit ≈ 6.8 cm). A dosa on a steel plate, and the surface it
// was cooked on.
// Softening (softenAt in model.js): crisp starch is a glass, and it turns leathery when it takes up
//   water. Starchy snacks lose their snap at a water activity of about 0.35–0.50 (Katz & Labuza
//   1981, J. Food Sci. 46: 403), roughly 9% moisture for a starch crust (typical sorption isotherm).
//   The crust leaves the tawa at about 4% and drifts towards balance with the air touching it, with
//   a time constant of about 8 minutes (illustrative). Flat on a plate, the air under it is its own
//   trapped steam, close to 100% humid. Rolled or stood up, both faces meet room air.
// Seasoning: oil heated on iron breaks down and its fatty acids polymerise into a hard, water-
//   repelling layer bonded to the metal (Wikipedia, "Seasoning (cookware)"). PTFE non-stick coatings
//   start to break down at about 260 °C (Wikipedia, "Non-stick surface"), and an empty tawa on a
//   high flame passes that (chapter 2).
// First-dosa rule (gripOfNth in model.js): a rule of thumb, not a measurement.
import { THREE, M } from '../kit.js';
import { softenAt, crispTime, eqMoisture, SERVES, SURFACES, gripOfNth, M0, M_SOFT } from '../model.js';
import { COL, compact, VIEW, MX, BW, BH, boardPos, layout, board, panelBg, title, axes, line, dot, dashH, legend, wrap, dots, puffs, rng, makeDosa, dosaColor, fmtT, link, TAU, clamp } from '../dosa.js';

const SURF_NOTE = {
  seasoned: 'Many thin coats of oil, baked on. The oil has polymerised into a hard, slick, water-repelling film that fills the pores of the iron.',
  bare: 'Clean grey iron, full of tiny pores. Wet starch and protein flow into them and set there like glue.',
  nonstick: 'A PTFE coating that almost nothing sticks to. Easy from the first dosa, but it must not be heated empty: it breaks down above about 260 °C.',
};

export default {
  id: 'crisp',
  short: 'Crisp, then soft',
  title: 'Crisp, then soft',
  subtitle: 'Why the first dosa of the morning sticks, and why the one on your plate goes soft in minutes.',
  view: VIEW,
  learn: `<p><b>Why it goes soft.</b> The crisp base of a dosa is starch in its <b>glassy state</b>: hard and brittle, because it is dry, about 4% water. Starch glass is thirsty. Above roughly <b>9% moisture</b> it turns leathery, and the snap is gone.</p>
    <p>Water reaches the crust from three places: the dosa's own <b>soft top</b>, which is still moist; the <b>steam</b> the hot dosa keeps giving off; and the air. Lay a dosa <b>flat on a steel plate</b> and its steam is trapped underneath. The crust sits in air that is nearly 100% humid and is soft in a couple of minutes. That is why a paper roast is <b>rolled into a cone or stood up</b>: both faces meet moving room air and the steam escapes. A masala dosa softens first along the fold, where it touches hot, wet potato.</p>
    <p>So the rule of every dosa counter is the true one: <b>eat it now</b>. In a humid monsoon kitchen even a cone gives in sooner. Staling of the soft part later on is a different process, starch retrogradation, covered in ${link('breadclear', 'BreadClear')}.</p>
    <p><b>Why the first dosa fails.</b> Wet batter is a glue: starch and protein flow into the pores of bare iron and set there. Two things stop it. One is <b>seasoning</b>: oil baked onto iron breaks down and <b>polymerises</b> into a hard, slick film bonded to the metal, built up over months of use. The other is a fresh, thin <b>film of oil</b> and an <b>evenly hot</b> surface, so the batter sets before it soaks in. For the first dosa of the day the tawa is patchy in heat and dry of oil, so it grips. That dosa is the sacrifice. It leaves oil behind and evens the heat, and the second one lifts clean.</p>
    <p>A <b>non-stick</b> tawa skips all this, and makes a perfectly good dosa. It is light, though, so it loses heat fast (chapter 2), and its coating must not be overheated.</p>
    <p class="tip"><b>Try it:</b> serve the dosa flat, then rolled, and compare how long it stays crisp. Push the humidity up to a monsoon day. Then switch the tawa to new iron and step from the first dosa to the sixth.</p>`,
  terms: [
    { t: 'Glass transition', d: 'The change of a dry, brittle material into a soft, leathery one as it warms or takes up water. It is why crisp food goes limp.' },
    { t: 'Moisture migration', d: 'Water moving from a wet part of a food to a dry part until they balance. The soft top of a dosa wets its own crust.' },
    { t: 'Seasoning', d: 'A hard film of polymerised oil baked onto iron or steel. It stops rust and stops food sticking.' },
    { t: 'Polymerise', d: 'Small molecules joining into long chains or networks. Hot oil on iron does it and turns into a tough coating.' },
    { t: 'PTFE', d: 'Polytetrafluoroethylene, the slippery plastic of non-stick pans, found by Roy Plunkett in 1938.' },
  ],
  defaults: { serve: 'flat', room: 70, surface: 'seasoned', nth: 1, fast: 20 },
  controls: [
    { key: 'serve', type: 'seg', label: 'Served', options: [{ v: 'flat', label: 'Flat on the plate' }, { v: 'cone', label: 'Rolled, stood up' }, { v: 'masala', label: 'Round hot masala' }] },
    { key: 'room', type: 'range', label: 'Humidity of the room', min: 30, max: 95, step: 5, ends: ['dry winter', 'monsoon'], fmt: (v) => v + '%' },
    { key: 'fast', type: 'seg', label: 'Time', options: [{ v: 1, label: 'Real time' }, { v: 20, label: '×20' }, { v: 60, label: '×60' }] },
    { key: 'go', type: 'buttons', label: 'Your move', items: [{ label: 'Serve a fresh dosa', act: (s, inst) => inst.fresh() }] },
    { key: 'surface', type: 'seg', label: 'The tawa it came from', options: [{ v: 'seasoned', label: 'Seasoned iron' }, { v: 'bare', label: 'New iron' }, { v: 'nonstick', label: 'Non-stick' }] },
    { key: 'nth', type: 'range', label: 'Which dosa of the morning', min: 1, max: 6, step: 1, fmt: (v) => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][v - 1] },
  ],
  onChange(s, key) { if (key === 'serve') s._fresh = true; },
  quiz: [
    { q: 'Why is a paper roast served rolled up or standing, not flat?', options: ['To look bigger', 'So its steam escapes and both faces meet room air, keeping the crust dry', 'To keep it hot', 'Because it is too hard to lay flat'], answer: 1, why: 'Flat on a plate, steam is trapped under the dosa and the crust soaks it up in a couple of minutes. Standing up, the steam leaves.' },
    { q: 'What is the "seasoning" on a cast-iron tawa?', options: ['Salt and spices rubbed in', 'A film of oil that has polymerised into a hard, slick layer bonded to the iron', 'A layer of rust', 'A factory plastic coating'], answer: 1, why: 'Heated oil breaks down and its fatty acids link up into a tough film. It fills the iron\'s pores, so wet batter has nothing to grip.' },
    { q: 'Why does the first dosa of the day so often stick?', options: ['The batter is too old', 'The tawa is unevenly hot and has no fresh film of oil yet', 'The first ladle has no rice', 'Morning air is too cold'], answer: 1, why: 'The first dosa evens out the heat and leaves a little oil behind. The second meets a hot, slick surface and lifts clean.' },
  ],
  reel: [
    { ms: 5600, caption: 'Flat on a plate, a dosa sits in its own trapped steam and goes soft in about two minutes. Rolled and stood up, it stays crisp far longer.', set: { serve: 'flat', room: 70, surface: 'seasoned', nth: 1, fast: 45 }, act: (s, inst) => inst.fresh(), spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const mdl0 = new THREE.Group(); mdl0.position.x = MX; root.add(mdl0);
    const table = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.3, 5.4), new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.8 })); table.position.set(0.5, 0.65, 0); table.receiveShadow = true; mdl0.add(table);
    const mdl = new THREE.Group(); mdl.position.y = 1.3; mdl0.add(mdl);
    const rnd = rng(41), tmp = new THREE.Color();
    let S = s0, t = 0, key = '';
    // a steel plate on the counter, with chutney and sambar
    const steel = M.metal(0xc9ced8, { roughness: 0.22 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.4, 0.1, 64), steel); plate.position.y = 0.06; plate.receiveShadow = true; mdl.add(plate);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.06, 10, 64), steel); rim.rotation.x = Math.PI / 2; rim.position.y = 0.12; mdl.add(rim);
    [[2.0, -1.0, 0xf4f1e4], [2.2, 0.2, 0xd8782a], [1.7, 1.2, 0x7da04a]].forEach(([x, z, c]) => {
      const k = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.26, 28), steel); k.position.set(x + 1.4, 0.13, z); k.castShadow = true; mdl.add(k);
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.33, 28), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })); f.rotation.x = -Math.PI / 2; f.position.set(x + 1.4, 0.265, z); mdl.add(f);
    });
    const dosa = makeDosa(mdl, 1.95); dosa.redraw({ B: 1.0, holes: 0.2, seed: 5 });
    dosa.mesh.position.y = 0.14;
    const skin = new THREE.MeshStandardMaterial({ color: 0xdba23c, roughness: 0.6, side: THREE.DoubleSide });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.0, 3.1, 48, 1, true), skin); cone.castShadow = true; mdl.add(cone);
    const roll = new THREE.Group(); mdl.add(roll);
    const half = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 3.6, 32, 1, true, 0, Math.PI), skin); half.rotation.z = Math.PI / 2; half.rotation.y = 0; half.scale.x = 0.65; half.castShadow = true; roll.add(half);
    const aloo = dots(26, 0.16, 0xe8c040, 8, true); roll.add(aloo);
    for (let i = 0; i < 26; i++) aloo.place(i, (i % 2 ? 1 : -1) * (1.5 + 0.35 * rnd()), 0.16 + 0.16 * rnd(), (rnd() - 0.5) * 0.7, 0.7 + 0.7 * rnd()); aloo.done();
    roll.position.y = 0.12;
    const steam = puffs(mdl, 50, 0.08, 0xdfe8f5, rnd);
    const dew = dots(50, 0.035, 0xbfe2ff, 6, true); mdl.add(dew);
    const DW = Array.from({ length: 50 }, () => [rnd() * TAU, 2.0 + 0.4 * rnd(), rnd()]);
    const lState = stage.label('', [0, 2.9, 0], mdl, 'hot'), lWhy = stage.label('', [0.2, 0.7, 2.6], mdl);

    const bA = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Moisture in the crust', `room air ${S.room}% humid`);
      const { X, Y } = axes(g, w, h, { xMax: 900, yMax: 26, y1: 86, xTicks: [0, 180, 360, 540, 720, 900], yTicks: [0, 5, 10, 15, 20, 25], xFmt: (v) => v / 60 + ' min', yFmt: (v) => v + '%' });
      g.fillStyle = 'rgba(92,225,169,.14)'; g.fillRect(X(0), Y(M_SOFT), X(900) - X(0), Y(0) - Y(M_SOFT));
      dashH(g, X(0), X(900), Y(M_SOFT), 'crisp below 9%', 'rgba(255,255,255,.6)');
      const cols = { flat: COL.hot, cone: COL.ok, masala: COL.latent };
      for (const k of ['cone', 'masala', 'flat']) { const pts = []; for (let x = 0; x <= 900; x += 15) pts.push([x, softenAt(x, k, S.room)]); line(g, pts, X, Y, cols[k], k === S.serve ? 6 : 2.5, k === S.serve ? null : [8, 6]); }
      legend(g, [['flat', cols.flat], ['rolled, standing', cols.cone], ['round masala', cols.masala]], 24, 50, 19);
      dot(g, X(Math.min(900, t)), Y(softenAt(t, S.serve, S.room)), '#fff', 8);
    }, boardPos(0));
    const bB = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'How hard the batter grips', SURFACES[S.surface].n);
      const x0 = 40, x1 = 380, yb = h - 96, H = 190;
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.setLineDash([7, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(x0, yb - H * 0.5); g.lineTo(x1, yb - H * 0.5); g.stroke(); g.setLineDash([]);
      g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('above the line: it sticks', x0, yb - H * 0.5 - 7);
      for (let n = 1; n <= 6; n++) {
        const v = gripOfNth(S.surface, n), bw = 40, x = x0 + (n - 0.5) * ((x1 - x0) / 6) - bw / 2;
        g.fillStyle = v > 0.5 ? COL.bad : COL.ok; g.globalAlpha = n === S.nth ? 1 : 0.45; g.fillRect(x, yb - H * v, bw, Math.max(3, H * v)); g.globalAlpha = 1;
        g.fillStyle = n === S.nth ? '#fff' : 'rgba(255,255,255,.6)'; g.font = `${n === S.nth ? 'bold ' : ''}20px sans-serif`; g.fillText(['1st', '2nd', '3rd', '4th', '5th', '6th'][n - 1], x + 4, yb + 22);
      }
      g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('dosa of the morning (rule of thumb)', x0, yb + 46);
      // the surface, magnified
      const sx = 400, sw = 212, sy = 96;
      g.fillStyle = S.surface === 'nonstick' ? '#b9bec8' : '#6b6f78'; g.beginPath(); g.moveTo(sx, sy + 70);
      for (let i = 0; i <= 24; i++) g.lineTo(sx + (i / 24) * sw, sy + 40 + (S.surface === 'nonstick' ? 0 : 12 * Math.abs(Math.sin(i * 1.9)) + 5 * Math.sin(i * 0.7)));
      g.lineTo(sx + sw, sy + 70); g.closePath(); g.fill();
      if (S.surface === 'seasoned') { g.fillStyle = '#17181c'; g.fillRect(sx, sy + 26, sw, 16); g.beginPath(); g.moveTo(sx, sy + 42); for (let i = 0; i <= 24; i++) g.lineTo(sx + (i / 24) * sw, sy + 41 + 12 * Math.abs(Math.sin(i * 1.9)) + 5 * Math.sin(i * 0.7)); g.lineTo(sx + sw, sy + 42); g.closePath(); g.fill(); }
      if (S.surface === 'nonstick') { g.fillStyle = '#2b2e35'; g.fillRect(sx, sy + 28, sw, 12); }
      if (S.nth > 1 || S.surface !== 'bare') { g.fillStyle = 'rgba(255,217,122,.9)'; g.fillRect(sx, sy + (S.surface === 'bare' ? 36 : 22), sw, S.nth > 1 ? 5 : 2); }
      g.fillStyle = '#f3ead0'; g.fillRect(sx, sy - 6, sw, S.surface === 'bare' ? 44 : 26);
      if (S.surface === 'bare') { g.beginPath(); g.moveTo(sx, sy + 36); for (let i = 0; i <= 24; i++) g.lineTo(sx + (i / 24) * sw, sy + 39 + 12 * Math.abs(Math.sin(i * 1.9)) + 5 * Math.sin(i * 0.7)); g.lineTo(sx + sw, sy + 36); g.closePath(); g.fill(); }
      g.fillStyle = '#222'; g.font = 'bold 17px sans-serif'; g.fillText('batter', sx + 8, sy + 12);
      g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '18px sans-serif'; wrap(g, SURF_NOTE[S.surface], sx, sy + 96, sw + 8, 19);
    }, boardPos(1));

    return {
      fresh() { t = 0; steam.clear(); },
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        layout(stage, mdl0, [bA, bB], { minor: [lWhy], scale: 1, tallScale: 1.15 });
        if (s._fresh) { s._fresh = false; t = 0; }
        t = Math.min(900, t + dt * s.fast);
        const m = softenAt(t, s.serve, s.room), soft = clamp((m - 6) / 8, 0, 1), hot = Math.exp(-t / 150);
        dosa.mesh.visible = s.serve === 'flat'; cone.visible = s.serve === 'cone'; roll.visible = s.serve === 'masala';
        dosaColor(1.05 + 0.25 * soft, tmp); skin.color.copy(tmp); skin.roughness = 0.6 - 0.25 * soft;
        dosa.redraw({ B: Math.round((1.0 + 0.25 * soft) * 20) / 20, holes: 0.2, seed: 5 });
        cone.scale.set(1 + 0.12 * soft, 1 - 0.22 * soft, 1 + 0.12 * soft); cone.position.set(-0.2, 0.12 + 1.55 * (1 - 0.22 * soft), 0); cone.rotation.z = 0.5 * soft;
        half.scale.y = 1; roll.scale.y = 1 - 0.3 * soft;
        const trapped = s.serve !== 'cone';
        steam.step(dt, hot * (s.serve === 'masala' ? 26 : 16), () => { const a = rnd() * TAU, r = s.serve === 'cone' ? 0.7 * rnd() : 2.0 * (0.8 + 0.2 * rnd()); return [r * Math.cos(a) - (s.serve === 'cone' ? 0.2 : 0), s.serve === 'cone' ? 0.4 + 2.4 * rnd() : 0.25, r * Math.sin(a)]; }, () => [(rnd() - 0.5) * 0.4, 0.5 + rnd() * 0.5, (rnd() - 0.5) * 0.4], 1.6);
        const nd = trapped ? Math.round(50 * clamp(t / 120, 0, 1)) : 0;
        DW.forEach((p, i) => dew.place(i, p[1] * Math.cos(p[0]), 0.13, p[1] * Math.sin(p[0]), i < nd ? 0.6 + p[2] : 0.0001)); dew.done();
        const crisp = m < M_SOFT;
        lState.element.style.setProperty('--c', crisp ? COL.ok : COL.hot); lState.element.innerHTML = `<b>${crisp ? 'Crisp' : m < 13 ? 'Going leathery' : 'Soft'}</b> · ${fmtT(t)} off the tawa`;
        lWhy.element.innerHTML = s.serve === 'cone' ? 'steam escapes: both faces meet room air' : s.serve === 'flat' ? 'steam trapped under the dosa wets the crust' : 'hot, wet potato inside wets the fold';
        const k = `${Math.round(t / 4)}|${s.serve}|${s.room}|${s.surface}|${s.nth}`;
        if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const m = softenAt(t, s.serve, s.room), ct = crispTime(s.serve, s.room), rh = SERVES[s.serve].rh(s.room), grip = gripOfNth(s.surface, s.nth), crisp = m < M_SOFT;
        return compact(stage, `<div class="big" style="color:${crisp ? COL.ok : COL.hot}">${crisp ? 'Still crisp' : m < 13 ? 'Going leathery' : 'Soft'}</div>
          <div class="row"><span>Off the tawa for</span><b>${fmtT(t)}</b></div>
          <div class="row"><span>Moisture in the crust</span><b>${m.toFixed(1)}% (started at ${M0}%)</b></div>
          <div class="row"><span>Air touching the crust</span><b style="color:${COL.water}">${rh}% humid</b></div>
          <div class="row"><span>Served this way, crisp for</span><b style="color:${COL.ok}">${isFinite(ct) ? 'about ' + fmtT(ct) : 'as long as you like'}</b></div>
          <div class="row"><span>${SURFACES[s.surface].n}, dosa ${s.nth}</span><b style="color:${grip > 0.5 ? COL.bad : COL.ok}">${grip > 0.5 ? 'sticks' : 'lifts clean'}</b></div>
          <small>The softening curve is a teaching model: the 9% threshold and the 8-minute time constant are typical values, not measurements of one dosa. At ${s.room}% humidity a crust would settle near ${eqMoisture(s.room).toFixed(0)}% in open air.</small>`);
      },
    };
  },
};
