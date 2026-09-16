(function(){
  var LABELS_CATEGORIE = {
    'ceinture':'Ceintures','genouillere':'Genouillères','sangle':'Bandes de genou',
    'strap':'Sangles de tirage','grip':'Crochets de tirage','wrist-wrap':'Wrist wraps'
  };
  var TITRES_GUIDE = {
    'ceinture-10-ou-13-mm':'Ceinture de force 10 ou 13 mm : ce que change vraiment l’épaisseur',
    'levier-boucle':'Ceinture à levier ou à boucle : lequel choisir',
    'genouilleres':'Genouillères 5 ou 7 mm : choisir selon votre discipline',
    'homologation-ipf':'L’homologation IPF : ce que ça veut dire, et quand ça compte'
  };

  function classerHomologation(texte){
    texte = (texte || '').toLowerCase();
    if(texte.indexOf('conforme') === 0) return 'conforme';
    if(texte.indexOf('non ') === 0 || texte.indexOf('non homolog') !== -1) return 'non-conforme';
    return 'variable';
  }

  function libelleStock(s){
    return { disponible:'Disponible', rupture_temporaire:'Rupture temporaire', a_venir:'À venir' }[s] || s;
  }

  function scinderDescription(texte){
    var m = /Ce qu[\s\S]{0,90}?ne fai(t|ent) pas/i.exec(texte);
    if(!m) return { usage: texte, limites: '' };
    return { usage: texte.slice(0, m.index).trim(), limites: texte.slice(m.index).trim() };
  }

  function el(id){ return document.getElementById(id); }

  var id = new URLSearchParams(window.location.search).get('id');

  fetch('/data/products.json')
    .then(function(r){ return r.json(); })
    .then(function(produits){
      var p = produits.find(function(x){ return x.id === id; });
      if(!p){
        el('fiche-produit').innerHTML = '<p>Référence introuvable. <a href="/catalogue.html">Retour au catalogue.</a></p>';
        return;
      }
      document.title = p.nom + ' — FONTE';
      var meta = document.querySelector('meta[name="description"]');
      if(meta) meta.setAttribute('content', p.description_courte);

      el('fil-categorie').textContent = LABELS_CATEGORIE[p.categorie] || p.categorie;
      el('fil-categorie').href = '/catalogue.html?categorie=' + encodeURIComponent(p.categorie);
      el('fil-nom').textContent = p.nom;

      var puce = classerHomologation(p.homologation);
      var couleurPuce = puce === 'conforme' ? 'vert' : (puce === 'non-conforme' ? 'gris' : 'jaune');

      var visu = el('visu-produit');
      visu.src = p.images[0];
      visu.alt = 'Schéma technique — ' + p.nom;

      el('produit-gamme').textContent = 'Gamme ' + p.gamme;
      el('produit-nom').textContent = p.nom;
      el('produit-tags').innerHTML =
        '<span class="tag '+couleurPuce+'">'+p.homologation+'</span>' +
        '<span class="statut-stock '+p.stock_statut+'">'+libelleStock(p.stock_statut)+'</span>';
      el('produit-prix').textContent = p.prix + ' €';
      el('produit-description-courte').textContent = p.description_courte;

      el('produit-specs').innerHTML = Object.keys(p.specs).map(function(cle){
        var val = p.specs[cle];
        if(Array.isArray(val)) val = val.join(', ');
        return '<tr><th scope="row">'+cle+'</th><td>'+val+'</td></tr>';
      }).join('');

      var d = scinderDescription(p.description_longue);
      el('produit-usage').textContent = d.usage;
      if(d.limites){
        el('produit-limites').textContent = d.limites;
        el('produit-limites-bloc').hidden = false;
      }

      // guide_choix_lié accepte un slug ou une liste de slugs : une ceinture
      // renvoie à la fois vers le guide d'épaisseur et vers son guide spécifique.
      var guides = p.guide_choix_lié;
      if(typeof guides === 'string'){ guides = [guides]; }
      el('produit-guides').innerHTML = (guides || [])
        .filter(function(slug){ return TITRES_GUIDE[slug]; })
        .map(function(slug){
          return '<a class="lien-guide" href="/guides/' + slug + '/">' +
                   '<span class="n">GUIDE&nbsp;DE&nbsp;CHOIX</span>' +
                   '<strong>' + TITRES_GUIDE[slug] + '</strong>' +
                 '</a>';
        }).join('');

      el('champ-produit-id').value = p.id;
      el('champ-produit-nom').value = p.nom;

      if(window.FONTE_CONFIG && window.FONTE_CONFIG.PAYMENTS_ENABLED){
        var boutonPanier = el('bouton-panier');
        boutonPanier.style.display = 'block';
        boutonPanier.addEventListener('click', function(){
          window.FONTE_CART.ajouter(p.id, 1);
        });
      }
    });
})();
