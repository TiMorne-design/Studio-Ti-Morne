/**
 * Gestionnaire de transitions
 * Orchestre les transitions entre les différentes vues de l'application
 */
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { preloadEssentialResources } from "../../services/preloadService";

// Contexte pour les transitions
const TransitionContext = createContext({
  isLoading: true,
  loadingProgress: 0,
  startTransition: () => {},
  completeTransition: () => {},
  transitionState: 'idle',
  preloadedResources: {}
});

/**
 * Hook pour utiliser le gestionnaire de transitions
 */
export const useTransition = () => useContext(TransitionContext);

/**
 * Composant qui gère les transitions entre les vues
 */
export const TransitionManager = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [transitionState, setTransitionState] = useState('idle'); // idle, loading, transitioning, complete
  const [preloadedResources, setPreloadedResources] = useState({});
  const [currentTransition, setCurrentTransition] = useState(null);
  
  // Fonction pour ajouter une ressource préchargée
  const addPreloadedResource = useCallback((key, value) => {
    setPreloadedResources(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Charger les ressources essentielles au démarrage
  useEffect(() => {
    if (isLoading && transitionState === 'idle') {
      setTransitionState('loading');
      
      preloadEssentialResources(progress => {
        setLoadingProgress(progress);
      })
        .then(() => {
          // Marquer comme complété avec un léger délai pour une transition plus fluide
          setTimeout(() => {
            setIsLoading(false);
            setTransitionState('complete');
            setLoadingProgress(100);
          }, 500);
        })
        .catch(error => {
          console.error('Erreur lors du préchargement des ressources:', error);
          // Même en cas d'erreur, continuer après un délai
          setTimeout(() => {
            setIsLoading(false);
            setTransitionState('error');
          }, 1000);
        });
    }
  }, [isLoading, transitionState]);
  
  // Démarrer une transition vers une autre vue
  const startTransition = useCallback((target, options = {}) => {
    const { afterDelay = 0, withVideo = false, videoSrc = null } = options;
    
    setTransitionState('transitioning');
    
    // Stocker les informations de transition
    setCurrentTransition({
      target,
      withVideo,
      videoSrc,
      startTime: Date.now()
    });
    
    // Attendre le délai si nécessaire
    if (afterDelay > 0) {
      setTimeout(() => {
        if (withVideo) {
          // La navigation sera gérée après la vidéo
          // Ne pas naviguer ici
        } else {
          navigate(target);
          setTransitionState('complete');
          setCurrentTransition(null);
        }
      }, afterDelay);
    } else {
      if (!withVideo) {
        navigate(target);
        setTransitionState('complete');
        setCurrentTransition(null);
      }
    }
    
    return true;
  }, [navigate]);
  
  // Marquer une transition comme terminée
  const completeTransition = useCallback(() => {
    if (currentTransition) {
      navigate(currentTransition.target);
      setTransitionState('complete');
      setCurrentTransition(null);
    }
  }, [currentTransition, navigate]);
  
  // Valeur du contexte
  const contextValue = {
    isLoading,
    loadingProgress,
    startTransition,
    completeTransition,
    transitionState,
    preloadedResources,
    addPreloadedResource,
    currentTransition
  };
  
  return (
    <TransitionContext.Provider value={contextValue}>
      {children}
    </TransitionContext.Provider>
  );
};

TransitionManager.propTypes = {
  children: PropTypes.node.isRequired
};

export default TransitionManager;