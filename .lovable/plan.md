## Objectif

Refaire le set d'animations du Vigile en repartant **des deux planches que vous venez de fournir** (profil et dos), avec une anatomie et une tenue verrouillées pour que profil et dos soient enfin le même personnage.

## Design verrouillé (source de vérité)

- **Greffe de chair** : dorsale complète — masse tentaculaire boursouflée de la nuque jusqu'aux reins. De profil, on en voit le débordement sur l'épaule ET la ligne bombée qui court le long du dos sous la cape (et non une simple bosse d'épaule isolée).
- **Tenue (fusion)** :
  - Silhouette et palette du profil : capuche gris ardoise, masque de fer rivetté, robe grise, cape bordeaux sombre, ornements et bottes dorés, sabre courbe ensanglanté.
  - Texture du dos : bords en lambeaux déchiquetés, salissures brun-sang en bas de cape, greffe visible.
  - Sabre **tenu en main** dans toutes les poses (pas au fourreau), pour rester lisible en jeu.
- **Palette extraite des planches** (aucune couleur inventée) : ardoise `#4a4d52`, gris robe `#8a8f94`, bordeaux cape `#5e1f24`, or `#b9954a`, chair greffe `#a8564c`, sang `#6b1010`.

## Méthode de génération (anti-dérive)

1. **Deux frames de référence** produites par édition directe de vos images (pas de prompt texte pur) :
   - `ref_profile` — depuis la planche de profil, avec la greffe étendue le long du dos.
   - `ref_back` — depuis la planche de dos, retexturée à la palette du profil (capuche ardoise, cape bordeaux, ors) et sabre en main.
2. Chaque frame d'animation est ensuite **dérivée par édition de ces références**, jamais générée de zéro.
3. Contrôle qualité automatique par frame : palette comparée à la référence, silhouette centrée, hauteur constante.

## Animations à produire

Grille **256×192**, silhouette ~150 px de haut, fond transparent.

Vue de profil : idle (4), marche (8), saut/chute (3), attaque légère combo (6), attaque lourde (5), attaque ascendante (4), esquive/roulade (5), parade (3), dégâts (2), mort (5).

Vue de dos : idle (4), marche (8).

## Validation avant intégration

Je vous présente les planches (idle, marche, attaque + dos) **avant** de toucher au code. Rien n'entre dans le jeu tant que vous n'avez pas validé.

## Détails techniques

- Assets écrits dans `public/assets/sprites/hero/` (spritesheets PNG).
- `src/game/entities/Player.ts` : mise à jour des `frameWidth/frameHeight` en 256×192, remap des clés d'animation, ajout des états `idle_back` / `walk_back` avec bascule sur un flag d'orientation.
- Échelle en jeu recalculée pour conserver la taille apparente actuelle du héros (~130 px) ; hitbox et `strikeBox` réajustés au nouveau centrage.
- Ancienne spritesheet supprimée seulement après validation visuelle en jeu.
