## Pourquoi l'humain est flou

Le flou vient de la génération des frames, pas du rendu Phaser :

1. **Le champ de déformation déborde sur la gueule.** Le masque d'influence de l'aile basse (pivot 404,316) couvre partiellement la zone mâchoire/proie. Chaque pixel y est ré-échantillonné par `map_coordinates` en interpolation bilinéaire/spline, ce qui lisse les contours du bras et du torse du supplicié.
2. **Double ré-échantillonnage.** L'illustration est warpée en pleine résolution puis réduite à 50 % (696x544), et enfin ré-agrandie en jeu (`MOUNT_W / FRAME_W`). Trois passes de filtrage = perte de détail concentrée sur le plus petit élément de l'image, l'humain.
3. **La séquence `swallow` ajoute un warp d'aspiration** centré exactement sur la proie, ce qui l'étire et la floute davantage.

## Correction proposée

- **Exclure la proie du champ de déformation** : ajouter une zone de protection (masque à zéro) autour de la gueule et du corps de l'humain dans le script de génération, avec un fondu doux sur ses bords pour éviter toute couture visible.
- **Recomposer la proie nette par-dessus** : après le warp de chaque frame, recoller la région « gueule + humain » découpée à la résolution source, non filtrée. Elle suit le léger mouvement de tête via une simple translation entière (pas d'interpolation), donc zéro flou.
- **Supprimer la passe de downscale intermédiaire** sur cette région : la proie est collée depuis l'original après réduction, à la résolution finale.
- **Séquence d'avalement** : remplacer l'étirement par un mouvement de translation/occultation — l'humain glisse dans la gueule et est progressivement recouvert par les mâchoires, au lieu d'être étiré et lissé.
- Aucun changement de silhouette, de taille, ni du principe « une image complète par frame ».

## Vérification

Comparaison pixel de la zone proie entre l'illustration source et chaque frame générée, pour confirmer qu'elle est nette, puis contrôle visuel des 8 frames de vol, du `fly-fed` et des 5 frames d'avalement.