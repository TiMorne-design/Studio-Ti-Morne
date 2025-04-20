/**
 * Hook personnalisé pour gérer les contrôles tactiles
 * Version simplifiée avec comportement unifié
 */
import { useRef, useCallback, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook pour gérer les interactions tactiles
 * @param {Object} options - Options de configuration
 * @param {Function} options.onMouseMove - Callback appelé lors du mouvement
 * @param {Number} options.sensitivity - Sensibilité du mouvement tactile
 * @returns {Object} - Méthodes pour attacher/détacher les écouteurs d'événements
 */
export default function useTouchControls({ 
  onMouseMove, 
  sensitivity = 1.0 
}) {
  // Références pour le suivi du toucher
  const touchRef = useRef({
    isActive: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0
  });
  
  /**
   * Gestionnaire pour le début du toucher
   */
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    touchRef.current = {
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY
    };
  }, []);
  
  /**
   * Gestionnaire pour le mouvement du toucher
   */
  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current.isActive || e.touches.length !== 1) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchRef.current.lastX;
    const deltaY = touch.clientY - touchRef.current.lastY;
    
    // Mise à jour des dernières positions
    touchRef.current.lastX = touch.clientX;
    touchRef.current.lastY = touch.clientY;
    
    // Calcul des positions normalisées pour la rotation
    const normalizedX = (deltaX / window.innerWidth) * sensitivity;
    const normalizedY = (deltaY / window.innerHeight) * sensitivity;
    
    // Appeler le callback avec les données de mouvement
    if (onMouseMove) {
      onMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
        normalizedX: -normalizedX, // Inverser pour le comportement naturel
        normalizedY: -normalizedY, // Inverser pour le comportement naturel
        isTouchEvent: true
      });
    }
  }, [onMouseMove, sensitivity]);
  
  /**
   * Gestionnaire pour la fin du toucher
   */
  const handleTouchEnd = useCallback(() => {
    touchRef.current.isActive = false;
  }, []);
  
  /**
   * Attache les écouteurs d'événements tactiles à un élément
   * @param {HTMLElement} element - Élément auquel attacher les écouteurs
   * @returns {Function} - Fonction pour détacher les écouteurs
   */
  const attachTouchListeners = useCallback((element) => {
    if (!element) return () => {};
    
    logger.log("Attachement des écouteurs d'événements tactiles");
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    return () => {
      logger.log("Détachement des écouteurs d'événements tactiles");
      
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  return {
    attachTouchListeners
  };
}