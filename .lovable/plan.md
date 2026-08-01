## Correction complète du héros

1. **Nettoyer les spritesheets**
   - Supprimer le halo et les pixels blancs résiduels sur `idle`, `walk` et `attack` en corrigeant l’alpha, sans effacer les vrais détails clairs du masque ou de la lame.
   - Conserver le style, les couleurs et le design validés du Vigile.

2. **Corriger l’attaque doublée**
   - Refaire la 4ᵉ cellule de la planche d’attaque : elle contient actuellement deux Vigiles dans une seule frame.
   - Garder uniquement la pose d’attaque correcte et son effet de lame, centrés dans une cellule 256×192.

3. **Uniformiser la taille pendant le saut**
   - Renormaliser chaque pose de saut sur la même hauteur visuelle et la même ligne de référence que les autres animations.
   - Préserver les différences de posture (accroupi, montée, chute) sans donner l’impression que le héros rétrécit.
   - Corriger le double saut pour utiliser une animation existante valide plutôt qu’une clé de texture incorrecte.

4. **Stabiliser le rendu Phaser**
   - Garder une échelle et une origine constantes lors de tous les changements d’animation.
   - Vérifier que la hitbox et les pieds restent alignés au sol après chaque transition.

5. **Contrôle visuel en jeu**
   - Tester repos, marche, attaque, saut et double saut dans la salle.
   - Vérifier visuellement l’absence de bordure blanche, de personnage dupliqué et de variation incohérente de taille.