# Prototype — lentille mince convergente

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
