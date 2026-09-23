(function(){
  var LABELS_CATEGORIE = {
    'ceinture':'Ceintures','genouillere':'Genouillères','sangle':'Bandes de genou',
    'strap':'Sangles de tirage','grip':'Crochets de tirage','wrist-wrap':'Wrist wraps'
  };

  var selectCategorie = document.getElementById('select-categorie');
  var slots = [document.getElementById('slot-0'), document.getElementById('slot-1'), document.getElementById('slot-2')];
  var zoneTableau = document.getElementById('zone-tableau');

  var produits = [];

  function optionsPourCategorie(cat){
    return produits.filter(function(p){ return p.categorie === cat; });
  }

  function remplirCategories(){
    var cats = Array.from(new Set(produits.map(function(p){ return p.categorie; })));
    selectCategorie.innerHTML = cats.map(function(c){
      return '<option value="'+c+'">'+LABELS_CATEGORIE[c]+'</option>';
    }).join('');
  }

  function remplirSlots(){
    var cat = selectCategorie.value;
    var options = optionsPourCategorie(cat);
    slots.forEach(function(select, i){
      var courant = select.value;
      select.innerHTML = '<option value="">— aucun —</option>' + options.map(function(p){
        return '<option value="'+p.id+'">'+p.nom+'</option>';
      }).join('');
      if(options[i]) select.value = options[i].id;
      else select.value = '';
    });
    rendreTableau();
  }

  function rendreTableau(){
    var choisis = slots.map(function(s){ return s.value; }).filter(Boolean);
    var items = choisis.map(function(id){ return produits.find(function(p){ return p.id === id; }); }).filter(Boolean);

    if(items.length < 2){
      zoneTableau.innerHTML = '<p>Choisissez au moins deux références à comparer.</p>';
      return;
    }

    var toutesLesCles = [];
    items.forEach(function(p){
      Object.keys(p.specs).forEach(function(cle){
        if(toutesLesCles.indexOf(cle) === -1) toutesLesCles.push(cle);
      });
    });

    function valeur(p, cle){
      var v = p.specs[cle];
      if(v === undefined) return '—';
      return Array.isArray(v) ? v.join(', ') : v;
    }

    var enTete = '<tr><th scope="col">Caractéristique</th>' + items.map(function(p){
      return '<th scope="col">'+p.nom+'<br><span class="num" style="font-weight:400;">'+p.prix+' €</span></th>';
    }).join('') + '</tr>';

    var lignes = toutesLesCles.map(function(cle){
      var valeurs = items.map(function(p){ return valeur(p, cle); });
      var diff = valeurs.some(function(v){ return v !== valeurs[0]; });
      return '<tr><th scope="row">'+cle+'</th>' + valeurs.map(function(v){
        return '<td'+(diff ? ' class="diff"' : '')+'>'+v+'</td>';
      }).join('') + '</tr>';
    }).join('');

    var ligneLien = '<tr><th scope="row">Fiche complète</th>' + items.map(function(p){
      return '<td><a href="/produit/'+encodeURIComponent(p.id)+'/">Voir la fiche</a></td>';
    }).join('') + '</tr>';

    zoneTableau.innerHTML = (
      '<div class="tableau-comparateur-wrap">' +
        '<table class="comparateur">' +
          '<thead>'+enTete+'</thead>' +
          '<tbody>'+lignes+ligneLien+'</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  selectCategorie.addEventListener('change', remplirSlots);
  slots.forEach(function(s){ s.addEventListener('change', rendreTableau); });

  fetch('/data/products.json')
    .then(function(r){ return r.json(); })
    .then(function(data){
      produits = data;
      remplirCategories();
      remplirSlots();
    });
})();
