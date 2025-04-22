/**
 * Contrôles de navigation pour appareils mobiles
 * Version améliorée qui utilise le gestionnaire tactile centralisé
 */
import React, { memo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import useTouchManager from '../../hooks/useTouchManager';

/**
 * Composant de contrôles de navigation pour mobile avec gestion tactile améliorée
 */
const MobileControls = ({ onMoveForward, onMoveBackward }) => {
  // Référence pour suivre l'état des boutons
  const containerRef = useRef(null);
  
  // Gestionnaire d'événements de bouton
  const handleButtonPress = useCallback((direction) => {
    if (direction === 'forward') {
      onMoveForward();
    } else if (direction === 'backward') {
      onMoveBackward();
    }
  }, [onMoveForward, onMoveBackward]);
  
  // Utiliser le gestionnaire tactile centralisé
  const { attachTouchHandlers } = useTouchManager({
    onButtonPress: handleButtonPress
  });
  
  // Attacher les gestionnaires tactiles au montage
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = attachTouchHandlers(containerRef.current);
      return cleanup;
    }
  }, [attachTouchHandlers]);
  
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
      pointerEvents: 'none' // Important: permet aux événements de passer à travers le conteneur
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
      pointerEvents: 'auto', // Les boutons interceptent les événements
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation',
      transition: 'transform 0.2s, background-color 0.2s'
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <button
        className="mobile-nav-button"
        data-direction="forward"
        style={styles.button}
        aria-label="Avancer"
      >
        ▲
      </button>
      <button
        className="mobile-nav-button"
        data-direction="backward"
        style={styles.button}
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