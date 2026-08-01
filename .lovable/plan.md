## Objectif

Remplacer les trois blocs gris actuels par un autel de sang gothique, plus fin et cohérent avec le style pixel-art sombre du jeu, avec du sang qui déborde de la vasque et coule sur les côtés, le tout animé.

## Nouveau design (dans `src/game/effects/BloodAltar.ts`)

Silhouette repensée, plus étroite et verticale :
- **Base** : socle à deux gradins peu hauts, arêtes biseautées, largeur réduite (~78 px au lieu de 112), pierre sombre veinée avec dégradé haut/bas plutôt qu'aplat uni.
- **Fût central** : colonne fine (~34 px) légèrement galbée, avec gravures verticales et un sigil rouge sombre gravé au centre.
- **Vasque** : coupe évasée posée sur le fût, lèvre en pierre claire captant la lumière, intérieur creux plus sombre.
- **Palette** : uniquement des teintes déjà présentes dans le jeu (pierre brun-violacé, sang `#8e1420` → `#c42734`, reflets ambrés des torches).

```text
        ___(sang)___
       \___vasque__/
          |  |  |      <- coulées de sang le long du fût
         _|  |  |_
       _|__________|_  <- gradins
```

## Sang animé

- **Débordement** : 3 à 4 coulées permanentes partant de la lèvre de la vasque, dessinées en `Graphics` et redessinées chaque frame — longueur oscillante (respiration lente), largeur qui s'affine vers le bas, extrémité en goutte.
- **Gouttes** : détachement périodique d'une goutte en bas de chaque coulée, qui tombe jusqu'au sol et se transforme en petite flaque qui s'étale puis s'estompe.
- **Surface du bassin** : ellipse de liquide avec ondulation (léger scale sinusoïdal) + reflet spéculaire qui glisse lentement.
- **Vapeur** : fines particules rouges montantes, discrètes, uniquement quand l'autel est scellé.

## États

- **Éteint** : pierre désaturée, sang presque noir figé, coulées quasi immobiles, lueur très faible, invite « Sceller le sang ».
- **Scellé** : sang vif et lumineux, coulées actives, gouttes régulières, halo pulsant, flash caméra conservé au moment du scellement + onde de choc rouge en expansion.

## Détails techniques

- API publique inchangée (`constructor(scene, x, floorY, lit)`, `isLit`, `tick`, `destroy`) : aucun changement dans `GameScene.ts`.
- Rendu vectoriel `Phaser.Graphics` conservé (pas de nouvel asset), avec un `Graphics` statique pour la pierre (dessiné une fois) et un `Graphics` dynamique pour le sang, redessiné dans `tick` — coût négligeable.
- Réutilisation de la texture radiale `blood-altar-glow` existante pour le halo.
- Vérification visuelle par capture Playwright de l'autel dans la Nef avant/après scellement.
