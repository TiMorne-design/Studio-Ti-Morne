/**
 * Overlay de bienvenue
 * Affiche un message d'accueil et les instructions de navigation
 */
import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import useDeviceDetection from '../../hooks/useDeviceDetection';

/**
 * Composant d'overlay de bienvenue avec détection de l'appareil
 * Reste affiché jusqu'à ce que l'utilisateur clique pour fermer
 */
const WelcomeOverlay = ({ onClose }) => {
  const [visible, setVisible] = useState(true);
  const { isMobile, isTablet } = useDeviceDetection();
  
  // Gestionnaire pour fermer l'overlay
  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) onClose();
  }, [onClose]);
  
  // Si non visible, ne rien afficher
  if (!visible) return null;

  // Style pour l'overlay
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.35)', // Fond moins opaque
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(2px)', // Flou réduit
      WebkitBackdropFilter: 'blur(2px)',
      animation: 'fadeIn 0.5s forwards'
    },
    container: {
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderRadius: '15px',
      padding: isMobile ? '20px' : '35px',
      maxWidth: isMobile ? '90%' : '680px',
      maxHeight: '85%',
      overflowY: 'auto',
      boxShadow: '0 5px 25px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    },
    logo: {
      width: isMobile ? '150px' : '200px',
      marginBottom: '15px',
      objectFit: 'contain'
    },
    title: {
      fontSize: isMobile ? '18px' : '24px',
      color: '#2A9D8F',
      margin: '0 0 12px 0',
      fontFamily: '"Reem Kufi", sans-serif',
      fontWeight: '500',
      textTransform: 'uppercase'
    },
    subtitle: {
      fontSize: isMobile ? '14px' : '16px',
      color: '#333',
      marginBottom: '20px',
      lineHeight: '1.5',
      fontWeight: '400',
      maxWidth: '600px'
    },
    sectionTitle: {
      fontSize: isMobile ? '16px' : '18px',
      color: '#C49A6C',
      margin: '12px 0 8px 0',
      fontWeight: '500',
      alignSelf: 'flex-start',
      fontFamily: '"Reem Kufi", sans-serif',
      textTransform: 'uppercase'
    },
    instructionsList: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: '100%',
      padding: '0 10px',
      marginBottom: '15px'
    },
    instruction: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '12px',
      textAlign: 'left',
      width: '100%'
    },
    instructionIcon: {
      fontSize: '20px',
      marginRight: '15px',
      minWidth: '25px',
      display: 'flex',
      justifyContent: 'center'
    },
    instructionText: {
      fontSize: isMobile ? '13px' : '15px',
      color: '#333',
      lineHeight: '1.4',
      flex: 1
    },
    button: {
      backgroundColor: '#2A9D8F',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      padding: '10px 25px',
      fontSize: isMobile ? '14px' : '15px',
      fontWeight: '500',
      cursor: 'pointer',
      marginTop: '20px',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
      transition: 'background-color 0.2s ease',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }
  };

  // Style pour les animations
  const keyframes = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  // Contenu spécifique selon le type d'appareil
  const mobileInstructions = [
    {
      icon: '👆',
      text: 'Touchez l\'écran et faites glisser pour regarder autour de vous'
    },
    {
      icon: '⬆️',
      text: 'Utilisez les flèches en bas de l\'écran pour vous déplacer'
    },
    {
      icon: '🔍',
      text: 'Touchez les éléments interactifs pour découvrir nos services'
    }
  ];

  const desktopInstructions = [
    {
      icon: '🖱️',
      text: 'Utilisez la molette pour avancer ou reculer'
    },
    {
      icon: '👁️',
      text: 'Déplacez votre souris pour observer l\'environnement'
    },
    {
      icon: '👆',
      text: 'Cliquez sur les éléments pour découvrir nos expertises'
    }
  ];

  // Sélectionner les instructions selon l'appareil
  const instructions = (isMobile || isTablet) ? mobileInstructions : desktopInstructions;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <style>{keyframes}</style>
      <div 
        style={styles.container} 
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src="/src/assets/logo.jpeg" 
          alt="Studio Ti Morne" 
          style={styles.logo} 
          onError={(e) => {
            // Fallback si l'image ne se charge pas
            console.error("Impossible de charger le logo");
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />
        <h1 style={styles.title}>BIENVENUE AU STUDIO TI MORNE</h1>
        <p style={styles.subtitle}>
        Explorez notre studio et découvrez un savoir-faire unique, où l’innovation digitale se met au service d’expériences immersives et interactives.</p>
        
        <h2 style={styles.sectionTitle}>COMMENT NAVIGUER DANS NOTRE UNIVERS</h2>
        <div style={styles.instructionsList}>
          {instructions.map((instruction, index) => (
            <div key={index} style={styles.instruction}>
              <span style={styles.instructionIcon}>{instruction.icon}</span>
              <span style={styles.instructionText}>{instruction.text}</span>
            </div>
          ))}
        </div>
        
        <h2 style={styles.sectionTitle}>DÉCOUVREZ NOS EXPERTISES</h2>
        <p style={styles.subtitle}>
          Data visualization, modélisation 3D, interfaces web innovantes — cliquez sur les différents boutons pour découvrir comment nous donnons vie à l'information par l'interaction.
        </p>
        
        <button 
          style={styles.button}
          onClick={handleClose}
          onTouchStart={handleClose}
        >
          COMMENCER L'EXPÉRIENCE
        </button>
      </div>
    </div>
  );
};

WelcomeOverlay.propTypes = {
  onClose: PropTypes.func
};

export default memo(WelcomeOverlay);