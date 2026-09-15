/**
 * Configuration du site.
 *
 * PAYMENTS_ENABLED est le seul interrupteur à activer pour passer du mode
 * "mise en relation" (formulaire Netlify, pas de paiement) au mode panier +
 * paiement réel. Le panier ci-dessous est déjà fonctionnel (stockage local,
 * ajout, quantité, total) : il est juste caché dans l'interface tant que ce
 * flag est à false. Voir README.md > "Activer les paiements".
 *
 * ANALYTICS_ENABLED contrôle l'affichage du bandeau cookies RGPD. Tant
 * qu'aucun outil de mesure n'est branché, aucun cookie non essentiel n'est
 * posé et le bandeau reste masqué.
 */
window.FONTE_CONFIG = {
  PAYMENTS_ENABLED: false,
  ANALYTICS_ENABLED: false
};

window.FONTE_CART = (function(){
  var CLE = 'fonte_panier';

  function lire(){
    try{
      return JSON.parse(localStorage.getItem(CLE)) || [];
    }catch(e){ return []; }
  }
  function ecrire(lignes){
    localStorage.setItem(CLE, JSON.stringify(lignes));
  }
  function ajouter(id, quantite){
    quantite = quantite || 1;
    var lignes = lire();
    var ligne = lignes.find(function(l){ return l.id === id; });
    if(ligne){ ligne.quantite += quantite; } else { lignes.push({ id:id, quantite:quantite }); }
    ecrire(lignes);
    return lignes;
  }
  function retirer(id){
    ecrire(lire().filter(function(l){ return l.id !== id; }));
  }
  function total(){
    return lire().reduce(function(n,l){ return n + l.quantite; }, 0);
  }
  function vider(){ ecrire([]); }

  return { lire:lire, ajouter:ajouter, retirer:retirer, total:total, vider:vider };
})();
