import { db, F } from "./firebase.js";
import { SEED } from "./seed.js";
export const state = { uid: null, me: null, content: null };
export const tmp = { name: '' };
export const CONTENT_IDS = ['config', 'hiragana', 'katakana', 'kanji', 'courses'];
// Charge le contenu depuis Firestore (jp_content/*) ; repli sur les données de départ si absent.
export async function loadContent() {
  const c = {};
  for (const id of CONTENT_IDS) {
    try { const s = await F.getDoc(F.doc(db, 'jp_content', id)); c[id] = s.exists() ? s.data() : SEED[id]; }
    catch (e) { c[id] = SEED[id]; }
  }
  state.content = c;
}
export async function loadMe(u) {
  const r = F.doc(db, 'jp_users', u.uid), s = await F.getDoc(r);
  if (s.exists()) { state.me = s.data(); return; }
  let name = (tmp.name || u.displayName || (u.email || '').split('@')[0] || '').slice(0, 30);
  if (name.length < 2) name = 'Élève';
  const d = { name, isAdmin: false, xp: 0, createdAt: Date.now(), quizzes: 0, correct: 0, total: 0, courses: {}, progress: {}, lastCourse: null, lastQuiz: null };
  await F.setDoc(r, d); state.me = d;
}
// Écrit dans Firestore puis met à jour la copie locale (clés "a.b" acceptées).
export async function patch(p) {
  await F.updateDoc(F.doc(db, 'jp_users', state.uid), p);
  for (const [k, v] of Object.entries(p)) { const ks = k.split('.'); let o = state.me; ks.slice(0, -1).forEach(x => o = o[x] = o[x] || {}); o[ks.at(-1)] = v; }
}
