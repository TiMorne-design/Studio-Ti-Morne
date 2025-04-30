/**
 * Composant principal pour l'intérieur du chalet
 * Optimisé pour desktop et mobile avec contrôles tactiles améliorés
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SplineScene from '../components/spline/SplineScene';
import AboutOverlay from '../components/overlays/AboutOverlay';
import PrestationOverlay from '../components/overlays/PrestationOverlay';
import NavigationToolbar from '../components/layout/NavigationToolbar';
import ReturnButton from '../components/common/ReturnButton';
import MobileControls from '../components/mobile/MobileControls';
import MobileNavigationToolbar from '../components/mobile/MobileNavigationToolbar';
import LiteExperience from '../components/mobile/LiteExperience';
import { BUTTON_IDS, OBJECT_IDS } from '../constants/ids';
import ContactOverlay from '../components/overlays/ContactOverlay';
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
import useDeviceDetection from '../hooks/useDeviceDetection';
import TouchControls from '../hooks/TouchControls';
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
  const [isSplineLoading, setIsSplineLoading] = useState(true);
  
  // États pour les overlays
  const [showAboutOverlay, setShowAboutOverlay] = useState(false);
  const [showPrestationOverlay, setShowPrestationOverlay] = useState(false);
  const [prestationContent, setPrestationContent] = useState(null);
  const [prestationTitle, setPrestationTitle] = useState('');
  const [showContactOverlay, setShowContactOverlay] = useState(false);

  // État pour la qualité visuelle
  const [qualityLevel, setQualityLevel] = useState(
    isLowPerformance ? 'low' : isMobile ? 'medium' : 'high'
  );
  
  // Références
  const portfolioButtonClickedRef = useRef(false);
  const doorHasBeenOpenedOnce = useRef(false);
  const doorIsOpenRef = useRef(false);
  const proximityCheckRef = useRef(null);
  const prestationContext = useRef(false);
  const contactContext = useRef(false);
  const preventMailTriggerRef = useRef(false);
  const touchControlsRef = useRef(null);

  // Utiliser le hook de déclenchement de porte
  const { triggerDoor } = useDoorTrigger({ splineRef: splineSceneRef });

  // Fonction pour ouvrir la porte une seule fois
  const openDoorOnce = useCallback(() => {
    // Vérifier si la porte a déjà été ouverte
    if (doorHasBeenOpenedOnce.current) {
      console.log("Porte déjà ouverte, émission bloquée");
      return false;
    }
    
    // Marquer que la porte a été ouverte
    doorHasBeenOpenedOnce.current = true;
    doorIsOpenRef.current = true;
    
    // Récupérer l'instance Spline
    if (!splineSceneRef.current || !splineSceneRef.current.getSplineInstance) {
      return false;
    }
    
    const splineApp = splineSceneRef.current.getSplineInstance();
    if (!splineApp) {
      return false;
    }
    
    try {
      // Émettre l'événement directement
      splineApp.emitEvent('mouseUp', OBJECT_IDS.PORTE_OUVERT);
      console.log("Porte ouverte avec succès (une seule fois)");
      // Définir la variable globale
      window.__doorIsOpen = true;
      return true;
    } catch (error) {
      logger.error("Erreur lors de l'ouverture de la porte:", error);
      return false;
    }
  }, []);
  
  // Fonction pour vérifier la proximité de la porte et déclencher l'ouverture
  const checkAndTriggerDoor = useCallback((doorId, camera, direction) => {
    // Vérifier d'abord si la porte a déjà été ouverte
    if (doorHasBeenOpenedOnce.current || window.__doorIsOpen === true) {
      console.log("Vérification: porte déjà ouverte, ouverture ignorée");
      return false;
    }

    // Si le bouton portfolio a été récemment cliqué, ne pas déclencher l'ouverture automatique
    if (portfolioButtonClickedRef.current && doorId === OBJECT_IDS.PORTE_OUVERT) {
      return false;
    }
    
    if (!camera) return false;
    
    const limits = cameraUtils.getCameraLimits();
    const posZ = camera.position.z;
    
    // Vérifier si on est dans la zone de déclenchement
    if (direction > 0 && 
        cameraUtils.isOnTerrace(posZ) && 
        posZ <= limits.doorTrigger && 
        posZ > limits.doorThreshold) {
      
      // Utiliser la fonction dédiée pour ouvrir la porte une seule fois
      if (openDoorOnce()) {
        // Marquer explicitement qu'il s'agit d'une ouverture automatique par proximité
        window.__doorThresholdTriggered = true;
        window.__automaticDoorOpening = true;
        
        // Réinitialiser les flags après un court délai
        setTimeout(() => {
          window.__doorThresholdTriggered = false;
          window.__automaticDoorOpening = false;
        }, 1000);
        
        logger.log("Ouverture automatique de la porte déclenchée par proximité");
        return true;
      }
    }
    
    return false;
  }, [openDoorOnce]);

  // Initialiser les variables globales
  useEffect(() => {
    window.__automaticDoorOpening = false;
    window.__doorThresholdTriggered = false;
    window.__portfolioDoorLocked = false;
    window.__manualPortfolioButtonClick = false;
    window.__portfolioMode = false;
    window.__doorIsOpen = false;
    window.__blockCameraEvents = false;
    
    // Réinitialiser notre référence de protection
    preventMailTriggerRef.current = false;
    
    return () => {
      delete window.__automaticDoorOpening;
      delete window.__doorThresholdTriggered;
      delete window.__portfolioDoorLocked;
      delete window.__manualPortfolioButtonClick;
      delete window.__portfolioMode;
      delete window.__doorIsOpen;
      delete window.__blockCameraEvents;
    };
  }, []);

  // Initialiser les contrôles tactiles sur mobile/tablette
  useEffect(() => {
    if (!isMobile && !isTablet) return;
    
    // Attendre que Spline soit chargé
    if (!splineSceneRef.current || !splineSceneRef.current.getSplineInstance) {
      return;
    }
    
    const initializeTouchControls = () => {
      const splineInstance = splineSceneRef.current.getSplineInstance();
      if (!splineInstance || !splineInstance.camera) {
        // Réessayer après un court délai si pas encore prêt
        setTimeout(initializeTouchControls, 500);
        return;
      }
      
      // Approche en deux temps pour désactiver complètement les contrôles standards
      // 1. Désactiver via l'API publique toggleCameraControls
      if (splineSceneRef.current.toggleCameraControls) {
        logger.log("Désactivation COMPLÈTE des contrôles de caméra standards pour le tactile");
        splineSceneRef.current.toggleCameraControls(false);
      }
      
      // 2. Forcer la désactivation au niveau de useCameraControls directement
      if (splineSceneRef.current._setCameraControlsEnabled) {
        splineSceneRef.current._setCameraControlsEnabled(false);
      }
      
      // 3. Définir une variable globale pour bloquer le traitement des événements tactiles 
      // dans useCameraControls
      window.__touchControlsActive = true;
      
      // Configurer les contrôles tactiles directs avec des paramètres optimisés
      const touchControls = TouchControls({
        cameraRef: splineInstance.camera,
        splineRef: splineInstance,
        sensitivity: isMobile ? 2.0 : 1.8,  // Augmenter légèrement la sensibilité
        threshold: 3,                        // Réduire le seuil pour une réponse plus rapide
        inertiaEnabled: true,
        invertSwipe: true                    // true = direction naturelle
      });
      
      // IMPORTANT: Attacher les contrôles tactiles personnalisés au document entier
      // pour une meilleure capture (ceci est crucial)
      const cleanup = touchControls.attachTouchListeners(document);
      
      // Mettre à jour la référence
      touchControlsRef.current = { 
        stopInertia: touchControls.stopInertia,
        cleanup 
      };
      
      // Injecter une fonction globale pour arrêter l'inertie
      window.__stopTouchInertia = () => {
        if (touchControlsRef.current && touchControlsRef.current.stopInertia) {
          touchControlsRef.current.stopInertia();
          console.log("Arrêt forcé de l'inertie tactile");
        }
      };
      
      logger.log("Contrôles tactiles directs initialisés avec succès (direction naturelle)");
    };
    
    // Lancer l'initialisation
    initializeTouchControls();
    
    return () => {
      // Nettoyer lors du démontage
      if (touchControlsRef.current && touchControlsRef.current.cleanup) {
        touchControlsRef.current.cleanup();
      }
      
      // Supprimer les variables globales
      delete window.__stopTouchInertia;
      delete window.__touchControlsActive;
      delete window.__invertTouchControls;
    };
  }, [isMobile, isTablet]);

  // Effet pour vérifier régulièrement la proximité de la porte
  useEffect(() => {
    const checkProximity = () => {
      // Vérifier si la porte est déjà ouverte
      if (doorHasBeenOpenedOnce.current || doorIsOpenRef.current === true || window.__doorIsOpen === true) {
        console.log("Vérification périodique: porte déjà ouverte, skip");
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
    proximityCheckRef.current = setInterval(checkProximity, 500);
    
    // Nettoyer l'intervalle lors du démontage
    return () => {
      if (proximityCheckRef.current) {
        clearInterval(proximityCheckRef.current);
      }
    };
  }, [checkAndTriggerDoor]);

  // Afficher l'écran de chargement pendant 5 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplineLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  /**
   * Gestion du défilement pour avancer/reculer
   * Uniquement pour desktop
   */
  const handleWheel = useCallback((e) => {
    if (splineSceneRef.current && !isMobile && !isTablet) {
      splineSceneRef.current.handleWheel(e);
    }
  }, [isMobile, isTablet]);
  
  /**
   * Actions pour les boutons de navigation mobile
   */
  const handleMoveForward = useCallback(() => {
    // Arrêter l'inertie existante avant de déplacer la caméra
    if (touchControlsRef.current && touchControlsRef.current.stopInertia) {
      touchControlsRef.current.stopInertia();
    }
  
    if (!splineSceneRef.current) return;
    
    try {
      if (splineSceneRef.current.moveCamera) {
        splineSceneRef.current.moveCamera(-6500);
      } else {
        const simulatedEvent = { deltaY: -400 };
        splineSceneRef.current.handleWheel(simulatedEvent);
      }
    } catch (error) {
      console.error("Erreur lors du déplacement vers l'avant:", error);
    }
  }, []);
  
  const handleMoveBackward = useCallback(() => {
    // Arrêter l'inertie existante avant de déplacer la caméra
    if (touchControlsRef.current && touchControlsRef.current.stopInertia) {
      touchControlsRef.current.stopInertia();
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

  const handleMouseMove = useCallback((e) => {
    // Uniquement pour le bureau - vérifié au niveau du rendu également
    if (!isMobile && !isTablet && splineSceneRef.current) {
      splineSceneRef.current.handleMouseMove(e);
    }
  }, [isMobile, isTablet]);
  
  /**
   * Gestion des overlays
   */
  const handleClosePrestationOverlay = useCallback(() => {
    // Marquer que nous sommes dans un contexte de prestation
    prestationContext.current = true;
    
    // Fermer simplement l'overlay sans animation ni autre action
    setShowPrestationOverlay(false);
   
  }, []);
  
  const handleCloseAboutOverlay = useCallback(() => {
    setShowAboutOverlay(false);
  }, []);

  const handleCloseContactOverlay = useCallback(() => {
    // Marquer que nous sommes dans un contexte de contact
    contactContext.current = true;
    
    // Fermer simplement l'overlay sans déclencher d'autres actions
    setShowContactOverlay(false);
  }, []);
  
  /**
   * Retourne à la position précédente de la caméra
   */
  const handleReturnToLastPosition = useCallback(() => {
    // Fermer tous les overlays
    setShowAboutOverlay(false);
    setShowContactOverlay(false);
  
    // Cas 1: Si un overlay de prestation était récemment ouvert (même s'il a été fermé via la croix)
    // On utilise une variable pour savoir si on était dans un contexte de prestation
    if (showPrestationOverlay || prestationContext.current) {
      // Réinitialiser le contexte de prestation
      prestationContext.current = false;
      
      if (showPrestationOverlay) {
        handleClosePrestationOverlay();
      }
      
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

    // Cas 2: Si un overlay de contact était récemment ouvert (même s'il a été fermé via la croix)
    if (showContactOverlay || contactContext.current) {
      // Réinitialiser le contexte de contact
      contactContext.current = false;
      
      if (showContactOverlay) {
        handleCloseContactOverlay();
      }

      preventMailTriggerRef.current = true;
      
      // Pour le contact, utiliser une position FIXE prédéfinie directement ici
      // au lieu d'essayer de la récupérer depuis les mappages qui pourraient être incorrects
      if (splineSceneRef.current) {
        logger.log("Retour depuis l'overlay de contact - utilisation d'une position fixe");
        
        // Position fixe pour la vue contact - ajustez ces valeurs selon votre besoin
        const contactPosition = { x: 0, y: 300, z: -1500 };
        const contactRotation = { x: 0, y: 0, z: 0 };
        
        // Animation directe vers la position contact
        splineSceneRef.current.animateCamera({
          position: contactPosition,
          rotation: contactRotation,
          duration: 1500
        });
        
        // Après l'animation, réactiver les contrôles et réinitialiser l'UI
        setTimeout(() => {
          if (splineSceneRef.current) {
            // Réactiver les contrôles
            splineSceneRef.current.restoreControlsOnly();
            if (splineSceneRef.current.toggleCameraControls) {
              splineSceneRef.current.toggleCameraControls(true);
            }
            
            // Réinitialiser le bouton actif
            const splineInstance = splineSceneRef.current.getSplineInstance();
            if (splineInstance && activeButtonId) {
              setTimeout(() => {
                logger.log(`Émission de l'événement start sur l'objet ${activeButtonId}`);
                try {
                  // Bloquer explicitement les événements pour éviter les interférences
                  window.__blockCameraEvents = true;
                  splineHelpers.emitEvent(splineInstance, 'start', activeButtonId);
                  // Débloquer après un court délai
                  setTimeout(() => {
                    window.__blockCameraEvents = false;
                  }, 100);
                } catch (e) {
                  logger.error("Erreur lors de la réinitialisation du bouton:", e);
                }
              }, 100);
            }
            
            // Réinitialiser l'état de l'UI
            setShowReturnButton(false);
            setActiveButtonId(null);

            // IMPORTANT: Désactiver la protection après un délai suffisant
            // pour que tous les événements se soient terminés
            setTimeout(() => {
              preventMailTriggerRef.current = false;
            }, 500);
          }
        }, 1600);
      }
      return;
    }
    
    // Cas 3: Avant la restauration, vérifier si nous sommes en mode portfolio
    const isInPortfolioMode = window.__portfolioMode === true;
    logger.log("Retour à la position précédente, mode portfolio:", isInPortfolioMode);
  
    if (splineSceneRef.current) {
      // Si nous sommes en mode portfolio, gérer ce cas spécial
      if (isInPortfolioMode) {
        logger.log("Mode portfolio détecté lors du retour - traitement spécial");
        
        // Réinitialiser le mode portfolio
        window.__portfolioMode = false;
        window.__preventCameraReset = false;
        
        // Nettoyer le timeout de renforcement si existant
        if (window.__portfolioTimeout) {
          clearTimeout(window.__portfolioTimeout);
          window.__portfolioTimeout = null;
        }
        
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
  }, [showPrestationOverlay, handleClosePrestationOverlay, activeButtonId, showContactOverlay, handleCloseContactOverlay]);
  
  /**
   * Gère les clics sur les tiroirs de prestation
   */
  const handlePrestaButtonClick = useCallback((objectId, splineApp) => {
    // Obtenir la configuration du bouton à partir de l'ID
    const prestaConfig = getDrawerForObjectId(objectId);
    
    if (prestaConfig) {
      prestationContext.current = true;
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
  }, [isMobile, showMobileGuide]);
  
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

    setShowContactOverlay(false);
    
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

        if (view === 'contact') {
          if (splineSceneRef.current) {
            splineSceneRef.current.handleButtonClick();
            // Utiliser animateCameraToView comme pour les autres vues
            animateCameraToView('contact', BUTTON_IDS.MAIL);
          }
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
       
    // Vérifier si c'est l'un de vos boutons
    if (resolvedObjectId === BUTTON_IDS.EOL) {
      console.log("Tentative de navigation vers /dataviz/eoliennes");
      navigate('/dataviz/eoliennes');
      return;
    }
  
    if (resolvedObjectId === BUTTON_IDS.SARGASSES) {
      console.log("Tentative de navigation vers /dataviz/sargasses");
      navigate('/dataviz/sargasses');
      return;
    }
  
    if (resolvedObjectId === BUTTON_IDS.TIMORNE) {
      console.log("Tentative de navigation vers /conception");
      navigate('/conception');
      return;
    }
    
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

    // Vérification spécifique pour le bouton mail avant la vérification de vue
    if (objectId === BUTTON_IDS.MAIL || objectName === 'BUTTON_MAIL') {
      if (preventMailTriggerRef.current) {
        logger.log("Clic sur bouton mail ignoré (protection anti-boucle active)");
        return true;
      }
      logger.log("Bouton mail cliqué, affichage de l'overlay de contact");
      
      // Définir le contexte de contact
      contactContext.current = true;
      
      // Sauvegarder la position actuelle de la caméra si nécessaire
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
      
      // Afficher l'overlay de contact
      setShowContactOverlay(true);
      
      // Afficher le bouton de retour
      setShowReturnButton(true);

      // Fixer l'ID du bouton actif
      setActiveButtonId(BUTTON_IDS.MAIL);
      
      return; // Important: arrêter le traitement ici
    }
    
    
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

          doorHasBeenOpenedOnce.current = true;
          window.__doorIsOpen = true; 
          
          // Réinitialiser le flag après un délai
          setTimeout(() => {
            portfolioButtonClickedRef.current = false;
          }, 5000);
          
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
          if (window.__doorIsOpen === true || doorHasBeenOpenedOnce.current) {
            logger.log("La porte est déjà ouverte, le clic est ignoré");
            return;
          }
          
          // Si ce n'est pas un déclenchement automatique, marquer la porte comme ouverte
          if (!window.__automaticDoorOpening && !window.__doorThresholdTriggered) {
            window.__doorIsOpen = true;
            doorHasBeenOpenedOnce.current = true;
            doorIsOpenRef.current = true;
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
  }, [handlePrestaButtonClick, animateCameraToView, isMobile, showMobileGuide, navigate]);

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
      style={{ position: 'relative', width: '100%', height: '100vh' }}
      onWheel={isMobile || isTablet ? null : handleWheel}
      onMouseMove={isMobile || isTablet ? null : handleMouseMove}
          >
      <SplineScene
        ref={splineSceneRef}
        scenePath="https://prod.spline.design/caI3XJc8z6B-FFGA/scene.splinecode"
        onObjectClick={handleObjectClick}
        qualityLevel={qualityLevel}
        // Ajouter une prop pour indiquer que nous utilisons des contrôles tactiles personnalisés
        useCustomTouchControls={isMobile || isTablet}
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

      {showContactOverlay && (
        <ContactOverlay 
          onClose={handleCloseContactOverlay}
          isMobile={isMobile}
        />
      )}
        
      {/* Guide de swipe sur mobile */}
      {(isMobile || isTablet) && showMobileGuide && (
        <div className="mobile-guide">
          <div className="mobile-guide-content">
            <p>Glissez horizontalement pour regarder autour de vous</p>
            <p>Utilisez les flèches pour vous déplacer</p>
          </div>
        </div>
      )}
      
      {/* Contrôles de mouvement sur mobile - masqués quand un overlay est affiché */}
      {(isMobile || isTablet) && 
        !showAboutOverlay && 
        !showPrestationOverlay && 
        !showContactOverlay && (
          <MobileControls
            onMoveForward={handleMoveForward}
            onMoveBackward={handleMoveBackward}
          />
        )
      }
        
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

      {/* Écran de chargement personnalisé */}
      {isSplineLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url('./images/scene-preview.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1500 // Au-dessus de tout sauf des overlays
        }}>
          <div style={{
            position: 'absolute',
            bottom: '50px',
            width: '300px',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'white',
              fontSize: '16px',
              marginBottom: '15px',
              textShadow: '0 1px 3px rgba(0,0,0,0.7)'
            }}>
              Chargement de la scène 3D...
            </p>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: '30%',
                backgroundColor: '#2A9D8F',
                borderRadius: '2px',
                animation: 'loading-progress 1.5s infinite ease-in-out'
              }}/>
            </div>
          </div>
          <style>{`
            @keyframes loading-progress {
              0% { width: 0%; margin-left: 0; }
              50% { width: 70%; margin-left: 0; }
              100% { width: 30%; margin-left: 70%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}