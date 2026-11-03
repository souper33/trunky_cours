/* Données : hiragana (groupes) et mots. Le romaji des mots est calculé à partir des hiragana. */
var HGROUPS=[
["あ","base",[["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"]]],
["か","base",[["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"]]],
["さ","base",[["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"]]],
["た","base",[["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"]]],
["な","base",[["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"]]],
["は","base",[["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"]]],
["ま","base",[["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"]]],
["や","base",[["や","ya"],["ゆ","yu"],["よ","yo"]]],
["ら","base",[["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"]]],
["わ","base",[["わ","wa"],["を","o"],["ん","n"]]],
["が","dak",[["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"]]],
["ざ","dak",[["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"]]],
["だ","dak",[["だ","da"],["ぢ","ji"],["づ","zu"],["で","de"],["ど","do"]]],
["ば","dak",[["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"]]],
["ぱ","dak",[["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"]]],
["きゃ","yoon",[["きゃ","kya"],["きゅ","kyu"],["きょ","kyo"]]],
["しゃ","yoon",[["しゃ","sha"],["しゅ","shu"],["しょ","sho"]]],
["ちゃ","yoon",[["ちゃ","cha"],["ちゅ","chu"],["ちょ","cho"]]],
["にゃ","yoon",[["にゃ","nya"],["にゅ","nyu"],["にょ","nyo"]]],
["ひゃ","yoon",[["ひゃ","hya"],["ひゅ","hyu"],["ひょ","hyo"]]],
["みゃ","yoon",[["みゃ","mya"],["みゅ","myu"],["みょ","myo"]]],
["りゃ","yoon",[["りゃ","rya"],["りゅ","ryu"],["りょ","ryo"]]],
["ぎゃ","yoon",[["ぎゃ","gya"],["ぎゅ","gyu"],["ぎょ","gyo"]]],
["じゃ","yoon",[["じゃ","ja"],["じゅ","ju"],["じょ","jo"]]],
["びゃ","yoon",[["びゃ","bya"],["びゅ","byu"],["びょ","byo"]]],
["ぴゃ","yoon",[["ぴゃ","pya"],["ぴゅ","pyu"],["ぴょ","pyo"]]]
];
var HCAT=[["base","Base"],["dak","Dakuten"],["yoon","Combinés"]];
var HIRA=[],HROM={};
HGROUPS.forEach(function(g){g[2].forEach(function(k){HIRA.push(k);HROM[k[0]]=k[1]})});
/* Autres écritures acceptées quand on tape un mot (Kunrei, etc.) */
var HVAR={"し":["si"],"ち":["ti"],"つ":["tu"],"ふ":["hu"],"じ":["zi"],"ぢ":["di"],"づ":["du"],"を":["wo"],
"しゃ":["sya"],"しゅ":["syu"],"しょ":["syo"],"ちゃ":["tya"],"ちゅ":["tyu"],"ちょ":["tyo"],
"じゃ":["zya","jya"],"じゅ":["zyu","jyu"],"じょ":["zyo","jyo"]};
function tokens(w){var t=[];for(var i=0;i<w.length;i++){var n=w[i+1];if(n&&"ゃゅょ".indexOf(n)>=0){t.push(w[i]+n);i++}else t.push(w[i])}return t}
function romaji(w){return tokens(w).map(function(k){return HROM[k]}).join("")}
function romajiVariants(w){
  var res=[""];
  tokens(w).forEach(function(k){var o=[HROM[k]].concat(HVAR[k]||[]),nx=[];res.forEach(function(r){o.forEach(function(x){nx.push(r+x)})});res=nx});
  return res;
}
var MOTS=[
["あお","bleu"],["あか","rouge"],["あき","automne"],["あさ","matin"],["あし","pied, jambe"],["あめ","pluie"],
["いえ","maison"],["いぬ","chien"],["いけ","étang"],["うえ","dessus, haut"],["うた","chanson"],["うみ","mer"],
["えき","gare"],["おかね","argent"],["おちゃ","thé"],["おとこ","homme"],["おんな","femme"],
["かお","visage"],["かさ","parapluie"],["かぜ","vent"],["かわ","rivière"],
["くつ","chaussure"],["くに","pays"],["くち","bouche"],["くま","ours"],["くるま","voiture"],["くろ","noir"],
["けさ","ce matin"],["こえ","voix"],["ここ","ici"],
["さかな","poisson"],["さくら","cerisier"],["さけ","saké, alcool"],["さる","singe"],
["しお","sel"],["しごと","travail"],["しろ","blanc"],["すし","sushi"],["せかい","monde"],["せんせい","professeur"],
["そこ","là"],["そら","ciel"],["たこ","poulpe"],["ちず","carte"],["ちち","père"],
["つき","lune"],["つくえ","bureau (meuble)"],["て","main"],["てら","temple bouddhiste"],["でんわ","téléphone"],
["とけい","montre, horloge"],["ともだち","ami"],["とり","oiseau"],
["なつ","été"],["なまえ","nom, prénom"],["にく","viande"],["にほん","Japon"],["ぬの","tissu"],["ねこ","chat"],
["はし","baguettes"],["はな","fleur"],["はは","mère"],["はる","printemps"],["ひと","personne"],["ひる","midi"],
["ふね","bateau"],["ふゆ","hiver"],["へや","pièce"],["ほし","étoile"],["ほん","livre"],
["まど","fenêtre"],["みず","eau"],["みせ","magasin"],["みみ","oreille"],["め","œil"],
["やま","montagne"],["やすみ","congé, repos"],["ゆき","neige"],["よる","nuit"],
["りんご","pomme"],["れきし","histoire"],["ろく","six"],["わたし","moi, je"],
["たべる","manger"],["のむ","boire"],["みる","voir, regarder"],["いく","aller"],["くる","venir"],["する","faire"],
["ある","il y a (objet)"],["いる","il y a (être vivant)"],["よむ","lire"],["かく","écrire"],["きく","écouter, entendre"],
["はなす","parler"],["あう","rencontrer"],["まつ","attendre"],["かえる","rentrer"],
["おおきい","grand"],["ちいさい","petit"],["あたらしい","nouveau"],["ふるい","vieux"],["たかい","cher, haut"],["やすい","bon marché"],
["おいしい","délicieux"],["たのしい","amusant"],["すき","aimer"],["きらい","détester"],
["ありがとう","merci"],["おはよう","bonjour (matin)"],["さようなら","au revoir"],["ひらがな","hiragana"],["ごはん","riz, repas"],
["きょう","aujourd’hui"],["しゅみ","passe-temps"],["りょうり","cuisine"],["びょういん","hôpital"],
["ちゅうごく","Chine"],["じゅぎょう","cours"],["べんきょう","étude"]
];
/* Question de QCM sur un hiragana. dir : "hr" (hiragana → romaji) ou "rh" ; sel : hiragana choisis (pour les mauvaises réponses) */
function hiraQ(k,dir,sel){
  if(dir==="rh"&&(k[0]==="ぢ"||k[0]==="づ"))dir="hr";
  var seen={},wrong=[],cand=shuffle(sel.slice()).concat(shuffle(HIRA.slice()));
  seen[k[1]]=1;
  for(var i=0;i<cand.length&&wrong.length<3;i++){if(seen[cand[i][1]])continue;seen[cand[i][1]]=1;wrong.push(cand[i])}
  var opts=shuffle([k].concat(wrong)),idx=opts.indexOf(k);
  if(dir==="hr")return ["h","Comment se lit « "+k[0]+" » ?",opts.map(function(o){return o[1]}),idx];
  return ["h","Quel hiragana se lit « "+k[1]+" » ?",opts.map(function(o){return o[0]}),idx];
}
function exampleWord(k){for(var i=0;i<MOTS.length;i++){if(tokens(MOTS[i][0])[0]===k)return MOTS[i]}return null}
