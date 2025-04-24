// EntryExperience.jsx - Version simplifiée
import React, { useState, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import HomePage from '../scenes/HomePage';
import VideoTransition from './transitions/VideoTransition';
import LoadingScreen from './ui/LoadingScreen';

// Chargement paresseux du composant lourd
const CabinInterior = lazy(() => import('../scenes/CabinInterior'));

/**
 * Composant orchestrant l'expérience d'entrée simplifiée
 */
const EntryExperience = ({
  homeBackgroundImage = './images/home-background.png',
  transitionVideo = './videos/ENTRANCE_TM.mp4',
  onExperienceComplete = null
}) => {
  // État unique pour le flux
  const [currentStage, setCurrentStage] = useState('home'); // home, video, experience
  
  // Gestionnaire pour le clic sur le bouton d'entrée
  const handleEnterClick = () => {
    setCurrentStage('video');
  };
  
  // Gestionnaire de fin de la vidéo de transition
  const handleVideoComplete = () => {
    setCurrentStage('experience');
    if (onExperienceComplete) {
      onExperienceComplete();
    }
  };
  
  // Rendu selon l'étape actuelle
  switch (currentStage) {
    case 'home':
      return (
        <HomePage
          onEnterClick={handleEnterClick}
          backgroundImage={homeBackgroundImage}
        />
      );
      
    case 'video':
      return (
        <VideoTransition
          videoSrc={transitionVideo}
          autoSkip={true}
          onTransitionComplete={handleVideoComplete}
        />
      );
      
    case 'experience':
      return (
        <Suspense fallback={<LoadingScreen message="Chargement de l'expérience 3D..." />}>
          <CabinInterior />
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