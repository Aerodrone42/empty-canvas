## Problème confirmé

J'ai mesuré le spritesheet `public/assets/sprites/props/crucifiee_femme_spritesheet.png` (2176x704, 8 frames de 272x704) :

- Le contenu dessiné s'arrête à x=232 sur 271 dans **chaque** frame : il y a bien une marge transparente, donc ce n'est pas un clipping de frame.
- La coupure vient de **l'image source elle-même** : la branche droite de la croix (haut-droite et bas-droite) a été tronquée nette lors de l'extraction initiale. C'est exactement ce que tes cercles rouges entourent.

Autrement dit : élargir la frame ne sert à rien, il faut **redessiner les branches manquantes**.

## Correction

1. **Reconstruction géométrique de la croix (script Python, pas d'IA générative)**
   - Isoler la frame de référence propre.
   - Prendre la branche gauche complète (haut-gauche et bas-gauche), la **miroiter horizontalement** et la recoller côté droit à la même inclinaison, pour reformer un X symétrique et complet.
   - Raccorder les poutres au centre derrière le corps (le personnage reste au premier plan, jamais recouvert).
   - Conserver le grain pixel/texture bois du supplicié original — aucun re-rendu de style.

2. **Nettoyage alpha**
   - Suppression des pixels semi-transparents clairs (halo blanc) par seuillage + defringe : les bords prennent la couleur bois sombre voisine.
   - Vérification : aucun pixel d'alpha intermédiaire clair sur le contour.

3. **Cadrage sûr**
   - Recadrage sur le contenu complet + marge transparente d'au moins 24 px de chaque côté.
   - Nouvelle largeur de frame calculée à partir du contenu réel (la croix complète est plus large), hauteur inchangée.

4. **Animation**
   - Re-génération des 8 frames avec le même mouvement que le supplicié : respiration verticale, léger balancement et décalage cheveux/tête, amplitude visible (pas des frames quasi identiques comme actuellement).

5. **Câblage**
   - Mise à jour de `frameWidth` / `frameHeight` dans `src/game/assets.ts` (`crucifiee-idle`).
   - Vérification que l'origine et les gouttes de sang dans `src/game/effects/CrucifiedProp.ts` restent alignées avec le nouveau cadrage.
   - Contrôle final en jeu (salle 1, x=690) via capture Playwright, plus un contrôle du spritesheet frame par frame avant intégration.

## Périmètre

Je ne touche ni au supplicié masculin, ni à la machine d'écartèlement, ni aux bourreaux.
