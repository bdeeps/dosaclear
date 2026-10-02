// The numbers behind DosaClear: the batter, the tawa as a block of hot iron, a water drop on it
// (the Leidenfrost effect), the ladle's spiral, the dosa cooking, and the dosa going soft on the
// plate. No 3D in this file, so the models can be run and checked on their own with node.
// Anything marked "typical", "estimate" or "illustrative" is a mid-range value or a fitted constant.

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export function interp(tab, x) {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const [x0, y0] = tab[i - 1], [x1, y1] = tab[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
  return tab[tab.length - 1][1];
}

export const AMB = 30;            // °C, an Indian kitchen
export const L_VAP = 2.257e6;     // J/kg, water boiling at 100 °C
export const C_WATER = 4186;      // J/(kg·K)
export const SIGMA = 5.67e-8;     // W/(m²·K⁴), Stefan–Boltzmann constant

// ---------------------------------------------------------------- the batter
// Rounded composition of the dry grains, grams in 100 g: parboiled milled rice and dehusked black
// gram (urad dal), after the Indian Food Composition Tables 2017 (ICMR-NIN) and the USDA figures
// quoted on Wikipedia's Vigna mungo page. Rounded and labelled "about" (the same values IdliClear uses).
export const GRAIN = {
  rice: { n: 'Rice', starch: 77, protein: 8, fibre: 3, fat: 0.6, water: 10, other: 1.4 },
  dal: { n: 'Urad dal', starch: 47, protein: 24, fibre: 12, fat: 1.5, water: 10, other: 5.5 },
};
export const PARTS = [
  { k: 'water', n: 'Water', col: '#6fb6ff' },
  { k: 'starch', n: 'Starch', col: '#f4f1e8' },
  { k: 'protein', n: 'Protein', col: '#ffb547' },
  { k: 'fibre', n: 'Fibre and gum', col: '#8ef0c0' },
  { k: 'other', n: 'Fat, minerals, rest', col: '#c49bff' },
];
// ratio = parts of rice to one part of dal by weight (homes use about 3:1 for idli, 3:1 to 5:1 for
// dosa). water = share of water in the finished batter (idli batter about 0.66; dosa batter is
// thinned to about 0.70 so it flows; typical kitchen values).
export function batterMix(ratio, water) {
  const d = 1 / (1 + ratio), dry = 1 - water, o = {};
  for (const k of ['starch', 'protein', 'fibre']) o[k] = (GRAIN.rice[k] * (1 - d) + GRAIN.dal[k] * d) * dry / 0.9;
  o.water = water * 100;
  o.other = Math.max(0, 100 - o.water - o.starch - o.protein - o.fibre);
  return o;
}
// The ferment in one line (IdliClear owns the details). Measured on idli batter by Ghosh &
// Chattopadhyay 2011 (J. Food Sci. Technol. 48: 610) over 22 h at 20–26 °C: pH 5.9 → 4.2, density
// 0.93 → 0.59 g/cm³, volume ×1.62 to ×3.2. The curves below join those end points smoothly for a
// warm kitchen (about 30 °C); the shape is typical, not measured.
export const fermentPH = (h) => 4.3 + 1.6 * Math.exp(-Math.pow(Math.max(0, h) / 7, 1.6));
export const fermentRise = (h) => 1 + 1.2 * (1 - Math.exp(-Math.pow(Math.max(0, h) / 8, 2)));
// Gas held in the batter when it reaches the tawa. Dosa batter is stirred and thinned before use, so
// it carries far less gas than risen idli batter: about a quarter of its volume at most (estimate).
export const gasFrac = (h) => 0.04 + 0.24 * (1 - Math.exp(-Math.pow(Math.max(0, h) / 7, 1.5)));

// Flow. Idli and dosa batter is shear-thinning (pseudoplastic): viscosity = K × (shear rate)^(n−1).
// Ghosh & Chattopadhyay 2011 measured n from 0.21 to 0.86 and K from 0.38 to 5.06 Pa·sⁿ across
// blends and ferment times. We take n = 0.45 and K = 2.5 at 68% water as typical, and let extra water
// thin it (K falls e-fold for each 4.5 points of water: illustrative).
export const FLOW_N = 0.45;
export const batterK = (water) => 2.5 * Math.exp(-(water - 0.68) / 0.045);
export const viscosity = (shear, water) => batterK(water) * Math.pow(Math.max(0.01, shear), FLOW_N - 1);

// ---------------------------------------------------------------- the tawa
// A 30 cm flat griddle. Cast iron: about 6 mm thick, 3 kg, c = 460 J/kg·K, so it stores about
// 1.4 kJ for every degree. A thin non-stick aluminium tawa: about 0.7 kg, c = 900 J/kg·K.
// Thermal conductivity: cast iron about 52 W/m·K, aluminium about 200 (typical handbook values).
export const TAWAS = {
  iron: { n: 'Cast-iron tawa', short: 'Cast iron, 3 kg', m: 3.0, c: 460, k: 52, eps: 0.85 },
  thin: { n: 'Thin non-stick tawa', short: 'Thin aluminium, 0.7 kg', m: 0.7, c: 900, k: 200, eps: 0.8 },
};
export const R_TAWA = 0.15;                       // m
export const A_TAWA = Math.PI * R_TAWA * R_TAWA;  // m², 0.0707
// Share of the flame's heat that reaches a flat tawa (estimate; IS 4246 asks LPG stoves for about
// 68% in a pan-of-water test, and a dry tawa that runs far hotter than a pan of water does worse).
export const STOVE_ETA = 0.55;
// Heat the hot top face sheds: natural convection (about 10 W/m²K for a hot plate facing up) plus
// radiation, ε σ (T⁴ − T_room⁴).
export function tawaLoss(T, tw = TAWAS.iron) {
  const Tk = T + 273.15, Ta = AMB + 273.15;
  return A_TAWA * (10 * Math.max(0, T - AMB) + tw.eps * SIGMA * (Tk ** 4 - Ta ** 4));
}
export const tawaCap = (tw) => tw.m * tw.c;       // J/K
// One step of the empty (or loaded) tawa. P: flame power in W; load: heat drawn by food, W.
export function stepTawa(st, P, dt, tw = TAWAS.iron, load = 0) {
  st.inW = P * STOVE_ETA; st.lossW = tawaLoss(st.T, tw);
  st.T = clamp(st.T + ((st.inW - st.lossW - load) * dt) / tawaCap(tw), AMB, 420);
  st.t = (st.t || 0) + dt; st.gas = (st.gas || 0) + (P * dt) / 46e6;   // LPG: about 46 MJ/kg
  return st;
}
// The temperature an empty tawa settles at on a steady flame.
export function tawaSteady(P, tw = TAWAS.iron) {
  let a = AMB, b = 600;
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (tawaLoss(m, tw) < P * STOVE_ETA) a = m; else b = m; }
  return (a + b) / 2;
}
// Sprinkling water: m kg of water at room temperature takes c (100 − T) + L from the tawa.
export const waterCooling = (kg) => kg * (C_WATER * (100 - AMB) + L_VAP);   // J
// The working window for spreading a dosa. Kitchen guides and griddle makers quote anything from
// about 180 to 220 °C (typical; we found no primary measurement to cite, so treat the edges as soft).
// We end the window at the Leidenfrost point, 200 °C, so that it agrees with the cook's own test:
// once drops dance, the tawa is too hot to spread on and gets a wipe. Roasting after the spread
// can run hotter.
export const T_LO = 180, T_HI = 200;

