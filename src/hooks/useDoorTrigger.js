import { useCallback } from 'react';
import { useSceneState } from '../contexts/SceneContext';
import splineHelpers from '../utils/splineHelpers';
import cameraUtils from '../utils/cameraUtils';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook simplifié qui délègue la gestion de l'état au SceneContext
 * et se concentre uniquement sur l'interaction avec Spline
 */
export default function useDoorTrigger({ splineRef }) {
  // Utiliser notre contexte simplifié
  const { doorState, openDoor, closeDoor } = useSceneState();
  
  /**
   * Déclenche l'ouverture d'une porte dans Spline
   * @param {String} doorId - ID de la porte à ouvrir
   * @param {String} source - Source du déclenchement ('manual', 'proximity', 'button')
   * @returns {Boolean} - true si l'événement a été émis avec succès
   */
  const emitDoorOpenEvent = useCallback((doorId, source = 'manual') => {
    if (!splineRef || !splineRef.current || !doorId) {
      return false;
    }
    
    try {
      const splineApp = splineRef.current;
      
      // Mettre à jour l'état via le contexte
      openDoor(source);
      
      // Émettre l'événement d'ouverture dans Spline
      const result = splineHelpers.emitEvent(splineApp, 'mouseUp', doorId);
      logger.log(`Événement d'ouverture émis sur la porte ${doorId} (source: ${source}): ${result ? 'succès' : 'échec'}`);
      
      return result;
    } catch (error) {
      logger.error(`Erreur lors de l'émission de l'événement sur la porte ${doorId}:`, error);
      return false;
    }
  }, [splineRef, openDoor]);
  
  /**
   * Émet l'événement de fermeture d'une porte dans Spline
   * @param {String} doorId - ID de la porte à fermer
   * @returns {Boolean} - true si l'événement a été émis avec succès
   */
  const emitDoorCloseEvent = useCallback((doorId) => {
    if (!splineRef || !splineRef.current || !doorId) {
      return false;
    }
    
    try {
      const splineApp = splineRef.current;
      
      // Mettre à jour l'état via le contexte
      closeDoor();
      
      // Émettre l'événement inverse pour fermer la porte
      const result = splineHelpers.emitEventReverse(splineApp, 'mouseUp', doorId);
      logger.log(`Événement de fermeture émis sur la porte ${doorId}: ${result ? 'succès' : 'échec'}`);
      
      return result;
    } catch (error) {
      logger.error(`Erreur lors de l'émission de l'événement de fermeture sur la porte ${doorId}:`, error);
      return false;
    }
  }, [splineRef, closeDoor]);
  
  /**
   * Vérifie si la caméra est proche d'une porte et déclenche son ouverture si nécessaire
   * @param {Object} camera - Objet caméra
   * @param {String} doorId - ID de la porte à vérifier
   * @returns {Boolean} - true si la porte a été déclenchée
   */
  const checkProximity = useCallback((camera, doorId) => {
    if (!camera || !doorId || doorState.isOpen) {
      return false;
    }
    
    const limits = cameraUtils.getCameraLimits();
    const posZ = camera.position.z;
    
    // Vérifier si on est dans la zone de déclenchement
    if (cameraUtils.isOnTerrace(posZ) && 
        posZ <= limits.doorTrigger && 
        posZ > limits.doorThreshold) {
      
      // Émettre l'événement d'ouverture avec la source 'proximity'
      return emitDoorOpenEvent(doorId, 'proximity');
    }
    
    return false;
  }, [doorState.isOpen, emitDoorOpenEvent]);
  
  return {
    emitDoorOpenEvent,
    emitDoorCloseEvent,
    checkProximity,
    // Pour compatibilité avec le code existant, exposer ces propriétés issues du contexte
    isDoorOpen: doorState.isOpen,
    isAutomaticOpening: doorState.openSource === 'proximity'
  };
}