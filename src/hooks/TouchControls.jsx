
/**
 * Hook personnalisé pour gérer les contrôles tactiles
 * Permet une rotation directe de la caméra avec swipe et inertie
 */
import { useCallback, useRef, useState, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook personnalisé pour gérer les contrôles tactiles
 * @param {Object} options - Options de configuration
 * @param {Object} options.cameraRef - Référence directe à l'objet caméra
 * @param {Object} options.splineRef - Référence à l'instance Spline
 * @param {Function} options.onMouseMove - Fonction alternative pour les événements de souris
 * @param {Number} options.sensitivity - Sensibilité du mouvement
 * @param {Number} options.threshold - Seuil minimum de déplacement pour détecter un swipe
 * @param {Boolean} options.inertiaEnabled - Activer/désactiver l'effet d'inertie
 * @param {Boolean} options.invertSwipe - Inverser la direction du swipe (true = naturel)
 * @returns {Object} - API des contrôles tactiles
 */
export default function TouchControls({ 
  cameraRef = null,
  splineRef = null,
  onMouseMove = null,
  sensitivity = 1.5,
  threshold = 5,
  inertiaEnabled = true,
  invertSwipe = true // Par défaut, le mouvement est naturel
}) {
  // État pour suivre l'inertie
  const [inertiaActive, setInertiaActive] = useState(false);
  
  // Référence pour stocker les états de rotation
  const rotationStateRef = useRef({
    targetRotation: cameraRef ? {
      x: cameraRef.rotation.x,
      y: cameraRef.rotation.y,
      z: cameraRef.rotation.z || 0
    } : { x: 0, y: 0, z: 0 },
    currentVelocity: 0,
    inertiaFrameId: null
  });
  
  // Référence pour stocker l'état du toucher
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    timestamp: 0,
    moving: false,
    inertiaFrameId: null,
    initialRotation: 0 // Stocker la rotation initiale de la caméra
  });

  // Paramètres pour l'inertie et le comportement du swipe
  const swipeParams = {
    damping: 0.92,
    minSpeed: 0.15,
    swipeMultiplier: 1.2,
    minSwipeDistance: 10,
    maxVelocity: 2.0,
    inertiaDuration: 800,
    smoothFactor: 0.05,
    initialDamping: 0.4 // Amortir le mouvement initial pour éviter les sauts
  };

  // Mettre à jour la référence de caméra si elle change
  useEffect(() => {
    if (cameraRef && cameraRef.rotation) {
      rotationStateRef.current.targetRotation = {
        x: cameraRef.rotation.x,
        y: cameraRef.rotation.y,
        z: cameraRef.rotation.z || 0
      };
    }
  }, [cameraRef]);

  // Démarrer le suivi du toucher
  const handleTouchStart = useCallback((e) => {
    // Marquer globalement que les contrôles tactiles sont actifs
    window.__touchControlsActive = true;
    
    // Arrêter l'inertie existante si elle est active
    if (rotationStateRef.current.inertiaFrameId) {
      cancelAnimationFrame(rotationStateRef.current.inertiaFrameId);
      rotationStateRef.current.inertiaFrameId = null;
    }
    
    setInertiaActive(false);
    
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    
    // Stocker la rotation initiale de la caméra au moment du toucher
    const initialRotationY = cameraRef ? cameraRef.rotation.y : 0;
    
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      velocityX: 0,
      timestamp: Date.now(),
      moving: false,
      initialRotation: initialRotationY // Importante pour éviter les sauts
    };
    
    logger.log("Touch start detected", touch.clientX, touch.clientY, "Initial rotation:", initialRotationY);
  }, [cameraRef]);

  // Suivre le mouvement du toucher et appliquer directement à la caméra
  const handleTouchMove = useCallback((e) => {
    // Si nous n'avons pas de caméra directe mais une fonction onMouseMove, utiliser celle-ci
    if (!cameraRef && onMouseMove) {
      if (!touchStateRef.current || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const state = touchStateRef.current;
      const deltaX = touch.clientX - state.lastX;
      
      // Appliquer l'inversion si nécessaire (true = naturel, swipe à droite = rotation à droite)
      const adjustedDelta = invertSwipe ? deltaX : -deltaX;
      
      // Créer un événement personnalisé pour onMouseMove
      const simulatedEvent = {
        normalizedX: adjustedDelta * 0.004 * sensitivity,
        normalizedY: 0,
        swipeDelta: true,
        isTouchEvent: true,
        type: 'touchmove'
      };
      
      onMouseMove(simulatedEvent);
      
      // Mettre à jour la position pour le prochain événement
      state.lastX = touch.clientX;
      state.timestamp = Date.now();
      return;
    }
    
    // Pour la manipulation directe de la caméra
    if (!touchStateRef.current || e.touches.length !== 1 || !cameraRef) return;

    const touch = e.touches[0];
    const state = touchStateRef.current;
    const currentTime = Date.now();
    const elapsed = currentTime - state.timestamp;
    
    // Calculer le delta - distance parcourue depuis le dernier événement
    const deltaX = touch.clientX - state.lastX;
    
    // Calculer la vitesse (pixels par milliseconde)
    if (elapsed > 0) {
      state.velocityX = 0.8 * state.velocityX + 0.2 * (deltaX / elapsed) * 10;
    }
    
    // Déterminer si on commence à bouger
    if (!state.moving) {
      const distX = Math.abs(touch.clientX - state.startX);
      
      if (distX > threshold) {
        state.moving = true;
      } else {
        // Pas encore assez de mouvement
        state.lastX = touch.clientX;
        state.timestamp = currentTime;
        return;
      }
    }

    // Une fois qu'on bouge, appliquer directement le mouvement à la rotation de la caméra
    if (state.moving) {
      // Calculer la rotation à appliquer
      // Si invertSwipe est true, le swipe est naturel (swipe à droite = rotation à droite)
      const normalizedX = invertSwipe ? 
        deltaX * 0.004 * sensitivity : // Direction naturelle
        -deltaX * 0.004 * sensitivity;  // Direction inversée
      
      // Partir de la rotation initiale pour calculer la cible
      // Cela évite le problème où la caméra commence dans une direction puis change
      const targetY = state.initialRotation + 
        ((touch.clientX - state.startX) * 0.004 * sensitivity * (invertSwipe ? 1 : -1));
      
      // Mettre à jour la rotation cible de manière absolue par rapport au début du toucher
      rotationStateRef.current.targetRotation.y = targetY;
      
      logger.log("Touch move:", {
        deltaX,
        normalizedX,
        targetY,
        initialRotation: state.initialRotation
      });
      
      // Si aucun frame d'animation n'est en cours, en démarrer un
      if (!rotationStateRef.current.inertiaFrameId) {
        const applyRotation = () => {
          if (!cameraRef) return;
          
          // Calcul de l'interpolation fluide
          const current = cameraRef.rotation.y;
          const target = rotationStateRef.current.targetRotation.y;
          const diff = target - current;
          
          // Appliquer le mouvement fluide avec un facteur d'amortissement adapté
          const factor = Math.min(swipeParams.smoothFactor * 2, 0.25);
          cameraRef.rotation.y += diff * factor;
          
          // Continuer l'animation
          rotationStateRef.current.inertiaFrameId = requestAnimationFrame(applyRotation);
        };
        
        rotationStateRef.current.inertiaFrameId = requestAnimationFrame(applyRotation);
      }
    }
    
    // Mettre à jour la position pour le prochain événement
    state.lastX = touch.clientX;
    state.timestamp = currentTime;
  }, [cameraRef, onMouseMove, sensitivity, threshold, invertSwipe, swipeParams.smoothFactor]);

  // Terminer le suivi et appliquer l'inertie si nécessaire
  const handleTouchEnd = useCallback((e) => {
    // Réinitialiser la marque globale des contrôles tactiles actifs après un délai
    // pour éviter les interférences immédiates
    setTimeout(() => {
      window.__touchControlsActive = false;
    }, 50);
    
    const state = touchStateRef.current;
    if (!state || !state.moving) return;
    
    // Si nous utilisons onMouseMove au lieu de la manipulation directe
    if (!cameraRef && onMouseMove) {
      state.moving = false;
      return;
    }
    
    // Pour la manipulation directe de la caméra
    if (!cameraRef) {
      state.moving = false;
      return;
    }
    
    // Déterminer s'il s'agit d'un swipe
    const distX = Math.abs(state.lastX - state.startX);
    
    // Appliquer l'inertie seulement pour les swipes significatifs
    if (distX > swipeParams.minSwipeDistance && inertiaEnabled && Math.abs(state.velocityX) > 0.5) {
      setInertiaActive(true);
      
      // Arrêter l'animation de rotation fluide si elle est en cours
      if (rotationStateRef.current.inertiaFrameId) {
        cancelAnimationFrame(rotationStateRef.current.inertiaFrameId);
      }
      
      // Limiter la vitesse maximale
      const vx = Math.min(Math.max(state.velocityX, -swipeParams.maxVelocity), swipeParams.maxVelocity);
      
      // Temps initial pour l'inertie
      const startTime = Date.now();
      let currentVelocity = vx;
      
      // Fonction d'animation pour l'inertie
      const applyInertia = () => {
        // Vérifier si l'inertie doit s'arrêter
        if (Math.abs(currentVelocity) < swipeParams.minSpeed || 
            Date.now() - startTime > swipeParams.inertiaDuration) {
          setInertiaActive(false);
          rotationStateRef.current.inertiaFrameId = null;
          return;
        }
        
        if (!cameraRef) {
          rotationStateRef.current.inertiaFrameId = null;
          return;
        }
        
        // Appliquer le mouvement d'inertie directement à la caméra
        // Avec inversion si nécessaire
        const rotationDelta = invertSwipe ? 
          currentVelocity * 0.004 * sensitivity : // Direction naturelle  
          -currentVelocity * 0.004 * sensitivity;  // Direction inversée
        
        // Mettre à jour la rotation cible
        rotationStateRef.current.targetRotation.y += rotationDelta;
        
        // Appliquer de manière fluide
        const current = cameraRef.rotation.y;
        const target = rotationStateRef.current.targetRotation.y;
        const diff = target - current;
        
        cameraRef.rotation.y += diff * swipeParams.smoothFactor * 2; // Plus rapide pour l'inertie
        
        // Réduire la vitesse avec le facteur d'amortissement
        currentVelocity *= swipeParams.damping;
        
        // Continuer l'animation
        rotationStateRef.current.inertiaFrameId = requestAnimationFrame(applyInertia);
      };
      
      // Démarrer l'animation d'inertie
      rotationStateRef.current.inertiaFrameId = requestAnimationFrame(applyInertia);
    } else {
      // Si pas d'inertie, s'assurer que l'animation fluide continue
      if (!rotationStateRef.current.inertiaFrameId && cameraRef) {
        const applySmoothing = () => {
          if (!cameraRef) {
            rotationStateRef.current.inertiaFrameId = null;
            return;
          }
          
          // Vérifier si on a atteint la rotation cible
          const current = cameraRef.rotation.y;
          const target = rotationStateRef.current.targetRotation.y;
          const diff = target - current;
          
          if (Math.abs(diff) < 0.001) {
            rotationStateRef.current.inertiaFrameId = null;
            return;
          }
          
          // Appliquer le mouvement fluide
          cameraRef.rotation.y += diff * swipeParams.smoothFactor;
          
          // Continuer l'animation
          rotationStateRef.current.inertiaFrameId = requestAnimationFrame(applySmoothing);
        };
        
        rotationStateRef.current.inertiaFrameId = requestAnimationFrame(applySmoothing);
      }
    }
    
    // Réinitialiser l'état après la fin du toucher
    state.moving = false;
  }, [cameraRef, onMouseMove, sensitivity, inertiaEnabled, swipeParams, invertSwipe]);

  // Arrêter explicitement l'inertie
  const stopInertia = useCallback(() => {
    if (rotationStateRef.current.inertiaFrameId) {
      cancelAnimationFrame(rotationStateRef.current.inertiaFrameId);
      rotationStateRef.current.inertiaFrameId = null;
    }
    setInertiaActive(false);
    
    // Si on a une référence à la caméra, synchroniser la rotation cible
    if (cameraRef) {
      rotationStateRef.current.targetRotation.y = cameraRef.rotation.y;
    }
  }, [cameraRef]);

  // Attacher les écouteurs d'événements tactiles
  const attachTouchListeners = useCallback((element) => {
    if (!element) return () => {};
    
    // Spécifier { passive: true } pour de meilleures performances
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Initialiser la rotation cible si la caméra est disponible
    if (cameraRef) {
      rotationStateRef.current.targetRotation = {
        x: cameraRef.rotation.x,
        y: cameraRef.rotation.y,
        z: cameraRef.rotation.z || 0
      };
    }
    
    // Définir la variable globale pour éviter les interférences avec useCameraControls
    window.__touchControlsActive = true;
    // Définir la variable globale pour contrôler l'inversion dans useCameraControls
    window.__invertTouchControls = !invertSwipe;
    
    // Fonction de nettoyage
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      // S'assurer que l'inertie est arrêtée
      stopInertia();
      
      // Supprimer les variables globales
      delete window.__touchControlsActive;
      delete window.__invertTouchControls;
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, stopInertia, cameraRef, invertSwipe]);

  return {
    attachTouchListeners,
    stopInertia,
    isInertiaActive: inertiaActive,
    getRotationState: () => rotationStateRef.current
  };
}