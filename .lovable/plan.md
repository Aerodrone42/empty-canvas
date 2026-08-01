## Objectif

Rendre les impacts justes et lisibles : zones de frappe précises, valeurs de dégâts cohérentes, coups critiques (5%) et chiffres de dégâts flottants.

## 1. Hitbox de frappe (le vrai problème actuel)

Aujourd'hui un coup teste `|enemy.x - origine| < reach` avec l'origine décalée de `reach/2` : la zone déborde autant derrière le héros que devant, et l'ennemi est traité comme un simple point. Résultat : on touche dans le dos, et on rate des ennemis dont le corps est à portée mais dont le centre ne l'est pas.

Correction :
- Construire pour chaque attaque un **rectangle de frappe** (devant le héros uniquement pour `arc`/`slam`, centré pour `radial`), depuis la hanche du joueur jusqu'à `reach`.
- Tester ce rectangle contre le **corps physique réel de l'ennemi** (largeur/hauteur du body), plus contre un point.
- `slam` (attaque plongeante) : zone plus large horizontalement et collée au sol.
- Même traitement pour la Monture d'Effroi, avec son propre rectangle au lieu du bricolage `reach + 90`.

## 2. Hurtbox des monstres

Ajustement des boîtes de collision pour coller aux silhouettes :
- Pénitent-Greffé : corps massif, hitbox légèrement élargie.
- Suppliant Rampant : hitbox basse et allongée (créature à quatre pattes) — actuellement trop haute, on le frappe dans le vide.
- Écorché-Pendu : hitbox valide aussi en phase suspendue (aujourd'hui touchable au plafond de façon incohérente).
- Bourreau : hitbox alignée sur son échelle 1.7.

Ajout d'une **zone faible haute** (tête/torse) par monstre, utilisée par les critiques.

## 3. Dégâts et critiques

- Table des coups (`combat.ts`) revue pour un rythme équilibré : combo léger rapide et faible, finisher et coup lourd nettement récompensés, plongeon intermédiaire, spécial dévastateur.
- PV des monstres ajustés pour que chaque type meure en un nombre de coups lisible (rampant : 2-3 coups légers ; pénitent : combo complet + finisher ; bourreau : plus long).
- **Critique : 5 % de base**, dégâts x2 (valeur centralisée dans `combat.ts`, prête à être branchée sur les talents plus tard).
- Un critique déclenche : gerbe de sang renforcée, secousse caméra plus marquée, recul augmenté.
- Les dégâts subis par le héros sont resserrés pour rester cohérents avec ses 100 PV.

## 4. Chiffres de dégâts flottants

Nouveau petit module d'affichage :
- Chiffre qui monte et s'estompe au point d'impact.
- Coup normal : rouge sombre, taille standard.
- **Critique** : plus gros, doré, léger sursaut d'échelle, mention visuelle distincte.
- Coup encaissé par la garde du Pénitent : chiffre grisé et réduit (lisibilité du blocage).
- Rendu en pixel-art cohérent avec le HUD, sans dépendance externe.

## Détails techniques

- `src/game/combat.ts` : ajout de `CRIT_CHANCE = 0.05`, `CRIT_MULT`, et d'une géométrie de frappe par `Strike` (offset, largeur, hauteur).
- `src/game/scenes/GameScene.ts` : `resolvePlayerStrike` réécrit en test rectangle/corps ; tirage du critique par ennemi touché.
- `src/game/entities/Enemy.ts` : `takeHit` accepte un indicateur `crit`, ajuste FX et recul ; stats et `bodyWidth`/`bodyHeight` révisés par espèce.
- `src/game/effects/DamageNumbers.ts` (nouveau) : pool de textes Phaser, émis via un événement de scène.
- `src/game/effects/DreadMount.ts` : hitbox rectangulaire propre + support du critique et des chiffres.

Aucun changement de sprites ni de niveau.
