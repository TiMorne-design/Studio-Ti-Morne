/**
 * TouchControls.js
 * Gestion complète des contrôles tactiles pour l'expérience 3D
 * Combine les fonctionnalités de rotation, déplacement et inertie
 */
import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé pour la gestion des contrôles tactiles
 * @param {Object} options - Options de configuration
 * @param {Function} options.onCameraRotate - Callback pour la rotation de la caméra
 * @param {Function} options.onCameraMove - Callback pour le déplacement de la caméra
 * @param {Object} options.splineRef - Référence à l'instance Spline
 * @param {Number} options.sensitivity - Sensibilité des mouvements (défaut: 1.5)
 * @param {Object} options.limits - Limites de mouvement de la caméra
 * @returns {Object} - API des contrôles tactiles
 */
export default function TouchControls({
  onCameraRotate = null,
  onCameraMove = null,
  splineRef = null,
  sensitivity = 1.5,
  limits = null
}) {
  // État pour les contrôles
  const [isEnabled, setIsEnabled] = useState(true);
  
  // État pour suivre les interactions tactiles
  const touchStateRef = useRef({
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
    velocityY: 0,
    lastTime: 0,
    touchStartTime: 0
  });
  
  // Référence pour l'inertie
  const inertiaRef = useRef({
    active: false,
    direction: 0,
    initialVelocity: 0
  });
  
  // Animation d'inertie active
  const inertiaAnimationRef = useRef(null);
  
  // Configuration des contrôles tactiles
  const swipeOptions = {
    // Paramètres de l'inertie
    damping: 0.94,                // Amortissement du mouvement
    minSpeed: 0.1,                // Vitesse minimum pour continuer l'inertie
    maxVelocity: 3.0,             // Vitesse maximum de l'inertie
    inertiaDuration: 600,         // Durée minimum de l'inertie en ms
    
    // Paramètres de détection des swipes
    swipeThreshold: 0.8,          // Seuil pour considérer un mouvement comme un swipe
    swipeMultiplier: 1.2,         // Multiplicateur d'effet du swipe
    swipeDurationThreshold: 300,  // Durée maximum d'un swipe en ms
    minSwipeDistance: 5,          // Distance minimum d'un swipe en pixels
    shortSwipeBoost: 1.3,         // Boost pour les swipes courts
    
    // Autres paramètres
    panThreshold: 3,              // Seuil pour détecter un mouvement de pan
    invertDirection: false,       // Inverser la direction du mouvement
    minSwipeVelocity: 0.2,        // Vitesse minimale pour un swipe valide
    doubleTapThreshold: 300,      // Délai maximum entre deux taps pour double-tap
    doubleTapDistance: 20         // Distance max entre deux taps pour double-tap
  };
  
  /**
   * Arrête toute inertie en cours
   */
  const stopInertia = useCallback(() => {
    if (inertiaAnimationRef.current) {
      cancelAnimationFrame(inertiaAnimationRef.current);
      inertiaAnimationRef.current = null;
    }
    inertiaRef.current.active = false;
  }, []);
  
  /**
   * Applique une inertie après un swipe
   * @param {Number} velocity - Vitesse initiale
   * @param {Number} direction - Direction du swipe (-1 ou 1)
   * @param {Number} touchDuration - Durée du toucher en ms
   * @param {Number} distance - Distance du swipe en pixels
   */
  const applyInertia = useCallback((velocity, direction, touchDuration, distance) => {
    if (!onCameraRotate) return;
    
    // Arrêter toute inertie précédente
    stopInertia();
    
    // Appliquer l'inversion de direction si nécessaire
    const effectiveDirection = swipeOptions.invertDirection ? -direction : direction;
    
    // Configurer l'inertie
    inertiaRef.current.direction = effectiveDirection;
    inertiaRef.current.initialVelocity = velocity;
    
    // Boost pour les swipes courts mais rapides
    const isShortSwipe = touchDuration < 150 && distance < 50;
    const isVeryShortSwipe = touchDuration < 80 && distance < 30;
    
    // Calculer la vélocité initiale
    let currentVelocity = velocity * swipeOptions.swipeMultiplier;
    
    // Appliquer des boosts si nécessaire
    if (isVeryShortSwipe) {
      currentVelocity *= swipeOptions.shortSwipeBoost * 1.2;
    } else if (isShortSwipe) {
      currentVelocity *= swipeOptions.shortSwipeBoost;
    }
    
    // Appliquer la direction et limiter la vélocité
    currentVelocity = Math.abs(currentVelocity) * effectiveDirection;
    currentVelocity = Math.sign(currentVelocity) * 
                      Math.min(Math.abs(currentVelocity), swipeOptions.maxVelocity);
    
    // Activer l'inertie
    inertiaRef.current.active = true;
    
    // Position cumulée pour l'animation
    let cumulativeX = 0;
    
    // Temps de début pour garantir une durée minimale
    const startTime = Date.now();
    
    // Fonction d'animation de l'inertie
    const inertiaStep = () => {
      if (!inertiaRef.current.active || !onCameraRotate) {
        stopInertia();
        return;
      }
      
      // Temps écoulé depuis le début
      const elapsedTime = Date.now() - startTime;
      
      // Amortissement progressif
      const currentDamping = elapsedTime < swipeOptions.inertiaDuration / 4
          ? Math.max(0.95, swipeOptions.damping)
          : swipeOptions.damping;
      
      // Appliquer l'amortissement
      currentVelocity *= currentDamping;
      
      // Vérifier si on continue l'inertie
      const shouldContinue = elapsedTime < swipeOptions.inertiaDuration / 2 ||
                            Math.abs(currentVelocity) >= swipeOptions.minSpeed;
      
      if (!shouldContinue) {
        stopInertia();
        return;
      }
      
      // Calculer le déplacement pour cette frame
      cumulativeX += currentVelocity;
      
      // Limiter la rotation maximale
      const maxRotation = window.innerWidth * 0.5;
      cumulativeX = Math.max(-maxRotation, Math.min(maxRotation, cumulativeX));
      
      // Normaliser pour la rotation de caméra (-1 à 1)
      const normalizedX = cumulativeX / maxRotation;
      
      // Créer un événement simulé
      const simulatedEvent = {
        clientX: window.innerWidth * (0.5 + normalizedX * 0.5),
        clientY: window.innerHeight / 2,
        normalizedX: normalizedX,
        normalizedY: 0,
        isTouchEvent: true,
        type: 'touchmove'
      };
      
      // Envoyer au contrôle de caméra
      onCameraRotate(simulatedEvent);
      
      // Continuer l'animation
      inertiaAnimationRef.current = requestAnimationFrame(inertiaStep);
    };
    
    // Démarrer l'animation
    inertiaAnimationRef.current = requestAnimationFrame(inertiaStep);
  }, [onCameraRotate, stopInertia, swipeOptions]);
  
  /**
   * Gère le début d'un toucher
   */
  const handleTouchStart = useCallback((e) => {
    if (!isEnabled || e.touches.length !== 1) return;
    
    // Arrêter toute inertie en cours
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
      velocityY: 0,
      lastTime: Date.now(),
      touchStartTime: Date.now()
    };
  }, [isEnabled, stopInertia]);
  
  /**
   * Gère le déplacement d'un toucher
   */
  const handleTouchMove = useCallback((e) => {
    if (!isEnabled || !touchStateRef.current || e.touches.length !== 1) return;
    
    // Vérifier si on est dans un overlay (scrollable)
    const isInOverlay = e.target.closest('.overlay-content') || 
                        e.target.closest('[class*="overlay-container"]');
    
    if (isInOverlay) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    const state = touchStateRef.current;
    
    // Calculer les deltas
    const deltaX = touch.clientX - state.lastX;
    const deltaY = touch.clientY - state.lastY;
    
    // Mettre à jour les totaux
    state.totalX += deltaX;
    state.totalY += deltaY;
    
    // Calculer la vélocité
    const timeDelta = now - state.lastTime;
    if (timeDelta > 0) {
      const newVelocityX = deltaX / timeDelta;
      const newVelocityY = deltaY / timeDelta;
      
      // Lissage de la vélocité
      const weightNew = Math.min(0.5, timeDelta / 50);
      state.velocityX = state.velocityX * (1 - weightNew) + newVelocityX * weightNew;
      state.velocityY = state.velocityY * (1 - weightNew) + newVelocityY * weightNew;
    }
    
    // Déterminer le type de mouvement si pas encore fait
    if (!state.moveType) {
      const distX = Math.abs(touch.clientX - state.startX);
      const distY = Math.abs(touch.clientY - state.startY);
      
      if (distX > swipeOptions.panThreshold || distY > swipeOptions.panThreshold) {
        // Si le mouvement horizontal est dominant
        if (distX > distY) {
          state.moveType = 'horizontal';
          state.moving = true;
        } else {
          state.moveType = 'vertical';
        }
      }
    }
    
    // Mise à jour des valeurs pour le suivi
    state.lastX = touch.clientX;
    state.lastY = touch.clientY;
    state.lastTime = now;
    
    // Envoyer les événements pour la rotation (mouvements horizontaux uniquement)
    if (onCameraRotate && (state.moveType === 'horizontal' || !state.moveType)) {
      // Normaliser la position (-1 à 1)
      const normalizedX = (touch.clientX / window.innerWidth) * 2 - 1;
      
      // Créer un événement simulé
      const simulatedEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        normalizedX: normalizedX,
        normalizedY: 0,
        isTouchEvent: true,
        type: 'touchmove'
      };
      
      // Envoyer l'événement
      onCameraRotate(simulatedEvent);
      
      // Bloquer la propagation pour les mouvements horizontaux
      if (Math.abs(state.totalX) > swipeOptions.minSwipeDistance) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    
    // Pour les mouvements verticaux, déclencher le déplacement
    if (onCameraMove && state.moveType === 'vertical') {
      // Déplacement vers l'avant/arrière
      const movementAmount = -deltaY * 4 * sensitivity; // Multiplier pour effet plus prononcé
      
      // Vérifier les limites si elles existent
      if (limits && splineRef?.current?.camera) {
        const camera = splineRef.current.camera;
        const currentZ = camera.position.z;
        
        // Appliquer les limites
        if ((currentZ <= limits.minZ && movementAmount < 0) || 
            (currentZ >= limits.maxZ && movementAmount > 0)) {
          return; // Ne pas autoriser le mouvement hors limites
        }
      }
      
      // Envoyer l'événement de mouvement
      onCameraMove(movementAmount);
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isEnabled, onCameraRotate, onCameraMove, sensitivity, limits, swipeOptions]);
  
  /**
   * Gère la fin d'un toucher
   */
  const handleTouchEnd = useCallback((e) => {
    if (!isEnabled || !touchStateRef.current || !touchStateRef.current.moving) return;
    
    const state = touchStateRef.current;
    const endTime = Date.now();
    const touchDuration = endTime - state.touchStartTime;
    
    // Calculer les métriques du swipe
    const distanceX = Math.abs(state.totalX);
    const direction = Math.sign(state.totalX);
    
    // Calculer la vélocité moyenne et instantanée
    const avgVelocity = distanceX / touchDuration; // px/ms
    const instantVelocity = state.velocityX;
    
    // Utiliser la plus grande vélocité pour favoriser les swipes courts
    const effectiveVelocity = Math.max(avgVelocity, Math.abs(instantVelocity));
    
    // Seuil adaptatif pour les swipes courts mais rapides
    const effectiveMinDistance = touchDuration < 150 
        ? swipeOptions.minSwipeDistance / 2 
        : swipeOptions.minSwipeDistance;
    
    // Vérifier si c'est un swipe valide
    const isSwipe = 
      state.moveType === 'horizontal' &&
      touchDuration < swipeOptions.swipeDurationThreshold &&
      distanceX > effectiveMinDistance &&
      effectiveVelocity > swipeOptions.minSwipeVelocity;

    if (isSwipe && onCameraRotate) {
      // Convertir la vélocité en px/frame (60fps estimé)
      const frameVelocity = effectiveVelocity * 16.66;
      
      // Appliquer l'inertie
      applyInertia(frameVelocity, direction, touchDuration, distanceX);
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
      velocityY: 0,
      lastTime: 0,
      touchStartTime: 0
    };
  }, [isEnabled, onCameraRotate, applyInertia, swipeOptions]);
  
  /**
   * Attache les écouteurs d'événements tactiles
   * @param {HTMLElement} element - Élément auquel attacher les événements
   * @returns {Function} - Fonction de nettoyage
   */
  const attachTouchListeners = useCallback((element) => {
    if (!element) return () => {};
    
    // Attacher les gestionnaires d'événements
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Fonction de nettoyage
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      stopInertia();
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, stopInertia]);
  
  /**
   * Implémentation des contrôles de mouvement directionnels
   * Similaire à MobileControls.jsx
   */
  const createMobileControls = useCallback(() => {
    const MobileControls = ({ onMoveForward, onMoveBackward }) => {
      // État pour les boutons
      const forwardPressed = useRef(false);
      const backwardPressed = useRef(false);
      const intervalRef = useRef(null);
      
      // Référence pour le point de départ du toucher
      const touchStartRef = useRef({
        x: 0,
        y: 0,
        target: null,
        direction: null
      });
      
      // Seuil de mouvement pour considérer un glissement
      const moveThreshold = 15;
      
      // Styles pour les contrôles
      const styles = {
        container: {
          position: 'fixed',
          bottom: '20px',
          left: '0',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '30px',
          zIndex: 1000,
          pointerEvents: 'none'
        },
        button: {
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px',
          color: '#2A9D8F',
          border: 'none',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          pointerEvents: 'auto',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }
      };
      
      // Nettoyer l'état des contrôles
      const clearControlsState = () => {
        forwardPressed.current = false;
        backwardPressed.current = false;
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
      
      // Gestionnaire pour le début du toucher
      const handleTouchStart = (e, direction) => {
        // Vérifier si le toucher est au centre du bouton
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(touch.clientX - centerX, 2) + 
          Math.pow(touch.clientY - centerY, 2)
        );
        
        // Si clairement sur le bouton (pas près du bord)
        if (distanceFromCenter < rect.width * 0.35) {
          e.preventDefault();
          e.stopPropagation();
          
          // Enregistrer le point de départ
          touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            target: e.currentTarget,
            direction: direction
          };
          
          // Arrêter tout mouvement existant
          clearControlsState();
          
          // Définir l'état approprié
          if (direction === 'forward') {
            forwardPressed.current = true;
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1.1)';
            onMoveForward();
          } else {
            backwardPressed.current = true;
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1.1)';
            onMoveBackward();
          }
          
          // Établir un mouvement continu
          intervalRef.current = setInterval(() => {
            if (direction === 'forward' && forwardPressed.current) {
              onMoveForward();
            } else if (direction === 'backward' && backwardPressed.current) {
              onMoveBackward();
            }
          }, 50);
          
          // Attacher un gestionnaire global pour le touchmove
          document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
        }
      };
      
      // Gestionnaire global pour détecter si le doigt glisse
      const handleGlobalTouchMove = (e) => {
        if (!touchStartRef.current.target) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        
        // Si le mouvement dépasse le seuil
        if (deltaX > moveThreshold || deltaY > moveThreshold) {
          // Réinitialiser les styles
          if (touchStartRef.current.target) {
            touchStartRef.current.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            touchStartRef.current.target.style.transform = 'scale(1)';
          }
          
          // Arrêter le mouvement
          clearControlsState();
          
          // Nettoyer la référence
          touchStartRef.current = {
            x: 0,
            y: 0,
            target: null,
            direction: null
          };
          
          // Détacher le gestionnaire
          document.removeEventListener('touchmove', handleGlobalTouchMove);
        }
      };
      
      // Gestionnaire pour la fin du toucher
      const handleTouchEnd = (e) => {
        // Réinitialiser les styles
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        e.currentTarget.style.transform = 'scale(1)';
        
        // Nettoyer
        clearControlsState();
        
        // Nettoyer la référence
        touchStartRef.current = {
          x: 0,
          y: 0,
          target: null,
          direction: null
        };
        
        // Détacher le gestionnaire
        document.removeEventListener('touchmove', handleGlobalTouchMove);
      };
      
      // Nettoyer lors du démontage
      useEffect(() => {
        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          document.removeEventListener('touchmove', handleGlobalTouchMove);
        };
      }, []);
      
      return (
        <div style={styles.container}>
          <button
            style={styles.button}
            onTouchStart={(e) => handleTouchStart(e, 'forward')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            aria-label="Avancer"
          >
            ▲
          </button>
          <button
            style={styles.button}
            onTouchStart={(e) => handleTouchStart(e, 'backward')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            aria-label="Reculer"
          >
            ▼
          </button>
        </div>
      );
    };
    
    return MobileControls;
  }, []);
  
  /**
   * Active ou désactive les contrôles tactiles
   * @param {Boolean} enabled - État d'activation
   */
  const setEnabled = useCallback((enabled) => {
    setIsEnabled(enabled);
    if (!enabled) {
      stopInertia();
    }
  }, [stopInertia]);
  
  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      stopInertia();
    }
  }, [stopInertia]);
  
  // Retourner l'API du hook
  return {
    attachTouchListeners,
    stopInertia,
    setEnabled,
    isEnabled,
    MobileControls: createMobileControls(),
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}