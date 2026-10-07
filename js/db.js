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

/* ---- PDF des cours : stockés en base64, découpés en morceaux de 600 000 caractères (jp_pdfs) ---- */
const CH = 600000;
export async function savePdf(file) {
  const b64 = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result.split(',')[1]); r.onerror = ko; r.readAsDataURL(file); });
  const id = 'p' + Date.now().toString(36), n = Math.ceil(b64.length / CH);
  for (let i = 0; i < n; i++) await F.setDoc(F.doc(db, 'jp_pdfs', `${id}_${i}`), { d: b64.slice(i * CH, (i + 1) * CH), i });
  return { id, name: file.name, n };
}
const urls = {};
export async function pdfUrl(p) {
  if (urls[p.id]) return urls[p.id];
  const parts = await Promise.all(Array.from({ length: p.n }, (_, i) => F.getDoc(F.doc(db, 'jp_pdfs', `${p.id}_${i}`))));
  const bin = atob(parts.map(s => s.data().d).join('')), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return urls[p.id] = URL.createObjectURL(new Blob([u], { type: 'application/pdf' }));
}
export async function delPdf(p) { for (let i = 0; i < p.n; i++) await F.deleteDoc(F.doc(db, 'jp_pdfs', `${p.id}_${i}`)); delete urls[p.id]; }
export const saveCourses = () => F.setDoc(F.doc(db, 'jp_content', 'courses'), state.content.courses);
