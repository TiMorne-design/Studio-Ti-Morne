/**
 * Hook personnalisé pour gérer le déclenchement automatique des portes
 * Détecte l'approche de la caméra et déclenche l'ouverture des portes
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import splineHelpers from '../utils/splineHelpers';
import cameraUtils from '../utils/cameraUtils';
import debugUtils from '../utils/debugUtils';
import { BUTTON_IDS, OBJECT_IDS } from '../constants/ids';

const { logger } = debugUtils;

/**
 * Hook pour gérer le déclenchement automatique des portes
 * @param {Object} options - Options de configuration
 * @param {React.RefObject} options.splineRef - Référence à l'instance Spline
 * @returns {Object} - Fonctions et état pour la gestion des portes
 */
export default function useDoorTrigger({ splineRef }) {
  // État pour suivre les portes déjà déclenchées
  const [triggeredDoors, setTriggeredDoors] = useState(new Set());
  
  // Référence pour éviter les déclenchements multiples rapides
  const cooldownRef = useRef({});
  
  // Référence pour stocker les timeouts de réinitialisation
  const timeoutsRef = useRef([]);
  
  /**
   * Déclenche l'ouverture d'une porte
   * @param {String} doorId - ID de la porte à ouvrir
   * @param {Number} cooldownTime - Temps de recharge en ms (défaut: 5000)
   * @param {Boolean} isAutomatic - Indique si l'ouverture est automatique
   * @returns {Boolean} - true si la porte a été déclenchée
   */
  const triggerDoor = useCallback((doorId, cooldownTime = 5000, isAutomatic = true) => {
    if (!splineRef || !splineRef.current || !doorId) {
      return false;
    }
    
    // Vérifier si la porte est en cooldown
    if (cooldownRef.current[doorId]) {
      logger.log(`Porte ${doorId} en cooldown, ignorée`);
      return false;
    }
    
    try {
      const splineApp = splineRef.current;
      
      // Marquer globalement si c'est une ouverture automatique
      if (isAutomatic) {
        window.__automaticDoorOpening = true;
      }
      
      logger.log(`Déclenchement porte ${doorId} (auto: ${isAutomatic})`);
      
      // Émettre l'événement d'ouverture
      splineHelpers.emitEvent(splineApp, 'mouseUp', doorId);
      
      // Marquer la porte comme déclenchée
      setTriggeredDoors(prev => {
        const newSet = new Set(prev);
        newSet.add(doorId);
        return newSet;
      });
      
      // Mettre la porte en cooldown
      cooldownRef.current[doorId] = true;
      
      // Réinitialiser le cooldown après le délai
      const timeout = setTimeout(() => {
        cooldownRef.current[doorId] = false;
        
        // Réinitialiser le marqueur global également
        if (isAutomatic) {
          window.__automaticDoorOpening = false;
        }
      }, cooldownTime);
      
      // Stocker le timeout pour le nettoyage
      timeoutsRef.current.push(timeout);
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors du déclenchement de la porte ${doorId}:`, error);
      
      // Réinitialiser le marqueur global en cas d'erreur
      if (isAutomatic) {
        window.__automaticDoorOpening = false;
      }
      
      return false;
    }
  }, [splineRef]);
  
  /**
   * Vérifie si la caméra approche d'une porte et déclenche son ouverture
   * Séparé des comportements liés aux boutons comme Portfolio
   * @param {Object} camera - Référence à l'objet caméra
   * @param {String} doorId - ID de la porte à vérifier
   * @param {Number} direction - Direction du mouvement (1 = avant, -1 = arrière)
   * @returns {Boolean} - true si la porte a été déclenchée
   */
  const checkDoorProximity = useCallback((camera, doorId, direction = 1) => {
    if (!camera || !doorId || direction === 0) {
      return false;
    }
    
    const limits = cameraUtils.getCameraLimits();
    const posZ = camera.position.z;
    
    // Si c'est la porte Portfolio, marquer spécifiquement qu'il s'agit d'une ouverture automatique
    const isPortfolioDoor = doorId === BUTTON_IDS.PORTFOLIO || doorId === OBJECT_IDS.PORTE_PORTFOLIO;
    
    if (isPortfolioDoor) {
      // Ajouter un flag global pour indiquer que c'est une ouverture automatique de la porte portfolio
      window.__portfolioDoorAutoOpening = true;
      
      // Utiliser un timeout pour réinitialiser ce flag après un court délai
      setTimeout(() => {
        window.__portfolioDoorAutoOpening = false;
      }, 1000);
    }
    
    // Si on se déplace vers l'avant et qu'on approche du seuil de la porte
    if (direction > 0 && 
        cameraUtils.isOnTerrace(posZ) && 
        posZ <= limits.doorTrigger && 
        posZ > limits.doorThreshold) {
      
      // Marquer spécifiquement qu'il s'agit d'une ouverture automatique par seuil
      window.__doorThresholdTriggered = true;
      setTimeout(() => {
        window.__doorThresholdTriggered = false;
      }, 1000);
      
      // Déclencher l'ouverture de la porte
      const result = triggerDoor(doorId, 5000, true);
      
      // Pour déboguer
      logger.log(`Déclenchement auto de la porte ${doorId} au seuil: ${result ? 'succès' : 'échec'}`);
      
      return result;
    }
    
    return false;
  }, [triggerDoor]);
  
  /**
   * Ferme une porte précédemment ouverte
   * @param {String} doorId - ID de la porte à fermer
   * @returns {Boolean} - true si la fermeture a été déclenchée
   */
  const closeDoor = useCallback((doorId) => {
    if (!splineRef || !splineRef.current || !doorId) {
      return false;
    }
    
    try {
      const splineApp = splineRef.current;
      
      logger.log(`Fermeture porte ${doorId}`);
      
      // Émettre l'événement inverse pour fermer la porte
      splineHelpers.emitEventReverse(splineApp, 'mouseUp', doorId);
      
      // Marquer la porte comme non déclenchée
      setTriggeredDoors(prev => {
        const newSet = new Set(prev);
        newSet.delete(doorId);
        return newSet;
      });
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la fermeture de la porte ${doorId}:`, error);
      return false;
    }
  }, [splineRef]);
  
  /**
   * Vérifie si une porte est actuellement déclenchée
   * @param {String} doorId - ID de la porte à vérifier
   * @returns {Boolean} - true si la porte est déclenchée
   */
  const isDoorTriggered = useCallback((doorId) => {
    return triggeredDoors.has(doorId);
  }, [triggeredDoors]);
  
  // Nettoyer les timeouts lors du démontage
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      timeoutsRef.current = [];
      
      // Réinitialiser les marqueurs globaux
      window.__automaticDoorOpening = false;
      window.__portfolioDoorAutoOpening = false;
      window.__doorThresholdTriggered = false;
    };
  }, []);
  
  return {
    triggerDoor,
    closeDoor,
    checkDoorProximity,
    isDoorTriggered,
    triggeredDoors
  };
}