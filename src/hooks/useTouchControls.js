/**
 * Hook pour la gestion des contrôles tactiles améliorés
 * Convertit les événements tactiles en événements de rotation avec support de swipe
 */
import { useCallback, useRef, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook personnalisé pour gérer les interactions tactiles avec inertie et swipe
 * @param {Object} options - Options de configuration
 * @param {Function} options.onMouseMove - Fonction de callback pour le mouvement horizontal (rotation)
 * @param {Number} options.sensitivity - Facteur de sensibilité du toucher (défaut: 2.5)
 * @param {Number} options.threshold - Seuil de détection du mouvement (défaut: 3px)
 * @returns {Object} - Gestionnaires d'événements tactiles et fonction d'attachement
 */
export default function useTouchControls({ 
  onMouseMove = null,
  sensitivity = 2.5,
  threshold = 3
}) {
  // Utiliser useRef pour les états qui ne déclenchent pas de rendu
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    timestamp: 0,
    moving: false,
    moveType: null,  // 'horizontal'
    isSwiping: false
  });
  
  // Variables pour l'inertie
  const inertiaRef = useRef({
    horizontal: 0,
    active: false
  });
  
  // Référence pour les intervalles d'inertie
  const inertiaIntervalRef = useRef(null);
  
  // Référence pour la dernière vélocité de mouvement
  const velocityRef = useRef({
    x: 0,
    timestamp: 0
  });
  
  // Paramètres d'inertie
  const inertiaOptions = {
    horizontalDuration: 1000,    // Durée de l'inertie horizontale en ms
    horizontalDamping: 0.92,     // Facteur d'amortissement (plus élevé = plus long)
    horizontalMinSpeed: 0.5,     // Vitesse minimale pour continuer l'inertie
    swipeThreshold: 5,           // Seuil de vitesse pour considérer un geste comme un swipe
    swipeInertiaMultiplier: 1.5  // Multiplicateur d'inertie pour un swipe (vs. mouvement continu)
  };
  
  /**
   * Calcule la vélocité du mouvement
   * @param {Number} delta - Distance parcourue
   * @param {Number} time - Temps écoulé en ms
   * @returns {Number} - Vélocité
   */
  const calculateVelocity = (delta, time) => {
    if (time === 0) return 0;
    // Limiter la vélocité maximale
    return Math.min(Math.abs(delta) / time * 16, 20) * Math.sign(delta);
  };
  
  /**
   * Applique l'inertie après un swipe horizontal
   * @param {Number} initialVelocity - Vélocité initiale
   * @param {Boolean} isSwipeGesture - Indique si c'est un geste de swipe rapide
   */
  const applyHorizontalInertia = (initialVelocity, isSwipeGesture = false) => {
    if (!onMouseMove || Math.abs(initialVelocity) < inertiaOptions.horizontalMinSpeed) return;
    
    // Arrêter toute inertie existante
    stopInertia();
    
    // Pour l'inertie du swipe, on veut aussi inverser la direction
    // pour que l'effet soit cohérent avec la gestuelle
    initialVelocity = -initialVelocity;
    
    // Appliquer un multiplicateur si c'est un swipe
    let currentVelocity = initialVelocity;
    if (isSwipeGesture) {
      currentVelocity *= inertiaOptions.swipeInertiaMultiplier;
    }
    
    // Calculer la position initiale (centre de l'écran)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    inertiaRef.current.active = true;
    
    // Définir un flag global pour empêcher le retour automatique à la position initiale
    window.__maintainCameraPosition = true;
    
    // Créer une fonction d'inertie qui s'exécute à intervalles réguliers
    const inertiaStep = () => {
      if (!inertiaRef.current.active || !onMouseMove) {
        stopInertia();
        return;
      }
      
      // Réduire la vélocité progressivement
      currentVelocity *= inertiaOptions.horizontalDamping;
      
      // Calculer le déplacement basé sur la vélocité
      const moveX = currentVelocity * 0.08; // Facteur pour ajuster la sensation de déplacement
      
      // Calculer la position normalisée
      const normalizedX = moveX;
      const normalizedY = 0; // Garder à 0 pour ne pas affecter la rotation verticale
      
      // Créer un événement de mouvement de souris simulé
      const simulatedMouseEvent = {
        clientX: viewportWidth / 2 + (normalizedX * viewportWidth / 2),
        clientY: viewportHeight / 2,
        normalizedX: normalizedX,
        normalizedY: normalizedY,
        isTouchEvent: true,
        isInertiaEvent: true,
        preventAutoReset: true // Flag supplémentaire pour indiquer qu'il ne faut pas réinitialiser
      };
      
      // Appeler la fonction de mouvement
      onMouseMove(simulatedMouseEvent);
      
      // Vérifier si on doit continuer l'inertie
      if (Math.abs(currentVelocity) < inertiaOptions.horizontalMinSpeed) {
        stopInertia();
        return;
      }
      
      // Programmer la prochaine étape
      inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
    };
    
    // Démarrer l'inertie
    inertiaIntervalRef.current = requestAnimationFrame(inertiaStep);
  };
  
  /**
   * Arrête toutes les inerties en cours
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
    // S'assurer que nous traitons un seul toucher
    if (e.touches.length !== 1) return;
    
    // Arrêter toute inertie en cours
    stopInertia();
    
    const touch = e.touches[0];
    
    // Stocker les informations initiales du toucher
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      timestamp: Date.now(),
      moving: false,
      moveType: null,
      isSwiping: false
    };
    
    // Réinitialiser les vélocités
    velocityRef.current = {
      x: 0,
      timestamp: Date.now()
    };
  }, []);
  
  /**
   * Gestionnaire pour le mouvement du toucher
   */
  const handleTouchMove = useCallback((e) => {
    // Vérifier si un toucher est en cours
    if (!touchStateRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    const state = touchStateRef.current;
    const elapsed = now - velocityRef.current.timestamp;
    
    // Calculer les deltas
    const deltaX = touch.clientX - state.lastX;
    
    // Mettre à jour les vélocités si suffisamment de temps s'est écoulé
    if (elapsed > 16) {  // ~60fps
      velocityRef.current = {
        x: calculateVelocity(deltaX, elapsed),
        timestamp: now
      };
    }
    
    // Calculer la distance parcourue depuis le début du toucher
    const totalDistanceX = Math.abs(touch.clientX - state.startX);
    
    // Déterminer le type de mouvement si pas encore défini
    if (!state.moveType && Math.abs(deltaX) > threshold) {
      touchStateRef.current.moveType = 'horizontal';
    }
    
    // Marquer comme swipe si on dépasse un certain seuil de distance rapidement
    if (totalDistanceX > 30 && (now - state.timestamp) < 300) {
      touchStateRef.current.isSwiping = true;
    }
    
    // Traiter en fonction du type de mouvement (toujours horizontal maintenant)
    if (state.moveType === 'horizontal' && onMouseMove) {
      // Mouvement horizontal = rotation (regarder à gauche/droite)
      if (Math.abs(deltaX) > threshold) {
        window.__preventCameraReset = true;
        touchStateRef.current.moving = true;
        
        // Calculer la position normalisée pour la rotation
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Normaliser la position entre -1 et 1
        const normalizedX = (touch.clientX / viewportWidth) * 2 - 1;
        const normalizedY = (touch.clientY / viewportHeight) * 2 - 1;
        
        // Pour le toucher continu, on n'inverse PAS la direction
        // Cela conserve le comportement d'origine que les utilisateurs connaissent déjà
        
        // Stocker l'inertie horizontale
        inertiaRef.current.horizontal = velocityRef.current.x;
        
        // Créer un événement de mouvement de souris simulé
        const simulatedMouseEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          normalizedX: normalizedX, // Utiliser la valeur non inversée
          normalizedY: normalizedY,
          isTouchEvent: true,
          preventAutoReset: true // Empêcher le reset automatique
        };
        
        // Appeler la fonction de mouvement de souris
        onMouseMove(simulatedMouseEvent);
      }
    }
    
    // Mettre à jour l'état du toucher
    touchStateRef.current = {
      ...touchStateRef.current,
      lastX: touch.clientX,
      lastY: touch.clientY
    };
    
    // Empêcher le comportement par défaut seulement si nous détectons un mouvement
    if (touchStateRef.current.moving) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [onMouseMove, threshold]);
  
  /**
   * Gestionnaire pour la fin du toucher (avec inertie)
   */
  const handleTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;
    const lastVelocity = velocityRef.current;
    const endTime = Date.now();
    const touchDuration = endTime - state.timestamp;
    
    // Calculer la distance totale parcourue pour mieux détecter les swipes
    const totalDistanceX = Math.abs(state.lastX - state.startX);
    
    // Déterminer si c'est un swipe rapide - condition améliorée
    // Un swipe doit être rapide ET avoir parcouru une distance minimale
    const isSwipeGesture = touchDuration < 300 && 
                           Math.abs(lastVelocity.x) > inertiaOptions.swipeThreshold &&
                           totalDistanceX > 20; // Distance minimale en pixels
    
    // Vérifier si on a assez d'informations pour appliquer l'inertie
    if (state.moving && state.moveType === 'horizontal') {
      // Appliquer l'inertie horizontale avec un multiplicateur pour les swipes
      applyHorizontalInertia(lastVelocity.x, isSwipeGesture);
      
      logger.log(`Toucher terminé: ${isSwipeGesture ? 'Swipe' : 'Mouvement normal'} avec vélocité ${lastVelocity.x} et distance ${totalDistanceX}px`);
      
      // Pour les swipes, empêcher le retour à la position initiale pendant un temps plus long
      if (isSwipeGesture) {
        window.__preventCameraReset = true;
        window.__maintainCameraPosition = true;
        
        // Pour les swipes, on maintient la position plus longtemps
        setTimeout(() => {
          window.__maintainCameraPosition = false;
        }, 5000); // 5 secondes
      }
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
      isSwiping: false
    };
    
    // Réinitialiser le flag après un délai
    // Mais seulement si ce n'est pas un swipe (pour les swipes, on a un délai plus long défini ci-dessus)
    if (!isSwipeGesture) {
      setTimeout(() => {
        window.__preventCameraReset = false;
      }, 2000);
    }
    
    // Empêcher le comportement par défaut seulement si nous détectons un mouvement
    if (state.moving) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [onMouseMove]);
  
  /**
   * Arrête toutes les animations d'inertie lors du démontage
   */
  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, []);
  
  // Fonction pour attacher les événements tactiles à un élément
  const attachTouchListeners = useCallback((element) => {
    if (!element) return () => {};
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    logger.log("Contrôles tactiles améliorés attachés à l'élément", element);
    
    // Fonction de nettoyage
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      stopInertia();
      
      logger.log("Contrôles tactiles détachés");
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  // Exporter les gestionnaires d'événements et la fonction d'attachement
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    attachTouchListeners
  };
}