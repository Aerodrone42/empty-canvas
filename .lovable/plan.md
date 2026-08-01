## Objectif

La Monture d'Effroi cesse d'être un décor qui traverse le ciel. Elle devient un **mini-boss aérien** dans la seconde moitié de la salle 1 (avant la colonne de sortie, située à x=2150). L'humain avalé disparaît complètement.

## Comportement

- **Déclenchement** : quand le héros dépasse ~x=1500 (moitié de salle, avant la colonne), la monture arrive en vol depuis le fond, rugit et engage le combat.
- **Elle reste en vol** en permanence, oscillant au-dessus du héros à hauteur variable.
- **Attaques** :
  - *Piqué* : elle plonge en charge horizontale au niveau du héros, dégâts au contact, puis remonte.
  - *Morsure* : en vol stationnaire bas, la gueule se referme sur le héros (portée courte, télégraphiée).
  - *Griffes* : passage rapide, les serres balaient devant elle.
- **Télégraphe** avant chaque attaque (montée + éclat rouge) pour laisser la parade/esquive jouables.
- **Vulnérabilité** : touchable par les attaques du héros seulement quand elle descend (piqué, morsure, griffes) ; hors de portée pendant la remontée.
- **Mort** : PV élevés (mini-boss), phase enragée en dessous de 35 % (attaques plus rapides), puis chute au sol, gerbe de sang et disparition.
- La **colonne de sortie ne s'ouvre qu'après sa mort**, en plus des ennemis au sol.

## Suppression de l'humain

- Retrait de la victime dans toutes les planches : plus d'humain dans la gueule, plus d'animation d'avalement.
- Les séquences `fly-fed` et `swallow` sont supprimées ; la gueule ouverte/fermée sert désormais à la morsure.

## Animations régénérées

Reconstruction des planches à partir de l'illustration source, gueule vide :
- `fly` : vol en boucle, deux ailes battant + queue ondulante + flexion du cou.
- `dive` : piqué corps incliné, ailes repliées.
- `bite` : gueule qui s'ouvre puis claque.
- `claw` : serres avancées.
- `death` : chute, ailes brisées.

Chaque planche est contrôlée frame par frame avant intégration (deux ailes en mouvement, queue mobile, aucune anatomie parasite).

## Détails techniques

- `DreadMount.ts` refondu en entité de combat : machine à états (`idle` / `telegraph` / `dive` / `bite` / `claw` / `recover` / `enraged` / `dying`), PV, hitbox de contact, réception des coups du héros via `resolvePlayerStrike`.
- `GameScene.ts` : instanciation liée à un déclencheur de position dans la cathédrale, ajout de la monture à la condition d'ouverture de `openGate()`, dégâts routés par `resolveEnemyStrike` (parade possible).
- `BootScene.ts` : chargement des nouvelles planches (`v=7`), suppression de `dread-mount-fly-fed` et `dread-mount-swallow`.
- Le sprite passe en scrollFactor 1 et profondeur devant le décor pendant le combat, pour que les collisions soient lisibles.
