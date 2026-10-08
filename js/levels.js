// Niveaux, appellations et flammes (série de jours). Tout est calculé à partir de l'XP.
export const TITLES = [[1, 'Débutant', '初心者'], [3, 'Apprenti', '見習い'], [6, 'Élève', '生徒'], [10, 'Étudiant', '学生'], [15, 'Samouraï', '侍'], [20, 'Ninja', '忍者'], [35, 'Sensei', '先生'], [50, 'Maître', '達人']];
export const levelOf = xp => Math.floor(Math.sqrt(xp / 50)) + 1;      // 0 XP : niv.1 · 50 : niv.2 · 200 : niv.3 · 450 : niv.4…
export const xpFor = l => (l - 1) ** 2 * 50;
export function info(xp) {
  const l = levelOf(xp), t = [...TITLES].reverse().find(x => l >= x[0]), a = xpFor(l), b = xpFor(l + 1);
  return { l, t: t[1], jp: t[2], pct: Math.round((xp - a) / (b - a) * 100), next: b - xp };
}
export const ymd = d => new Date(Date.now() + d * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
// Flamme active = a joué aujourd'hui ou hier
export const flame = m => (m.lastDay === ymd(0) || m.lastDay === ymd(-1)) ? (m.streak || 0) : 0;
