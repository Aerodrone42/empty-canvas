## Constat

Dans la salle du Trône, deux choses jurent avec le décor peint :

1. Les props ajoutés par-dessus le fond (`GameScene.ts`, l. 555-568) : deux statues de pleureuses (x=1080, x=1920), 3 à 5 amas de chair et un supplicié crucifié (x=300). Ce sont des sprites réutilisés des autres salles, mal calés sur ce fond déjà très chargé.
2. Le mur qui se ferme (`lockArena`, l. 294-305) : c'est un simple `add.rectangle` bordeaux translucide (36×470, `0x53161f`, alpha 0.85) posé au premier plan — aucun sprite, d'où l'aspect « placeholder ».

## Changements

1. **`src/game/scenes/GameScene.ts`** — branche `throne` (l. 555-568) : suppression des `WeepingStatue`, du `scatterFleshBlobs` et du `CrucifiedProp`. La salle garde son décor de fond, ses torchères, ses pendus, son autel et ses vagues.

2. **Nouvelle herse de fer** — le rectangle bordeaux est remplacé par un vrai sprite pixel-art dans le style du jeu :
   - Génération de `public/assets/sprites/props/iron_gate.png` : grille de fer forgé verticale, barreaux rongés de rouille, pointes acérées en bas (et en haut), teintes fer sombre / bronze patiné accordées à la palette bordeaux-brun de la salle, fond transparent.
   - Déclaration dans `src/game/assets.ts` et chargement dans `src/game/scenes/BootScene.ts`.

3. **`src/game/scenes/GameScene.ts`** — `lockArena` : la herse est un `Image` posé au niveau du verrou, qui tombe du plafond (tween rapide + rebond court), plante ses pointes dans le sol, déclenche la secousse de caméra existante, un impact de poussière et le message « Le passage se referme ». Le collider statique reste identique (même largeur, même hauteur) mais est désormais invisible et masqué derrière le sprite, donc le blocage ne change pas.

## Résultat

Salle III épurée : plus de props recyclés hors style, et la fermeture de l'arène se joue avec une vraie herse de fer à pointes qui s'abat, cohérente avec le décor gothique.