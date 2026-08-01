## Problème constaté

Sur la planche d'esquive (`strip_dodge.png`), les deux dernières frames montrent **deux sabres** : celui tenu en main plus une seconde lame apparue lors de la génération. Le Vigile ne doit en avoir qu'un.

## Correction

1. Régénérer `strip_dodge.png` par édition de la planche existante, en verrouillant explicitement « une seule arme dans le sprite, un unique sabre courbe tenu dans la main droite, aucune lame supplémentaire, pas de fourreau visible ». Le reste (poses, palette, silhouette, greffe dorsale) est conservé à l'identique.
2. Contrôle automatique de la nouvelle planche : comptage des composantes métalliques claires (lame) par frame pour vérifier qu'il n'y en a qu'une, plus la vérification de palette déjà en place (gris `#4b4843`, bordeaux `#421f1d`, chair `#896457`, or `#7d6643`).
3. Passage du même contrôle « une seule lame » sur les 4 autres planches (saut, parade, dégâts, mort) pour attraper le même défaut ailleurs, et régénération ciblée si une frame est en faute.
4. Nouvelle version en `strip_dodge_v2.png` (les fichiers validés ne sont pas écrasés), présentée pour validation avant découpage.

## Suite (inchangée, après validation)

Découpage des 7 planches en spritesheets 256×192 dans `public/assets/sprites/hero/`, puis mise à jour de `src/game/assets.ts` et `src/game/entities/Player.ts` (gabarit, échelle, clés d'animation).
