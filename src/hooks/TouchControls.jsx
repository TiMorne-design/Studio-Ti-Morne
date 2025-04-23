/**
 * Hook personnalisé pour gérer uniquement les interactions tactiles
 * Version refactorisée pour séparer clairement les contrôles tactiles et souris
 */
import { useCallback, useRef, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook personnalisé pour gérer uniquement les interactions tactiles
 * @param {Object} options - Options de configuration
 * @param {Function} options.onRotation - Fonction de callback pour la rotation tactile
 * @param {Number} options.sensitivity - Sensibilité des mouvements tactiles
 * @param {Number} options.threshold - Seuil de détection des mouvements
 * @param {Boolean} options.enableSwipe - Activer/désactiver les swipes
 * @returns {Object} - API pour le contrôle tactile
 */
export default function useTouchControls({ 
  onRotation = null,
  sensitivity = 1.5,
  threshold = 3,
  enableSwipe = false  // Désactivé par défaut
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
  
  // Référence pour l'inertie
  const inertiaRef = useRef({
    active: false,
    direction: 0,
    initialVelocity: 0
  });
  
  // Référence pour les animations d'inertie
  const inertiaIntervalRef = useRef(null);
  
  // Paramètres pour le comportement du swipe
  const swipeOptions = {
    damping: 0.94,
    minSpeed: 0.1,
    swipeThreshold: 0.8,
    swipeMultiplier: 1.2,
    shortSwipeBoost: 1.3,
    swipeDurationThreshold: 300,
    minSwipeDistance: 5,
    maxVelocity: 3.0,
    inertiaDuration: 600,
    invertDirection: true,
  };
  
  /**
   * Arrête l'inertie en cours
   */
  const stopInertia = useCallback(() => {
    if (inertiaIntervalRef.current) {
      cancelAnimationFrame(inertiaIntervalRef.current);
      inertiaIntervalRef.current = null;
    }
    inertiaRef.current.active = false;
    
    logger.log("Inertie arrêtée");
  }, []);
  
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
      totalX: 0,
      totalY: 0,
      velocityX: 0,
      lastTime: Date.now(),
      touchStartTime: Date.now()
    };
    
    logger.log("Touch start détecté", touch.clientX, touch.clientY);
  }, [stopInertia]);
  
  /**
   * Gestionnaire pour le mouvement du toucher
   * Séparé en deux fonctions: rotation et swipe
   */
  const handleTouchMove = useCallback((e) => {
    // Vérifications de base
    if (!touchStateRef.current || e.touches.length !== 1) return;

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
      const weightNew = Math.min(0.5, timeDelta / 50);
      state.velocityX = state.velocityX * (1 - weightNew) + newVelocityX * weightNew;
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
    
    // IMPORTANT: Envoyer les événements de rotation en temps réel
    if (onRotation && (state.moveType === 'horizontal' || !state.moveType)) {
      // Convertir en coordonnées normalisées (-1 à 1)
      let normalizedX = (touch.clientX / window.innerWidth) * 2 - 1;
      let normalizedY = (touch.clientY / window.innerHeight) * 2 - 1;
      
      // Inverser si nécessaire pour correspondre aux attentes
      if (swipeOptions.invertDirection) {
        normalizedX = -normalizedX;
      }
      
      // Appeler la fonction de rotation
      onRotation(normalizedX, normalizedY);
      
      // Bloquer la propagation mais seulement si c'est un mouvement horizontal confirmé
      if (Math.abs(state.totalX) > swipeOptions.minSwipeDistance) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, [onRotation, threshold, swipeOptions.invertDirection, swipeOptions.minSwipeDistance]);
  
  /**
   * Applique l'inertie après un swipe
   */
  const applyInertia = useCallback((velocity, direction, touchDuration, distance) => {
    // Si les swipes sont désactivés ou pas de callback, ne rien faire
    if (!enableSwipe || !onRotation) return;
    
    // Arrêter toute inertie existante
    stopInertia();
    
    // Inverser la direction si l'option est activée
    if (swipeOptions.invertDirection) {
      direction = -direction;
    }
    
    // Stocker les informations d'inertie
    inertiaRef.current.direction = direction;
    inertiaRef.current.initialVelocity = velocity;
    
    // Boost pour les swipes courts mais rapides
    const isShortSwipe = touchDuration < 150 && distance < 50;
    const isVeryShortSwipe = touchDuration < 80 && distance < 30;
    
    // Vélocité initiale (pixels par frame à 60fps)
    let currentVelocity = velocity * swipeOptions.swipeMultiplier;
    
    // Appliquer un boost modéré pour les swipes courts mais rapides
    if (isVeryShortSwipe) {
      currentVelocity *= swipeOptions.shortSwipeBoost * 1.2;
      logger.log("Boost modéré appliqué pour swipe très court", currentVelocity);
    } else if (isShortSwipe) {
      currentVelocity *= swipeOptions.shortSwipeBoost;
      logger.log("Boost appliqué pour swipe court", currentVelocity);
    }
    
    // S'assurer qu'elle est dans la bonne direction
    currentVelocity = Math.abs(currentVelocity) * direction;
    
    // Limiter la vélocité maximale
    const maxVelocity = swipeOptions.maxVelocity;
    currentVelocity = Math.sign(currentVelocity) * Math.min(Math.abs(currentVelocity), maxVelocity);
    
    // Activation de l'inertie
    inertiaRef.current.active = true;
    
    // Position cumulée pour l'animation
    let cumulativeX = 0;
    
    // Pour garantir une durée minimale d'inertie
    const startTime = Date.now();
    const guaranteedDuration = swipeOptions.inertiaDuration;
    
    // Fonction d'animation d'inertie
    const inertiaStep = () => {
      if (!inertiaRef.current.active || !onRotation) {
        stopInertia();
        return;
      }
      
      // Temps écoulé depuis le début de l'inertie
      const elapsedTime = Date.now() - startTime;
      
      // Amortissement plus régulier et progressif
      const currentDamping = elapsedTime < guaranteedDuration / 4
          ? Math.max(0.95, swipeOptions.damping)
          : swipeOptions.damping;
      
      // Appliquer l'amortissement
      currentVelocity *= currentDamping;
      
      // Garantir que l'inertie respecte la durée minimale mais s'arrête plus vite si trop lente
      const shouldContinue = elapsedTime < guaranteedDuration / 2 ||
                            Math.abs(currentVelocity) >= swipeOptions.minSpeed;
      
      if (!shouldContinue) {
        logger.log("Inertie terminée après", elapsedTime, "ms");
        stopInertia();
        return;
      }
      
      // Calculer le déplacement pour cette frame
      cumulativeX += currentVelocity;
      
      // Limiter la rotation maximale (en proportion de l'écran)
      const maxRotation = window.innerWidth * 0.5;
      cumulativeX = Math.max(-maxRotation, Math.min(maxRotation, cumulativeX));
      
      // Convertir en valeur normalisée pour la rotation de la caméra (-1 à 1)
      const normalizedX = cumulativeX / maxRotation;
      const normalizedY = 0; // Pas de déplacement vertical pendant l'inertie
      
      // Appeler la fonction de rotation
      onRotation(normalizedX, normalizedY);
      
      // Log pour débogage occasionnel
      if (Math.abs(currentVelocity) > 0.5 && Math.random() < 0.05) {
        logger.log("Inertie active - vélocité:", currentVelocity.toFixed(2), 
                  "position:", normalizedX.toFixed(2), 
                  "temps écoulé:", elapsedTime);
      }
      
      // Programmer la prochaine étape
      inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
    };
    
    // Démarrer l'animation si les swipes sont activés
    if (enableSwipe) {
      inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
    }
    
    // Pour le débogage
    return () => stopInertia();
  }, [onRotation, stopInertia, enableSwipe, swipeOptions]);
  
  /**
   * Gestionnaire pour la fin du toucher
   */
  const handleTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;
    
    // Si pas d'état de toucher valide, ignorer
    if (!state || !state.moving) {
      return;
    }
    
    // Si les swipes sont désactivés, ne pas traiter l'inertie
    if (!enableSwipe) {
      // Réinitialiser simplement l'état du toucher
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
      return;
    }
    
    const endTime = Date.now();
    const touchDuration = endTime - state.touchStartTime;
    
    // Calculer la distance totale du swipe
    const distanceX = Math.abs(state.totalX);
    
    // Direction du swipe (-1 pour gauche, 1 pour droite)
    const direction = Math.sign(state.totalX);
    
    // Utiliser une vélocité moyenne et instantanée
    const avgVelocity = distanceX / touchDuration;
    const instantVelocity = state.velocityX;
    
    // Utiliser la plus grande des deux vélocités pour favoriser les swipes courts
    const effectiveVelocity = Math.max(avgVelocity, Math.abs(instantVelocity));
    
    // Débogage
    logger.log("Touch end:", {
      durée: touchDuration,
      distance: distanceX,
      direction,
      vélocitéInstantanée: instantVelocity,
      vélocitéMoyenne: avgVelocity,
      vélocitéEffective: effectiveVelocity,
      moveType: state.moveType
    });
    
    // Ajuster les seuils pour mieux détecter les swipes courts mais rapides
    const effectiveMinDistance = touchDuration < 150 
        ? swipeOptions.minSwipeDistance / 2 
        : swipeOptions.minSwipeDistance;
    
    // Vérifier si c'est un swipe valide
    const isSwipe = 
      state.moveType === 'horizontal' &&
      touchDuration < swipeOptions.swipeDurationThreshold &&
      distanceX > effectiveMinDistance &&
      effectiveVelocity > swipeOptions.swipeThreshold / 1000;

    if (isSwipe && enableSwipe) {
      logger.log("Swipe valide détecté! Lancement de l'inertie", effectiveVelocity);
      
      // Convertir la vélocité en px/frame (60fps estimé)
      const frameVelocity = effectiveVelocity * 16.66;
      
      // Passer la durée du toucher et la distance pour un meilleur ajustement de l'inertie
      applyInertia(frameVelocity, direction, touchDuration, distanceX);
    } else {
      logger.log("Mouvement non considéré comme swipe ou swipes désactivés", {
        distanceX, 
        touchDuration,
        seuilDistance: effectiveMinDistance,
        effectiveVelocity,
        seuilVelocite: swipeOptions.swipeThreshold / 1000,
        enableSwipe
      });
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
  }, [applyInertia, enableSwipe, swipeOptions]);
  
  /**
   * Attache les écouteurs d'événements tactiles
   * @param {HTMLElement} element - Élément auquel attacher les écouteurs
   * @returns {Function} - Fonction de nettoyage
   */
  const attachTouchListeners = useCallback((element) => {
    if (!element) return () => {};
    
    // Attacher les gestionnaires d'événements
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    logger.log("Contrôles tactiles attachés à l'élément", element);
    
    // Fonction de nettoyage
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      stopInertia();
      
      logger.log("Contrôles tactiles détachés");
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, stopInertia]);
  
  /**
   * Envoie directement une rotation tactile
   * Utile pour les contrôles directs depuis d'autres composants
   * @param {Number} normalizedX - Position X normalisée (-1 à 1)
   * @param {Number} normalizedY - Position Y normalisée (-1 à 1)
   * @returns {Boolean} - true si la rotation a été appliquée
   */
  const sendTouchRotation = useCallback((normalizedX, normalizedY) => {
    if (!onRotation) return false;
    
    // Inverser si nécessaire
    if (swipeOptions.invertDirection) {
      normalizedX = -normalizedX;
    }
    
    // Appeler la fonction de rotation
    onRotation(normalizedX, normalizedY);
    return true;
  }, [onRotation, swipeOptions.invertDirection]);
  
  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [stopInertia]);
  
  // Retourner l'API du hook
  return {
    attachTouchListeners,
    stopInertia,
    sendTouchRotation,
    isSwipeEnabled: enableSwipe,
    
    // Exposer les gestionnaires pour une utilisation externe si nécessaire
    handlers: {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd
    }
  };
}