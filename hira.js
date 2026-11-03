/* Onglet Hiragana : choisir les hiragana, les réviser en cartes (répétition espacée) ou en QCM */
var HSEL=load("jp-hira-sel",null);
if(!HSEL){HSEL=[];HGROUPS.forEach(function(g){if(g[1]==="base")g[2].forEach(function(k){HSEL.push(k[0])})})}
function hselected(){return HIRA.filter(function(k){return HSEL.indexOf(k[0])>=0})}
(function(){
  var root=document.getElementById("hira"),mode="cards",flash=null,qdir="both",qz=null;
  root.appendChild(el("p","mut","Choisis les hiragana que tu veux réviser (touche un signe, ou la tête de ligne pour toute la ligne). Cartes, QCM et mots utilisent ta sélection."));
  var quick=el("div","filters");root.appendChild(quick);
  var grid=el("div");root.appendChild(grid);
  var count=el("p","mut");root.appendChild(count);
  var modes=el("div","filters");root.appendChild(modes);
  var work=el("div");root.appendChild(work);
  function setSel(list,on){list.forEach(function(k){var i=HSEL.indexOf(k);if(on&&i<0)HSEL.push(k);if(!on&&i>=0)HSEL.splice(i,1)});changed()}
  function allSel(list){return list.every(function(k){return HSEL.indexOf(k)>=0})}
  function toggleList(list){setSel(list,!allSel(list))}
  function mkQuick(label,fn){var b=el("button",null,label);b.onclick=fn;quick.appendChild(b)}
  mkQuick("Tout",function(){setSel(HIRA.map(function(k){return k[0]}),true)});
  mkQuick("Aucun",function(){HSEL.length=0;changed()});
  var catBtns=HCAT.map(function(c){
    var list=[];HGROUPS.forEach(function(g){if(g[1]===c[0])g[2].forEach(function(k){list.push(k[0])})});
    var b=el("button",null,c[1]);b.onclick=function(){toggleList(list)};quick.appendChild(b);return [b,list];
  });
  var rows=[],keys=[];
  HGROUPS.forEach(function(g){
    var d=el("div","hg"),list=g[2].map(function(k){return k[0]});
    var rb=el("button","rb","Ligne "+g[0]);rb.onclick=function(){toggleList(list)};d.appendChild(rb);rows.push([rb,list]);
    g[2].forEach(function(k){
      var b=el("button","kb",k[0]);b.appendChild(el("small",null,k[1]));
      b.onclick=function(){toggleList([k[0]])};d.appendChild(b);keys.push([b,k[0]]);
    });
    grid.appendChild(d);
  });
  function paint(){
    keys.forEach(function(x){x[0].setAttribute("aria-pressed",HSEL.indexOf(x[1])>=0)});
    rows.concat(catBtns).forEach(function(x){x[0].setAttribute("aria-pressed",allSel(x[1]))});
    count.textContent=HSEL.length+" hiragana sélectionné"+(HSEL.length>1?"s":"")+" sur "+HIRA.length;
  }
  function changed(){save("jp-hira-sel",HSEL);paint();refresh()}
  [["cards","Cartes"],["qcm","QCM"]].forEach(function(m){
    var b=el("button",null,m[1]);b.dataset.m=m[0];b.onclick=function(){mode=m[0];buildMode()};modes.appendChild(b);
  });
  function questions(){
    var sel=hselected();
    return shuffle(sel.slice()).slice(0,20).map(function(k){return hiraQ(k,qdir==="both"?(Math.random()<0.5?"hr":"rh"):qdir,sel)});
  }
  function buildMode(){
    modes.querySelectorAll("button").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.m===mode)});
    work.textContent="";flash=null;qz=null;
    if(mode==="cards"){
      flash=makeFlash(work,{key:"jp-srs-hira-v1",cls:"big",empty:"Sélectionne au moins un hiragana",
        cards:hselected,id:function(c){return c[0]},front:function(c){return c[0]},back:function(c){return c[1]},
        sub:function(c){var m=exampleWord(c[0]);return m?m[0]+" ("+romaji(m[0])+") = "+m[1]:""}});
    }else{
      var f=el("div","filters");
      [["both","Les deux sens"],["hr","Hiragana → romaji"],["rh","Romaji → hiragana"]].forEach(function(o){
        var b=el("button",null,o[1]);b.dataset.k=o[0];b.setAttribute("aria-pressed",o[0]===qdir);
        b.onclick=function(){qdir=o[0];f.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",x.dataset.k===qdir)});qz.restart()};
        f.appendChild(b);
      });
      var info=el("p","mut"),box=el("div","kq");
      work.appendChild(f);work.appendChild(info);work.appendChild(box);
      qz=makeQuiz(box,info,questions,"Sélectionne au moins un hiragana");
    }
  }
  function refresh(){if(flash)flash.rebuild();else if(qz)qz.restart()}
  paint();buildMode();
})();
