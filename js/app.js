import { auth, A, db, F } from "./firebase.js";
import { info, flame } from "./levels.js";
import { state, loadContent, loadMe, tmp, patch, syncBoard, savePdf, pdfUrl, delPdf, saveCourses } from "./db.js";
import { $, app, bar, esc } from "./ui.js";
import { runQuiz, seriesQuiz, courseQuiz, allQuiz, pronQuiz } from "./quiz.js";
import { adminPage } from "./admin.js";

const CATS = [['hiragana', 'Hiragana', '🟢'], ['katakana', 'Katakana', '🔵'], ['kanji', 'Kanji', '🟠']];
const ICON = { done: '✅', doing: '🟡', open: '⚪', locked: '🔒' }, LBL = { done: 'terminée', doing: 'en cours', open: 'disponible', locked: 'verrouillée' };
const pr = id => (state.me.progress || {})[id] || { best: 0, att: 0 };
const thr = () => state.content.config.unlock ?? 80;
const status = (cat, i) => { const s = state.content[cat].series, p = pr(s[i].id); if (p.best >= thr()) return 'done'; if (i > 0 && pr(s[i - 1].id).best < thr()) return 'locked'; return p.att ? 'doing' : 'open'; };
const catPct = cat => { const s = state.content[cat].series; return s.length ? Math.round(s.filter(x => pr(x.id).best >= thr()).length / s.length * 100) : 0; };
const nextHref = () => { for (const [c] of CATS) { const ss = state.content[c].series; for (let i = 0; i < ss.length; i++) { const st = status(c, i); if (st === 'open' || st === 'doing') return `#/series/${c}/${ss[i].id}`; } } return '#/courses'; };

/* ---------- Connexion ---------- */
function authPage() {
  app(`<h1>🇯🇵 日本語</h1><div class="card narrow"><div class="row"><button id="tl">Connexion</button><button id="tr">Inscription</button></div><div id="msg" class="msg"></div>
  <input id="nm" placeholder="Pseudo (2-20 caractères)" hidden><input id="em" type="email" placeholder="Email"><input id="pw" type="password" placeholder="Mot de passe (6 min.)">
  <div class="row"><button class="btn red" id="go">Se connecter</button><button id="gg">Continuer avec Google</button></div><a href="#" id="rs">Mot de passe oublié ?</a></div>`);
  let reg = false; const msg = t => $('#msg').textContent = t;
  const mode = r => { reg = r; $('#nm').hidden = !r; $('#go').textContent = r ? 'Créer mon compte' : 'Se connecter'; };
  $('#tl').onclick = () => mode(false); $('#tr').onclick = () => mode(true);
  const err = e => msg(({ 'auth/invalid-credential': 'Identifiants incorrects.', 'auth/email-already-in-use': 'Email déjà utilisé.', 'auth/weak-password': 'Mot de passe trop faible.', 'auth/invalid-email': 'Email invalide.', 'auth/too-many-requests': 'Trop de tentatives, réessaie plus tard.', 'auth/popup-closed-by-user': '' })[e.code] ?? 'Erreur : ' + (e.code || e.message));
  $('#go').onclick = async () => {
    const em = $('#em').value.trim(), pw = $('#pw').value; if (!em || !pw) return msg('Remplis tous les champs.');
    try {
      if (reg) { const n = $('#nm').value.trim(); if (n.length < 2 || n.length > 20) return msg('Pseudo : 2 à 20 caractères.'); tmp.name = n; await A.createUserWithEmailAndPassword(auth, em, pw); }
      else await A.signInWithEmailAndPassword(auth, em, pw);
    } catch (e) { err(e); }
  };
  $('#gg').onclick = () => A.signInWithPopup(auth, new A.GoogleAuthProvider()).catch(err);
  $('#rs').onclick = async e => { e.preventDefault(); const em = $('#em').value.trim(); if (!em) return msg("Saisis ton email d'abord."); try { await A.sendPasswordResetEmail(auth, em); msg('Email de réinitialisation envoyé.'); } catch (x) { err(x); } };
}

