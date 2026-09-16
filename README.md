# FONTE — boutique matériel de force athlétique

Site vitrine + catalogue pour une boutique de matériel de force athlétique
(ceintures, genouillères, bandes de genou, sangles de tirage, crochets, wrist
wraps), en pré-lancement : pas de paiement en ligne, formulaire de mise en
relation par fiche produit.

## Stack et choix technique

HTML/CSS/JS statique, sans framework ni build step. Justification en une
ligne : un catalogue de 15 références n'a besoin ni d'Astro ni d'un
générateur de site — un fetch de `data/products.json` au chargement de la
page suffit à rendre catalogue, fiche produit et comparateur, et ça reste le
chemin le plus direct vers un score Lighthouse élevé sur mobile (pas de
bundle JS à télécharger, pas de framework à hydrater).

Déploiement visé : Netlify (`netlify.toml` à la racine, `publish = "."`,
aucune commande de build nécessaire).

## Structure du projet

```
index.html                 Accueil
catalogue.html              Catalogue filtrable (JS)
produit.html?id=...          Gabarit de fiche produit (JS, un seul fichier pour les 15 références)
comparateur.html            Comparateur 2-3 produits
guides.html                  Index des guides
guides/<slug>/index.html     Les 4 guides de fond, en URL propres (/guides/<slug>/)
livraison-retours.html, mentions-legales.html, cgv.html, confidentialite.html
merci.html                   Page de confirmation après un formulaire Netlify
404.html
data/products.json          Catalogue produit (source unique)
assets/css/style.css        Feuille de style unique
assets/js/config.js          Flag PAYMENTS_ENABLED + panier (localStorage)
assets/js/main.js            Nav mobile, bandeau cookies, animation hero, envoi AJAX des formulaires
assets/js/catalogue.js, produit.js, comparateur.js
assets/img/*.svg             Illustrations techniques (schémas, pas de photos produit — voir plus bas)
```

## Ajouter un produit

1. Ouvrir `data/products.json`.
2. Ajouter un objet avec les champs : `id` (slug unique, utilisé dans l'URL
   `produit.html?id=...`), `nom`, `categorie` (une des 6 valeurs utilisées
   ailleurs : `ceinture`, `genouillere`, `sangle`, `strap`, `grip`,
   `wrist-wrap`), `gamme`, `prix`, `specs` (objet libre — chaque clé devient
   une ligne du tableau de specs), `homologation` (texte court affiché en
   badge), `description_courte`, `description_longue`, `guide_choix_lié`
   (liste de slugs de `guides/` — un slug seul ou `null` restent acceptés ;
   toutes les ceintures pointent vers `ceinture-10-ou-13-mm`), `images` (tableau de
   chemins, un seul élément suffit), `stock_statut`
   (`disponible` / `rupture_temporaire` / `a_venir`).
3. Rien d'autre à modifier : catalogue, fiche produit et comparateur lisent
   ce fichier au chargement.

Note sur `description_longue` : la fiche produit détecte automatiquement la
phrase commençant par « Ce qu'... ne fait/font pas » (regex dans
`assets/js/produit.js`) pour créer le bloc « Ce que ce produit ne fait
pas ». Gardez cette formulation, ou ajustez la regex si vous changez de
formule.

### Illustrations produit

Il n'existe pas de photos produit réelles (les références sont fictives,
en pré-lancement). Les images sont des schémas techniques SVG
(`assets/img/diagram-*.svg`), pas des photos — cohérent avec le
positionnement du site (specs avant esthétique) et plus honnête qu'une
photo générique. Remplacez-les par de vraies photos produit dès qu'elles
existent, en gardant le ratio 4:3.

## Activer les paiements

Une seule modification : dans `assets/js/config.js`, passer
`PAYMENTS_ENABLED` à `true`.

Ce que ça change automatiquement :
- La fiche produit affiche un bouton « Ajouter au panier » sous le
  formulaire de mise en relation (`assets/js/produit.js`).
