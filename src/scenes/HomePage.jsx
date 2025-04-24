/**
 * Page d'accueil avec animation et transition
 * Affiche une image de fond, du texte qui apparaît progressivement et un bouton d'entrée
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useDeviceDetection from '../hooks/useDeviceDetection';

/**
 * Composant de page d'accueil avec animation de texte et transition
 * @param {Object} props - Propriétés du composant
 * @param {Function} props.onEnterClick - Fonction appelée lors du clic sur le bouton "Entrer"
 * @param {String} props.backgroundImage - URL de l'image d'arrière-plan
 */
const HomePage = ({ 
  onEnterClick,
  backgroundImage = './images/home-background.png', // Image par défaut
  videoSrc = './videos/ENTRANCE_TM.mp4' // Vidéo de transition par défaut
}) => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [textVisible, setTextVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const videoRef = useRef(null);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  // Référence pour la vidéo
  const handleEnterClick = () => {
    if (onEnterClick) {
      onEnterClick();
    } else {
      // Comportement par défaut si aucun callback n'est fourni
      navigate('/experience');
    }
  };

  // Effet pour animer l'apparition du texte et du bouton
  useEffect(() => {
    // Afficher le texte après 2 secondes
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 2000);
    
    // Afficher le bouton après 3.5 secondes
    const buttonTimer = setTimeout(() => {
      setButtonVisible(true);
    }, 3500);
    
    // Précharger les ressources importantes
    const preloadResources = async () => {
      try {
        // Liste des ressources à précharger
        const resourcesToPreload = [
          // Ajouter ici les chemins des images, vidéos ou autres ressources
          videoSrc,
          '/images/loading-icon.png', // Exemple
        ];
        
        let loaded = 0;
        
        for (const resource of resourcesToPreload) {
          await new Promise((resolve) => {
            if (resource.endsWith('.mp4') || resource.endsWith('.webm')) {
              // Préchargement de vidéo
              const video = document.createElement('video');
              video.preload = 'auto';
              video.src = resource;
              video.onloadeddata = () => {
                loaded++;
                setPreloadProgress(Math.floor((loaded / resourcesToPreload.length) * 100));
                resolve();
              };
              video.onerror = () => {
                loaded++;
                setPreloadProgress(Math.floor((loaded / resourcesToPreload.length) * 100));
                console.error(`Erreur lors du préchargement de ${resource}`);
                resolve();
              };
            } else {
              // Préchargement d'image
              const img = new Image();
              img.src = resource;
              img.onload = () => {
                loaded++;
                setPreloadProgress(Math.floor((loaded / resourcesToPreload.length) * 100));
                resolve();
              };
              img.onerror = () => {
                loaded++;
                setPreloadProgress(Math.floor((loaded / resourcesToPreload.length) * 100));
                console.error(`Erreur lors du préchargement de ${resource}`);
                resolve();
              };
            }
          });
        }
        
        // Préchargement terminé
        setIsPreloading(false);
      } catch (error) {
        console.error('Erreur lors du préchargement:', error);
        setIsPreloading(false);
      }
    };
    
    // Lancer le préchargement
    preloadResources();
    
    // Nettoyage des timers
    return () => {
      clearTimeout(textTimer);
      clearTimeout(buttonTimer);
    };
  }, [videoSrc]);

  // Styles pour l'interface
  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
      overflow: 'hidden',
      zIndex: 1000
    },
    background: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 0.8,
      animation: 'fadeIn 1.5s ease-out forwards'
    },
    contentBox: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? '20px' : '40px',
      zIndex: 100,
      textAlign: 'center',
      maxWidth: '800px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '15px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    title: {
      color: 'white',
      fontSize: isMobile ? '2rem' : '3.5rem',
      fontWeight: '400',
      marginBottom: '15px',
      opacity: textVisible ? 1 : 0,
      transform: textVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 1s ease-out, transform 1s ease-out',
      fontFamily: '"Reem Kufi", sans-serif',
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: isMobile ? '1rem' : '1.4rem',
      fontWeight: '300',
      maxWidth: '80%',
      opacity: textVisible ? 1 : 0,
      transform: textVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 1s ease-out 0.2s, transform 1s ease-out 0.2s',
      marginBottom: '30px',
      lineHeight: '1.5'
    },
    button: {
      backgroundColor: '#2A9D8F',
      color: 'white',
      border: 'none',
      borderRadius: '30px',
      padding: isMobile ? '12px 30px' : '15px 40px',
      fontSize: isMobile ? '16px' : '18px',
      cursor: 'pointer',
      opacity: buttonVisible ? 1 : 0,
      transform: buttonVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.8s ease-out, transform 0.8s ease-out, background-color 0.3s ease',
      fontFamily: '"Reem Kufi", sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      boxShadow: '0 4px 15px rgba(42, 157, 143, 0.4)'
    },
    preloader: {
      position: 'absolute',
      bottom: '20px',
      left: '0',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px',
      opacity: isPreloading ? 1 : 0,
      transition: 'opacity 0.5s ease-out',
      zIndex: 101
    },
    progressBar: {
      width: '200px',
      height: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressFill: {
      height: '100%',
      width: `${preloadProgress}%`,
      backgroundColor: '#2A9D8F',
      transition: 'width 0.3s ease-out'
    },
    progressText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '12px',
      marginTop: '5px'
    }
  };
  
  // Styles pour les animations
  const keyframes = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 0.8; }
    }
  `;

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      
      {/* Image d'arrière-plan */}
      <img 
        src={backgroundImage} 
        alt="Fond" 
        style={styles.background}
        onError={(e) => {
          console.error("Impossible de charger l'image d'arrière-plan");
          e.target.style.display = 'none';
        }}
      />
      
      {/* Contenu principal */}
      <div style={styles.contentBox}>
        <h1 style={styles.title}>STUDIO TI MORNE</h1>
        <p style={styles.subtitle}>
          Bienvenue dans notre univers créatif où l'innovation digitale rencontre l'expérience immersive. 
          Un lieu unique où technologie et imagination fusionnent pour créer des expériences mémorables.
        </p>
        <button 
          style={styles.button}
          onClick={handleEnterClick}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45b4a6'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2A9D8F'}
          disabled={isPreloading}
        >
          Entrer
        </button>
      </div>
     </div>
  );
};

HomePage.propTypes = {
  onEnterClick: PropTypes.func,
  backgroundImage: PropTypes.string,
  videoSrc: PropTypes.string
};

export default HomePage;