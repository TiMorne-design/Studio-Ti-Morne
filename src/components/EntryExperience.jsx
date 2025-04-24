// EntryExperience.jsx - Version améliorée avec préchargement
import React, { useState, lazy, Suspense, useEffect } from 'react';
import PropTypes from 'prop-types';
import HomePage from '../scenes/HomePage';
import VideoTransition from './transitions/VideoTransition';
import LoadingScreen from './ui/LoadingScreen';
import SplinePreloader from './3d/SplinePreloader';

// Chargement paresseux du composant lourd
const CabinInterior = lazy(() => import('../scenes/CabinInterior'));

/**
 * Composant orchestrant l'expérience d'entrée avec préchargement
 */
const EntryExperience = ({
  homeBackgroundImage = './images/home-background.png',
  transitionVideo = './videos/ENTRANCE_TM.mp4',
  previewImageSrc = './images/scene-preview.png',
  onExperienceComplete = null
}) => {
  // État pour le flux global
  const [currentStage, setCurrentStage] = useState('home'); // home, video, experience
  
  // État pour le préchargement de la scène Spline
  const [splineLoadProgress, setSplineLoadProgress] = useState(0);
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  
  // Gestionnaire pour le clic sur le bouton d'entrée
const handleEnterClick = () => {
  // Afficher l'overlay de transition
  setShowTransitionOverlay(true);
  // Changer de stage après un court délai pour permettre à l'overlay de s'afficher
  setTimeout(() => {
    setCurrentStage('video');
  }, 300);
};
  
  // Gestionnaire de fin de la vidéo de transition
  const handleVideoComplete = () => {
    console.log("Transition terminée, passage à l'expérience");
    // Vérifier si la scène est chargée avant de passer à l'expérience
    setCurrentStage('experience');
    
    if (onExperienceComplete) {
      onExperienceComplete();
    }
  };
  
  // Gestionnaire pour le préchargement de la scène Spline
  const handleSplineLoadProgress = (progress) => {
    setSplineLoadProgress(progress);
    console.log(`Préchargement Spline: ${progress}%`);
  };
  
  // Gestionnaire pour la fin du préchargement
  const handleSplineLoadComplete = () => {
    setIsSplineLoaded(true);
    console.log("Scène Spline préchargée avec succès");
  };


  
  // Rendu selon l'étape actuelle
  switch (currentStage) {
    case 'home':
  return (
    <>
      <HomePage
        onEnterClick={handleEnterClick}
        backgroundImage={homeBackgroundImage}
      />
      {/* Overlay de transition */}
      {showTransitionOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${homeBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1900,
          animation: 'fadeIn 0.3s forwards'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
      
    case 'video':
      return (
        <>
          <VideoTransition
            videoSrc={transitionVideo}
            previewImageSrc={previewImageSrc}
            autoSkip={false} // Désactiver l'auto-skip pour attendre le clic sur le welcome overlay
            onTransitionComplete={handleVideoComplete}
            onSplineLoadProgress={handleSplineLoadProgress}
          />
          
          {/* Préchargement de la scène Spline en arrière-plan */}
          <div style={{ display: 'none' }}>
            <SplinePreloader
              scenePath="https://prod.spline.design/caI3XJc8z6B-FFGA/scene.splinecode"
              onLoadProgress={handleSplineLoadProgress}
              onLoadComplete={handleSplineLoadComplete}
              renderPlaceholder={null} // Pas de placeholder visible
              minLoadTime={0}
            />
          </div>
        </>
      );
      
    // Dans EntryExperience.jsx
case 'experience':
  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${previewImageSrc || './images/scene-preview.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{
          position: 'absolute',
          bottom: '50px',
          width: '300px',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'white',
            fontSize: '16px',
            marginBottom: '15px',
            textShadow: '0 1px 3px rgba(0,0,0,0.7)'
          }}>
            Chargement de l'expérience...
          </p>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '30%', // On ne peut pas animer ici facilement
              backgroundColor: '#2A9D8F',
              borderRadius: '2px',
              animation: 'progress 1.5s infinite ease-in-out'
            }}/>
          </div>
        </div>
        <style>{`
          @keyframes progress {
            0% { width: 0%; margin-left: 0; }
            50% { width: 70%; margin-left: 0; }
            100% { width: 30%; margin-left: 70%; }
          }
        `}</style>
      </div>
    }>
      <CabinInterior skipWelcomeOverlay={true} />
    </Suspense>
  );
      
    default:
      return <LoadingScreen />;
  }
};

EntryExperience.propTypes = {
  homeBackgroundImage: PropTypes.string,
  transitionVideo: PropTypes.string,
  onExperienceComplete: PropTypes.func
};

export default EntryExperience;