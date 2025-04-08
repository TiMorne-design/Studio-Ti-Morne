/**
 * Mappages des vues et comportements associés
 */
import { BUTTON_IDS } from './ids';
import { getObjectId } from '../utils/objectUtils';

// Configuration des vues principales
export const VIEW_MAPPINGS = {
  dataviz: {
    buttonId: BUTTON_IDS.DATAVIZ,
    cameraVariablePrefix: 'dataviz',
    timeout: 2000
  },
  model3d: {
    buttonId: BUTTON_IDS.MODEL3D,
    cameraVariablePrefix: 'model3d',
    timeout: 2000
  },
  site: {
    buttonId: BUTTON_IDS.SITE,
    cameraVariablePrefix: 'site',
    timeout: 2000
  },
  prestations: {
    buttonId: BUTTON_IDS.PRESTATIONS,
    cameraVariablePrefix: 'prestations',
    timeout: 2000
  },
  about: {
    buttonId: BUTTON_IDS.ABOUT,
    cameraVariablePrefix: 'about',
    showOverlay: true,
    timeout: 2000
  },
  portfolio: {
    buttonId: BUTTON_IDS.PORTFOLIO,
    cameraVariablePrefix: 'portfolio',
    specialBehavior: 'portfolio',
    timeout: 2000
  }
};

// Configuration des tiroirs de prestation
export const DRAWER_MAPPINGS = {
  [BUTTON_IDS.PRESTA_DV]: {
    id: BUTTON_IDS.PRESTA_DV,
    title: "Data Visualization",
    contentType: "DataVizContent"
  },
  [BUTTON_IDS.PRESTA_SE]: {
    id: BUTTON_IDS.PRESTA_SE,
    title: "Search Engine Optimization",
    contentType: "SearchEngineContent"
  },
  [BUTTON_IDS.PRESTA_M3]: {
    id: BUTTON_IDS.PRESTA_M3,
    title: "Modélisation 3D",
    contentType: "Model3DContent"
  },
  [BUTTON_IDS.PRESTA_APP]: {
    id: BUTTON_IDS.PRESTA_APP,
    title: "Développement d'Applications",
    contentType: "AppDevContent"
  }
};

/**
 * Détermine la vue pour un ID d'objet
 * @param {String} objectId - ID de l'objet
 * @returns {Object|null} - Configuration de la vue ou null
 */
export function getViewForObjectId(objectId) {
  for (const [viewName, config] of Object.entries(VIEW_MAPPINGS)) {
    if (objectId === config.buttonId) {
      return { viewName, ...config };
    }
  }
  return null;
}

/**
 * Détermine la vue pour un nom d'objet (compatibilité)
 * @param {String} objectName - Nom de l'objet
 * @returns {Object|null} - Configuration de la vue ou null
 */
export function getViewForObjectName(objectName) {
  const objectId = getObjectId(objectName);
  return getViewForObjectId(objectId);
}

/**
 * Détermine le tiroir pour un ID d'objet
 * @param {String} objectId - ID de l'objet
 * @returns {Object|null} - Configuration du tiroir ou null
 */
export function getDrawerForObjectId(objectId) {
  return DRAWER_MAPPINGS[objectId] || null;
}

/**
 * Détermine le tiroir pour un nom d'objet (compatibilité)
 * @param {String} objectName - Nom de l'objet
 * @returns {Object|null} - Configuration du tiroir ou null
 */
export function getDrawerForObjectName(objectName) {
  const objectId = getObjectId(objectName);
  return getDrawerForObjectId(objectId);
}