/**
 * Hook pour la gestion des contrôles tactiles améliorés
 * Convertit les événements tactiles en événements comparables à la souris/molette
 * Ajoute une inertie pour le swipe horizontal
 */
import { useCallback, useRef, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook personnalisé pour gérer les interactions tactiles avec inertie
 * @param {Object} options - Options de configuration
 * @param {Function} options.onScroll - Fonction de callback pour le défilement
 * @param {Function} options.onMouseMove - Fonction de callback pour le mouvement horizontal (rotation)
 * @param {Number} options.sensitivity - Facteur de sensibilité du toucher (défaut: 2.5)
 * @param {Number} options.threshold - Seuil de détection du mouvement (défaut: 3px)
 * @returns {Object} - Gestionnaires d'événements tactiles et fonction d'attachement
 */
export default function useTouchControls({ 
  onScroll, 
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
    moveType: null  // 'vertical' ou 'horizontal'
  });
  
  // Variables pour l'inertie
  const inertiaRef = useRef({
    vertical: 0,
    horizontal: 0,
    active: false
  });
  
  // Référence pour les intervalles d'inertie
  const inertiaIntervalRef = useRef(null);
  
  // Référence pour la dernière vélocité de mouvement
  const velocityRef = useRef({
    x: 0,
    y: 0,
    timestamp: 0
  });
  
  // Paramètres d'inertie
  const inertiaOptions = {
    horizontalDuration: 500,   // Durée de l'inertie horizontale en ms
    horizontalDamping: 0.92,   // Facteur d'amortissement (plus élevé = plus long)
    horizontalMinSpeed: 0.5,   // Vitesse minimale pour continuer l'inertie
    verticalSteps: 5,          // Nombre d'étapes pour l'inertie verticale
    verticalDamping: 0.85      // Facteur d'amortissement vertical
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
   */
  const applyHorizontalInertia = (initialVelocity) => {
    if (!onMouseMove || Math.abs(initialVelocity) < inertiaOptions.horizontalMinSpeed) return;
    
    // Arrêter toute inertie existante
    stopInertia();
    
    // Calculer la position initiale (centre de l'écran)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let currentVelocity = initialVelocity;
    let elapsedTime = 0;
    const startTime = Date.now();
    
    inertiaRef.current.active = true;
    
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
      // Le facteur moveX est utilisé pour simuler un "déplacement" du doigt
      // Nous gardons une position de base au centre (0) et ajoutons le déplacement simulé
      const normalizedX = moveX;
      const normalizedY = 0; // Garder à 0 pour ne pas affecter la rotation verticale
      
      // Créer un événement de mouvement de souris simulé
      const simulatedMouseEvent = {
        clientX: viewportWidth / 2 + (normalizedX * viewportWidth / 2),
        clientY: viewportHeight / 2,
        normalizedX: normalizedX,
        normalizedY: normalizedY,
        isTouchEvent: true,
        isInertiaEvent: true
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
      moveType: null
    };
    
    // Réinitialiser les vélocités
    velocityRef.current = {
      x: 0,
      y: 0,
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
    const deltaY = touch.clientY - state.lastY;
    const deltaX = touch.clientX - state.lastX;
    
    // Mettre à jour les vélocités si suffisamment de temps s'est écoulé
    if (elapsed > 16) {  // ~60fps
      velocityRef.current = {
        x: calculateVelocity(deltaX, elapsed),
        y: calculateVelocity(deltaY, elapsed),
        timestamp: now
      };
    }
    
    // Déterminer le type de mouvement si pas encore défini
    if (!state.moveType && (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold)) {
      // Si le mouvement horizontal est plus important que le vertical, c'est une rotation
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        touchStateRef.current.moveType = 'horizontal';
      } else {
        touchStateRef.current.moveType = 'vertical';
      }
    }
    
    // Traiter en fonction du type de mouvement
    if (state.moveType === 'vertical' && onScroll) {
      // Défilement vertical
      if (Math.abs(deltaY) > threshold) {
        touchStateRef.current.moving = true;
        
        const scrollEvent = {
          deltaY: deltaY * sensitivity,
          isTouchEvent: true
        };
        
        onScroll(scrollEvent);
        
        // Stocker l'inertie verticale
        inertiaRef.current.vertical = deltaY * sensitivity;
      }
    }
    else if (state.moveType === 'horizontal' && onMouseMove) {
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
        
        // Stocker l'inertie horizontale
        inertiaRef.current.horizontal = velocityRef.current.x;
        
        // Créer un événement de mouvement de souris simulé
        const simulatedMouseEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          normalizedX: normalizedX,
          normalizedY: normalizedY,
          isTouchEvent: true
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
  }, [onScroll, onMouseMove, sensitivity, threshold]);
  
  /**
   * Gestionnaire pour la fin du toucher (avec inertie)
   */
  const handleTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;
    const lastVelocity = velocityRef.current;
    
    // Vérifier si on a assez d'informations pour appliquer l'inertie
    if (state.moving && state.moveType) {
      if (state.moveType === 'horizontal') {
        // Appliquer l'inertie horizontale
        applyHorizontalInertia(lastVelocity.x);
      }
      else if (state.moveType === 'vertical' && onScroll) {
        // Appliquer l'inertie verticale avec plusieurs étapes
        let inertiaFactor = inertiaRef.current.vertical * 0.2;
        
        // Créer une séquence d'étapes d'inertie qui diminue progressivement
        for (let i = 0; i < inertiaOptions.verticalSteps; i++) {
          setTimeout(() => {
            if (!inertiaRef.current.active) return;
            
            // Réduire l'inertie à chaque étape
            inertiaFactor *= inertiaOptions.verticalDamping;
            
            // Créer un événement de défilement basé sur l'inertie
            const inertiaEvent = { 
              deltaY: inertiaFactor,
              isTouchEvent: true,
              isInertiaEvent: true
            };
            
            if (onScroll && Math.abs(inertiaFactor) > 0.5) {
              onScroll(inertiaEvent);
            }
          }, i * 60);  // Espacer les étapes de 60ms
        }
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
      moveType: null
    };
    // Réinitialiser le flag après un délai
setTimeout(() => {
  window.__preventCameraReset = false;
}, 2000);
    
    // Empêcher le comportement par défaut seulement si nous détectons un mouvement
    if (state.moving) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [onScroll, sensitivity]);
  
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