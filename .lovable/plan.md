## Objectif

Ajouter un second décor animé de croix dans la nef (salle 1), à droite du supplicié écorché existant : une femme en robe déchirée, ensanglantée, animée (respiration/balancement + gouttes de sang).

## Ce qui sera fait

1. **Nouvel asset**
   - Génération d'une spritesheet `crucifiee_femme_spritesheet.png` dans `public/assets/sprites/props/`, au même gabarit que l'existante (cellule 223x665, 8 frames, fond transparent, même palette et même style pixel art gothique).
   - Sujet : femme suppliciée clouée sur une croix en X, robe en lambeaux, corps ensanglanté, tête tombante, léger mouvement d'agonie entre les frames.

2. **Déclaration de l'asset**
   - Entrée `crucifiee-femme-idle` dans `src/game/assets.ts` (mêmes dimensions/frameRate que `crucifie-idle`, boucle infinie), donc chargement et animation automatiques via `BootScene`.

3. **Rendu**
   - `src/game/effects/CrucifiedProp.ts` prend un paramètre optionnel de clé de texture (défaut : l'existant) pour réutiliser la même logique d'animation, balancement et particules de sang, sans toucher au comportement actuel.

4. **Placement**
   - Dans `src/game/scenes/GameScene.ts` : seconde instance placée à droite du supplicié (environ `CRUCIFIED_X + 260`), même ligne de sol, même profondeur (derrière la balustrade, le héros passe devant). Aucune collision.

## Détails techniques

- Aucun impact sur le gameplay, le combat, l'audio ou les autres salles.
- La machine de torture et le supplicié existant ne sont pas modifiés.
- Vérification finale en runtime (capture Playwright de la salle 1) pour confirmer l'échelle, l'alignement au sol et la transparence.
