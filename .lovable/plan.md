## Constat

Mesure faite dans l'aperçu : le rendu tourne bien à ~60 FPS (16,7 ms par image), donc le problème n'est **plus** graphique. Il vient de la logique de déplacement dans `src/game/entities/Player.ts`.

Deux causes identifiées à la lecture du code :

1. `alignBody()` est appelé **à chaque frame** (`tick()` ligne 196). Il refait `setScale`, `setOrigin`, `body.setSize()` et `body.setOffset()` 60 fois par seconde. Redimensionner un corps Arcade en pleine collision repositionne le corps et réinitialise son état de contact : le héros « accroche » au sol, les drapeaux `blocked.down` clignotent, d'où les saccades à la marche et les sauts qui ne partent pas.
2. Aucune tolérance d'entrée sur le saut : le saut n'est pris en compte que si `onGround` est vrai **exactement** à la frame de l'appui. Avec des contacts sol instables (point 1) ou un appui juste avant l'atterrissage, l'appui est perdu — c'est le « parfois ça ne saute pas ».

## Correctifs prévus

**Player.ts**
- Appeler `alignBody()` une seule fois dans le constructeur (le gabarit des sprites est déjà normalisé, l'échelle et la hitbox sont constantes) au lieu de chaque frame. Remettre `setScale(SCALE)` uniquement là où une attaque l'a modifié.
- Ajouter un **coyote time** (~110 ms) : le héros peut encore sauter juste après avoir quitté le sol.
- Ajouter un **buffer de saut** (~130 ms) : un appui fait juste avant de toucher le sol déclenche le saut à l'atterrissage.
- Vérifier que les états verrouillés (attaque, parade, réception) ne bloquent pas le déplacement plus longtemps que prévu, et que la flexion d'élan (`CROUCH_MS`) n'annule pas l'élan horizontal de façon trop agressive (`velocity.x * 0.35` pendant l'accroupissement).
- Ne plus figer la vitesse horizontale à 0 pendant les frames de récupération d'attaque au sol lorsque le joueur tient une direction (reprise du contrôle plus souple).

**Ressenti de déplacement**
- Passer le suivi caméra horizontal d'un lerp de 0,12 à ~0,2 dans `GameScene.ts` pour que l'image suive mieux le héros et que l'avancée paraisse franche.

## Vérification

Test Playwright sur l'aperçu : lancer une partie, maintenir la direction, mesurer le déplacement réel du héros sur 2 s, puis enchaîner 10 sauts et vérifier que chacun décolle. Capture d'écran à l'appui.
