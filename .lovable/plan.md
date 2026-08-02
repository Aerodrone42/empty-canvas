## Ce que j'ai vérifié

- `src/game/entities/Player.ts` : la parade se déclenche uniquement sur un appui bref (`justDown("parry")`) et n'est active que `PARRY.window = 180 ms` (`src/game/combat.ts`). Passé ce délai, il reste 320 ms de récupération pendant lesquels le héros est immobile **et** vulnérable.
- `src/game/scenes/GameScene.ts` (`resolveEnemyStrike`) : le coup n'est annulé que si `tryParry()` est vrai à l'instant exact de l'événement `enemy-strike`.
- `src/game/entities/Enemy.ts` : l'ennemi frappe après `TELEGRAPH_MS` + 180 ms, en un seul instant ponctuel. Il faut donc appuyer dans une fenêtre de 180 ms alignée pile sur cet instant, sans aucune tolérance ni retour visuel/sonore.
- `src/store/bindingsStore.ts` : la parade est par défaut sur `KeyA`, qui sur un clavier AZERTY correspond à la touche physique **Q**, juste à côté du déplacement gauche (`KeyQ` = touche physique A) — source de confusion supplémentaire.

Conclusion : la parade « ne fonctionne pas » parce qu'elle est quasi impossible à timer et ne donne aucun signe qu'elle est active ou réussie.

## Ce que je propose

1. **Garde maintenue + parade parfaite**
   - Maintenir la touche = état `guard` : le héros bloque les coups (dégâts fortement réduits, léger recul, pas d'étourdissement de l'ennemi).
   - Les ~200 premières ms du maintien = **parade parfaite** : coup totalement annulé, ennemi étourdi, gain de Chair (comportement actuel conservé).
   - Relâchement = retour immédiat à `idle`, sans la longue récupération punitive actuelle.

2. **Tolérance d'entrée (input buffer)**
   - Un appui juste après le coup (~120 ms) compte encore comme parade parfaite, pour absorber la latence humaine.

3. **Retour visuel clair**
   - Aura/teinte pendant la garde, éclat blanc plus marqué et étincelles sur parade parfaite, teinte différente sur simple blocage.
   - Petite vibration manette distincte selon parade parfaite / blocage.

4. **Touche par défaut plus naturelle**
   - Clavier : parade sur une touche non ambiguë (proposition : `KeyW` ou clic droit / `KeyX`), manette : bouton d'épaule gauche LB (bouton 4, inchangé).
   - Les remappages déjà enregistrés par le joueur sont préservés (migration douce existante).

5. **HUD**
   - La ligne d'aide de `src/components/game/Hud.tsx` mentionnera « maintenir pour garder, appuyer au bon moment pour parer ».

## Détails techniques

- `src/game/combat.ts` : `PARRY` devient `{ perfectWindow: 200, buffer: 120, guardDamageMult: 0.25, recovery: 120, stun: 1200, fleshReward: 6 }`.
- `src/game/entities/Player.ts` : nouvel état `guard` distinct de `parry` ; `tryParry(time)` renvoie `"perfect" | "guard" | null` ; prise en compte du buffer via un timestamp `parryPressedAt`.
- `src/game/scenes/GameScene.ts` : `resolveEnemyStrike` traite les trois cas (parfait / bloqué / touché).
- `src/store/bindingsStore.ts` : mise à jour du défaut clavier pour `parry`.
