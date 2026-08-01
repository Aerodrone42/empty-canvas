## Correction de la monture — deux ailes réellement animées

Le diagnostic est confirmé : les 8 frames actuelles modifient surtout la moitié gauche de l’image (`x ≈ 0–320`), tandis que l’aile opposée reste pratiquement identique. Le code Phaser lit bien les 8 frames ; le défaut est donc dans la spritesheet générée, pas dans la lecture de l’animation.

1. **Refaire les frames complètes à partir de l’illustration native**
   - Conserver un dragon entier par frame, sans élément collé par-dessus.
   - Redessiner les deux ailes dans chaque pose : montée, extension, descente et retour.
   - Donner aux deux ailes une amplitude cohérente avec la perspective, l’aile arrière restant visible mais bougeant réellement.

2. **Protéger les zones détaillées**
   - Ne déformer ni la tête, ni la gueule, ni l’humain, ni le cavalier.
   - Limiter les transformations aux ailes et à une légère ondulation de la queue.
   - Garder chaque frame à la taille d’affichage 512 × 336 pour éviter tout nouveau flou.

3. **Remplacer toutes les séquences concernées**
   - Régénérer les versions `fly` et `fly-fed` avec le même cycle bilatéral.
   - Harmoniser `swallow` avec la même position d’ailes afin d’éviter un saut visuel au changement d’animation.
   - Incrémenter la version des assets pour empêcher l’ancien sprite de rester en cache.

4. **Contrôle visuel obligatoire**
   - Extraire et comparer les 8 frames côte à côte.
   - Vérifier séparément que chaque aile change de silhouette et de hauteur au cours du cycle.
   - Tester l’animation dans le jeu, y compris le demi-tour horizontal et la transition avalement → vol nourri.
   - Ne valider que si les deux ailes battent, que l’humain reste net et qu’aucun rectangle ou raccord n’apparaît.