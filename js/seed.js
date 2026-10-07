// Données de départ (importables dans Firestore depuis la page Admin). Une série = une ligne "kana+romaji".
import { COURSES } from "./courses-seed.js";
const H = ["あa いi うu えe おo","かka きki くku けke こko","さsa しshi すsu せse そso","たta ちchi つtsu てte とto","なna にni ぬnu ねne のno","はha ひhi ふfu へhe ほho","まma みmi むmu めme もmo","やya ゆyu よyo","らra りri るru れre ろro","わwa をwo","んn"];
const kata = c => c >= 'ぁ' && c <= 'ゖ' ? String.fromCharCode(c.charCodeAt(0) + 96) : c;
const mk = (pre, rows, conv = x => x) => ({ series: rows.map((r, i) => ({ id: `${pre}_${i + 1}`, name: `Série ${i + 1}`, items: r.split(' ').map(t => ({ f: conv(t[0]), b: t.slice(1) })) })) });
const kj = (id, name, rows) => ({ id, name, items: rows.map(([f, b, alt]) => ({ f, b, alt: alt.split(',') })) });
export const SEED = {
  config: { unlock: 80 },                     // % requis pour valider une série et débloquer la suivante
  hiragana: mk('hiragana', H),
  katakana: mk('katakana', H, kata),
  kanji: { series: [
    kj('kanji_1', 'Série 1', [['日','jour / soleil','jour,soleil,nichi,hi'],['月','lune / mois','lune,mois,getsu,tsuki'],['火','feu','feu,ka,hi'],['水','eau','eau,sui,mizu'],['木','arbre','arbre,moku,ki'],['金','or / argent','or,argent,kin,kane'],['土','terre','terre,do,tsuchi']]),
    kj('kanji_2', 'Série 2', [['本','livre / origine','livre,origine,hon,moto'],['語','langue','langue,go,kataru'],['人','personne','personne,jin,hito'],['山','montagne','montagne,san,yama'],['川','rivière','riviere,sen,kawa']])
  ] },
  courses: { list: COURSES }
};
