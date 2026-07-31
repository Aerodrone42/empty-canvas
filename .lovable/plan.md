## Correction du chevalet

### 1. Nouveau supplicié (référence comprise)
- Homme **allongé de profil**, à l'horizontale sur le plateau, vu de côté comme sur l'image de référence (celle-ci sert uniquement de guide de posture, elle n'est pas recopiée).
- **Torse nu, simple short**, pieds nus ou sanglés.
- **Bras tendus vers l'arrière**, au-dessus de la tête, poignets pris dans les fers reliés aux chaînes du treuil ; chevilles sanglées à l'autre extrémité.
- Style pixel art cohérent avec les autres sprites du jeu, palette chair sale / bordeaux.

### 2. Échelle et placement
- Taille humaine crédible : environ **1,7–1,8 m par rapport au héros**, plus jamais un corps de 2,50 m.
- Corps **centré sur le plateau**, dans l'axe des chaînes — ni décalé sur le côté, ni posé au-dessus du bâti.
- Chevalet remonté sur la **ligne mur/sol** du corridor, derrière le plan de jeu, comme demandé au départ.

### 3. Spritesheet propre en 6 frames
Le fichier actuel déborde entre les cellules (deux corps visibles dans une même frame). Régénération avec une seule pose centrée par cellule :

```text
f0 attaché   f1 tension   f2 étirement   f3 craquement   f4 déchirure   f5 corps rompu
```

Les bras reculent progressivement, le torse s'allonge, le sang apparaît aux épaules et aux hanches.

### 4. Bourreaux : skin conservé, mouvements corrigés
- Apparence inchangée (elle convient).
- Régénération des seules feuilles **marche et repos en vue de profil** : les feuilles actuelles sont dessinées de face, ce qui est incohérent pour un déplacement latéral 2D.
- Poses de manivelle aux deux roues pendant le supplice ; après la rupture ils lâchent, se tournent vers le héros et avancent de profil.

### 5. Vérification
Contrôle visuel dans le corridor : machine au mur, corps à l'échelle et centré, aucune superposition de sprites, bourreaux qui marchent de profil.