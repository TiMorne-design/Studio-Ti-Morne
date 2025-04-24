/**
 * Composant d'écran de chargement personnalisable
 * Affiche une animation de chargement avec une barre de progression
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTransition } from '../transitions/TransitionManager';

/**
 * Écran de chargement avec animation et progression
 */
const LoadingScreen = ({
  message = 'Chargement...',
  showProgress = true,
  overrideProgress = null,
  minDuration = 1000,
  backgroundColor = '#1a1a1a',
  textColor = '#ffffff',
  accentColor = '#2A9D8F',
  logo = null, // chemin vers un logo (optionnel)
  loaderType = 'bar' // 'bar', 'spinner', 'dots'
}) => {
  // Obtenir la progression depuis le contexte de transition
  const { loadingProgress } = useTransition();
  
  // État local pour la progression et l'animation
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mountComplete, setMountComplete] = useState(false);
  
  // Utiliser la progression fournie ou celle du contexte
  const progress = overrideProgress !== null ? overrideProgress : loadingProgress;
  
  // Animation fluide de la barre de progression
  useEffect(() => {
    // Si la progression fournie est supérieure, mettre à jour progressivement
    if (progress > displayProgress) {
      const increment = Math.max(1, (progress - displayProgress) * 0.05);
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(prev + increment, progress));
      }, 16); // ~60fps
      
      return () => clearTimeout(timer);
    }
    
    // Si la progression est complète, attendre un délai minimal avant de masquer
    if (progress >= 100 && mountComplete) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, minDuration);
      
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress, minDuration, mountComplete]);
  
  // Marquer le montage comme terminé après un court délai
  useEffect(() => {
    const timer = setTimeout(() => {
      setMountComplete(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Rendu différent selon le type de loader
  const renderLoader = () => {
    switch (loaderType) {
      case 'spinner':
        return (
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: `3px solid ${accentColor}40`,
              borderTopColor: accentColor,
              animation: 'spinner 1s linear infinite'
            }}
          />
        );
      
      case 'dots':
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div 
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: accentColor,
                  animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`
                }}
              />
            ))}
          </div>
        );
      
      case 'bar':
      default:
        return (
          <div 
            style={{
              width: '200px',
              height: '4px',
              backgroundColor: `${accentColor}40`,
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                height: '100%',
                width: `${displayProgress}%`,
                backgroundColor: accentColor,
                borderRadius: '2px',
                transition: 'width 0.3s ease-out'
              }}
            />
          </div>
        );
    }
  };
  
  // Styles pour les animations
  const keyframes = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes spinner {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes dotPulse {
      0%, 100% { transform: scale(0.5); opacity: 0.5; }
      50% { transform: scale(1); opacity: 1; }
    }
    @keyframes pulseEffect {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        animation: isVisible ? 'fadeIn 0.5s ease-out' : 'fadeOut 0.5s ease-out',
        transition: 'opacity 0.5s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <style>{keyframes}</style>
      
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          animation: 'pulseEffect 2s infinite ease-in-out'
        }}
      >
        {/* Logo (si fourni) */}
        {logo && (
          <img 
            src={logo} 
            alt="Logo" 
            style={{
              maxWidth: '150px',
              maxHeight: '150px',
              marginBottom: '20px'
            }}
          />
        )}
        
        {/* Message */}
        <h1 
          style={{
            color: textColor,
            fontSize: '2rem',
            fontWeight: 400,
            fontFamily: '"Reem Kufi", sans-serif',
            margin: 0,
            textAlign: 'center'
          }}
        >
          {message}
        </h1>
        
        {/* Barre de progression ou animation */}
        {showProgress && renderLoader()}
        
        {/* Affichage numérique de la progression */}
        {showProgress && loaderType === 'bar' && (
          <div 
            style={{
              color: textColor,
              fontSize: '0.9rem',
              opacity: 0.7,
              marginTop: '8px'
            }}
          >
            {Math.floor(displayProgress)}%
          </div>
        )}
      </div>
    </div>
  );
};

LoadingScreen.propTypes = {
  message: PropTypes.string,
  showProgress: PropTypes.bool,
  overrideProgress: PropTypes.number,
  minDuration: PropTypes.number,
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  accentColor: PropTypes.string,
  logo: PropTypes.string,
  loaderType: PropTypes.oneOf(['bar', 'spinner', 'dots'])
};

export default LoadingScreen;