// ---------------------------------------------------------------- a water drop on the tawa
// How long a small water drop lasts on a hot metal plate. The shape follows Jearl Walker's
// measurements ("Boiling and the Leidenfrost Effect", in Halliday & Resnick, Fundamentals of
// Physics): drops vanish in a second or two just above boiling, then, past the Leidenfrost point
// (about 200 °C on his plate; Wikipedia quotes about 193 °C for water on a pan), they float on their
// own vapour and last about a minute, a little less as the plate gets hotter still. The exact point
// moves with the surface: rough or porous metal raises it. The table is read off his graph, so the
// values are approximate.
export const LEIDENFROST = 200;
const LIFE = [[60, 60], [90, 20], [100, 12], [110, 5], [125, 2.2], [140, 1.3], [160, 0.9], [180, 1.2], [190, 6], [197, 35], [203, 62], [212, 70], [250, 63], [300, 54], [350, 46], [420, 40]];
export const dropLife = (T) => interp(LIFE, T);
// Vapour cushion under a floating drop: under 0.1 mm at its rim to about 0.2 mm in the middle (Walker).
export function dropRegime(T) {
  if (T < 100) return { k: 0, n: 'Too cold', d: 'The drop sits and slowly dries. Nothing sizzles.' };
  if (T < 190) return { k: 1, n: 'Sizzles and vanishes', d: 'The drop wets the iron, boils hard and is gone in a second or two.' };
  if (T < LEIDENFROST) return { k: 2, n: 'Spitting', d: 'Between the two: the drop touches, jumps and spits.' };
  return { k: 3, n: 'Dancing beads', d: 'The drop floats on its own steam and skitters about for up to a minute: the Leidenfrost effect.' };
}

