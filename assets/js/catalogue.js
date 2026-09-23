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
  var zoneFiltresActifs = document.getElementById('filtres-actifs');
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

  // Compte combien de produits correspondraient si on ajoutait ce filtre,
  // en tenant compte des filtres déjà actifs dans les AUTRES groupes.
  function compterAvec(groupe, valeur){
    return produits.filter(function(p){
      var okCategorie = !etat.categorie.size || etat.categorie.has(p.categorie) || (groupe === 'categorie' && p.categorie === valeur);
      var okEpaisseur = !etat.epaisseur.size || etat.epaisseur.has(epaisseurDe(p)) || (groupe === 'epaisseur' && epaisseurDe(p) === valeur);
      var okHomologation = !etat.homologation.size || etat.homologation.has(classerHomologation(p.homologation)) || (groupe === 'homologation' && classerHomologation(p.homologation) === valeur);
      if(groupe === 'categorie') return p.categorie === valeur && okEpaisseur && okHomologation;
      if(groupe === 'epaisseur') return epaisseurDe(p) === valeur && okCategorie && okHomologation;
      return classerHomologation(p.homologation) === valeur && okCategorie && okEpaisseur;
    }).length;
  }

  function chip(groupe, valeur, libelle){
    var actif = etat[groupe].has(valeur);
    var n = compterAvec(groupe, valeur);
    return (
      '<button type="button" class="chip'+(actif ? ' actif' : '')+'" role="switch" aria-checked="'+actif+'" data-groupe="'+groupe+'" data-valeur="'+valeur+'">' +
        libelle + ' <span class="n">'+n+'</span>' +
      '</button>'
    );
  }

  function construireFiltres(){
    var epaisseurs = Array.from(new Set(produits.map(epaisseurDe).filter(Boolean)))
      .sort(function(a,b){ return parseFloat(a) - parseFloat(b); });
    var homologations = Array.from(new Set(produits.map(function(p){ return classerHomologation(p.homologation); })));

    var html = '';
    html += '<fieldset><legend>Catégorie</legend><div class="chips">';
    Object.keys(LABELS_CATEGORIE).forEach(function(cle){
      html += chip('categorie', cle, LABELS_CATEGORIE[cle]);
    });
    html += '</div></fieldset>';

    html += '<fieldset><legend>Épaisseur</legend><div class="chips">';
    epaisseurs.forEach(function(v){
      html += chip('epaisseur', v, v);
    });
    html += '</div></fieldset>';

    html += '<fieldset><legend>Homologation</legend><div class="chips">';
    homologations.forEach(function(v){
      html += chip('homologation', v, LABELS_HOMOLOGATION[v]);
    });
    html += '</div></fieldset>';

    zoneFiltres.innerHTML = html;

    zoneFiltres.querySelectorAll('.chip').forEach(function(bouton){
      bouton.addEventListener('click', function(){
        var groupe = bouton.getAttribute('data-groupe');
        var valeur = bouton.getAttribute('data-valeur');
        if(etat[groupe].has(valeur)){ etat[groupe].delete(valeur); } else { etat[groupe].add(valeur); }
        construireFiltres();
        rendre();
      });
    });
  }

  function libelleFiltre(groupe, valeur){
    if(groupe === 'categorie') return LABELS_CATEGORIE[valeur];
    if(groupe === 'homologation') return LABELS_HOMOLOGATION[valeur];
    return valeur;
  }

  function rendreFiltresActifs(){
    var pilules = [];
    ['categorie','epaisseur','homologation'].forEach(function(groupe){
      etat[groupe].forEach(function(valeur){
        pilules.push(
          '<span class="pilule-filtre">' + libelleFiltre(groupe, valeur) +
            '<button type="button" data-retirer-groupe="'+groupe+'" data-retirer-valeur="'+valeur+'" aria-label="Retirer le filtre '+libelleFiltre(groupe, valeur)+'">✕</button>' +
          '</span>'
        );
      });
    });
    zoneFiltresActifs.innerHTML = pilules.join('');
    boutonReinit.hidden = pilules.length === 0;
    zoneFiltresActifs.querySelectorAll('[data-retirer-groupe]').forEach(function(b){
      b.addEventListener('click', function(){
        etat[b.getAttribute('data-retirer-groupe')].delete(b.getAttribute('data-retirer-valeur'));
        construireFiltres();
        rendre();
      });
    });
  }

  function appliquerParamInitial(){
    var cat = paramsURL().get('categorie');
    if(cat && LABELS_CATEGORIE[cat]){
      etat.categorie.add(cat);
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

  // Les valeurs viennent de products.json, donc maîtrisées, mais elles sont
  // injectées dans des attributs HTML : on les échappe pour qu'une apostrophe
  // ou un chevron dans un nom de produit ne casse pas le balisage.
  function ech(t){
    return String(t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function carte(p, index){
    var puce = classerHomologation(p.homologation);
    var couleurPuce = puce === 'conforme' ? 'vert' : (puce === 'non-conforme' ? 'gris' : 'jaune');
    var img = (p.images && p.images[0]) || '';
    return (
      '<article class="carte-produit" style="--i:'+index+'">' +
        '<a class="lien-carte" href="/produit.html?id='+encodeURIComponent(p.id)+'" aria-label="Voir la fiche '+ech(p.nom)+'">' +
          '<div class="vignette"><img src="'+img+'" alt="Schéma technique — '+ech(p.nom)+'" loading="lazy" width="400" height="300"></div>' +
          '<div class="corps">' +
            '<span class="gamme">Gamme '+ech(p.gamme)+'</span>' +
            '<h2>'+ech(p.nom)+'</h2>' +
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
    grille.innerHTML = resultats.map(carte).join('') || '<p>Aucune référence ne correspond à ces filtres. <button type="button" class="btn secondaire" id="reinit-depuis-vide">Réinitialiser les filtres</button></p>';
    var reinitVide = document.getElementById('reinit-depuis-vide');
    if(reinitVide){ reinitVide.addEventListener('click', reinitialiser); }
    rendreFiltresActifs();
  }

  function reinitialiser(){
    etat.categorie.clear(); etat.epaisseur.clear(); etat.homologation.clear();
    construireFiltres();
    rendre();
  }

  if(boutonReinit){ boutonReinit.addEventListener('click', reinitialiser); }

  fetch('/data/products.json')
    .then(function(r){ return r.json(); })
    .then(function(data){
      produits = data;
      appliquerParamInitial();
      construireFiltres();
      rendre();
    });
})();
