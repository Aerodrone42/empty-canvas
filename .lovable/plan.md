## Objectif
Étape actuelle : **uniquement la salle du Trône allongée, son sol et ses fonds**. Aucun ennemi, aucune vague, aucune herse. Le joueur doit pouvoir marcher longuement à travers le décor jusqu'au Trône.

## Longueur
`throne.width` : 2000 → **9600 px**. Traversée à pied de plusieurs minutes, entièrement libre.

## Contenu de la salle à cette étape
- `spawns` : vide
- `waves` : supprimées
- `arenaLockX` : supprimé
- Autel de sang conservé (x≈900) comme point de départ/sauvegarde
- Écorchés suspendus et mains agrippantes : conservés en décor léger, redistribués sur les 9600 px pour éviter les zones vides
- Sol : plat et continu sur toute la largeur, aucune fosse ni plateau
- Torches au sol : déjà distribuées dynamiquement selon la largeur, rien à changer

## Fonds de décor (3 couches parallaxe)
Les images validées sont trop courtes pour 9600 px. Régénération :
- `throne_far_v1.png` — nef profonde bouclable (arcades, brume rouge), défilement 0.15
- `throne_mid_v1.png` — **composition en progression, non bouclée** : ossuaire → colonnes → estrade → trône de chair au fond, étirée sur toute la salle, défilement 0.45, pour que le Trône grossisse à mesure qu'on avance
- `throne_near_v1.png` — piliers et braseros d'avant-plan, tuilés avec espacement irrégulier, défilement 0.9

Je te renvoie les 3 images pour validation avant intégration.

## Détails techniques
- `src/game/roomConfig.ts` : entrée `throne` réduite à width / spawnX / altarX / hangers / hands, listes de combat vidées
- `src/game/scenes/GameScene.ts` : aucune logique retirée (les boucles vagues/herse ne produisent rien sans configuration) ; géométrie, sol et parallaxe suivent déjà `config.width`
- `src/game/assets.ts` / `BootScene.ts` : mêmes clés, images remplacées

Ennemis, vagues, herse, boss et reskin de l'autel : étapes suivantes.
