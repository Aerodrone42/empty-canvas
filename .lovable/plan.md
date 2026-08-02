## Objectif

Allonger la salle du Trône pour une vraie durée de niveau (~4-6 min de traversée) : passer de 9600 à **16000 px**, avec **4 nouveaux décors générés** intercalés avant l'arrivée au trône, plus des transitions de sol et de perspective qui guident le joueur.

## Découpage du parcours (16000 px, 8 segments)

```text
0 ── 1800 ── 3600 ── 5600 ── 7600 ── 9800 ── 12000 ── 14000 ── 16000
Seuil  Nef   Ossuaire Passage Cloître  Galerie  Ascension  Parvis
                                inondé   des     du Trône
                                        suppliciés
```

1. **Seuil (0-1800)** — fond `throne_bg_far` validé, dallage usé, brume dense, lumière faible.
2. **Nef (1800-3600)** — même fond, calque médian (colonnes d'os) monte en opacité, rais de lumière.
3. **Ossuaire (3600-5600)** — **nouveau fond** : murs entiers d'ossements empilés, crânes en niches, lumière verdâtre-froide.
4. **Passage inondé (5600-7600)** — **nouveau fond** : crypte basse noyée de sang, reflets, arches à demi immergées ; sol avec surface liquide.
5. **Cloître des suppliciés (7600-9800)** — **nouveau fond** : galerie ouverte, corps suspendus en fond lointain, ciel rouge derrière les arcades.
6. **Galerie des bannières (9800-12000)** — **nouveau fond** : long couloir de bannières déchirées, or terni, colonnes rapprochées (resserrement avant le final).
7. **Ascension (12000-14000)** — sol qui monte par paliers de pierre, caméra qui descend, braseros plus vifs. Fond `throne_bg_near` dominant.
8. **Parvis du Trône (14000-16000)** — fonds validés `mid`+`near`, marbre poli, brume rouge basse, trône éclairé.

Tous les nouveaux fonds sont générés dans le style exact des fonds déjà validés (même palette, même échelle d'arches, même grain), avec raccords horizontaux propres.

## Technique

- **`src/game/roomConfig.ts`** : largeur `throne` → 16000. Nouveau champ `segments[]` : `xStart`, `xEnd`, `bgKey`, `floorY`, `tint`, `fogAlpha`, `midAlpha`, `nearAlpha`, `props[]`.
- **`src/game/assets.ts` + `BootScene.ts`** : enregistrement/chargement des 4 nouveaux fonds (`throne_bg_ossuary`, `throne_bg_flooded`, `throne_bg_cloister`, `throne_bg_gallery`).
- **`src/game/effects/Parallax.ts`** : passage multi-calques (far `0.15`, mid `0.45`, near `0.85`) + sol `throne_floor`. Méthode `update(camX)` qui fait un **cross-fade** entre le fond du segment courant et celui du suivant sur ~400 px, pour des transitions sans coupure.
- **`src/game/scenes/GameScene.ts`** : sol construit segment par segment (marches en pierre pour l'Ascension, surface liquide animée pour le Passage inondé), `parallax.update()` dans la boucle, offset caméra sur les segments 7-8, cartouche de nom de zone en fondu à chaque entrée de segment.
- **Nouveaux props** : marche de pierre, brasero (réutilisé), colonne d'os — même style que les fonds.

## Ce qui ne change pas

- Les 4 images de fond déjà validées restent utilisées telles quelles.
- Pas d'ennemis ni de herse ajoutés : la salle reste une traversée.
- L'autel de sang reste à sa position actuelle.