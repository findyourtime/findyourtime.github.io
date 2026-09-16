# Skills installés dans ce projet

Ces skills viennent de dépôts tiers et sont copiés ici tels quels. Ce
dossier est de l'outillage de développement : il n'est pas servi par le
site (règle 404 dans `netlify.toml`).

| Skill | Origine | Version |
|---|---|---|
| `ui-ux-pro-max`, `ui-styling`, `design`, `design-system`, `brand`, `banner-design`, `slides` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — plugin `ui-ux-pro-max` | 2.13.0 |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 4.3.1 (moteur 0.1.5) |

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
