## Problème

La veine actuelle est ratée pour trois raisons :

1. **Elle apparaît deux fois** — `CorridorVein` crée deux bandes (une principale + une secondaire) à deux hauteurs différentes, ce qui donne l'impression d'un double tuyau qui traverse tout l'écran.
2. **Elle est énorme** — 190 px de haut pour la principale, 110 px pour la secondaire, soit une masse de chair qui écrase le décor gothique.
3. **Elle est flashy** — teinte `0xc0242f` à alpha 0.95 en rendu normal : un rouge saturé posé par-dessus un décor presque noir, sans intégration. En plus, la tuile se répète visiblement (coutures verticales tous les ~2 motifs).

## Correctifs

**1. Une seule veine (`src/game/effects/CorridorVein.ts`)**
- Supprimer la bande secondaire : une seule veine court le long du corridor.
- La placer plus haut, à la jonction mur/voûte, pour qu'elle longe l'architecture au lieu de barrer le champ de vision.

**2. Beaucoup plus fine et discrète**
- Hauteur affichée réduite à ~45–55 px (au lieu de 190).
- Alpha autour de 0.55, teinte sombre désaturée (bordeaux presque brun, type `0x5a1218`) pour qu'elle se fonde dans la pierre au lieu de flasher.
- Retour à un léger mode de fusion sombre partiel : la veine doit paraître collée au mur, humide, éclairée uniquement par les lanternes.

**3. Asset régénéré (`public/assets/sprites/props/corridor_vein.png`)**
- Nouvelle génération d'une veine **fine et réaliste** : un vaisseau unique et sinueux, quelques capillaires très courts, texture humide sombre, sur fond transparent.
- Motif long et raccordable gauche/droite pour supprimer les coutures visibles du tuilage actuel.
- Pas de rouge vif : gammes bordeaux/violacé sombre, reflets ponctuels seulement.

**4. Battement plus subtil**
- Amplitude de pulsation réduite (gonflement ~4 % au lieu de 22 %), cycle plus lent, pour un frémissement à peine perceptible plutôt qu'une respiration spectaculaire.

## Résultat attendu

Un unique vaisseau fin, sombre et humide qui serpente en haut du mur du corridor, presque intégré à la pierre, battant lentement — plus de double bande, plus de rouge criard, plus de couture répétée.
