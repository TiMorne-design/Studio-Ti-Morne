/**
 * Préchargeur de scènes Spline
 * Permet de précharger des scènes Spline en arrière-plan avant de les afficher
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant qui précharge une scène Spline avant de la rendre visible
 */
const SplinePreloader = ({
  scenePath,
  onLoadProgress,
  onLoadComplete,
  onLoadError,
  renderPlaceholder = null,
  minLoadTime = 0
}) => {
  const [loadStatus, setLoadStatus] = useState('idle'); // idle, loading, loaded, error
  const [progressValue, setProgressValue] = useState(0);
  const iframeRef = useRef(null);
  const startTimeRef = useRef(0);
  
  // Fonction pour finaliser le chargement
  const completeLoading = useCallback(() => {
    setProgressValue(100);
    setLoadStatus('loaded');
    
    if (onLoadComplete) {
      onLoadComplete();
    }
  }, [onLoadComplete]);
  
  // Gestionnaire de messages de l'iframe Spline
  const handleSplineMessage = useCallback((event) => {
    // Vérifier si le message provient de Spline
    if (event.data && typeof event.data === 'object' && 'type' in event.data) {
      if (event.data.type === 'spline.progress') {
        // Mettre à jour la progression
        const progress = Math.floor(event.data.progress * 100);
        setProgressValue(progress);
        
        if (onLoadProgress) {
          onLoadProgress(progress);
        }
      } else if (event.data.type === 'spline.loaded') {
        // Vérifier si la durée minimum de chargement est écoulée
        const elapsed = Date.now() - startTimeRef.current;
        
        if (elapsed >= minLoadTime) {
          completeLoading();
        } else {
          // Attendre le temps restant
          const remaining = minLoadTime - elapsed;
          setTimeout(completeLoading, remaining);
        }
      } else if (event.data.type === 'spline.error') {
        setLoadStatus('error');
        if (onLoadError) {
          onLoadError(new Error(event.data.message || 'Erreur de chargement Spline'));
        }
      }
    }
  }, [onLoadProgress, onLoadError, minLoadTime, completeLoading]);
  
  // Configuration de l'iframe et du listener de progression
  useEffect(() => {
    if (loadStatus === 'idle' && scenePath) {
      setLoadStatus('loading');
      startTimeRef.current = Date.now();
      
      // Créer un iframe caché pour précharger la scène
      const iframe = document.createElement('iframe');
      iframe.style.width = '10px';
      iframe.style.height = '10px';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      
      // URL de la scène avec paramètres pour désactiver l'autoplay et optimiser le chargement
      const url = new URL(scenePath);
      url.searchParams.set('preload', 'true');
      url.searchParams.set('autoplay', 'false');
      
      iframe.src = url.toString();
      iframeRef.current = iframe;
      
      // Ajouter à la page
      document.body.appendChild(iframe);
      
      // Configurer la communication avec l'iframe
      window.addEventListener('message', handleSplineMessage);
      
      // Fonction de nettoyage
      return () => {
        window.removeEventListener('message', handleSplineMessage);
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };
    }
  }, [loadStatus, scenePath, handleSplineMessage]);
  
  // Simuler la progression si aucun message n'est reçu
  useEffect(() => {
    if (loadStatus === 'loading' && progressValue === 0) {
      // Démarrer une progression simulée après un délai
      const simulationDelay = setTimeout(() => {
        let currentProgress = 0;
        const simulationInterval = setInterval(() => {
          // Augmenter progressivement jusqu'à 90% maximum (les 10% restants seront
          // atteints uniquement lorsque le chargement sera réellement terminé)
          currentProgress += Math.random() * 2;
          const boundedProgress = Math.min(Math.floor(currentProgress), 90);
          
          if (boundedProgress >= 90 || loadStatus !== 'loading') {
            clearInterval(simulationInterval);
          } else {
            setProgressValue(boundedProgress);
            if (onLoadProgress) {
              onLoadProgress(boundedProgress);
            }
          }
        }, 200);
        
        return () => {
          clearInterval(simulationInterval);
        };
      }, 1000);
      
      return () => {
        clearTimeout(simulationDelay);
      };
    }
  }, [loadStatus, progressValue, onLoadProgress]);
  
  // Rendu du placeholder pendant le chargement
  return (
    <>
      {loadStatus !== 'loaded' && renderPlaceholder ? (
        typeof renderPlaceholder === 'function' ? 
          renderPlaceholder(progressValue, loadStatus) : 
          renderPlaceholder
      ) : null}
    </>
  );
};

SplinePreloader.propTypes = {
  scenePath: PropTypes.string.isRequired,
  onLoadProgress: PropTypes.func,
  onLoadComplete: PropTypes.func,
  onLoadError: PropTypes.func,
  renderPlaceholder: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  minLoadTime: PropTypes.number
};

export default SplinePreloader;