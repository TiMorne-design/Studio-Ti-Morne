/**
 * Page d'accueil avec transitions fluides et préchargement optimisé
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useDeviceDetection from '../hooks/useDeviceDetection';
import WelcomeOverlay from '../components/overlays/WelcomeOverlay';
import UnifiedOrientationOverlay from '../components/mobile/UnifiedOrientationOverlay';

/**
 * Composant de page d'accueil avec transitions fluides optimisées
 */
const HomePage = ({ 
  backgroundImage = './images/home-background.png',
  videoSrc = './videos/ENTRANCE_TM.mp4',
  previewBackgroundImage = './images/scene-preview.png'
}) => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isLandscape } = useDeviceDetection();
  const [textVisible, setTextVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  // États pour la gestion des transitions
  const [transitionPhase, setTransitionPhase] = useState('home'); // 'home', 'video', 'preview', 'experience'
  const [homeExiting, setHomeExiting] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);
  
  // État pour l'orientation (nouveau)
  const [showOrientationOverlay, setShowOrientationOverlay] = useState(
    (isMobile || isTablet) && !isLandscape
  );
  
  // Références pour les éléments DOM
  const videoRef = useRef(null);
  const homeContainerRef = useRef(null);
  
  // Gestionnaire pour le clic sur le bouton d'entrée
  const handleEnterClick = () => {
    if (videoRef.current) {
      // Commencer à animer la sortie de la page d'accueil
      setHomeExiting(true);
      
      // IMPORTANT: Préparer la vidéo avant de débuter l'animation d'opacité
      if (videoRef.current.readyState >= 3) {
        // La vidéo est déjà prête, on peut la jouer immédiatement
        // mais on attend d'abord que l'animation de sortie de home commence
        videoRef.current.currentTime = 0; // S'assurer de commencer du début
        
        setTimeout(() => {
          setTransitionPhase('video');
          // Rendre la vidéo visible avant de la jouer pour éviter le flash
          setVideoPlaying(true);
          
          // Laisser un court délai pour que l'opacité change
          setTimeout(() => {
            try {
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch(err => {
                  console.error('Autoplay prevented:', err);
                  // En cas d'échec, passer directement à la phase d'aperçu
                  handleVideoEnd();
                });
              }
            } catch (err) {
              console.error('Error playing video:', err);
              // En cas d'erreur, passer à la phase d'aperçu
              handleVideoEnd();
            }
          }, 50);
        }, 200);
      } else {
        // La vidéo n'est pas encore prête, attendre qu'elle le soit
        const checkReadyState = () => {
          if (videoRef.current.readyState >= 3) {
            setTransitionPhase('video');
            setVideoPlaying(true);
            
            setTimeout(() => {
              try {
                videoRef.current.play();
              } catch (err) {
                console.error('Error playing video:', err);
                handleVideoEnd();
              }
            }, 50);
          } else {
            // Vérifier à nouveau après un court délai
            setTimeout(checkReadyState, 100);
          }
        };
        
        setTimeout(checkReadyState, 300);
      }
    } else {
      // Fallback si la vidéo n'est pas disponible
      handleVideoEnd();
    }
  };

  // Gestionnaire pour la fin de la vidéo de transition
  const handleVideoEnd = () => {
    // Commencer à afficher l'aperçu avec un fondu enchaîné
    setTransitionPhase('preview');
    
    // Afficher le WelcomeOverlay après un court délai
    setTimeout(() => {
      setShowWelcomeOverlay(true);
    }, 300);
    
    // Simuler le préchargement de Spline (à remplacer par la vraie logique)
    if (!splineLoaded) {
      // Simuler un chargement en arrière-plan
      const fakeLoading = setTimeout(() => {
        setSplineLoaded(true);
      }, 3000);
      
      return () => clearTimeout(fakeLoading);
    }
  };
  
  // Gestionnaire pour la fermeture du WelcomeOverlay
  const handleWelcomeClose = () => {
    setShowWelcomeOverlay(false);
    
    // Petit délai avant de naviguer pour laisser le temps à l'overlay de disparaître
    setTimeout(() => {
      setTransitionPhase('experience');
      navigate('/experience');
      
      // Sauvegarder l'état dans localStorage
      try {
        localStorage.setItem('experienceStarted', 'true');
      } catch (err) {
        console.error('Erreur lors de l\'enregistrement de l\'état:', err);
      }
    }, 300);
  };

  // Gestionnaire pour fermer l'overlay d'orientation
  const handleOrientationClose = () => {
    setShowOrientationOverlay(false);
    
    // Enregistrer la préférence dans le localStorage
    try {
      localStorage.setItem('orientationPromptDismissed', 'true');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la préférence:', err);
    }
  };

  // Effet pour l'animation d'entrée et le préchargement
  useEffect(() => {
    // Animation d'entrée
    const pageTimer = setTimeout(() => {
      setPageVisible(true);
    }, 100);

    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 1500);
    
    const buttonTimer = setTimeout(() => {
      setButtonVisible(true);
    }, 2500);
    
    // Précharger les ressources
    const preloadResources = async () => {
      try {
        // Liste des ressources à précharger
        const resourcesToPreload = [
          backgroundImage,
          videoSrc,
          previewBackgroundImage
        ];
        
        let loaded = 0;
        
        for (const resource of resourcesToPreload) {
          await new Promise((resolve) => {
            if (resource.endsWith('.mp4') || resource.endsWith('.webm')) {
              // Utiliser directement la référence vidéo
              if (!videoRef.current) {
                videoRef.current = document.createElement('video');
                videoRef.current.muted = true;
                videoRef.current.playsInline = true;
                videoRef.current.preload = 'auto';
                videoRef.current.src = resource;
              }
              
              const handleLoaded = () => {
                loaded++;
                setPreloadProgress(Math.floor((loaded / resourcesToPreload.length) * 100));
                videoRef.current.removeEventListener('loadeddata', handleLoaded);
                resolve();
              };
              
              const handleError = () => {
                loaded++;
                setPreloadProgress(Math.floor((loaded / resourcesToPreload.length) * 100));
                console.error(`Erreur lors du préchargement de ${resource}`);
                videoRef.current.removeEventListener('error', handleError);
                resolve();
              };
              
              // Si la vidéo est déjà chargée
              if (videoRef.current.readyState >= 3) {
                loaded++;
                setPreloadProgress(Math.floor((loaded / resourcesToPreload.length) * 100));
                resolve();
                return;
              }
              
              videoRef.current.addEventListener('loadeddata', handleLoaded);
              videoRef.current.addEventListener('error', handleError);
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
    
    // Vérifier si l'invite d'orientation a déjà été rejetée
    const orientationDismissed = localStorage.getItem('orientationPromptDismissed') === 'true';
    if (orientationDismissed) {
      setShowOrientationOverlay(false);
    }
    
    // Nettoyage
    return () => {
      clearTimeout(pageTimer);
      clearTimeout(textTimer);
      clearTimeout(buttonTimer);
    };
  }, [backgroundImage, videoSrc, previewBackgroundImage]);

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
      zIndex: 1000,
      opacity: pageVisible ? 1 : 0,
      transition: homeExiting ? 'opacity 0.6s ease-out' : 'opacity 1.2s ease-in',
      ...(homeExiting && { opacity: 0 }),
      pointerEvents: homeExiting ? 'none' : 'auto'
    },
    background: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: pageVisible ? 0.8 : 0,
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
      opacity: isPreloading ? 0.7 : 0,
      transition: 'opacity 0.5s ease',
      pointerEvents: 'none'
    },
    progressBar: {
      width: '200px',
      height: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginBottom: '8px'
    },
    progressFill: {
      height: '100%',
      width: `${preloadProgress}%`,
      backgroundColor: '#2A9D8F',
      transition: 'width 0.3s ease-out'
    },
    progressText: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '12px'
    },
    videoContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 2000, // Toujours au-dessus de la page d'accueil
      opacity: videoPlaying ? 1 : 0,
      transition: 'opacity 0.5s ease-in',
      backgroundColor: '#000',
      pointerEvents: transitionPhase === 'video' ? 'auto' : 'none'
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    previewContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 3000, // Au-dessus de tout
      opacity: transitionPhase === 'preview' ? 1 : 0,
      transition: 'opacity 0.8s ease-in',
      backgroundColor: '#000',
      pointerEvents: transitionPhase === 'preview' ? 'auto' : 'none'
    },
    previewBackground: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 0.7 // Légère opacité pour que le WelcomeOverlay soit plus lisible
    }
  };
  
  // Styles pour les animations
  const keyframes = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 0.8; }
    }

    @keyframes scaleIn {
      from { transform: scale(1.05); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      
      {/* Page d'accueil */}
      <div ref={homeContainerRef} style={styles.container}>
        {/* Image d'arrière-plan */}
        <img 
          src={backgroundImage} 
          alt="Fond" 
          style={{
            ...styles.background,
            transform: pageVisible ? 'scale(1)' : 'scale(1.05)',
            transition: 'opacity 2s ease-out, transform 2.5s ease-out',
          }}
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
        
        {/* Indicateur de préchargement */}
        {isPreloading && (
          <div style={styles.preloader}>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${preloadProgress}%`
              }}></div>
            </div>
            <div style={styles.progressText}>
              Chargement {preloadProgress}%
            </div>
          </div>
        )}
      </div>
      
      {/* Conteneur vidéo - Toujours présent mais avec opacité 0 quand inactif */}
      <div style={styles.videoContainer}>
        <video 
          ref={videoRef}
          src={videoSrc}
          preload="auto"
          muted
          playsInline
          style={styles.video}
          onEnded={handleVideoEnd}
        />
      </div>
      
      {/* Conteneur de prévisualisation avec WelcomeOverlay - Toujours présent mais avec opacité 0 quand inactif */}
      <div style={styles.previewContainer}>
        {/* Image de prévisualisation */}
        <img
          src={previewBackgroundImage}
          alt="Aperçu"
          style={styles.previewBackground}
          onError={(e) => {
            console.error("Impossible de charger l'image de prévisualisation");
            e.target.style.display = 'none';
          }}
        />
        
        {/* WelcomeOverlay uniquement quand nécessaire */}
        {showWelcomeOverlay && (
          <WelcomeOverlay 
            onClose={handleWelcomeClose} 
            // Ne pas afficher la barre de chargement si Spline est déjà chargé
            splineLoaded={splineLoaded}
          />
        )}
      </div>

      {/* Message d'orientation discret pour appareils mobiles en mode portrait */}
      {(isMobile || isTablet) && !isLandscape && showOrientationOverlay && (
        <UnifiedOrientationOverlay
          onClose={handleOrientationClose}
          autoHideTime={10000}
          isHomeVersion={true}
        />
      )}
    </>
  );
};

HomePage.propTypes = {
  backgroundImage: PropTypes.string,
  videoSrc: PropTypes.string,
  previewBackgroundImage: PropTypes.string
};

export default HomePage;