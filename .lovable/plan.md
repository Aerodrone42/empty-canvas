## Ce qui a foiré

J'ai assemblé des pièces génériques (une aile dessinée à part, une queue à part) qui n'ont rien à voir avec ton illustration. Résultat : une bête bricolée, ailes qui recouvrent le cavalier, proportions fausses. Ce n'est pas ce que tu as demandé.

## Le principe de la correction

**Ton illustration devient la vérité absolue.** On ne redessine rien, on ne rajoute aucune pièce venue d'ailleurs. La monture à l'écran doit être, au repos, **pixel pour pixel ton image de référence**.

## Méthode

**1. L'illustration devient l'asset source**
Ton image est découpée (script PIL) en calques **le long de ses propres contours**, à leurs coordonnées d'origine :
- corps + cavalier + crâne + chaînes + encensoirs (le bloc central intact)
- aile gauche haute (celle déployée vers le haut-arrière)
- aile droite basse (celle qui balaye sous le ventre)
- queue à épines
- l'humain hurlant déjà présent dans la gueule

Chaque calque garde sa position exacte dans le cadre d'origine. Réassemblés sans aucune rotation, ils reforment ton dessin à l'identique — vérifié par comparaison pixel à pixel avec le fichier source avant d'aller plus loin.

**2. Pivots posés sur les articulations réelles du dessin**
Le point de rotation de chaque aile est placé sur son os d'épaule tel qu'il apparaît dans l'illustration, pas au centre d'un rectangle. Idem pour la queue, sur sa vertèbre de base.

**3. Animation retenue, pas cartoon**
- Battement d'ailes de faible amplitude autour de la pose du dessin (l'aile haute et l'aile basse en opposition, comme sur l'image), lent et pesant — une créature morte et lourde, pas un oiseau.
- Ondulation minime de la queue, décalée du battement.
- Léger tangage vertical du corps synchronisé sur la poussée.
- L'humain dans la gueule se débat par soubresauts brefs, puis les mâchoires se referment : gerbe de sang, il est aspiré vers l'intérieur du crâne et disparaît.

Aucune pose de l'animation ne s'éloigne assez du dessin d'origine pour casser sa silhouette.

**4. Contrôle**
Capture image par image de la traversée, comparée côte à côte avec ta référence : si une pose déforme la bête ou masque le cavalier, l'amplitude est réduite jusqu'à ce que ça tienne.

## Détails techniques

- Découpe par script PIL depuis l'illustration fournie vers `public/assets/sprites/props/` (les anciens `dread_mount_wing.png` / `dread_mount_tail.png` génériques sont supprimés).
- `src/game/effects/DreadMount.ts` : offsets et origines recalculés depuis les coordonnées réelles de découpe, plus amplitudes de battement réduites.
- `src/game/scenes/BootScene.ts` : chargement des nouveaux calques.
- Aucun changement de gameplay, la monture reste purement décorative.
