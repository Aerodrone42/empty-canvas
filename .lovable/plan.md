## Constat (mesuré sur les fichiers actuels)

Cadres de 128 px de haut pour les trois feuilles, mais la silhouette dessinée mesure :

```text
idle    : 73, 72, 73, 72 px   (pieds à y=102)
walk    : 35, 35, 35, 35, 35, 34 px   (frame 2 décalée en bas du cadre)
attack  : 28, 41, 29, 30, 30 px
```

Le héros est donc littéralement dessiné 2x plus petit en marche et en attaque. Le code actuel compense en agrandissant, ce qui donne un rendu flou et instable. La vraie correction est de refaire les feuilles.

## Plan

**1. Régénérer les sprites du Vigile Muet**
- Générer trois nouvelles feuilles cohérentes, même gabarit pour toutes les animations : cadre 96x128, silhouette ~110 px de haut, pieds toujours sur la même ligne (y=124), personnage centré horizontalement.
- Style conservé : Vigile Muet gothique, capuche, silhouette sombre, palette crimson/os du jeu.
- Animations : idle (4 frames), walk (6 frames), attack (5 frames).

**2. Vérification automatique avant intégration**
- Script de mesure (bounding box alpha par frame) qui valide que la hauteur de silhouette varie de moins de 3 px entre toutes les frames des trois animations et que la ligne de pieds est identique. Si l'écart dépasse le seuil, régénération/recadrage jusqu'à conformité.

**3. Intégration**
- Mise à jour de `public/assets/sprites/vigile_muet_atlas.json` avec les nouvelles dimensions de frame.
- Mise à jour de `src/game/assets.ts` (frameWidth/frameHeight/frameCount).

**4. Simplification du code d'alignement**
- Dans `src/game/entities/Player.ts` : suppression de la normalisation par frame devenue inutile (échelle unique fixe, origine (0.5, 1) constante), hitbox stable.
- `src/game/spriteMetrics.ts` reste utilisé comme garde-fou pour les ennemis, ou est réduit à un simple contrôle de cohérence.

**5. Validation en jeu**
- Test Playwright : capture idle / marche / attaque, vérification que la hauteur affichée et le bas du corps restent constants, plus captures visuelles pour contrôler que le rendu n'est plus flou.

## Détails techniques

- Recadrage post-génération automatisé en Python/PIL : détection de la bounding box, mise à l'échelle uniforme vers 110 px de silhouette, collage centré et aligné sur la ligne de pieds dans le cadre 96x128. Cela garantit la cohérence même si le générateur d'images varie légèrement.
- Rien n'est modifié côté gameplay, mutations, ennemis ou UI.

## Alternative si tu préfères garder les assets actuels

Recadrer/upscaler les feuilles existantes par script (sans régénération artistique) : la taille devient cohérente immédiatement, mais la marche et l'attaque resteront moins détaillées que l'idle puisque l'information de pixels manque à la source.
