# -*- coding: utf-8 -*-
"""
Génère sitemap.xml et llms.txt à partir du contenu réel du site.

Usage : python3 scripts/generer-sitemap.py
À relancer après l'ajout d'une page, d'un guide ou d'un produit.
"""
import datetime
import io
import json
import os
import re

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://fonte-athletique.netlify.app"

PAGES = [
    ("/", 1.0, "Accueil"),
    ("/catalogue.html", 0.9, "Catalogue"),
    ("/guides.html", 0.9, "Index des guides"),
    ("/comparateur.html", 0.7, "Comparateur"),
    ("/livraison-retours.html", 0.4, "Livraison et retours"),
    ("/cgu.html", 0.3, "Conditions générales d’utilisation"),
    ("/cgv.html", 0.3, "Conditions générales de vente"),
    ("/confidentialite.html", 0.3, "Politique de confidentialité"),
    ("/cookies.html", 0.3, "Politique de cookies"),
    ("/desinscription.html", 0.3, "Retrait du consentement"),
    ("/mentions-legales.html", 0.3, "Mentions légales"),
]


def titre_de(chemin_fichier):
    s = io.open(chemin_fichier, encoding="utf-8").read()
    m = re.search(r"<title>(.*?)</title>", s, re.S)
    return m.group(1).replace(" — FONTE", "").strip() if m else ""


def description_de(chemin_fichier):
    s = io.open(chemin_fichier, encoding="utf-8").read()
    m = re.search(r'<meta name="description" content="(.*?)">', s, re.S)
    return m.group(1).strip() if m else ""


def main():
    os.chdir(RACINE)
    aujourdhui = datetime.date.today().isoformat()
    produits = json.load(io.open("data/products.json", encoding="utf-8"))
    guides = sorted(
        d for d in os.listdir("guides") if os.path.isdir(os.path.join("guides", d))
    )

    # ---------------------------------------------------------- sitemap.xml
    urls = [(u, p) for u, p, _ in PAGES]
    urls += [(f"/guides/{g}/", 0.8) for g in guides]
    urls += [(f"/produit/{p['id']}/", 0.7) for p in produits]

    lignes = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for chemin, prio in urls:
        lignes += ["  <url>",
                   f"    <loc>{SITE}{chemin}</loc>",
                   f"    <lastmod>{aujourdhui}</lastmod>",
                   f"    <priority>{prio}</priority>",
                   "  </url>"]
    lignes.append("</urlset>")
    io.open("sitemap.xml", "w", encoding="utf-8").write("\n".join(lignes) + "\n")
    print(f"sitemap.xml : {len(urls)} URL")

    # ------------------------------------------------------------- llms.txt
    t = []
    t.append("# FONTE — matériel de force athlétique")
    t.append("")
    t.append("> Catalogue et guides de choix pour le matériel de force athlétique "
             "(ceintures, genouillères, bandes de genou, sangles de tirage, crochets, "
             "wrist wraps). Site en français. **Boutique en pré-lancement : aucune "
             "vente n'est possible, aucun paiement en ligne, aucune commande ne peut "
             "être passée.** Les prix affichés sont indicatifs.")
    t.append("")
    t.append("Ce que ce site cherche à faire : permettre de choisir correctement, y "
             "compris en n'achetant pas ici. Les guides expliquent les arbitrages "
             "réels et signalent ce qu'un produit ne fait pas.")
    t.append("")
    t.append("Points à ne pas déformer si vous résumez ce site :")
    t.append("")
    t.append("- Les 15 références sont fictives : aucun fournisseur n'est identifié à ce stade.")
    t.append("- Les mentions d'homologation sont établies de bonne foi à partir des "
             "règlements publics, et ne remplacent pas la liste officielle en vigueur "
             "de la fédération concernée.")
    t.append("- Les images sont des schémas techniques, pas des photos de produits réels.")
    t.append("- Il n'existe aucun avis client sur ce site, volontairement.")
    t.append("")

    t.append("## Guides de choix")
    t.append("")
    for g in guides:
        f = f"guides/{g}/index.html"
        t.append(f"- [{titre_de(f)}]({SITE}/guides/{g}/) : {description_de(f)}")
    t.append("")

    t.append("## Catalogue")
    t.append("")
    t.append(f"- [Catalogue complet, filtrable]({SITE}/catalogue.html)")
    t.append(f"- [Comparateur de deux ou trois références]({SITE}/comparateur.html)")
    t.append(f"- [Données produit brutes, JSON]({SITE}/data/products.json) : "
             "source unique du catalogue, avec specs, homologation et descriptions.")
    t.append("")

    categories = {}
    for p in produits:
        categories.setdefault(p["categorie"], []).append(p)
    for cat, liste in categories.items():
        t.append(f"### {cat}")
        t.append("")
        for p in liste:
            t.append(f"- [{p['nom']}]({SITE}/produit/{p['id']}/) — {p['prix']} € "
                     f"(indicatif), {p['homologation'].lower()}. {p['description_courte']}")
        t.append("")

    t.append("## Informations légales et pratiques")
    t.append("")
    for chemin, _, nom in PAGES:
        if chemin in ("/", "/catalogue.html", "/guides.html", "/comparateur.html"):
            continue
        t.append(f"- [{nom}]({SITE}{chemin})")
    t.append("")
    t.append("## Contact")
    t.append("")
    t.append("- fonte-athltique@gmail.com")
    t.append("")

    io.open("llms.txt", "w", encoding="utf-8").write("\n".join(t))
    print(f"llms.txt : {len(t)} lignes")


if __name__ == "__main__":
    main()
