/**
 * Hook personnalisé pour gérer les animations
 * Fournit des fonctions pour animer des propriétés avec gestion du cycle de vie React
 */
import { useRef, useEffect, useCallback } from 'react';
import animationUtils from '../utils/animation';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook pour gérer les animations avec nettoyage automatique
 * @returns {Object} - Fonctions d'animation
 */
export default function useAnimation() {
  // Référence pour stocker les IDs d'animation actifs
  const activeAnimationsRef = useRef(new Set());
  
  /**
   * Annule toutes les animations actives
   */
  const cancelAllAnimations = useCallback(() => {
    activeAnimationsRef.current.forEach(id => {
      animationUtils.cancelAnimation(id);
    });
    activeAnimationsRef.current.clear();
  }, []);
  
  /**
   * Animation avec suivi automatique pour le nettoyage
   * @param {Object} options - Options d'animation (voir animationUtils.animate)
   * @returns {Number} - ID d'animation
   */
  const animate = useCallback((options) => {
    const originalOnComplete = options.onComplete;
    
    // Wrapper onComplete pour nettoyer l'animation
    const wrappedOptions = {
      ...options,
      onComplete: () => {
        if (originalOnComplete) originalOnComplete();
        
        // Supprimer l'animation de la liste des animations actives
        if (animationId) {
          activeAnimationsRef.current.delete(animationId);
        }
      }
    };
    
    // Lancer l'animation
    const animationId = animationUtils.animate(wrappedOptions);
    
    // Ajouter l'animation à la liste des animations actives
    if (animationId) {
      activeAnimationsRef.current.add(animationId);
    }
    
    return animationId;
  }, []);
  
  /**
   * Animation de plusieurs propriétés avec suivi
   * @param {Array} animations - Tableau d'options d'animation
   * @param {Function} onAllComplete - Callback appelé quand toutes les animations sont terminées
   * @returns {Function} - Fonction pour annuler toutes les animations
   */
  const animateMultiple = useCallback((animations, onAllComplete) => {
    if (!animations || animations.length === 0) {
      if (onAllComplete) onAllComplete();
      return () => {};
    }
    
    // IDs d'animation pour le suivi
    const animationIds = [];
    
    // Wrapper chaque animation pour le suivi
    const wrappedAnimations = animations.map(options => {
      const originalOnComplete = options.onComplete;
      
      return {
        ...options,
        onComplete: () => {
          if (originalOnComplete) originalOnComplete();
          
          // Supprimer l'animation de la liste des animations actives
          const animId = animationIds.shift();
          if (animId) {
            activeAnimationsRef.current.delete(animId);
          }
        }
      };
    });
    
    // Fonction de nettoyage retournée par animateMultiple
    const cancelFunc = animationUtils.animateMultiple(wrappedAnimations, onAllComplete);
    
    // Ajouter toutes les animations à la liste des animations actives
    animationIds.forEach(id => {
      if (id) {
        activeAnimationsRef.current.add(id);
      }
    });
    
    // Retourner une fonction améliorée qui nettoie également notre liste
    return () => {
      cancelFunc();
      animationIds.forEach(id => {
        if (id) {
          activeAnimationsRef.current.delete(id);
        }
      });
    };
  }, []);
  
  /**
   * Animation d'une transition fluide entre deux positions de caméra
   * @param {Object} camera - Référence à l'objet caméra
   * @param {Object} options - Options de l'animation
   * @param {Object} options.position - Position cible {x, y, z}
   * @param {Object} options.rotation - Rotation cible {x, y, z}
   * @param {Number} options.duration - Durée de l'animation en ms
   * @param {String} options.easing - Fonction d'easing à utiliser
   * @param {Function} options.onComplete - Callback à la fin de l'animation
   * @returns {Function} - Fonction pour annuler l'animation
   */
  const animateCamera = useCallback((camera, { position, rotation, duration = 2000, easing = 'easeOutCubic', onComplete }) => {
    if (!camera) {
      logger.warn('Impossible d\'animer la caméra: référence camera manquante');
      return null;
    }
    
    // Position et rotation actuelles
    const startPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    
    const startRotation = {
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: camera.rotation.z
    };
    
    // Animations à exécuter
    const animations = [];
    
    // Animation de position si fournie
    if (position) {
      animations.push({
        object: camera,
        property: 'position',
        from: startPosition,
        to: position,
        duration,
        easingFn: easing
      });
    }
    
    // Animation de rotation si fournie
    if (rotation) {
      // Conversion des degrés en radians
      const targetRotation = {
        x: (rotation.x || 0) * Math.PI / 180,
        y: (rotation.y || 0) * Math.PI / 180,
        z: (rotation.z || 0) * Math.PI / 180
      };
      
      animations.push({
        object: camera,
        property: 'rotation',
        from: startRotation,
        to: targetRotation,
        duration,
        easingFn: easing
      });
    }
    
    // Lancer les animations
    return animateMultiple(animations, onComplete);
  }, [animateMultiple]);
  
  // Nettoyer toutes les animations lors du démontage
  useEffect(() => {
    return () => {
      cancelAllAnimations();
    };
  }, [cancelAllAnimations]);
  
  return {
    animate,
    animateMultiple,
    animateCamera,
    cancelAllAnimations
  };
}