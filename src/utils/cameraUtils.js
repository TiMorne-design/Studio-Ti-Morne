/**
 * Utilitaires pour la manipulation de la caméra
 * Fournit des fonctions pour extraire et manipuler les paramètres de caméra
 */

// Conversion entre degrés et radians
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Convertit des degrés en radians
 * @param {Number} degrees - Angle en degrés
 * @returns {Number} - Angle en radians
 */
export const degreesToRadians = (degrees) => degrees * DEG_TO_RAD;

/**
 * Convertit des radians en degrés
 * @param {Number} radians - Angle en radians
 * @returns {Number} - Angle en degrés
 */
export const radiansToDegrees = (radians) => radians * RAD_TO_DEG;

/**
 * Extrait les paramètres de caméra d'un objet Spline pour une vue spécifique
 * @param {Object} splineApp - L'instance Spline
 * @param {String} viewPrefix - Le préfixe des variables de caméra (ex: "about")
 * @returns {Object|null} - Les paramètres de caméra (position et rotation) ou null si non trouvés
 */
export const extractCameraParameters = (splineApp, viewPrefix) => {
  if (!splineApp || !splineApp.getVariables || !viewPrefix) {
    return null;
  }
  
  try {
    const variables = splineApp.getVariables();
    
    // Vérifier si les variables de caméra existent
    const posX = variables[`${viewPrefix}CameraPositionX`];
    const posY = variables[`${viewPrefix}CameraPositionY`];
    const posZ = variables[`${viewPrefix}CameraPositionZ`];
    const rotX = variables[`${viewPrefix}CameraRotationX`];
    const rotY = variables[`${viewPrefix}CameraRotationY`];
    const rotZ = variables[`${viewPrefix}CameraRotationZ`];
    
    // Si au moins les positions sont définies, retourner les paramètres
    if (posX !== undefined && posY !== undefined && posZ !== undefined) {
      return {
        position: {
          x: parseFloat(posX) || 0,
          y: parseFloat(posY) || 0,
          z: parseFloat(posZ) || 0
        },
        rotation: {
          x: parseFloat(rotX) || 0,
          y: parseFloat(rotY) || 0,
          z: parseFloat(rotZ) || 0
        }
      };
    }
  } catch (error) {
    console.error(`Erreur lors de l'extraction des paramètres de caméra pour ${viewPrefix}:`, error);
  }
  
  return null;
};

/**
 * Calcule la distance entre deux positions 3D
 * @param {Object} pos1 - Première position {x, y, z}
 * @param {Object} pos2 - Deuxième position {x, y, z}
 * @returns {Number} - La distance entre les deux positions
 */
export const calculateDistance = (pos1, pos2) => {
  if (!pos1 || !pos2) return 0;
  
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Limite une valeur entre un minimum et un maximum
 * @param {Number} value - Valeur à limiter
 * @param {Number} min - Valeur minimale
 * @param {Number} max - Valeur maximale
 * @returns {Number} - Valeur limitée
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Limite un angle en radians entre -PI et PI
 * @param {Number} angle - Angle en radians
 * @returns {Number} - Angle limité
 */
export const normalizeAngle = (angle) => {
  // Normaliser l'angle entre -PI et PI
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

/**
 * Crée un état de caméra à partir de l'objet caméra actuel
 * @param {Object} camera - Objet caméra
 * @returns {Object} - État de la caméra
 */
export const createCameraState = (camera) => {
  if (!camera) return null;
  
  return {
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    },
    rotation: {
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: camera.rotation.z
    }
  };
};

/**
 * Détermine si la caméra est proche d'une position donnée
 * @param {Object} camera - Objet caméra
 * @param {Object} position - Position cible {x, y, z}
 * @param {Number} threshold - Seuil de distance (défaut: 10)
 * @returns {Boolean} - true si la caméra est proche de la position
 */
export const isCameraNearPosition = (camera, position, threshold = 10) => {
  if (!camera || !position) return false;
  
  const distance = calculateDistance(
    { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    position
  );
  
  return distance < threshold;
};

/**
 * Obtient les limites de la zone de mouvement de la caméra
 * @returns {Object} - Limites de la zone
 */
export const getCameraLimits = () => {
  return {
    minZ: -3200,      // Limite avant (fond du chalet)
    maxZ: 1200,       // Limite arrière (extérieur de la terrasse)
    doorThreshold: -800, // Seuil de la porte
    doorTrigger: -400  // Position de déclenchement de la porte
  };
};

/**
 * Vérifie si la caméra est dans la zone de la terrasse
 * @param {Number} positionZ - Position Z de la caméra
 * @returns {Boolean} - true si la caméra est sur la terrasse
 */
export const isOnTerrace = (positionZ) => {
  const limits = getCameraLimits();
  return positionZ > limits.doorThreshold;
};

export default {
  degreesToRadians,
  radiansToDegrees,
  extractCameraParameters,
  calculateDistance,
  clamp,
  normalizeAngle,
  createCameraState,
  isCameraNearPosition,
  getCameraLimits,
  isOnTerrace
};