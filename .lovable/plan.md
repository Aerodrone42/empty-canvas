## Objectif
Corriger les incohérences visuelles de la salle du Trône : sol plat et répétitif, changements de décor brutaux, répétition du même fond sur les deux premiers segments et bandes verticales visibles.

## Corrections prévues

1. **Remplacer le sol unique par des sols adaptés aux 8 zones**
   - Seuil / Nef : marbre noir veiné de sang, sobre au départ puis plus réfléchissant.
   - Ossuaire : dalles de pierre sombre incrustées d’ossements, sans dorures.
   - Passage noyé : surface de sang sombre avec reflets et ondulations discrètes au premier plan.
   - Cloître : pierre extérieure usée, humide, éclairée par le ciel rouge.
   - Galerie : grandes dalles noires guidant la perspective vers le centre.
   - Ascension : marches de pierre successives intégrées au parcours.
   - Parvis : marbre noir poli et veines rouges, cohérent avec le trône.

2. **Créer une vraie profondeur de sol**
   - Le sol ne sera plus une bande verticale écrasée sous les pieds.
   - Ajouter trois plans lisibles : ligne de marche nette, dallage en perspective et premier plan plus sombre.
   - Utiliser des textures en perspective déjà présentes dans les peintures, avec recadrage et mise à l’échelle cohérents plutôt qu’une répétition carrée uniforme.
   - Ajouter des reflets et voiles localisés uniquement là où le décor le justifie.

3. **Supprimer le doublon des deux premiers fonds**
   - Le Seuil conservera `throne-far`.
   - La Nef utilisera une composition différente issue des fonds validés, afin que le joueur ne voie plus deux copies identiques consécutives.
   - Les segments finaux utiliseront `near` puis `mid` dans un ordre visuel menant clairement vers le trône, sans retour incohérent de perspective.

4. **Refaire entièrement les raccords entre décors**
   - Retirer les rideaux noirs verticaux responsables des grandes coupures visibles sur les captures.
   - Remplacer les rectangles juxtaposés par une zone de chevauchement plus longue, avec fondu progressif calculé selon la position de la caméra.
   - Faire évoluer simultanément fond, teinte, poussière et sol sur la même distance pour éviter qu’un élément change avant les autres.
   - Masquer les limites avec des éléments architecturaux naturels déjà présents dans l’image : pilier, arche, zone d’ombre ou brume, sans ajouter de décor artificiel répétitif.

5. **Corriger la répétition interne des images**
   - Éviter le `tileSprite` qui redémarre chaque peinture au bord de chaque segment et crée des duplications visibles.
   - Chaque fond sera cadré comme une scène continue sur son segment, avec léger déplacement différentiel pour donner de la profondeur sans déformer l’image.
   - Les segments longs alterneront cadrages et points de départ afin de ne pas répéter immédiatement les mêmes colonnes ou arches.

6. **Validation visuelle ciblée**
   - Vérifier les 7 jointures une par une, notamment celles entourées sur les captures : Nef → Ossuaire, Ossuaire → Passage noyé, Passage noyé → Cloître et Ascension → Parvis.
   - Vérifier que le héros reste correctement posé sur la ligne de marche, qu’aucune bande verticale n’apparaît et que chaque sol correspond au fond affiché.
   - Contrôler le rendu pendant le déplacement, pas uniquement sur une image fixe.