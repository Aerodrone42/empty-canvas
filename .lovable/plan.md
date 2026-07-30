## Ce qui s'est passé

Le magnifique sol en pierre existe toujours : il est peint dans l'image du décor (`corridor_bg_far.png`, 1672×941). Vérifié : le dallage occupe environ les **30 % du bas** de la peinture.

Le bug vient de ma découpe dans `src/game/effects/Parallax.ts` : la constante `FLOOR_SPLIT = 0.85` ne coupe que le tout dernier bandeau sombre sous le dallage. Résultat : le vrai sol en pierre est resté collé au calque « ciel », et la bande rouge plate (le simple bord sombre de l'image) a été étirée puis répétée sur toute la largeur de la salle → l'aplat marronnasse que tu vois.

## Correction

1. Supprimer complètement la découpe `sky` / `ground` dans `Parallax.ts` : plus de `FLOOR_SPLIT`, plus de RenderTexture de sol cuite, plus de `seam`.
2. Réafficher **la peinture entière** (ciel + colonnes + dallage en perspective), exactement comme sur ta capture de référence — un seul calque, l'image intégrale, à sa bonne échelle, alignée sur la ligne de sol.
3. Ce calque est répété horizontalement sur la largeur de la salle et ancré au monde (`scrollFactor 1`), donc le dallage défile à la vitesse de tes pas — on garde à la fois le style d'origine et la lisibilité de la marche.
4. Aucune géométrie dessinée en code par dessus le sol : plus de joints, plus de taches, plus de rectangles.

## Détail technique

Fichier touché : `src/game/effects/Parallax.ts` uniquement.
- retrait des frames `sky` / `ground` ajoutées à la texture, du `TileSprite` de ciel et de la RenderTexture de dallage ;
- un seul `TileSprite` plein cadre, `scrollFactor 1`, `tileScale` calculé pour que la ligne de sol de la peinture tombe pile sur `floorY` ;
- `update()` n'a plus rien à piloter (le décor est fixe dans le monde) ;
- `addAmbience()` (voile de teinte + poussières) est conservé tel quel.

Si tu préfères l'ancien comportement où le décor lointain glisse doucement plutôt que de rester fixe, c'est un seul paramètre à changer ensuite.
