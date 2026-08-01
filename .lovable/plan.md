## Objectif
Autel de sang : silhouette trop large, sang rouge fluo, pierre qui ne s'accorde pas au décor, et étiquette « Autel scellé » bâclée.

## Modifications (`src/game/effects/BloodAltar.ts`)

**1. Silhouette plus fine**
- Conserver la hauteur (~190 px) mais compresser la largeur : `setScale(scale * 0.62, scale)` pour un profil élancé de calice gothique.
- Recalculer `bowlRx` sur la largeur affichée réelle et réduire l'ellipse de surface (facteur 1.42 → ~1.10) pour que le sang reste dans la vasque.
- Repositionner les 4 coulées sur la nouvelle largeur.

**2. Pierre accordée au sol / socle**
- Remplacer la teinte actuelle (blanc pur allumé / gris froid éteint) par une teinte pierre chaude gris-brun tirée du décor de la salle : `0x8a7f70` en état scellé, `0x6b6158` éteint — même famille que la balustrade et le dallage.
- Supprimer la dominante rougeâtre projetée sur le fût : la lueur rouge ne teinte plus la pierre, elle reste localisée autour de la vasque.

**3. Sang réaliste (fin du rouge fluo)**
- Surface : bordeaux sombre `0x6e1218` (scellé) / `0x2e0d10` (éteint), opacité légèrement réduite.
- Coulées : `0x4a0d12` / `0x1b080a`, presque brunes.
- Reflet : `0xa8434a` discret (alpha ~0.18) au lieu du rose vif.
- Halo : dégradé recalibré en rouge sombre (`rgba(140,28,28,…)` → `rgba(50,6,8,0)`), alpha max ~0.4, pulsation atténuée, échelle resserrée sur la vasque.
- Vapeur : teinte `0x7d1c22`, alpha réduit, retrait du blend ADD trop lumineux.
- Flash caméra au scellement adouci.

**4. Indicateur d'état**
- Supprimer le texte « Autel scellé ».
- Une fois scellé, aucun texte à l'approche (l'état se lit à la lueur) ; garder seulement « Sceller le sang » tant qu'il est éteint.

Aucun autre fichier touché.