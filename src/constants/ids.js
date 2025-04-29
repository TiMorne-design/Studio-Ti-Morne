/**
 * Constantes pour les IDs des éléments Spline
 * Ce fichier centralise tous les IDs utilisés dans l'application
 */

// IDs des boutons et éléments interactifs
export const BUTTON_IDS = {
  // Boutons principaux
  DATAVIZ: "10ed65d9-e937-4e2a-b159-496a1f8c6750",
  MODEL3D: "3bb0fe33-5c80-49ee-b77b-6161b8379d53",
  SITE: "2fdc1f0a-fe55-4d37-88ad-c9992bcbad3b",
  PRESTATIONS: "7677450d-2939-40a9-a882-d790b6fe5562",
  ABOUT: "03abadbe-ea22-44a1-b65f-0aa429eff890",
  PORTFOLIO: "2b7087f7-63f4-4354-9671-390854505976",
  EOL: "cdd8f469-3a2c-41fe-9cf5-5319e073df17",
  SARGASSES: "199615bb-56cc-466e-84e9-9077ef533ee1",
  TIMORNE: "aebe6c17-73c8-4dce-9f36-c1e92d15e4b1",
  MAIL: "d366dc0d-a8c9-4b09-a66b-5f978338d2dc",
  
  // IDs des tiroirs de prestation
  PRESTA_DV: "79d3df6f-9c9f-4595-a01b-722a0f42d4b7",
  PRESTA_SE: "1061b28e-69a5-4acc-a35f-ffb0bd617ba2",
  PRESTA_M3: "380dd3bc-ec3e-45c2-b47f-528439a987db",
  PRESTA_APP: "b017a90f-ca4e-4676-8111-a598bc000db0"
};

// Définir des IDs séparés pour les portes/objets spéciaux
export const OBJECT_IDS = {
  // Si la porte portfolio a le même ID que le bouton, définir une constante claire
  PORTE_OUVERT: "4cf64d89-e15f-4324-99de-64801eeb4f2b",
};

// Types d'objets pour la détection
export const OBJECT_TYPES = {
  DOOR: 'door',
  BUTTON: 'button',
  DRAWER: 'drawer'
};

// Mappage des noms d'objets vers leurs IDs
export const NAME_TO_ID_MAP = {
  // Boutons
  'BUTTON_DATAVIZ': BUTTON_IDS.DATAVIZ,
  'DATAVIZ': BUTTON_IDS.DATAVIZ,
  'BUTTON_3D': BUTTON_IDS.MODEL3D,
  'MODEL3D': BUTTON_IDS.MODEL3D,
  '3D': BUTTON_IDS.MODEL3D,
  'BUTTON_SITE': BUTTON_IDS.SITE,
  'SITE': BUTTON_IDS.SITE,
  'BUTTON_PRESTATIONS': BUTTON_IDS.PRESTATIONS,
  'PRESTATIONS': BUTTON_IDS.PRESTATIONS,
  'BUTTON_ABOUT': BUTTON_IDS.ABOUT,
  'ABOUT': BUTTON_IDS.ABOUT,
  'BUTTON_PORTFOLIO': BUTTON_IDS.PORTFOLIO,
  'BUTTON_EOL': BUTTON_IDS.EOL,
  'BUTTON_SARGASSES': BUTTON_IDS.SARGASSES,
  'BUTTON_TIMORNE': BUTTON_IDS.TIMORNE,
  'BUTTON_MAIL': BUTTON_IDS.MAIL,
  
  // Portes
  'PORTE_OUVERT': OBJECT_IDS.PORTE_OUVERT,
  'Door': OBJECT_IDS.DOOR_EXIT,
  'ExitDoor': OBJECT_IDS.DOOR_EXIT,
  
  // Tiroirs
  'PRESTA_DV': BUTTON_IDS.PRESTA_DV,
  'PRESTA_SE': BUTTON_IDS.PRESTA_SE,
  'PRESTA_M3': BUTTON_IDS.PRESTA_M3,
  'PRESTA_APP': BUTTON_IDS.PRESTA_APP
};