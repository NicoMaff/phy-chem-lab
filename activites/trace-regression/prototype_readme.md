# Prototype jetable — Tracé et régression

Question : quelle organisation facilite le passage entre saisie de mesures, observation du graphique et ajustement d’une droite ?

Trois variantes structurelles sur une seule page :

- `?variant=A` — Atelier : tableau et graphique simultanés, résultats sous le graphique.
- `?variant=B` — Graphique : grande représentation, mesures dans un panneau escamotable, commandes sous le graphique.
- `?variant=C` — Parcours guidé : saisie, représentation, puis modélisation sur une feuille accompagnée d’étapes.

La ressource autonome n’a pas encore de page existante ; le prototype suit la hiérarchie HTML des activités et reprend les polices et couleurs locales du projet. Il n’est pas inscrit au catalogue de production.

## Lancer

Après installation habituelle des dépendances (`yarn install --immutable`), une commande depuis la racine :

```sh
yarn prototype:regression
```

Ouvrir [le prototype](http://127.0.0.1:5174/activites/trace-regression/prototype.html?variant=A). La barre flottante permet de changer de variante ; les flèches gauche/droite fonctionnent hors des champs de saisie. Le port 5174 est fixé pour conserver une URL stable.

## Essayer

Choisir librement un symbole et une unité pour chaque axe, saisir ou coller des couples de valeurs, exclure un point, puis comparer les modèles affine et proportionnel. Le tableau, le graphique et les résultats utilisent le même état en mémoire. Le panneau « État du prototype » expose les valeurs, réglages, coefficients et résidus. Un rechargement réinitialise les données.

Le panneau « Axes et unités », disponible dans les trois variantes, ne propose aucun catalogue de grandeurs. L’utilisateur saisit directement le symbole et, facultativement, l’unité de chaque axe. Ces libellés se répercutent immédiatement dans le tableau, le graphique, l’équation, la pente et les exports.

Le prototype démarre avec cinq lignes vides et ne charge aucun exemple. Modifier un symbole ou une unité ne transforme jamais les nombres saisis. « Intervertir » échange les symboles, les unités et les deux colonnes, puis recalcule l’ajustement dans le nouveau sens.

Le bouton Coller accepte deux colonnes numériques séparées par tabulations ou points-virgules. Les exports SVG et CSV sont téléchargeables. Le SVG comprend les axes, les unités, les points et l’équation de l’ajustement actif.

Limites volontaires : les unités sont de simples libellés et aucune cohérence dimensionnelle ni conversion n’est déduite, pas de sauvegarde rechargeable, de PNG, de multi-séries ni d’incertitudes. Les protections numériques restent celles d’un prototype, pas d’un moteur scientifique de production.

## Capture et verdict

Branche jetable : `codex/prototype-regression`. Contexte : [note de recherche Regressi](../../docs/research/regressi_integration.md).

**Verdict : en attente de comparaison par l’utilisateur.** L’hypothèse proposée est que A convient mieux à une ressource autonome de saisie/analyse, B à l’observation collective et C à une activité accompagnée. Aucune décision de conception n’est considérée comme validée et aucune variante n’est promue en production.

Aucune issue d’implémentation n’a été désignée dans cette conversation. À sa création, y reporter un lien vers cette branche et le verdict retenu, conformément à la compétence prototype. Conserver cette branche comme source primaire ; réécrire la variante retenue pour son intégration réelle.

Vérifications de réalisation : inspection des trois dispositions dans le navigateur, démarrage sans données, saisie avec virgule décimale, symboles et unités libres, conservation inter-variantes, exclusion, modèle proportionnel et inversion des axes. `yarn typecheck` et `yarn build` passent ; le build de production exclut la page prototype. Aucun test automatisé ajouté, conformément au périmètre jetable.

Avec les symboles `t` et `d`, les unités `s` et `cm`, l’import du jeu `(0,1), (1,3), (2,5)` affiche `d = 2 t + 1`, une pente de `2 cm/s` et `R² = 1`. Après inversion, l’équation devient `t = 0,5 d − 0,5`, avec `s/cm`. Le déclenchement de l’export SVG a été observé sans erreur de console, mais la réception effective du fichier n’a pas été confirmée dans le navigateur intégré.
