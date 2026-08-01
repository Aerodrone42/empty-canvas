## Objectif

Refaire entièrement le Vigile Muet à partir des planches fournies : capuche à masque de fer gravé, cape rouge sang lacérée, robe/bandes grises déchirées, croix et ornements dorés, greffe de chair bulbeuse, bottes ornées, long sabre cérémoniel courbe taché de sang. Style du jeu conservé à l'identique (pixel-art sombre, même palette, même lisibilité en jeu).

## Vues produites

Le jeu montrera plus tard le héros **de dos** (autels, portes, cinématiques, montée d'escaliers). On produit donc deux jeux de planches cohérents entre eux :

- **Vue de profil** (jeu principal) — idle, marche, attaque, esquive, saut.
- **Vue de dos** (nouvelle) — idle et marche, d'après la planche dorsale : capuche relevée, grappe de chair tentaculaire remontant sur l'omoplate, cape en lambeaux tombant jusqu'aux bottes, sabre pendu à gauche avec chaînes et pendeloque dorée.

Les deux vues partagent silhouette, hauteur, palette et rythme d'animation, pour qu'un passage profil → dos ne fasse pas « changer de personnage ».

## Référence par animation

- **Idle profil** — fiche de face (planche 4) : pose droite, sabre au côté, cape retombante, léger flottement du tissu + pulsation de la greffe.
- **Marche profil** — planche 1 : cape rouge déployée derrière, sabre traînant bas, cycle de 5 poses.
- **Attaque** — planche 2 : sabre levé haut puis fauchée descendante, cape emportée.
- **Esquive** — plongée puis roulade, cape écrasée vers l'arrière (8 frames).
- **Saut** — appel, montée, apex, chute, réception (6 frames).
- **Idle dos** — 4 frames : respiration, tentacules de chair qui ondulent, chaînes du fourreau qui balancent.
- **Marche dos** — 5 frames : cape qui s'ouvre en alternance, sabre qui oscille.

Palette verrouillée : bordeaux `#7a1c22` / `#4a1014`, gris ardoise `#3a3a40`, os `#cfc4ae`, or `#c9a24c`, chair `#a4544f`.

## Grille agrandie

Cellule **256×192** (au lieu de 192×144) — le sabre long et la cape débordaient. Silhouette dessinée sur **150 px**, ligne de pieds à **y = 184**. Même gabarit pour les planches de dos.

## Détails techniques

- Génération des planches (image gen + découpe/normalisation Python), sortie `public/assets/sprites/vigile_muet_*_spritesheet.png` plus `vigile_muet_back_idle_spritesheet.png` et `vigile_muet_back_walk_spritesheet.png` ; alpha nettoyé, silhouette recalée sur la baseline frame par frame.
- `src/game/assets.ts` : `HERO_FRAME_W/H` → 256/192, `HERO_CHAR_H` → 150, `HERO_BASELINE_Y` → 184 ; mise à jour des 5 entrées existantes + 2 nouvelles clés `vigile-back-idle` / `vigile-back-walk`.
- `public/assets/sprites/vigile_muet_atlas.json` mis à jour aux mêmes dimensions, vues de dos incluses.
- `src/game/entities/Player.ts` : `TARGET_H` reste 130 (taille en jeu inchangée), `SCALE` se recalcule seul ; vérification hitbox (`body.setSize`/`setOffset`) et portée de frappe. Les animations de dos sont chargées et jouables mais aucun changement de gameplay n'est introduit maintenant — elles seront déclenchées par les scènes futures.
- Aucun changement de vitesses, dégâts, combos, chair ou mutations.

## Vérification

Capture automatisée en salle 1 : taille apparente identique, pieds au sol sur toutes les animations, aucune frange transparente sur la cape ; contrôle visuel séparé des deux planches de dos.
