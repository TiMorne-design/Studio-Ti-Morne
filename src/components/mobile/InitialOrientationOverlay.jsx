import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Overlay affiché au démarrage pour indiquer la meilleure orientation
 */
const InitialOrientationOverlay = ({ onClose, autoHideTime = 8000 }) => {
  const [visible, setVisible] = useState(true);

  // Effet pour cacher automatiquement l'overlay après un délai
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoHideTime);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose, autoHideTime]);

  // Style pour l'overlay
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: visible ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      animationName: 'fadeIn',
      animationDuration: '0.5s',
      animationFillMode: 'forwards'
    },
    container: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '15px',
      padding: '30px',
      maxWidth: '85%',
      maxHeight: '80%',
      textAlign: 'center',
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    },
    title: {
      fontSize: '22px',
      fontWeight: '500',
      color: '#2A9D8F',
      margin: 0,
      fontFamily: '"Reem Kufi", sans-serif'
    },
    icon: {
      fontSize: '40px',
      marginBottom: '10px',
      animation: 'rotate90 1.5s infinite alternate',
      display: 'inline-block'
    },
    message: {
      fontSize: '16px',
      lineHeight: '1.5',
      color: '#333',
      margin: 0
    },
    button: {
      backgroundColor: '#2A9D8F',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      padding: '12px 30px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      marginTop: '10px',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
      transition: 'background-color 0.2s ease'
    }
  };

  // Style pour l'animation de rotation
  const keyframes = `
    @keyframes rotate90 {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(90deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  // Gestionnaire pour fermer l'overlay
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  // Si non visible, ne rien afficher
  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <style>{keyframes}</style>
      <div style={styles.container}>
        <h2 style={styles.title}>Pour une meilleure expérience</h2>
        <div style={styles.icon}>📱</div>
        <p style={styles.message}>
          Pour profiter pleinement de l'expérience 3D,<br/>
          nous vous recommandons d'utiliser votre appareil<br/>
          en mode paysage (horizontal).
        </p>
        <p style={styles.message}>
          Vous pourrez naviguer en touchant l'écran<br/>
          pour regarder autour de vous et utiliser les<br/>
          flèches pour vous déplacer.
        </p>
        <button 
          style={styles.button}
          onClick={handleClose}
          onTouchStart={handleClose}
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
};

InitialOrientationOverlay.propTypes = {
  onClose: PropTypes.func,
  autoHideTime: PropTypes.number
};

export default InitialOrientationOverlay;