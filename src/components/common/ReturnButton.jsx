/**
 * Composant de bouton de retour
 * Bouton permettant de revenir à la position précédente de la caméra
 */
import React from 'react';
import PropTypes from 'prop-types';
import { controlStyles } from '../../constants/styles';

/**
 * Bouton de retour à la position précédente
 */
const ReturnButton = ({ onClick, label = 'RETOUR', icon = '←', style = {} }) => {
  // Fonction qui gère à la fois les clics et les touchers
  const handleInteraction = (e) => {
    // Empêcher la propagation pour éviter les conflits avec d'autres gestionnaires
    e.stopPropagation();
    // Empêcher le comportement par défaut pour les touchers
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    // Appeler la fonction de callback
    onClick();
  };
  
  return (
    <div style={{
      ...controlStyles.returnButton,
      ...style
    }}>
      <button
        onClick={handleInteraction}
        onTouchStart={handleInteraction}  // Ajouter le support tactile
        style={controlStyles.button}
        onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.8)'}
        aria-label={label}
      >
        <span>{icon}</span> {label}
      </button>
    </div>
  );
};

ReturnButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string,
  icon: PropTypes.string,
  style: PropTypes.object
};

export default React.memo(ReturnButton);