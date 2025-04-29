/**
 * Composant de base pour les overlays
 * Fournit la structure et les animations standard pour tous les overlays
 */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { overlayStyles } from '../../constants/styles';
import useDeviceDetection from '../../hooks/useDeviceDetection';

/**
 * Composant de base réutilisable pour les overlays
 */
const BaseOverlay = ({ 
  title,
  children,
  onClose,
  showCloseButton = true,
  animationDelay = 200,
  customStyles = {}
}) => {
  // État pour l'animation d'entrée/sortie
  const [isVisible, setIsVisible] = useState(false);

  const { isMobile, isTablet } = useDeviceDetection();
  
  // Effet pour animer l'entrée
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);
    
    // Nettoyer le timer si le composant est démonté
    return () => clearTimeout(timer);
  }, [animationDelay]);
  
  // Gérer la fermeture avec animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    
    // Appeler onClose après la fin de l'animation de sortie
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 500);
    
    // Nettoyer le timer si le composant est démonté
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // Styles dynamiques basés sur l'état de visibilité
  const containerStyle = {
    ...overlayStyles.container,
    ...customStyles.container,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : 'translateX(50px)'
  };

  if (!isMobile && !isTablet) {
    containerStyle.height = 'calc(100% - 80px)';
    containerStyle.marginBottom = '80px';
    containerStyle.width = '45%';       // Réduit à 40% au lieu de 50%
    containerStyle.maxWidth = '700px';  // Limite la largeur maximale
  }

  // Appliquer des styles spécifiques seulement sur desktop
if (!isMobile && !isTablet) {
  containerStyle.height = 'calc(100% - 80px)';
  containerStyle.marginBottom = '80px';
}
  
  return (
    
    <div
    className="overlay-container"
    style={containerStyle}
    onClick={handleClose}
  >
    <div
      className="overlay-inner"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          // Ne pas arrêter la propagation ici, juste empêcher la fermeture
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          // Ne pas arrêter la propagation des mouvements
          // Laisser les swipes fonctionner partout sauf dans la zone de contenu
          if (e.target.closest('.overlay-content')) {
            e.stopPropagation();
          }
        }}
      >


      <div style={{
        ...overlayStyles.header,
        ...customStyles.header
      }}>
        <h1 style={{
          ...overlayStyles.title,
          ...customStyles.title
        }}>
          {title}
        </h1>
        
        {showCloseButton && (
          <button 
          onClick={(e) => {
            e.stopPropagation();  // Arrêter la propagation
            e.preventDefault();   // Empêcher le comportement par défaut
            handleClose();        // Appeler la fonction de fermeture
          }}
          style={{
            ...overlayStyles.closeButton,
            ...customStyles.closeButton
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(42, 157, 143, 0.4)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(42, 157, 143, 0.2)'}
          aria-label="Fermer"
        >
          ✕
        </button>
        )}
      </div>
      
      <div className="overlay-content" style={customStyles.content || {}}>
        {children}
      </div>
    </div>
    </div>
  );
};

BaseOverlay.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  showCloseButton: PropTypes.bool,
  animationDelay: PropTypes.number,
  customStyles: PropTypes.object
};

export default React.memo(BaseOverlay);