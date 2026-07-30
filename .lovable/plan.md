## Objectif

Le Vigile n'a aujourd'hui qu'une seule action offensive (`vigile-attack-anim`, portée fixe, cooldown unique) et aucune option défensive. On ajoute un moveset complet, lisible à la manette Xbox comme PlayStation, et on l'intègre à l'arbre de mutations existant.

## Le moveset

| Action | Effet | Clavier (défaut) | Manette (défaut) |
|---|---|---|---|
| Frappe (combo 3 coups) | Enchaînement dans une fenêtre de 500 ms : coup 1 et 2 normaux, coup 3 plus lent, plus fort, recul | E | X / Carré |
| Attaque lourde (chargée) | Maintien ≥ 450 ms : dégâts x2,2, portée +40, brise la garde des Pénitents | E maintenu | X / Carré maintenu |
| Attaque aérienne piquée | En l'air + bas : plongeon vers le sol, dégâts de zone à l'impact | Attaque en l'air | idem |
| Esquive / roulade | Déplacement rapide 220 px, invulnérabilité 220 ms, cooldown 700 ms | Maj gauche | B / Cercle |
| Parade (contre) | Fenêtre 180 ms : annule le coup, étourdit l'ennemi 1,2 s, rend de la Chair | A | LB |
| Rugissement de Chair (spécial) | Consomme 40 Chair : onde sanglante autour du Vigile, gros dégâts + repoussée | R | RB |

Toutes ces actions passent par le système d'attribution déjà en place : chaque nouvelle action apparaît dans l'écran **Options** et est réattribuable au clavier et à la manette.

## Manettes Xbox / PlayStation

Le mapping standard du navigateur est identique sur les deux familles de manettes ; seuls les libellés changent. On détecte la marque via l'`id` de la manette et on affiche « X / Carré », « B / Cercle », « LB / L1 », etc. en conséquence, plus les gâchettes analogiques (LT/RT en axes) pour la charge. Vibration (rumble) sur les coups reçus et sur l'impact du coup lourd, quand la manette la supporte.

## Équilibrage et intégration

- Les ennemis gagnent une phase d'anticipation (télégraphie 350 ms, teinte) pour que l'esquive et la parade aient un sens.
- Le Pénitent-Greffé reçoit une garde : seuls le coup lourd, la parade et le spécial la brisent.
- Trois nouvelles mutations relient le moveset à la Voie de la Chair : `ten-roulade` (esquive plus longue), `os-parade` (fenêtre de parade élargie), `san-rugissement` (coût du spécial réduit, onde plus large).
- Le HUD affiche le cooldown de l'esquive et la jauge de spécial.

## Détails techniques

- Nouvelle machine à états dans `src/game/entities/Player.ts` (`idle | run | attack1..3 | heavy | dive | dodge | parry | special | hurt`) au lieu du booléen `attacking` actuel, avec fenêtres actives (frames de hit) par état.
- Nouvelles actions dans `src/store/bindingsStore.ts` (`dodge`, `parry`, `special`, `heavy` en tant que maintien de `attack`), migration douce des attributions déjà stockées en localStorage.
- `src/game/input.ts` : ajout du temps de maintien par action (pour la charge) et lecture des gâchettes analogiques.
- Résolution des coups déplacée de `GameScene.resolvePlayerStrike` vers un descripteur par attaque (portée, dégâts, recul, brise-garde, forme de la zone).
- `src/store/gameStore.ts` : réserve de spécial, dépense de Chair, compteur de parades réussies.
- Sprites : on réutilise les feuilles existantes avec des variations (inclinaison, étirement, traînée, flash) pour l'esquive, la charge et le piqué ; on ne régénère de nouvelles feuilles que si le rendu n'est pas assez lisible.

## Vérification

Test Playwright sur la scène de jeu : déclenchement de chaque action au clavier, contrôle des dégâts appliqués, de l'invulnérabilité d'esquive et de la dépense de Chair, sans erreur console.
