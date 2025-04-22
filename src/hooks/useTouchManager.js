/**
 * Gestionnaire centralisé des événements tactiles
 * Coordonne les différents types d'interactions tactiles pour éviter les conflits
 */
import { useRef, useCallback, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Types d'interactions tactiles supportées
 */
export const TOUCH_TYPES = {
  SWIPE: 'swipe',     // Glissement pour la rotation de la caméra
  BUTTON: 'button',   // Boutons de navigation (avant/arrière)
  OBJECT: 'object'    // Interaction avec des objets 3D
};

/**
 * Hook pour gérer toutes les interactions tactiles de manière coordonnée
 */
export default function useTouchManager({
  onSwipe = null,              // Callback pour les swipes (rotation caméra)
  onButtonPress = null,        // Callback pour les boutons (avancer/reculer)
  onObjectInteraction = null,  // Callback pour les interactions avec objets
  sensitivity = 1.5,           // Sensibilité des mouvements
  preventionThreshold = 10     // Seuil en pixels pour prévenir les interactions croisées
}) {
  // État pour suivre les interactions tactiles
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    timestamp: 0,
    totalX: 0,
    totalY: 0,
    activeType: null,       // Type d'interaction active
    targetElement: null,    // Élément cible de l'interaction
    isLongPress: false,     // Si c'est un appui prolongé
    isMoving: false,        // Si le doigt se déplace
    buttonDirection: null,  // Direction du bouton (avant/arrière)
    velocityX: 0,           // Vélocité pour le swipe
    lastVelocityUpdateTime: 0
  });
  
  // Configuration pour les différents types d'interactions
  const config = {
    swipe: {
      minDistance: 15,            // Distance minimale pour considérer comme un swipe
      damping: 0.92,              // Amortissement pour l'inertie
      minVelocity: 0.1,           // Vélocité minimale pour l'inertie
      maxVelocity: 4.0,           // Vélocité maximale pour l'inertie
      swipeMultiplier: 1.5        // Multiplicateur pour la vélocité du swipe
    },
    longPress: {
      threshold: 500              // Seuil en ms pour considérer comme un appui long
    },
    button: {
      repeatInterval: 80,         // Intervalle de répétition pour les boutons
      pressThreshold: 20,         // Seuil en pixels pour le mouvement max d'un appui
      speedFactor: 1.2            // Facteur de vitesse pour les boutons
    }
  };
  
  // Références pour les timers et animations
  const timersRef = useRef({
    longPress: null,
    buttonRepeat: null,
    inertia: null
  });
  
  /**
   * Nettoie tous les timers actifs
   */
  const clearAllTimers = useCallback(() => {
    const timers = timersRef.current;
    
    // Nettoyer le timer d'appui long
    if (timers.longPress) {
      clearTimeout(timers.longPress);
      timers.longPress = null;
    }
    
    // Nettoyer le timer de répétition de bouton
    if (timers.buttonRepeat) {
      clearInterval(timers.buttonRepeat);
      timers.buttonRepeat = null;
    }
    
    // Nettoyer l'animation d'inertie
    if (timers.inertia) {
      cancelAnimationFrame(timers.inertia);
      timers.inertia = null;
    }
  }, []);
  
  /**
   * Réinitialise complètement l'état tactile
   */
  const resetTouchState = useCallback(() => {
    touchStateRef.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      timestamp: 0,
      totalX: 0,
      totalY: 0,
      activeType: null,
      targetElement: null,
      isLongPress: false,
      isMoving: false,
      buttonDirection: null,
      velocityX: 0,
      lastVelocityUpdateTime: 0
    };
    
    clearAllTimers();
  }, [clearAllTimers]);
  
  /**
   * Détermine si un élément est un bouton de navigation
   */
  const isNavigationButton = useCallback((element) => {
    if (!element) return false;
    
    // Rechercher un ancêtre qui correspond au sélecteur
    const isButton = element.closest('.mobile-nav-button') !== null;
    return isButton;
  }, []);
  
  /**
   * Détermine si un élément est un objet interactif
   */
  const isInteractiveObject = useCallback((element) => {
    if (!element) return false;
    
    // Élément spline ou un descendant
    const isSplineObject = element.closest('.spline-object') !== null || 
                           element.getAttribute('data-interactive') === 'true';
    
    return isSplineObject;
  }, []);
  
  /**
   * Détermine le type d'interaction en fonction de l'élément cible
   */
  const determineInteractionType = useCallback((target) => {
    if (isNavigationButton(target)) {
      return TOUCH_TYPES.BUTTON;
    } else if (isInteractiveObject(target)) {
      return TOUCH_TYPES.OBJECT;
    } else {
      return TOUCH_TYPES.SWIPE; // Par défaut, c'est un swipe
    }
  }, [isNavigationButton, isInteractiveObject]);
  
  /**
   * Gestionnaire pour le début du toucher
   */
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    
    // Arrêter toute interaction précédente
    clearAllTimers();
    
    const touch = e.touches[0];
    const target = touch.target;
    const interactionType = determineInteractionType(target);
    
    logger.log(`Touch start: ${interactionType}`, target);
    
    // Initialiser l'état du toucher
    const state = touchStateRef.current;
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.lastX = touch.clientX;
    state.lastY = touch.clientY;
    state.timestamp = Date.now();
    state.totalX = 0;
    state.totalY = 0;
    state.activeType = interactionType;
    state.targetElement = target;
    state.isLongPress = false;
    state.isMoving = false;
    state.velocityX = 0;
    state.lastVelocityUpdateTime = Date.now();
    
    // Si c'est un bouton, démarrer un timer pour la répétition
    if (interactionType === TOUCH_TYPES.BUTTON) {
      // Extraire la direction du bouton à partir des attributs de données
      const direction = target.closest('.mobile-nav-button')?.getAttribute('data-direction') || 'forward';
      state.buttonDirection = direction;
      
      // Appliquer le style de bouton pressé
      const buttonElement = target.closest('.mobile-nav-button');
      if (buttonElement) {
        buttonElement.classList.add('pressed');
      }
      
      // Exécuter immédiatement l'action du bouton
      if (onButtonPress) {
        onButtonPress(direction);
      }
      
      // Configurer la répétition
      timersRef.current.buttonRepeat = setInterval(() => {
        if (onButtonPress && state.activeType === TOUCH_TYPES.BUTTON) {
          onButtonPress(state.buttonDirection);
        }
      }, config.button.repeatInterval);
    } 
    // Si c'est un objet interactif, configurer un timer pour l'appui long
    else if (interactionType === TOUCH_TYPES.OBJECT) {
      timersRef.current.longPress = setTimeout(() => {
        state.isLongPress = true;
        logger.log('Long press detected');
        
        // Appeler le callback d'interaction avec l'objet si fourni
        if (onObjectInteraction) {
          onObjectInteraction({
            type: 'longpress',
            target: state.targetElement,
            originalEvent: e
          });
        }
      }, config.longPress.threshold);
    }
    
    // Pour les swipes, aucune action immédiate n'est nécessaire
  }, [clearAllTimers, determineInteractionType, onButtonPress, onObjectInteraction]);
  
  /**
   * Gestionnaire pour le mouvement du toucher
   */
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length !== 1 || !touchStateRef.current.activeType) return;
    
    const touch = e.touches[0];
    const state = touchStateRef.current;
    const currentTime = Date.now();
    
    // Calculer les deltas
    const deltaX = touch.clientX - state.lastX;
    const deltaY = touch.clientY - state.lastY;
    const distanceFromStart = Math.sqrt(
      Math.pow(touch.clientX - state.startX, 2) + 
      Math.pow(touch.clientY - state.startY, 2)
    );
    
    // Mettre à jour les totaux
    state.totalX += deltaX;
    state.totalY += deltaY;
    
    // Calculer la vélocité (avec lissage)
    const timeDelta = currentTime - state.lastVelocityUpdateTime;
    if (timeDelta > 0) {
      // Mettre à jour progressivement avec un facteur de lissage
      const newVelocityX = deltaX / timeDelta;
      state.velocityX = state.velocityX * 0.7 + newVelocityX * 0.3;
      state.lastVelocityUpdateTime = currentTime;
    }
    
    // Détecter si c'est un mouvement significatif
    if (!state.isMoving && distanceFromStart > preventionThreshold) {
      state.isMoving = true;
      
      // Si un minuteur d'appui long est actif, l'annuler car l'utilisateur se déplace
      if (timersRef.current.longPress) {
        clearTimeout(timersRef.current.longPress);
        timersRef.current.longPress = null;
      }
    }
    
    // Actions spécifiques selon le type d'interaction
    switch (state.activeType) {
      case TOUCH_TYPES.SWIPE:
        // Pour les swipes, traiter le mouvement seulement s'il est significatif
        if (state.isMoving && onSwipe) {
          // Envoyer un événement de mouvement normalisé
          const normalizedX = (touch.clientX / window.innerWidth) * 2 - 1;
          const normalizedY = (touch.clientY / window.innerHeight) * 2 - 1;
          
          onSwipe({
            clientX: touch.clientX,
            clientY: touch.clientY,
            normalizedX: normalizedX,
            normalizedY: normalizedY,
            deltaX: deltaX,
            deltaY: deltaY,
            totalX: state.totalX,
            totalY: state.totalY,
            isTouchEvent: true
          });
          
          // Prévenir le défilement de la page pendant le swipe
          e.preventDefault();
          e.stopPropagation();
        }
        break;
        
      case TOUCH_TYPES.BUTTON:
        // Pour les boutons, vérifier si l'utilisateur glisse hors du bouton
        if (distanceFromStart > config.button.pressThreshold) {
          // L'utilisateur a glissé trop loin du bouton, annuler l'interaction
          const buttonElement = state.targetElement.closest('.mobile-nav-button');
          if (buttonElement) {
            buttonElement.classList.remove('pressed');
          }
          
          // Arrêter la répétition
          if (timersRef.current.buttonRepeat) {
            clearInterval(timersRef.current.buttonRepeat);
            timersRef.current.buttonRepeat = null;
          }
          
          // Changer le type d'interaction en swipe si le mouvement est important
          if (Math.abs(state.totalX) > Math.abs(state.totalY)) {
            state.activeType = TOUCH_TYPES.SWIPE;
            logger.log('Changement vers SWIPE après glissement hors bouton');
          } else {
            resetTouchState();
          }
        } else {
          // Maintenir le bouton pressé
          e.preventDefault();
          e.stopPropagation();
        }
        break;
        
      case TOUCH_TYPES.OBJECT:
        // Pour les objets interactifs, Si le mouvement est significatif, annuler l'appui long
        if (state.isMoving && !state.isLongPress) {
          if (timersRef.current.longPress) {
            clearTimeout(timersRef.current.longPress);
            timersRef.current.longPress = null;
          }
          
          // Si le mouvement est principalement horizontal, changer vers un swipe
          if (Math.abs(state.totalX) > Math.abs(state.totalY) * 1.5) {
            state.activeType = TOUCH_TYPES.SWIPE;
            logger.log('Changement vers SWIPE après mouvement horizontal');
          }
        }
        break;
    }
    
    // Mettre à jour les dernières positions
    state.lastX = touch.clientX;
    state.lastY = touch.clientY;
  }, [onSwipe, preventionThreshold, resetTouchState]);
  
  /**
   * Applique l'inertie après un swipe
   */
  const applyInertia = useCallback((velocity) => {
    if (!onSwipe) return;
    
    // Arrêter l'inertie existante
    if (timersRef.current.inertia) {
      cancelAnimationFrame(timersRef.current.inertia);
    }
    
    // Calculer la direction et la force initiale
    const direction = Math.sign(velocity);
    let currentVelocity = Math.min(Math.abs(velocity), config.swipe.maxVelocity) * 
                          direction * config.swipe.swipeMultiplier;
    
    logger.log(`Inertie appliquée: ${currentVelocity}`);
    
    // Position cumulative pour l'animation
    let cumulativeX = 0;
    
    // Fonction d'animation
    const inertiaStep = () => {
      // Réduire progressivement la vélocité
      currentVelocity *= config.swipe.damping;
      
      // Calculer le déplacement pour cette frame
      cumulativeX += currentVelocity;
      
      // Limiter la rotation
      const maxRotation = window.innerWidth * 0.5;
      cumulativeX = Math.max(-maxRotation, Math.min(maxRotation, cumulativeX));
      
      // Créer un événement normalisé
      const normalizedX = cumulativeX / maxRotation;
      
      // Simuler un événement de mouvement
      onSwipe({
        clientX: window.innerWidth * (0.5 + normalizedX * 0.5),
        clientY: window.innerHeight / 2,
        normalizedX: normalizedX,
        normalizedY: 0,
        deltaX: currentVelocity,
        deltaY: 0,
        totalX: cumulativeX,
        totalY: 0,
        isTouchEvent: true,
        isInertia: true
      });
      
      // Continuer l'animation si la vélocité est suffisante
      if (Math.abs(currentVelocity) > config.swipe.minVelocity) {
        timersRef.current.inertia = requestAnimationFrame(inertiaStep);
      } else {
        timersRef.current.inertia = null;
      }
    };
    
    // Démarrer l'animation
    timersRef.current.inertia = requestAnimationFrame(inertiaStep);
  }, [onSwipe]);
  
  /**
   * Gestionnaire pour la fin du toucher
   */
  const handleTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;
    
    if (!state.activeType) return;
    
    logger.log(`Touch end: ${state.activeType}`);
    
    // Actions spécifiques selon le type d'interaction
    switch (state.activeType) {
      case TOUCH_TYPES.SWIPE:
        // Si c'était un swipe avec mouvement significatif, appliquer l'inertie
        if (state.isMoving && Math.abs(state.totalX) > config.swipe.minDistance) {
          // Convertir la vélocité de px/ms à px/frame (~ 60fps)
          const frameVelocity = state.velocityX * 16.67;
          applyInertia(frameVelocity);
        }
        break;
        
      case TOUCH_TYPES.BUTTON:
        // Arrêter la répétition du bouton
        if (timersRef.current.buttonRepeat) {
          clearInterval(timersRef.current.buttonRepeat);
          timersRef.current.buttonRepeat = null;
        }
        
        // Retirer la classe "pressed"
        const buttonElement = state.targetElement?.closest('.mobile-nav-button');
        if (buttonElement) {
          buttonElement.classList.remove('pressed');
        }
        break;
        
      case TOUCH_TYPES.OBJECT:
        // Si ce n'était pas un appui long et que l'utilisateur n'a pas beaucoup bougé,
        // considérer comme un clic sur l'objet
        if (!state.isLongPress && !state.isMoving) {
          // Appeler le callback d'interaction
          if (onObjectInteraction) {
            onObjectInteraction({
              type: 'tap',
              target: state.targetElement,
              originalEvent: e
            });
          }
        }
        
        // Annuler le timer d'appui long s'il est encore actif
        if (timersRef.current.longPress) {
          clearTimeout(timersRef.current.longPress);
          timersRef.current.longPress = null;
        }
        break;
    }
    
    // Réinitialiser l'état (sauf pour l'inertie qui continue)
    if (state.activeType !== TOUCH_TYPES.SWIPE || !state.isMoving) {
      resetTouchState();
    } else {
      // Pour les swipes, on garde certaines infos pour l'inertie
      state.activeType = null;
      state.isMoving = false;
      state.targetElement = null;
    }
  }, [applyInertia, onObjectInteraction, resetTouchState]);
  
  /**
   * Annule l'inertie en cours
   */
  const stopInertia = useCallback(() => {
    if (timersRef.current.inertia) {
      cancelAnimationFrame(timersRef.current.inertia);
      timersRef.current.inertia = null;
      logger.log('Inertie arrêtée');
    }
  }, []);
  
  /**
   * Attache les gestionnaires d'événements tactiles à un élément
   */
  const attachTouchHandlers = useCallback((element) => {
    if (!element) return () => {};
    
    // Ajouter une classe CSS pour identifier l'élément comme supportant les interactions tactiles
    element.classList.add('touch-enabled');
    
    // Attacher les gestionnaires
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    logger.log('Gestionnaires tactiles attachés à:', element);
    
    // Fonction de nettoyage
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      element.classList.remove('touch-enabled');
      
      // Nettoyer tous les timers
      clearAllTimers();
    };
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearAllTimers
  ]);
  
  // Nettoyer lors du démontage du composant
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);
  
  // API du hook
  return {
    attachTouchHandlers,
    stopInertia,
    isTouch: 'ontouchstart' in window,
    TOUCH_TYPES
  };
}