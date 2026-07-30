## Objectif

Le fond du 2e niveau (corridor) est trop étroit (1672 × 941 px) pour une salle de 2400 px : il se répète. On remplace la peinture par un **fond panoramique long**, sans répétition.

## Ce qui sera fait

1. **Générer un nouveau décor panoramique** pour le corridor : format large **1920 × 900**, style gothique horreur cohérent avec le reste (pierre sombre, voûtes, dallage en perspective au tiers bas, teintes charbon/cramoisi), composition **non symétrique** pour qu'aucun motif ne saute aux yeux.
   - Fichier : `public/assets/sprites/backgrounds/corridor_bg_far.png` (remplacement).
2. **Adapter la salle au fond** dans `src/game/scenes/GameScene.ts` : largeur de salle alignée sur la largeur réelle du décor mis à l'échelle, pour qu'une seule peinture couvre toute la salle (plus aucune répétition).
3. **Ajuster `Parallax.ts`** : affichage en image unique étirée sur la largeur de la salle (au lieu du `tileSprite` répétitif), ancrage du dallage sur la ligne de sol `FLOOR_Y` inchangé.
4. Vérification en jeu : traverser la salle 2 d'un bout à l'autre et confirmer qu'aucune couture ni point de fuite dupliqué n'apparaît.

## Détails techniques

- Fichiers touchés : `src/game/effects/Parallax.ts`, `src/game/scenes/GameScene.ts`, asset `corridor_bg_far.png`.
- Aucune modification du gameplay, des collisions, du sol, des ennemis ni de la musique.
- Les autres salles gardent leur rendu actuel ; si tu veux, je peux ensuite refaire les 3 autres fonds au même format long.
