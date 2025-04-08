/**
 * Composant principal pour l'intérieur du chalet
 * Optimisé pour desktop et mobile
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SplineScene from '../components/spline/SplineScene';
import AboutOverlay from '../components/overlays/AboutOverlay';
import PrestationOverlay from '../components/overlays/PrestationOverlay';
import InitialOrientationOverlay from '../components/mobile/InitialOrientationOverlay';
import NavigationToolbar from '../components/layout/NavigationToolbar';
import ReturnButton from '../components/common/ReturnButton';
import MobileControls from '../components/mobile/MobileControls';
import MobileNavigationToolbar from '../components/mobile/MobileNavigationToolbar';
import OrientationPrompt from '../components/mobile/OrientationPrompt';
import LiteExperience from '../components/mobile/LiteExperience';
import { BUTTON_IDS, OBJECT_TYPES } from '../constants/ids';
import { 
  VIEW_MAPPINGS, 
  getViewForObjectName,
  getViewForObjectId,
  getDrawerForObjectName,
  getDrawerForObjectId
} from '../constants/viewMappings';
import { 
  getObjectId, 
  getObjectType, 
  isPortfolioDoor 
} from '../utils/objectUtils';
import useDeviceDetection from '../hooks/useDeviceDetection';
import useTouchControls from '../hooks/useTouchControls';
import useDoorTrigger from '../hooks/useDoorTrigger';
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
 * Composant de l'intérieur du chalet avec interactions 3D
 * Adaptation responsive pour mobile et desktop
 */
