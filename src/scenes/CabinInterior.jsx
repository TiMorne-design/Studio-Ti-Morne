/**
 * Composant principal pour l'intérieur du chalet
 * Optimisé pour desktop et mobile, avec utilisation des contextes
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SplineScene from '../components/spline/SplineScene';
import AboutOverlay from '../components/overlays/AboutOverlay';
import PrestationOverlay from '../components/overlays/PrestationOverlay';
import WelcomeOverlay from '../components/overlays/WelcomeOverlay';
import UnifiedOrientationOverlay from '../components/mobile/UnifiedOrientationOverlay';
import NavigationToolbar from '../components/layout/NavigationToolbar';
import ReturnButton from '../components/common/ReturnButton';
import MobileControls from '../components/mobile/MobileControls';
import MobileNavigationToolbar from '../components/mobile/MobileNavigationToolbar';
import LiteExperience from '../components/mobile/LiteExperience';
import { useSceneState } from '../contexts/SceneContext';
import useTouchManager from '../hooks/useTouchManager';
import useDeviceDetection from '../hooks/useDeviceDetection';
import useDoorTrigger from '../hooks/useDoorTrigger';
import { BUTTON_IDS, OBJECT_IDS } from '../constants/ids';
import { 
  VIEW_MAPPINGS, 
  getViewForObjectId,
  getDrawerForObjectId
} from '../constants/viewMappings';
import { 
  getObjectId, 
  getObjectType, 
  isPortfolioDoor 
} from '../utils/objectUtils';
import splineHelpers from '../utils/splineHelpers';
import cameraUtils from '../utils/cameraUtils';
import debugUtils from '../utils/debugUtils';
import { 
  DataVizContent, 
  SearchEngineContent, 
  Model3DContent, 
  AppDevContent
} from '../components/prestations/PrestationContents';

const { logger } = debugUtils;

/**
 * Fonction d'initialisation des contrôles tactiles avec le gestionnaire centralisé
 */
const initializeTouchControls = (rootElement, splineSceneRef, onObjectClick) => {
  if (!rootElement || !splineSceneRef.current) return () => {};
  
  // Obtenir les fonctions d'interaction de SplineScene
  const splineInstance = splineSceneRef.current;
  
  // Gestionnaire pour les événements de swipe
  const handleSwipe = (swipeEvent) => {
    if (splineInstance && splineInstance.handleTouchSwipe) {
      splineInstance.handleTouchSwipe(swipeEvent);
    }
  };
  
  // Gestionnaire pour les interactions avec les objets
  const handleObjectInteraction = (interaction) => {
    if (!splineInstance || !onObjectClick) return;
    
    if (interaction.type === 'tap') {
      // Simuler un clic sur objet Spline
      const target = interaction.target;
      const objectName = target.dataset?.objectName || '';
      const objectId = target.dataset?.objectId || '';
      
      if (objectName || objectId) {
        logger.log('Touch interaction avec objet:', objectName, objectId);
        onObjectClick(objectName, splineInstance.getSplineInstance(), objectId);
      }
    }
  };
  
  // Créer une instance de gestionnaire tactile
  const touchManager = useTouchManager({
    onSwipe: handleSwipe,
    onObjectInteraction: handleObjectInteraction
  });
  
  // Attacher les gestionnaires d'événements
  const cleanup = touchManager.attachTouchHandlers(rootElement);
  
  // Exposer globalement le contrôle de l'inertie pour pouvoir l'arrêter si nécessaire
  window.__stopTouchInertia = touchManager.stopInertia;
  
  // Fonction de nettoyage
  return () => {
    cleanup();
    delete window.__stopTouchInertia;
  };
};

/**
 * Composant de l'intérieur du chalet avec interactions 3D
 * Adaptation responsive pour mobile et desktop
 */
