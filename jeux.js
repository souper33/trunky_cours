/* Onglet Jeux : contre la montre, survie, memory */
(function(){
  var root=document.getElementById("jeux"),run=0,timer=null,menu=el("div"),area=el("div");
  root.appendChild(menu);root.appendChild(area);
  function stop(){run++;if(timer){clearInterval(timer);timer=null}}
  function pool(){var s=hselected();return s.length?s:HIRA.slice(0,46)}
  /* Affiche une question, verrouille après la réponse, puis appelle cb(ok) après delay ms */
  function ask(box,q,delay,cb,note){
    box.textContent="";box.appendChild(el("h2",null,q[1]));
    var locked=false,bs=[];
    q[2].forEach(function(t,i){
      var b=el("button","opt",t);bs.push(b);
      b.onclick=function(){
        if(locked)return;locked=true;
        var ok=(i===q[3]);b.classList.add(ok?"good":"bad");bs[q[3]].classList.add("good");
        if(note)box.appendChild(el("p","mut",note));
        setTimeout(function(){cb(ok)},delay);
      };
      box.appendChild(b);
    });
  }
  function endScreen(title,text,again){
    stop();area.textContent="";
    area.appendChild(el("h2",null,title));area.appendChild(el("div","box",text));
    var row=el("div","row"),m=el("button","btn","Menu"),r=el("button","btn main","Rejouer");
    m.onclick=home;r.onclick=again;row.appendChild(m);row.appendChild(r);area.appendChild(row);
  }
  function timeAttack(){
    stop();var my=run,score=0,left=60,p=pool();
    var hd=el("p","mut"),bar=el("div","timebar"),fill=el("div"),box=el("div","kq");
    bar.appendChild(fill);area.textContent="";[hd,bar,box].forEach(function(x){area.appendChild(x)});
    function update(){hd.textContent="Score : "+score+" · "+Math.max(0,Math.ceil(left))+" s";fill.style.width=Math.max(0,left/60*100)+"%"}
    function nextQ(){
      if(my!==run)return;
      ask(box,hiraQ(p[Math.floor(Math.random()*p.length)],Math.random()<0.5?"hr":"rh",p),350,function(ok){
        if(my!==run)return;
        if(ok){score++;Game.correct(1)}else{left-=3;Game.wrong()}
        update();if(left>0)nextQ();
      });
    }
    function finish(){
      stop();var rec=Game.best("ta",score)&&score>0;Game.xp(score*2);if(rec)Game.confetti();
      endScreen("Temps écoulé !","Score : "+score+" · +"+(score*2)+" XP"+(rec?" · nouveau record !":""),timeAttack);
    }
    timer=setInterval(function(){if(root.hidden){stop();return}left-=0.1;update();if(left<=0)finish()},100);
    update();nextQ();
  }
  function survival(){
    stop();var my=run,lives=3,streak=0,order=[];
    var words=MOTS.filter(function(m){return tokens(m[0]).every(function(t){return HSEL.indexOf(t)>=0})});
    if(words.length<6)words=MOTS;
    var hd=el("p","mut"),box=el("div","kq");area.textContent="";area.appendChild(hd);area.appendChild(box);
    function update(){hd.textContent=new Array(lives+1).join("❤️")+new Array(4-lives).join("🖤")+" · série "+streak+" · record "+(Game.state.st.sv||0)}
    function nextQ(){
      if(my!==run)return;
      if(!order.length)order=shuffle(words.slice());
      var m=order.pop(),wrong=shuffle(MOTS.filter(function(x){return x[1]!==m[1]})).slice(0,3);
      var opts=shuffle([m].concat(wrong));
      ask(box,["s","« "+m[0]+" » : que signifie ce mot ?",opts.map(function(o){return o[1]}),opts.indexOf(m)],1100,function(ok){
        if(my!==run)return;
        if(ok){streak++;Game.correct(2)}else{lives--;Game.wrong()}
        update();if(lives>0)nextQ();else finish();
      },m[0]+" ("+romaji(m[0])+") = "+m[1]);
    }
    function finish(){
      stop();var rec=Game.best("sv",streak)&&streak>0;Game.xp(streak*2);if(rec)Game.confetti();
      endScreen("Plus de vies !","Série : "+streak+" bonne"+(streak>1?"s":"")+" réponse"+(streak>1?"s":"")+" · +"+(streak*2)+" XP"+(rec?" · nouveau record !":""),survival);
    }
    update();nextQ();
  }
  function memory(){
    stop();var my=run,seen={},ch=[],cards=[],first=null,lock=false,moves=0,found=0;
    shuffle(pool().slice()).concat(shuffle(HIRA.slice())).forEach(function(k){if(ch.length<6&&!seen[k[1]]){seen[k[1]]=1;ch.push(k)}});
    ch.forEach(function(k){cards.push([k[0],k[0]]);cards.push([k[0],k[1]])});
    shuffle(cards);
    var hd=el("p","mut"),grid=el("div","mgrid");area.textContent="";area.appendChild(hd);area.appendChild(grid);
    function update(){hd.textContent="Coups : "+moves+" · paires trouvées : "+found+" sur 6 · record "+(Game.state.st.mem?Game.state.st.mem+" coups":"—")}
    cards.forEach(function(c){
      var b=el("button","mc","？");b.dataset.id=c[0];
      b.onclick=function(){
        if(lock||b.classList.contains("up")||b.classList.contains("done"))return;
        b.textContent=c[1];b.classList.add("up");Game.sound("flip");
        if(!first){first=b;return}
        var a=first;first=null;moves++;
        if(a.dataset.id===b.dataset.id){
          a.className="mc done";b.className="mc done";found++;Game.correct(2);update();
          if(found===6){
            var rec=Game.best("mem",moves,true),gain=Math.max(8,40-moves*2);Game.xp(gain);Game.confetti();
            endScreen("Bravo !","Terminé en "+moves+" coups · +"+gain+" XP"+(rec?" · nouveau record !":""),memory);
          }
        }else{
          lock=true;Game.wrong();update();
          setTimeout(function(){
            if(my!==run)return;
            [a,b].forEach(function(x){x.classList.remove("up");x.textContent="？"});lock=false;
          },800);
        }
      };
      grid.appendChild(b);
    });
    update();
  }
  function home(){
    stop();area.textContent="";menu.textContent="";var st=Game.state.st;
    menu.appendChild(el("p","mut","Trois jeux pour t’entraîner en t’amusant. Les hiragana viennent de ta sélection (onglet Hiragana) ; l’XP compte pour ton niveau et ta série."));
    [["⏱️ Contre la montre","60 secondes, un maximum de hiragana. Une erreur coûte 3 secondes.","Record : "+(st.ta||0),timeAttack],
     ["🛡️ Survie","3 vies, des mots à traduire. Combien de suite ?","Record : "+(st.sv||0),survival],
     ["🧠 Memory","Retrouve les 6 paires hiragana ↔ romaji.","Record : "+(st.mem?st.mem+" coups":"—"),memory]
    ].forEach(function(g){
      var b=el("button","game");b.appendChild(el("b",null,g[0]));b.appendChild(el("span",null,g[1]));b.appendChild(el("small",null,g[2]));
      b.onclick=function(){menu.textContent="";g[3]()};menu.appendChild(b);
    });
  }
  ONSHOW.jeux=home;home();
})();
