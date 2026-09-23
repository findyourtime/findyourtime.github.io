# Skills installés dans ce projet

Ces skills viennent de dépôts tiers et sont copiés ici tels quels. Ce
dossier est de l'outillage de développement : il n'est pas servi par le
site (règle 404 dans `netlify.toml`).

| Skill | Origine | Version |
|---|---|---|
| `ui-ux-pro-max`, `ui-styling`, `design`, `design-system`, `brand`, `banner-design`, `slides` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — plugin `ui-ux-pro-max` | 2.13.0 |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 4.3.1 (moteur 0.1.5) |
| `frontend-design-direction`, `make-interfaces-feel-better`, `accessibility`, `inherit-legacy-style`, `browser-qa`, `brand-discovery` | [affaan-m/ECC](https://github.com/affaan-m/ECC) | 2.2.2 |

## Pourquoi seulement 6 skills sur les 292 d'ECC

ECC n'est pas un skill mais une plateforme : 292 skills, 68 agents, des
hooks et des commandes. Tout installer coûterait environ 20 000 tokens de
contexte chargés dans **chaque** session de ce dépôt, pour un catalogue
très majoritairement hors sujet ici (Kotlin, ClickHouse, Cisco IOS,
conformité douanière, homelab…). Seuls les skills qui portent sur le
design web et le graphisme ont été retenus.

Écartés volontairement, même s'ils touchent au design :

- `design-system` d'ECC — même nom que celui de ui-ux-pro-max déjà
  installé, et bien plus succinct (8 Ko contre 272 Ko). L'installer
  l'aurait écrasé.
- `motion-foundations`, `motion-patterns`, `motion-advanced`,
  `frontend-patterns`, `frontend-a11y` — écrits pour React / Next.js et
  la bibliothèque `motion/react`. Ce site est en JavaScript natif.
- `liquid-glass-design`, `ios-icon-gen` — iOS / SwiftUI.
- `taste`, `taste-application`, `taste-distillation` — malgré leur nom,
  il s'agit de direction créative pour clips musicaux et montage vidéo.
- `frontend-slides`, `dashboard-builder`, `ui-to-vue` — hors sujet.

Pour en ajouter d'autres : le dépôt ECC expose des profils
(`manifests/install-profiles.json`, de `minimal` à `full`) et son propre
installeur `install.sh`.

## Mettre à jour

Les deux projets fournissent un installeur officiel, qui gère aussi les
hooks et la configuration hors de ce dossier :

```bash
npx impeccable install                  # pbakaus/impeccable
npm install -g ui-ux-pro-max-cli && uipro init --ai claude   # nextlevelbuilder
```

Sinon, recopier `.claude/skills/` depuis chaque dépôt.

## À savoir sur `impeccable`

Le skill n'embarque pas son moteur : `scripts/impeccable` cherche un
binaire, et le télécharge dans `~/.impeccable/bin/` au premier appel s'il
ne le trouve pas. Dans un environnement sans accès réseau sortant, ce
téléchargement échoue ; le SKILL.md prévoit ce cas et bascule sur une
lecture directe de `PRODUCT.md` / `DESIGN.md`. Aucun des deux skills n'a
de `PRODUCT.md` ni de `DESIGN.md` dans ce projet pour l'instant :
`/impeccable init` et `/impeccable document` les créent.
