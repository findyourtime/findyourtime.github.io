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
produit/<id>/index.html      Les 15 fiches produit, générées (voir « Pages générées »)
cgu.html, cookies.html, desinscription.html   Pages légales (voir « Conformité »)
robots.txt, sitemap.xml, llms.txt             Générés (voir « Pages générées »)
scripts/                     Générateurs, à relancer après modification du contenu
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

## Pages générées

Deux scripts produisent des fichiers versionnés. Il n'y a pas d'étape de
build au déploiement : on les relance à la main et on committe le
résultat.

```bash
python3 scripts/generer-fiches-produit.py   # produit/<id>/index.html
python3 scripts/generer-sitemap.py          # sitemap.xml + llms.txt
```

À relancer après toute modification de `data/products.json`, du gabarit
`produit.html`, ou après l'ajout d'un guide ou d'une page.

Pourquoi des fiches statiques : `produit.html` construisait la fiche en
JavaScript. Un navigateur suit, mais un robot d'indexation ou un agent
conversationnel qui n'exécute pas de JS ne voyait qu'un gabarit vide. Les
pages sous `produit/<id>/` contiennent le contenu dans le HTML, plus un
bloc JSON-LD. `produit.html?id=...` redirige vers elles (301, défini dans
`netlify.toml`).

Le JSON-LD des produits n'a **pas** de champ `offers`. Déclarer un prix
et une disponibilité ferait croire à un agent que la référence est
commandable, ce qui est faux tant que les ventes ne sont pas ouvertes. Le
prix figure comme simple propriété indicative. À revoir le jour où
`PAYMENTS_ENABLED` passe à `true`.

## Conformité et accessibilité

Pages légales : `mentions-legales.html` (LCEN), `cgu.html` (usage du
site), `cgv.html` (vente, en gabarit tant qu'aucune vente n'est
possible), `confidentialite.html` (RGPD), `cookies.html` (article 82 de
la loi Informatique et Libertés), `desinscription.html` (retrait du
consentement), `livraison-retours.html`.

**Pas de bandeau cookies, et c'est volontaire.** Le site ne pose aucun
cookie et n'écrit aujourd'hui aucune des deux entrées `localStorage`
prévues. L'article 82 n'exige le consentement que pour ce qui n'est pas
strictement nécessaire au service demandé. Afficher un bandeau ici
demanderait d'autoriser quelque chose qui n'existe pas. Le jour où un
outil de mesure est branché, `ANALYTICS_ENABLED` dans
`assets/js/config.js` fait apparaître le bandeau, et `cookies.html` doit
être mis à jour **avant**.

L'accessibilité se vérifie avec axe-core, pas seulement avec Lighthouse :
Lighthouse annonçait 100 alors qu'axe trouvait 38 violations réelles
(contraste des marqueurs `[À COMPLÉTER]`, bandeau de statut hors de tout
repère). État actuel : 0 violation sur 21 pages à deux largeurs, en
WCAG 2.2 AA.

Matrice de contraste de la palette, pour ne pas réintroduire une
combinaison illisible. Les valeurs sont des ratios ; il faut 4,5 pour du
texte normal et 3 pour du grand texte.

| texte sur → | craie | craie-haute | acier | acier-2 | encre |
|---|---|---|---|---|---|
| gris-fer | 5,68 | 6,38 | 2,33 | 1,94 | 2,58 |
| rouge | 4,73 | 5,32 | 2,79 | 2,33 | 3,09 |
| bleu | 5,53 | 6,21 | 2,39 | 2,00 | 2,65 |
| jaune | 2,54 | 2,85 | **5,21** | 4,35 | **5,77** |
| jaune-texte | 4,36 | **4,89** | 3,04 | 2,54 | 3,36 |
| vert | 6,04 | 6,78 | 2,19 | 1,83 | 2,42 |

`--jaune` ne sert que sur fond sombre, `--jaune-texte` que sur fond
clair. C'est pour ça qu'il y a deux jaunes.

Les surfaces translucides gardent une opacité calculée pour que le texte
reste lisible dans le pire cas, c'est-à-dire par-dessus le fond le plus
clair du site. L'en-tête sombre à 0,78 donne 7,8:1. Le flou n'est jamais
ce qui rend le texte lisible : il est décoratif, l'opacité fait le
travail.

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

## Hébergement

Le site est déployé sur deux hôtes et fonctionne sur les deux, avec une
différence à connaître :

- **GitHub Pages** — `https://findyourtime.github.io`, reconstruit
  automatiquement à chaque push sur `main`. GitHub Pages ne lit pas
  `netlify.toml` : ni les redirections ni les en-têtes de cache et de
  sécurité ne s'y appliquent, et **les formulaires Netlify n'y
  fonctionnent pas** (la soumission n'est capturée nulle part).
- **Netlify** — `https://fonte-athletique.netlify.app`. C'est l'hôte de
  référence : `netlify.toml` y est appliqué et les formulaires y sont
  capturés. Le site est relié au dépôt GitHub (branche `main`, aucune
  commande de build, publish `.`) et se reconstruit donc à chaque push,
  comme GitHub Pages. Il n'y a plus de dépôt manuel de fichiers à faire.

Les anciennes URL de guides en `.html` sont traitées uniquement par les
redirections 301 de `netlify.toml`. Ne jamais créer de fichier
`guides/<slug>.html` à côté d'un `guides/<slug>/index.html` : les deux se
disputent l'URL sans extension, Netlify sert le fichier, et le guide
devient inatteignable. C'est arrivé une fois.

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
