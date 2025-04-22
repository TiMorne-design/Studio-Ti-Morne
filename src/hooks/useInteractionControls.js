/**
 * Hook unifié pour la gestion des interactions (souris et tactile)
 * Fournit une interface normalisée pour tous les types d'interactions
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

// Types d'interactions supportées
export const INTERACTION_TYPES = {
  CAMERA: 'camera',   // Rotation de la caméra (souris/tactile)
  MOVEMENT: 'movement', // Déplacement (molette/boutons)
  OBJECT: 'object'    // Interaction avec objets (clic/tap)
};

// Types d'appareils
const DEVICE_TYPES = {
  MOUSE: 'mouse',
  TOUCH: 'touch'
};

/**
 * Hook unifié pour gérer tous les types d'interactions
 * @param {Object} options - Options de configuration
 * @param {Function} options.onCameraRotate - Callback pour la rotation de caméra
 * @param {Function} options.onCameraMove - Callback pour le déplacement de caméra
 * @param {Function} options.onObjectInteract - Callback pour l'interaction avec objets
 * @param {Object} options.deviceInfo - Informations sur l'appareil {isMobile, isTablet}
 * @param {Number} options.sensitivity - Sensibilité des mouvements (1.0 = normal)
 * @param {Boolean} options.enableInertia - Activer l'inertie pour les rotations tactiles
 * @param {Boolean} options.enableSmoothing - Activer le lissage des mouvements
 * @returns {Object} - Méthodes et propriétés du hook
 */
