var TABS=[["fiches","Fiches"],["cards","Flashcards"],["quiz","Quiz"]];
var nav=document.getElementById("tabs");
function show(id){
  TABS.forEach(function(t){
    document.getElementById(t[0]).hidden=(t[0]!==id);
    nav.querySelector('[data-id="'+t[0]+'"]').setAttribute("aria-selected",t[0]===id);
  });
  window.scrollTo(0,0);
}
TABS.forEach(function(t){
  var b=document.createElement("button");b.textContent=t[1];b.setAttribute("role","tab");b.dataset.id=t[0];
  b.onclick=function(){show(t[0])};nav.appendChild(b);
});
/* Fiches */
var fl=document.getElementById("flist");
FICHES.forEach(function(f,i){
  var d=document.createElement("div");d.className="fi";
  var b=document.createElement("button");
  b.innerHTML="";
  var t=document.createElement("b");t.textContent=(i+1)+". "+f[1];
  var s=document.createElement("small");s.textContent=f[2];
  b.appendChild(t);b.appendChild(s);
  var img=null;
  b.onclick=function(){
    if(img){d.removeChild(img);img=null;return}
    img=document.createElement("img");img.src="fiches/"+f[0];img.alt="Fiche : "+f[1];d.appendChild(img);
  };
  d.appendChild(b);fl.appendChild(d);
});
/* Filtres */
function filters(el,cb,state){
  var all=[["all","Tout"]].concat(COURS);
  all.forEach(function(c){
    var b=document.createElement("button");b.textContent=c[1];b.dataset.k=c[0];
    b.setAttribute("aria-pressed",c[0]===state.k);
    b.onclick=function(){state.k=c[0];el.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",x.dataset.k===c[0])});cb()};
    el.appendChild(b);
  });
}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
/* Flashcards */
var cs={k:"all"},deck=[],pos=0,flip=false,card=document.getElementById("card");
function buildDeck(){deck=CARDS.filter(function(c){return cs.k==="all"||c[0]===cs.k});pos=0;flip=false;drawCard()}
function drawCard(){
  if(!deck.length){card.textContent="Aucune carte";return}
  var c=deck[pos];card.textContent=flip?c[2]:c[1];card.className="fc"+(flip?" back":"");
  document.getElementById("cinfo").textContent="Carte "+(pos+1)+" sur "+deck.length;
}
card.onclick=function(){flip=!flip;drawCard()};
document.getElementById("next").onclick=function(){pos=(pos+1)%deck.length;flip=false;drawCard()};
document.getElementById("prev").onclick=function(){pos=(pos-1+deck.length)%deck.length;flip=false;drawCard()};
document.getElementById("mix").onclick=function(){shuffle(deck);pos=0;flip=false;drawCard()};
filters(document.getElementById("cf"),buildDeck,cs);buildDeck();
/* Quiz */
var qs={k:"all"},qlist=[],qi=0,score=0,locked=false,qb=document.getElementById("qbox");
function buildQuiz(){qlist=shuffle(QUIZ.filter(function(q){return qs.k==="all"||q[0]===qs.k}));qi=0;score=0;drawQ()}
function drawQ(){
  qb.textContent="";
  if(!qlist.length){qb.textContent="Aucune question";return}
  if(qi>=qlist.length){
    document.getElementById("qinfo").textContent="Terminé";
    var d=document.createElement("div");d.className="box";
    d.textContent="Score : "+score+" sur "+qlist.length+". "+(score===qlist.length?"Parfait !":"Relis les fiches concernées, puis recommence.");
    var r=document.createElement("button");r.className="btn main";r.textContent="Recommencer";r.onclick=buildQuiz;
    qb.appendChild(d);qb.appendChild(r);return;
  }
  locked=false;
  var q=qlist[qi];
  document.getElementById("qinfo").textContent="Question "+(qi+1)+" sur "+qlist.length+" · score "+score;
  var h=document.createElement("h2");h.textContent=q[1];qb.appendChild(h);
  q[2].forEach(function(t,i){
    var b=document.createElement("button");b.className="opt";b.textContent=t;
    b.onclick=function(){
      if(locked)return;locked=true;
      var ok=(i===q[3]);if(ok)score++;
      b.classList.add(ok?"good":"bad");qb.children[1+q[3]].classList.add("good");
      var n=document.createElement("button");n.className="btn main";
      n.textContent=qi===qlist.length-1?"Voir le score":"Question suivante";
      n.onclick=function(){qi++;drawQ()};qb.appendChild(n);
    };
    qb.appendChild(b);
  });
}
filters(document.getElementById("qf"),buildQuiz,qs);buildQuiz();
show("fiches");
