## Constat

- Aucune spritesheet de garde n'existe (`public/assets/sprites/` : idle, walk, attack, dodge, jump), et `BootScene.ts` ne crée aucune animation de parade : la garde n'est qu'une teinte sur l'idle, invisible en jeu.
- Dans `GameScene.ts`, une attaque bloquée passe quand même par `receiveDamage()` → flash rouge, recul, clignotement : à l'écran, parer ressemble à encaisser.
- Dans `Player.ts`, la fenêtre parfaite ne dure que 200 ms après l'appui ; si l'ennemi frappe plus tard alors que la garde est tenue, le coup passe en dégâts réduits.
- `bindingsStore.ts` : la nouvelle touche `KeyW` ne s'applique qu'aux nouveaux joueurs ; une config déjà sauvegardée reste sur `KeyA`.

## Plan (sans bouclier)

1. **La garde pare vraiment**
   - Touche maintenue = coup entièrement bloqué (0 dégât), petit recul, pas de flash rouge ni d'invulnérabilité de blessure.
   - Appui dans la fenêtre (~300 ms avant l'impact) = **parade parfaite** : coup annulé, ennemi étourdi, gain de Chair, court hitstop (~90 ms).

2. **Retour visuel réservé à la parade parfaite**
   - **Étincelles uniquement quand le coup est paré au bon moment** : gerbe d'étincelles au point d'impact, éclat blanc/or bref sur le héros, mention « PARADE » au-dessus de la tête, secousse caméra et vibration manette marquées, ennemi repoussé.
   - Blocage simple (garde tenue hors fenêtre) : aucun éclat ni étincelle — juste un sourd sursaut du héros et un léger recul, sans flash rouge.
   - Posture de garde : le héros se fige sur une frame d'idle, légèrement reculé et teinté froid, pour distinguer la garde de l'idle animé.

3. **HUD**
   - Petit indicateur de garde active (liseré sur la barre de vie) et rappel de la touche assignée.

4. **Touche par défaut réellement appliquée**
   - Migration de la config sauvegardée : ancien `KeyA` de parade → `KeyW`, une seule fois, sans écraser un remappage volontaire vers une autre touche.

## Détails techniques

- `src/game/combat.ts` : `PARRY` → `{ perfectWindow: 300, buffer: 140, guardDamageMult: 0, guardKnockback: 90, hitstop: 90, stun: 1200, fleshReward: 6 }`.
- `src/game/entities/Player.ts` : `onGuardBlocked(perfect)` (recul + FX seulement si `perfect`, aucun dégât) ; état `guard` fige l'anim idle sur une frame avec léger offset arrière.
- `src/game/effects/GuardFX.ts` (nouveau) : `perfectFlash(x, y, dir)` — étincelles, éclat, texte « PARADE ». Pas de visuel de bouclier, pas d'effet pour un blocage non parfait.
- `src/game/scenes/GameScene.ts` : `resolveEnemyStrike` route sur `"perfect" | "guard" | null` ; dégâts seulement si `null`, FX seulement si `"perfect"`.
- `src/store/bindingsStore.ts` : migration versionnée dans le chargement des bindings.
