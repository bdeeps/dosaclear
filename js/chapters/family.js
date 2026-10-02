// Chapter 6: a family of dosas, laid out as a map. Across: how the batter is made, from rice and
// urad fermented overnight (left) to batters that are not fermented at all (right). Up: how thick
// it is cooked, from paper roast (half a millimetre) to uttapam (about six).
// Thicknesses, sizes and recipes are typical kitchen and restaurant values (FAMILY in model.js),
// not standards: every home and hotel has its own. Davanagere benne dose: Chennamma's eatery, 1928
// (Wikipedia, "Benne dose"). Masala dosa: credited to Udupi restaurateurs in Madras in the 1930s.
import { THREE, M, torus } from '../kit.js';
import { FAMILY } from '../model.js';
import { COL, compact, VIEW, BW, BH, boardPos, layout, board, panelBg, title, wrap, drawDosa, link, clamp } from '../dosa.js';

const X0 = -3.3, X1 = 2.85, Y0 = 0.95, Y1 = 5.0;
const xOf = (x) => X0 + (X1 - X0) * x;
const yOf = (mm) => Y0 + (Y1 - Y0) * (Math.log(mm / 0.5) / Math.log(12));
const rOf = (cm) => 0.18 + cm / 160;
const HOLES = { rava: 0.5, neer: 0.32, paper: 0.16, set: 0.06, uttapam: 0.05, adai: 0.08 };
const BROWN = { neer: 0, set: 0.3, uttapam: 0.5 };

