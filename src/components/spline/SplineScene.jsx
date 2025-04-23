/**
 * Composant SplineScene
 * Gère le rendu et les interactions avec la scène Spline
 */
import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Spline from '@splinetool/react-spline';
import MouseControls from '../controls/MouseControls';
import TouchControls from '../controls/TouchControls';
import useAnimation from '../../hooks/useAnimation';
import splineHelpers from '../../utils/splineHelpers';
import debugUtils from '../../utils/debugUtils';
import { getObjectId, isPortfolioDoor } from '../../utils/objectUtils';
import { BUTTON_IDS } from '../../constants/ids';
import useDeviceDetection from '../../hooks/useDeviceDetection';

const { logger } = debugUtils;

/**
 * Composant de scène Spline avec contrôles adaptés à tous les appareils
 */
const SplineScene = forwardRef(({ scenePath, onObjectClick, onLoad: propsOnLoad, qualityLevel }, ref) => {
  const splineRef = useRef(null);
  const cameraRef = useRef(null);
  const lastClickedButtonRef = useRef(null);
  const { isMobile, isTablet } = useDeviceDetection();
  
  // État pour la détection du type de contrôle actif
  const [controlType, setControlType] = useState('mouse');
  
  // Limites de la caméra
  const cameraLimits = {
    minZ: -3200,      // Limite avant (fond du chalet)
    maxZ: 1200,       // Limite arrière (extérieur de la terrasse)
    doorThreshold: -800, // Seuil de la porte
    doorTrigger: -400  // Position de déclenchement de la porte
  };
  
  // Utiliser les hooks de contrôle
  const mouseControls = MouseControls({
    cameraRef,
    splineRef,
    onCameraChange: (state) => {
      // Callback pour les changements de caméra (optionnel)
    }
  });
  
  const touchControls = TouchControls({
    onCameraRotate: (e) => {
      if (mouseControls.isControlsEnabled) {
        mouseControls.handleMouseMove(e);
      }
    },
    onCameraMove: (distance) => {
      if (mouseControls.isControlsEnabled) {
        mouseControls.moveCamera(distance);
      }
    },
    splineRef,
    limits: cameraLimits
  });
  
  const { animateCamera } = useAnimation();
  
  // Fonction pour déterminer le type de contrôle actif
  const updateControlType = () => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    setControlType(isTouchDevice || isMobile || isTablet ? 'touch' : 'mouse');
  };
  
  useEffect(() => {
    // Détecter le type d'appareil au montage
    updateControlType();
    
    // Ajouter un listener pour détecter les changements (rotation d'écran, etc.)
    window.addEventListener('resize', updateControlType);
    
    return () => {
      window.removeEventListener('resize', updateControlType);
    };
  }, [isMobile, isTablet]);
  
  /**
   * Anime la caméra vers une position et rotation cibles
   */
  const handleAnimateCamera = ({ position, rotation, duration = 2000 }) => {
    if (!cameraRef.current) {
      logger.warn("Impossible d'animer la caméra: référence caméra manquante");
      return;
    }
    
    logger.log("Animation de la caméra:", {
      positionCible: position,
      rotationCible: rotation,
      durée: duration
    });
    
    mouseControls.animateCamera({ position, rotation, duration });
  };
  
  // Exposer les méthodes aux composants parents via ref
  useImperativeHandle(ref, () => ({
    // Obtenir l'instance Spline
    getSplineInstance: () => splineRef.current,
    
    // Gestion des contrôles de caméra
    handleButtonClick: mouseControls.handleButtonClick,
    
    // Contrôles de mouvement
    handleWheel: (e) => {
      if (controlType === 'mouse') {
        mouseControls.handleWheel(e);
      }
    },
    
    handleMouseMove: (e) => {
      if (controlType === 'mouse') {
        mouseControls.handleMouseMove(e);
      }
    },
    
    // Gestion des états
    restorePreviousCameraState: mouseControls.restorePreviousCameraState,
    hasPreviousState: mouseControls.hasPreviousState,
    
    // Animation de caméra
    animateCamera: handleAnimateCamera,
    
    // Vue portfolio spécifique
    moveToPortfolioView: (portfolioParams) => {
      if (!cameraRef.current) {
        logger.warn("Impossible d'animer la caméra vers portfolio: référence caméra manquante");
        return false;
      }
      
      // Convertir les rotations de degrés (format Spline) en radians (format Three.js/React)
      const convertedRotation = {
        x: portfolioParams.rotation.x * Math.PI / 180,
        y: portfolioParams.rotation.y * Math.PI / 180,
        z: portfolioParams.rotation.z * Math.PI / 180
      };
      
      mouseControls.animateCamera({
        position: portfolioParams.position,
        rotation: {
          x: portfolioParams.rotation.x,
          y: portfolioParams.rotation.y,
          z: portfolioParams.rotation.z
        },
        duration: 2000
      });
      
      return true;
    },
    
    // Déplacement de caméra
    moveCamera: (distance) => {
      mouseControls.moveCamera(distance);
      return true;
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
          
          return false;
        } catch (error) {
          logger.error("Erreur lors de la réinitialisation des états de caméra:", error);
          return false;
        }
      }
      
      return false;
    },
    
    // Gestion des contrôles
    isControlsEnabled: mouseControls.isControlsEnabled,
    restoreControlsOnly: mouseControls.restoreControlsOnly,
    toggleCameraControls: (enabled) => {
      mouseControls.setControlsEnabled(enabled);
      touchControls.setEnabled(enabled);
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
    
    // Tenter de trouver la caméra
    const camera = splineApp.findObjectByName("Character") || splineApp.camera;
    
    if (camera) {
      cameraRef.current = camera;
      mouseControls.initializeCamera(camera);
    } else {
      logger.error('Aucune caméra disponible dans la scène Spline');
    }
    
    // Appliquer la qualité visuelle si spécifiée
    if (qualityLevel && splineApp.setQuality) {
      try {
        logger.log(`Application du niveau de qualité: ${qualityLevel}`);
        splineApp.setQuality(qualityLevel);
      } catch (error) {
        logger.error("Erreur lors de l'application du niveau de qualité:", error);
      }
    }
    
    // Attacher les contrôles tactiles si nécessaire
    if (controlType === 'touch') {
      touchControls.attachTouchListeners(window);
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
  
    // Pour le bouton portfolio, nous ne faisons rien de spécial ici
    if (isPortfolioButton) {
      logger.log("Bouton portfolio détecté - pas de désactivation des contrôles");
    }
    // Si ce n'est pas le bouton portfolio, gérer normalement
    else if (!isAutomaticDoorOpening && !isPortfolioDoorObj) {
      // Vérification des boutons
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
        mouseControls.handleButtonClick();
        touchControls.setEnabled(false);
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
    // Initialiser la variable globale au démarrage
    window.__automaticDoorOpening = false;
    
    // Nettoyer la variable globale au démontage
    return () => {
      delete window.__automaticDoorOpening;
      
      // Arrêter l'inertie tactile si elle est active
      if (touchControls.stopInertia) {
        touchControls.stopInertia();
      }
    };
  }, [touchControls]);
  
  // Composant MobileControls si nécessaire
  const MobileControls = controlType === 'touch' ? touchControls.MobileControls : null;
  
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative'
      }}
      onWheel={mouseControls.handleWheel}
      onMouseMove={mouseControls.handleMouseMove}
    >
      <Spline
        scene={scenePath}
        onLoad={onLoad}
        onSplineMouseUp={onSplineMouseUp}
      />
      
      {/* Rendu conditionnel des contrôles mobiles */}
      {controlType === 'touch' && MobileControls && (
        <MobileControls
          onMoveForward={() => mouseControls.moveCamera(-400)}
          onMoveBackward={() => mouseControls.moveCamera(400)}
        />
      )}
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