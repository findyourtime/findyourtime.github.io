(function(){
  var LABELS_CATEGORIE = {
    'ceinture':'Ceintures',
    'genouillere':'Genouillères',
    'sangle':'Bandes de genou',
    'strap':'Sangles de tirage',
    'grip':'Crochets de tirage',
    'wrist-wrap':'Wrist wraps'
  };

  var grille = document.getElementById('grille-produits');
  var compteur = document.getElementById('compteur-resultats');
  var zoneFiltres = document.getElementById('filtres-dynamiques');
  var boutonReinit = document.getElementById('reinit-filtres');

  var produits = [];
  var etat = { categorie: new Set(), epaisseur: new Set(), homologation: new Set() };

  function classerHomologation(texte){
    texte = (texte || '').toLowerCase();
    if(texte.indexOf('conforme') === 0) return 'conforme';
    if(texte.indexOf('non ') === 0 || texte.indexOf('non homolog') !== -1) return 'non-conforme';
    return 'variable';
  }
  var LABELS_HOMOLOGATION = {
    'conforme':'Conforme IPF',
    'non-conforme':'Non homologuée',
    'variable':'Selon fédération / discipline'
  };

  function epaisseurDe(p){
    return p.specs && p.specs['Épaisseur'] ? p.specs['Épaisseur'] : null;
  }

  function paramsURL(){
    return new URLSearchParams(window.location.search);
  }

  function construireFiltres(){
    var epaisseurs = Array.from(new Set(produits.map(epaisseurDe).filter(Boolean)))
      .sort(function(a,b){ return parseFloat(a) - parseFloat(b); });
    var homologations = Array.from(new Set(produits.map(function(p){ return classerHomologation(p.homologation); })));

    var html = '';
    html += '<fieldset><legend>Catégorie</legend>';
    Object.keys(LABELS_CATEGORIE).forEach(function(cle){
      html += '<label><input type="checkbox" data-groupe="categorie" value="'+cle+'"> '+LABELS_CATEGORIE[cle]+'</label>';
    });
    html += '</fieldset>';

    html += '<fieldset><legend>Épaisseur</legend>';
    epaisseurs.forEach(function(v){
      html += '<label><input type="checkbox" data-groupe="epaisseur" value="'+v+'"> '+v+'</label>';
    });
    html += '</fieldset>';

    html += '<fieldset><legend>Homologation</legend>';
    homologations.forEach(function(v){
      html += '<label><input type="checkbox" data-groupe="homologation" value="'+v+'"> '+LABELS_HOMOLOGATION[v]+'</label>';
    });
    html += '</fieldset>';

    zoneFiltres.innerHTML = html;

    zoneFiltres.querySelectorAll('input[type="checkbox"]').forEach(function(input){
      input.addEventListener('change', function(){
        var groupe = etat[input.getAttribute('data-groupe')];
        if(input.checked){ groupe.add(input.value); } else { groupe.delete(input.value); }
        rendre();
      });
    });
  }

  function appliquerParamInitial(){
    var cat = paramsURL().get('categorie');
    if(cat && LABELS_CATEGORIE[cat]){
      etat.categorie.add(cat);
      var input = zoneFiltres.querySelector('input[data-groupe="categorie"][value="'+cat+'"]');
      if(input) input.checked = true;
    }
  }

  function correspond(p){
    if(etat.categorie.size && !etat.categorie.has(p.categorie)) return false;
    if(etat.epaisseur.size){
      var e = epaisseurDe(p);
      if(!e || !etat.epaisseur.has(e)) return false;
    }
    if(etat.homologation.size && !etat.homologation.has(classerHomologation(p.homologation))) return false;
    return true;
  }

  function carte(p){
    var puce = classerHomologation(p.homologation);
    var couleurPuce = puce === 'conforme' ? 'vert' : (puce === 'non-conforme' ? 'gris' : 'jaune');
    var img = (p.images && p.images[0]) || '';
    return (
      '<article class="carte-produit">' +
        '<a class="lien-carte" href="/produit.html?id='+encodeURIComponent(p.id)+'" aria-label="Voir la fiche '+p.nom+'">' +
          '<div class="vignette"><img src="'+img+'" alt="" loading="lazy" width="400" height="300"></div>' +
          '<div class="corps">' +
            '<span class="gamme">Gamme '+p.gamme+'</span>' +
            '<h2>'+p.nom+'</h2>' +
            '<div class="specs-rapides">' +
              (epaisseurDe(p) ? '<span class="tag gris">'+epaisseurDe(p)+'</span>' : '') +
              '<span class="tag '+couleurPuce+'">'+LABELS_HOMOLOGATION[puce]+'</span>' +
            '</div>' +
            '<div class="bas">' +
              '<span class="prix num">'+p.prix+' €</span>' +
              '<span class="statut-stock '+p.stock_statut+'">'+libelleStock(p.stock_statut)+'</span>' +
            '</div>' +
          '</div>' +
        '</a>' +
      '</article>'
    );
  }

  function libelleStock(s){
    return { disponible:'Disponible', rupture_temporaire:'Rupture temporaire', a_venir:'À venir' }[s] || s;
  }

  function rendre(){
    var resultats = produits.filter(correspond);
    compteur.textContent = resultats.length + ' référence' + (resultats.length !== 1 ? 's' : '');
    grille.innerHTML = resultats.map(carte).join('') || '<p>Aucune référence ne correspond à ces filtres.</p>';
  }

  if(boutonReinit){
    boutonReinit.addEventListener('click', function(){
      etat.categorie.clear(); etat.epaisseur.clear(); etat.homologation.clear();
      zoneFiltres.querySelectorAll('input[type="checkbox"]').forEach(function(i){ i.checked = false; });
      rendre();
    });
  }

  fetch('/data/products.json')
    .then(function(r){ return r.json(); })
    .then(function(data){
      produits = data;
      construireFiltres();
      appliquerParamInitial();
      rendre();
    });
})();
