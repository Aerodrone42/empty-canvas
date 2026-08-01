## Diagnostic (vérifié)

Les animations du bourreau sont bien déclarées (`src/game/assets.ts` : `bourreau-attack`, 5 frames) et jouées par `Enemy.think()` via `bourreau-attack-anim`. Le problème vient de l'asset lui-même : en analysant `public/assets/sprites/enemies/bourreau_attack_spritesheet.png`, les 5 frames ont une silhouette quasi identique à l'idle (boîte englobante 64-159 px sur toutes les frames, aucun déplacement de bras ou d'arme). Visuellement, le bourreau frappe sans bouger — d'où l'impression d'absence d'animation.

## Ce qu'on fait

1. **Nouvelle planche d'attaque** `bourreau_attack_spritesheet.png` (même gabarit 224x176, ligne de pieds y=168, fond transparent), 6 frames avec un mouvement franc et lisible :
   - f0-f1 : armement, crochet/hache reculé au-dessus de l'épaule, torse pivoté en arrière
   - f2 : swing large vers l'avant, traînée de mouvement
   - f3 : impact, bras tendu au maximum, buste penché
   - f4-f5 : récupération, retour vers la garde
   Amplitude horizontale du bras nettement au-delà de la silhouette idle pour que le coup se voie.

2. **Frames d'anticipation** dans `src/game/entities/Enemy.ts` : pendant le télégraphe (350 ms) l'ennemi rejoue l'idle. On ajoutera une animation `bourreau-windup` (frames 0-1 de la planche d'attaque, non bouclée) jouée pendant l'anticipation, puis le swing complet — le joueur voit le coup arriver, ce qui rend l'esquive/parade lisible.

3. **Effets d'impact** : au moment du `enemy-strike` du bourreau, ajout d'un flash de traînée d'arme (arc rouge court) + micro-secousse caméra, cohérent avec le reste du combat.

## Détails techniques

- Génération de l'asset par script Python (Pillow) comme pour les autres sprites, sortie 6x224 = 1344x176, quantifiée 32 couleurs, transparence conservée.
- `src/game/assets.ts` : `frameCount` de `bourreau-attack` passé à 6, frameRate ajusté (~12) pour rester dans la fenêtre d'attaque existante.
- `src/game/scenes/BootScene.ts` : création de l'animation `bourreau-windup-anim` (frames 0-1, repeat 0).
- `src/game/entities/Enemy.ts` : hook optionnel `windupAnim` dans `EnemyStats`, utilisé pendant le télégraphe s'il existe (les autres monstres gardent le comportement actuel).
- Vérification en jeu (Playwright) : le bourreau apparaît après la machine d'écartèlement en salle 2 — capture des frames pendant son attaque pour confirmer le mouvement.
