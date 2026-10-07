import { state, patch } from "./db.js";
import { $, app, bar, esc, shuf } from "./ui.js";
const norm = s => String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// mode : fwd (caractère → réponse), rev (réponse → caractère), type (réponse écrite)
export function seriesQuiz(cat, s, mode) {
  const all = state.content[cat].series.flatMap(x => x.items), it = s.items, n = Math.max(5, Math.min(10, it.length * 2));
  const disp = x => cat === 'kanji' ? x.b : x.b.toUpperCase();
  let list = []; while (list.length < n) list.push(...shuf(it)); list = list.slice(0, n);
  return list.map(x => {
    const o = shuf([x, ...shuf(all.filter(y => y.f !== x.f)).slice(0, 3)]);
    if (mode === 'rev') return { big: disp(x), q: 'Quel caractère correspond ?', o: o.map(y => y.f), a: x.f };
    if (mode === 'type') return { big: x.f, q: 'Écris la réponse', type: 1, a: disp(x), alt: x.alt || [x.b] };
    return { big: x.f, q: 'Quelle est la bonne réponse ?', o: o.map(disp), a: disp(x) };
  });
}
export function courseQuiz(c) {
  const V = c.sections.flatMap(s => s.v || []), all = [...new Set(state.content.courses.list.flatMap(x => x.sections.flatMap(s => (s.v || []).map(r => r[2]))))];
  const qs = shuf(V).slice(0, 10).map(r => ({ big: r[0], q: 'Que signifie cette expression ?', a: r[2], o: shuf([r[2], ...shuf(all.filter(x => x !== r[2])).slice(0, 3)]) }));
  (c.q || []).forEach(x => qs.push({ big: '', q: x[0], o: shuf(x.slice(1)), a: x[1] }));
  return shuf(qs);
}
let Q;
export function runQuiz(qs, meta) { Q = { qs, meta, i: 0, ok: 0, bad: [] }; ask(); }
function ask() {
  const q = Q.qs[Q.i]; Q.locked = 0;
  app(`${bar(Q.i / Q.qs.length * 100)}<p class="sub">Question ${Q.i + 1} / ${Q.qs.length}</p><div class="big ${q.big.length > 3 ? 'sm' : ''}">${esc(q.big)}</div><h3 class="c">${esc(q.q)}</h3>` +
    (q.type ? `<div class="row"><input id="ans" autocomplete="off"><button class="btn red" id="ok">Valider</button></div>` : `<div class="opts">${q.o.map((o, j) => `<button data-j="${j}">${'ABCD'[j]}. ${esc(o)}</button>`).join('')}</div>`) + `<div id="fb" class="c"></div>`);
  if (q.type) { const f = () => done($('#ans').value); $('#ok').onclick = f; $('#ans').onkeydown = e => e.key === 'Enter' && f(); $('#ans').focus(); }
  else document.querySelectorAll('[data-j]').forEach(b => b.onclick = () => done(q.o[b.dataset.j]));
}
function done(v) {
  if (Q.locked) return; Q.locked = 1;
  const q = Q.qs[Q.i], ok = q.type ? [q.a, ...(q.alt || [])].some(x => norm(x) === norm(v)) : v === q.a;
  document.querySelectorAll('.opts button').forEach(b => { b.disabled = true; const t = q.o[b.dataset.j]; if (t === q.a) b.classList.add('good'); else if (t === v) b.classList.add('bad'); });
  if (q.type) $('#ans').disabled = $('#ok').disabled = true;
  ok ? Q.ok++ : Q.bad.push(q);
  $('#fb').innerHTML = `<p class="${ok ? 'g' : 'r'}">${ok ? '✅ Correct !' : '❌ Incorrect — réponse : ' + esc(q.a)}</p><button class="btn red" id="nx">Suivant</button>`;
  $('#nx').onclick = () => { Q.i++; Q.i < Q.qs.length ? ask() : end(); }; $('#nx').focus();
}
async function end() {
  const t = Q.qs.length, pct = Math.round(Q.ok / t * 100), m = state.me, thr = state.content.config.unlock ?? 80, id = Q.meta.id;
  const p = { quizzes: m.quizzes + 1, correct: m.correct + Q.ok, total: m.total + t, xp: m.xp + Q.ok * 10, lastQuiz: { label: Q.meta.label, pct, date: Date.now() } };
  let unlocked = false;
  if (id) { const o = (m.progress || {})[id] || { best: 0, att: 0 }; p['progress.' + id] = { best: Math.max(o.best, pct), att: o.att + 1, last: pct, date: Date.now() }; unlocked = o.best < thr && pct >= thr; }
  let saved = true; try { await patch(p); } catch (e) { saved = false; console.error(e); }
  app(`<h1>🎉 Résultat</h1><div class="big">${Q.ok} / ${t}</div><h2 class="c" style="border:0">${pct} %</h2>
  <p class="c">${!saved ? '⚠️ Résultat non sauvegardé (vérifie les règles Firestore).' : unlocked ? '🔓 Série validée : la suivante est débloquée !' : id && pct < thr ? `Il faut ${thr} % pour valider la série.` : 'Résultat enregistré.'}</p>
  ${Q.bad.length ? `<h3>À revoir</h3><div class="chips">${Q.bad.map(q => `<span><b>${esc(q.big || '?')}</b>${esc(q.a)}</span>`).join('')}</div>` : '<p class="c">Sans faute, bravo !</p>'}
  <div class="row"><button class="btn red" id="again">Rejouer</button><a class="btn" href="${Q.meta.back}">Retour</a></div>`);
  $('#again').onclick = Q.meta.again;
}
