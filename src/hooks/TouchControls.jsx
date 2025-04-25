import { useCallback, useRef } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

export default function TouchControls({ 
  onMouseMove = null,
  sensitivity = 1.5,
  threshold = 3 
}) {
  // State for tracking touch interactions
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    timestamp: 0,
    moving: false,
    moveType: null
  });

  // Parameters for swipe behavior
  const swipeOptions = {
    damping: 0.92,
    minSpeed: 0.15,
    swipeThreshold: 0.8,
    swipeMultiplier: 1.0,
    minSwipeDistance: 5,
    maxVelocity: 2.0,
    inertiaDuration: 500,
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      timestamp: Date.now(),
      moving: false,
      moveType: null
    };
    
    logger.log("Touch start detected", touch.clientX, touch.clientY);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStateRef.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const state = touchStateRef.current;
    
    // Calculate deltas
    const deltaX = touch.clientX - state.lastX;
    const deltaY = touch.clientY - state.lastY;
    
    // Determine movement type if not yet set
    if (!state.moveType) {
      const distX = Math.abs(touch.clientX - state.startX);
      const distY = Math.abs(touch.clientY - state.startY);
      
      if (distX > threshold || distY > threshold) {
        state.moveType = distX > distY ? 'horizontal' : 'vertical';
        state.moving = true;
      }
    }

    // Only handle horizontal movements
    if (state.moveType === 'horizontal') {
      const sensitivity = 0.002;
      
      const simulatedEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        normalizedX: -deltaX * sensitivity,
        normalizedY: 0,
        isTouchEvent: true,
        type: 'touchmove'
      };
      
      if (onMouseMove) {
        onMouseMove(simulatedEvent);
      }
    }
    
    // Update last position
    state.lastX = touch.clientX;
    state.lastY = touch.clientY;
  }, [onMouseMove, threshold]);

  const handleTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;
    if (!state || !state.moving) return;
    
    // Reset state
    touchStateRef.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      timestamp: 0,
      moving: false,
      moveType: null
    };
  }, []);

  const attachTouchListeners = useCallback((element) => {
    if (!element) return () => {};
    
    // Important: spécifier { passive: true } pour les écouteurs d'événements tactiles
    // Cela indique au navigateur que ces gestionnaires n'appelleront jamais preventDefault()
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const stopInertia = useCallback(() => {
    // Réinitialiser complètement l'état tactile
    touchStateRef.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      timestamp: 0,
      moving: false,
      moveType: null
    };
  }, []);

  return {
    attachTouchListeners,
    stopInertia
  };
}