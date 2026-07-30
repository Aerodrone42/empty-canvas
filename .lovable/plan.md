## Constat

Vérifié dans `src/game/entities/Player.ts` : l'esquive (ligne 284-296) déclenche bien un déplacement rapide + invulnérabilité, mais joue `vigile-walk-anim`. Visuellement, le héros marche pendant qu'il glisse — aucune plongée, aucune roulade. Il n'existe aucune feuille d'esquive dans `public/assets/sprites/`.

## Plan

### 1. Générer la feuille « esquive »
Nouvelle image `vigile_muet_dodge_spritesheet.png`, même gabarit héros que les autres feuilles (cellules 192x144, silhouette 110 px, ligne de pieds y=138), 8 frames inspirées de la planche de référence fournie :

```text
1  prêt / idle        appui, buste qui bascule
2  départ esquive     poussée jambe arrière, manteau qui claque
3  plongée            corps à l'horizontale, poussière au sol
4  roulée             corps groupé, manteau enroulé
5  sortie esquive     déroulé, une main au sol
6  récupération       redressement, buste bas
7  fin récupération   redressement complet, épée ramenée
8  retour idle        pose neutre, raccord avec idle
```

Style, palette et silhouette identiques aux feuilles existantes (crimson/os/charbon, capuche, épée longue).

### 2. Normaliser la feuille
Même script de normalisation que le saut : découpe des colonnes, recadrage sur la ligne de pieds commune, hauteur cohérente avec idle/walk, fond transparent. Les frames roulée/plongée gardent la même hauteur de cellule pour éviter tout saut d'échelle.

### 3. Déclarer et charger la feuille
- `src/game/assets.ts` : entrée `vigile-dodge` (8 frames, gabarit héros).
- `src/game/scenes/BootScene.ts` : trois animations découpées
  - `vigile-dodge-start` (frames 1-3) — départ + plongée
  - `vigile-dodge-roll` (frames 4-5) — roulade et sortie
  - `vigile-dodge-recover` (frames 6-8) — récupération jusqu'au retour idle

### 4. Brancher l'animation
Dans `Player.ts` :
- Au déclenchement de l'esquive : jouer `vigile-dodge-start` au lieu de `vigile-walk-anim`.
- Pendant l'état `dodge` : enchaîner `vigile-dodge-roll` à mi-parcours (la durée totale est `DODGE.duration` = 260 ms, donc le découpage suit ce timing).
- En sortie d'état : `vigile-dodge-recover` sur une brève fenêtre, puis retour normal à idle/walk.
- Aucun changement de hitbox, de distance, d'invulnérabilité ni de cooldown : seule l'apparence change.

### 5. Vérification
Captures Playwright aux différentes phases (départ, plongée, roulade, récupération) pour confirmer que les jambes/le corps bougent réellement, que la taille reste constante et que les pieds retombent sur la ligne de sol.

## Détails techniques

La feuille doit respecter exactement `HERO_FRAME_W=192`, `HERO_FRAME_H=144`, `HERO_CHAR_H=110`, `HERO_BASELINE_Y=138` d'`src/game/assets.ts` pour qu'`alignBody()` fonctionne sans compensation. Le corps physique (58x120) reste inchangé pendant toute l'esquive.