export default function CabinInterior() {
  const navigate = useNavigate();
  const splineSceneRef = useRef(null);
  const rootElementRef = useRef(null);
  
  // Détection de l'appareil
  const { 
    isMobile, 
    isTablet, 
    isLandscape, 
    isLowPerformance 
  } = useDeviceDetection();
  
  // États pour la gestion des contrôles et boutons
  const [showReturnButton, setShowReturnButton] = useState(false);
  const [activeButtonId, setActiveButtonId] = useState(null);
  const [showMobileGuide, setShowMobileGuide] = useState(true);
  const [lastCameraPosition, setLastCameraPosition] = useState(null);
  
  // États pour les overlays
  const [showAboutOverlay, setShowAboutOverlay] = useState(false);
  const [showPrestationOverlay, setShowPrestationOverlay] = useState(false);
  const [prestationContent, setPrestationContent] = useState(null);
  const [prestationTitle, setPrestationTitle] = useState('');
  const [showOrientationOverlay, setShowOrientationOverlay] = useState(true);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true);

  // État pour la qualité visuelle
  const [qualityLevel, setQualityLevel] = useState(
    isLowPerformance ? 'low' : isMobile ? 'medium' : 'high'
  );
  
  // Utiliser le contexte de scène pour l'état de la porte
  const { 
    doorState, 
    openDoor, 
    closeDoor, 
    viewMode, 
    changeViewMode 
  } = useSceneState();
  
  // Références
  const portfolioButtonClickedRef = useRef(false);
  const doorHasBeenOpenedOnce = useRef(false);
  
  // Utiliser le hook de déclenchement de porte
  const { emitDoorOpenEvent, emitDoorCloseEvent, checkProximity } = useDoorTrigger({ 
    splineRef: splineSceneRef 
  });
  
  /**
   * Fonction pour ouvrir la porte une seule fois
   */
  const openDoorOnce = useCallback(() => {
    // Vérifier si la porte a déjà été ouverte
    if (doorHasBeenOpenedOnce.current) {
      console.log("Porte déjà ouverte, émission bloquée");
      return false;
    }
    
    // Marquer que la porte a été ouverte
    doorHasBeenOpenedOnce.current = true;
    
    // Émettre l'événement avec notre hook
    emitDoorOpenEvent(OBJECT_IDS.PORTE_OUVERT, 'manual');
    
    // Définir la variable globale
    window.__doorIsOpen = true;
    return true;
  }, [emitDoorOpenEvent]);
  
  /**
   * Fonction pour vérifier la proximité de la porte et déclencher l'ouverture
   */
  const checkAndTriggerDoor = useCallback((doorId, camera, direction) => {
    // Vérifier d'abord si la porte a déjà été ouverte
    if (doorHasBeenOpenedOnce.current || window.__doorIsOpen === true || doorState.isOpen) {
      return false;
    }

    // Si le bouton portfolio a été récemment cliqué, ne pas déclencher l'ouverture automatique
    if (portfolioButtonClickedRef.current && doorId === OBJECT_IDS.PORTE_OUVERT) {
      return false;
    }
    
    if (!camera) return false;
    
    // Vérifier avec notre hook si la proximité déclenche la porte
    return checkProximity(camera, doorId);
  }, [checkProximity, doorState.isOpen]);
  
  /**
   * Gestion du défilement pour avancer/reculer
   */
  const handleWheel = useCallback((e) => {
    if (splineSceneRef.current) {
      splineSceneRef.current.handleWheel(e);
    }
  }, []);
  
  /**
   * Actions pour les boutons de navigation mobile
   */
  const handleMoveForward = useCallback(() => {
    // Arrêter l'inertie existante avant de déplacer la caméra
    if (window.__stopTouchInertia) {
      window.__stopTouchInertia();
    }
  
    if (!splineSceneRef.current) return;
    
    try {
      if (splineSceneRef.current.moveCamera) {
        splineSceneRef.current.moveCamera(-400);
      } else {
        const simulatedEvent = { deltaY: -300 };
        splineSceneRef.current.handleWheel(simulatedEvent);
      }
    } catch (error) {
      console.error("Erreur lors du déplacement vers l'avant:", error);
    }
  }, []);
  
  const handleMoveBackward = useCallback(() => {
    // Arrêter l'inertie existante avant de déplacer la caméra
    if (window.__stopTouchInertia) {
      window.__stopTouchInertia();
    }
    
    if (!splineSceneRef.current) return;
    
    try {
      if (splineSceneRef.current.moveCamera) {
        splineSceneRef.current.moveCamera(400);
      } else {
        const simulatedEvent = { deltaY: 300 };
        splineSceneRef.current.handleWheel(simulatedEvent);
      }
    } catch (error) {
      console.error("Erreur lors du déplacement vers l'arrière:", error);
    }
  }, []);
  
  /**
   * Gestion des overlays
   */
  const handleClosePrestationOverlay = useCallback(() => {
    setShowPrestationOverlay(false);
  }, []);
  
  const handleCloseAboutOverlay = useCallback(() => {
    setShowAboutOverlay(false);
  }, []);
  
  /**
   * Retourne à la position précédente de la caméra
   */
  const handleReturnToLastPosition = useCallback(() => {
    // Fermer tous les overlays
    setShowAboutOverlay(false);
    
    // Si un overlay de prestation est ouvert, le fermer
    if (showPrestationOverlay) {
      handleClosePrestationOverlay();
      
      // Pour les prestations, utiliser une position prédéfinie
      if (splineSceneRef.current && splineSceneRef.current.getSplineInstance) {
        const splineInstance = splineSceneRef.current.getSplineInstance();
        if (splineInstance) {
          // Position prédéfinie pour la vue "prestations"
          const prestationsPosition = { x: -200, y: 300, z: 200 };
          const prestationsRotation = { x: 0, y: 0, z: 0 };
          
          // Animation directe vers la position prestations
          splineSceneRef.current.animateCamera({
            position: prestationsPosition,
            rotation: prestationsRotation,
            duration: 1500
          });
          
          setTimeout(() => {
            if (splineSceneRef.current) {
              // Réactiver les contrôles
              splineSceneRef.current.restoreControlsOnly();
              
              // Réinitialiser le bouton actif
              if (splineInstance && activeButtonId) {
                setTimeout(() => {
                  logger.log(`Émission de l'événement start sur l'objet ${activeButtonId}`);
                  try {
                    splineHelpers.emitEvent(splineInstance, 'start', activeButtonId);
                  } catch (e) {
                    logger.error("Erreur lors de la réinitialisation du bouton:", e);
                  }
                }, 100);
              }
              
              // Réinitialiser l'état de l'UI
              setShowReturnButton(false);
              setActiveButtonId(null);
            }
          }, 1600);
        }
      }
      return;
    }
    
    // Avant la restauration, vérifier si nous sommes en mode portfolio
    const isInPortfolioMode = viewMode === 'portfolio';
    logger.log("Retour à la position précédente, mode portfolio:", isInPortfolioMode);
  
    if (splineSceneRef.current) {
      // Si nous sommes en mode portfolio, gérer ce cas spécial
      if (isInPortfolioMode) {
        logger.log("Mode portfolio détecté lors du retour - traitement spécial");
        
        // Réinitialiser le mode portfolio via le contexte
        changeViewMode('normal');
        
        // Pour le mode portfolio, ramener la caméra à une position neutre
        if (splineSceneRef.current.getSplineInstance) {
          const splineInstance = splineSceneRef.current.getSplineInstance();
          if (splineInstance) {
            // Position neutre
            const neutralPosition = { x: 0, y: 0, z: 900 };
            const neutralRotation = { x: 0, y: 0, z: 0 };
            
            // Animation directe vers la position neutre
            splineSceneRef.current.animateCamera({
              position: neutralPosition,
              rotation: neutralRotation,
              duration: 2000
            });
            
            // Réactiver les contrôles après l'animation
            setTimeout(() => {
              if (splineInstance.resumeAllControls) {
                splineInstance.resumeAllControls();
              }
              
              // Réinitialiser l'état de l'UI
              setShowReturnButton(false);
              setActiveButtonId(null);
            }, 2000);
            
            // Réinitialiser le bouton actif
            if (activeButtonId) {
              setTimeout(() => {
                logger.log(`Émission de l'événement start sur l'objet ${activeButtonId}`);
                try {
                  splineHelpers.emitEvent(splineInstance, 'start', activeButtonId);
                } catch (e) {
                  logger.error("Erreur lors de la réinitialisation du bouton:", e);
                }
              }, 100);
            }
          }
        }
      } else {
        // Cas standard - restaurer l'état précédent normalement
        splineSceneRef.current.restorePreviousCameraState();
        
        // Obtenir l'instance Spline
        const splineInstance = splineSceneRef.current.getSplineInstance();
        
        // Réinitialiser le bouton actif
        if (splineInstance && activeButtonId) {
          setTimeout(() => {
            logger.log(`Émission de l'événement start sur l'objet ${activeButtonId}`);
            try {
              splineHelpers.emitEvent(splineInstance, 'start', activeButtonId);
            } catch (e) {
              logger.error("Erreur lors de la réinitialisation du bouton:", e);
            }
          }, 100);
        }
        
        setShowReturnButton(false);
        setActiveButtonId(null);
      }
    }
  }, [showPrestationOverlay, handleClosePrestationOverlay, activeButtonId, viewMode, changeViewMode]);
  
  /**
   * Gère les clics sur les tiroirs de prestation
   */
  const handlePrestaButtonClick = useCallback((objectId, splineApp) => {
    // Obtenir la configuration du bouton à partir de l'ID
    const prestaConfig = getDrawerForObjectId(objectId);
    
    if (prestaConfig) {
      // Stocker explicitement les coordonnées actuelles de la caméra
      if (splineSceneRef.current) {
        const camera = splineSceneRef.current.getSplineInstance().camera;
        if (camera) {
          setLastCameraPosition({
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
          });
        }
      }
      
      // Associer le contenu de prestation au type
      const contentComponents = {
        "DataVizContent": <DataVizContent />,
        "SearchEngineContent": <SearchEngineContent />,
        "Model3DContent": <Model3DContent />,
        "AppDevContent": <AppDevContent />
      };
      
      // Définir le contenu et le titre
      setPrestationTitle(prestaConfig.title);
      setPrestationContent(contentComponents[prestaConfig.contentType] || null);
      setShowPrestationOverlay(true);
      
      // Afficher le bouton de retour
      setShowReturnButton(true);
      
      return true;
    }
    
    return false;
  }, []);
  
  /**
   * Animation de la caméra vers une position spécifique
   */
  const animateCameraToView = useCallback((viewName, buttonId, showButton = true) => {
    if (!splineSceneRef.current) return;
    
    const splineApp = splineSceneRef.current.getSplineInstance();
    if (!splineApp) return;
    
    try {
      // Récupérer la configuration de la vue
      const viewConfig = VIEW_MAPPINGS[viewName];
      
      if (!viewConfig) {
        logger.error(`Configuration de vue non trouvée pour: ${viewName}`);
        return;
      }
      
      // Utiliser le préfixe de caméra depuis la configuration
      const cameraPrefix = viewConfig.cameraVariablePrefix || viewName;
      logger.log(`Animation vers la vue: ${viewName}, préfixe: ${cameraPrefix}`);
      
      // Extraire les paramètres de caméra
      const cameraParams = cameraUtils.extractCameraParameters(splineApp, cameraPrefix);
      
      if (cameraParams) {
        // Masquer le guide mobile si présent
        if (showMobileGuide) {
          setShowMobileGuide(false);
        }
        
        // Changer le mode de vue via le contexte
        changeViewMode(viewName);
        
        // Animer la caméra
        splineSceneRef.current.animateCamera({
          position: cameraParams.position,
          rotation: cameraParams.rotation,
          duration: isMobile ? 1500 : 2000
        });
        
        // Mettre à jour l'état du bouton actif
        setActiveButtonId(buttonId);
        
        // Afficher le bouton de retour après l'animation si demandé
        if (showButton) {
          setTimeout(() => {
            setShowReturnButton(true);
          }, isMobile ? 1500 : 2000);
        }
      } else {
        logger.error(`Paramètres de caméra non trouvés pour la vue: ${viewName}`);
      }
    } catch (error) {
      logger.error(`Erreur lors de l'animation de la caméra pour ${viewName}:`, error);
    }
  }, [isMobile, showMobileGuide, changeViewMode]);
  
  /**
   * Gère la navigation depuis la barre d'outils
   */
  const handleToolbarNavigation = useCallback((view) => {
    logger.log(`Navigation vers la vue: ${view}`);
    
    // Fermer les overlays
    setShowAboutOverlay(false);
    if (showPrestationOverlay) {
      handleClosePrestationOverlay();
    }
    
    // Obtenir l'instance Spline
    if (splineSceneRef.current) {
      // Capturer les positions actuelles de la caméra
      splineSceneRef.current.handleButtonClick();
      
      // Obtenir la configuration de vue
      const viewConfig = VIEW_MAPPINGS[view];
      
      if (viewConfig) {
        // Animer la caméra vers la position cible
        animateCameraToView(view, viewConfig.buttonId);
        
        // Actions spéciales pour certaines vues
        if (view === 'about') {
          // Afficher l'overlay About après l'animation
          setTimeout(() => {
            setShowAboutOverlay(true);
          }, isMobile ? 1500 : 2000);
        }
      }
    }
  }, [showPrestationOverlay, handleClosePrestationOverlay, animateCameraToView, isMobile]);
  
  /**
   * Gère les clics sur les objets de la scène
   */
  const handleObjectClick = useCallback((objectName, splineApp, objectId = null) => {
    // Obtenir l'ID de l'objet
    const resolvedObjectId = objectId || getObjectId(objectName);
    
    // Identifier les types d'objets spéciaux
    const isPortfolioButton = (objectName === 'BUTTON_PORTFOLIO' || 
      objectName.includes('BUTTON_PORTFOLIO')) && 
      resolvedObjectId === BUTTON_IDS.PORTFOLIO;

    const isPortfolioDoorObj = objectName === 'PORTE_OUVERT' || 
      objectName.includes('PORTE_OUVERT');

    logger.log("Objet cliqué:", objectName, "ID:", resolvedObjectId);
    
    // Masquer le guide mobile après la première interaction
    if (showMobileGuide) {
      setShowMobileGuide(false);
    }
      
    // Déterminer le type d'objet
    const objectType = getObjectType(resolvedObjectId, objectName);
    
    // Gérer les clics sur les tiroirs de prestation
    const isPrestaDrawer = handlePrestaButtonClick(resolvedObjectId, splineApp);
    if (isPrestaDrawer) return;
    
    // Déterminer la vue cible
    const viewConfig = getViewForObjectId(resolvedObjectId);
    
    // S'il y a une configuration de vue
    if (viewConfig) {
      logger.log("Configuration de vue trouvée:", viewConfig);
      
      // Traitement spécial pour certaines vues
      if (viewConfig.viewName === 'about') {
        // Afficher l'overlay About après l'animation
        setTimeout(() => {
          setShowAboutOverlay(true);
        }, isMobile ? 1500 : 2000);
      }
      
      // Gestion spéciale pour le portfolio
      if (viewConfig.viewName === 'portfolio') {
        if (isPortfolioButton) {
          logger.log("Traitement spécial pour le bouton portfolio");
          
          // Marquer que le bouton portfolio a été cliqué
          portfolioButtonClickedRef.current = true;
          window.__manualPortfolioButtonClick = true;

          // Marquer la porte comme ouverte via le contexte
          openDoor('manual');
          doorHasBeenOpenedOnce.current = true;
          window.__doorIsOpen = true; 
          
          // Réinitialiser le flag après un délai
          setTimeout(() => {
            portfolioButtonClickedRef.current = false;
          }, 5000);
          
          // Changer le mode de vue
          changeViewMode('portfolio');
          
          // Animer la caméra sans sauvegarder l'état précédent
          if (splineSceneRef.current) {
            const portfolioParams = cameraUtils.extractCameraParameters(splineApp, 'portfolio');
            
            if (portfolioParams) {
              const success = splineSceneRef.current.moveToPortfolioView(portfolioParams);
              
              if (success) {
                setActiveButtonId(BUTTON_IDS.PORTFOLIO);
                setShowReturnButton(false);
              }
            }
          }
          return;
        } 
        // Gestion de la porte portfolio (clic manuel)
        else if (isPortfolioDoorObj) {
          // Vérifier si la porte est déjà ouverte
          if (doorState.isOpen || doorHasBeenOpenedOnce.current) {
            logger.log("La porte est déjà ouverte, le clic est ignoré");
            return;
          }
          
          // Si ce n'est pas un déclenchement automatique, marquer la porte comme ouverte
          if (doorState.openSource !== 'proximity') {
            openDoor('manual');
            doorHasBeenOpenedOnce.current = true;
            window.__doorIsOpen = true;
            console.log("FLAG PORTE OUVERTE ACTIVÉ (clic manuel)");
            logger.log("Clic manuel sur la porte portfolio");
          }
          
          return;
        }
      } else {
        // Cas standard pour les autres vues
        if (splineSceneRef.current) {
          splineSceneRef.current.handleButtonClick();
        }
        animateCameraToView(viewConfig.viewName, viewConfig.buttonId, true);
      }
    }
  }, [handlePrestaButtonClick, animateCameraToView, isMobile, showMobileGuide, doorState.isOpen, doorState.openSource, openDoor, changeViewMode]);

  /**
   * Modifie le niveau de qualité
   */
  const handleQualityChange = useCallback((level) => {
    setQualityLevel(level);
  }, []);
  
  // Effet pour cacher le guide mobile après un délai
  useEffect(() => {
    if (isMobile && showMobileGuide) {
      const timer = setTimeout(() => {
        setShowMobileGuide(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, showMobileGuide]);
  
  // Effet pour initialiser les contrôles tactiles
  useEffect(() => {
    // Initialiser les variables globales
    window.__doorThresholdTriggered = false;
    window.__portfolioDoorLocked = false;
    window.__manualPortfolioButtonClick = false;
    window.__portfolioMode = false;
    window.__doorIsOpen = false;
    
    // Initialiser les contrôles tactiles si c'est un appareil mobile
    if ((isMobile || isTablet) && rootElementRef.current) {
      logger.log("Initialisation des contrôles tactiles avec le nouveau gestionnaire");
      
      const cleanup = initializeTouchControls(
        rootElementRef.current, 
        splineSceneRef,
        handleObjectClick
      );
      
      return () => {
        // Nettoyer les contrôles tactiles
        cleanup();
        
        // Nettoyer les variables globales
        delete window.__doorThresholdTriggered;
        delete window.__portfolioDoorLocked;
        delete window.__manualPortfolioButtonClick;
        delete window.__portfolioMode;
        delete window.__doorIsOpen;
      };
    }
    
    return () => {
      // Nettoyer les variables globales
      delete window.__doorThresholdTriggered;
      delete window.__portfolioDoorLocked;
      delete window.__manualPortfolioButtonClick;
      delete window.__portfolioMode;
      delete window.__doorIsOpen;
    };
  }, [isMobile, isTablet, handleObjectClick]);
  
  // Effet pour vérifier régulièrement la proximité de la porte
  useEffect(() => {
    const checkProximityInterval = () => {
      // Vérifier si la porte est déjà ouverte
      if (doorHasBeenOpenedOnce.current || doorState.isOpen) {
        return;
      }

      // Si le bouton portfolio a été récemment cliqué, ne pas vérifier la proximité
      if (portfolioButtonClickedRef.current) {
        return;
      }
      
      if (!splineSceneRef.current || !splineSceneRef.current.getSplineInstance) return;
      
      const splineApp = splineSceneRef.current.getSplineInstance();
      if (!splineApp || !splineApp.camera) return;
      
      // Vérifier la proximité avec la porte portfolio
      checkAndTriggerDoor(OBJECT_IDS.PORTE_OUVERT, splineApp.camera, 1);
    };
    
    // Mettre en place un intervalle pour vérifier la proximité
    const proximityCheckInterval = setInterval(checkProximityInterval, 500);
    
    // Nettoyer l'intervalle lors du démontage
    return () => {
      clearInterval(proximityCheckInterval);
    };
  }, [checkAndTriggerDoor, doorState.isOpen]);
  
  // Si l'appareil est trop peu puissant, afficher l'expérience allégée
  const preferFullExperience = localStorage.getItem('preferFullExperience') === 'true';
  if (isLowPerformance && !preferFullExperience) {
    return (
      <LiteExperience 
        onNavigate={handleToolbarNavigation}
        onEnterFullExperience={() => {
          // Définir un niveau de qualité bas et forcer l'expérience complète
          setQualityLevel('low');
          
          try {
            localStorage.setItem('preferFullExperience', 'true');
            console.log("Préférence d'expérience complète enregistrée");
          } catch (e) {
            console.error("Erreur lors de l'enregistrement de la préférence:", e);
          }
          
          // Forcer un rechargement
          setTimeout(() => {
            window.location.href = window.location.pathname;
          }, 100);
        }}
      />
    );
  }
  
  return (
    <div 
      ref={rootElementRef}
      style={{ position: 'relative', width: '100%', height: '100vh' }}
      className="cabin-interior-container touch-enabled"
    >
      <SplineScene
        ref={splineSceneRef}
        scenePath="https://prod.spline.design/caI3XJc8z6B-FFGA/scene.splinecode"
        onObjectClick={handleObjectClick}
        qualityLevel={qualityLevel}
      />
      
      {/* Navigation adaptative */}
      {isMobile || isTablet ? (
        <MobileNavigationToolbar 
          onNavigate={handleToolbarNavigation} 
          activeButtonId={activeButtonId}
        />
      ) : (
        <NavigationToolbar 
          onNavigate={handleToolbarNavigation}
          isCameraControlsDisabled={!splineSceneRef.current?.isControlsEnabled}
        />
      )}
      
      {/* Bouton de retour à la position précédente */}
      {showReturnButton && (
        <ReturnButton 
          onClick={handleReturnToLastPosition} 
          style={{ scale: isMobile ? '0.9' : '1' }}
        />
      )}
      
      {/* Overlays */}
      {showAboutOverlay && (
        <AboutOverlay 
          onClose={handleCloseAboutOverlay}
          isMobile={isMobile}
        />
      )}
      
      {showPrestationOverlay && (
        <PrestationOverlay 
          title={prestationTitle}
          content={prestationContent}
          onClose={handleClosePrestationOverlay}
          isMobile={isMobile}
        />
      )}
  
      {/* Overlay de bienvenue */}
      {showWelcomeOverlay && (
        <WelcomeOverlay 
          onClose={() => setShowWelcomeOverlay(false)}
          autoHideTime={15000} // 15 secondes avant disparition automatique
        />
      )}
      
      {/* Guide de swipe sur mobile */}
      {(isMobile || isTablet) && showMobileGuide && (
        <div className="mobile-guide">
          <div className="mobile-guide-content">
            <p>Glissez vers le haut/bas pour vous déplacer</p>
            <p>Tapez sur les objets pour interagir</p>
          </div>
        </div>
      )}
      
      {/* Contrôles de mouvement sur mobile - optimisés avec le nouveau gestionnaire tactile */}
      {(isMobile || isTablet) && !showAboutOverlay && !showPrestationOverlay && 
        !showWelcomeOverlay && !showOrientationOverlay && (
        <MobileControls
          onMoveForward={handleMoveForward}
          onMoveBackward={handleMoveBackward}
        />
      )}
        
      {/* Sélecteur de qualité pour les appareils mobiles */}
      {(isMobile || isTablet) && (
        <div className="quality-toggle">
          <button 
            className={qualityLevel === 'low' ? 'active' : ''}
            onClick={() => handleQualityChange('low')}
          >
            Basse
          </button>
          <button 
            className={qualityLevel === 'medium' ? 'active' : ''}
            onClick={() => handleQualityChange('medium')}
          >
            Moyenne
          </button>
          <button 
            className={qualityLevel === 'high' ? 'active' : ''}
            onClick={() => handleQualityChange('high')}
          >
            Haute
          </button>
        </div>
      )}
  
      {/* Overlay d'orientation pour les appareils mobiles en mode portrait */}
      {(isMobile || isTablet) && !isLandscape && showOrientationOverlay && (
        <UnifiedOrientationOverlay 
          onClose={() => setShowOrientationOverlay(false)}
          autoHideTime={10000}
        />
      )}
    </div>
  );
}