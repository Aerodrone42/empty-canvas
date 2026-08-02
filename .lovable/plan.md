## Check-up — état réel des 4 salles

Constats vérifiés dans le code (`GameScene.ts`, `rooms.ts`, `assets.ts`, `Enemy.ts`, `combat.ts`) :

| Salle | Décor | Peuplement | Autel | Boss | Verdict |
| --- | --- | --- | --- | --- | --- |
| I Nef Suppurante | oui (crucifiés, monture d'effroi) | 4 ennemis + 2 pendus + 3 mains | oui (x=1400) | non (monture = mini-boss) | la plus aboutie |
| II Corridor de Chair | oui (veine, statues, roue, blobs) | 6 ennemis + 3 pendus + 4 mains | oui (x=1200) | non | correcte, la plus dense |
| III Le Trône | palette seulement | **retombe sur le peuplement générique de la salle I** | **aucun** | **aucun** | coquille vide |
| IV L'Extérieur | palette seulement | idem salle I | **aucun** | **aucun** | coquille vide |

Autres points structurels :
- `exitRoom()` boucle en modulo : après la salle IV on revient à la salle I, il n'y a pas de fin de prologue. La bible prévoit Mère-Suture au niveau 4.
- Géométrie 100 % plate : un seul rectangle de sol sur 2400 px, aucune plateforme, aucun gouffre, aucune verticalité — le saut et le plongeon (`dive`) ne servent à rien.
- Toutes les salles font exactement 2400×900 et se jouent pareil : avancer à droite, tuer tout, la porte s'ouvre. Aucune variation de rythme (arènes, vagues, embuscade fermée).
- Bestiaire limité à 4 types (Suppliant, Pénitent, Écorché pendu, Bourreau) et aucun ennemi à distance : le joueur n'a jamais à esquiver un projectile, donc l'esquive est peu sollicitée.
- Aucun panneau de titre de salle à l'entrée, aucun repère de progression pendant le run.

## Améliorations proposées (par priorité)

### P1 — Rendre les salles III et IV réellement jouables
- Table de configuration par salle (peuplement, autel, props, largeur) au lieu du `if/else` codé en dur.
- Salle III « Le Trône » : arène fermée — le passage se verrouille derrière le héros, 3 vagues d'ennemis, autel avant la dernière.
- Salle IV « L'Extérieur » : parcours plus long et vertical (parvis, degrés), ennemis espacés, autel en début de zone.
- Props dédiés à chaque salle réutilisant les effets existants (torches, statues, blobs, mains) pour éviter la sensation de décor vide.

### P2 — Boss de fin de prologue (Mère-Suture, niveau 4)
- Entité boss avec barre de vie dédiée en HUD, 2 phases, attaques télégraphiées parables.
- Autel obligatoire juste avant la salle du boss ; à sa mort, écran de fin de chapitre au lieu du bouclage sur la salle I.

### P3 — Level design : donner du relief
- Ajouter des plateformes statiques et une ou deux fosses par salle (le sol devient une suite de segments), pour rendre saut, esquive aérienne et plongeon utiles.
- Placer quelques pickups en hauteur pour récompenser l'exploration.

### P4 — Variété de combat
- Un ennemi à distance (cracheur de bile) qui force l'esquive et la parade dirigée.
- Variante « élite » des types existants (plus de PV, teinte, récompense de Chair supérieure) placée aux points de tension.
- Les Bourreaux du corridor sortent aussi dans les salles III/IV via les vagues.

### P5 — Lisibilité et ressenti
- Cartouche de titre de salle au fondu d'entrée (« II — Le Corridor de Chair »).
- Indicateur discret d'ennemis restants avant l'ouverture du passage.
- Ambiance sonore différenciée par salle (le `MusicDirector` ne distingue aujourd'hui que salle 1 / salle 2).

## Détails techniques

- Nouveau fichier `src/game/roomConfig.ts` : un objet par `BackdropKey` décrivant spawns, vagues, autel, props, largeur de salle ; `GameScene.populateRoom` et `buildBackdrop` le consomment.
- `ROOM_WIDTH` et `ALTAR_X` deviennent des champs de cette config au lieu de constantes globales.
- `buildGeometry` accepte une liste de segments de sol + plateformes issues de la config.
- Boss : `src/game/entities/MereSuture.ts` sur le modèle de `DreadMount` (phases, `hurtbox`, `takeHit`), plus un état `bossHealth` dans `gameStore` pour la barre HUD.
- `exitRoom()` : fin de la salle IV → écran de fin de chapitre plutôt que retour modulo.

## Ordre d'exécution suggéré

P1 d'abord (le plus visible : deux salles actuellement vides), puis P3 pour le level design, puis P2 le boss, enfin P4/P5.
