/* Onglet Nombres : chiffres → japonais et japonais → chiffres, au hasard */
(function(){
  var root=document.getElementById("nombres");
  var LV=[["0 – 10",0,10],["11 – 99",11,99],["100 – 999",100,999],["1 000 – 9 999",1000,9999],["10 000 – 999 999",10000,999999]];
  var lv=load("jp-num-lv",[0,1]),dir=load("jp-num-dir","mix"),aid=load("jp-num-aid",true);
  var list=[],mi=0,score=0,done=false,last=-1,TOTAL=10;
  var fl=el("div","filters"),fd=el("div","filters"),info=el("p","mut"),box=el("div");
  [fl,fd,info,box].forEach(function(x){root.appendChild(x)});
  root.insertBefore(el("p","mut","Entraîne-toi sur des nombres tirés au hasard. Choisis les tranches, puis réponds : en romaji (ou en hiragana) pour « chiffres → japonais », en chiffres pour « japonais → chiffres »."),fl);
  LV.forEach(function(l,i){
    var b=el("button",null,l[0]);b.dataset.i=i;b.setAttribute("aria-pressed",lv.indexOf(i)>=0);
    b.onclick=function(){var k=lv.indexOf(i);if(k>=0){if(lv.length>1)lv.splice(k,1)}else lv.push(i);save("jp-num-lv",lv);paint();start()};
    fl.appendChild(b);
  });
  var D=[["mix","Aléatoire"],["nj","Chiffres → japonais"],["jn","Japonais → chiffres"]];
  D.forEach(function(d){var b=el("button",null,d[1]);b.dataset.k=d[0];b.onclick=function(){dir=d[0];save("jp-num-dir",dir);paint();start()};fd.appendChild(b)});
  var ab=el("button",null,"Romaji affiché");ab.onclick=function(){aid=!aid;save("jp-num-aid",aid);paint();draw()};fd.appendChild(ab);
  function paint(){
    fl.querySelectorAll("button").forEach(function(b){b.setAttribute("aria-pressed",lv.indexOf(+b.dataset.i)>=0)});
    fd.querySelectorAll("button[data-k]").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.k===dir)});
    ab.setAttribute("aria-pressed",aid);
  }
  function pick(){
    var l=LV[lv[Math.floor(Math.random()*lv.length)]],n;
    do{n=l[1]+Math.floor(Math.random()*(l[2]-l[1]+1))}while(n===last&&l[2]>l[1]);
    last=n;
    var d=dir==="mix"?(Math.random()<0.5?"nj":"jn"):dir;
    return {n:n,d:d};
  }
  function start(){list=[];for(var i=0;i<TOTAL;i++)list.push(pick());mi=0;score=0;draw()}
  function draw(){
    box.textContent="";
    if(mi>=TOTAL){
      info.textContent="Terminé";
      var perfect=score===TOTAL;
      if(perfect){Game.xp(10);Game.confetti();Game.sound("lvl")}
      box.appendChild(el("div","box","Score : "+score+" sur "+TOTAL+". "+(perfect?"Sans faute ! +10 XP":"Les chiffres irréguliers (300, 600, 800, 3000, 8000) reviennent souvent : relis les remarques.")));
      var r=el("button","btn main","Recommencer");r.onclick=start;box.appendChild(r);return;
    }
    done=false;
    var q=list[mi],ja=toJa(q.n),show=ja.list[Math.floor(Math.random()*ja.list.length)];
    info.textContent="Nombre "+(mi+1)+" sur "+TOTAL+" · score "+score+(Game.combo()>=3?" · combo ×"+Game.combo()+" 🔥":"");
    var big=el("div","box mw");
    if(q.d==="nj"){big.textContent=fmtNum(q.n)}
    else{big.textContent=show.hs;if(aid)big.appendChild(el("small","sub",show.rs))}
    box.appendChild(big);
    var inp=el("input","inp");inp.type="text";inp.autocomplete="off";inp.autocapitalize="none";inp.spellcheck=false;
    inp.placeholder=q.d==="nj"?"Écris-le en romaji ou en hiragana":"Écris le nombre en chiffres";
    inp.inputMode=q.d==="nj"?"text":"numeric";
    var fb=el("div"),row=el("div","row"),go=el("button","btn main","Valider"),skip=el("button","btn","Je ne sais pas");
    row.appendChild(skip);row.appendChild(go);box.appendChild(inp);box.appendChild(row);box.appendChild(fb);
    function finish(good){
      if(done)return;done=true;inp.disabled=true;
      if(good){score++;Game.correct(3);Game.stat("nombres")}else Game.wrong();
      fb.className="box";fb.style.borderColor=good?"var(--ok)":"var(--ko)";
      fb.appendChild(el("b",null,good?"Correct !":"Pas tout à fait."));
      fb.appendChild(el("div",null,fmtNum(q.n)+" = "+ja.list[0].hs+" ("+ja.list[0].rs+")"));
      if(ja.list.length>1)fb.appendChild(el("div","mut","Autres lectures acceptées : "+ja.list.slice(1).map(function(x){return x.rs}).join(", ")));
      ja.notes.forEach(function(n){fb.appendChild(el("div","mut","À retenir : "+n))});
      row.textContent="";var nx=el("button","btn main",mi===TOTAL-1?"Voir le score":"Suivant");
      nx.onclick=function(){mi++;draw()};row.appendChild(nx);nx.focus();
    }
    go.onclick=function(){
      var v=inp.value.trim();if(!v)return;
      if(q.d==="jn")return finish(v.replace(/[\s,.\u00a0\u202f']/g,"")===String(q.n));
      var nr=normRomajiNum(v),nh=v.replace(/\s/g,"");
      finish(ja.list.some(function(x){return normRomajiNum(x.r)===nr||x.h===nh}));
    };
    skip.onclick=function(){finish(false)};
    inp.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();go.onclick()}};
    inp.focus();
  }
  paint();start();
})();
