## Pourquoi ce n'est pas plein écran aujourd'hui

Deux causes vérifiées dans le code :

1. `src/routes/index.tsx` enferme le jeu dans `<div className="relative aspect-video w-full max-w-[1280px]">`. Le canvas ne peut donc jamais dépasser 1280 px de large et garde un ratio 16:9 centré → bandes noires en haut/bas et sur les côtés, exactement ce qu'on voit sur ta capture.
2. `src/game/config.ts` utilise `width: 960, height: 540` avec `Phaser.Scale.FIT`, et aucun appel à l'API Fullscreen du navigateur n'existe dans le projet (aucune occurrence de `fullscreen`).

## Ce que je vais faire

### 1. Le jeu occupe 100 % de la fenêtre
- Retirer `max-w-[1280px]` et `aspect-video` dans `src/routes/index.tsx` : le conteneur du jeu passe en `fixed inset-0` (largeur et hauteur totales de la fenêtre), le HUD et les menus restant superposés par-dessus.
- Le canvas Phaser suit alors la taille réelle de la fenêtre.

### 2. Mise à l'échelle propre
- Dans `src/game/config.ts`, garder la résolution logique 960x540 mais passer le scale en mode qui remplit l'écran sans bandes : `Phaser.Scale.ENVELOP` (le décor déborde légèrement au lieu de laisser du noir), avec `autoCenter` conservé.
- Écouter le redimensionnement de la fenêtre pour rafraîchir l'échelle (`scale.refresh()` sur `resize`).

### 3. Vrai plein écran (sortie de l'iframe de prévisualisation)
- Ajouter une bascule plein écran via l'API navigateur : touche **F** (et **F11** interceptée quand c'est possible), plus une entrée « Plein écran » dans le menu Pause et le menu principal.
- Implémentée avec `game.scale.startFullscreen() / stopFullscreen()`, déclenchée par un geste utilisateur (obligatoire pour les navigateurs).
- L'attribut `allowfullscreen` est déjà accordé aux prévisualisations Lovable ; si le navigateur le refuse dans l'aperçu intégré, le jeu reste en « plein cadre » et le vrai plein écran fonctionnera sur l'onglet ouvert séparément / le site publié.

### 4. Vérification
- Contrôle visuel via un script de navigation automatisé : capture d'écran à 1920x1080 et à 1280x720 pour confirmer l'absence de bandes noires et la lisibilité du HUD.

## Détails techniques
- Fichiers touchés : `src/routes/index.tsx`, `src/game/config.ts`, `src/components/game/PhaserCanvas.tsx`, `src/components/game/PauseMenu.tsx`, `src/components/game/MainMenu.tsx`.
- Aucune logique de gameplay, de combat ou de décor n'est modifiée : uniquement l'affichage et la mise à l'échelle.
