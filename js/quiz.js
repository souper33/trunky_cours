import { state, patch, syncBoard } from "./db.js";
import { info, ymd } from "./levels.js";
import { $, app, bar, esc, shuf } from "./ui.js";
const norm = s => String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// mode : fwd (caractère → réponse), rev (réponse → caractère), type (réponse écrite)
export function seriesQuiz(cat, s, mode) {
  const all = state.content[cat].series.flatMap(x => x.items), it = s.items, n = mode === 'speak' ? 5 : Math.max(5, Math.min(10, it.length * 2));
  const disp = x => cat === 'kanji' ? x.b : x.b.toUpperCase();
  let list = []; while (list.length < n) list.push(...shuf(it)); list = list.slice(0, n);
  return list.map(x => {
    const o = shuf([x, ...shuf(all.filter(y => y.f !== x.f)).slice(0, 3)]);
    if (mode === 'listen') return { big: '🔊', q: 'Quel son entends-tu ?', say: x.f, o: o.map(disp), a: disp(x) };
    if (mode === 'speak') return { big: x.f, q: 'Écoute, puis prononce', say: x.f, speak: 1, a: x.f };
    if (mode === 'rev') return { big: disp(x), q: 'Quel caractère correspond ?', o: o.map(y => y.f), a: x.f };
    if (mode === 'type') return { big: x.f, q: 'Écris la réponse', type: 1, a: disp(x), alt: x.alt || [x.b] };
    return { big: x.f, q: 'Quelle est la bonne réponse ?', o: o.map(disp), a: disp(x) };
  });
}
const vq = (r, all) => ({ big: r[0], q: 'Que signifie cette expression ?', a: r[2], o: shuf([r[2], ...shuf(all.filter(x => x !== r[2])).slice(0, 3)]) });
const cq = x => ({ big: '', q: x[0], o: shuf(x.slice(1)), a: x[1] });
const vocab = L => L.flatMap(c => c.sections.flatMap(s => s.v || []));
const meanings = () => [...new Set(vocab(state.content.courses.list).map(r => r[2]))];
// Prononciation du vocabulaire d'un cours (les expressions avec ○○ sont ignorées)
export function pronQuiz(c) { return shuf(vocab([c]).filter(r => !r[0].includes('○'))).slice(0, 6).map(r => ({ big: r[0], q: 'Écoute, puis prononce : ' + r[2], say: r[0], speak: 1, a: r[0] })); }
// Quiz d'un cours : jusqu'à 12 questions de cours + 8 de vocabulaire
export function courseQuiz(c) { const all = meanings(); return shuf([...shuf(c.q || []).slice(0, 12).map(cq), ...shuf(vocab([c])).slice(0, 8).map(r => vq(r, all))]); }
// Quiz mélangeant tous les cours (20 questions)
export function allQuiz() { const L = state.content.courses.list, all = meanings(); return shuf([...shuf(L.flatMap(c => c.q || [])).slice(0, 14).map(cq), ...shuf(vocab(L)).slice(0, 6).map(r => vq(r, all))]); }
export function say(t) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(t); u.lang = 'ja-JP'; u.rate = .8;
  const v = speechSynthesis.getVoices().find(x => x.lang.replace('_', '-').startsWith('ja')); if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
