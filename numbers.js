/* Nombres japonais : conversion chiffres → hiragana + romaji, lectures alternatives, normalisation de saisie (aucune dépendance au DOM) */
var NUM_D=[["ぜろ","zero","れい","rei"],["いち","ichi"],["に","ni"],["さん","san"],["よん","yon","し","shi"],["ご","go"],["ろく","roku"],["なな","nana","しち","shichi"],["はち","hachi"],["きゅう","kyuu","く","ku"]];
function nTok(h,r,note){return {h:[h],r:[r],note:note||""}}
function nDigit(d,alts){var a=NUM_D[d],t={h:[a[0]],r:[a[1]],note:""};if(alts&&a.length>2){t.h.push(a[2]);t.r.push(a[3])}return t}
function nUnder10000(n,onesAlt){
  var t=[],mark=function(){if(t.length)t[t.length-1].sp=true},th=Math.floor(n/1000),hu=Math.floor(n/100)%10,te=Math.floor(n/10)%10,on=n%10;
  if(th===1)t.push(nTok("せん","sen"));
  else if(th===3)t.push(nDigit(3),nTok("ぜん","zen","3000 → sanzen : せん devient ぜん"));
  else if(th===8)t.push(nTok("はっせん","hassen","8000 → hassen (pas hachisen)"));
  else if(th)t.push(nDigit(th),nTok("せん","sen"));
  mark();
  if(hu===1)t.push(nTok("ひゃく","hyaku","100 se dit hyaku, jamais ichi hyaku"));
  else if(hu===3)t.push(nDigit(3),nTok("びゃく","byaku","300 → sanbyaku : ひゃく devient びゃく"));
  else if(hu===6)t.push(nTok("ろっぴゃく","roppyaku","600 → roppyaku"));
  else if(hu===8)t.push(nTok("はっぴゃく","happyaku","800 → happyaku"));
  else if(hu)t.push(nDigit(hu),nTok("ひゃく","hyaku"));
  mark();
  if(te===1)t.push(nTok("じゅう","juu"));
  else if(te)t.push(nDigit(te,te===7),nTok("じゅう","juu"));
  mark();
  if(on)t.push(nDigit(on,onesAlt));
  mark();
  return t;
}
function nExpand(tokens){
  var res=[{h:"",r:"",hs:"",rs:""}];
  tokens.forEach(function(t){var nx=[],s=t.sp?" ":"";res.forEach(function(x){t.h.forEach(function(h,i){nx.push({h:x.h+h,r:x.r+t.r[i],hs:x.hs+h+s,rs:x.rs+t.r[i]+s})})});res=nx});
  res.forEach(function(x){x.hs=x.hs.trim();x.rs=x.rs.trim()});
  return res;
}
/* n entier de 0 à 99 999 999 → {list:[{h,r,hs,rs}] (lecture principale en premier ; hs/rs = avec espaces pour l’affichage), notes:[…]} */
function toJa(n){
  var t=[];
  if(n===0)t.push({h:["ぜろ","れい"],r:["zero","rei"],note:""});
  else if(n<10000)t=nUnder10000(n,true);
  else{
    var q=Math.floor(n/10000),r=n%10000;
    t=nUnder10000(q,false);t.push(nTok("まん","man",q===1?"10 000 → ichiman : ichi est obligatoire devant man":""));t[t.length-1].sp=true;
    if(r)t=t.concat(nUnder10000(r,true));
  }
  var notes=[];t.forEach(function(x){if(x.note&&notes.indexOf(x.note)<0)notes.push(x.note)});
  return {list:nExpand(t),notes:notes};
}
function normRomajiNum(s){
  return s.toLowerCase().replace(/ā/g,"aa").replace(/ī/g,"ii").replace(/ū/g,"uu").replace(/ē/g,"ee").replace(/ō/g,"oo")
    .replace(/[\s'’\-.]/g,"").replace(/zyu|jyu/g,"ju").replace(/si/g,"shi").replace(/ti/g,"chi").replace(/uu/g,"u");
}
function fmtNum(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g," ")}