// ---------------------------------------------------------------- the spread
// A ladle of V millilitres spread to a circle of radius R centimetres: thickness = V / (π R²).
export const filmThickness = (ml, Rcm) => (ml / (Math.PI * Rcm * Rcm)) * 10;      // mm
// The ladle's flat base (about 5 cm of it touches) walks an Archimedean spiral, r = pitch × turns.
export const PITCH = 0.04;   // m between rings (a 5 cm base with a little overlap)
export const LADLE_W = 0.05; // m
export function spiral(Rcm, speed) {
  const R = Rcm / 100, turns = R / PITCH, len = (Math.PI * R * R) / PITCH;
  return { turns, len, time: len / Math.max(0.01, speed) };
}
// How fast the bottom of the film sets. Wet batter touching hot iron takes heat very fast (boiling
// contact, about 1,500 W/m²K: estimate). A skin 0.25 mm thick must go from 30 to about 68 °C for its
// starch to gelatinise: ρ c δ ΔT = 1050 × 3500 × 0.00025 × 38 ≈ 35 kJ/m².
export const H_WET = 1500, SKIN_J = 1050 * 3500 * 0.00025 * 38;
export const skinSetTime = (T) => SKIN_J / (H_WET * Math.max(20, T - 60));     // s
export const ladleContact = (speed) => LADLE_W / Math.max(0.01, speed);       // s under the ladle's base
export function spreadOf(s) {
  const h = filmThickness(s.ml, s.R), sp = spiral(s.R, s.speed), shear = s.speed / (h / 1000);
  const rest = viscosity(1, s.water), under = viscosity(shear, s.water), set = skinSetTime(s.T), touch = ladleContact(s.speed);
  let verdict, d, ok = true;
  if (s.T < 150) { verdict = 'Sits wet'; d = 'The tawa is too cool. The batter spreads easily but soaks into the surface before it sets, and will stick.'; ok = false; }
  else if (set < touch) { verdict = 'Tears and clumps'; d = 'The bottom sets while the ladle is still on it, so the ladle drags the set skin along. Cool the tawa with a wipe, or move faster.'; ok = false; }
  else if (h < 0.8) { verdict = 'Paper thin'; d = 'Under 0.8 mm: paper roast territory. It will dry right through and turn crisp very fast.'; }
  else if (h < 1.6) { verdict = 'A crisp dosa'; d = 'About 1 mm: thin enough to dry into a crisp sheet, thick enough to lift in one piece.'; }
  else if (h < 3) { verdict = 'A soft dosa'; d = 'The top will stay moist and soft while the bottom browns: a home-style kal dosai.'; }
  else { verdict = 'Set dosa or uttapam'; d = 'So thick that it cooks like a pancake: spongy inside, and it needs a lid or a flip.'; }
  return { h, ...sp, shear, rest, under, set, touch, verdict, d, ok };
}

