var TABS=[["fiches","Fiches"],["cards","Flashcards"],["hira","Hiragana"],["mots","Mots"],["nombres","Nombres"],["jeux","Jeux"],["quiz","Quiz"],["profil","Succès"]];
var nav=document.getElementById("tabs");
function show(id){
  TABS.forEach(function(t){
    document.getElementById(t[0]).hidden=(t[0]!==id);
    nav.querySelector('[data-id="'+t[0]+'"]').setAttribute("aria-selected",t[0]===id);
  });
  window.scrollTo(0,0);
  if(ONSHOW[id])ONSHOW[id]();
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
/* Flashcards des cours */
var cs={k:"all"};
var cf=makeFlash(document.getElementById("cflash"),{key:"jp-srs-v2",
  cards:function(){return CARDS.filter(function(c){return cs.k==="all"||c[0]===cs.k})},
  id:function(c){return c[0]+"|"+c[1]},front:function(c){return c[1]},back:function(c){return c[2]}});
filters(document.getElementById("cf"),cf.rebuild,cs);
/* Quiz des cours */
var qs={k:"all"};
var qz=makeQuiz(document.getElementById("qbox"),document.getElementById("qinfo"),function(){return QUIZ.filter(function(q){return qs.k==="all"||q[0]===qs.k})});
filters(document.getElementById("qf"),qz.restart,qs);
show("fiches");
