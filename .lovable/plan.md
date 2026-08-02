## Constat

- Il n'existe aucune feuille d'animation de garde : `public/assets/sprites/` ne contient que `idle`, `walk`, `attack`, `dodge`, `jump`.
- Faute de sprite, `Player.ts` (`holdGuardPose`) se contente de figer une frame d'idle, de réduire légèrement l'échelle et d'appliquer une teinte froide — d'où l'effet « le perso rétrécit et change de couleur ».

## Plan

1. **Créer une vraie animation de garde**
   - Nouvelle feuille `vigile_muet_guard_spritesheet.png`, même gabarit que les autres (192x144, baseline 138, hauteur perso 110), même palette et même silhouette (capuche rouge sombre, masque pâle, épée longue).
   - 4 frames enchaînées :
     1. amorce — le héros pivote de trois quarts, l'épée se relève,
     2. lame dressée devant le torse, épaule avancée, jambes fléchies,
     3. posture de garde tenue (frame de maintien, légère respiration),
     4. impulsion de parade — la lame chasse vers l'avant.
   - Découpage : frames 1-3 jouées à l'entrée en garde, frame 3 bouclée tant que la touche est tenue, frame 4 jouée au moment où un coup est paré.

2. **Brancher l'animation**
   - `BootScene.ts` : chargement de la feuille et création de deux animations, `guard_enter` (frames 1→3, une passe) et `guard_hold` (frame 3 en boucle), plus `guard_parry` (frame 4, une passe).
   - `assets.ts` : ajout de l'entrée avec le paramètre de version anti-cache.

3. **Nettoyer le bricolage visuel**
   - `Player.ts` : `holdGuardPose()` ne touche plus ni à `setScale` ni à `setTint` ; il joue `guard_enter` puis `guard_hold`. `releaseGuard()` revient à `idle` sans reset de teinte parasite.
   - `onGuardBlocked(perfect)` : joue `guard_parry` ; la gerbe d'étincelles et la mention « PARADE » restent réservées à la parade parfaite, comme convenu.

## Détails techniques

- Génération de la feuille par le même pipeline que les autres sprites, puis passage dans `scripts/defringe_hero.py` pour supprimer le liseré clair sur les bords.
- Fichiers touchés : `public/assets/sprites/vigile_muet_guard_spritesheet.png` (nouveau), `public/assets/sprites/vigile_muet_atlas.json`, `src/game/assets.ts`, `src/game/scenes/BootScene.ts`, `src/game/entities/Player.ts`.
- Aucun bouclier ajouté : la garde reste à l'épée, conformément à la consigne précédente.
