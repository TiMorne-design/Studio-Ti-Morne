/**
 * Utilitaires pour la gestion des objets interactifs
 */
import { BUTTON_IDS, OBJECT_IDS, OBJECT_TYPES, NAME_TO_ID_MAP } from '../constants/ids';
import debugUtils from './debugUtils';

const { logger } = debugUtils;

/**
 * Convertit un nom d'objet en ID
 * @param {String} objectName - Nom de l'objet
 * @param {String} objectUuid - UUID de l'objet (optionnel)
 * @returns {String} - ID correspondant ou UUID si non trouvé
 */
export const getObjectId = (objectName, objectUuid = null) => {
  // Chercher d'abord dans le mappage des noms
  const mappedId = NAME_TO_ID_MAP[objectName];
  
  if (mappedId) {
    logger.log(`Conversion de nom d'objet: ${objectName} -> ${mappedId}`);
    return mappedId;
  }
  
  // Si pas trouvé, renvoyer l'UUID ou le nom comme fallback
  return objectUuid || objectName;
};

/**
 * Détermine le type d'objet
 * @param {String} objectId - ID de l'objet
 * @param {String} objectName - Nom de l'objet (pour la détection de portes par nom)
 * @returns {String} - Type d'objet (OBJECT_TYPES)
 */
export const getObjectType = (objectId, objectName = '') => {
  // Vérifier si c'est une porte (par ID ou nom)
  if (objectId === OBJECT_IDS.PORTE_OUVERT ) {
    return OBJECT_TYPES.DOOR;
  }
  
  // Vérifier si c'est un tiroir de prestation
  if ([BUTTON_IDS.PRESTA_DV, BUTTON_IDS.PRESTA_SE, 
       BUTTON_IDS.PRESTA_M3, BUTTON_IDS.PRESTA_APP].includes(objectId)) {
    return OBJECT_TYPES.DRAWER;
  }
  
  // Par défaut, c'est un bouton
  return OBJECT_TYPES.BUTTON;
};

/**
 * Vérifie si l'objet est la porte portfolio
 * @param {String} objectId - ID de l'objet
 * @param {String} objectName - Nom de l'objet
 * @returns {Boolean} - true si c'est la porte portfolio
 */
export const isPortfolioDoor = (objectId, objectName) => {
  return objectId === OBJECT_IDS.PORTE_OUVERT || 
         objectName === 'PORTE_OUVERT' || 
         objectName.includes('PORTE_OUVERT');
};

/**
 * Vérifie si l'objet est le bouton portfolio (mais pas la porte)
 * @param {String} objectId - ID de l'objet
 * @param {String} objectName - Nom de l'objet
 * @returns {Boolean} - true si c'est le bouton portfolio mais pas la porte
 */
export const isPortfolioButton = (objectId, objectName) => {
  return objectId === BUTTON_IDS.PORTFOLIO && objectName !== 'PORTE_OUVERT';
};

export default {
  getObjectId,
  getObjectType,
  isPortfolioDoor,
  isPortfolioButton
};