// Chapter 1: what is in a dosa (the batter, and a piece of dosa cut through and magnified).
// The slab is a piece of dosa about 1 mm thick drawn roughly 40 times too tall, so its three zones
// can be seen: the crisp browned base that touched the tawa, the lace of holes, the soft pale top.
// Grain composition: rounded Indian Food Composition Tables 2017 values (see model.js).
// Ferment curves: end points from Ghosh & Chattopadhyay 2011 (pH 5.9 → 4.2, volume ×1.62–3.2 over
// 22 h at 20–26 °C); the shape between them is typical. IdliClear owns the ferment in depth.
import { THREE, M, box, exploder } from '../kit.js';
import { batterMix, fermentPH, fermentRise, gasFrac, PARTS, RHO_BATTER } from '../model.js';
import { COL, compact, VIEW, MX, BW, BH, boardPos, layout, board, panelBg, title, axes, line, dot, bars, legend, dots, rng, link, TAU, clamp } from '../dosa.js';

export default {
  id: 'batter',
  short: 'Inside a dosa',
  title: 'What is in a dosa?',
  subtitle: 'Rice, urad dal, water and a night of fermenting. On the tawa it becomes a sheet with a crisp side, a soft side and a lace of holes.',
  view: VIEW,
  learn: `<p>A dosa starts as the same batter as an idli: <b>rice</b> and <b>urad dal</b> (black gram), soaked, ground wet (in a stone wet grinder or a mixie: see ${link('mixerclear', 'MixerClear')}) and left overnight. Dosa batter usually has a little more rice, about 3 to 5 parts to 1 of dal, and it is <b>thinned with water</b> until it pours like cream. Many homes add a spoon of <b>methi</b> (fenugreek) seeds, and hotels often add a little chana dal or poha.</p>
    <p>Each part has a job. <b>Rice</b> is mostly <b>starch</b>: it sets into the sheet and dries to the crisp. <b>Urad dal</b> brings <b>protein</b> and a slippery gum that hold gas bubbles and make the batter flow smoothly under the ladle. <b>Water</b> is about 70% of the batter, and nearly all of it has to leave as steam on the tawa.</p>
    <p><b>The ferment, in one passage.</b> Nobody adds a starter. Wild lactic acid bacteria that ride in on the dal, led by <i>Leuconostoc mesenteroides</i>, turn sugars into <b>lactic acid</b> and <b>carbon dioxide</b>. The batter sours from about pH 6 to about 4.5 and swells with gas. That gives a dosa its tang, its holes, and free sugars and amino acids that later help it brown. The full story, with a live simulator, is in ${link('idliclear', 'IdliClear', 'ferment')}; the souring itself is the same chemistry as ${link('curdclear', 'CurdClear')}.</p>
    <p>Now look at the cut piece. A dosa is cooked from <b>one side only</b>. The face that touched the iron dried out, went above 100 °C and turned <b>brown, glassy and crisp</b>. The top never passed 100 °C: it was cooked by steam and stays <b>pale and soft</b>. In between is a <b>lace of holes</b>, where gas bubbles burst and steam escaped.</p>
    <p class="tip"><b>Try it:</b> pull the layers apart with the first slider. Then change the rice and the water and watch the bars: a thin, watery batter has less starch per ladle, so the dosa is thinner and lacier.</p>`,
  terms: [
    { t: 'Urad dal', d: 'Dehusked black gram, Vigna mungo. About a quarter of it is protein, and its gum helps batter hold gas.' },
    { t: 'Starch', d: 'The plant\'s store of glucose, packed in granules. Heated in water it swells and sets (gelatinises); dried, it turns glassy and crisp.' },
    { t: 'Fermentation', d: 'Microbes feeding on sugars and making acid and gas. In dosa batter the microbes are wild: no starter is added.' },
    { t: 'Lace', d: 'The network of small holes in a dosa, left by gas bubbles and by steam forcing its way out.' },
    { t: 'Methi', d: 'Fenugreek seeds. A spoonful in the soak helps the ferment, adds a gum that smooths the batter, and deepens the colour.' },
  ],
  defaults: { explode: 0.35, ratio: 4, water: 0.7, ferment: 10 },
  controls: [
    { key: 'explode', type: 'range', label: 'Pull the layers apart', min: 0, max: 1, step: 0.01, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'ratio', type: 'range', label: 'Rice to one part urad dal', min: 2, max: 6, step: 0.5, fmt: (v) => `${v} : 1`, hint: 'Idli batter is often 3:1 or 4:1. More rice makes a crisper, less spongy dosa.' },
    { key: 'water', type: 'range', label: 'Water in the batter', min: 0.62, max: 0.78, step: 0.01, ends: ['thick', 'runny'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'ferment', type: 'range', label: 'Fermented for', min: 0, max: 18, step: 0.5, fmt: (v) => v + ' h', hint: 'In a warm kitchen, about 30 °C. A cold night needs far longer.' },
  ],
  quiz: [
    { q: 'Why is one side of a dosa crisp and the other soft?', options: ['The cook oils only one side', 'It is cooked from one side: the base dries and browns, the top is only steamed', 'The rice sinks to the bottom', 'The top is a different batter'], answer: 1, why: 'The face on the tawa dries out and goes well above 100 °C. The top stays wet until the end, and wet food cannot pass 100 °C, so it stays pale and soft.' },
    { q: 'Who adds the bacteria that ferment dosa batter?', options: ['Nobody: they come in on the grains, mostly the dal', 'The cook adds yeast', 'They are in the tap water only', 'A spoon of old curd is always needed'], answer: 0, why: 'It is a wild ferment. Lactic acid bacteria such as Leuconostoc mesenteroides are already on the dal and multiply in the wet batter.' },
    { q: 'What does the rice mainly bring to the batter?', options: ['Protein', 'Fat', 'Starch, which sets and dries into the crisp sheet', 'Acid'], answer: 2, why: 'Milled rice is about three-quarters starch. Starch gels when heated wet and turns glassy when dry: that is the crispness.' },
  ],
  reel: [
    { ms: 5600, caption: 'A dosa is rice, urad dal and water, fermented overnight. Cut one open: a crisp brown base, a lace of holes, a soft pale top.', set: { ratio: 4, water: 0.7, ferment: 10 }, anim: { explode: [0, 1] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const mdl = new THREE.Group(); mdl.position.x = MX; root.add(mdl);
    const rnd = rng(31);
    // ---- the cut piece of dosa, magnified
    const W = 3.0, D = 2.2, y0 = 1.85, SX = 0.9;
    const stand = box(W + 0.5, 0.12, D + 0.5, M.metal(0x8b93a0, { roughness: 0.4 })); stand.position.set(SX, y0 - 0.5, -0.3); mdl.add(stand);
    [-1, 1].forEach((sx) => { const leg = box(0.12, y0 - 0.5, 0.12, M.metal(0x6b7380)); leg.position.set(SX + sx * (W / 2), (y0 - 0.5) / 2, -0.3); mdl.add(leg); });
    const crust = box(W, 0.16, D, new THREE.MeshStandardMaterial({ color: 0xc07a24, roughness: 0.55 })); crust.position.set(SX, y0 - 0.3, -0.3); mdl.add(crust);
    const mid = new THREE.Group(); mid.position.set(SX, y0, -0.3); mdl.add(mid);
    const gel = new THREE.Mesh(new THREE.BoxGeometry(W, 0.44, D), M.clear(0xf2e2a8, 0.5)); mid.add(gel);
    const NB = 60, bub = dots(NB, 0.055, 0xfffbea, 8, true); mid.add(bub);
    const BP = Array.from({ length: NB }, () => [(rnd() - 0.5) * (W - 0.4), (rnd() - 0.5) * 0.3, (rnd() - 0.5) * (D - 0.4), 0.5 + rnd()]);
    const NC = 16, chan = [];
    for (let i = 0; i < NC; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.44, 8), M.glow(0x8ef0ff, { transparent: true, opacity: 0.55 })); c.position.set((rnd() - 0.5) * (W - 0.5), 0, (rnd() - 0.5) * (D - 0.5)); mid.add(c); chan.push(c); }
    const top = box(W, 0.08, D, new THREE.MeshStandardMaterial({ color: 0xf3e7c4, roughness: 0.8 })); top.position.set(SX, y0 + 0.26, -0.3); mdl.add(top);
    const move = exploder([{ obj: crust, off: [0, 0, 0] }, { obj: mid, off: [0, 0.5, 0] }, { obj: top, off: [0, 1.0, 0] }]);
    // ---- what goes in: three katoris and a vessel of batter
    const steel = M.metal(0xc4cad4, { roughness: 0.3 });
    function katori(x, z, r, hgt, fill, grains, gcol, gr) {
      const g = new THREE.Group(); g.position.set(x, 0, z); mdl.add(g);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.78, hgt, 32, 1, true), steel); cup.material.side = THREE.DoubleSide; cup.position.y = hgt / 2; cup.castShadow = true; g.add(cup);
      const base = new THREE.Mesh(new THREE.CircleGeometry(r * 0.78, 32), steel); base.rotation.x = -Math.PI / 2; base.position.y = 0.01; g.add(base);
      const f = new THREE.Mesh(new THREE.CircleGeometry(r * 0.95, 32), new THREE.MeshStandardMaterial({ color: fill, roughness: 0.7 })); f.rotation.x = -Math.PI / 2; f.position.y = hgt * 0.8; g.add(f);
      if (grains) { const d = dots(grains, gr, gcol, 6, true); g.add(d); for (let i = 0; i < grains; i++) { const a = rnd() * TAU, rr = r * 0.85 * Math.sqrt(rnd()); d.place(i, rr * Math.cos(a), hgt * 0.8 + 0.02, rr * Math.sin(a), 0.7 + 0.6 * rnd(), 0.5); } d.done(); }
      return { g, f };
    }
    const kRice = katori(-2.0, 1.7, 0.6, 0.42, 0xefeae0, 120, 0xfbf8f0, 0.055);
    const kDal = katori(-0.75, 1.9, 0.45, 0.36, 0xe9dfc0, 90, 0xf2e6bd, 0.05);
    katori(0.2, 2.0, 0.26, 0.26, 0xb98a2e, 40, 0xc99a34, 0.035);
    const kBat = katori(1.55, 1.75, 0.75, 0.9, 0xf3ead0, 0);
    const froth = dots(40, 0.06, 0xfffdf2, 6, true); kBat.g.add(froth);
    const FP = Array.from({ length: 40 }, () => [rnd() * TAU, Math.sqrt(rnd()) * 0.7, rnd()]);

    const lCrust = stage.label('<b>Crisp side</b>: dry, brown', [-1.55, y0 - 0.3, 0], mdl, 'hot'); lCrust.element.style.setProperty('--c', '#e8a13c');
    const lLace = stage.label('<b>Lace</b> of holes', [-1.55, y0, 0], mdl, 'hot'); lLace.element.style.setProperty('--c', COL.steam);
    const lTop = stage.label('<b>Soft side</b>: steamed', [-1.55, y0 + 0.3, 0], mdl, 'hot'); lTop.element.style.setProperty('--c', '#f3e7c4');
    const lR = stage.label('rice', [-2.0, 0.85, 1.7], mdl), lD = stage.label('urad dal', [-0.75, 0.75, 1.9], mdl), lM = stage.label('methi', [0.2, 0.6, 2.0], mdl), lB = stage.label('batter', [1.55, 1.3, 1.75], mdl);
    const lMag = stage.label('1 mm thick, drawn 40× too tall', [SX + W / 2 + 0.85, y0 - 0.3, 0], mdl);

    let S = { ratio: 4, water: 0.7, ferment: 10 }, key = '';
    const bA = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'In 100 g of batter', `rice ${S.ratio} : 1 urad`);
      const mix = batterMix(S.ratio, S.water);
      bars(g, PARTS.map((p) => ({ label: p.n, value: mix[p.k], color: p.col, text: mix[p.k].toFixed(mix[p.k] < 10 ? 1 : 0) + ' g', dark: true })), { y: 60, w: w - 20, rowH: 56, labelW: 220, max: 100, font: 20 });
      g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('grain values rounded from the Indian Food Composition Tables 2017', 20, h - 12);
    }, boardPos(0));
    const bB = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Overnight: the ferment', 'full story in IdliClear');
      const { X, Y } = axes(g, w, h, { xMax: 18, yMin: 3.5, yMax: 6.5, y1: 86, xTicks: [0, 4, 8, 12, 16], yTicks: [4, 5, 6], xFmt: (v) => v + ' h', yFmt: (v) => 'pH ' + v });
      legend(g, [['sourness (pH falls)', COL.hot], ['volume (rises)', COL.steam]], 24, 48);
      const a = [], b = []; for (let t = 0; t <= 18; t += 0.5) { a.push([t, fermentPH(t)]); b.push([t, 3.5 + (fermentRise(t) - 1) * 2.2]); }
      line(g, b, X, Y, COL.steam, 4); line(g, a, X, Y, COL.hot, 5);
      dot(g, X(S.ferment), Y(fermentPH(S.ferment)), COL.hot, 9); dot(g, X(S.ferment), Y(3.5 + (fermentRise(S.ferment) - 1) * 2.2), COL.steam, 9);
      g.font = 'bold 21px sans-serif'; g.fillStyle = COL.text; g.fillText(`pH ${fermentPH(S.ferment).toFixed(1)} · volume ×${fermentRise(S.ferment).toFixed(1)}`, X(18) - 190, Y(6.5) + 20);
    }, boardPos(1));

    return {
      update(dt, s, time) {
        dt = Math.max(0, dt); S = s;
        layout(stage, mdl, [bA, bB], { minor: [lMag, lR, lD, lM, lB] });
        move(s.explode);
        lCrust.position.y = crust.position.y; lLace.position.y = mid.position.y; lTop.position.y = top.position.y;
        const open = clamp((s.explode - 0.15) / 0.5, 0, 1), gas = gasFrac(s.ferment), wet = clamp((s.water - 0.62) / 0.16, 0, 1);
        const nb = Math.round(NB * clamp(gas / 0.28, 0.1, 1));
        BP.forEach((p, i) => bub.place(i, p[0], p[1], p[2], i < nb ? p[3] * (0.7 + 0.5 * wet) : 0.0001)); bub.done();
        chan.forEach((c, i) => { c.visible = i < 4 + Math.round(12 * clamp(gas / 0.28 * 0.6 + wet * 0.4, 0, 1)); c.material.opacity = 0.35 + 0.25 * Math.sin(time * 3 + i); });
        gel.material.opacity = 0.62 - 0.2 * open;
        // the rice heap grows with the ratio; froth on the batter with the ferment
        kRice.g.scale.setScalar(0.8 + 0.08 * s.ratio); kDal.g.scale.setScalar(1);
        const nf = Math.round(40 * clamp(gas / 0.28, 0, 1));
        FP.forEach((p, i) => froth.place(i, p[1] * 0.9 * Math.cos(p[0]), 0.74 + 0.01 * Math.sin(time * 2 + i), p[1] * 0.9 * Math.sin(p[0]), i < nf ? 0.6 + p[2] : 0.0001)); froth.done();
        const k = `${s.ratio}|${s.water}|${s.ferment}`;
        if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const mix = batterMix(s.ratio, s.water), gas = gasFrac(s.ferment), rho = RHO_BATTER * (1 - gas);
        return compact(stage, `<div class="big">Dosa batter</div>
          <div class="row"><span>Rice : urad dal</span><b>${s.ratio} : 1</b></div>
          <div class="row"><span>Water</span><b style="color:${COL.water}">${Math.round(s.water * 100)}%</b></div>
          <div class="row"><span>Starch · protein in 100 g</span><b>${mix.starch.toFixed(0)} g · ${mix.protein.toFixed(1)} g</b></div>
          <div class="row"><span>After ${s.ferment} h: pH · volume</span><b>about ${fermentPH(s.ferment).toFixed(1)} · ×${fermentRise(s.ferment).toFixed(1)}</b></div>
          <div class="row"><span>Gas left when stirred and poured</span><b>about ${Math.round(gas * 100)}%</b></div>
          <div class="row"><span>A 70 mL ladle weighs</span><b>about ${Math.round(70 * rho / 1000)} g</b></div>
          <small>${s.ferment < 4 ? 'Hardly fermented: little gas, little tang, and a pale dosa.' : s.ferment > 14 ? 'Long ferment: very sour. Good for uttapam.' : 'Sour, airy and ready for the tawa.'} Values are typical, for a kitchen near 30 °C.</small>`);
      },
    };
  },
};
