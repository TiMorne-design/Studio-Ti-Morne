/**
 * Composant SplineScene
 * Gère le rendu et les interactions avec la scène Spline
 */
import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Spline from '@splinetool/react-spline';
import useCameraControls from './useCameraControls';
import useAnimation from '../../hooks/useAnimation';
import cameraUtils from '../../utils/cameraUtils';
import splineHelpers from '../../utils/splineHelpers';
import debugUtils from '../../utils/debugUtils';
import { getObjectId, isPortfolioDoor } from '../../utils/objectUtils';
import { BUTTON_IDS } from '../../constants/ids';

const { logger } = debugUtils;

/**
 * Composant de scène Spline avec contrôles de caméra améliorés
 */
const SplineScene = forwardRef(({ scenePath, onObjectClick, onLoad: propsOnLoad, qualityLevel, useCustomTouchControls }, ref) => {
  const splineRef = useRef(null);
  const cameraRef = useRef(null);
  const lastClickedButtonRef = useRef(null);
  
  
  // Utiliser les hooks personnalisés
  const {
    initializeCamera,
    handleWheel,
    handleMouseMove,
    handleTouchMove,
    handleTouchEnd,
    handleTouchStart,
    handleButtonClick,
    restorePreviousCameraState,
    moveCamera,
    directCameraMovement,
    toggleControls,
    restoreControlsOnly,
    isControlsEnabled,
    hasPreviousState
  } = useCameraControls(cameraRef, splineRef);
  
  const { animateCamera } = useAnimation();
  
  /**
   * Anime la caméra vers une position et rotation cibles
   * @param {Object} options - Options d'animation
   * @param {Object} options.position - Position cible {x, y, z}
   * @param {Object} options.rotation - Rotation cible en degrés {x, y, z}
   * @param {Number} options.duration - Durée de l'animation en ms
   * @param {Boolean} options.preventAutoReset - Si true, empêche tout retour automatique
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

  const toolbarButtonHistoryRef = useRef([]);
const sceneButtonHistoryRef = useRef([]); // Pour les boutons cliqués dans la scène Spline
const allButtonsHistoryRef = useRef({}); // Stockage de tous les boutons (scène + toolbar) avec timestamp

  
  // Exposer les méthodes aux composants parents via ref
  useImperativeHandle(ref, () => ({
    // Obtenir l'instance Spline
    getSplineInstance: () => splineRef.current,
    
    setLastClickedButton: (buttonId) => {
      if (buttonId) {
        logger.log(`Définition explicite du dernier bouton cliqué: ${buttonId}`);
        lastClickedButtonRef.current = buttonId;
        
        // Ajouter ce bouton à l'historique de la toolbar
        if (!toolbarButtonHistoryRef.current.includes(buttonId)) {
          toolbarButtonHistoryRef.current.push(buttonId);
        }
        
        // Stocker dans l'historique général avec un timestamp
        allButtonsHistoryRef.current[buttonId] = {
          timestamp: Date.now(),
          type: 'toolbar',
          name: 'Toolbar-' + buttonId
        };
        
        logger.log(`Historique de toolbar mis à jour:`, toolbarButtonHistoryRef.current);
        return true;
      }
      return false;
    },
    
    
    getToolbarButtonHistory: () => {
      return [...toolbarButtonHistoryRef.current];
    },
    
    getSceneButtonHistory: () => {
      return [...sceneButtonHistoryRef.current];
    },
    
    getAllButtonsHistory: () => {
      return {...allButtonsHistoryRef.current};
    },
    
    resetButtonState: (buttonId) => {
      if (!buttonId || !splineRef.current) return false;
      
      try {
        logger.log(`Réinitialisation de l'état du bouton: ${buttonId}`);
        splineHelpers.emitEvent(splineRef.current, 'start', buttonId);
        return true;
      } catch (e) {
        logger.error(`Erreur lors de la réinitialisation du bouton ${buttonId}:`, e);
        return false;
      }
    },
    
    clearAllButtonsHistory: () => {
      logger.log("Nettoyage de tous les historiques de boutons");
      toolbarButtonHistoryRef.current = [];
      sceneButtonHistoryRef.current = [];
      allButtonsHistoryRef.current = {};
      return true;
    },
    
    // Gestion des contrôles de caméra
    handleButtonClick,
    handleTouchStart,
    handleWheel, 
    // Gestionnaire souris - traite uniquement les événements souris
    handleMouseMove: (e) => {
      // Ignorer complètement les événements tactiles
      if (e.touches || e.isTouchEvent || e.type === 'touchmove') {
        return;
      }
      
      // Traitement normal des événements souris
      handleMouseMove(e);
    },

    handleTouchEnd: (e) => {
      // Gérer la fin du toucher
      if (handleTouchEnd) {
        handleTouchEnd(e);
      }
    },
    
    // Gestionnaire tactile - point unique de gestion des événements tactiles
    handleTouchMove: (e) => {
      // S'assurer que c'est bien un événement tactile
      if (!e.touches) {
        return;
      }

            
      // Si des contrôles tactiles personnalisés sont actifs, ne rien faire
      if (useCustomTouchControls || window.__advancedTouchControlsActive) {
        return;
      }
      
      // Passer directement l'événement tactile brut
      handleTouchMove(e);
    },
  
    restorePreviousCameraState,
    hasPreviousState,
    
    // Animation de caméra
    animateCamera: handleAnimateCamera,

    // Nouvelle fonction spécifique pour la vue portfolio
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
    
    // Exposer moveCamera pour permettre le déplacement direct
    moveCamera: (distance) => {
      if (typeof moveCamera === 'function') {
        return moveCamera(distance);
      }
      // Fallback : simuler un événement de défilement
      const simulatedEvent = { deltaY: distance };
      handleWheel(simulatedEvent);
      return true;
    },
    
   
    
    // Obtenir le dernier bouton cliqué
    getLastClickedButton: () => lastClickedButtonRef.current,
    
    // Vérifier si les contrôles sont activés
    isControlsEnabled: () => isControlsEnabled,

    restoreControlsOnly: () => {
      // Pas besoin de vérifier si la fonction existe, appelons-la directement
      toggleControls(true);  // Utiliser toggleControls pour activer les contrôles
     
      // Réinitialiser le dernier bouton cliqué si nécessaire
      if (splineRef.current && lastClickedButtonRef.current) {
        try {
                    
          // Réinitialiser la référence
          lastClickedButtonRef.current = null;
        } catch (error) {
          logger.error("Erreur lors de la réinitialisation du bouton:", error);
        }
      }
      
      return true;  // Toujours retourner true pour indiquer le succès
    },

    toggleCameraControls: (enabled) => {
      toggleControls(enabled);
      return true;
    },

    _setCameraControlsEnabled: (enabled) => {
      // Utiliser les méthodes que nous avons déjà
      if (enabled) {
        // Si on veut activer les contrôles, utiliser la fonction restorePreviousCameraState
        // qui réactive les contrôles sans animation
        restorePreviousCameraState(0);
      } else {
        // Si on veut désactiver les contrôles, utiliser handleButtonClick
        handleButtonClick();
      }
      
      logger.log(`Contrôles de caméra ${enabled ? 'activés' : 'désactivés'} manuellement`);
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
    
    // Appeler la fonction onLoad des props si elle existe
    if (propsOnLoad) {
      propsOnLoad(splineApp);
    }
  };
  
  /**
   * Gestionnaire pour les clics sur les objets Spline
   * @param {Object} e - Événement de clic
   */
  // Correction de l'erreur dans la fonction onSplineMouseUp de SplineScene.jsx
// Remplacez tout le contenu actuel de la fonction par ce qui suit:

/**
 * Gestionnaire pour les clics sur les objets Spline
 * Modification pour améliorer la gestion des clics sur mobile
 * @param {Object} e - Événement de clic
 */
const onSplineMouseUp = (e) => {
  // Ignorer l'événement si les flags d'interaction tactile sont actifs
  if (window.__isSwiping === true) {
    logger.log('Clic bloqué: flag __isSwiping actif');
    return;
  }
  
  // Ne pas traiter si l'événement ne contient pas de cible ou si le swipe est actif
  if (!e.target || window.__isSwipingActive === true) {
    logger.log("Clic ignoré: cible manquante ou swipe actif");
    
    // Arrêter la propagation pour éviter d'autres traitements
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    return;
  }
  
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

  // Détermination si c'est un bouton
  const buttonPatterns = [
    /BUTTON_/i, /DATAVIZ/i, /3D/i, /SITE/i, /PORTE_/i, /PRESTATIONS/i, /ABOUT/i
  ];
      
  const isButton = 
    Object.values(BUTTON_IDS).includes(objectId) || 
    buttonPatterns.some(pattern => pattern.test(objectName) || pattern.test(objectUuid));

  // Stocker le bouton dans l'historique si c'est un bouton
  if (objectId && isButton) {
    // Stocker ce bouton dans l'historique des boutons de scène
    if (!sceneButtonHistoryRef.current.includes(objectId)) {
      sceneButtonHistoryRef.current.push(objectId);
      logger.log(`Bouton de scène ${objectId} ajouté à l'historique`);
    }
    
    // Stocker aussi dans l'historique général avec un timestamp
    allButtonsHistoryRef.current[objectId] = {
      timestamp: Date.now(),
      type: 'scene',
      name: objectName
    };
  }
  
  // Pour le bouton portfolio
  if (isPortfolioButton) {
    logger.log("Bouton portfolio détecté - pas de désactivation des contrôles");
  }
  // Si ce n'est pas le bouton portfolio, gérer normalement
  else if (!isAutomaticDoorOpening && !isPortfolioDoorObj) {
    // Vérification des boutons comme avant
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
  
  // IMPORTANT: Forcer la désactivation du flag de swipe pour permettre
  // le traitement du clic actuel sans être bloqué
  window.__isSwipingActive = false;
  
  // Transmettre l'événement au parent avec l'ID en plus
  if (onObjectClick) {
    onObjectClick(objectName, splineRef.current, objectId);
  }
};
  
  // Effet pour initialiser/nettoyer les variables globales
  useEffect(() => {
    // Initialiser la variable globale au démarrage
    window.__automaticDoorOpening = false;
    
    // Nettoyer la variable globale au démontage
    return () => {
      delete window.__automaticDoorOpening;
    };
  }, []);
  
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        touchAction: 'none' // Ajouter cette propriété
      }}
      onWheel={handleWheel}
    onMouseMove={handleMouseMove}
        onTouchMove={(e) => {
      // Transmettre tous les événements tactiles à handleTouchMove
      if (e.touches) {
        handleTouchMove(e);
      }
    }}
    onTouchEnd={(e) => {
      // Important: gérer la fin du toucher
      if (handleTouchEnd) {
        handleTouchEnd(e);
      }
    }}
    onTouchStart={(e) => {
      // Utiliser notre nouvelle fonction handleTouchStart
      handleTouchStart(e);
    }}
  >
    <Spline
      scene={scenePath}
      onLoad={onLoad}
      onSplineMouseUp={onSplineMouseUp}
    />
  </div>
);
});

// Déplacer les PropTypes et l'export en dehors du composant
SplineScene.propTypes = {
  scenePath: PropTypes.string.isRequired,
  onObjectClick: PropTypes.func,
  onLoad: PropTypes.func,
  qualityLevel: PropTypes.string,
  useCustomTouchControls: PropTypes.bool
};

export default SplineScene;