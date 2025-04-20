import { useCallback, useRef, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook personnalisé pour gérer les interactions tactiles sans retour automatique
 */
export default function useTouchControls({ 
  onMouseMove = null,
  sensitivity = 1.0,
  threshold = 3
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
  
  // Paramètres d'inertie - MODIFIÉS POUR RÉDUIRE FORTEMENT L'INERTIE
  const inertiaOptions = {
    damping: 0.8,        // Augmenté pour réduire plus rapidement l'inertie
    minSpeed: 0.75,        // Augmenté pour arrêter l'inertie plus tôt
    swipeThreshold: 5,
    swipeMultiplier: 0.15  // Réduit pour diminuer l'effet de l'inertie
  };
  
  /**
   * Calcule la vélocité du mouvement
   */
  const calculateVelocity = (delta, time) => {
    if (time === 0) return 0;
    // Réduire le facteur de vélocité
    return Math.min(Math.abs(delta) / time * 9, 5) * Math.sign(delta);
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
   */
  const handleTouchMove = useCallback((e) => {
    // Vérifications de base
    if (!touchStateRef.current || e.touches.length !== 1 || !onMouseMove) return;

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
    
    // Mettre à jour la vélocité avec le signe correct pour le swipe
    // Nous inversons le signe pour que le swipe fonctionne correctement plus tard
    if (elapsed > 16) {
      velocityRef.current = {
        x: calculateVelocity(deltaX, elapsed), // IMPORTANT: -deltaX pour le swipe
        timestamp: now
      };
    }
    
    // Déterminer le type de mouvement
    if (!state.moveType && Math.abs(deltaX) > threshold) {
      touchStateRef.current.moveType = 'horizontal';
    }
    
    // Traiter le mouvement horizontal
    if (state.moveType === 'horizontal') {
      if (Math.abs(deltaX) > threshold) {
        touchStateRef.current.moving = true;
        
         // Lorsque le doigt va à droite (deltaX positif), la caméra doit aller à droite
        cameraPosRef.current.x += deltaX * sensitivity * 0.04;
        
        // Limiter la rotation pour éviter les extrêmes
        const maxRotation = Math.PI * 0.4; // ~72 degrés
        cameraPosRef.current.x = Math.max(-maxRotation, Math.min(maxRotation, cameraPosRef.current.x));
        
        // Calculer la position normalisée
        const normalizedX = cameraPosRef.current.x / (Math.PI * 0.5);
        
        // Créer l'événement simulé
        const simulatedEvent = {
          // Convertir en coordonnées d'écran pour compatibilité
          clientX: window.innerWidth * (normalizedX + 1) / 2,
          clientY: window.innerHeight / 2, // Centre vertical
          // La vraie valeur utilisée par useCameraControls
          normalizedX: normalizedX,
          normalizedY: 0, // Pas de mouvement vertical pour simplifier
          isTouchEvent: true  // Marquer explicitement comme événement tactile
        };
        
        // Appeler la fonction de mouvement
        onMouseMove(simulatedEvent);
      }
    }
    
    // Mettre à jour l'état
    touchStateRef.current = {
      ...touchStateRef.current,
      lastX: touch.clientX,
      lastY: touch.clientY
    };
    
    // Empêcher le comportement par défaut
    if (touchStateRef.current.moving) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [onMouseMove, sensitivity, threshold]);
  
  /**
   * Applique l'inertie après un mouvement
   */
  const applyInertia = useCallback((velocity, isSwipe) => {
    if (!onMouseMove || Math.abs(velocity) < inertiaOptions.minSpeed) return;
    
    stopInertia();
    
    // Utiliser directement la vélocité calculée qui est déjà inversée
    // Note: velocityRef.x a déjà été calculé avec -deltaX dans handleTouchMove
    let currentVelocity = -velocity;
    
    // Limiter fortement la vélocité maximale pour réduire l'inertie
    const maxVelocity = isSwipe ? 1.2 : 0.5;
    currentVelocity = Math.sign(currentVelocity) * Math.min(Math.abs(currentVelocity), maxVelocity);
    
    inertiaRef.current.active = true;
    
    // Fonction d'animation d'inertie
    const inertiaStep = () => {
      if (!inertiaRef.current.active || !onMouseMove) {
        stopInertia();
        return;
      }
      
      // Diminuer progressivement la vélocité (amortissement plus rapide)
      currentVelocity *= inertiaOptions.damping;
      
      // Mettre à jour la position cumulative
      cameraPosRef.current.x += currentVelocity * 0.03;
      
      // Limiter la rotation
      const maxRotation = Math.PI * 0.4;
      cameraPosRef.current.x = Math.max(-maxRotation, Math.min(maxRotation, cameraPosRef.current.x));
      
      // Calculer la position normalisée
      const normalizedX = cameraPosRef.current.x / (Math.PI * 0.5);
      
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
      
      // Arrêter si la vélocité est trop faible (plus vite)
      if (Math.abs(currentVelocity) < inertiaOptions.minSpeed) {
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
    
    // Déterminer si c'est un swipe
    const isSwipe = touchDuration < 300 && 
                    Math.abs(lastVelocity.x) > inertiaOptions.swipeThreshold &&
                    totalDistanceX > 20;
    
    // Appliquer l'inertie si nécessaire
    if (state.moving && state.moveType === 'horizontal') {
      applyInertia(lastVelocity.x, isSwipe);
      
      logger.log(`Toucher terminé: ${isSwipe ? 'Swipe' : 'Mouvement normal'} avec vélocité ${lastVelocity.x}`);
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
    
    // Empêcher le comportement par défaut
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
    
    logger.log("Contrôles tactiles optimisés attachés avec comportement cohérent");
    
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
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    attachTouchListeners
  };
}