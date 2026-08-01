## Diagnostic confirmé

L’échelle Phaser reste constante (`SCALE`) pendant le saut : le problème vient de la planche `vigile_muet_jump_spritesheet.png` elle-même.

- Toutes les cellules font bien `256×192` et mesurent 150 px de haut.
- Mais les poses aériennes replient fortement le corps : la frame de montée n’occupe que 89 px de large et celle de chute seulement 64 px, contre 86–111 px dans les poses normales.
- La normalisation précédente a agrandi la boîte d’image sans rétablir les proportions du corps. Le héros conserve donc mathématiquement la même hauteur, mais paraît nettement plus petit/tassé.
- La frame d’impulsion contient aussi des pixels parasites sur toute la largeur de la cellule.

## Correction

1. Recomposer les 3 frames de saut depuis le Vigile validé des planches idle/marche, sans modifier son costume, sa greffe, son sabre ni sa palette.
2. Garder une stature corporelle visuelle identique à l’idle dans les airs :
   - impulsion légèrement fléchie uniquement avant le décollage ;
   - montée avec torse et jambes déployés ;
   - chute verticale sans corps miniaturisé.
3. Nettoyer complètement les pixels parasites et halos de chaque cellule.
4. Conserver strictement la grille `3 × 256×192`, la ligne de pieds `y=184`, l’origine et l’échelle actuelles afin de ne pas toucher aux hitbox ou à la physique.
5. Mettre à jour le cache de l’asset puis vérifier en jeu le saut simple et le double saut, image par image, en comparant la taille apparente à l’idle.