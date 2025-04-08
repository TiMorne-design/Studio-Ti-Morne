/**
 * Indicateur d'orientation pour mobile
 * Suggère à l'utilisateur de tourner son appareil en mode paysage
 */
import React, { useState, useEffect, memo } from 'react';

/**
 * Composant affichant une suggestion de rotation de l'écran
 * pour une meilleure expérience sur mobile
 */
const OrientationPrompt = () => {
  // État pour contrôler l'affichage
  const [show, setShow] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  
  // Styles pour le prompt d'orientation
  const styles = {
    container: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '300px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      zIndex: 2000,
      display: show && !dismissed ? 'block' : 'none',
      textAlign: 'center'
    },
    title: {
      fontSize: '18px',
      color: '#2A9D8F',
      marginBottom: '15px',
      fontWeight: '500'
    },
    message: {
      fontSize: '14px',
      color: '#333',
      lineHeight: '1.4',
      marginBottom: '20px'
    },
    icon: {
      fontSize: '24px',
      marginBottom: '15px',
      display: 'block',
      animation: 'rotate90 1.5s infinite alternate',
      transformOrigin: 'center'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '10px'
    },
    button: {
      flex: 1,
      padding: '10px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px'
    },
    continueButton: {
      backgroundColor: '#f0f0f0',
      color: '#555'
    },
    rotateButton: {
      backgroundColor: '#2A9D8F',
      color: 'white'
    }
  };
  
  // Effet pour masquer le prompt après un délai
  useEffect(() => {
    if (!dismissed) {
      // Masquer après 10 secondes si non fermé manuellement
      const timer = setTimeout(() => {
        setShow(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [dismissed]);
  
  // Gère le clic sur "Continuer quand même"
  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };
  
  // Force la rotation en paysage si possible
  const requestLandscape = () => {
    try {
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {
          // Fallback si le verrouillage d'orientation échoue
          alert("Veuillez tourner manuellement votre appareil en mode paysage.");
        });
      } else {
        // Si l'API n'est pas supportée
        alert("Veuillez tourner manuellement votre appareil en mode paysage.");
      }
      setDismissed(true);
      setShow(false);
    } catch (error) {
      console.error("Erreur lors du verrouillage de l'orientation:", error);
      alert("Veuillez tourner manuellement votre appareil en mode paysage.");
    }
  };
  
  // Style personnalisé pour l'animation de rotation
  const rotationStyle = `
    @keyframes rotate90 {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(90deg); }
    }
  `;
  
  return (
    <>
      <style>{rotationStyle}</style>
      <div style={styles.container}>
        <span role="img" aria-label="Rotation" style={styles.icon}>
          📱
        </span>
        <h3 style={styles.title}>Meilleure expérience en paysage</h3>
        <p style={styles.message}>
          Pour profiter pleinement de l'expérience 3D, nous vous recommandons 
          d'utiliser votre appareil en mode paysage (horizontal).
        </p>
        <div style={styles.buttonContainer}>
          <button 
            style={{...styles.button, ...styles.continueButton}}
            onClick={handleDismiss}
          >
            Continuer
          </button>
          <button 
            style={{...styles.button, ...styles.rotateButton}}
            onClick={requestLandscape}
          >
            Tourner l'écran
          </button>
        </div>
      </div>
    </>
  );
};

export default memo(OrientationPrompt);