// ---------------------------------------------------------------- the cook
// One square metre of dosa film on the tawa, treated as a drying front that climbs from the iron:
//   below the front, a dry porous crust (conductivity about 0.2 W/m·K: estimate. Venkateshmurthy &
//   Raghavarao 2015, J. Food Sci. Technol. 52: 5357, measured 0.42 W/m·K for a whole dosa and found
//   conduction from the hot plate to be the main path of heat);
//   above it, wet batter that cannot pass 100 °C while it still holds water.
// Heat flux q = (T_tawa − T_wet) / (1/h_contact + crust thickness / k_crust). All of it, less a
// small loss from the top, boils water at 2,257 kJ/kg; the steam leaves through the holes the
// ferment's gas left. h_contact is about 500 W/m²K with a film of oil, about half that dry
// (estimate; pan-frying studies report a few hundred to about 1,200 W/m²K).
// Browning: a Maillard clock on the bottom skin, doubling for every 10 °C (Q10 = 2: typical for
// Maillard browning), tuned so a 1.5 mm dosa poured at 200 °C is golden in about a minute and a
// half. It runs faster with more ferment (more free sugars and amino acids) and with a pinch of
// sugar, chana dal or methi in the batter. A teaching model, not a measurement.
export const K_CRUST = 0.2, H_DRY = 500, C_BATTER = 3500, RHO_BATTER = 1080, SHRINK = 0.6;
export const A_DOSA = Math.PI * 0.13 * 0.13;        // m², a 26 cm dosa
export const B_PALE = 0.4, B_GOLD = 0.9, B_DARK = 1.7, B_BURNT = 2.5;
export const SHADES = [
  { n: 'pale', c: '#f3e7c4' }, { n: 'light gold', c: '#e8c36a' }, { n: 'golden brown', c: '#c8862a' }, { n: 'dark brown', c: '#6e3d16' }, { n: 'burnt', c: '#1d130c' },
];
export const shadeOf = (B) => SHADES[B < B_PALE ? 0 : B < B_GOLD ? 1 : B < B_DARK ? 2 : B < B_BURNT ? 3 : 4];
export const SURFACES = {
  seasoned: { n: 'Seasoned cast iron', grip: 0.25 },
  bare: { n: 'New, unseasoned iron', grip: 0.8 },
  nonstick: { n: 'Non-stick (PTFE)', grip: 0.05 },
};
export const chemOf = (ferment, extra) => clamp(0.6 + 0.04 * ferment, 0.6, 1.2) + (extra ? 0.35 : 0);
export const brownRate = (Tb, chem) => (chem / 30) * Math.pow(2, (Tb - 150) / 10);
// How hard the wet batter grips the surface (0 to 1, a rule of thumb). Bare iron grips wet starch
// and protein; a seasoned or oiled surface does not; a cool tawa lets batter soak in before it
// sets; a very hot one scorches it on.
export function gripOf(s) {
  const g = SURFACES[s.surface || 'seasoned'].grip - 0.25 * clamp(s.oil / 2, 0, 1) + 0.5 * clamp((165 - s.T0) / 40, 0, 1) + (s.T0 > 235 ? 0.2 : 0);
  return clamp(g, 0, 1);
}
export function freshDosa(s) {
  const phi = gasFrac(s.ferment), m = (RHO_BATTER * (1 - phi) * s.h) / 1000, w0 = m * s.water;
  return {
    t: 0, Ts: s.T0, T0: s.T0, Tf: AMB, Tb: AMB, w: w0, w0, solids: m - w0, m, h: s.h, phi, B: 0, x: 0, q: 0, steam: 0, on: true, tOff: null,
    hc: H_DRY * (0.5 + 0.5 * clamp(s.oil / 2, 0, 1)), chem: chemOf(s.ferment, s.extra), grip: gripOf(s),
    holes: clamp(phi * 0.9 + (s.water - 0.66) * 1.2, 0.02, 0.5), tGold: null, tCrisp: null,
  };
}
// One step. P = flame power (W). The tawa is the cast-iron one unless tw is given.
export function stepDosa(st, P, dt, tw = TAWAS.iron) {
  let load = 0;
  if (st.on) {
    const bound = 0.06 * st.solids;                      // water the dry crust keeps (about 6%: typical)
    st.x = clamp(1 - (st.w - bound) / (st.w0 - bound), 0, 1);
    const crust = (st.x * SHRINK * st.h) / 1000, Rth = 1 / st.hc + crust / K_CRUST;
    const q = Math.max(0, (st.Ts - st.Tf) / Rth), top = 15 * Math.max(0, st.Tf - AMB);
    if (st.Tf < 100 && st.w > bound) { st.Tf = Math.min(100, st.Tf + ((q - top) * dt) / (st.m * C_BATTER)); st.steam = 0; }
    else if (st.w > bound) { const ev = Math.max(0, q - top) / L_VAP; st.w = Math.max(bound, st.w - ev * dt); st.steam = ev; }
    else { st.steam = 0; st.Tf = Math.min(st.Ts, st.Tf + ((q - top) * dt) / Math.max(1e-6, (st.solids + st.w) * 1500)); }
    st.q = q; st.Tb = Math.max(st.Tf, st.Ts - q / st.hc);
    st.B += brownRate(st.Tb, st.chem) * clamp(st.x / 0.12, 0, 1) * dt;
    if (st.tGold === null && st.B >= B_GOLD) st.tGold = st.t;
    if (st.tCrisp === null && st.x >= 0.75) st.tCrisp = st.t;
    load = q * A_DOSA;
  } else { st.q = 0; st.steam = 0; }
  const tawa = { T: st.Ts }; stepTawa(tawa, P, dt, tw, load); st.Ts = tawa.T; st.inW = tawa.inW; st.lossW = tawa.lossW;
  st.t += dt;
  return st;
}
export const moistureOf = (st) => st.w / (st.w + st.solids);
export const crustMm = (st) => st.x * SHRINK * st.h;
export const dosaGrams = (st) => (st.w + st.solids) * A_DOSA * 1000;
// Is it stuck right now? Wet batter that grips stays put until a dry crust has formed under it.
// With a very high grip (bare iron and no oil) it never lets go in one piece.
export function stuckOf(st) { return st.grip >= 0.75 ? true : st.grip > 0.5 ? st.x < 0.6 : false; }
export const STAGES = [
  { n: 'Batter warming', d: 'The film heats to 100 °C in a few seconds. Its starch swells and sets (gelatinises) from the bottom up.', col: '#8ef0ff' },
  { n: 'Steaming', d: 'Water boils at the hot face and leaves as steam through the lace of holes. The wet part is pinned at 100 °C.', col: '#c49bff' },
  { n: 'Crust building', d: 'A dry crust grows up from the iron. With no water left to hold it down, the bottom gets hotter than 100 °C and starts to brown.', col: '#ffb547' },
  { n: 'Golden and crisp: lift it', d: 'A dry, glassy, golden sheet. The edges curl up off the tawa. Fold it and serve.', col: '#5ce1a9' },
  { n: 'Over-browned', d: 'Dark brown and turning bitter. The bottom is far above 150 °C with nothing left to cool it.', col: '#ff7a59' },
  { n: 'Burnt', d: 'Black and bitter. Scrape the tawa, wipe it, and start again.', col: '#ff4d4d' },
];
export function stageOf(st) {
  if (st.B >= B_BURNT) return 5;
  if (st.B >= B_DARK) return 4;
  if (st.B >= B_GOLD && st.x >= 0.75) return 3;
  if (st.Tf < 99.5) return 0;
  return st.x < 0.3 ? 1 : 2;
}
// What you would have on the plate if you lifted it now.
export function verdictOf(st) {
  const sh = shadeOf(st.B), stuck = stuckOf(st);
  let tex, col = '#e8eef8';
  if (st.Tf < 99 || st.x < 0.12) { tex = 'raw batter'; col = '#6fb6ff'; }
  else if (st.x < 0.5) tex = 'soft';
  else if (st.x < 0.75) tex = 'soft top, crisp base';
  else tex = 'crisp';
  let v = `${tex}, ${sh.n}`;
  if (st.B >= B_BURNT) { v = 'burnt'; col = '#ff4d4d'; }
  else if (st.B >= B_DARK) col = '#ff7a59';
  else if (st.x >= 0.75 && st.B >= B_GOLD) col = '#5ce1a9';
  else if (st.x >= 0.75 && st.B < B_PALE) { v = 'pale and leathery'; }
  return { text: v, col, stuck, tex, shade: sh };
}

