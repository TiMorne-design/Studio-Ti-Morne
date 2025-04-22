/**
 * Hook personnalisé pour gérer uniquement les interactions tactiles de type swipe
 * Version optimisée pour ne permettre que les swipes, pas le mouvement continu
 */
import { useCallback, useRef, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook personnalisé pour gérer uniquement les interactions tactiles de type swipe
 */
export default function useTouchControls({ 
  onMouseMove = null,
  sensitivity = 1.5, // Sensibilité augmentée pour les swipes
  threshold = 3 // Seuil réduit pour détecter les swipes plus facilement
}) {
  // État pour suivre les interactions tactiles
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    timestamp: 0,
    moving: false,
    moveType: null
  });
  
  // État pour suivre la position de la caméra (valeur cumulée)
  const cameraPosRef = useRef({
    x: 0,
    y: 0
  });
  
  // Référence pour l'inertie
  const inertiaRef = useRef({
    active: false
  });
  
  // Référence pour les animations d'inertie
  const inertiaIntervalRef = useRef(null);
  
  // Paramètres pour le comportement du swipe
  const swipeOptions = {
    damping: 0.92, // Amortissement plus rapide
    minSpeed: 0.1, // Seuil plus bas pour maintenir l'inertie
    swipeThreshold: 1.5, // Seuil de vélocité plus bas
    swipeMultiplier: 1.5, // Effet plus prononcé
    swipeDurationThreshold: 500, // Durée max augmentée
    minSwipeDistance: 10 // Distance minimale réduite
  };
  
  /**
   * Arrête l'inertie en cours
   */
  const stopInertia = () => {
    if (inertiaIntervalRef.current) {
      cancelAnimationFrame(inertiaIntervalRef.current);
      inertiaIntervalRef.current = null;
    }
    inertiaRef.current.active = false;
    
    logger.log("Inertie arrêtée");
  };
  
  /**
   * Gestionnaire pour le début du toucher
   */
  const handleTouchStart = useCallback((e) => {
    // Un seul toucher à la fois
    if (e.touches.length !== 1) return;
    
    // Arrêter l'inertie existante
    stopInertia();
    
    const touch = e.touches[0];
    
    // Initialiser l'état du toucher
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      timestamp: Date.now(),
      moving: false,
      moveType: null,
      totalX: 0, // Suivre le déplacement total
      totalY: 0,
      velocityX: 0, // Stocker la vélocité directement
      lastTime: Date.now() // Temps du dernier mouvement
    };
    
    logger.log("Touch start détecté", touch.clientX, touch.clientY);
  }, []);
  
  /**
   * Gestionnaire pour le mouvement du toucher
   * Collecte uniquement les données pour le swipe sans déplacer la caméra
   */
  const handleTouchMove = useCallback((e) => {
    // Vérifications de base
    if (!touchStateRef.current || e.touches.length !== 1) return;

    // Toujours capturer l'événement pour le débogage
  logger.log("Touch move détecté", e.touches[0].clientX, e.touches[0].clientY);


     // Si le mouvement est dans un overlay, l'ignorer mais ne pas l'arrêter
  const isInOverlay = e.target.closest('.overlay-content') || 
  e.target.closest('[class*="overlay-container"]');

  if (isInOverlay) {
    logger.log("Touch dans un overlay, ignoré");
    return;
  }
    
    const touch = e.touches[0];
    const now = Date.now();
    const state = touchStateRef.current;
    
    // Calculer les deltas depuis le dernier mouvement
    const deltaX = touch.clientX - state.lastX;
    const deltaY = touch.clientY - state.lastY;
    
    // Mettre à jour les totaux
    state.totalX += deltaX;
    state.totalY += deltaY;
    
    // Calculer la vélocité (pixels par milliseconde)
    const timeDelta = now - state.lastTime;
    if (timeDelta > 0) {
      // Mise à jour progressive de la vélocité avec lissage
      const newVelocityX = deltaX / timeDelta;
      state.velocityX = state.velocityX * 0.7 + newVelocityX * 0.3;
    }
    
    // Déterminer le type de mouvement au besoin
    if (!state.moveType) {
      const distX = Math.abs(touch.clientX - state.startX);
      const distY = Math.abs(touch.clientY - state.startY);
      
      if (distX > threshold || distY > threshold) {
        // Si le mouvement horizontal est dominant
        if (distX > distY) {
          state.moveType = 'horizontal';
          state.moving = true;
          logger.log("Mouvement horizontal détecté", distX, distY);
        } else {
          state.moveType = 'vertical';
          logger.log("Mouvement vertical détecté", distX, distY);
        }
      }
    }
    
    // Mise à jour des valeurs pour le suivi
    state.lastX = touch.clientX;
    state.lastY = touch.clientY;
    state.lastTime = now;
    
    // Convertir en coordonnées normalisées pour la rotation (-1 à 1)
  const normalizedX = (touch.clientX / window.innerWidth) * 2 - 1;
  
  // Envoyer directement le mouvement à la caméra pour la rotation horizontale
  if (state.moveType === 'horizontal' && onMouseMove) {
    // Créer un événement simulé avec le flag tactile
    const simulatedEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      normalizedX: normalizedX,
      normalizedY: 0, // On maintient vertical à 0 pour mieux contrôler
      isTouchEvent: true,
      type: 'touchmove'
    };
    
    // Envoyer l'événement directement
    onMouseMove(simulatedEvent);
    
    // Bloquer la propagation mais seulement si c'est un mouvement horizontal confirmé
    if (Math.abs(state.totalX) > swipeOptions.minSwipeDistance) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}, [threshold, onMouseMove, swipeOptions.minSwipeDistance]);
  
  /**
   * Applique l'inertie après un swipe
   */
  const applyInertia = useCallback((velocity, direction) => {
    if (!onMouseMove) return;
    
    // Arrêter toute inertie existante
    stopInertia();
    
    // Vélocité initiale (pixels par frame à 60fps)
    let currentVelocity = velocity * swipeOptions.swipeMultiplier;
    
    // S'assurer qu'elle est dans la bonne direction
    currentVelocity = Math.abs(currentVelocity) * direction;
    
    // Limiter la vélocité maximale
    const maxVelocity = 4.0;
    currentVelocity = Math.sign(currentVelocity) * Math.min(Math.abs(currentVelocity), maxVelocity);
        
    // Activation de l'inertie
    inertiaRef.current.active = true;
    
    // Position cumulée pour l'animation
    let cumulativeX = 0;
    
    // Fonction d'animation d'inertie
    const inertiaStep = () => {
      if (!inertiaRef.current.active || !onMouseMove) {
        stopInertia();
        return;
      }
      
      // Appliquer l'amortissement
      currentVelocity *= swipeOptions.damping;
      
      // Calculer le déplacement pour cette frame
      cumulativeX += currentVelocity;
      
      // Limiter la rotation maximale (en proportion de l'écran)
      const maxRotation = window.innerWidth * 0.5;
      cumulativeX = Math.max(-maxRotation, Math.min(maxRotation, cumulativeX));
      
      // Convertir en valeur normalisée pour la rotation de la caméra (-1 à 1)
      const normalizedX = cumulativeX / maxRotation;
      
      // Créer un événement simulé avec le flag tactile explicite
      const simulatedEvent = {
        clientX: window.innerWidth * (0.5 + normalizedX * 0.5), // entre 0 et window.innerWidth
        clientY: window.innerHeight / 2,
        normalizedX: normalizedX,
        normalizedY: 0,
        isTouchEvent: true, // Crucial pour être traité correctement
        type: 'touchmove'   // Ajouter le type d'événement
      };

      // Log pour débogage
    if (Math.abs(currentVelocity) > 0.5) {
      logger.log("Inertie active - vélocité:", currentVelocity.toFixed(2), "position:", normalizedX.toFixed(2));
    }
      
      // Envoyer l'événement aux contrôles de caméra
      onMouseMove(simulatedEvent);
      
      // Arrêter si la vélocité devient trop faible
      if (Math.abs(currentVelocity) < swipeOptions.minSpeed) {
        logger.log("Inertie terminée: vélocité trop faible", currentVelocity);
        stopInertia();
        return;
      }
      
      // Programmer la prochaine étape
      inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
    };
    
    // Démarrer l'animation
    inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
    
    // Pour le débogage
  return () => stopInertia();
}, [onMouseMove, swipeOptions.swipeMultiplier, swipeOptions.damping, swipeOptions.minSpeed, stopInertia]);
  
  /**
   * Gestionnaire pour la fin du toucher
   */
  const handleTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;
    
    // Si pas d'état de toucher valide, ignorer
    if (!state || !state.moving) {
      return;
    }
    
    const endTime = Date.now();
    const touchDuration = endTime - state.timestamp;
    
    // Calculer la distance totale du swipe
    const distanceX = Math.abs(state.totalX);
    
    // Direction du swipe (-1 pour gauche, 1 pour droite)
    const direction = Math.sign(state.totalX);
    
    // Débogage
    logger.log("Touch end:", {
      durée: touchDuration,
      distance: distanceX,
      direction,
      vélocité: state.velocityX,
      moveType: state.moveType
    });
    
    // Vérifier si c'est un swipe valide:
    // 1. Mouvement horizontal détecté
    // 2. Durée inférieure au seuil
    // 3. Distance suffisante
    // 4. Vélocité suffisante
    const isSwipe = 
      state.moveType === 'horizontal' &&
      touchDuration < swipeOptions.swipeDurationThreshold &&
      distanceX > swipeOptions.minSwipeDistance &&
      Math.abs(state.velocityX) > swipeOptions.swipeThreshold / 1000; // Convertir en px/ms

    if (isSwipe) {
      // Appliquer l'inertie avec la direction et la vélocité
      logger.log("Swipe valide détecté! Lancement de l'inertie", state.velocityX);
      
      // Convertir la vélocité en px/frame (60fps estimé)
      const frameVelocity = state.velocityX * 16.66; // ~60fps
      applyInertia(frameVelocity, direction);
    } else {
      logger.log("Mouvement non considéré comme swipe", {distanceX, touchDuration});
    }
    
    // Réinitialiser l'état du toucher
    touchStateRef.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      timestamp: 0,
      moving: false,
      moveType: null,
      totalX: 0,
      totalY: 0,
      velocityX: 0,
      lastTime: 0
    };
  }, [applyInertia]);
  
  /**
   * Nettoyage lors du démontage
   */
  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, []);
  
  /**
   * Attache les écouteurs d'événements tactiles
   */
  const attachTouchListeners = useCallback((element) => {
    if (!element) return () => {};
    
    // Réinitialiser les états
    cameraPosRef.current = { x: 0, y: 0 };
    
    // Attacher les gestionnaires d'événements
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    logger.log("Contrôles tactiles de swipe attachés à l'élément", element);
    
    // Fonction de nettoyage
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      stopInertia();
      
      logger.log("Contrôles tactiles détachés");
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  // Retourner l'API du hook
  return {
    attachTouchListeners,
    stopInertia
  };
}