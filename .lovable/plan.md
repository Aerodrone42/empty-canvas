## Constat

La planche que je t'ai montrée est la planche **d'attaque** déjà présente dans le jeu — c'est elle qui contient les défauts que tu entoures : frame 3 avec une lame qui se dédouble, frame 4 avec l'épée qui change de main. Le sprite de parade, lui, n'existe toujours pas : la « garde » actuelle n'est qu'une frame d'idle rétrécie et teintée. Il faut donc produire une vraie planche de parade **propre**, et la valider image par image avant de la brancher.

## Plan

1. **Frame de référence propre**
   - Extraire la frame d'idle la plus nette (héros de profil vers la droite, épée tenue dans la main avant, une seule lame) et s'en servir comme base d'édition : la silhouette, la palette et la position de l'épée sont ainsi héritées, pas réinventées.

2. **Générer la parade frame par frame (pas en planche d'un coup)**
   - 3 poses seulement, générées et vérifiées **une par une** à partir de la même référence :
     1. *amorce* — le poids passe sur la jambe arrière, la lame commence à se relever devant le corps,
     2. *garde tenue* — lame dressée en diagonale devant le torse, épaule avancée, genoux fléchis (frame bouclée pendant le maintien),
     3. *impact de parade* — la lame chasse le coup vers l'avant, le buste se redresse.
   - **Contrôle qualité obligatoire sur chaque frame** avant de continuer : une seule lame, épée dans la **même main** que l'idle, capuche orientée dans le même sens, taille de silhouette identique (110 px). Toute frame qui échoue est régénérée, pas conservée.

3. **Assemblage et intégration**
   - Recomposition des 3 frames validées en une planche `vigile_muet_guard_spritesheet.png` au gabarit exact des autres (192x144, pieds à y=138), avec recentrage automatique sur la baseline pour éviter tout saut de position.
   - Passage dans `scripts/defringe_hero.py` (suppression du liseré blanc).
   - `assets.ts` + `BootScene.ts` : chargement et animations `vigile-guard-enter` (1→2), `vigile-guard-hold` (2 en boucle), `vigile-guard-parry` (3, une passe).

4. **Suppression du bricolage**
   - `Player.ts` : `holdGuardPose()` ne fait plus ni `setScale` ni `setTint` — il joue les vraies animations. `releaseGuard()` revient à l'idle. `onGuardBlocked()` déclenche `vigile-guard-parry`.
   - Étincelles / mention « PARADE » toujours réservées à la parade parfaite.

5. **Vérification en jeu**
   - Capture de l'écran avec la garde tenue pour confirmer : pas de rétrécissement, pas de teinte, posture lisible, une seule épée dans la bonne main.

## Note

Si après régénérations la pose de garde reste incohérente avec le reste du héros, je te le dis franchement plutôt que de livrer une frame bâclée — on choisira alors une pose de garde dérivée directement de la première frame d'attaque (art d'origine, zéro artefact) retravaillée en pixel.