// ---------------------------------------------------------------- crisp, then soft
// A crisp dosa is starch in its glassy state, and glass needs to be dry. Starchy snacks lose their
// snap when they take up water to a water activity of about 0.35–0.50 (Katz & Labuza 1981, J. Food
// Sci. 46: 403), which for a starch crust is roughly 9% moisture (typical sorption isotherm).
// The crust leaves the tawa at about 4% and drifts towards balance with the air touching it:
//   moisture(t) = m_eq − (m_eq − m0) exp(−t / τ), τ about 8 minutes for a 0.5 mm crust (illustrative).
// What matters is which air touches it. Flat on a steel plate, the dosa's own steam is trapped
// underneath: nearly 100% humid, m_eq about 25%. Rolled into a cone or stood up, both faces meet
// room air. Wrapped round hot potato masala, it also touches wet filling.
export const M0 = 4, M_SOFT = 9, TAU_SOFT = 480;
export const eqMoisture = (rh) => interp([[20, 3], [40, 6], [60, 9], [70, 11.5], [80, 14], [90, 19], [100, 25]], rh);
export const SERVES = {
  flat: { n: 'Flat on a steel plate', rh: () => 100, tau: 1 },
  cone: { n: 'Rolled and stood up', rh: (room) => room, tau: 1 },
  masala: { n: 'Folded round hot masala', rh: () => 100, tau: 0.45 },
};
export function softenAt(t, serve, room) {
  const sv = SERVES[serve] || SERVES.flat, meq = eqMoisture(sv.rh(room)), tau = TAU_SOFT * sv.tau;
  return meq - (meq - M0) * Math.exp(-t / tau);
}
export function crispTime(serve, room) {
  const sv = SERVES[serve] || SERVES.flat, meq = eqMoisture(sv.rh(room)), tau = TAU_SOFT * sv.tau;
  if (meq <= M_SOFT) return Infinity;
  return -tau * Math.log((meq - M_SOFT) / (meq - M0));
}
// Why the first dosa fails: the tawa is not yet evenly hot, and its surface has no fresh film of
// oil. Each dosa leaves a little oil behind and evens the heat. A rule of thumb, not a measurement:
// the grip starts at the surface's own value plus 0.45 for a cold, dry start, and that extra halves
// with every dosa.
export const gripOfNth = (surface, n) => clamp(SURFACES[surface].grip + 0.45 * Math.pow(0.5, n - 1) - 0.25 * (n > 1 ? 1 : 0.4), 0, 1);

