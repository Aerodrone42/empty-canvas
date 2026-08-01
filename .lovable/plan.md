## Problème

À la mort, la monture part en fondu (`alpha: 0`) puis est masquée : elle disparaît en plein vol au lieu de s'écraser. Confirmé dans `src/game/effects/DreadMount.ts` (`die()` tween `alpha: 0` + `setVisible(false)`).

## Ce qu'on veut

La bête est abattue → elle chute, s'écrase au sol dans un éclat de sang, et **reste visible en cadavre** pour le reste de la salle.

## Plan

1. **Créer une pose de cadavre**
   - Nouvel asset `dread_mount_corpse.png` (frame unique, même gabarit 512x360) : squelette effondré sur le flanc, ailes brisées repliées, cou et mâchoire retombés au sol, flaque de sang sous la carcasse.
   - Généré à partir de l'illustration source déjà validée (deux ailes, pas d'humain), sans redimensionnement fractionnaire.

2. **Réécrire la séquence de mort dans `DreadMount.ts`**
   - Phase 1 (~600 ms) : animation `death`, chute en piqué vers le sol, rotation vers l'avant, aucune perte d'opacité.
   - Impact : secousse caméra forte, gerbe de sang, tache de sang persistante au sol via le système `Blood`, poussière.
   - Phase 2 : bascule sur la texture `dread-mount-corpse`, posée au sol (ancrage bas sur `floorY`), légère inclinaison, petit rebond d'impact.
   - Le cadavre reste affiché indéfiniment (état `dead` au lieu de `gone`) : plus de `setVisible(false)`, plus de fondu.

3. **Ambiance post-mortem**
   - Gouttes de sang lentes depuis la carcasse pendant quelques secondes.
   - Jauge de boss qui se vide puis s'efface en fondu après l'impact.

4. **Ne rien casser côté progression**
   - `isDefeated` passe à vrai dès l'impact, donc la colonne de sortie s'ouvre normalement.
   - Le cadavre est purement décoratif : pas de collision, pas de dégâts, profondeur derrière le héros pour qu'il puisse passer devant.

5. **Vérification**
   - Test en jeu : tuer la monture, contrôler par capture que la carcasse est bien au sol, visible, et que la sortie s'ouvre.

## Détails techniques

- Fichiers touchés : `src/game/effects/DreadMount.ts` (séquence `die()`, nouvel état `dead`, gestion jauge), `src/game/scenes/BootScene.ts` (chargement de `dread_mount_corpse.png?v=1`), nouvel asset dans `public/assets/sprites/props/`.
- L'état `gone` est conservé uniquement pour la logique interne (plus d'attaques, plus de vulnérabilité) ; le rendu reste actif.
