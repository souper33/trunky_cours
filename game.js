/* Gamification partagée : XP, niveaux, série quotidienne, succès, sons, confettis */
var Game=(function(){
  var GOAL=30,KEY="jp-game-v1",RANKS=["Débutant","Apprenti","Élève","Initié","Habile","Expert","Maître","Sensei"];
  var G=load(KEY,null)||{xp:0,days:{},badges:{},st:{},mute:false};
  var combo=0,hud=null,actx=null,queue=[],showing=false;
  var tbox=el("div","toast");tbox.setAttribute("role","status");document.body.appendChild(tbox);
  function dkey(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
  function today(){return dkey(new Date())}
  function level(xp){return Math.floor(Math.sqrt(xp/50))+1}
  function floorXp(l){return 50*(l-1)*(l-1)}
  function rank(l){return RANKS[Math.min(Math.floor((l-1)/2),RANKS.length-1)]}
  function streak(){
    var n=0,d=new Date();if((G.days[dkey(d)]||0)<GOAL)d.setDate(d.getDate()-1);
    while((G.days[dkey(d)]||0)>=GOAL){n++;d.setDate(d.getDate()-1)}
    return n;
  }
  var BADGES=[
    ["first","🌱","Premier pas","Gagne ton premier XP",function(){return G.xp>=1}],
    ["xp100","⭐","100 XP","Atteins 100 XP",function(){return G.xp>=100}],
    ["xp500","🌟","500 XP","Atteins 500 XP",function(){return G.xp>=500}],
    ["xp2000","👑","2000 XP","Atteins 2000 XP",function(){return G.xp>=2000}],
    ["s3","🔥","3 jours de suite","Atteins l’objectif du jour 3 jours d’affilée",function(){return streak()>=3}],
    ["s7","🔥","Semaine de feu","7 jours d’affilée",function(){return streak()>=7}],
    ["s30","🏆","Mois d’acier","30 jours d’affilée",function(){return streak()>=30}],
    ["c50","🃏","50 cartes","Note 50 flashcards",function(){return (G.st.cards||0)>=50}],
    ["c300","🃏","300 cartes","Note 300 flashcards",function(){return (G.st.cards||0)>=300}],
    ["g100","✅","100 bonnes réponses","Donne 100 bonnes réponses",function(){return (G.st.good||0)>=100}],
    ["g500","💯","500 bonnes réponses","Donne 500 bonnes réponses",function(){return (G.st.good||0)>=500}],
    ["cb10","⚡","Combo ×10","10 bonnes réponses d’affilée",function(){return (G.st.comboMax||0)>=10}],
    ["pf","🎯","Sans faute","Termine un QCM de 5 questions ou plus sans erreur",function(){return (G.st.perfect||0)>=1}],
    ["w25","✍️","Scribe","Écris 25 mots en romaji sans erreur",function(){return (G.st.words||0)>=25}],
    ["n30","🔢","Compteur","Réussis 30 nombres (onglet Nombres)",function(){return (G.st.nombres||0)>=30}],
    ["ta20","⏱️","Éclair","20 points au contre-la-montre",function(){return (G.st.ta||0)>=20}],
    ["sv15","🛡️","Survivant","15 mots d’affilée en survie",function(){return (G.st.sv||0)>=15}],
    ["mem","🧠","Mémoire d’éléphant","Memory en 14 coups ou moins",function(){return !!G.st.mem&&G.st.mem<=14}]
  ];
  function tone(f,t,d,type){
    try{
      if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();
      var o=actx.createOscillator(),g=actx.createGain(),s=actx.currentTime+t;
      o.type=type||"sine";o.frequency.value=f;g.gain.setValueAtTime(0.08,s);g.gain.exponentialRampToValueAtTime(0.0001,s+d);
      o.connect(g);g.connect(actx.destination);o.start(s);o.stop(s+d+0.02);
    }catch(e){}
  }
  function sound(k){
    if(G.mute)return;
    if(k==="ok"){tone(660,0,0.1);tone(880,0.09,0.14)}
    else if(k==="ko"){tone(200,0,0.25,"sawtooth")}
    else if(k==="lvl"){[523,659,784,1047].forEach(function(f,i){tone(f,i*0.1,0.18)})}
    else if(k==="flip"){tone(440,0,0.05)}
  }
  function confetti(){
    if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    var box=el("div","confetti"),E=["🎉","✨","🌸","⭐","🎌"];
    for(var i=0;i<36;i++){var s=el("span",null,E[Math.floor(Math.random()*E.length)]);
      s.style.left=Math.random()*100+"%";s.style.animationDelay=Math.random()*0.4+"s";s.style.animationDuration=(1.2+Math.random())+"s";box.appendChild(s)}
    document.body.appendChild(box);setTimeout(function(){box.remove()},2800);
  }
  function toast(m){queue.push(m);if(!showing)nextToast()}
  function nextToast(){
    var m=queue.shift();
    if(!m){showing=false;return}
    showing=true;tbox.textContent=m;tbox.className="toast on";
    setTimeout(function(){tbox.className="toast";setTimeout(nextToast,250)},2000);
  }
  function renderHud(){
    if(!hud)return;
    var l=level(G.xp),lo=floorXp(l),hi=floorXp(l+1);
    hud.lv.textContent="Niv. "+l+" · "+rank(l);
    hud.bar.style.width=Math.round((G.xp-lo)/(hi-lo)*100)+"%";
    hud.xp.textContent=G.xp+" XP";
    hud.st.textContent="🔥 "+streak();
    hud.goal.textContent="Objectif "+Math.min(G.days[today()]||0,GOAL)+"/"+GOAL;
    hud.mute.textContent=G.mute?"🔇":"🔊";
  }
  function commit(){
    BADGES.forEach(function(b){if(!G.badges[b[0]]&&b[4]()){G.badges[b[0]]=Date.now();toast("🏅 Succès : "+b[2]);sound("lvl")}});
    save(KEY,G);renderHud();
  }
  function xp(n){
    var l0=level(G.xp),t=today(),before=G.days[t]||0;
    G.xp+=n;G.days[t]=before+n;
    if(level(G.xp)>l0){toast("⬆️ Niveau "+level(G.xp)+" · "+rank(level(G.xp)));sound("lvl");confetti()}
    if(before<GOAL&&G.days[t]>=GOAL){toast("🎯 Objectif du jour atteint !");confetti()}
    commit();
  }
  function stat(k,n){G.st[k]=(G.st[k]||0)+(n===undefined?1:n);commit()}
  function best(k,v,low){var o=G.st[k];if(o===undefined||(low?v<o:v>o)){G.st[k]=v;commit();return true}return false}
  function correct(base){combo++;if(combo>(G.st.comboMax||0))G.st.comboMax=combo;G.st.good=(G.st.good||0)+1;sound("ok");xp((base||3)+Math.min(combo-1,5));return combo}
  function wrong(){combo=0;G.st.bad=(G.st.bad||0)+1;sound("ko");commit()}
  function mount(box){
    hud={lv:el("b"),xp:el("span","mut"),st:el("span"),goal:el("span","mut"),mute:el("button","mute")};
    hud.mute.setAttribute("aria-label","Activer ou couper le son");
    hud.mute.onclick=function(){G.mute=!G.mute;commit()};
    var top=el("div","hudrow"),track=el("div","bar");hud.bar=el("div");track.appendChild(hud.bar);
    [hud.lv,hud.xp,hud.st,hud.goal,hud.mute].forEach(function(x){top.appendChild(x)});
    box.appendChild(top);box.appendChild(track);renderHud();
  }
  return {state:G,BADGES:BADGES,GOAL:GOAL,xp:xp,stat:stat,best:best,correct:correct,wrong:wrong,toast:toast,confetti:confetti,sound:sound,mount:mount,
    level:level,rank:rank,streak:streak,combo:function(){return combo},resetCombo:function(){combo=0}};
})();
