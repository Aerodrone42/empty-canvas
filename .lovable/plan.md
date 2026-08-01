## Périmètre

Refaire **uniquement le Bourreau** : ses trois planches de sprites, régénérées par génération d'image, dans le style du jeu et aux dimensions exactes du moteur.

**Rien d'autre n'est touché** : ni la machine d'écartèlement (`torture_rack_frame.png`), ni le supplicié (`torture_rack_victim_spritesheet.png`), ni `src/game/effects/TortureRack.ts`.

## Contraintes fixes

- **224 x 176 par frame**, fond transparent, pieds sur la ligne de sol, même échelle que les autres ennemis.
- Silhouette stable d'une frame à l'autre : même centre, même taille de couperet, même carrure.
- Style : gothique organique sombre, cuir tanné, masque de bourreau à lanières, chaîne et crochet à la ceinture, torse pâle marqué, éclairage latéral froid, sang séché. Pas de contour cartoon, pas de fond.

## Planches

| Planche | Frames | Contenu |
|---|---|---|
| `bourreau_attack_spritesheet.png` | 6 | armement couperet derrière l'épaule (0-1), swing (2-3), impact bras tendu vers l'avant (4), retour à la garde (5) |
| `bourreau_idle_spritesheet.png` | 4 | respiration lourde, couperet appuyé sur l'épaule, chaîne qui balance |
| `bourreau_walk_spritesheet.png` | 6 | marche pesante, épaules qui roulent |

L'attaque est la priorité : c'est elle qui est illisible aujourd'hui. Idle et walk sont refaits dans la foulée pour rester cohérents avec elle.

`bourreau_crank.png` (le bourreau à la manivelle) reste tel quel puisqu'il appartient à la scène de la machine.

## Méthode

1. Une **feuille de référence** du Bourreau générée en premier, validée visuellement avant toute animation.
2. Chaque frame générée à partir de cette référence : seule la pose change, le personnage reste identique.
3. Assemblage sur la grille 224 x 176 avec contrôle programmatique : bbox de chaque frame, pieds alignés, centre stable, transparence propre, largeur totale exacte.
4. **Validation visuelle avant câblage.** Une frame incohérente est régénérée, jamais repeinte à la main.

## Câblage moteur (une seule fois, à la fin)

- `src/game/assets.ts` : `bourreau-attack` → `frameCount: 6`, `frameRate: 12` ; ajustement des compteurs idle/walk si nécessaire.
- `src/game/scenes/BootScene.ts` : anim `bourreau-windup-anim` (frames 0-1, 7 fps) pour la phase d'anticipation.
- `src/game/entities/Enemy.ts` : champ optionnel `windupAnim` dans `EnemyStats`, joué pendant les 350 ms d'anticipation à la place du idle teinté ; le coup part sur la frame d'impact.
- Contrôle final en jeu par capture runtime : anticipation lisible, swing visible, impact synchronisé avec les dégâts.

## Ce que je ne fais plus

Aucun membre dessiné en script, aucune rotation de lame, aucun inpainting manuel. Le sprite sort de la génération d'image ou n'est pas livré.
