/**
 * Contrôles de navigation pour appareils mobiles
 * Fournit des boutons pour se déplacer dans la scène 3D
 * Version modifiée pour cohabiter avec les swipes
 */
import React, { memo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant de contrôles de navigation pour mobile
 */
const MobileControls = ({ onMoveForward, onMoveBackward }) => {
  // Utiliser useRef pour tracker l'état des boutons
  const forwardPressed = useRef(false);
  const backwardPressed = useRef(false);
  const intervalRef = useRef(null);
  
  // Référence pour suivre le point de départ du toucher
  const touchStartRef = useRef({
    x: 0,
    y: 0,
    target: null
  });
  
  // Seuil de mouvement pour considérer qu'un doigt a "glissé" hors du bouton
  const moveThreshold = 15; // en pixels
  
  // Styles pour les contrôles
  const styles = {
    container: {
      position: 'fixed',
      bottom: '20px', 
      left: '0',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '30px',
      zIndex: 1000,
      pointerEvents: 'none'
    },
    button: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px',
      color: '#2A9D8F',
      border: 'none',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation'
    }
  };
  
  // Fonction pour nettoyer l'état des contrôles
  const clearControlsState = useCallback(() => {
    forwardPressed.current = false;
    backwardPressed.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Fonction pour gérer le mouvement continu
  const handleContinuousMovement = useCallback(() => {
    if (forwardPressed.current) {
      onMoveForward();
    } else if (backwardPressed.current) {
      onMoveBackward();
    }
  }, [onMoveForward, onMoveBackward]);
  
  // Gestionnaire pour le début du toucher
  const handleTouchStart = useCallback((e, direction) => {
    // Ajouter cette condition pour distinguer les clics des swipes
    // Si l'utilisateur touche clairement le bouton (pas près des bords), traiter comme un clic
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(touch.clientX - centerX, 2) + 
      Math.pow(touch.clientY - centerY, 2)
    );
    
    // Si clairement sur le bouton (pas près du bord)
    if (distanceFromCenter < rect.width * 0.35) {
      e.preventDefault(); // Bloquer la propagation seulement si c'est clairement un clic
      e.stopPropagation();
      
      // Enregistrer le point de départ du toucher
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        target: e.currentTarget,
        direction: direction
      };
      
      // Arrêter tout mouvement existant 
      clearControlsState();
      
      // Définir l'état du bouton approprié
      if (direction === 'forward') {
        forwardPressed.current = true;
        
        // Style visuel
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        e.currentTarget.style.transform = 'scale(1.1)';
        
        // Appliquer un mouvement immédiat
        onMoveForward();
      } else {
        backwardPressed.current = true;
        
        // Style visuel
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        e.currentTarget.style.transform = 'scale(1.1)';
        
        // Appliquer un mouvement immédiat
        onMoveBackward();
      }
      
      // Établir un mouvement continu
      intervalRef.current = setInterval(() => {
        if (direction === 'forward') {
          onMoveForward();
          onMoveForward(); // Appeler 2 fois pour doubler la vitesse
        } else {
          onMoveBackward();
          onMoveBackward(); // Appeler 2 fois pour doubler la vitesse
        }
      }, 50);
      
      // Attacher un gestionnaire global pour le touchmove
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    }
  }, [onMoveForward, onMoveBackward, clearControlsState]);

  
  // Gestionnaire global pour détecter si le doigt glisse loin des boutons
  const handleGlobalTouchMove = useCallback((e) => {
    if (!touchStartRef.current.target) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Si le mouvement dépasse le seuil, considérer que l'utilisateur veut faire un swipe
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      // Réinitialiser les styles visuels
      if (touchStartRef.current.target) {
        touchStartRef.current.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        touchStartRef.current.target.style.transform = 'scale(1)';
      }
      
      // Arrêter le mouvement continu
      clearControlsState();
      
      // Nettoyer la référence du toucher
      touchStartRef.current = {
        x: 0,
        y: 0,
        target: null,
        direction: null
      };
      
      // Détacher le gestionnaire global
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      
      // Ne pas bloquer la propagation pour permettre aux autres gestionnaires de traiter l'événement
      // e.stopPropagation(); // Commenté pour permettre la propagation
    }
  }, [clearControlsState]);
  
  // Gestionnaire pour la fin du toucher
  const handleTouchEnd = useCallback((e) => {
    // Ne pas bloquer le comportement par défaut
    // e.preventDefault(); // Commenté pour réduire les interférences
    
    // Réinitialiser les styles
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    e.currentTarget.style.transform = 'scale(1)';
    
    // Nettoyer tous les états
    clearControlsState();
    
    // Nettoyer la référence du toucher
    touchStartRef.current = {
      x: 0,
      y: 0,
      target: null,
      direction: null
    };
    
    // Détacher le gestionnaire global
    document.removeEventListener('touchmove', handleGlobalTouchMove);
  }, [clearControlsState, handleGlobalTouchMove]);
  
  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [handleGlobalTouchMove]);

  return (
    <div style={styles.container}>
      <button
        style={styles.button}
        onTouchStart={(e) => handleTouchStart(e, 'forward')}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label="Avancer"
      >
        ▲
      </button>
      <button
        style={styles.button}
        onTouchStart={(e) => handleTouchStart(e, 'backward')}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label="Reculer"
      >
        ▼
      </button>
    </div>
  );
};

MobileControls.propTypes = {
  onMoveForward: PropTypes.func.isRequired,
  onMoveBackward: PropTypes.func.isRequired
};

export default memo(MobileControls);