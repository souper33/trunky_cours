/* Onglet Succès : niveau, statistiques et badges */
(function(){
  var root=document.getElementById("profil");
  function render(){
    root.textContent="";var G=Game.state,st=G.st,l=Game.level(G.xp);
    root.appendChild(el("h2",null,"Niveau "+l+" · "+Game.rank(l)));
    var box=el("div","box");
    [["XP total",G.xp],["Série en cours",Game.streak()+" jour"+(Game.streak()>1?"s":"")+" (objectif : "+Game.GOAL+" XP par jour)"],
     ["Cartes notées",st.cards||0],["Bonnes réponses",st.good||0],["Meilleur combo","×"+(st.comboMax||0)],["Mots écrits sans erreur",st.words||0],
     ["QCM sans faute",st.perfect||0]].forEach(function(r){
      var d=el("div","stat");d.appendChild(el("span","mut",r[0]));d.appendChild(el("b",null,String(r[1])));box.appendChild(d);
    });
    root.appendChild(box);
    var n=Object.keys(G.badges).length;
    root.appendChild(el("h2",null,"Succès : "+n+" sur "+Game.BADGES.length));
    var grid=el("div","badges");
    Game.BADGES.forEach(function(b){
      var on=!!G.badges[b[0]],d=el("div","bd"+(on?" on":""));
      d.appendChild(el("span","ic",on?b[1]:"🔒"));d.appendChild(el("b",null,b[2]));d.appendChild(el("small","mut",b[3]));grid.appendChild(d);
    });
    root.appendChild(grid);
  }
  ONSHOW.profil=render;
})();
