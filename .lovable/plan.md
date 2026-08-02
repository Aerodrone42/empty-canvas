## Objectif

La salle III (Trône) est trop courte et son décor trop pauvre. On l'allonge et on lui refait un fond gothique varié. L'autel de sauvegarde, hors style ici, est retravaillé ensuite.

## Étape 1 — Décor de fond (validation avant intégration)

Je génère les 3 couches de parallaxe du Trône, format large et panoramique :

- `throne_bg_far.png` — nef immense en profondeur : arcs brisés en enfilade, vitraux éteints, brume rouge sombre.
- `throne_bg_mid.png` — le trône de chair et d'os au centre, gradins de pierre, colonnes torses, chaînes.
- `throne_bg_near.png` — piliers rapprochés, braseros, dallage ébréché, ombres portées.

Palette tenue au style existant : pierre gris-brun chaud, bordeaux, ambre des braises. Pixel-art cohérent avec les autres salles.

**Je t'envoie les images en chat pour validation. Rien n'est intégré tant que tu n'as pas dit oui.** Si ça ne va pas, je régénère.

## Étape 2 — Salle plus longue (après validation)

`src/game/roomConfig.ts`, entrée `throne` :

- `width` : 2000 → 3400
- `arenaLockX` : 980 → 1500 (approche plus longue avant l'arène)
- `altarX` : 620 → 900
- Vagues réparties sur la nouvelle largeur (les 3 vagues gardent leur composition, positions étalées entre 1900 et 3200)
- `hangers` / `hands` repositionnés sur la longueur

Les torches au sol et le parallaxe se calent déjà sur `width`, donc rien d'autre à changer côté scène.

## Étape 3 — Autel dans le style de la salle

L'autel actuel (`blood_altar.png`) jure avec la nef du Trône. Deux options que je te proposerai en images : soit une variante retexturée du même sprite (pierre plus sombre, ferronnerie), soit un sprite dédié « autel du trône ». Je te fais valider avant intégration là aussi.

## Détails techniques

- Les fonds remplacent les fichiers existants dans `public/assets/sprites/backgrounds/`, avec un `?v=` bumpé dans `src/game/assets.ts` pour casser le cache.
- Aucune modification de gameplay : mêmes ennemis, même herse d'arène, mêmes règles de vagues.
