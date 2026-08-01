import type { BackdropKey } from "@/game/assets";

/** enchainement des salles : la colonne mene a la suivante */
export const ROOM_ORDER: BackdropKey[] = ["cathedrale", "corridor", "throne", "exterieur"];

/** noms lisibles affiches dans le menu de selection de salle */
export const ROOM_LABELS: Record<BackdropKey, string> = {
  cathedrale: "I — La Nef Suppurante",
  corridor: "II — Le Corridor de Chair",
  throne: "III — Le Trône",
  exterieur: "IV — L'Extérieur",
};
