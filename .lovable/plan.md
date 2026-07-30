## Problème

Le sol « briques Minecraft » ne vient pas du décor : c'est une couche de géométrie que j'ai dessinée par-dessus (`addFloorMarks` dans `src/game/effects/Parallax.ts`), qui trace des rangées de joints noirs + arêtes éclairées et des taches en ellipse. C'est ce quadrillage régulier qui casse le style de la peinture.

La bande de sol issue de la peinture d'origine, elle, est toujours là et intacte (la RenderTexture ancrée au monde, `depth -20`).

## Correction

1. Supprimer entièrement l'appel `this.addFloorMarks(...)` et la méthode `addFloorMarks` de `Parallax.ts` — plus aucun joint, arête ni tache dessinés à la main.
2. Garder le sol tel qu'il était : la bande basse de la peinture, cuite une fois sur toute la largeur de la salle, ancrée au monde (`scrollFactor 1`) — donc il défile exactement à la vitesse des pas, sans effet tapis roulant, et il garde le style exact du décor.
3. Adoucir le raccord : conserver le voile `seam` mais le passer plus discret, pour qu'on ne voie pas de ligne de coupe entre le fond et le sol.

Aucun changement de gameplay, de physique ni de caméra : uniquement la suppression du calque graphique fautif.

## Détail technique

Fichier touché : `src/game/effects/Parallax.ts` uniquement.
- retrait de la méthode `addFloorMarks` (~70 lignes) et de son appel ;
- la texture `floor-marks-*` n'est plus générée (un objet et une texture en moins → un peu de perf gagnée) ;
- ajustement de l'alpha du rectangle `seam` (0.35 → ~0.2).
