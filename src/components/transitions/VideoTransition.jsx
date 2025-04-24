/**
 * Composant de transition vidéo amélioré
 * Gère la lecture d'une vidéo de transition entre la page d'accueil et la scène principale
 * Ajoute une image de prévisualisation avec instructions après la vidéo
 */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/**
 * Composant qui affiche une vidéo plein écran avec transition automatique vers une autre route
 * Ajoute une phase intermédiaire avec image de prévisualisation et instructions
 */
const VideoTransition = ({ 
  videoSrc = '/videos/ENTRANCE_TM.mp4',
  previewImageSrc = '/images/scene-preview.png', // Image de prévisualisation (screenshot de la scène)
  targetRoute = '/experience',
  autoSkip = true,
  onTransitionComplete = null,
  backgroundColor = '#000'
}) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  // Nouvel état pour suivre les phases de transition
  const [transitionPhase, setTransitionPhase] = useState('video'); // 'video', 'preview', 'complete'
  
  // Effet pour gérer le chargement et la lecture de la vidéo
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    const handleCanPlay = () => {
      setIsLoading(false);
      
      // Démarrer la lecture automatiquement si le navigateur le permet
      try {
        videoElement.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error('Autoplay prevented:', err);
            setError('Lecture automatique bloquée. Veuillez cliquer pour continuer.');
          });
      } catch (err) {
        console.error('Error playing video:', err);
        setError('Erreur lors de la lecture. Veuillez cliquer pour continuer.');
      }
    };
    
    const handleEnded = () => {
      // Passer à la phase de prévisualisation au lieu de naviguer immédiatement
      setTransitionPhase('preview');
      
      // Si nous devons passer automatiquement à l'expérience après un délai
      if (autoSkip) {
        // Un délai plus long pour que l'utilisateur puisse lire les instructions
        setTimeout(() => {
          completeTransition();
        }, 5000); // 5 secondes de délai pour lire les instructions
      }
    };
    
    const handleError = (err) => {
      console.error('Video error:', err);
      setError('Erreur lors du chargement de la vidéo. Vous allez être redirigé...');
      
      // Rediriger après un court délai
      setTimeout(() => {
        completeTransition();
      }, 2000);
    };
    
    const handleTimeUpdate = () => {
      if (videoElement.duration) {
        const currentProgress = (videoElement.currentTime / videoElement.duration) * 100;
        setProgress(currentProgress);
      }
    };
    
    // Ajouter les écouteurs d'événements
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [navigate, targetRoute, autoSkip, onTransitionComplete]);
  
  // Fonction pour compléter la transition et passer à l'expérience
  const completeTransition = () => {
    setTransitionPhase('complete');
    if (onTransitionComplete) {
      onTransitionComplete();
    } else {
      navigate(targetRoute);
    }
  };
  
  // Fonction pour commencer la lecture si elle a été bloquée
  const handleVideoClick = () => {
    const videoElement = videoRef.current;
    
    if (videoElement && !isPlaying) {
      videoElement.play()
        .then(() => {
          setIsPlaying(true);
          setError(null);
        })
        .catch((err) => {
          console.error('Play error after click:', err);
          // Si la lecture échoue même après le clic, rediriger
          completeTransition();
        });
    }
  };
  
  // Fonction pour passer la vidéo
  const handleSkip = () => {
    completeTransition();
  };

  // Styles pour l'interface
  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      overflow: 'hidden'
    },
    videoWrapper: {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative'
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: transitionPhase === 'video' ? 'block' : 'none'
    },
    // Styles pour l'image de prévisualisation
    previewContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: transitionPhase === 'preview' ? 'block' : 'none'
    },
    previewImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 0.8 // Un peu d'opacité pour que les instructions soient plus lisibles
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: isLoading ? 'flex' : 'none',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      zIndex: 10
    },
    loadingText: {
      fontSize: '1.2rem',
      marginBottom: '20px'
    },
    spinner: {
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: '4px solid #2A9D8F',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    },
    errorMessage: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      textAlign: 'center',
      maxWidth: '80%',
      display: error ? 'block' : 'none',
      zIndex: 20
    },
    progressBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: '4px',
      width: `${progress}%`,
      backgroundColor: '#2A9D8F',
      transition: 'width 0.1s linear',
      zIndex: 15
    },
    skipButton: {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(42, 157, 143, 0.7)',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      padding: '8px 15px',
      cursor: 'pointer',
      zIndex: 25,
      fontSize: '14px',
      opacity: transitionPhase !== 'complete' ? 1 : 0,
      transition: 'opacity 0.3s ease-in'
    },
    continueButton: {
      position: 'absolute',
      bottom: '50px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#2A9D8F',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      padding: '12px 25px',
      cursor: 'pointer',
      zIndex: 25,
      fontSize: '16px',
      fontWeight: 'bold',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
      display: transitionPhase === 'preview' ? 'block' : 'none'
    }
  };
  
  // Styles pour les animations
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      
      <div style={styles.videoWrapper} onClick={handleVideoClick}>
        {/* Vidéo de transition */}
        <video 
          ref={videoRef}
          style={styles.video}
          src={videoSrc}
          playsInline
          muted
          preload="auto"
          onContextMenu={(e) => e.preventDefault()} // Désactiver le menu contextuel
        />
        
        {/* Container pour la prévisualisation et les instructions */}
        <div style={styles.previewContainer}>
          {/* Image de prévisualisation */}
          <img 
            src={previewImageSrc} 
            alt="Aperçu de l'expérience" 
            style={styles.previewImage}
            onError={(e) => {
              console.error("Erreur lors du chargement de l'image de prévisualisation");
              e.target.style.display = 'none';
            }}
          />
          
                    
          {/* Bouton pour continuer immédiatement */}
          <button
            style={styles.continueButton}
            onClick={completeTransition}
          >
            Entrer dans l'expérience
          </button>
        </div>
        
        {/* Barre de progression */}
        {transitionPhase === 'video' && (
          <div style={styles.progressBar}></div>
        )}
        
        {/* Overlay de chargement */}
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingText}>Chargement de la transition...</div>
          <div style={styles.spinner}></div>
        </div>
        
        {/* Message d'erreur */}
        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}
        
        {/* Bouton pour passer la vidéo */}
        <button 
          style={{
            ...styles.skipButton,
            display: transitionPhase === 'video' ? 'block' : 'none'
          }} 
          onClick={handleSkip}
        >
          Passer
        </button>
      </div>
    </div>
  );
};

VideoTransition.propTypes = {
  videoSrc: PropTypes.string,
  previewImageSrc: PropTypes.string,
  targetRoute: PropTypes.string,
  autoSkip: PropTypes.bool,
  onTransitionComplete: PropTypes.func,
  backgroundColor: PropTypes.string
};

export default VideoTransition;