/**
 * Contrôles de navigation pour appareils mobiles
 * Version refactorisée qui utilise le système d'interaction unifié
 */
import React, { memo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant de contrôles de navigation pour mobile simplifié
 */
const MobileControls = ({ onMoveForward, onMoveBackward }) => {
  // Référence pour les boutons
  const containerRef = useRef(null);
  
  // Gestionnaires d'événements optimisés pour les mobiles
  const handleButtonInteraction = useCallback((e) => {
    // Bloquer la propagation pour éviter les conflits avec d'autres gestionnaires
    e.stopPropagation();
    
    // Vérifier que c'est bien un bouton
    const button = e.target.closest('.mobile-nav-button');
    if (!button) return;
    
    // Déterminer le type d'événement
    const isStart = e.type === 'touchstart' || e.type === 'mousedown';
    const isEnd = e.type === 'touchend' || e.type === 'mouseup' || e.type === 'mouseleave';
    
    // Obtenir la direction du bouton
    const direction = button.dataset.direction;
    
    if (isStart) {
      // Ajouter l'effet visuel
      button.classList.add('pressed');
      
      // Déclencher le mouvement
      if (direction === 'forward') {
        onMoveForward();
      } else if (direction === 'backward') {
        onMoveBackward();
      }
      
      // Prévenir le comportement par défaut des événements tactiles
      if (e.type === 'touchstart') {
        e.preventDefault();
      }
    } else if (isEnd) {
      // Retirer l'effet visuel
      button.classList.remove('pressed');
    }
  }, [onMoveForward, onMoveBackward]);
  
  // Attacher les gestionnaires au montage
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Gestionnaires pour souris
    container.addEventListener('mousedown', handleButtonInteraction);
    container.addEventListener('mouseup', handleButtonInteraction);
    container.addEventListener('mouseleave', handleButtonInteraction);
    
    // Gestionnaires pour tactile
    container.addEventListener('touchstart', handleButtonInteraction, { passive: false });
    container.addEventListener('touchend', handleButtonInteraction, { passive: false });
    
    // Nettoyage
    return () => {
      container.removeEventListener('mousedown', handleButtonInteraction);
      container.removeEventListener('mouseup', handleButtonInteraction);
      container.removeEventListener('mouseleave', handleButtonInteraction);
      
      container.removeEventListener('touchstart', handleButtonInteraction);
      container.removeEventListener('touchend', handleButtonInteraction);
    };
  }, [handleButtonInteraction]);
  
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