/* ---------- Niveau, classement ---------- */
function levelCard(m) {
  const i = info(m.xp), f = flame(m);
  return `<div class="card"><b>Niv. ${i.l} · ${i.t}</b> <span class="jp">${i.jp}</span>${f ? ` <span class="r">🔥 ${f} jour${f > 1 ? 's' : ''}</span>` : ''}${bar(i.pct)}<small>${m.xp} XP · encore ${i.next} XP pour le niveau ${i.l + 1}</small></div>`;
}
const updateChip = () => { const i = info(state.me.xp), f = flame(state.me); $('#chip').textContent = `Niv. ${i.l}${f ? ' 🔥' + f : ''}`; };
async function rankingPage() {
  app('<p class="c">Chargement…</p>');
  try {
    const rows = (await F.getDocs(F.query(F.collection(db, 'jp_board'), F.orderBy('xp', 'desc'), F.limit(20)))).docs.map(d => ({ id: d.id, ...d.data() }));
    app(`<h2>🏆 Classement général</h2><p class="sub">Top 20 · XP gagnés en quiz</p>` + (rows.map((r, i) => { const l = info(r.xp), f = flame(r);
      return `<div class="card row${r.id === state.uid ? ' me' : ''}"><b style="width:2.2em">${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'}</b><span style="flex:1"><b>${esc(r.name)}</b><small>Niv. ${l.l} · ${l.t} ${l.jp}</small></span><span><b>${r.xp}</b> XP${f ? ` 🔥${f}` : ''}</span></div>`; }).join('') || '<p class="c">Personne au classement : fais un quiz !</p>'));
  } catch (e) { app(`<p class="r">Erreur : ${esc(e.code || e.message)}</p><p class="c">As-tu republié firestore.rules ?</p>`); }
}

/* ---------- Tableau de bord ---------- */
function dash() {
  const m = state.me, g = Math.round(CATS.reduce((a, c) => a + catPct(c[0]), 0) / 3), lc = state.content.courses.list.find(c => c.n === m.lastCourse);
  app(`<h1>Bonjour ${esc(m.name)} 👋</h1><p class="sub">Continue ton apprentissage du japonais !</p>${levelCard(m)}
  <div class="card"><b>Progression globale : ${g} %</b>${bar(g)}${CATS.map(c => `<p>${c[2]} ${c[1]} : ${catPct(c[0])} %${bar(catPct(c[0]))}</p>`).join('')}</div>
  <div class="grid2"><div class="card"><small>Dernier cours</small>${lc ? `<a href="#/course/${lc.n}">Cours ${lc.n} — ${esc(lc.title)}</a>` : '—'}</div>
  <div class="card"><small>Dernier quiz</small>${m.lastQuiz ? `${esc(m.lastQuiz.label)} : <b>${m.lastQuiz.pct} %</b>` : '—'}</div></div>
  <div class="card">Quiz réalisés : <b>${m.quizzes}</b> · Réussite : <b>${m.total ? Math.round(m.correct / m.total * 100) : 0} %</b> · XP : <b>${m.xp}</b></div>
  <div class="row"><a class="btn red" href="${nextHref()}">Continuer →</a></div>`);
}

