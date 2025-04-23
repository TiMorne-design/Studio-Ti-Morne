/**
 * Version améliorée de useTouchControls.js
 * Résout les problèmes avec les petits swipes rapides
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
    active: false,
    direction: 0,
    initialVelocity: 0
  });
  
  // Référence pour les animations d'inertie
  const inertiaIntervalRef = useRef(null);
  
  // Paramètres pour le comportement du swipe - AMÉLIORÉS
  const swipeOptions = {
    damping: 0.96, // Amortissement plus lent pour éviter le retour rapide (0.92 -> 0.96)
    minSpeed: 0.05, // Seuil plus bas pour maintenir l'inertie plus longtemps (0.1 -> 0.05)
    swipeThreshold: 0.8, // Seuil de vélocité plus bas pour les swipes rapides (1.5 -> 0.8)
    swipeMultiplier: 2.5, // Effet plus prononcé, surtout pour les petits swipes (1.5 -> 2.5)
    shortSwipeBoost: 1.8, // Boost spécial pour les swipes courts mais rapides
    swipeDurationThreshold: 300, // Durée max réduite pour mieux détecter les swipes rapides (500 -> 300)
    minSwipeDistance: 5, // Distance minimale réduite pour détecter les swipes courts (10 -> 5)
    maxVelocity: 5.0, // Vélocité maximale augmentée (4.0 -> 5.0)
    inertiaDuration: 1000, // Durée minimale garantie de l'inertie en ms
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
      totalX: 0, // Suivre le déplacement total
      totalY: 0,
      velocityX: 0, // Stocker la vélocité directement
      lastTime: Date.now(), // Temps du dernier mouvement
      touchStartTime: Date.now() // NOUVEAU: Pour calculer la durée totale du toucher
    };
    
    logger.log("Touch start détecté", touch.clientX, touch.clientY);
  }, [stopInertia]);
  
  /**
   * Gestionnaire pour le mouvement du toucher
   * Collecte uniquement les données pour le swipe sans déplacer la caméra
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
      // AMÉLIORÉ: Pondération plus forte sur la nouvelle vélocité pour les mouvements rapides
      const weightNew = Math.min(0.5, timeDelta / 50); // 0.3 -> dynamique jusqu'à 0.5
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
    
    // IMPORTANT: Envoyer les événements de mouvement pour la rotation en temps réel
    // mais uniquement si c'est un mouvement horizontal
    if (onMouseMove && (state.moveType === 'horizontal' || !state.moveType)) {
      // Convertir en coordonnées normalisées (-1 à 1)
      const normalizedX = (touch.clientX / window.innerWidth) * 2 - 1;
      
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
  }, [onMouseMove, threshold, swipeOptions.minSwipeDistance]);
  
  /**
   * Applique l'inertie après un swipe - AMÉLIORÉE pour les swipes courts mais rapides
   */
  const applyInertia = useCallback((velocity, direction, touchDuration, distance) => {
    if (!onMouseMove) return;
    
    // Arrêter toute inertie existante
    stopInertia();
    
    // Stocker les informations d'inertie
    inertiaRef.current.direction = direction;
    inertiaRef.current.initialVelocity = velocity;
    
    // AMÉLIORÉ: Boost pour les swipes courts mais rapides
    // Si le swipe est court mais rapide, augmenter la vélocité
    const isShortSwipe = touchDuration < 150 && distance < 50;
    const isVeryShortSwipe = touchDuration < 80 && distance < 30;
    
    // Vélocité initiale (pixels par frame à 60fps)
    let currentVelocity = velocity * swipeOptions.swipeMultiplier;
    
    // Appliquer un boost supplémentaire pour les swipes courts mais rapides
    if (isVeryShortSwipe) {
      currentVelocity *= swipeOptions.shortSwipeBoost * 1.5;
      logger.log("Boost très élevé appliqué pour swipe très court", currentVelocity);
    } else if (isShortSwipe) {
      currentVelocity *= swipeOptions.shortSwipeBoost;
      logger.log("Boost élevé appliqué pour swipe court", currentVelocity);
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
      if (!inertiaRef.current.active || !onMouseMove) {
        stopInertia();
        return;
      }
      
      // Temps écoulé depuis le début de l'inertie
      const elapsedTime = Date.now() - startTime;
      
      // AMÉLIORÉ: Amortissement variable - plus lent au début, plus rapide à la fin
      const currentDamping = elapsedTime < guaranteedDuration / 3 
          ? Math.max(0.97, swipeOptions.damping) // Très lent au début
          : swipeOptions.damping;
      
      // Appliquer l'amortissement
      currentVelocity *= currentDamping;
      
      // NOUVEAU: Garantir que l'inertie dure au moins la durée minimale
      const shouldContinue = elapsedTime < guaranteedDuration || 
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
      
      // Créer un événement simulé avec le flag tactile explicite
      const simulatedEvent = {
        clientX: window.innerWidth * (0.5 + normalizedX * 0.5), // entre 0 et window.innerWidth
        clientY: window.innerHeight / 2,
        normalizedX: normalizedX,
        normalizedY: 0,
        isTouchEvent: true, // Crucial pour être traité correctement
        type: 'touchmove'   // Ajouter le type d'événement
      };
      
      // Log pour débogage occasionnel
      if (Math.abs(currentVelocity) > 0.5 && Math.random() < 0.05) {
        logger.log("Inertie active - vélocité:", currentVelocity.toFixed(2), 
                   "position:", normalizedX.toFixed(2), 
                   "temps écoulé:", elapsedTime);
      }
      
      // Envoyer l'événement aux contrôles de caméra
      onMouseMove(simulatedEvent);
      
      // Programmer la prochaine étape
      inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
    };
    
    // Démarrer l'animation
    inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
    
    // Pour le débogage
    return () => stopInertia();
  }, [onMouseMove, stopInertia]);
  
  /**
   * Gestionnaire pour la fin du toucher - AMÉLIORÉ pour mieux détecter les swipes courts
   */
  const handleTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;
    
    // Si pas d'état de toucher valide, ignorer
    if (!state || !state.moving) {
      return;
    }
    
    const endTime = Date.now();
    const touchDuration = endTime - state.touchStartTime; // Utiliser le temps de début initial
    
    // Calculer la distance totale du swipe
    const distanceX = Math.abs(state.totalX);
    
    // Direction du swipe (-1 pour gauche, 1 pour droite)
    const direction = Math.sign(state.totalX);
    
    // AMÉLIORÉ: Utiliser une vélocité moyenne et instantanée
    // Pour les swipes très courts, la vélocité instantanée peut être plus fiable
    const avgVelocity = distanceX / touchDuration; // px/ms
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
    
    // AMÉLIORÉ: Ajuster les seuils pour mieux détecter les swipes courts mais rapides
    // Réduire le seuil de distance minimale pour les swipes très rapides
    const effectiveMinDistance = touchDuration < 150 
        ? swipeOptions.minSwipeDistance / 2 
        : swipeOptions.minSwipeDistance;
    
    // Vérifier si c'est un swipe valide:
    // 1. Mouvement horizontal détecté
    // 2. Durée inférieure au seuil
    // 3. Distance suffisante (adaptative)
    // 4. Vélocité suffisante
    const isSwipe = 
      state.moveType === 'horizontal' &&
      touchDuration < swipeOptions.swipeDurationThreshold &&
      distanceX > effectiveMinDistance &&
      effectiveVelocity > swipeOptions.swipeThreshold / 1000; // Convertir en px/ms

    if (isSwipe) {
      // AMÉLIORÉ: Passer plus d'informations à applyInertia
      logger.log("Swipe valide détecté! Lancement de l'inertie", effectiveVelocity);
      
      // Convertir la vélocité en px/frame (60fps estimé)
      const frameVelocity = effectiveVelocity * 16.66; // ~60fps
      
      // Passer la durée du toucher et la distance pour un meilleur ajustement de l'inertie
      applyInertia(frameVelocity, direction, touchDuration, distanceX);
    } else {
      logger.log("Mouvement non considéré comme swipe", {
        distanceX, 
        touchDuration,
        seuilDistance: effectiveMinDistance,
        effectiveVelocity,
        seuilVelocite: swipeOptions.swipeThreshold / 1000
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
  }, [applyInertia]);
  
  /**
   * Nettoyage lors du démontage
   */
  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [stopInertia]);
  
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
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, stopInertia]);
  
  // Retourner l'API du hook
  return {
    attachTouchListeners,
    stopInertia
  };
}