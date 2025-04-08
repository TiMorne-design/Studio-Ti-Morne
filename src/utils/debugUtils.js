/**
 * Utilitaires de débogage
 * Fournit des fonctions pour faciliter le débogage et la journalisation
 */

// Déterminer si l'application est en mode développement ou production
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Logger conditionnel qui n'affiche les logs qu'en mode développement
 * @param {String} type - Type de log ('log', 'warn', 'error', 'info', etc.)
 * @returns {Function} - Fonction de log conditionnelle
 */
const createConditionalLogger = (type) => {
  return (...args) => {
    if (isDevelopment && console && console[type]) {
      console[type](...args);
    }
  };
};

/**
 * Journalisation conditionnelle - uniquement en mode développement
 */
const logger = {
  log: createConditionalLogger('log'),
  warn: createConditionalLogger('warn'),
  error: createConditionalLogger('error'),
  info: createConditionalLogger('info'),
  debug: createConditionalLogger('debug'),
  
  // Fonction spéciale qui journalise toujours, même en production
  critical: (...args) => {
    if (console && console.error) {
      console.error('[CRITICAL]', ...args);
    }
  }
};

/**
 * Mesure le temps d'exécution d'une fonction
 * @param {Function} fn - Fonction à mesurer
 * @param {String} label - Étiquette pour le log
 * @returns {Function} - Fonction encapsulée qui mesure le temps d'exécution
 */
const measurePerformance = (fn, label = 'Performance') => {
  return (...args) => {
    if (!isDevelopment) {
      return fn(...args);
    }
    
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    logger.log(`${label}: ${end - start}ms`);
    return result;
  };
};

/**
 * Wrapper pour ajouter du débogage aux fonctions
 * @param {Function} fn - Fonction à déboguer
 * @param {String} name - Nom de la fonction pour le log
 * @returns {Function} - Fonction encapsulée avec débogage
 */
const debugWrapper = (fn, name = 'Anonymous') => {
  return (...args) => {
    logger.log(`Calling ${name} with:`, args);
    try {
      const result = fn(...args);
      logger.log(`${name} returned:`, result);
      return result;
    } catch (error) {
      logger.error(`Error in ${name}:`, error);
      throw error;
    }
  };
};

/**
 * Vérifie si un objet existe et journalise un avertissement s'il n'existe pas
 * @param {*} object - Objet à vérifier
 * @param {String} name - Nom de l'objet pour le message d'erreur
 * @returns {Boolean} - true si l'objet existe, false sinon
 */
const assertExists = (object, name) => {
  const exists = object !== undefined && object !== null;
  
  if (!exists) {
    logger.warn(`${name || 'Object'} n'existe pas`);
  }
  
  return exists;
};

/**
 * Affiche les propriétés d'un objet pour le débogage
 * @param {Object} obj - Objet à inspecter
 * @param {String} label - Étiquette pour le log
 * @param {Number} depth - Profondeur maximale d'inspection (défaut: 1)
 */
const inspectObject = (obj, label = 'Object', depth = 1) => {
  if (!isDevelopment || !obj) return;
  
  const inspect = (o, currentDepth = 0, path = '') => {
    if (currentDepth > depth) return;
    
    Object.entries(o).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        logger.log(`${label} [${currentPath}]:`, typeof value);
        inspect(value, currentDepth + 1, currentPath);
      } else {
        logger.log(`${label} [${currentPath}]:`, value);
      }
    });
  };
  
  inspect(obj);
};

export default {
  isDevelopment,
  logger,
  measurePerformance,
  debugWrapper,
  assertExists,
  inspectObject
};