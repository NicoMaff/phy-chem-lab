# PhyChem Lab

Catalogue de ressources pédagogiques de physique-chimie, utilisable hors ligne.

## Développement et distribution

```bash
yarn install --immutable
yarn vite
yarn typecheck
yarn test
yarn build
```

Ouvrir `dist/index.html` directement dans un navigateur pour utiliser la distribution hors ligne. Le dossier `dist/` doit être conservé entier.

## Module enseignant — lumières et objets colorés

Depuis l'espace enseignant, ouvrir **Lumières et objets colorés**.

- **Superposer des lumières** : faire glisser les zones colorées, régler les intensités et choisir une disposition. Dans un recouvrement, la zone dont le centre est le plus proche est déplacée ; des centres identiques sont sélectionnés à tour de rôle. Les zones se déplacent aussi avec les flèches du clavier après sélection avec Tab ; Maj augmente le pas.
- **Éclairer des objets** : comparer sept objets sous lumière blanche puis sous l'éclairage choisi. Sélectionner un objet pour détailler les composantes reçues, diffusées et absorbées.
- Masquer les explications ou les noms pendant une démonstration, agrandir la scène en plein écran, exporter le seul schéma scientifique en SVG ou PNG. En plein écran, un menu compact à droite permet de modifier l'éclairage rapide ; il reste synchronisé avec les réglages ordinaires.
- Les réglages sont conservés pendant les rechargements de l'onglet dans une session de création temporaire. Le bouton Réinitialiser restaure les valeurs initiales.

Le modèle utilise trois composantes RVB idéales, des intensités linéaires normalisées et une diffusion sélective binaire des objets, sans lumière ambiante ni fluorescence. Les intensités sont converties en sRGB pour l'affichage. Ce modèle ne décrit pas les spectres des pigments réels. L'export est autonome en tant qu'image ; le module fait partie de la distribution complète.

## Prototype — lentille mince convergente

Prototype autonome d'un banc d'optique pédagogique. Il illustre la construction d'une image par une lentille mince convergente avec les trois rayons remarquables.

## Lancer

Double-cliquer sur `prototype-optique.html`, ou lancer un serveur local :

```bash
python3 -m http.server 8080
```

Puis ouvrir <http://localhost:8080/prototype-optique.html>.

## Modes de simulation

- **Classique** — objet AB, image et rayons remarquables ;
- **Rayons depuis l’infini** — sélection individuelle de rayons axiaux, parallèles et obliques, dont un rayon traversant le centre optique O.

## Interactions

- déplacer la pointe `B` de l'objet dans le schéma ;
- régler la position, la taille, la focale et le diamètre de la lentille ;
- activer les rayons particuliers, le faisceau et les prolongements virtuels ;
- charger quatre configurations pédagogiques typiques.

## Périmètre scientifique

Le calcul suit la relation de conjugaison avec distances algébriques :

`1/OA′ − 1/OA = 1/f′`, avec `f′ > 0` et `OA < 0`.

Le grandissement est `γ = OA′/OA`. Le tracé repose sur l'approximation paraxiale de Gauss et le modèle de la lentille mince.

> Ce fichier est un prototype jetable destiné à valider l'interface et les interactions avant une éventuelle version de production.