/* ---------- Cours ---------- */
function coursesPage() {
  const L = state.content.courses.list, lv = [...new Set(L.map(c => c.level || 'Débutant'))];
  app(`<h2>📚 Cours</h2>` + lv.map(l => `<h3>${esc(l)}</h3>` + L.filter(c => (c.level || 'Débutant') === l).map(c => `<a class="card" href="#/course/${c.n}">${state.me.courses?.[c.n] ? '✅' : '📘'} <b>Cours ${c.n}</b> — ${esc(c.title)}</a>`).join('')).join(''));
}
function coursePage(n) {
  const L = state.content.courses.list, c = L.find(x => x.n === n); if (!c) { location.hash = '#/courses'; return; }
  if (state.me.lastCourse !== n) patch({ lastCourse: n }).catch(() => {});
  const nx = L.find(x => x.n === n + 1);
  app(`<h2>Cours ${n} — ${esc(c.title)}</h2><div class="row"><button id="rv">👁 Mode révision</button><button id="cq">📝 Quiz du cours</button><button id="cp">🎤 Prononciation</button></div>` +
    c.sections.map(s => `<section><h3>${esc(s.t)}</h3>${s.h || ''}${s.v ? `<table><tr><th>Japonais<th>Romaji<th>Français</tr>${s.v.map(r => `<tr><td class="jp">${esc(r[0])}<td class="h">${esc(r[1])}<td class="h">${esc(r[2])}</tr>`).join('')}</table>` : ''}</section>`).join('') +
    `<h3>📄 Documents PDF</h3>${(c.pdfs || []).length ? '' : '<p class="sub">Aucun PDF pour ce cours.</p>'}${(c.pdfs || []).map((p, i) => `<div class="row"><button data-pdf="${p.id}">📄 ${esc(p.name)}</button>${state.me.isAdmin ? `<button data-del="${i}">🗑</button>` : ''}</div>`).join('')}${state.me.isAdmin ? `<label class="btn">➕ Ajouter un PDF (3 Mo max)<input id="up" type="file" accept="application/pdf" hidden></label>` : ''}<div id="pv"></div>` +
    `<div class="row"><button class="btn red" id="fin">${state.me.courses?.[n] ? 'Cours terminé ✅' : 'Terminer ce cours'}${nx ? ' → suivant' : ''}</button></div>`);
  $('#rv').onclick = () => document.body.classList.toggle('rev');
  $('#cq').onclick = () => playCourse(n, '#/course/' + n);
  $('#cp').onclick = () => { const go = () => { const qs = pronQuiz(c); if (qs.length) runQuiz(qs, { course: 1, fl: 3, label: 'Prononciation · Cours ' + n, back: '#/course/' + n, again: go }); }; go(); };
  const pv = $('#pv');
  document.querySelectorAll('[data-pdf]').forEach(b => b.onclick = async () => {
    const p = c.pdfs.find(x => x.id === b.dataset.pdf); pv.innerHTML = '<p class="c">Chargement du PDF…</p>';
    try { const u = await pdfUrl(p); pv.innerHTML = `<iframe src="${u}" title="${esc(p.name)}"></iframe><p class="c"><a href="${u}" target="_blank">Ouvrir dans un onglet</a> · <a href="${u}" download="${esc(p.name)}">Télécharger</a></p>`; }
    catch (e) { pv.innerHTML = '<p class="r">Impossible de charger le PDF.</p>'; }
  });
  if (state.me.isAdmin) {
    $('#up').onchange = async e => {
      const f = e.target.files[0]; if (!f) return; if (f.size > 3e6) { alert('PDF trop lourd (3 Mo max).'); return; }
      pv.innerHTML = '<p class="c">Envoi en cours…</p>';
      try { const p = await savePdf(f); (c.pdfs = c.pdfs || []).push(p); await saveCourses(); coursePage(n); }
      catch (x) { pv.innerHTML = `<p class="r">Erreur : ${esc(x.code || x.message)}</p>`; }
    };
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!confirm('Supprimer ce PDF ?')) return; const i = +b.dataset.del;
      try { await delPdf(c.pdfs[i]); c.pdfs.splice(i, 1); await saveCourses(); coursePage(n); } catch (x) { alert('Erreur : ' + (x.code || x.message)); }
    });
  }
  $('#fin').onclick = async () => { await patch({ ['courses.' + n]: true }).catch(() => {}); location.hash = nx ? '#/course/' + (n + 1) : '#/courses'; };
}
function playCourse(n, back) {
  const c = state.content.courses.list.find(x => x.n === n); if (!c) { location.hash = '#/quiz'; return; }
  const go = () => runQuiz(courseQuiz(c), { id: 'cours_' + n, course: 1, fl: 2, label: 'Cours ' + n, back, again: go }); go();
}
function coursesQuizPage() {
  const L = state.content.courses.list;
  app(`<h2>📚 Quiz des cours</h2><div class="row"><button class="btn red" id="qa">🎲 Quiz de tous les cours</button></div>` + L.map(c => { const p = pr('cours_' + c.n);
    return `<a class="card" href="#/coursequiz/${c.n}">📘 <b>Cours ${c.n}</b> — ${esc(c.title)}<small>${(c.q || []).length} questions + vocabulaire${p.att ? ` · meilleur ${p.best} %` : ''}</small></a>`; }).join(''));
  const goAll = () => runQuiz(allQuiz(), { course: 1, fl: 2, label: 'Tous les cours', back: '#/cat/cours', again: goAll });
  $('#qa').onclick = goAll;
}
document.addEventListener('click', e => e.target.classList.contains('h') && e.target.classList.toggle('on'));

