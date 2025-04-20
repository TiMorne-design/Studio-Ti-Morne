/**
 * Hook personnalisé pour gérer uniquement les interactions tactiles de type swipe
 * Version modifiée qui ne permet que les swipes, pas le mouvement continu
 */
import { useCallback, useRef, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook personnalisé pour gérer uniquement les interactions tactiles de type swipe
 */
export default function useTouchControls({ 
  onMouseMove = null,
  sensitivity = 0.7, // Sensibilité augmentée pour les swipes
  threshold = 5 // Seuil légèrement augmenté
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
  
  // État pour suivre la position absolue de la caméra
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
  
  // Référence pour la vélocité
  const velocityRef = useRef({
    x: 0,
    timestamp: 0
  });
  
  // Paramètres pour le comportement du swipe
  const swipeOptions = {
    damping: 0.92,        // Diminution progressive de la vitesse
    minSpeed: 0.5,        // Vitesse minimale pour continuer l'inertie
    swipeThreshold: 5,    // Seuil pour considérer un mouvement comme un swipe
    swipeMultiplier: 0.8, // Multiplicateur pour l'effet de swipe
    swipeDurationThreshold: 300 // Durée max pour considérer un mouvement comme un swipe
  };
  
  /**
   * Calcule la vélocité du mouvement
   */
  const calculateVelocity = (delta, time) => {
    if (time === 0) return 0;
    // Calculer la vélocité avec un facteur approprié pour les swipes
    return Math.min(Math.abs(delta) / time * 8, 4) * Math.sign(delta);
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
      moveType: null
    };
    
    // Réinitialiser la vélocité
    velocityRef.current = {
      x: 0,
      timestamp: Date.now()
    };
  }, []);
  
  /**
   * Gestionnaire pour le mouvement du toucher
   * Modifié pour ne collecter que des données de vélocité sans déplacer la caméra
   */
  const handleTouchMove = useCallback((e) => {
    // Vérifications de base
    if (!touchStateRef.current || e.touches.length !== 1) return;

    // Ignorer si l'événement provient d'un overlay
    if (e.target.closest('.overlay-content') || e.target.closest('[class*="overlay-container"]')) {
      return;
    }
    
    const touch = e.touches[0];
    const now = Date.now();
    const state = touchStateRef.current;
    const elapsed = now - velocityRef.current.timestamp;
    
    // Calculer le delta
    const deltaX = touch.clientX - state.lastX;
    
    // Mettre à jour la vélocité périodiquement
    if (elapsed > 16) {
      velocityRef.current = {
        x: calculateVelocity(deltaX, elapsed),
        timestamp: now
      };
    }
    
    // Déterminer le type de mouvement
    if (!state.moveType && Math.abs(touch.clientX - state.startX) > threshold) {
      touchStateRef.current.moveType = 'horizontal';
      touchStateRef.current.moving = true;
    }
    
    // Mise à jour des valeurs pour le suivi du mouvement
    // IMPORTANT: Nous ne déplaçons plus la caméra pendant le mouvement,
    // mais seulement après le swipe via l'inertie
    
    // Mettre à jour l'état
    touchStateRef.current = {
      ...touchStateRef.current,
      lastX: touch.clientX,
      lastY: touch.clientY
    };
    
    // Empêcher le comportement par défaut si on est en train de suivre un mouvement
    if (touchStateRef.current.moving) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [threshold]);
  
  /**
   * Applique l'inertie après un swipe
   */
  const applyInertia = useCallback((velocity, isSwipe) => {
    if (!onMouseMove || !isSwipe) return;
    
    stopInertia();
    
    // Ajuster la vélocité initiale en fonction du swipe
    let currentVelocity = velocity * swipeOptions.swipeMultiplier;
    
    // Définir une vélocité maximale
    const maxVelocity = 3.0;
    currentVelocity = Math.sign(currentVelocity) * Math.min(Math.abs(currentVelocity), maxVelocity);
    
    inertiaRef.current.active = true;
    
    // Fonction d'animation d'inertie
    const inertiaStep = () => {
      if (!inertiaRef.current.active || !onMouseMove) {
        stopInertia();
        return;
      }
      
      // Diminuer progressivement la vélocité
      currentVelocity *= swipeOptions.damping;
      
      // Mettre à jour la position cumulative
      cameraPosRef.current.x -= currentVelocity * 0.015;
      
      // Limiter la rotation
      const maxRotation = Math.PI * 0.35;
      cameraPosRef.current.x = Math.max(-maxRotation, Math.min(maxRotation, cameraPosRef.current.x));
      
      // Appliquer une courbe non-linéaire pour améliorer la sensation
      const normalizedX = Math.sin(cameraPosRef.current.x) / Math.sin(maxRotation);
      
      // Créer l'événement simulé
      const simulatedEvent = {
        clientX: window.innerWidth * (normalizedX + 1) / 2,
        clientY: window.innerHeight / 2,
        normalizedX: normalizedX,
        normalizedY: 0,
        isTouchEvent: true
      };
      
      // Appeler la fonction de mouvement
      onMouseMove(simulatedEvent);
      
      // Arrêter si la vélocité est trop faible
      if (Math.abs(currentVelocity) < swipeOptions.minSpeed) {
        stopInertia();
        return;
      }
      
      // Continuer l'animation
      inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
    };
    
    inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
  }, [onMouseMove]);
  
  /**
   * Gestionnaire pour la fin du toucher
   */
  const handleTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;
    const lastVelocity = velocityRef.current;
    const endTime = Date.now();
    const touchDuration = endTime - state.timestamp;
    
    // Calculer la distance totale
    const totalDistanceX = Math.abs(state.lastX - state.startX);
    
    // Déterminer si c'est un swipe valide
    const isSwipe = touchDuration < swipeOptions.swipeDurationThreshold && 
                    totalDistanceX > 20 &&
                    Math.abs(lastVelocity.x) > swipeOptions.swipeThreshold;
    
    // Appliquer l'inertie seulement si c'est un swipe valide
    if (state.moving && state.moveType === 'horizontal' && isSwipe) {
      applyInertia(lastVelocity.x, isSwipe);
      
      logger.log(`Swipe détecté avec vélocité ${lastVelocity.x}, distance ${totalDistanceX}px et durée ${touchDuration}ms`);
    }
    
    // Réinitialiser l'état du toucher
    touchStateRef.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      timestamp: 0,
      moving: false,
      moveType: null
    };
    
    // Empêcher le comportement par défaut si on était en mouvement
    if (state.moving) {
      e.preventDefault();
      e.stopPropagation();
    }
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
    
    // Initialiser la position de la caméra
    cameraPosRef.current = { x: 0, y: 0 };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    logger.log("Contrôles tactiles de type swipe attachés");
    
    // Fonction de nettoyage
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      stopInertia();
      
      logger.log("Contrôles tactiles détachés");
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  return {
    attachTouchListeners
  };
}