// ---------------------------------------------------------------- the family
// x: how the batter is made (0 = rice and urad fermented overnight … 1 = no ferment at all).
// mm: typical thickness. All values are typical kitchen figures, not standards.
export const FAMILY = [
  { id: 'paper', n: 'Paper roast', x: 0.04, mm: 0.5, cm: 60, col: '#d9952f', batter: 'Rice and urad, more rice, fermented', how: 'Spread very thin on a big hotel tawa, roasted with oil until it is one dry, crisp sheet. Rolled or stood up so it stays crisp.', from: 'Restaurants across south India' },
  { id: 'ghee', n: 'Ghee roast', x: 0.31, mm: 0.8, cm: 40, col: '#cf8a2a', batter: 'Rice and urad, fermented', how: 'Thin, roasted in ghee to a deep gold, often served as a tall cone.', from: 'Karnataka and Tamil Nadu' },
  { id: 'plain', n: 'Sada dosa', x: 0.15, mm: 1.3, cm: 26, col: '#dba23c', batter: 'Rice and urad, about 3:1 to 5:1, fermented overnight', how: 'A ladle of batter spiralled out to about a millimetre. Crisp base, soft top, folded in half.', from: 'All of south India' },
  { id: 'masala', n: 'Masala dosa', x: 0.45, mm: 1.2, cm: 30, col: '#c98428', batter: 'Rice and urad, fermented; often a little chana dal or methi for colour', how: 'A crisp dosa folded round potato palya. Mysore masala adds a smear of red chilli-garlic chutney inside.', from: 'Udupi hotels; Mysuru, Bengaluru, Chennai' },
  { id: 'benne', n: 'Benne dose', x: 0.5, mm: 2.2, cm: 18, col: '#e0b050', batter: 'Rice, urad and puffed rice (mandakki), fermented', how: 'Small and thick, cooked with a generous lump of white butter (benne): crisp outside, soft inside.', from: 'Davanagere, Karnataka' },
  { id: 'set', n: 'Set dosa', x: 0.08, mm: 4, cm: 14, col: '#ecd9a0', batter: 'Rice, urad and poha, well fermented', how: 'Poured, barely spread, cooked under a lid. Soft and spongy, served in a set of two or three.', from: 'Karnataka' },
  { id: 'uttapam', n: 'Uttapam', x: 0.26, mm: 6, cm: 16, col: '#e8cf8c', batter: 'Rice and urad, fermented, often a day older and sourer', how: 'A thick pancake with onion, tomato and chilli pressed into the top, flipped once.', from: 'Tamil Nadu and beyond' },
  { id: 'ragi', n: 'Ragi dosa', x: 0.64, mm: 1.5, cm: 24, col: '#7a4a3a', batter: 'Finger millet (ragi) with urad or rice; fermented or instant', how: 'Spread like a plain dosa. The millet gives the brown-red colour.', from: 'Karnataka and Tamil Nadu' },
  { id: 'adai', n: 'Adai', x: 0.7, mm: 3, cm: 20, col: '#c9a04a', batter: 'Rice with a mix of dals (toor, chana, urad), ground coarse; little or no ferment', how: 'Thick, coarse and filling, cooked slowly with oil. Eaten with avial or jaggery.', from: 'Tamil Nadu' },
  { id: 'pesarattu', n: 'Pesarattu', x: 0.8, mm: 2, cm: 24, col: '#9aa84e', batter: 'Whole green gram (pesalu), soaked and ground with ginger and chilli; not fermented', how: 'Spread thin like a dosa, topped with onion. Served with ginger chutney, sometimes with upma inside.', from: 'Andhra Pradesh' },
  { id: 'neer', n: 'Neer dosa', x: 0.9, mm: 1, cm: 22, col: '#f6f1e4', batter: 'Rice only, ground with a lot of water (neer means water); not fermented', how: 'Poured and swirled, covered, never browned: soft, white and lacy.', from: 'Tulu Nadu, coastal Karnataka' },
  { id: 'rava', n: 'Rava dosa', x: 1.0, mm: 0.5, cm: 30, col: '#d8a044', batter: 'Semolina (rava), rice flour and a little maida in a very thin batter; not fermented', how: 'Poured from a height, not spread. The watery batter runs into a net of holes and roasts crisp.', from: 'Udupi hotels across India' },
];