/* ---------- Quiz : catégories, séries ---------- */
function seriesList(cat) {
  return state.content[cat].series.map((s, i) => {
    const st = status(cat, i), p = pr(s.id), chars = s.items.map(x => x.f).join(' ');
    return st === 'locked' ? `<div class="card locked">${ICON[st]} ${esc(s.name)} <span class="jp">${esc(chars)}</span><small>Verrouillée : réussis ${thr()} % à la série précédente</small></div>`
      : `<a class="card" href="#/series/${cat}/${s.id}">${ICON[st]} <b>${esc(s.name)}</b> <span class="jp">${esc(chars)}</span><small>${LBL[st]}${p.att ? ` · meilleur ${p.best} % · ${p.att} essai(s)` : ''}</small></a>`;
  }).join('');
}
const quizHome = () => app(`<h2>📝 Quiz</h2>` + CATS.map(c => `<a class="card" href="#/cat/${c[0]}">${c[2]} <b>${c[1].toUpperCase()}</b><small>${state.content[c[0]].series.length} séries · ${catPct(c[0])} % validé</small></a>`).join('') + `<a class="card" href="#/cat/cours">📚 <b>COURS</b><small>${state.content.courses.list.length} cours · quiz de révision</small></a>`);
const catPage = cat => CATS.some(c => c[0] === cat) ? app(`<h2>${CATS.find(c => c[0] === cat)[2]} ${CATS.find(c => c[0] === cat)[1]}</h2>${seriesList(cat)}`) : quizHome();
function seriesPage(cat, id) {
  const s = state.content[cat]?.series.find(x => x.id === id); if (!s) { location.hash = '#/quiz'; return; }
  const k = cat === 'kanji', label = `${CATS.find(c => c[0] === cat)[1]} · ${s.name}`;
  const M = [['fwd', k ? 'Kanji → sens' : 'Caractère → romaji', 1], ['rev', k ? 'Sens → kanji' : 'Romaji → caractère', 2], ...(k ? [] : [['listen', '🔊 Écoute (QCM)', 2]]), ['type', 'Réponse écrite', 3], ...(k ? [] : [['speak', '🎤 Prononciation', 3]])];
  app(`<h2>${esc(s.name)}</h2><div class="chart">${s.items.map(x => `<div><b>${esc(x.f)}</b><small>${esc(k ? x.b : x.b.toUpperCase())}</small></div>`).join('')}</div><h3>Choisis un exercice</h3>
  <p class="sub">🔥 = difficulté : XP ×1 · ×1,5 · ×2</p><div class="row">${M.map(([m, l, f]) => `<button class="btn" data-m="${m}" data-fl="${f}">${l} ${'🔥'.repeat(f)}</button>`).join('')}</div>`);
  document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const go = () => runQuiz(seriesQuiz(cat, s, b.dataset.m), { id: s.id, fl: +b.dataset.fl, label, back: '#/cat/' + cat, again: go }); go(); });
}

/* ---------- Progression ---------- */
function progressPage() {
  const m = state.me;
  app(`<h2>📊 Progression</h2><div class="card">Quiz réalisés : <b>${m.quizzes}</b> · Réussite : <b>${m.total ? Math.round(m.correct / m.total * 100) : 0} %</b> · XP : <b>${m.xp}</b><br>Cours terminés : <b>${Object.keys(m.courses || {}).length}</b> / ${state.content.courses.list.length}</div>
  <p class="sub">Une série est validée à partir de ${thr()} % de réussite.</p>` + CATS.map(c => `<h3>${c[2]} ${c[1]} — ${catPct(c[0])} %</h3>${bar(catPct(c[0]))}${seriesList(c[0])}`).join(''));
}

/* ---------- Routeur et session ---------- */
function route() {
  const [p, a, b] = location.hash.slice(2).split('/');
  updateChip();
  ({ '': dash, courses: coursesPage, course: () => coursePage(+a), quiz: quizHome, cat: () => a === 'cours' ? coursesQuizPage() : catPage(a), coursequiz: () => playCourse(+a, '#/cat/cours'), series: () => seriesPage(a, b), progress: progressPage, ranking: rankingPage, admin: adminPage }[p || ''] || dash)();
}
addEventListener('hashchange', () => state.me && route());
$('#lo').onclick = () => A.signOut(auth);
// onAuthStateChanged : la session est conservée par Firebase (rechargement de page inclus)
A.onAuthStateChanged(auth, async u => {
  if (!u) { state.uid = state.me = null; document.body.className = 'out'; return authPage(); }
  try { state.uid = u.uid; await loadContent(); await loadMe(u); if (state.me.xp > 0) syncBoard().catch(() => {}); document.body.className = 'in'; $('#na').hidden = !state.me.isAdmin; route(); }
  catch (e) { app(`<p class="r">Erreur de chargement : ${esc(e.code || e.message)}</p><p class="c">Vérifie les règles Firestore (voir README).</p>`); }
});
