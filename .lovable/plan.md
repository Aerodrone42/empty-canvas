## Objectif

Trois manques constatés en jeu : aucun sang, une mort d'ennemi fade (simple fondu + rotation), et aucun moyen clair de récupérer de la vie.

## 1. Système de sang (nouveau `src/game/effects/Blood.ts`)

Un module unique de VFX réutilisé partout, à base de particules Phaser + rectangles :

- **Gerbe d'impact** : à chaque coup encaissé (joueur ou ennemi), 8–16 gouttes projetées dans la direction du coup, gravité, taille aléatoire, teintes crimson (#8e1220 → #d93b3b).
- **Brume** : petit nuage rouge translucide au point d'impact, fondu en 200 ms.
- **Éclaboussures au sol** : les gouttes qui touchent le sol laissent une tache persistante (max ~60 taches, les plus vieilles s'effacent) — la salle se salit au fil du combat.
- **Traînée sur parade** : étincelles dorées au lieu de sang (déjà distinct visuellement).
- **Vignette rouge** quand la vie du joueur passe sous 30 % (overlay CSS dans le HUD, pas de coût Phaser).

Branchements : `Enemy.takeHit` (gerbe orientée), `Player.receiveDamage` (gerbe + flash écran), coup lourd / plongeon / rugissement (gerbe amplifiée).

## 2. Mort d'ennemi retravaillée

Remplacement du tween actuel dans `Enemy.die()` par une séquence :

1. Freeze-frame de 60 ms + zoom caméra léger sur les kills au coup lourd/spécial.
2. Explosion de sang (30–40 particules) + 3–5 morceaux de chair qui rebondissent au sol.
3. Le corps se teinte en rouge sombre, s'affaisse (rotation vers le sol + squash), puis se fond dans une flaque de sang persistante.
4. Orbes de chair : la récompense en chair devient 2–4 orbes lumineux qui volent vers le joueur avant d'être crédités (feedback lisible du gain).
5. Son/rumble : shake caméra court + vibration manette légère.

Les morts par rugissement sont plus violentes (plus de particules, plus de gibs).

## 3. Récupération de vie

Actuellement seule la greffe « vol de vie » soigne. Ajout de trois sources :

- **Absorption de chair** (mécanique principale) : maintenir la touche parade à vide (hors combat, aucun ennemi à moins de 300 px) pendant 900 ms consomme 25 chair et rend 20 PV. Interruptible si on est touché — un vrai choix ressource/risque, dans l'esprit Blasphemous.
- **Orbes de sang** : chaque ennemi tué a une chance (30 %, 100 % pour le Pénitent) de lâcher une fiole de sang ramassable qui rend 12 PV.
- **Autel de la Chair** : soin complet quand on ouvre l'autel (touche autel), une seule fois par salle, et l'autel se marque comme consommé.

Le HUD affiche : la barre de vitalité avec pulsation à basse vie, le coût du soin sous la jauge de chair, et un anneau de progression pendant l'absorption.

## Détails techniques

- Nouveaux fichiers : `src/game/effects/Blood.ts` (émetteurs de particules et taches), `src/game/entities/Pickup.ts` (fioles de sang et orbes de chair).
- `src/store/gameStore.ts` : action `consumeFleshForHealth()`, compteur d'autels utilisés, drapeau `absorbing` pour l'UI.
- `src/game/entities/Enemy.ts` : `die()` réécrit, `takeHit()` émet les VFX.
- `src/game/entities/Player.ts` : état `absorb` dans la machine à états, VFX sur dégâts reçus.
- `src/game/scenes/GameScene.ts` : instancie le gestionnaire de sang, groupe de pickups + overlap joueur.
- `src/components/game/Hud.tsx` : vignette basse vie, indicateur d'absorption.
- Textures de particules générées à la volée (`scene.textures.generate`) — aucun asset à télécharger.
- Plafond de particules pour préserver le framerate.

Vérification finale : partie jouée via Playwright, captures d'un impact, d'une mort et d'une absorption, console sans erreur.