export default {
  id: 'family',
  short: 'The dosa family',
  title: 'A family of dosas',
  subtitle: 'Change the batter or change the thickness and you get a different dosa. Twelve of them, on one map.',
  view: VIEW,
  learn: `<p>"Dosa" is a family, not one dish. Two choices place every member on the map: <b>what the batter is</b>, and <b>how thick it is cooked</b>.</p>
    <p><b>Same batter, different thickness.</b> Spread fermented rice-and-urad batter to half a millimetre and roast it dry: <b>paper roast</b>. About a millimetre, folded: the everyday <b>sada dosa</b>, or a <b>masala dosa</b> once potato palya goes inside. Pour it thick and barely spread it: soft, spongy <b>set dosa</b>, and thicker still with onions on top, <b>uttapam</b>. Davanagere's <b>benne dose</b> is small, thick and cooked in white butter.</p>
    <p><b>Different batter.</b> <b>Rava dosa</b> has no ferment and no grinding: semolina, rice flour and a little maida in a batter as thin as buttermilk, <i>poured</i> from a height so it runs into a net of holes. <b>Neer dosa</b> from Tulu Nadu is rice and water only, soft and white. <b>Pesarattu</b> from Andhra is whole green gram. <b>Adai</b> is rice with several dals, ground coarse. <b>Ragi dosa</b> swaps in finger millet.</p>
    <p>The physics stays the same for all of them. Thin films dry through and go <b>crisp</b>; thick ones keep a moist middle and stay <b>soft</b>. Fermented batters bring gas for holes and sugars for browning; unfermented ones rely on watery batter for lace (rava) or stay pale (neer).</p>
    <p>Close cousins sit just off this map: <b>appam</b> from Kerala (fermented rice and coconut, swirled in a deep pan so the edge is lacy and the middle is soft), <b>chilla</b> or pudla in the north and west (gram-flour batter), and <b>idli</b>, the same batter steamed instead of roasted: see ${link('idliclear', 'IdliClear')}. And today a machine can do the spiral: tabletop dosa makers pour, spread and roast at the press of a button.</p>
    <p class="tip"><b>Try it:</b> step through the family with the slider, or tap a dosa on the map. Find the two that are not ground at all, and the one that is never browned.</p>`,
  terms: [
    { t: 'Sada dosa', d: 'A plain dosa. "Sada" means plain or simple.' },
    { t: 'Palya', d: 'The Kannada word for a dry vegetable dish. In a masala dosa it is spiced potato and onion.' },
    { t: 'Rava', d: 'Semolina: coarsely milled wheat. It makes an instant batter that needs no fermenting.' },
    { t: 'Benne', d: 'Kannada for butter. Benne dose is finished with a lump of white butter.' },
    { t: 'Udupi hotel', d: 'A vegetarian restaurant in the style of cooks from Udupi in coastal Karnataka, who carried the dosa across India in the 20th century.' },
  ],
  defaults: { which: 2 },
  controls: [
    { key: 'which', type: 'range', label: 'Which dosa', min: 0, max: FAMILY.length - 1, step: 1, fmt: (v) => FAMILY[Math.round(v)].n },
  ],
  quiz: [
    { q: 'What makes a rava dosa so lacy?', options: ['A long ferment', 'A very thin, watery batter poured from a height, which runs into a net of holes', 'Extra urad dal', 'It is cooked under a lid'], answer: 1, why: 'Rava dosa batter is not fermented or spread. It is as thin as buttermilk, so it splashes into a web and the gaps stay open as it roasts.' },
    { q: 'Paper roast and uttapam can come from the same batter. What is the main difference?', options: ['The oil used', 'How thick the batter is laid: half a millimetre against about six', 'The stove', 'The shape of the ladle'], answer: 1, why: 'A thin film dries right through and turns crisp. A thick one keeps a moist, spongy middle.' },
    { q: 'Which of these is NOT fermented?', options: ['Sada dosa', 'Set dosa', 'Pesarattu', 'Uttapam'], answer: 2, why: 'Pesarattu batter is soaked green gram ground with ginger and chilli and used straight away.' },
  ],
  reel: [
    { ms: 5600, caption: 'Change the batter or the thickness and you get a new dosa: paper roast, masala, set, rava, neer, pesarattu, adai. One idea, a whole family.', anim: { which: [0, 11] }, spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const mdl = new THREE.Group(); root.add(mdl);
    let S = s0, key = '';
    const idx = () => clamp(Math.round(S.which), 0, FAMILY.length - 1);
    // the map behind the dosas
    const back = board(mdl, 7.4, 5.3, 1036, 742, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.72)'; g.fillRect(0, 0, w, h);
      const px = (x) => ((xOf(x) - (-3.9)) / 7.4) * w, py = (mm) => h - ((yOf(mm) - 0.2) / 5.3) * h;
      [[0, 0.5, 'rgba(232,176,74,.10)', 'fermented overnight'], [0.5, 0.74, 'rgba(142,240,255,.07)', 'short ferment'], [0.74, 1.06, 'rgba(196,155,255,.09)', 'not fermented']].forEach(([a, b, c, n]) => { g.fillStyle = c; g.fillRect(px(a) - 30, 0, px(b) - px(a), h); g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '20px sans-serif'; g.fillText(n, px(a) - 18, h - 12); });
      g.strokeStyle = 'rgba(255,255,255,.14)'; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
      [0.5, 1, 2, 4, 6].forEach((mm) => { g.beginPath(); g.moveTo(40, py(mm)); g.lineTo(w, py(mm)); g.stroke(); g.fillText(mm + ' mm', 6, py(mm) - 4); });
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = 'bold 20px sans-serif'; g.fillText('thicker, softer ↑', w - 160, 24); g.fillText('thinner, crisper ↓', w - 166, h - 40);
    }, [-0.2, 2.85, -0.06]);
    const items = FAMILY.map((f, i) => {
      const c = document.createElement('canvas'); c.width = c.height = 160;
      drawDosa(c.getContext('2d'), 160, 160, { B: BROWN[f.id] ?? 1.0, holes: HOLES[f.id] ?? 0.14, seed: 3 + i, base: f.id === 'ragi' || f.id === 'pesarattu' || f.id === 'neer' ? f.col : null, ridges: !['rava', 'neer', 'set', 'uttapam'].includes(f.id) });
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.CircleGeometry(rOf(f.cm), 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, toneMapped: false }));
      m.position.set(xOf(f.x), yOf(f.mm), 0.02 + i * 0.004); m.userData.i = i; mdl.add(m); stage.pickables.push(m);
      const l = stage.label(f.n, [xOf(f.x), yOf(f.mm) - rOf(f.cm) - 0.16, 0.05], mdl);
      return { m, l, f };
    });
    const ring = torus(1, 0.035, M.glow(0x8ef0ff)); ring.castShadow = false; mdl.add(ring);

    const pic = document.createElement('canvas'); pic.width = pic.height = 300;
    const bA = board(root, BW, BH, 632, 364, (g, w, h) => {
      const i = idx(), f = FAMILY[i];
      panelBg(g, w, h);
      drawDosa(pic.getContext('2d'), 300, 300, { B: BROWN[f.id] ?? 1.0, holes: HOLES[f.id] ?? 0.14, seed: 3 + i, base: ['ragi', 'pesarattu', 'neer'].includes(f.id) ? f.col : null, ridges: !['rava', 'neer', 'set', 'uttapam'].includes(f.id) });
      g.drawImage(pic, 16, 34);
      g.fillStyle = COL.text; g.font = 'bold 34px sans-serif'; g.fillText(f.n, 336, 92);
      g.font = '21px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; wrap(g, f.from, 336, 124, 280, 25);
      g.font = 'bold 26px sans-serif'; g.fillStyle = COL.gold; g.fillText(`about ${f.mm} mm thick`, 336, 210);
      g.fillStyle = COL.steam; g.fillText(`about ${f.cm} cm across`, 336, 248);
      g.fillStyle = f.x < 0.5 ? COL.ok : COL.latent; g.fillText(f.x < 0.5 ? 'fermented overnight' : f.x < 0.74 ? 'short or no ferment' : 'not fermented', 336, 286);
    }, boardPos(0));
    const bB = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'How thick each one is', 'typical, mm');
      const rows = [...FAMILY].sort((a, b) => a.mm - b.mm), sel = FAMILY[idx()].id, rh = 25, x0 = 170, span = w - x0 - 70;
      rows.forEach((f, i) => {
        const y = 52 + i * rh, on = f.id === sel, L = (Math.log(f.mm / 0.3) / Math.log(20)) * span;
        g.font = `${on ? 'bold ' : ''}19px sans-serif`; g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.65)'; g.fillText(f.n, 20, y + 15);
        g.fillStyle = f.col; g.globalAlpha = on ? 1 : 0.6; g.fillRect(x0, y + 2, L, rh - 8); g.globalAlpha = 1;
        g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.65)'; g.fillText(f.mm + '', x0 + L + 8, y + 15);
      });
    }, boardPos(1));

    return {
      pick(o) { if (o.userData.i !== undefined) { S.which = o.userData.i; key = ''; } },
      update(dt, s, time) {
        dt = Math.max(0, dt); S = s;
        const narrow = layout(stage, mdl, [bA, bB], { scale: 1, tallScale: 1.05 });
        const i = idx(), f = FAMILY[i], r = rOf(f.cm);
        items.forEach((it, k) => { const on = k === i; it.m.scale.setScalar(on ? 1.12 + 0.03 * Math.sin(time * 4) : 1); it.l.visible = !narrow || on; it.l.element.style.opacity = on ? 1 : 0.75; });
        ring.position.set(xOf(f.x), yOf(f.mm), 0.08); ring.scale.setScalar(r * 1.2);
        if (String(i) !== key) { key = String(i); bA.redraw(); bB.redraw(); }
      },
      readout: () => {
        const f = FAMILY[idx()];
        return compact(stage, `<div class="big" style="color:${COL.gold}">${f.n}</div>
          <div class="row"><span>Thickness · size</span><b>about ${f.mm} mm · ${f.cm} cm</b></div>
          <div class="row"><span>Ferment</span><b>${f.x < 0.5 ? 'overnight' : f.x < 0.74 ? 'short or optional' : 'none'}</b></div>
          <small><b>Batter:</b> ${f.batter}.<br><b>On the tawa:</b> ${f.how}</small>`);
      },
    };
  },
};
