/**
 * Utilitaires spécifiques à Spline
 * Fonctions d'aide pour interagir avec l'API Spline
 */
import debugUtils from './debugUtils';

const { logger } = debugUtils;

/**
 * Émet un événement sur un objet Spline avec gestion d'erreur
 * @param {Object} splineApp - Instance Spline
 * @param {String} eventName - Nom de l'événement ('mouseDown', 'mouseUp', etc.)
 * @param {String} objectId - ID de l'objet
 * @returns {Boolean} - true si l'événement a été émis avec succès
 */
export const emitEvent = (splineApp, eventName, objectId) => {
  if (!splineApp || !objectId) {
    logger.warn(`Impossible d'émettre l'événement ${eventName}: splineApp ou objectId manquant`);
    return false;
  }
  
  try {
    splineApp.emitEvent(eventName, objectId);
    logger.log(`Événement ${eventName} émis sur l'objet ${objectId}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'émission de l'événement ${eventName} sur l'objet ${objectId}:`, error);
    return false;
  }
};

/**
 * Émet un événement inverse sur un objet Spline
 * @param {Object} splineApp - Instance Spline
 * @param {String} eventName - Nom de l'événement ('mouseDown', 'mouseUp', etc.)
 * @param {String} objectId - ID de l'objet
 * @returns {Boolean} - true si l'événement a été émis avec succès
 */
export const emitEventReverse = (splineApp, eventName, objectId) => {
  if (!splineApp || !objectId) {
    logger.warn(`Impossible d'émettre l'événement inverse ${eventName}: splineApp ou objectId manquant`);
    return false;
  }
  
  try {
    // Vérifier si la méthode emitEventReverse existe
    if (typeof splineApp.emitEventReverse === 'function') {
      splineApp.emitEventReverse(eventName, objectId);
      logger.log(`Événement inverse ${eventName} émis sur l'objet ${objectId}`);
      return true;
    } else {
      // Plan B : émettre un événement standard qui inverse l'état
      logger.warn(`La méthode emitEventReverse n'existe pas, tentative de plan B`);
      
      // Pour mouseDown, émettre mouseUp et vice-versa
      const reverseMap = {
        'mouseDown': 'mouseUp',
        'mouseUp': 'mouseDown',
        'start': 'stop',
        'stop': 'start'
      };
      
      const reverseEvent = reverseMap[eventName] || eventName;
      splineApp.emitEvent(reverseEvent, objectId);
      logger.log(`Événement alternatif ${reverseEvent} émis sur l'objet ${objectId}`);
      return true;
    }
  } catch (error) {
    logger.error(`Erreur lors de l'émission de l'événement inverse ${eventName} sur l'objet ${objectId}:`, error);
    return false;
  }
};

/**
 * Trouve un objet par son nom
 * @param {Object} splineApp - Instance Spline
 * @param {String} objectName - Nom de l'objet à trouver
 * @returns {Object|null} - L'objet trouvé ou null
 */
export const findObjectByName = (splineApp, objectName) => {
  if (!splineApp || !objectName) return null;
  
  try {
    if (typeof splineApp.findObjectByName === 'function') {
      const obj = splineApp.findObjectByName(objectName);
      return obj;
    }
  } catch (error) {
    logger.error(`Erreur lors de la recherche de l'objet ${objectName}:`, error);
  }
  
  return null;
};

/**
 * Liste toutes les variables disponibles dans une instance Spline
 * @param {Object} splineApp - Instance Spline
 * @param {String} filter - Filtre optionnel (ex: 'Camera' pour n'obtenir que les variables contenant 'Camera')
 * @returns {Object} - Objet contenant les variables filtrées
 */
export const listVariables = (splineApp, filter = '') => {
  if (!splineApp || !splineApp.getVariables) {
    return {};
  }
  
  try {
    const variables = splineApp.getVariables();
    
    if (filter) {
      // Filtrer les variables selon le filtre
      return Object.entries(variables).reduce((filtered, [key, value]) => {
        if (key.includes(filter)) {
          filtered[key] = value;
        }
        return filtered;
      }, {});
    }
    
    return variables;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des variables:`, error);
    return {};
  }
};

/**
 * Liste tous les événements disponibles dans une instance Spline
 * @param {Object} splineApp - Instance Spline
 * @returns {Array} - Tableau d'événements disponibles
 */
export const listEvents = (splineApp) => {
  if (!splineApp || !splineApp.getEvents) {
    return [];
  }
  
  try {
    return splineApp.getEvents();
  } catch (error) {
    logger.error(`Erreur lors de la récupération des événements:`, error);
    return [];
  }
};

/**
 * Analyse une instance Spline et journalise ses caractéristiques
 * @param {Object} splineApp - Instance Spline
 */
export const analyzeSplineInstance = (splineApp) => {
  if (!splineApp) {
    logger.warn('Impossible d\'analyser une instance Spline nulle');
    return;
  }
  
  logger.log('Analyse de l\'instance Spline:', splineApp);
  
  // Lister les méthodes disponibles
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(splineApp))
    .filter(name => typeof splineApp[name] === 'function');
  
  logger.log('Méthodes disponibles:', methods);
  
  // Lister les variables
  const variables = listVariables(splineApp);
  logger.log('Variables disponibles:', Object.keys(variables).length);
  
  // Rechercher des variables de caméra
  const cameraVariables = listVariables(splineApp, 'Camera');
  logger.log('Variables de caméra:', cameraVariables);
  
  // Lister les événements
  const events = listEvents(splineApp);
  logger.log('Événements disponibles:', events);
};

export default {
  emitEvent,
  emitEventReverse,
  findObjectByName,
  listVariables,
  listEvents,
  analyzeSplineInstance
};