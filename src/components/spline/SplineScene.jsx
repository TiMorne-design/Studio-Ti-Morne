/**
 * Composant SplineScene refactorisé
 * Intègre le système d'interaction unifié
 */
import React, { useRef, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Spline from '@splinetool/react-spline';
import useCameraControls from './useCameraControls';
import useAnimation from '../../hooks/useAnimation';
import useInteractionControls from '../../hooks/useInteractionControls';
import useDeviceDetection from '../../hooks/useDeviceDetection';
import cameraUtils from '../../utils/cameraUtils';
import splineHelpers from '../../utils/splineHelpers';
import debugUtils from '../../utils/debugUtils';
import { getObjectId, isPortfolioDoor } from '../../utils/objectUtils';
import { BUTTON_IDS } from '../../constants/ids';

const { logger } = debugUtils;

/**
 * Composant de scène Spline avec contrôles de caméra améliorés
 */
const SplineScene = forwardRef(({ scenePath, onObjectClick, onLoad: propsOnLoad, qualityLevel }, ref) => {
  const splineRef = useRef(null);
  const cameraRef = useRef(null);
  const containerRef = useRef(null);
  const lastClickedButtonRef = useRef(null);
  
  // Détection de l'appareil
  const { isMobile, isTablet } = useDeviceDetection();
  const isTouchDevice = isMobile || isTablet;
  
  // Utiliser les hooks de caméra et d'animation
  const {
    initializeCamera,
    handleWheel: handleCameraWheel,
    handleMouseMove: handleCameraMouseMove,
    handleButtonClick,
    restorePreviousCameraState,
    moveCamera,
    directCameraMovement,
    toggleControls: toggleCameraControls,
    restoreControlsOnly,
    isControlsEnabled,
    hasPreviousState
  } = useCameraControls(cameraRef, splineRef);
  
  const { animateCamera } = useAnimation();

  /**
   * Gère la rotation de la caméra
   * @param {Object} event - Événement normalisé de rotation
   */
  const handleCameraRotation = useCallback((event) => {
    if (!isControlsEnabled || !cameraRef.current) return;
    
    // Utiliser directement handleCameraMouseMove du hook useCameraControls
    handleCameraMouseMove(event);
  }, [handleCameraMouseMove, isControlsEnabled]);
  
  /**
   * Gère le déplacement de la caméra
   * @param {Object} event - Événement de déplacement
   */
  const handleCameraMovement = useCallback((event) => {
    if (!isControlsEnabled || !cameraRef.current) return;
    
    // Utiliser directement handleCameraWheel du hook useCameraControls
    handleCameraWheel(event);
  }, [handleCameraWheel, isControlsEnabled]);
  
  /**
   * Gère les interactions avec les objets
   * @param {Object} interaction - Informations sur l'interaction
   */
  const handleObjectInteraction = useCallback((interaction) => {
    if (!splineRef.current || !onObjectClick) return;
    
    const { type, objectName, objectId } = interaction;
    
    // Traiter seulement les taps (clics simples)
    if (type === 'tap') {
      // Obtenir l'ID de l'objet
      const resolvedObjectId = objectId || getObjectId(objectName);
      
      // Appeler onObjectClick comme pour un clic normal
      onObjectClick(objectName, splineRef.current, resolvedObjectId);
    }
  }, [onObjectClick]);
  
  // Utiliser le hook d'interaction unifié en lui passant les infos d'appareil
  const { 
    attachHandlers,
    stopInertia,
    triggerCameraMovement
  } = useInteractionControls({
    onCameraRotate: handleCameraRotation,
    onCameraMove: handleCameraMovement,
    onObjectInteract: handleObjectInteraction,
    deviceInfo: { isMobile, isTablet }, // Passer les infos d'appareil
    sensitivity: 1.0,
    enableInertia: true,
    enableSmoothing: true
  });
  
  // Attacher les gestionnaires d'interaction
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = attachHandlers(containerRef.current);
      return cleanup;
    }
  }, [attachHandlers]);
  
  /**
   * Anime la caméra vers une position et rotation cibles
   * @param {Object} options - Options d'animation
   */
  const handleAnimateCamera = ({ position, rotation, duration = 2000, preventAutoReset = false }) => {
    if (!cameraRef.current) {
      logger.warn("Impossible d'animer la caméra: référence caméra manquante");
      return;
    }
    
    logger.log("Animation de la caméra:", {
      positionCible: position,
      rotationCible: rotation,
      durée: duration,
      preventAutoReset: preventAutoReset
    });
    
    // Utiliser le hook d'animation pour l'animation fluide
    animateCamera(cameraRef.current, {
      position,
      rotation,
      duration,
      easing: 'easeOutCubic',
      onComplete: () => {
        logger.log("Animation de caméra terminée");
      }
    });
  };
  
  // Exposer les méthodes aux composants parents via ref
  useImperativeHandle(ref, () => ({
    // Obtenir l'instance Spline
    getSplineInstance: () => splineRef.current,
    
    // Gestion des contrôles de caméra
    handleButtonClick,
    handleWheel: handleCameraMovement,
    
    // Exposer les gestionnaires pour compatibilité
    handleMouseMove: handleCameraRotation,
    handleTouchSwipe: handleCameraRotation,
    
    restorePreviousCameraState,
    hasPreviousState,
    
    // Animation de caméra
    animateCamera: handleAnimateCamera,

    // Arrêter l'inertie tactile
    stopInertia,

    // Déplacement manuel de la caméra
    moveCamera: (distance) => {
      // Arrêter d'abord l'inertie existante
      stopInertia();
      
      // Utiliser moveCamera s'il est disponible
      if (typeof moveCamera === 'function') {
        return moveCamera(distance);
      }
      
      // Sinon, simuler un événement de déplacement
      triggerCameraMovement(distance);
      return true;
    },
    
    // Fonction spécifique pour la vue portfolio
    moveToPortfolioView: (portfolioParams) => {
      if (!cameraRef.current) {
        logger.warn("Impossible d'animer la caméra vers portfolio: référence caméra manquante");
        return false;
      }
      
      logger.log("Déplacement direct vers la vue portfolio", portfolioParams);
      
      // Convertir les rotations de degrés (format Spline) en radians (format Three.js/React)
      const convertedRotation = {
        x: portfolioParams.rotation.x * Math.PI / 180,
        y: portfolioParams.rotation.y * Math.PI / 180,
        z: portfolioParams.rotation.z * Math.PI / 180
      };
    
      // Utiliser directCameraMovement avec rotation convertie
      return directCameraMovement(
        portfolioParams.position,
        convertedRotation
      );
    },
    
    // Réinitialisation de l'état de la caméra
    resetCameraState: () => {
      if (splineRef.current && lastClickedButtonRef.current) {
        try {
          // Tenter de réinitialiser l'animation du dernier bouton cliqué
          const result = splineHelpers.emitEventReverse(
            splineRef.current, 
            'mouseUp', 
            lastClickedButtonRef.current
          );
          
          // Réinitialiser la référence du dernier bouton cliqué
          if (result) {
            lastClickedButtonRef.current = null;
            return true;
          }
          
          // Plan B : Si la réinitialisation directe échoue, tenter une approche alternative
          logger.warn("Échec de la première méthode de réinitialisation, tentative de plan B");
          
          if (cameraRef.current) {
            splineHelpers.emitEvent(splineRef.current, 'resetAllStates', cameraRef.current.uuid);
            return true;
          }
        } catch (error) {
          logger.error("Erreur lors de la réinitialisation des états de caméra:", error);
        }
      }
      
      return false;
    },
    
    // Obtenir le dernier bouton cliqué
    getLastClickedButton: () => lastClickedButtonRef.current,
    
    // Vérifier si les contrôles sont activés
    isControlsEnabled: () => isControlsEnabled,
    
    // Restaurer uniquement les contrôles sans position
    restoreControlsOnly: () => {
      // Utiliser la fonction existante
      return restoreControlsOnly();
    },
    
    // Activer/désactiver les contrôles de caméra
    toggleCameraControls: (enabled) => {
      toggleCameraControls(enabled);
      return true;
    }
  }));
  
  /**
   * Fonction appelée quand Spline est chargé
   * @param {Object} splineApp - Instance Spline
   */
  const onLoad = (splineApp) => {
    logger.log('Spline chargé');
    splineRef.current = splineApp;
    
    // Exposer l'instance Spline globalement
    window.splineInstance = splineApp;
    
    // Tenter de trouver la caméra (d'abord par son nom spécifique, puis par défaut)
    const camera = splineApp.findObjectByName("Character") || splineApp.camera;
    
    if (camera) {
      initializeCamera(camera);
    } else {
      logger.error('Aucune caméra disponible dans la scène Spline');
    }
    
    // Analyser l'instance Spline pour le débogage
    splineHelpers.analyzeSplineInstance(splineApp);
    
    // Appliquer la qualité visuelle si spécifiée
    if (qualityLevel && splineApp.setQuality) {
      try {
        logger.log(`Application du niveau de qualité: ${qualityLevel}`);
        splineApp.setQuality(qualityLevel);
      } catch (error) {
        logger.error("Erreur lors de l'application du niveau de qualité:", error);
      }
    }
    
    // Définir la variable globale pour le type d'appareil
    window.__isTouchDevice = isTouchDevice;
    
    // Appeler la fonction onLoad des props si elle existe
    if (propsOnLoad) {
      propsOnLoad(splineApp);
    }
  };
  
  /**
   * Gestionnaire pour les clics sur les objets Spline
   * @param {Object} e - Événement de clic
   */
  const onSplineMouseUp = (e) => {
    if (!e.target) return;
    
    const objectName = e.target.name || '';
    const objectUuid = e.target.uuid;
        
    // Obtenir l'ID de l'objet
    const objectId = getObjectId(objectName, objectUuid);
    
    logger.log('Objet cliqué:', objectName, "UUID:", objectUuid, "ID:", objectId);
    
    // Cas particuliers où nous ne voulons pas désactiver les contrôles
    const isAutomaticDoorOpening = window.__automaticDoorOpening === true;
    const isPortfolioDoorObj = isPortfolioDoor(objectId, objectName);
    const isPortfolioButton = objectId === BUTTON_IDS.PORTFOLIO && 
                           (objectName === 'BUTTON_PORTFOLIO' || objectName.includes('BUTTON_PORTFOLIO'));
  
    // IMPORTANT: pour le bouton portfolio, nous ne faisons rien de spécial ici 
    // mais nous empêchons EXPLICITEMENT le comportement standard des boutons.
    // La gestion sera faite entièrement via moveToPortfolioView
    if (isPortfolioButton) {
      logger.log("Bouton portfolio détecté dans SplineScene - pas de désactivation des contrôles");
      
      // TRÈS IMPORTANT: Ne pas stocker lastClickedButtonRef.current pour le portfolio
      // car c'est ce qui est utilisé pour restaurer l'état plus tard
      // lastClickedButtonRef.current = objectId; <-- COMMENTÉ OU SUPPRIMÉ
      
      // On transmet simplement l'événement au parent qui utilisera notre fonction spéciale
    }
    // Si ce n'est pas le bouton portfolio, gérer normalement
    else if (!isAutomaticDoorOpening && !isPortfolioDoorObj) {
      // Vérification des boutons comme avant
      const buttonPatterns = [
        /BUTTON_/i, /DATAVIZ/i, /3D/i, /SITE/i, /PORTE_/i, /PRESTATIONS/i, /ABOUT/i
      ];
        
      const isButton = 
        Object.values(BUTTON_IDS).includes(objectId) || 
        buttonPatterns.some(pattern => pattern.test(objectName) || pattern.test(objectUuid));
      
      if (isButton) {
        logger.log("Bouton cliqué, désactivation des contrôles");
        
        // Stocker l'ID ou UUID du bouton cliqué
        lastClickedButtonRef.current = objectId || objectUuid;
        
        // Désactiver les contrôles et sauvegarder l'état actuel
        handleButtonClick();
      }
    } else if (isPortfolioDoorObj) {
      // Pour la porte portfolio, stocker l'ID sans désactiver les contrôles
      lastClickedButtonRef.current = objectId;
    }
    
    // Transmettre l'événement au parent avec l'ID en plus
    if (onObjectClick) {
      onObjectClick(objectName, splineRef.current, objectId);
    }
  };
  
  // Effet pour initialiser/nettoyer les variables globales
  useEffect(() => {
    // Initialiser les variables globales au démarrage
    window.__automaticDoorOpening = false;
    window.__isTouchDevice = isTouchDevice;
    
    // Nettoyer les variables globales au démontage
    return () => {
      delete window.__automaticDoorOpening;
      delete window.__isTouchDevice;
    };
  }, [isTouchDevice]);
  
  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative'
      }}
      className="touch-enabled interaction-enabled"
    >
      <Spline
        scene={scenePath}
        onLoad={onLoad}
        onSplineMouseUp={onSplineMouseUp}
      />
    </div>
  );
});

SplineScene.propTypes = {
  scenePath: PropTypes.string.isRequired,
  onObjectClick: PropTypes.func,
  onLoad: PropTypes.func,
  qualityLevel: PropTypes.string
};

export default SplineScene;