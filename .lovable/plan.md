## Problème constaté

Le spritesheet de la suppliciée est animé par le script `scripts/animate_crucified_woman.py`, qui découpe deux zones dans la frame et les déplace :

- Le masque « tête » est un polygone rectangulaire large (x 90→193, y 116→232). Il mord sur les épaules et le haut des bras. Quand ce bloc tourne de ±4.5°, les bras se retrouvent tranchés net à la limite du polygone : c'est la coupure visible sur la capture.
- Le masque « torse » est redimensionné en **largeur de frame entière** (`resize((FRAME_W * breath, FRAME_H))`), ce qui décale latéralement tout ce qui est dans le masque et aggrave les ruptures.
- L'amplitude (±4.5° / 2 px) est trop faible et purement mécanique : aucune impression de souffrance, contrairement à l'écorché masculin dont la spritesheet d'origine contient de vraies frames dessinées (tête qui roule, torse qui se cambre).

Autre point : le script relit la frame 0 de la spritesheet **déjà animée** comme source. Chaque exécution empile donc les déformations précédentes.

## Ce que je vais faire

1. **Repartir d'une frame source propre**
   Extraire la frame 0 actuelle, geler une copie de référence dans `scripts/` (`crucifiee_femme_base.png`) pour que les régénérations futures ne cumulent plus les déformations.

2. **Nouveau découpage anatomique par masques doux**
   Remplacer les polygones grossiers par trois masques déduits de la silhouette réelle (détection alpha + bornes anatomiques), avec bords adoucis :
   - `tête + chevelure` : s'arrête au-dessus des clavicules, ne touche jamais les bras ni les cordes.
   - `torse + robe` : uniquement la colonne centrale, jamais les bras.
   - `bras / croix / cordes` : **jamais déplacés**, ils restent la couche fixe de fond.
   Les trous laissés par le déplacement de la tête et du torse sont rebouchés par une passe d'inpainting des pixels voisins (comme la correction du halo), donc plus aucune coupure ni bord blanc.

3. **Mouvement de souffrance, pas de balancement mécanique**
   Animation de la tête en 12 frames au lieu de 8, combinant :
   - rotation autour de la base du cou avec une courbe non sinusoïdale (tombe lentement, se redresse par saccade → spasme),
   - léger déplacement vertical + horizontal de la tête (la nuque cède puis se tend),
   - respiration du torse : mise à l'échelle **verticale uniquement**, ancrée sur le bassin, désynchronisée de la tête pour un rendu organique,
   - micro-tremblement d'un pixel sur les frames de tension.

4. **Mise à jour du chargement**
   `src/game/assets.ts` : `frameCount: 12`, `frameRate: 7`, cache-buster `?v=4`. Aucun changement de dimensions (284x697), donc rien à toucher dans `CrucifiedProp.ts` — la croix reste parfaitement fixe (aucun tween global sur la femme).

5. **Vérification**
   Contrôle programmatique frame par frame : aucune coupure d'alpha dans la zone des bras (différence des masques bras entre frames = 0), aucun pixel clair en frange, puis capture Playwright en jeu pour valider le rendu.

## Détails techniques

- Script : `scripts/animate_crucified_woman.py` réécrit (PIL + numpy + scipy déjà disponibles).
- Fichier régénéré : `public/assets/sprites/props/crucifiee_femme_spritesheet.png` (284 x 697 x 12 frames = 3408 px de large).
- Aucune modification de logique de jeu, de scène ou de gameplay.
