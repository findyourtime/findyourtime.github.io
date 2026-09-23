# -*- coding: utf-8 -*-
"""
Génère une page statique par produit dans /produit/<id>/index.html.

Pourquoi : produit.html construit la fiche en JavaScript à partir de
products.json. Un navigateur y arrive très bien, mais un agent qui
n'exécute pas de JS — la plupart des robots d'indexation et des agents
conversationnels — ne voit qu'un gabarit vide. Les pages générées ici
contiennent le contenu réel dans le HTML, plus un bloc JSON-LD.

Usage : python3 scripts/generer-fiches-produit.py
À relancer après toute modification de data/products.json ou du gabarit
produit.html.
"""
import html
import io
import json
import os
import re

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://fonte-athletique.netlify.app"

LABELS_CATEGORIE = {
    "ceinture": "Ceintures", "genouillere": "Genouillères", "sangle": "Bandes de genou",
    "strap": "Sangles de tirage", "grip": "Crochets de tirage", "wrist-wrap": "Wrist wraps",
}
LABELS_STOCK = {
    "disponible": "Disponible", "rupture_temporaire": "Rupture temporaire", "a_venir": "À venir",
}
TITRES_GUIDE = {
    "ceinture-10-ou-13-mm": "Ceinture de force 10 ou 13 mm : ce que change vraiment l’épaisseur",
    "levier-boucle": "Ceinture à levier ou à boucle : lequel choisir",
    "genouilleres": "Genouillères 5 ou 7 mm : choisir selon votre discipline",
    "homologation-ipf": "L’homologation IPF : ce que ça veut dire, et quand ça compte",
}


def e(t):
    return html.escape(str(t), quote=True)


def classer_homologation(texte):
    t = (texte or "").lower()
    if t.startswith("conforme"):
        return "conforme"
    if t.startswith("non ") or "non homolog" in t:
        return "non-conforme"
    return "variable"


def scinder_description(texte):
    m = re.search(r"Ce qu[\s\S]{0,90}?ne fai(t|ent) pas", texte, re.I)
    if not m:
        return texte.strip(), ""
    return texte[: m.start()].strip(), texte[m.start():].strip()


def bloc_specs(specs):
    lignes = []
    for cle, val in specs.items():
        if isinstance(val, list):
            val = ", ".join(val)
        lignes.append(f'<tr><th scope="row">{e(cle)}</th><td>{e(val)}</td></tr>')
    return "\n            ".join(lignes)


def bloc_guides(p):
    guides = p.get("guide_choix_lié") or []
    if isinstance(guides, str):
        guides = [guides]
    out = []
    for slug in guides:
        if slug not in TITRES_GUIDE:
            continue
        out.append(
            f'<a class="lien-guide" href="/guides/{slug}/">'
            f'<span class="n">GUIDE&nbsp;DE&nbsp;CHOIX</span>'
            f"<strong>{e(TITRES_GUIDE[slug])}</strong></a>"
        )
    return "\n          ".join(out)


def jsonld(p):
    """
    Pas de champ `offers` : le site ne permet aucun achat. Déclarer une
    Offer avec un prix ferait croire à un agent que le produit est
    commandable, ce qu'il n'est pas. Le prix reste lisible sur la page et
    figure ici comme simple propriété indicative.
    """
    props = []
    for cle, val in p["specs"].items():
        if isinstance(val, list):
            val = ", ".join(val)
        props.append({"@type": "PropertyValue", "name": cle, "value": str(val)})
    props.append({"@type": "PropertyValue", "name": "Prix indicatif", "value": f"{p['prix']} EUR"})
    props.append({"@type": "PropertyValue", "name": "Homologation", "value": p["homologation"]})
    props.append({"@type": "PropertyValue", "name": "Disponibilité annoncée",
                  "value": LABELS_STOCK.get(p["stock_statut"], p["stock_statut"])})

    produit = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p["nom"],
        "description": p["description_courte"],
        "category": LABELS_CATEGORIE.get(p["categorie"], p["categorie"]),
        "sku": p["id"],
        "brand": {"@type": "Brand", "name": "FONTE"},
        "url": f"{SITE}/produit/{p['id']}/",
        "image": f"{SITE}/{p['images'][0].lstrip('/')}",
        "additionalProperty": props,
        "disambiguatingDescription":
            "Boutique en pré-lancement : ce produit n'est pas vendable en ligne. "
            "Le prix affiché est indicatif et aucune commande ne peut être passée.",
    }
    fil = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Catalogue", "item": f"{SITE}/catalogue.html"},
            {"@type": "ListItem", "position": 2,
             "name": LABELS_CATEGORIE.get(p["categorie"], p["categorie"]),
             "item": f"{SITE}/catalogue.html?categorie={p['categorie']}"},
            {"@type": "ListItem", "position": 3, "name": p["nom"], "item": f"{SITE}/produit/{p['id']}/"},
        ],
    }
    return json.dumps([produit, fil], ensure_ascii=False, indent=2)


