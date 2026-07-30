## Objectif

Les ennemis (Pénitent-Greffé, Suppliant Rampant) viennent d'un ancien lot : cadres irréguliers (102/126/172 px de large, hauteur 128, marge de 4 px), lignes de pieds instables et rendu moins soigné que le héros. Le Vigile Muet, lui, a été régénéré sur un gabarit propre : 192x144 par frame, silhouette ~110 px, ligne de pieds fixe à y=138, aucune marge.

On applique exactement le même pipeline aux ennemis.

## Ce qui sera fait

1. **Régénération des feuilles de sprites** (pixel art, palette du jeu : crimson sang, os, charbon, ocre, accents rouillés) :
   - Pénitent-Greffé : idle (4), marche (6), attaque (5)
   - Suppliant Rampant : idle (4), déplacement (4), attaque (4)
   Silhouettes cohérentes d'une frame à l'autre, lisibilité de la pose d'attaque (anticipation nette, déjà utilisée par le télégraphe de 350 ms).

2. **Normalisation** (script Python, même traitement que le héros) :
   - cadre unifié 192x144, aucune marge entre cellules
   - fond transparent, recadrage par la silhouette réelle
   - ligne de pieds calée à y=138 sur toutes les frames
   - hauteur de silhouette : ~118 px pour le Pénitent (plus imposant que le héros), ~62 px pour le Suppliant (rampant, bas et large)
   - quantification de palette partagée par créature pour une cohérence totale

3. **Mise à jour du code** :
   - `src/game/assets.ts` : `frameWidth: 192`, `frameHeight: 144`, `spacing: 0` pour les 6 entrées ennemies
   - `src/game/entities/Enemy.ts` : ajuster `scale`, `bodyWidth`, `bodyHeight` des deux classes au nouveau gabarit (les hitbox actuelles, ex. 150x128 pour le Suppliant, correspondent aux anciennes cellules)
   - `public/assets/sprites/enemies/*_atlas.json` et le README : réécrits selon le nouveau gabarit

4. **Vérification en jeu** : capture Playwright de la scène pour confirmer que les deux ennemis restent posés au sol, à la bonne échelle relative au héros, sans rétrécissement entre animations.

## Détails techniques

Le calcul de `footY` par `src/game/spriteMetrics.ts` reste en place et fonctionnera mieux avec des lignes de pieds déjà normalisées. Aucune modification de la logique de combat, d'IA ou des dégâts : seuls les assets, leurs métadonnées et les dimensions de collision changent.
