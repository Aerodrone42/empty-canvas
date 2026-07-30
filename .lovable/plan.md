## Ce que sont ces zones

Elles ne viennent pas des images de décor : ce sont des `Phaser.GameObjects.Rectangle` de couleur unie créés dans `GameScene.buildGeometry()`.

| Zone entourée | Origine dans le code |
|---|---|
| Barres marron au centre / à droite | tableau `ledges` → `this.add.rectangle(x, y, w, 24, palette.ledge)` |
| Grande bande en bas de l'écran | `ground` (rectangle plein de `FLOOR_Y` au bas de la salle) + le liseré de 4 px |

Le décor pixel art étant très texturé, ces aplats lisses jurent immédiatement.

## Ce que je vais faire

**1. Supprimer les plateformes flottantes**
Le tableau `ledges` et la boucle qui les ajoute au `staticGroup` sont retirés entièrement de `buildGeometry()`. La salle devient une nef au sol plat, comme le décor le suggère. La couleur `ledge` reste dans `BACKDROPS` uniquement si le liseré la réutilise, sinon elle est nettoyée.

**2. Sol : le décor reprend la main**
Le sol dallé est déjà peint dans les calques `mid`/`near`. Au lieu de le recouvrir d'un aplat marron, le rectangle de collision devient invisible (corps physique seul) et le calque de décor est étendu jusqu'au bas de la salle pour qu'il n'y ait plus de bande vide à masquer. Un assombrissement dégradé très discret en bas remplace l'aplat, pour garder les pieds du personnage lisibles sans casser le style.

**3. Finitions**
- Suppression du liseré de pierre de 4 px s'il n'est plus utile une fois le décor descendu.
- Vérification que le joueur et les ennemis restent bien posés sur la ligne de sol après la suppression des plateformes.

## Détails techniques

- Tout se passe dans `GameScene.buildGeometry()` et le calage vertical de `Parallax` ; la physique du sol (`staticGroup`, colliders joueur/ennemis) reste en place.
- Aucun ennemi n'est actuellement placé sur une plateforme, donc leur suppression n'affecte pas les spawns.
- Vérification finale au navigateur : capture d'écran sur la salle cathédrale pour confirmer que les trois zones entourées ont disparu ou se fondent dans le décor.