export default function CabinInterior() {
  const navigate = useNavigate();
  const splineSceneRef = useRef(null);
  
  // Détection de l'appareil - UNE SEULE FOIS
  const { 
    isMobile, 
    isTablet, 
    isLandscape, 
    isLowPerformance 
  } = useDeviceDetection();
  
  // États pour la gestion des contrôles et boutons
  const [showReturnButton, setShowReturnButton] = useState(false);
  const [activeButtonId, setActiveButtonId] = useState(null);
  const [activeDrawerId, setActiveDrawerId] = useState(null);
  const [showMobileGuide, setShowMobileGuide] = useState(true);
  
  // États pour les overlays
  const [showAboutOverlay, setShowAboutOverlay] = useState(false);
  const [showPrestationOverlay, setShowPrestationOverlay] = useState(false);
  const [prestationContent, setPrestationContent] = useState(null);
  const [prestationTitle, setPrestationTitle] = useState('');
  const [showInitialOrientationOverlay, setShowInitialOrientationOverlay] = useState(true);
  
  // État pour la qualité visuelle (pour les appareils moins puissants)
  const [qualityLevel, setQualityLevel] = useState(
    isLowPerformance ? 'low' : isMobile ? 'medium' : 'high'
  );
  
  // Utiliser le hook de déclenchement de porte
  const { triggerDoor } = useDoorTrigger({ splineRef: splineSceneRef });
  
  /**
   * Gestion du défilement pour avancer/reculer
   * @param {WheelEvent} e - Événement de défilement
   */
  const handleWheel = useCallback((e) => {
    if (splineSceneRef.current) {
      splineSceneRef.current.handleWheel(e);
    }
  }, []);
  
  // Utiliser le hook des contrôles tactiles APRÈS la définition de handleWheel
  const { attachTouchListeners } = useTouchControls({
  onScroll: handleWheel,
  onMouseMove: (e) => {
    if (splineSceneRef.current) {
      splineSceneRef.current.handleMouseMove(e);
    }
  },
  sensitivity: isMobile ? 3 : 2
});
  
  /**
   * Actions pour les boutons de navigation mobile
   */
  const handleMoveForward = useCallback(() => {
    if (!splineSceneRef.current) return;
    
    try {
      // Utiliser moveCamera directement si disponible
      if (splineSceneRef.current.moveCamera) {
        splineSceneRef.current.moveCamera(-400); // Valeur négative pour avancer
      } else {
        // Fallback vers la méthode actuelle
        const simulatedEvent = { deltaY: -300 };
        splineSceneRef.current.handleWheel(simulatedEvent);
      }
    } catch (error) {
      console.error("Erreur lors du déplacement vers l'avant:", error);
    }
  }, []);
  
  const handleMoveBackward = useCallback(() => {
    if (!splineSceneRef.current) return;
    
    try {
      // Utiliser moveCamera directement si disponible
      if (splineSceneRef.current.moveCamera) {
        splineSceneRef.current.moveCamera(400); // Valeur positive pour reculer
      } else {
        // Fallback vers la méthode actuelle
        const simulatedEvent = { deltaY: 300 };
        splineSceneRef.current.handleWheel(simulatedEvent);
      }
    } catch (error) {
      console.error("Erreur lors du déplacement vers l'arrière:", error);
    }
  }, []);
  
  /**
   * Ferme l'overlay de prestation et utilise mouseDown pour fermer le tiroir
   */
  const handleClosePrestationOverlay = useCallback(() => {
    // Fermer l'overlay d'abord
    setShowPrestationOverlay(false);
    
    // Émettre un événement mouseDown sur le tiroir actif pour le fermer
    if (activeDrawerId && splineSceneRef.current) {
      const splineApp = splineSceneRef.current.getSplineInstance();
      if (splineApp) {
        try {
          logger.log(`Émission de l'événement mouseDown sur le tiroir ${activeDrawerId}`);
          splineHelpers.emitEvent(splineApp, 'mouseDown', activeDrawerId);
        } catch (e) {
          logger.error("Erreur lors de la fermeture du tiroir:", e);
        }
      }
    }
    
    // Réinitialiser l'ID du tiroir actif
    setActiveDrawerId(null);
  }, [activeDrawerId]);
  
  /**
   * Ferme l'overlay À propos
   */
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
    }
    
        // Avant la restauration, vérifier si nous sommes en mode portfolio
  const isInPortfolioMode = window.__portfolioMode === true;
  logger.log("Retour à la position précédente, mode portfolio:", isInPortfolioMode);

  if (splineSceneRef.current) {
    // Si nous sommes en mode portfolio, gérer ce cas spécial
    if (isInPortfolioMode) {
      logger.log("Mode portfolio détecté lors du retour - traitement spécial");
      
      // Réinitialiser le mode portfolio avant toute autre action
      window.__portfolioMode = false;
      
      // Pour le mode portfolio, simplement ramener la caméra à une position neutre
      // sans essayer de restaurer un état précédent
      if (splineSceneRef.current.getSplineInstance) {
        const splineInstance = splineSceneRef.current.getSplineInstance();
        if (splineInstance) {
          // Position neutre (par exemple, la position initiale sur la terrasse)
          const neutralPosition = {
            x: 0,
            y: 0,
            z: 800 // Position sur la terrasse
          };
          
          const neutralRotation = {
            x: 0,
            y: 0,
            z: 0
          };
          
          // Animation directe vers la position neutre
          splineSceneRef.current.animateCamera({
            position: neutralPosition,
            rotation: neutralRotation,
            duration: 2000
          });
          
          // Réactiver les contrôles
          // On attendra la fin de l'animation
          setTimeout(() => {
            // Si splineInstance a une méthode pour réactiver les contrôles, l'utiliser
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
  }, [showPrestationOverlay, handleClosePrestationOverlay, activeButtonId]);
  
  /**
   * Gère les clics sur les tiroirs de prestation
   * @param {String} objectId - ID de l'objet cliqué
 * @param {Object} splineApp - Instance Spline
 * @returns {Boolean} - true si l'objet est un tiroir de prestation
 */
const handlePrestaDrawerClick = useCallback((objectId, splineApp) => {
  // Obtenir la configuration du tiroir à partir de l'ID d'objet
  const drawerConfig = getDrawerForObjectId(objectId);
  
  if (drawerConfig) {
    // Associer le contenu de prestation au type
    const contentComponents = {
      "DataVizContent": <DataVizContent />,
      "SearchEngineContent": <SearchEngineContent />,
      "Model3DContent": <Model3DContent />,
      "AppDevContent": <AppDevContent />
    };
    
    // Définir le contenu et le titre
    setPrestationTitle(drawerConfig.title);
    setPrestationContent(contentComponents[drawerConfig.contentType] || null);
    setShowPrestationOverlay(true);
    setActiveDrawerId(drawerConfig.id);
    
    return true;
  }
  
  return false;
}, []);
  
  /**
   * Fonction commune pour animer la caméra vers une position
   * @param {String} viewName - Nom de la vue
   * @param {String} buttonId - ID du bouton associé
   * @param {Boolean} showButton - Indique si le bouton de retour doit être affiché
   */
  const animateCameraToView = useCallback((viewName, buttonId, showButton = true) => {
    if (!splineSceneRef.current) return;
    
    const splineApp = splineSceneRef.current.getSplineInstance();
    if (!splineApp) return;
    
    try {
      // Récupérer la configuration complète de la vue pour obtenir le préfixe correct
      const viewConfig = VIEW_MAPPINGS[viewName];
      
      if (!viewConfig) {
        logger.error(`Configuration de vue non trouvée pour: ${viewName}`);
        return;
      }
      
      // Utiliser le préfixe de caméra depuis la configuration
      const cameraPrefix = viewConfig.cameraVariablePrefix || viewName;
      logger.log(`Animation vers la vue: ${viewName}, préfixe: ${cameraPrefix}`);
      
      // Extraire les paramètres de caméra avec le préfixe correct
      const cameraParams = cameraUtils.extractCameraParameters(splineApp, cameraPrefix);
      
      if (cameraParams) {
        // Masquer le guide mobile si présent
        if (showMobileGuide) {
          setShowMobileGuide(false);
        }
        
        // Utiliser la fonction animateCamera accessible via la ref
        splineSceneRef.current.animateCamera({
          position: cameraParams.position,
          rotation: cameraParams.rotation,
          duration: isMobile ? 1500 : 2000 // Animation plus rapide sur mobile
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
        logger.error(`Paramètres de caméra non trouvés pour la vue: ${viewName} avec préfixe: ${cameraPrefix}`);
      }
    } catch (error) {
      logger.error(`Erreur lors de l'animation de la caméra pour ${viewName}:`, error);
    }
  }, [isMobile, showMobileGuide]);
  
  /**
   * Gère la navigation depuis la barre d'outils
   * @param {String} view - Nom de la vue
   */
  const handleToolbarNavigation = useCallback((view) => {
    logger.log(`Navigation vers la vue: ${view}`);
    
    // Si un overlay est ouvert, on le ferme
    setShowAboutOverlay(false);
    if (showPrestationOverlay) {
      handleClosePrestationOverlay();
    }
    
    // Obtenir l'instance Spline
    if (splineSceneRef.current) {
      // Capturer les positions actuelles de la caméra avant toute animation
      splineSceneRef.current.handleButtonClick();
      
      // Obtenir la configuration de vue
      const viewConfig = VIEW_MAPPINGS[view];
      
      if (viewConfig) {
        // Animer la caméra vers la position cible
        animateCameraToView(view, viewConfig.buttonId);
        
        // Actions spéciales pour certaines vues
        if (view === 'about') {
          // Afficher l'overlay About après l'animation de la caméra
          setTimeout(() => {
            setShowAboutOverlay(true);
          }, isMobile ? 1500 : 2000);
        }
      }
    }
  }, [showPrestationOverlay, handleClosePrestationOverlay, animateCameraToView, isMobile]);
  
  /**
   * Gère les clics sur les objets de la scène
   * @param {String} objectName - Nom de l'objet cliqué
   * @param {Object} splineApp - Instance Spline
   */
  const handleObjectClick = useCallback((objectName, splineApp, objectId = null) => {
    // Obtenir l'ID de l'objet si non fourni
    const resolvedObjectId = objectId || getObjectId(objectName);
    
    // Vérifier si c'est le bouton portfolio
    const isPortfolioButton = (objectName === 'BUTTON_PORTFOLIO' || objectName.includes('BUTTON_PORTFOLIO')) && 
      resolvedObjectId === BUTTON_IDS.PORTFOLIO;
  
    // Si c'est le bouton portfolio, définir immédiatement le flag
    if (isPortfolioButton) {
      logger.log("Mode portfolio activé");
      window.__portfolioMode = true;
      window.__preventCameraReset = true; // Empêcher tout reset automatique
    }
    
    logger.log("Objet cliqué:", objectName, "ID:", resolvedObjectId);
    
    // Masquer le guide mobile après la première interaction
    if (showMobileGuide) {
      setShowMobileGuide(false);
    }
      
    // Déterminer le type d'objet
    const objectType = getObjectType(resolvedObjectId, objectName);
    
      
    // Gérer les clics sur les tiroirs de prestation
    const isPrestaDrawer = handlePrestaDrawerClick(resolvedObjectId, splineApp);
    if (isPrestaDrawer) return;
    
    // Déterminer la vue cible à partir de l'ID de l'objet
    const viewConfig = getViewForObjectId(resolvedObjectId);
    
    // S'il y a une configuration de vue
    window.__preventCameraReset = false;

    if (viewConfig) {
      logger.log("Configuration de vue trouvée:", {
        viewName: viewConfig.viewName,
        buttonId: viewConfig.buttonId,
        cameraPrefix: viewConfig.cameraVariablePrefix
      });
      
      // Vérifier si c'est la porte portfolio ou le bouton portfolio
      const isPortfolioDoorObj = isPortfolioDoor(resolvedObjectId, objectName);
            
      // Traitement spécial pour certaines vues
      if (viewConfig.viewName === 'about') {
        // Afficher l'overlay About après l'animation de la caméra
        setTimeout(() => {
          setShowAboutOverlay(true);
        }, isMobile ? 1500 : 2000);
      }
      
      // Gestion spéciale pour le portfolio (porte et bouton)
      if (viewConfig.viewName === 'portfolio') {
        // Traitement spécial pour le bouton portfolio
        if (isPortfolioButton) {
          logger.log("Traitement spécial pour le bouton portfolio");
          
          // Animer la caméra sans sauvegarder l'état précédent
          if (splineSceneRef.current) {
            // Extraire directement les paramètres de caméra pour le portfolio
            const portfolioParams = cameraUtils.extractCameraParameters(splineApp, 'portfolio');
            
            if (portfolioParams) {
              // Ne PAS appeler handleButtonClick ici - très important
              logger.log("Animation directe vers le portfolio sans sauvegarde d'état");
              
              // Animation directe vers la position avec l'option pour empêcher le reset
              splineSceneRef.current.animateCamera({
                position: portfolioParams.position,
                rotation: portfolioParams.rotation,
                duration: isMobile ? 1500 : 2000,
                preventAutoReset: true // Option clé pour empêcher le reset automatique
              });
              
              // Désactiver explicitement toute fonction de rappel automatique
              clearTimeout(window.__portfolioResetTimeout);
              
              // Mettre à jour l'état de l'UI
              setActiveButtonId(BUTTON_IDS.PORTFOLIO);
              
              // Ne pas montrer le bouton de retour
              setShowReturnButton(false);
            } else {
              logger.error("Paramètres de caméra non trouvés pour le portfolio");
            }
          }
        } 
        // Autres cas (comme la porte portfolio)
        else {
          const showReturnBtn = !isPortfolioDoorObj && !isPortfolioButton;
          
          if (!isPortfolioDoorObj) {
            splineSceneRef.current.handleButtonClick();
          }
            
          animateCameraToView(viewConfig.viewName, viewConfig.buttonId, showReturnBtn);
        }
      } else {
        // Cas standard pour les autres vues
        if (splineSceneRef.current) {
          splineSceneRef.current.handleButtonClick();
        }
        animateCameraToView(viewConfig.viewName, viewConfig.buttonId, true);
      }
  
    }
  }, [navigate, handlePrestaDrawerClick, animateCameraToView, isMobile, showMobileGuide]);
  
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
  
  // Effet pour attacher les contrôles tactiles
  useEffect(() => {
    if (isMobile || isTablet) {
      // Attacher les contrôles tactiles à l'élément racine
      const rootElement = document.getElementById('root');
      if (rootElement) {
        const cleanup = attachTouchListeners(rootElement);
        return cleanup;
      }
    }
  }, [isMobile, isTablet, attachTouchListeners]);
  
    
  // Si l'appareil est détecté comme trop peu puissant, afficher l'expérience allégée
  const preferFullExperience = localStorage.getItem('preferFullExperience') === 'true';
if (isLowPerformance && !preferFullExperience) {
    return (
      <LiteExperience 
        onNavigate={handleToolbarNavigation}
        onEnterFullExperience={() => {
          // Définir un niveau de qualité bas et forcer le passage à l'expérience complète
          setQualityLevel('low');
          
          // Utiliser localStorage pour marquer que l'utilisateur a choisi l'expérience complète
          try {
            localStorage.setItem('preferFullExperience', 'true');
            console.log("Préférence d'expérience complète enregistrée");
          } catch (e) {
            console.error("Erreur lors de l'enregistrement de la préférence:", e);
          }
          
          // Forcer un rechargement pour appliquer les changements
          // Utiliser setTimeout pour s'assurer que le localStorage est bien enregistré
          setTimeout(() => {
            window.location.href = window.location.pathname; // Forcer le rechargement sans paramètres
          }, 100);
        }}
      />
    );
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
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
      
      {/* Affichage de l'overlay About */}
      {showAboutOverlay && (
        <AboutOverlay 
          onClose={handleCloseAboutOverlay}
          isMobile={isMobile}
        />
      )}
      
      {/* Affichage de l'overlay Prestation */}
      {showPrestationOverlay && (
        <PrestationOverlay 
          title={prestationTitle}
          content={prestationContent}
          onClose={handleClosePrestationOverlay}
          isMobile={isMobile}
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
      
      {/* Contrôles de mouvement sur mobile */}
      {(isMobile || isTablet) && (
        <MobileControls
          onMoveForward={handleMoveForward}
          onMoveBackward={handleMoveBackward}
        />
      )}
      
      {/* Alerte d'orientation sur mobile en mode portrait */}
      {isMobile && !isLandscape && !showInitialOrientationOverlay && (
        <OrientationPrompt />
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

{/* Overlay d'orientation initial - AJOUTER CE BLOC */}
{(isMobile || isTablet) && showInitialOrientationOverlay && (
  <InitialOrientationOverlay 
    onClose={() => setShowInitialOrientationOverlay(false)}
    autoHideTime={10000} // 10 secondes avant disparition automatique
  />
)}
    </div>
  );
}