export default function useInteractionControls({
  onCameraRotate = null,
  onCameraMove = null,
  onObjectInteract = null,
  deviceInfo = { isMobile: false, isTablet: false },
  sensitivity = 1.0,
  enableInertia = true,
  enableSmoothing = true
}) {
  // État pour les contrôles
  const [controlsEnabled, setControlsEnabled] = useState(true);
  
  // Extraire les infos d'appareil
  const { isMobile, isTablet } = deviceInfo;
  const isTouchDevice = isMobile || isTablet;
  
  // Référence pour suivre l'état des interactions
  const interactionState = useRef({
    // État des entrées
    pointerStartX: 0,
    pointerStartY: 0,
    pointerCurrentX: 0,
    pointerCurrentY: 0,
    isPointerDown: false,
    
    // Suivi du mouvement
    totalDeltaX: 0,
    totalDeltaY: 0,
    lastTimestamp: 0,
    
    // Type d'interaction en cours
    activeInteractionType: null,
    deviceType: null,
    
    // Suivi de vélocité
    velocityX: 0,
    velocityY: 0,
    lastVelocityUpdate: 0,
    
    // Lissage
    prevNormalizedX: 0,
    prevNormalizedY: 0,
    
    // Élément cible de l'interaction
    targetElement: null,
    objectIdentifier: null
  });
  
  // Références pour les animations
  const animations = useRef({
    inertia: null,
    buttonRepeat: null
  });
  
  // Configuration pour les différents comportements
  const config = {
    camera: {
      // Facteur de lissage pour les mouvements de caméra
      smoothingFactor: enableSmoothing ? 0.3 : 1.0,
      // Distance minimale pour considérer un mouvement de caméra
      minDistance: 5
    },
    inertia: {
      // Amortissement de l'inertie
      damping: 0.92,
      // Vélocité minimale pour maintenir l'inertie
      minVelocity: 0.05,
      // Vélocité maximale
      maxVelocity: 3.0,
      // Multiplicateur pour l'effet d'inertie
      multiplier: 1.2
    },
    movement: {
      // Intervalle de répétition pour les boutons de déplacement
      repeatInterval: 80,
      // Facteur de vitesse pour les boutons
      speedFactor: 1.0
    },
    object: {
      // Seuil pour considérer comme un appui long (ms)
      longPressThreshold: 500,
      // Distance maximale pour qu'un tap soit valide
      maxTapDistance: 10
    }
  };
  
  /**
   * Nettoie toutes les animations en cours
   */
  const clearAllAnimations = useCallback(() => {
    // Arrêter l'inertie
    if (animations.current.inertia) {
      cancelAnimationFrame(animations.current.inertia);
      animations.current.inertia = null;
    }
    
    // Arrêter la répétition des boutons
    if (animations.current.buttonRepeat) {
      clearInterval(animations.current.buttonRepeat);
      animations.current.buttonRepeat = null;
    }
  }, []);
  
  /**
   * Réinitialise l'état des interactions
   */
  const resetInteractionState = useCallback(() => {
    interactionState.current = {
      pointerStartX: 0,
      pointerStartY: 0,
      pointerCurrentX: 0,
      pointerCurrentY: 0,
      isPointerDown: false,
      totalDeltaX: 0,
      totalDeltaY: 0,
      lastTimestamp: 0,
      activeInteractionType: null,
      deviceType: null,
      velocityX: 0,
      velocityY: 0,
      lastVelocityUpdate: 0,
      prevNormalizedX: 0,
      prevNormalizedY: 0,
      targetElement: null,
      objectIdentifier: null
    };
    
    clearAllAnimations();
  }, [clearAllAnimations]);
  
  /**
   * Détermine le type d'interaction à partir de l'élément cible
   * @param {HTMLElement} target - Élément cible
   * @param {String} deviceType - Type d'appareil ('mouse' ou 'touch')
   * @returns {String} - Type d'interaction
   */
  const determineInteractionType = useCallback((target, deviceType) => {
    // Vérifier si c'est un bouton de navigation
    const isNavButton = target.closest('.mobile-nav-button') !== null;
    if (isNavButton) {
      return INTERACTION_TYPES.MOVEMENT;
    }
    
    // Vérifier si c'est un objet interactif
    const isInteractiveObj = target.closest('.spline-object') !== null || 
                         target.getAttribute('data-interactive') === 'true';
    if (isInteractiveObj) {
      return INTERACTION_TYPES.OBJECT;
    }
    
    // Par défaut, c'est une interaction de caméra
    return INTERACTION_TYPES.CAMERA;
  }, []);
  
  /**
   * Extrait l'identifiant d'un objet à partir de l'élément DOM
   * @param {HTMLElement} element - Élément DOM
   * @returns {Object} - Identifiant de l'objet
   */
  const extractObjectIdentifier = useCallback((element) => {
    if (!element) return null;
    
    // Rechercher depuis l'élément actuel ou ses parents
    const target = element.closest('[data-object-name], [data-object-id]');
    if (!target) return null;
    
    return {
      name: target.dataset.objectName,
      id: target.dataset.objectId
    };
  }, []);
  
  /**
   * Normalise les coordonnées du pointeur
   * @param {Number} clientX - Coordonnée X
   * @param {Number} clientY - Coordonnée Y
   * @returns {Object} - Coordonnées normalisées entre -1 et 1
   */
  const normalizeCoordinates = useCallback((clientX, clientY) => {
    return {
      normalizedX: (clientX / window.innerWidth) * 2 - 1,
      normalizedY: (clientY / window.innerHeight) * 2 - 1
    };
  }, []);
  
  /**
   * Applique un lissage aux mouvements tactiles
   * @param {Number} normalizedX - Coordonnée X normalisée
   * @param {Number} normalizedY - Coordonnée Y normalisée
   * @returns {Object} - Coordonnées lissées
   */
  const smoothMovement = useCallback((normalizedX, normalizedY) => {
    const state = interactionState.current;
    
    // Si c'est le premier mouvement, initialiser les valeurs précédentes
    if (state.prevNormalizedX === undefined) {
      state.prevNormalizedX = normalizedX;
      state.prevNormalizedY = normalizedY;
    }
    
    // Appliquer le lissage
    const factor = config.camera.smoothingFactor;
    const smoothedX = state.prevNormalizedX * (1 - factor) + normalizedX * factor;
    const smoothedY = state.prevNormalizedY * (1 - factor) + normalizedY * factor;
    
    // Stocker les nouvelles valeurs
    state.prevNormalizedX = smoothedX;
    state.prevNormalizedY = smoothedY;
    
    return { normalizedX: smoothedX, normalizedY: smoothedY };
  }, []);
  
  /**
   * Crée un événement d'interaction normalisé
   * @param {Object} params - Paramètres pour l'événement
   * @returns {Object} - Événement normalisé
   */
  const createNormalizedEvent = useCallback((params) => {
    const { clientX, clientY, deltaX = 0, deltaY = 0, deviceType, interactionType, isInertia = false } = params;
    
    // Normaliser les coordonnées
    const { normalizedX, normalizedY } = normalizeCoordinates(clientX, clientY);
    
    // Appliquer le lissage pour les événements tactiles si activé
    const coords = (deviceType === DEVICE_TYPES.TOUCH && enableSmoothing) 
      ? smoothMovement(normalizedX, normalizedY)
      : { normalizedX, normalizedY };
    
    // Calculer les positions client à partir des coordonnées normalisées
    const calculatedClientX = window.innerWidth * (coords.normalizedX + 1) / 2;
    const calculatedClientY = window.innerHeight * (coords.normalizedY + 1) / 2;
    
    return {
      // Coordonnées pixel
      clientX: calculatedClientX,
      clientY: calculatedClientY,
      // Coordonnées normalisées
      normalizedX: coords.normalizedX,
      normalizedY: coords.normalizedY,
      // Deltas
      deltaX,
      deltaY,
      // Métadonnées
      deviceType,
      interactionType,
      isInertia,
      isTouchEvent: deviceType === DEVICE_TYPES.TOUCH,
      isTouchDevice, // Ajouter info si appareil tactile (issue de deviceInfo)
      timestamp: Date.now()
    };
  }, [normalizeCoordinates, smoothMovement, enableSmoothing, isTouchDevice]);
  
  /**
   * Déclenche une rotation de caméra
   * @param {Object} event - Événement normalisé
   */
  const triggerCameraRotation = useCallback((event) => {
    if (!controlsEnabled || !onCameraRotate) return;
    
    // Ajuster la sensibilité selon le type d'appareil
    const adjustedEvent = {
      ...event,
      normalizedX: event.normalizedX * sensitivity,
      normalizedY: event.normalizedY * sensitivity
    };
    
    onCameraRotate(adjustedEvent);
  }, [controlsEnabled, onCameraRotate, sensitivity]);
  
  /**
   * Déclenche un déplacement de caméra
   * @param {Number} delta - Distance de déplacement
   * @param {String} direction - Direction ('forward', 'backward' ou undefined)
   */
  const triggerCameraMovement = useCallback((delta, direction) => {
    if (!controlsEnabled || !onCameraMove) return;
    
    // Créer un événement de défilement
    const moveEvent = {
      deltaY: direction === 'forward' ? -delta : direction === 'backward' ? delta : delta,
      sensitivity: sensitivity,
      isTouchDevice // Ajouter l'info si c'est un appareil tactile
    };
    
    onCameraMove(moveEvent);
  }, [controlsEnabled, onCameraMove, sensitivity, isTouchDevice]);
  
  /**
   * Déclenche une interaction avec un objet
   * @param {Object} params - Paramètres de l'interaction
   */
  const triggerObjectInteraction = useCallback((params) => {
    if (!controlsEnabled || !onObjectInteract) return;
    
    const { type, target, objectIdentifier } = params;
    
    onObjectInteract({
      type, // 'tap' ou 'longpress'
      target,
      objectName: objectIdentifier?.name,
      objectId: objectIdentifier?.id,
      isTouchDevice
    });
  }, [controlsEnabled, onObjectInteract, isTouchDevice]);
  
  /**
   * Applique l'inertie après un swipe
   * @param {Number} velocityX - Vélocité horizontale
   * @param {Number} velocityY - Vélocité verticale
   */
  const applyInertia = useCallback((velocityX, velocityY) => {
    if (!enableInertia || !controlsEnabled || !onCameraRotate) return;
    
    // Arrêter l'inertie existante
    if (animations.current.inertia) {
      cancelAnimationFrame(animations.current.inertia);
    }
    
    // Limiter la vélocité
    const clampedVelocityX = Math.sign(velocityX) * Math.min(Math.abs(velocityX), config.inertia.maxVelocity);
    
    // Vélocité initiale avec multiplicateur
    let currentVelocityX = clampedVelocityX * config.inertia.multiplier;
    
    // Position cumulative pour l'animation
    let cumulativeX = 0;
    
    // Fonction d'animation
    const animateInertia = () => {
      // Réduire progressivement la vélocité
      currentVelocityX *= config.inertia.damping;
      
      // Calculer le déplacement pour cette frame
      cumulativeX += currentVelocityX;
      
      // Limiter la rotation
      const maxRotation = window.innerWidth * 0.5;
      cumulativeX = Math.max(-maxRotation, Math.min(maxRotation, cumulativeX));
      
      // Créer un événement normalisé
      const inertiaEvent = createNormalizedEvent({
        clientX: window.innerWidth * (0.5 + cumulativeX / maxRotation * 0.5),
        clientY: window.innerHeight / 2,
        deltaX: currentVelocityX,
        deltaY: 0,
        deviceType: DEVICE_TYPES.TOUCH,
        interactionType: INTERACTION_TYPES.CAMERA,
        isInertia: true
      });
      
      // Déclencher la rotation
      triggerCameraRotation(inertiaEvent);
      
      // Continuer l'animation si la vélocité est suffisante
      if (Math.abs(currentVelocityX) > config.inertia.minVelocity) {
        animations.current.inertia = requestAnimationFrame(animateInertia);
      } else {
        animations.current.inertia = null;
      }
    };
    
    // Démarrer l'animation
    animations.current.inertia = requestAnimationFrame(animateInertia);
  }, [createNormalizedEvent, triggerCameraRotation, enableInertia, controlsEnabled]);
  
  /**
   * Calcule la vélocité du mouvement
   * @param {Number} deltaX - Déplacement horizontal
   * @param {Number} deltaY - Déplacement vertical
   * @param {Number} timeDelta - Différence de temps (ms)
   * @returns {Object} - Vélocités X et Y
   */
  const calculateVelocity = useCallback((deltaX, deltaY, timeDelta) => {
    const state = interactionState.current;
    
    if (timeDelta <= 0) return { velocityX: 0, velocityY: 0 };
    
    // Calculer les nouvelles vélocités
    const newVelocityX = deltaX / timeDelta;
    const newVelocityY = deltaY / timeDelta;
    
    // Appliquer un lissage aux vélocités
    const smoothFactor = 0.3;
    const velocityX = (state.velocityX || 0) * (1 - smoothFactor) + newVelocityX * smoothFactor;
    const velocityY = (state.velocityY || 0) * (1 - smoothFactor) + newVelocityY * smoothFactor;
    
    return { velocityX, velocityY };
  }, []);
  
  //
  // Gestionnaires d'événements
  //
  
  /**
   * Gestionnaire pour le début d'une interaction (mousedown/touchstart)
   */
  const handlePointerDown = useCallback((e) => {
    if (!controlsEnabled) return;
    
    // Déterminer le type d'appareil
    const isTouchEvent = e.type === 'touchstart';
    const deviceType = isTouchEvent ? DEVICE_TYPES.TOUCH : DEVICE_TYPES.MOUSE;
    
    // Obtenir les coordonnées
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
    
    // Obtenir l'élément cible
    const target = isTouchEvent ? e.touches[0].target : e.target;
    
    // Déterminer le type d'interaction
    const interactionType = determineInteractionType(target, deviceType);
    
    // Extraire l'identifiant de l'objet si c'est une interaction avec un objet
    const objectIdentifier = interactionType === INTERACTION_TYPES.OBJECT 
      ? extractObjectIdentifier(target)
      : null;
    
    // Mettre à jour l'état
    interactionState.current = {
      ...interactionState.current,
      pointerStartX: clientX,
      pointerStartY: clientY,
      pointerCurrentX: clientX,
      pointerCurrentY: clientY,
      isPointerDown: true,
      totalDeltaX: 0,
      totalDeltaY: 0,
      lastTimestamp: Date.now(),
      activeInteractionType: interactionType,
      deviceType,
      velocityX: 0,
      velocityY: 0,
      lastVelocityUpdate: Date.now(),
      targetElement: target,
      objectIdentifier
    };
    
    // Actions spécifiques selon le type d'interaction
    if (interactionType === INTERACTION_TYPES.MOVEMENT) {
      // Gérer les boutons de navigation
      const navButton = target.closest('.mobile-nav-button');
      if (navButton) {
        // Marquer le bouton comme pressé
        navButton.classList.add('pressed');
        
        // Obtenir la direction
        const direction = navButton.getAttribute('data-direction');
        
        // Déclencher immédiatement le mouvement
        triggerCameraMovement(400, direction);
        
        // Configurer la répétition
        animations.current.buttonRepeat = setInterval(() => {
          triggerCameraMovement(400, direction);
        }, config.movement.repeatInterval);
      }
    } else if (interactionType === INTERACTION_TYPES.OBJECT) {
      // Pour les objets, gérer le long press
      if (isTouchEvent) {
        const longPressTimer = setTimeout(() => {
          if (interactionState.current.isPointerDown && 
              interactionState.current.activeInteractionType === INTERACTION_TYPES.OBJECT) {
            // Déclencher un appui long
            triggerObjectInteraction({
              type: 'longpress',
              target,
              objectIdentifier
            });
          }
        }, config.object.longPressThreshold);
        
        // Stocker le timer pour pouvoir l'annuler
        interactionState.current.longPressTimer = longPressTimer;
      }
    }
    
    // Arrêter l'inertie existante
    if (animations.current.inertia) {
      cancelAnimationFrame(animations.current.inertia);
      animations.current.inertia = null;
    }
  }, [controlsEnabled, determineInteractionType, extractObjectIdentifier, triggerCameraMovement, triggerObjectInteraction]);
  
  /**
   * Gestionnaire pour le mouvement du pointeur (mousemove/touchmove)
   */
  const handlePointerMove = useCallback((e) => {
    if (!controlsEnabled || !interactionState.current.isPointerDown) return;
    
    const state = interactionState.current;
    const isTouchEvent = e.type === 'touchmove';
    
    // Ignorer si c'est un événement tactile mais pas du bon type d'appareil
    if (isTouchEvent && state.deviceType !== DEVICE_TYPES.TOUCH) return;
    
    // Ignorer si ce n'est pas un événement tactile mais l'appareil est tactile
    if (!isTouchEvent && state.deviceType === DEVICE_TYPES.TOUCH) return;
    
    // Obtenir les coordonnées
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
    
    // Calculer les deltas
    const deltaX = clientX - state.pointerCurrentX;
    const deltaY = clientY - state.pointerCurrentY;
    
    // Mettre à jour les positions actuelles
    state.pointerCurrentX = clientX;
    state.pointerCurrentY = clientY;
    
    // Mettre à jour les totaux
    state.totalDeltaX += deltaX;
    state.totalDeltaY += deltaY;
    
    // Calculer la distance depuis le début de l'interaction
    const distanceFromStart = Math.sqrt(
      Math.pow(clientX - state.pointerStartX, 2) + 
      Math.pow(clientY - state.pointerStartY, 2)
    );
    
    // Calculer la vélocité
    const now = Date.now();
    const timeDelta = now - state.lastVelocityUpdate;
    const { velocityX, velocityY } = calculateVelocity(deltaX, deltaY, timeDelta);
    
    // Mettre à jour la vélocité
    state.velocityX = velocityX;
    state.velocityY = velocityY;
    state.lastVelocityUpdate = now;
    
    // Actions spécifiques selon le type d'interaction
    switch (state.activeInteractionType) {
      case INTERACTION_TYPES.CAMERA:
        // Pour la caméra, convertir en événement normalisé
        const cameraEvent = createNormalizedEvent({
          clientX,
          clientY,
          deltaX,
          deltaY,
          deviceType: state.deviceType,
          interactionType: INTERACTION_TYPES.CAMERA
        });
        
        // Déclencher la rotation de caméra
        triggerCameraRotation(cameraEvent);
        
        // Empêcher le défilement par défaut sur mobile
        if (isTouchEvent) {
          e.preventDefault();
        }
        break;
        
      case INTERACTION_TYPES.OBJECT:
        // Pour les objets, vérifier si on a dépassé la distance maximale
        if (distanceFromStart > config.object.maxTapDistance) {
          // Annuler le timer de long press si présent
          if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
            state.longPressTimer = null;
          }
          
          // Changer le type d'interaction en caméra si on bouge beaucoup
          if (Math.abs(state.totalDeltaX) > Math.abs(state.totalDeltaY)) {
            state.activeInteractionType = INTERACTION_TYPES.CAMERA;
            
            // Transformer immédiatement en événement de caméra
            const switchEvent = createNormalizedEvent({
              clientX,
              clientY,
              deltaX,
              deltaY,
              deviceType: state.deviceType,
              interactionType: INTERACTION_TYPES.CAMERA
            });
            
            triggerCameraRotation(switchEvent);
          }
        }
        break;
        
      case INTERACTION_TYPES.MOVEMENT:
        // Pour les boutons, vérifier si on a glissé hors du bouton
        if (distanceFromStart > 20) {
          // Annuler la répétition du bouton
          if (animations.current.buttonRepeat) {
            clearInterval(animations.current.buttonRepeat);
            animations.current.buttonRepeat = null;
          }
          
          // Retirer la classe pressed du bouton
          const navButton = state.targetElement.closest('.mobile-nav-button');
          if (navButton) {
            navButton.classList.remove('pressed');
          }
          
          // Changer le type d'interaction si on a glissé horizontalement
          if (Math.abs(state.totalDeltaX) > Math.abs(state.totalDeltaY)) {
            state.activeInteractionType = INTERACTION_TYPES.CAMERA;
          } else {
            // Réinitialiser l'état
            state.isPointerDown = false;
          }
        }
        break;
    }
    
    // Mettre à jour le timestamp
    state.lastTimestamp = now;
  }, [controlsEnabled, calculateVelocity, createNormalizedEvent, triggerCameraRotation]);
  
  /**
   * Gestionnaire pour la fin d'une interaction (mouseup/touchend)
   */
  const handlePointerUp = useCallback((e) => {
    const state = interactionState.current;
    
    if (!state.isPointerDown) return;
    
    const isTouchEvent = e.type === 'touchend';
    
    // Ignorer si l'appareil ne correspond pas
    if ((isTouchEvent && state.deviceType !== DEVICE_TYPES.TOUCH) ||
        (!isTouchEvent && state.deviceType === DEVICE_TYPES.TOUCH)) {
      return;
    }
    
    // Actions spécifiques selon le type d'interaction
    switch (state.activeInteractionType) {
      case INTERACTION_TYPES.CAMERA:
        // Vérifier si c'est un swipe significatif
        if (state.deviceType === DEVICE_TYPES.TOUCH &&
            Math.abs(state.totalDeltaX) > config.camera.minDistance) {
          // Convertir la vélocité de px/ms à px/frame (~ 60fps)
          const frameVelocityX = state.velocityX * 16.67;
          applyInertia(frameVelocityX, state.velocityY * 16.67);
        }
        break;
        
      case INTERACTION_TYPES.OBJECT:
        // Annuler le timer de long press si présent
        if (state.longPressTimer) {
          clearTimeout(state.longPressTimer);
          state.longPressTimer = null;
        }
        
        // Calculer la distance depuis le début de l'interaction
        const distanceFromStart = Math.sqrt(
          Math.pow(state.pointerCurrentX - state.pointerStartX, 2) + 
          Math.pow(state.pointerCurrentY - state.pointerStartY, 2)
        );
        
        // Si la distance est faible, c'est un tap valide
        if (distanceFromStart <= config.object.maxTapDistance) {
          triggerObjectInteraction({
            type: 'tap',
            target: state.targetElement,
            objectIdentifier: state.objectIdentifier
          });
        }
        break;
        
      case INTERACTION_TYPES.MOVEMENT:
        // Arrêter la répétition du bouton
        if (animations.current.buttonRepeat) {
          clearInterval(animations.current.buttonRepeat);
          animations.current.buttonRepeat = null;
        }
        
        // Retirer la classe pressed du bouton
        const navButton = state.targetElement?.closest('.mobile-nav-button');
        if (navButton) {
          navButton.classList.remove('pressed');
        }
        break;
    }
    
    // Réinitialiser l'état (mais conserver certaines valeurs pour l'inertie)
    const deviceType = state.deviceType;
    const velocityX = state.velocityX;
    const velocityY = state.velocityY;
    
    resetInteractionState();
    
    // Restaurer les valeurs nécessaires pour l'inertie
    if (deviceType === DEVICE_TYPES.TOUCH) {
      interactionState.current.deviceType = deviceType;
      interactionState.current.velocityX = velocityX;
      interactionState.current.velocityY = velocityY;
    }
  }, [controlsEnabled, resetInteractionState, triggerObjectInteraction, applyInertia]);
  
  /**
   * Gestionnaire pour le défilement de la molette (wheel)
   */
  const handleWheel = useCallback((e) => {
    if (!controlsEnabled || !onCameraMove) return;
    
    // Déclencher le mouvement de caméra
    triggerCameraMovement(e.deltaY, undefined);
  }, [controlsEnabled, triggerCameraMovement]);
  
  /**
   * Arrête immédiatement l'inertie
   */
  const stopInertia = useCallback(() => {
    if (animations.current.inertia) {
      cancelAnimationFrame(animations.current.inertia);
      animations.current.inertia = null;
      logger.log('Inertie arrêtée');
    }
  }, []);
  
  /**
   * Active ou désactive les contrôles
   * @param {Boolean} enabled - État des contrôles
   */
  const toggleControls = useCallback((enabled) => {
    setControlsEnabled(enabled);
    
    if (!enabled) {
      // Si on désactive les contrôles, arrêter toutes les animations
      clearAllAnimations();
    }
    
    logger.log(`Contrôles ${enabled ? 'activés' : 'désactivés'}`);
  }, [clearAllAnimations]);

  /**
   * Attache les gestionnaires d'événements à un élément
   * @param {HTMLElement} element - Élément auquel attacher les gestionnaires
   * @returns {Function} - Fonction de nettoyage
   */
  const attachHandlers = useCallback((element) => {
    if (!element) return () => {};
    
    // Ajouter une classe pour identifier l'élément
    element.classList.add('interaction-enabled');
    
    // Gestionnaires pour souris
    element.addEventListener('mousedown', handlePointerDown);
    element.addEventListener('mousemove', handlePointerMove);
    element.addEventListener('mouseup', handlePointerUp);
    element.addEventListener('mouseleave', handlePointerUp);
    
    // Gestionnaires pour tactile
    element.addEventListener('touchstart', handlePointerDown, { passive: false });
    element.addEventListener('touchmove', handlePointerMove, { passive: false });
    element.addEventListener('touchend', handlePointerUp, { passive: false });
    element.addEventListener('touchcancel', handlePointerUp, { passive: false });
    
    // Gestionnaire pour la molette
    element.addEventListener('wheel', handleWheel);
    
    logger.log('Gestionnaires d\'interaction attachés à:', element);
    
    // Fonction de nettoyage
    return () => {
      element.removeEventListener('mousedown', handlePointerDown);
      element.removeEventListener('mousemove', handlePointerMove);
      element.removeEventListener('mouseup', handlePointerUp);
      element.removeEventListener('mouseleave', handlePointerUp);
      
      element.removeEventListener('touchstart', handlePointerDown);
      element.removeEventListener('touchmove', handlePointerMove);
      element.removeEventListener('touchend', handlePointerUp);
      element.removeEventListener('touchcancel', handlePointerUp);
      
      element.removeEventListener('wheel', handleWheel);
      
      element.classList.remove('interaction-enabled');
      
      clearAllAnimations();
    };
  }, [
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    clearAllAnimations
  ]);
  
  // Nettoyer toutes les animations lors du démontage
  useEffect(() => {
    return () => {
      clearAllAnimations();
    };
  }, [clearAllAnimations]);
  
  // API du hook
  return {
    // Attacher/détacher les gestionnaires
    attachHandlers,
    
    // Contrôle des interactions
    toggleControls,
    isControlsEnabled: controlsEnabled,
    
    // Utilitaires
    stopInertia,
    triggerCameraMovement,
    
    // Types d'interaction pour référence
    INTERACTION_TYPES
  };
}