def main():
    os.chdir(RACINE)
    produits = json.load(io.open("data/products.json", encoding="utf-8"))
    gabarit = io.open("produit.html", encoding="utf-8").read()

    # En-tête et pied de page sont repris tels quels du gabarit.
    avant_main = gabarit.split('<main id="contenu">')[0]
    apres_main = gabarit.split("</main>")[1]

    for p in produits:
        puce = classer_homologation(p["homologation"])
        couleur = {"conforme": "vert", "non-conforme": "gris"}.get(puce, "jaune")
        usage, limites = scinder_description(p["description_longue"])
        cat = LABELS_CATEGORIE.get(p["categorie"], p["categorie"])
        guides = bloc_guides(p)

        tete = avant_main
        tete = re.sub(r"<title>.*?</title>", f"<title>{e(p['nom'])} — FONTE</title>", tete, flags=re.S)
        tete = re.sub(r'<meta name="description" content=".*?">',
                      f'<meta name="description" content="{e(p["description_courte"])}">', tete, flags=re.S)
        tete = tete.replace(
            '<link rel="stylesheet" href="/assets/css/style.css">',
            f'<link rel="canonical" href="{SITE}/produit/{p["id"]}/">\n'
            '<link rel="stylesheet" href="/assets/css/style.css">\n'
            f'<script type="application/ld+json">\n{jsonld(p)}\n</script>')

        limites_html = ""
        if limites:
            limites_html = (
                '<div class="bloc-taille-forme attention">\n'
                "            <h2>Ce que ce produit ne fait pas</h2>\n"
                f"            <p>{e(limites)}</p>\n"
                "          </div>\n\n          ")

        corps = f"""<main id="contenu">
  <section>
    <div class="container">
      <p class="fil-ariane"><a href="/catalogue.html">Catalogue</a> / <a href="/catalogue.html?categorie={e(p['categorie'])}">{e(cat)}</a> / <span>{e(p['nom'])}</span></p>

      <div class="fiche-produit">
        <div class="fiche-visuel">
          <img src="/{e(p['images'][0].lstrip('/'))}" alt="Schéma technique — {e(p['nom'])}" width="400" height="260">
        </div>
        <div>
          <div class="fiche-entete">
            <span class="gamme">Gamme {e(p['gamme'])}</span>
            <h1>{e(p['nom'])}</h1>
            <div class="fiche-tags">
              <span class="tag {couleur}">{e(p['homologation'])}</span>
              <span class="statut-stock {e(p['stock_statut'])}">{e(LABELS_STOCK.get(p['stock_statut'], p['stock_statut']))}</span>
            </div>
            <p class="prix num">{e(p['prix'])} €</p>
            <p>{e(p['description_courte'])}</p>
          </div>

          <table class="specs" aria-label="Caractéristiques techniques">
            <caption class="visually-hidden">Spécifications techniques</caption>
            <tbody>
            {bloc_specs(p['specs'])}
            </tbody>
          </table>

          <div class="bloc-taille-forme">
            <h2>À quoi ça sert, pour qui</h2>
            <p>{e(usage)}</p>
          </div>

          {limites_html}<div>
          {guides}
          </div>

          <div class="form-relance">
            <h2>Prévenez-moi à l’ouverture</h2>
            <p>Pas de paiement en ligne pour le moment. Laissez votre e-mail, on vous écrit dès que cette référence est disponible à la vente.</p>
            <form name="mise-en-relation" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/merci.html">
              <input type="hidden" name="form-name" value="mise-en-relation">
              <input type="hidden" name="produit_id" value="{e(p['id'])}">
              <input type="hidden" name="produit_nom" value="{e(p['nom'])}">
              <p style="display:none;"><label>Ne pas remplir : <input name="bot-field"></label></p>
              <div class="champ">
                <label for="email-relance">Adresse e-mail</label>
                <input type="email" id="email-relance" name="email" required autocomplete="email">
              </div>
              <button type="submit" class="btn primaire pleine-largeur">Me prévenir à l’ouverture</button>
            </form>
            <div class="confirmation-envoi" role="status">C’est noté. On vous écrit dès l’ouverture des ventes.</div>
            <p class="mention-rgpd">Votre e-mail sert uniquement à cette notification, jamais revendu. Vous pouvez <a href="/desinscription.html">retirer votre consentement</a> à tout moment. Voir la <a href="/confidentialite.html">politique de confidentialité</a>.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>"""

        dossier = os.path.join("produit", p["id"])
        os.makedirs(dossier, exist_ok=True)
        page = tete + corps + apres_main
        page = page.replace('<script src="/assets/js/produit.js"></script>\n', "")
        io.open(os.path.join(dossier, "index.html"), "w", encoding="utf-8").write(page)
        print("écrit", dossier + "/index.html")

    print(f"\n{len(produits)} fiches générées.")


if __name__ == "__main__":
    main()
