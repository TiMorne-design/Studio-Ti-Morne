/**
 * Composant unifié pour les messages d'orientation sur mobile
 * Design amélioré et plus cohérent avec l'identité visuelle de l'application
 */
import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import useDeviceDetection from '../../hooks/useDeviceDetection';

/**
 * Overlay d'orientation unifié avec design amélioré
 */
const UnifiedOrientationOverlay = ({ onClose, autoHideTime = 10000 }) => {
  const [visible, setVisible] = useState(true);
  const { isMobile, isTablet } = useDeviceDetection();
  
  // Déterminer si on utilise un style compact (pour les petits écrans)
  const isCompact = isMobile && window.innerHeight < 600;

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

  // Styles pour l'overlay avec animation et design amélioré
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(17, 25, 40, 0.75)', // Fond légèrement bleuté
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: visible ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      transition: 'opacity 0.3s ease'
    },
    container: {
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderRadius: '18px',
      padding: isCompact ? '20px' : '30px',
      maxWidth: '85%',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isCompact ? '12px' : '20px',
      border: '1px solid rgba(42, 157, 143, 0.3)',
      transform: 'translateY(0)',
      animation: 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    title: {
      fontSize: isCompact ? '18px' : '22px',
      fontWeight: '500',
      color: '#2A9D8F',
      margin: 0,
      fontFamily: '"Reem Kufi", sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    iconContainer: {
      width: isCompact ? '50px' : '70px',
      height: isCompact ? '50px' : '70px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(42, 157, 143, 0.1)',
      borderRadius: '50%',
      marginBottom: isCompact ? '5px' : '10px'
    },
    icon: {
      fontSize: isCompact ? '28px' : '36px',
      animation: 'rotate90 1.5s infinite alternate',
      display: 'block',
      transform: 'rotate(0deg)'
    },
    message: {
      fontSize: isCompact ? '14px' : '16px',
      lineHeight: '1.5',
      color: '#333',
      margin: '0 0 5px 0'
    },
    highlight: {
      color: '#2A9D8F',
      fontWeight: '500'
    },
    buttonContainer: {
      display: 'flex',
      gap: '15px',
      marginTop: isCompact ? '5px' : '15px',
      width: '100%',
      justifyContent: 'center'
    },
    button: {
      backgroundColor: '#2A9D8F',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      padding: isCompact ? '10px 15px' : '12px 20px',
      fontSize: isCompact ? '14px' : '16px',
      fontWeight: '500',
      cursor: 'pointer',
      boxShadow: '0 4px 10px rgba(42, 157, 143, 0.2)',
      transition: 'all 0.2s ease',
      minWidth: isCompact ? '100px' : '120px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    secondaryButton: {
      backgroundColor: 'rgba(240, 240, 240, 0.8)',
      color: '#555'
    },
    instructionContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: '100%',
      padding: '0 10px',
      marginTop: isCompact ? '0' : '5px'
    },
    instruction: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
      textAlign: 'left'
    },
    instructionIcon: {
      fontSize: '16px',
      marginRight: '10px',
      opacity: 0.8
    },
    instructionText: {
      fontSize: isCompact ? '13px' : '14px',
      color: '#444',
      lineHeight: '1.4'
    }
  };

  // Style pour les animations
  const keyframes = `
    @keyframes rotate90 {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(90deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  // Gestionnaire pour continuer sans changer l'orientation
  const handleContinue = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  // Fonction pour demander la rotation en paysage
  const requestLandscape = () => {
    try {
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {
          // Fallback si le verrouillage d'orientation échoue
          // Transition plus douce au lieu d'une alerte
          alert("Veuillez tourner manuellement votre appareil en mode paysage.");
        });
      } else {
        // Si l'API n'est pas supportée
        alert("Veuillez tourner manuellement votre appareil en mode paysage.");
      }
      setVisible(false);
      if (onClose) onClose();
    } catch (error) {
      console.error("Erreur lors du verrouillage de l'orientation:", error);
      setVisible(false);
      if (onClose) onClose();
    }
  };

  // Si non visible, ne rien afficher
  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <style>{keyframes}</style>
      <div style={styles.container}>
        <h2 style={styles.title}>Pour une meilleure expérience</h2>
        
        <div style={styles.iconContainer}>
          <span style={styles.icon}>📱</span>
        </div>
        
        <p style={styles.message}>
          Pour profiter pleinement de <span style={styles.highlight}>l'expérience 3D</span>,<br/>
          nous vous recommandons d'utiliser votre appareil<br/>
          en mode <span style={styles.highlight}>paysage (horizontal)</span>.
        </p>
        
        {!isCompact && (
          <div style={styles.instructionContainer}>
            <div style={styles.instruction}>
              <span style={styles.instructionIcon}>👆</span>
              <span style={styles.instructionText}>Touchez l'écran pour regarder autour de vous</span>
            </div>
            <div style={styles.instruction}>
              <span style={styles.instructionIcon}>⬆️</span>
              <span style={styles.instructionText}>Utilisez les flèches pour vous déplacer</span>
            </div>
          </div>
        )}
        
        <div style={styles.buttonContainer}>
          <button 
            style={{
              ...styles.button, 
              ...styles.secondaryButton
            }}
            onClick={handleContinue}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(230, 230, 230, 0.9)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(240, 240, 240, 0.8)';
            }}
          >
            Continuer
          </button>
          <button 
            style={styles.button}
            onClick={requestLandscape}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#45b4a6';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(42, 157, 143, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2A9D8F';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(42, 157, 143, 0.2)';
            }}
          >
            Tourner l'écran
          </button>
        </div>
      </div>
    </div>
  );
};

UnifiedOrientationOverlay.propTypes = {
  onClose: PropTypes.func,
  autoHideTime: PropTypes.number
};

export default memo(UnifiedOrientationOverlay);