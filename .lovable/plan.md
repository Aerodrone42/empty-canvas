## Nouveaux assets détectés dans le dépôt

Le dossier `public/assets/sprites/enemies/` est apparu, avec un README d'intégration Phaser très précis :

**Pénitent-Greffé** — lourd, lent, résistant, masse-chaîne fusionnée au bras
- idle : 4 frames, cellule 102×128 (+4 px de marge → 106×128)
- marche : 6 frames, cellule 126×128 (→ 130×128)
- attaque : 5 frames, cellule 172×128 (→ 176×128)

**Suppliant Rampant** — rapide, faible, quadrupède, morsure au sol
- idle : 4 frames, cellule 240×128 (→ 244×128)
- déplacement : 4 frames, cellule 275×128 (→ 279×128)
- attaque : 4 frames, cellule 322×128 (→ 326×128)

Plus le héros déjà présent : **Vigile Muet** (idle 4f 57×128, walk 6f 47×128, attack 5f 43×128).

Toutes les feuilles ont un fond transparent, une hauteur normalisée à 128 px et une palette limitée à ~32 couleurs. Le README impose `pixelArt: true` dans la config Phaser.

Aucun code de jeu n'existe encore : `src/routes/index.tsx` est toujours la page placeholder.

## Ce que je vais construire

### 1. Dépendances
`phaser` (moteur 2D) et `zustand` (état partagé entre React et Phaser).

### 2. Écrans React
- **Avertissement 18+** : fond noir, texte sobre, « Entrer » / « Quitter », mémorisé pour ne pas réapparaître.
- **Menu principal** : titre SANGUINE VIGILE, Nouvelle partie / Continuer / Options.
- **Menu pause** (Échap) : reprendre, options, retour au menu.
- **HUD** : barre de vie et jauge de Chair.

### 3. Direction artistique
Tokens dédiés au gothique sanglant : noirs profonds, crimson sang désaturé, os/ivoire, ocre rouillé — exactement la palette des sprites. Typographie à empattements condamnés. Aucune couleur en dur dans les composants.

### 4. Moteur Phaser
- Composant React qui monte et démonte proprement le canvas, monté uniquement côté client.
- Configuration avec `pixelArt: true` et physique Arcade.
- **BootScene** : chargement des 9 spritesheets (héros + 2 ennemis) avec les dimensions de cellule exactes du README, et création de toutes les animations aux cadences recommandées (Pénitent lent, Suppliant véloce).

### 5. Salle de départ jouable
- Sol et plateformes en géométrie simple.
- **Héros** : gauche/droite, saut, attaque, avec transitions d'animation correctes.
- **Ennemis** : les deux types posés dans la salle avec une IA de base — patrouille, détection du joueur, poursuite, attaque au contact. Le Pénitent encaisse et frappe lourd ; le Suppliant fonce vite et mord.
- Combat : la frappe du héros inflige des dégâts, les ennemis meurent, le contact ennemi blesse le héros avec invulnérabilité brève.
- Caméra qui suit le héros.

### 6. Page d'accueil
`src/routes/index.tsx` devient l'enchaînement Avertissement → Menu → Jeu, avec des métadonnées propres au projet.

## Détails techniques

```text
src/
  game/
    config.ts                 config Phaser (pixelArt, Arcade)
    assets.ts                 tables de cellules/frames issues du README
    scenes/BootScene.ts       chargement + création des animations
    scenes/GameScene.ts       salle 1, physique, caméra, spawns
    entities/Player.ts        contrôles, états d'animation, hitbox d'attaque
    entities/Enemy.ts         base commune : vie, dégâts, mort
    entities/PenitentGreffe.ts
    entities/SuppliantRampant.ts
  components/game/
    PhaserCanvas.tsx  AgeGate.tsx  MainMenu.tsx  PauseMenu.tsx  Hud.tsx
  store/gameStore.ts          zustand : vie, chair, état de partie
```

Phaser est strictement client : le canvas est monté après hydratation pour éviter tout accès au DOM côté serveur. Les chemins d'assets pointent vers `/assets/sprites/...` déjà servis par `public/`.

## Hors périmètre pour cette phase

Les salles supplémentaires, la Voie de la Chair complète, le boss Chirurgien-Saint et la sauvegarde persistante viennent ensuite. L'objectif ici : un jeu qui démarre, un héros qui court, saute et frappe, et deux ennemis vivants qui se comportent différemment.
