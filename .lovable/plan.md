## Le concept (tel qu'il est codé aujourd'hui)

La **Voie de la Chair** est l'arbre de progression permanent du Vigile. La Chair récoltée sur les cadavres sert de monnaie : chaque greffe modifie durablement tes statistiques, et les greffes de rang 2/3 exigent la greffe parente (« la chair pousse sur la chair »).

Trois branches :
- **Ossuaire** — encaisser (PV max, réduction de dégâts, fenêtre de parade)
- **Tendon** — bouger (vitesse, double/triple saut, cadence d'attaque, roulade)
- **Sanie** — tuer (dégâts, portée, vol de vie, gain de Chair, Rugissement)

Vérifié dans le code : les effets **sont réellement appliqués** (vitesse, saut, cooldown, portée, roulade, parade, coût du Rugissement, PV max, réduction de dégâts, vol de vie). Le problème n'est pas mécanique, c'est que **rien ne le montre** : pas de chiffres, pas de retour visuel, pas de changement d'apparence. Tes deux greffes actuelles donnent +30 PV max et ×1.4 dégâts — invisible sans jauge chiffrée.

## Ce que je propose de construire

### 1. Panneau de statistiques dans la Voie de la Chair
Une colonne récapitulative permanente affichant les valeurs courantes issues des effets calculés : PV max, dégâts, vitesse, cadence, portée, réduction de dégâts, vol de vie, sauts. Au survol d'une mutation non greffée, les lignes concernées affichent la valeur future en surbrillance (ex. `Dégâts 140 % → 175 %`), pour voir le gain avant d'acheter.

### 2. Retour à la greffe
Au moment de l'achat : flash rouge sur la carte, tremblement bref du panneau, son de chair, et la ligne de stat concernée s'anime. La carte greffée reçoit un liseré plus marqué (état « GREFFÉE » actuel trop discret).

### 3. Preuve en jeu
- Bandeau bref en haut de l'écran au retour dans le niveau : nom de la mutation + effet en une ligne.
- HUD : nombre de greffes actives, et la jauge de vie montre la portion « bonus » (PV gagnés par mutation) dans une teinte distincte.
- Chiffres de dégâts (`DamageNumbers`) teintés différemment quand un multiplicateur de mutation est actif, pour que la montée en puissance soit visible coup après coup.

### 4. Marques visuelles sur le héros (optionnel, plus lourd)
Teinte/overlay léger sur le sprite selon la branche dominante (osseuse, nerveuse, sanguine). À faire seulement si tu le veux : ça touche aux assets du personnage.

## Détails techniques

- `src/game/mutations.ts` : ajouter un descripteur d'affichage par effet (label, format %, sens « plus haut = mieux ») pour générer le panneau de stats sans dupliquer la logique.
- `src/components/game/FleshPath.tsx` : colonne stats + prévisualisation au survol via `computeEffects([...unlocked, hoveredId])`.
- `src/components/game/Hud.tsx` : segment de PV bonus et compteur de greffes.
- `src/store/gameStore.ts` : exposer le dernier `unlockMutation` pour le bandeau de confirmation (aucun changement de règles de jeu).
- `src/game/effects/DamageNumbers.ts` + appel dans `GameScene.ts` : teinte selon `damageMult > 1`.

Les points 1 à 3 ne changent aucune valeur d'équilibrage — uniquement la lisibilité.
