import { db, F } from "./firebase.js";
import { state, loadContent, CONTENT_IDS } from "./db.js";
import { $, app, esc } from "./ui.js";
import { SEED } from "./seed.js";
export async function adminPage() {
  if (!state.me.isAdmin) { location.hash = '#/'; return; }
  app('<p class="c">Chargement…</p>');
  let users = [];
  try { users = (await F.getDocs(F.collection(db, 'jp_users'))).docs.map(d => ({ id: d.id, ...d.data() })); }
  catch (e) { app(`<p class="r">Accès refusé : ${esc(e.code || e.message)}</p>`); return; }
  const sum = k => users.reduce((a, u) => a + (u[k] || 0), 0);
  app(`<h2>👑 Administration</h2>
  <div class="grid2"><div class="card">Utilisateurs : <b>${users.length}</b></div><div class="card">Quiz : <b>${sum('quizzes')}</b> · Réussite : <b>${sum('total') ? Math.round(sum('correct') / sum('total') * 100) : 0} %</b></div></div>
  <h3>Utilisateurs</h3>${users.map(u => `<div class="card row"><span style="flex:1"><b>${esc(u.name)}</b>${u.isAdmin ? ' 👑' : ''}<small>${u.quizzes || 0} quiz · ${u.xp || 0} XP</small></span>${u.id === state.uid ? '' : `<button data-id="${u.id}" data-a="${u.isAdmin ? 0 : 1}">${u.isAdmin ? 'Retirer admin' : 'Faire admin'}</button>`}</div>`).join('')}
  <h3>Contenu (séries, questions, cours, niveaux)</h3>
  <p class="sub">Modifie le JSON puis enregistre. <b>config.unlock</b> = % requis pour débloquer la série suivante.</p>
  <select id="cid">${CONTENT_IDS.map(i => `<option>${i}</option>`).join('')}</select><textarea id="js" spellcheck="false"></textarea><div id="am" class="msg"></div>
  <div class="row"><button class="btn red" id="sv">Enregistrer</button><button id="seed">Importer les données de départ</button></div>`);
  const show = () => $('#js').value = JSON.stringify(state.content[$('#cid').value], null, 1);
  show(); $('#cid').onchange = show;
  document.querySelectorAll('[data-id]').forEach(b => b.onclick = async () => { await F.updateDoc(F.doc(db, 'jp_users', b.dataset.id), { isAdmin: b.dataset.a === '1' }); adminPage(); });
  $('#sv').onclick = async () => {
    try { await F.setDoc(F.doc(db, 'jp_content', $('#cid').value), JSON.parse($('#js').value)); await loadContent(); $('#am').textContent = '✅ Enregistré.'; }
    catch (e) { $('#am').textContent = 'Erreur : ' + (e.code || e.message); }
  };
  $('#seed').onclick = async () => {
    if (!confirm('Écraser tout le contenu par les données de départ ?')) return;
    try { for (const i of CONTENT_IDS) await F.setDoc(F.doc(db, 'jp_content', i), SEED[i]); await loadContent(); show(); $('#am').textContent = '✅ Données importées.'; }
    catch (e) { $('#am').textContent = 'Erreur : ' + (e.code || e.message); }
  };
}
