/* Onglet Mots : un mot en hiragana s’affiche, tu l’écris en romaji, la traduction vient en bonus */
(function(){
  var root=document.getElementById("mots"),only=load("jp-mots-only",true),list=[],mi=0,score=0,done=false,sig="";
  var f=el("div","filters"),tog=el("button",null,"Seulement avec mes hiragana sélectionnés");
  tog.setAttribute("aria-pressed",only);f.appendChild(tog);
  var info=el("p","mut"),box=el("div");
  root.appendChild(f);root.appendChild(info);root.appendChild(box);
  function ok(m){return !only||tokens(m[0]).every(function(t){return HSEL.indexOf(t)>=0})}
  function start(){list=shuffle(MOTS.filter(ok));mi=0;score=0;sig=HSEL.join("")+only;draw()}
  function norm(s){return s.toLowerCase().replace(/[\s'’\-]/g,"")}
  function draw(){
    box.textContent="";done=false;
    if(!list.length){info.textContent="";box.appendChild(el("div","box","Aucun mot ne s’écrit avec ta sélection actuelle. Ajoute des hiragana dans l’onglet Hiragana, ou désactive le filtre."));return}
    if(mi>=list.length){
      info.textContent="Terminé";if(score===list.length&&list.length>=5)Game.confetti();box.appendChild(el("div","box","Score : "+score+" sur "+list.length+"."));
      var r=el("button","btn main","Recommencer");r.onclick=start;box.appendChild(r);return;
    }
    var m=list[mi];
    info.textContent="Mot "+(mi+1)+" sur "+list.length+" · score "+score;
    box.appendChild(el("div","box mw",m[0]));
    var inp=el("input","inp");inp.type="text";inp.placeholder="Écris-le en romaji";inp.autocomplete="off";inp.autocapitalize="none";inp.spellcheck=false;
    var fb=el("div"),row=el("div","row"),go=el("button","btn main","Valider"),skip=el("button","btn","Je ne sais pas");
    row.appendChild(skip);row.appendChild(go);
    box.appendChild(inp);box.appendChild(row);box.appendChild(fb);
    function finish(good){
      if(done)return;done=true;inp.disabled=true;
      if(good){score++;Game.correct(4);Game.stat("words")}else Game.wrong();
      fb.className="box";fb.appendChild(el("b",null,good?"Correct !":"Pas tout à fait."));
      fb.appendChild(el("div",null,"Romaji : "+romaji(m[0])));
      fb.appendChild(el("div","mut","Traduction : "+m[1]));
      fb.style.borderColor=good?"var(--ok)":"var(--ko)";
      row.textContent="";var n=el("button","btn main",mi===list.length-1?"Voir le score":"Mot suivant");
      n.onclick=function(){mi++;draw()};row.appendChild(n);n.focus();
    }
    go.onclick=function(){if(inp.value.trim())finish(romajiVariants(m[0]).indexOf(norm(inp.value))>=0)};
    skip.onclick=function(){finish(false)};
    inp.onkeydown=function(e){if(e.key==="Enter")go.onclick()};
    inp.focus();
  }
  tog.onclick=function(){only=!only;save("jp-mots-only",only);tog.setAttribute("aria-pressed",only);start()};
  ONSHOW.mots=function(){if(sig!==HSEL.join("")+only)start()};
  start();
})();
