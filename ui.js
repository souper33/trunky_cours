export const $ = s => document.querySelector(s);
export const app = h => { $('#app').innerHTML = h; scrollTo(0, 0); };
export const shuf = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const bar = p => `<div class="bar"><i style="width:${p}%"></i></div>`;
