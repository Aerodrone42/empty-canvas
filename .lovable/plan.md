## Constat (code lu)

- `src/game/entities/Player.ts` ligne 498-505 : le double saut applique `body.setVelocityY(-jumpPower * 0.9)`, soit 10 % plus faible que le premier saut (`JUMP = 520`). Il est déclenché alors que le héros tombe déjà, donc ressenti encore plus court.
- Attaques en l'air : seule la piquée existe (`attack` + bas, ligne 410). Aucune frappe orientée vers le haut — les zones de frappe de `src/game/combat.ts` sont toutes centrées à `centerY ≈ -76` avec une demi-hauteur ~118, donc rien ne porte au-dessus du héros (impossible de toucher proprement la Monture d'Effroi ou le Pendu-Écorché en l'air).

## Correctifs

### 1. Double saut plus haut (`src/game/entities/Player.ts`)
- Remettre la vitesse verticale à zéro avant l'impulsion aérienne, puis appliquer `-jumpPower * 1.1` (au lieu de `0.9`) : le second saut monte franchement plus haut que le premier, même en pleine chute.
- Troisième saut (mutation) légèrement plus faible (`* 0.95`) pour garder une progression lisible.
- Renforcer l'effet visuel `fx-sparks` déjà émis au décollage aérien.

### 2. Frappe ascendante (`src/game/combat.ts` + `Player.ts`)
- Nouveau descripteur `STRIKES.upper` : portée horizontale courte (~90 px), zone haute (`centerY ≈ -170`, `vertical ≈ 110`), dégâts proches du combo2, knockback vertical modéré, `duration ≈ 320`.
- Déclenchement : touche d'attaque avec **haut** maintenu (flèche haut clavier ou stick/D-pad vers le haut), au sol comme en l'air.
  - Au sol : petit décollage (impulsion verticale légère) pour accompagner le coup.
  - En l'air : le héros conserve son inertie, l'attaque ne consomme pas de saut.
- La frappe aérienne classique (attaque sans direction, en l'air) reçoit une zone légèrement relevée pour toucher les cibles à hauteur de vol.

### 3. HUD (`src/components/game/Hud.tsx`)
- Ajouter une ligne d'aide : « Haut + frappe · coup ascendant », dans le même style typographique que les lignes existantes.

Aucune modification des ennemis ni de leur équilibrage : seuls le saut et les zones de frappe du héros changent.
