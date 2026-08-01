## Tu as raison

Découper en petites pièces, c'est exactement ce qui produit les ailes en trop et les bords coupés. On arrête ça net : **une seule image, un seul sprite**.

## Le principe

Ta monture reste **ton illustration entière, jamais découpée, jamais recadrée**. On en fabrique une **feuille de sprite** : chaque frame est le **cadre complet 1200x896**, avec une marge tout autour. Comme le cadre ne change jamais et qu'aucun pixel ne sort de la marge, **rien ne peut être rogné** — c'est ce qui cassait avant, quand chaque pièce avait son propre petit cadre serré.

Le sprite affiché en jeu, c'est une seule image par frame : plus de container, plus d'assemblage de morceaux, plus de superposition possible. Trois ailes deviennent physiquement impossibles.

## Comment les ailes bougent alors

À l'intérieur du cadre complet, le battement est produit par **déformation de l'image d'origine** (script PIL) : les zones d'ailes sont fléchies autour de l'épaule par transformation progressive, le reste du dessin — squelette, cavalier, chaînes, encensoirs, l'humain dans la gueule — reste **strictement intact**. C'est le même dessin, plié, pas un dessin recomposé.

- 8 frames de cycle de vol, battement lent et pesant.
- Les deux ailes bougent, en opposition comme sur ton image.
- La queue ondule très légèrement sur le même cycle.

## L'humain dans la gueule

Il fait partie de l'image, donc il est **toujours là**. Une seconde séquence courte (5 frames) rejoue, sur ce même cadre complet : il se débat, les mâchoires se referment, gerbe de sang, il disparaît vers l'intérieur du crâne. Après l'avalement le vol reprend sur un cycle « repue ». À chaque nouveau passage de la bête, il est de retour.

## Contrôle avant livraison

- Frame 0 comparée pixel à pixel à ton illustration : doit être identique.
- Chaque frame vérifiée pour qu'aucun pixel opaque ne touche le bord du cadre (preuve qu'aucune aile n'est coupée).
- Capture en jeu de la traversée pour valider la silhouette.

## Détails techniques

- Script PIL : génère `dread_mount_fly.png` (8 frames) et `dread_mount_swallow.png` (5 frames), cadre uniforme avec marge, depuis ton illustration source uniquement.
- Suppression des calques `dread_body/wing_top/wing_bot/tail/victim.png`.
- `src/game/effects/DreadMount.ts` : réécrit en **un seul `Phaser.GameObjects.Sprite`** jouant `fly` puis `swallow` puis `fly-fed` — le container et les pivots disparaissent.
- `src/game/scenes/BootScene.ts` : chargement des deux feuilles et création des trois animations.
- Aucun impact gameplay, la monture reste décorative.
