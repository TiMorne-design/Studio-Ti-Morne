/**
 * Contrôles de navigation pour appareils mobiles
 * Fournit des boutons pour se déplacer dans la scène 3D
 */
import React, { memo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant de contrôles de navigation pour mobile
 */
const MobileControls = ({ onMoveForward, onMoveBackward }) => {
  // Utiliser useRef pour tracker l'état des boutons
  const forwardPressed = useRef(false);
  const backwardPressed = useRef(false);
  const intervalRef = useRef(null);
  
  // Styles pour les contrôles
  const styles = {
    container: {
      position: 'fixed',
      bottom: '100px',
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
  
  // Fonction pour gérer le mouvement continu
  const handleContinuousMovement = useCallback(() => {
    if (forwardPressed.current) {
      onMoveForward();
    } else if (backwardPressed.current) {
      onMoveBackward();
    }
  }, [onMoveForward, onMoveBackward]);
  
  // Gestionnaires d'événements avec support pour mouvement continu
  const handleForwardStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Marquer le bouton comme pressé
    forwardPressed.current = true;
    backwardPressed.current = false;
    
    // Style visuel
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    e.currentTarget.style.transform = 'scale(1.1)';
    
    // Appliquer un mouvement immédiat
    onMoveForward();
    
    // Établir un mouvement continu
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      // Appliquer un mouvement plus important
      // Appeler plusieurs fois pour un déplacement plus important
      onMoveForward();
      onMoveForward(); // Appeler 2 fois pour doubler la vitesse
    }, 50); // Réduire l'intervalle à 50ms au lieu de 100ms
  }, [onMoveForward]);
  
  const handleBackwardStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Marquer le bouton comme pressé
    backwardPressed.current = true;
    forwardPressed.current = false;
    
    // Style visuel
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    e.currentTarget.style.transform = 'scale(1.1)';
    
    // Appliquer un mouvement immédiat
    onMoveBackward();
    
    // Établir un mouvement continu
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      // Appliquer un mouvement plus important
      // Appeler plusieurs fois pour un déplacement plus important
      onMoveBackward();
      onMoveBackward(); // Appeler 2 fois pour doubler la vitesse
    }, 50); // Réduire l'intervalle à 50ms au lieu de 100ms
  }, [onMoveBackward]);
  
  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    
    // Réinitialiser les états de pression
    forwardPressed.current = false;
    backwardPressed.current = false;
    
    // Réinitialiser le style
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    e.currentTarget.style.transform = 'scale(1)';
    
    // Arrêter le mouvement continu
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Nettoyer l'intervalle lors du démontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <button
        style={styles.button}
        onTouchStart={handleForwardStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label="Avancer"
      >
        ▲
      </button>
      <button
        style={styles.button}
        onTouchStart={handleBackwardStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label="Reculer"
      >
        ▼
      </button>
    </div>
  );
};

MobileControls.propTypes = {
  onMoveForward: PropTypes.func.isRequired,
  onMoveBackward: PropTypes.func.isRequired
};

export default memo(MobileControls);