- Le module panier (`window.FONTE_CART` dans `config.js`) est déjà
  fonctionnel : stockage `localStorage`, ajout, quantité, total. Il n'est
  simplement pas branché à une interface de panier visible tant que le
  flag est à `false`.

Ce que ça ne fait pas automatiquement, et qui reste à construire :
- Une page panier et un tunnel de commande.
- L'intégration d'un prestataire de paiement (Stripe, etc.) — impossible
  avant l'immatriculation de la structure juridique.
- La mise à jour des CGV (article 4, actuellement en gabarit) avec les
  modalités réelles de paiement.

Le formulaire de mise en relation (Netlify Forms) peut rester actif même
après l'activation des paiements, pour les produits en rupture ou à venir.

## Points bloquants avant une mise en ligne réelle

- **Structure juridique inexistante** : SIREN/SIRET, raison sociale,
  régime de TVA — tout `[À COMPLÉTER]` dans `mentions-legales.html` et
  `cgv.html` dépend de cette immatriculation. Sans elle, ni vente réelle ni
  CGV valides ne sont possibles.
- **Fournisseurs et délais de livraison non négociés** : les délais dans
  `livraison-retours.html` sont en gabarit exprès. Ne pas les remplir par
  un chiffre optimiste — le brief interdit explicitement les délais qui ne
  correspondent pas à la réalité de l'approvisionnement.
- **Aucune photo produit réelle** : les 15 références sont fictives, sans
  fournisseur identifié. Les visuels actuels sont des schémas techniques,
  pas des photos.
- **Aucun avis client** : la structure d'affichage existe dans le CSS
  (`.bloc-avis`) mais n'est utilisée nulle part — volontairement, pour ne
  pas afficher de faux avis. À intégrer une fois de vrais avis disponibles.
- **Aucun outil de mesure d'audience branché** : le bandeau cookies RGPD
  est prêt (`assets/js/main.js`, contrôlé par `ANALYTICS_ENABLED` dans
  `config.js`) mais désactivé, donc invisible, tant qu'aucun outil n'est
  ajouté — conforme au RGPD puisqu'aucun cookie non essentiel n'est
  actuellement déposé.
- **Homologation IPF non vérifiée par un tiers** : les statuts
  d'homologation dans `products.json` sont écrits de bonne foi à partir des
  règlements publics, mais aucun produit n'existe réellement — à faire
  vérifier auprès de la fédération concernée avant toute mise en avant
  commerciale de ces mentions.
- **Fichiers d'un projet précédent laissés à la racine** : ce dépôt
  contenait un projet sans rapport (« Find Your Time », une application de
  productivité) avant ce brief. `logo.png`, `manifest.json`,
  `package.json`, `server.js` et `sw.js` en sont les restes ; ils ne sont
  référencés par aucune page de ce site et peuvent être supprimés
  manuellement (l'agent qui a construit ce site n'a pas eu l'autorisation
  de les supprimer automatiquement).

## Formulaires Netlify

Chaque fiche produit contient un formulaire statique nommé
`mise-en-relation` (visible dans le HTML de `produit.html`, avec un champ
caché `produit_id` rempli par JS selon le produit affiché). Netlify détecte
ce formulaire au déploiement parce qu'il existe dans le HTML brut du
fichier, indépendamment du fait que son contenu (specs, description) soit
injecté par JavaScript. `assets/js/main.js` envoie la soumission en AJAX
avec repli sur une soumission classique (redirection vers `merci.html`) si
JavaScript est indisponible.

## Vérifications effectuées

- Responsive mobile-first, testé visuellement à 375px de large.
- Contraste des couleurs et focus clavier visibles sur tous les éléments
  interactifs.
- `prefers-reduced-motion` respecté (l'animation du hero est désactivée,
  l'état final s'affiche directement).
- Pas de compteur de stock factice, pas de faux avis, pas de prix barré.
