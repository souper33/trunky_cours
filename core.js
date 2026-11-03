/* Outils partagés par tous les onglets : mélange, stockage, répétition espacée (style Anki), flashcards, QCM */
var DAY=86400000,ONSHOW={};
var GRADES=["Très difficile","Difficile","Moyen","Facile","Très facile"];
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function load(key,def){try{var v=localStorage.getItem(key);return v?JSON.parse(v):def}catch(e){return def}}
function save(key,val){try{localStorage.setItem(key,JSON.stringify(val))}catch(e){}}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function fmtDays(d){if(d<1)return "10 min";if(d<30)return Math.round(d)+" j";if(d<365)return Math.round(d/30)+" mois";return "1 an"}
/* s = {i: intervalle en jours, e: facilité, d: date d’échéance} ou undefined ; g = 0..4 */
function schedule(s,g){
  var i=s?s.i:0,e=s?s.e:2.5,n=0;
  if(g===0){e=Math.max(1.3,e-0.2)}
  else{
    if(i<1)n=[0,1,2,4,7][g];
    else n=Math.max(i*[0,1.2,e,e*1.3,e*1.6][g],i+g);
    if(g===1)e=Math.max(1.3,e-0.15);
    if(g===4)e+=0.15;
    n=Math.min(Math.round(n),365);
  }
  return {i:n,e:e,d:Date.now()+(n<1?10*60000:n*DAY)};
}
/* Flashcards avec 5 niveaux. cfg : key, cards(), id(c), front(c), back(c), cls, empty */
function makeFlash(root,cfg){
  var S=load(cfg.key,{}),deck=[],pos=0,flip=false,due=false;
  root.textContent="";
  var dueBtn=el("button",null,"À réviser aujourd’hui");dueBtn.setAttribute("aria-pressed","false");
  var tb=el("div","filters");tb.appendChild(dueBtn);
  var stat=el("p","mut"),info=el("p","mut"),card=el("button","fc");card.setAttribute("aria-live","polite");
  var gr=el("div","grades");gr.hidden=true;
  var sm=GRADES.map(function(g,gi){var b=el("button","btn g"+gi);b.appendChild(el("span",null,g));var s=el("small");b.appendChild(s);b.onclick=function(){grade(gi)};gr.appendChild(b);return s});
  var row=el("div","row"),prev=el("button","btn","Précédente"),mix=el("button","btn","Mélanger"),next=el("button","btn main","Suivante");
  row.appendChild(prev);row.appendChild(mix);row.appendChild(next);
  [tb,stat,info,card,gr,row,el("p","mut","Touche la carte pour voir la réponse, puis note-la : plus c’est difficile, plus elle revient vite.")].forEach(function(x){root.appendChild(x)});
  function isDue(c){var s=S[cfg.id(c)];return !s||s.d<=Date.now()}
  function draw(){
    var all=cfg.cards(),dn=0,mat=0;
    all.forEach(function(c){var s=S[cfg.id(c)];if(isDue(c))dn++;if(s&&s.i>=21)mat++});
    stat.textContent="À réviser : "+dn+" · Maîtrisées : "+mat+" sur "+all.length;
    gr.hidden=!flip||!deck.length;
    if(!deck.length){card.textContent=due?"Rien à réviser pour l’instant":(cfg.empty||"Aucune carte");card.className="fc";info.textContent="";return}
    var c=deck[pos];card.textContent=flip?cfg.back(c):cfg.front(c);
    if(flip&&cfg.sub){var sb=cfg.sub(c);if(sb)card.appendChild(el("small","sub",sb))}
    card.className="fc"+(cfg.cls?" "+cfg.cls:"")+(flip?" back":"");
    info.textContent="Carte "+(pos+1)+" sur "+deck.length;
    if(flip){var s=S[cfg.id(c)];sm.forEach(function(x,gi){x.textContent=fmtDays(schedule(s,gi).i)})}
  }
  function build(){deck=cfg.cards().filter(function(c){return !due||isDue(c)});pos=0;flip=false;draw()}
  function grade(g){
    var c=deck[pos],id=cfg.id(c);S[id]=schedule(S[id],g);save(cfg.key,S);flip=false;
    Game.sound("ok");Game.stat("cards");Game.xp(3);
    if(due){deck.splice(pos,1);if(pos>=deck.length)pos=0}else pos=(pos+1)%deck.length;
    if(due&&!deck.length){Game.toast("📚 Paquet terminé ! +10 XP");Game.xp(10);Game.confetti()}
    draw();
  }
  card.onclick=function(){if(!deck.length)return;flip=!flip;Game.sound("flip");draw()};
  next.onclick=function(){if(!deck.length)return;pos=(pos+1)%deck.length;flip=false;draw()};
  prev.onclick=function(){if(!deck.length)return;pos=(pos-1+deck.length)%deck.length;flip=false;draw()};
  mix.onclick=function(){shuffle(deck);pos=0;flip=false;draw()};
  dueBtn.onclick=function(){due=!due;dueBtn.setAttribute("aria-pressed",due);build()};
  build();
  return {rebuild:build};
}
/* QCM. getList() renvoie [[groupe, question, [options], indexBonneReponse], …] */
function makeQuiz(box,info,getList,emptyMsg){
  var list=[],qi=0,score=0,locked=false;
  function start(){list=shuffle(getList().slice());qi=0;score=0;Game.resetCombo();draw()}
  function draw(){
    box.textContent="";
    if(!list.length){info.textContent="";box.textContent=emptyMsg||"Aucune question";return}
    if(qi>=list.length){
      info.textContent="Terminé";
      var perfect=score===list.length&&list.length>=5;
      if(perfect){Game.stat("perfect");Game.xp(15);Game.confetti();Game.sound("lvl")}
      var d=el("div","box","Score : "+score+" sur "+list.length+". "+(perfect?"Sans faute ! +15 XP":"Continue, tu progresses."));
      var r=el("button","btn main","Recommencer");r.onclick=start;box.appendChild(d);box.appendChild(r);return;
    }
    locked=false;var q=list[qi];
    info.textContent="Question "+(qi+1)+" sur "+list.length+" · score "+score+(Game.combo()>=3?" · combo ×"+Game.combo()+" 🔥":"");
    box.appendChild(el("h2",null,q[1]));
    q[2].forEach(function(t,i){
      var b=el("button","opt",t);
      b.onclick=function(){
        if(locked)return;locked=true;
        var ok=(i===q[3]);if(ok){score++;Game.correct()}else Game.wrong();
        b.classList.add(ok?"good":"bad");box.children[1+q[3]].classList.add("good");
        var n=el("button","btn main",qi===list.length-1?"Voir le score":"Question suivante");
        n.onclick=function(){qi++;draw()};box.appendChild(n);
      };
      box.appendChild(b);
    });
  }
  start();
  return {restart:start};
}