const kn = t => [...t].map(c => c >= 'ァ' && c <= 'ヶ' ? String.fromCharCode(c.charCodeAt(0) - 96) : c).join('').replace(/[\s、。ー!?！？]/g, '');
function mic(q) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, fb = $('#fb');
  const self = () => { fb.innerHTML = '<p>Répète à voix haute, puis évalue-toi :</p><div class="row" style="justify-content:center"><button id="y">✅ Bien dit</button><button id="n">❌ À revoir</button></div>'; $('#y').onclick = () => done(null, true); $('#n').onclick = () => done(null, false); };
  if (!SR) { $('#mic').hidden = true; self(); return; }   // navigateur sans micro : auto-évaluation
  const start = () => {
    const r = new SR(); r.lang = 'ja-JP'; r.maxAlternatives = 5; fb.textContent = '🎤 Je t\'écoute…';
    r.onresult = e => {
      const alts = [...e.results[0]].map(x => x.transcript);
      if (alts.some(t => kn(t).includes(kn(q.say)))) return done(null, true);
      fb.innerHTML = `<p class="r">J'ai entendu : ${esc(alts[0])}</p><div class="row" style="justify-content:center"><button id="rt">Réessayer</button><button id="y">✅ C'était bon</button><button id="n">Passer ❌</button></div>`;
      $('#rt').onclick = start; $('#y').onclick = () => done(null, true); $('#n').onclick = () => done(null, false);
    };
    r.onerror = self; r.start();
  };
  $('#mic').onclick = start;
}
let Q;
export function runQuiz(qs, meta) { Q = { qs, meta, i: 0, ok: 0, bad: [] }; ask(); }
function ask() {
  const q = Q.qs[Q.i]; Q.locked = 0;
  app(`${bar(Q.i / Q.qs.length * 100)}<p class="sub">Question ${Q.i + 1} / ${Q.qs.length}</p><div class="big ${q.big.length > 3 ? 'sm' : ''}">${esc(q.big)}</div><h3 class="c">${esc(q.q)}</h3>${q.say ? `<div class="row" style="justify-content:center"><button id="say">🔊 Écouter</button>${q.speak ? '<button class="btn red" id="mic">🎤 Parler</button>' : ''}</div>` : ''}` +
    (q.speak ? '' : q.type ? `<div class="row"><input id="ans" autocomplete="off"><button class="btn red" id="ok">Valider</button></div>` : `<div class="opts">${q.o.map((o, j) => `<button data-j="${j}">${'ABCD'[j]}. ${esc(o)}</button>`).join('')}</div>`) + `<div id="fb" class="c"></div>`);
  if (q.type) { const f = () => done($('#ans').value); $('#ok').onclick = f; $('#ans').onkeydown = e => e.key === 'Enter' && f(); $('#ans').focus(); }
  else document.querySelectorAll('[data-j]').forEach(b => b.onclick = () => done(q.o[b.dataset.j]));
  if (q.say) { say(q.say); $('#say').onclick = () => say(q.say); if (q.speak) mic(q); }
}
function done(v, force) {
  if (Q.locked) return; Q.locked = 1;
  const q = Q.qs[Q.i], ok = force !== undefined ? force : q.type ? [q.a, ...(q.alt || [])].some(x => norm(x) === norm(v)) : v === q.a;
  document.querySelectorAll('.opts button').forEach(b => { b.disabled = true; const t = q.o[b.dataset.j]; if (t === q.a) b.classList.add('good'); else if (t === v) b.classList.add('bad'); });
  if (q.type) $('#ans').disabled = $('#ok').disabled = true;
  if ($('#mic')) $('#mic').disabled = true;
  ok ? Q.ok++ : Q.bad.push(q);
  $('#fb').innerHTML = `<p class="${ok ? 'g' : 'r'}">${ok ? '✅ Correct !' : '❌ Incorrect — réponse : ' + esc(q.a)}</p><button class="btn red" id="nx">Suivant</button>`;
  $('#nx').onclick = () => { Q.i++; Q.i < Q.qs.length ? ask() : end(); }; $('#nx').focus();
}
async function end() {
  const t = Q.qs.length, pct = Math.round(Q.ok / t * 100), m = state.me, thr = state.content.config.unlock ?? 80, id = Q.meta.id;
  const fl = Q.meta.fl || 1, mult = [1, 1.5, 2][fl - 1], perfect = Q.ok === t, today = ymd(0);
  const streak = m.lastDay === today ? (m.streak || 1) : m.lastDay === ymd(-1) ? (m.streak || 0) + 1 : 1, sb = Math.min(streak, 10) * 5;
  const gain = Math.round((Math.round(Q.ok * 10 * mult) + (perfect ? 20 : 0)) * (1 + sb / 100)), xp = m.xp + gain, l0 = info(m.xp), l1 = info(xp);
  const p = { quizzes: m.quizzes + 1, correct: m.correct + Q.ok, total: m.total + t, xp, streak, lastDay: today, lastQuiz: { label: Q.meta.label, pct, date: Date.now() } };
  let unlocked = false;
  if (id) { const o = (m.progress || {})[id] || { best: 0, att: 0 }; p['progress.' + id] = { best: Math.max(o.best, pct), att: o.att + 1, last: pct, date: Date.now() }; unlocked = !Q.meta.course && o.best < thr && pct >= thr; }
  let saved = true; try { await patch(p); syncBoard().catch(() => {}); } catch (e) { saved = false; console.error(e); }
  app(`<h1>🎉 Résultat</h1><div class="big">${Q.ok} / ${t}</div><h2 class="c" style="border:0">${pct} %</h2>
  <p class="c"><b>+${gain} XP</b><br><small>difficulté ${'🔥'.repeat(fl)} ×${mult}${perfect ? ' · sans faute +20' : ''}${sb ? ` · flamme ${streak} j +${sb} %` : ''}</small></p>
  ${l1.l > l0.l ? `<div class="card c">⬆️ <b>Niveau ${l1.l}</b> — ${l1.t} ${l1.jp}</div>` : ''}
  <p class="c">${!saved ? '⚠️ Résultat non sauvegardé (vérifie les règles Firestore).' : unlocked ? '🔓 Série validée : la suivante est débloquée !' : id && !Q.meta.course && pct < thr ? `Il faut ${thr} % pour valider la série.` : 'Résultat enregistré.'}</p>
  ${Q.bad.length ? `<h3>À revoir</h3><div class="chips">${Q.bad.map(q => `<span><b>${esc(q.big || '?')}</b>${esc(q.a)}</span>`).join('')}</div>` : '<p class="c">Sans faute, bravo !</p>'}
  <div class="row"><button class="btn red" id="again">Rejouer</button><a class="btn" href="${Q.meta.back}">Retour</a></div>`);
  $('#again').onclick = Q.meta.again;
}
