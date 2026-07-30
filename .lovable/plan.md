## Ce que j'ai trouvé

Le document que tu m'envoies correspond exactement au README déjà présent dans le dépôt. Les 12 images sont bien arrivées dans `public/assets/sprites/backgrounds/` : 4 scènes × 3 calques (far / mid / near).

| Scène | Usage prévu |
|---|---|
| `cathedrale_*` | nef gothique — salle d'exploration principale |
| `corridor_*` | couloir de chair et d'os — transitions |
| `throne_*` | arène de boss (Mère-Suture) |
| `exterieur_*` | parvis en ruine — zone à ciel ouvert |

Aujourd'hui `GameScene.buildBackdrop()` dessine des arches à la main avec `Phaser.Graphics` : ces décors ne sont ni chargés ni affichés. Point technique à corriger : les calques `far` font 1672×941 alors que `mid`/`near` font 1536×1024 — sans normalisation, les trois calques ne s'aligneraient pas verticalement.

## Ce que je vais faire

**1. Déclarer les décors**
Nouvelle table `BACKDROPS` dans `src/game/assets.ts` : pour chaque scène (`cathedrale`, `corridor`, `throne`, `exterieur`), les 3 chemins de calques + une teinte d'ambiance et une couleur de sol assortie à la palette de la scène.

**2. Les charger**
`BootScene` précharge les 12 images en plus des spritesheets.

**3. Un module de parallaxe réutilisable**
Nouveau `src/game/effects/Parallax.ts`, suivant la méthode `tileSprite` du README :
- 3 `tileSprite` plein écran, `scrollFactor(0)`, profondeurs -30 / -20 / -10
- défilement lié à `cameras.main.scrollX` dans `update()` aux vitesses 0,1 / 0,3 / 0,6
- normalisation de l'échelle des trois calques sur la hauteur de salle (900 px) pour corriger le décalage 941 vs 1024, et ancrage du bas de l'image sur la ligne de sol (y=780) pour que l'architecture repose sur le plancher
- léger décalage vertical du calque near vers le bas pour renforcer la profondeur

**4. Améliorations d'ambiance (par-dessus les images)**
- voile de couleur global par scène (crimson/ocre selon la salle) et vignette assombrissant les bords
- poussière et cendres flottantes en particules, à `scrollFactor` intermédiaire
- vacillement lent de luminosité sur le calque `near` pour simuler les cierges
- le sol dessiné en code reprend la couleur de la scène pour se fondre avec le décor

**5. Brancher la salle actuelle**
`GameScene.buildBackdrop()` est remplacé par un appel au module de parallaxe avec la scène `cathedrale`, et `GameScene.update()` fait avancer les calques. La scène accepte une donnée `backdrop` optionnelle, pour basculer sur `corridor`, `throne` ou `exterieur` quand les autres salles arriveront.

## Détails techniques

- `pixelArt: true` est déjà actif dans `src/game/config.ts` : rendu net sans lissage, comme le recommande le README.
- Les fichiers `PREVIEW_*` ne sont pas dans le dépôt, donc rien à exclure du chargement.
- Aucune image n'est modifiée sur le disque ; tout l'ajustement se fait au chargement.
- Les taches de sang persistantes (`BloodFX.stain`) restent au-dessus du décor et sous les personnages.
- Vérification finale au navigateur : captures en début et en fin de salle pour confirmer le défilement différencié des trois calques, plus contrôle de la console.
