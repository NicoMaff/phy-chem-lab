# Lumières et objets colorés

Mode : Operate. Module enseignant de présentation en classe.

Construire directement dans le système existant : papier crème, encre sombre, commandes vert pétrole, polices DM Sans et Manrope locales. Une barre supérieure, des onglets, une grande scène scientifique et un panneau de réglages reprennent l'organisation du module d'optique.

Premier écran : trois taches de lumières primaires se recouvrent sur un écran blanc représenté dans l'obscurité. La géométrie et les couleurs constituent le contenu central ; les commandes restent lisibles à côté.

Interaction signature : déplacer directement les taches lumineuses, sans poignée visible, à la souris, au toucher et au clavier, pour faire apparaître les recouvrements. Le centre le plus proche détermine la source dans une zone commune ; à égalité, les sources sont sélectionnées à tour de rôle. Un contour apparaît uniquement pour le focus clavier. Le deuxième onglet réutilise les intensités pour éclairer sept objets idéaux. Pas d'animation automatique pendant la présentation.

Qualité attendue : scène lisible en projection, labels indépendants des couleurs, réglages accessibles, mode plein écran, export du seul schéma, fonctionnement hors ligne, aucune coupure sur petit écran. Le modèle idéal et l'absence de pigments réels sont explicites.

En plein écran, conserver un menu compact d'éclairage rapide à droite, synchronisé avec le panneau normal. Sur écran étroit, le menu reste aligné à droite au-dessus de la scène pour préserver sa largeur. Le menu appartient à l'interface et ne figure pas dans les exports.

## Conformité au système existant

Contrôle documentaire du 5 octobre 2026 : `enseignants/couleurs/index.html`, `src/resources/teachers/color_superposition/colors.css`, `present_colors.ts`, `src/styles.css` et `prototype-optique.html` confrontés à ce contrat et à `PRODUCT.md`.

- Palette héritée : papier `--paper` (`#f4f1e8`), encre `--ink` (`#16221e`) et séparateurs `--line` (`#d8ddd7`). Le panneau reprend le fond crème clair du catalogue (`#fffdf8`). Les commandes utilisent des variantes vert pétrole locales (`#0b766b`, `#0b665d`) ; elles ne remplacent pas le jeton global `--accent-2`.
- Typographie : DM Sans pour l'interface et Manrope pour le titre (`clamp(1.5rem, 2.3vw, 2.25rem)`). Les rubriques de la scène et des réglages sont à `1.05rem` ; les explications secondaires vont de `.85rem` à `.9rem`. Arial reste une police de schéma SVG/export, pas une police de titre d'interface.
- Composants hérités : boutons `shared-button` (rayon de `9px`, espacement interne de `7px 10px`) et sections `shared-panel-section` (espacement interne de `17px`, séparateurs). La scène sombre et les panneaux de ce module ont un rayon local de `12px`.
- Organisation observée : scène et réglages en deux colonnes, puis une colonne sous `760px`. Les réglages mobiles passent de deux colonnes à une sous `420px`. Les états sélectionnés, survolés et focalisés sont visibles ; les noms complètent les couleurs scientifiques.
- Règle conservée : l'interface reste dans le système existant ; les couleurs RVB et le fond sombre de l'expérience décrivent le phénomène scientifique. Ces choix de scène restent propres à cette surface.

Il s'agit d'une extension, sans nouvelle identité ni changement du système global : aucune création de `DESIGN.md` ou de `.impeccable/design.json`. Les variantes locales (verts, rayons, police SVG) sont documentées ici, sans être promues en règles globales et sans réparation hors périmètre.
