## Ce qui a raté

Les planches ont été générées **au texte seul**, sans donner vos images en entrée : le modèle a réinventé le personnage. D'où la capuche rouge (elle doit être gris-ardoise/noir), la cape passée du bordeaux au rouge vif, la greffe de chair mal placée, et une incohérence de teinte d'une planche à l'autre.

## Nouvelle méthode : partir de vos images, pas d'un prompt

1. **Fixer une frame de référence unique.** Vos 4 planches (+ la vue de dos) sont passées en **entrée d'édition d'image**, pas en description. On en tire une seule pose de référence propre — le Vigile de profil, debout — qui devient la « source de vérité » du personnage.
2. **Verrouiller la palette sur cette frame.** La palette est *extraite* des pixels de vos planches (capuche et robe gris-ardoise/noir, cape bordeaux sombre, or terne, chair rose grisé), pas écrite à la main. Toutes les frames suivantes sont ensuite quantifiées sur cette palette exacte : impossible qu'une planche dérive en couleur.
3. **Dériver chaque frame par édition de la référence**, une frame à la fois, en ne demandant que le changement de pose (« même personnage, mêmes couleurs, jambe avant levée »). Le costume, le masque, la greffe et le sabre restent ceux de vos images.
4. **Contrôle avant intégration.** Je vous montre les planches assemblées **avant** de toucher au code du jeu. Si le personnage ou les couleurs dérivent, on refait cette étape — aucune modification de `src/game` tant que vous n'avez pas validé.

## Contenu produit

- **Profil** : idle (4), marche (5), attaque (5), esquive (8), saut (6).
- **Dos** : idle (4), marche (5), d'après votre planche dorsale (capuche relevée, grappe de chair tentaculaire sur l'omoplate, cape en lambeaux jusqu'aux bottes, sabre et chaînes dorées à gauche).

Aucun texte ni étiquette dans les planches, fond transparent, silhouette recalée frame par frame sur la même ligne de pieds.

## Détails techniques (après votre validation seulement)

- Sortie dans `public/assets/sprites/vigile_muet_*_spritesheet.png` + `vigile_muet_back_idle/walk_spritesheet.png`.
- Cellule **256×192**, silhouette 150 px, pieds à y = 184 ; `src/game/assets.ts` mis à jour (`HERO_FRAME_W/H`, `HERO_CHAR_H`, `HERO_BASELINE_Y`) plus 2 clés `vigile-back-idle` / `vigile-back-walk`.
- `vigile_muet_atlas.json` réaligné ; `Player.ts` garde `TARGET_H = 130` (taille en jeu inchangée), hitbox et portée revérifiées.
- Zéro changement de gameplay.
