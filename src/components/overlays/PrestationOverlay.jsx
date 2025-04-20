/**
 * Overlay de présentation des prestations
 * Affiche le contenu dynamique des différentes prestations
 */
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import BaseOverlay from '../common/BaseOverlay';

/**
 * Overlay de présentation des prestations
 */
const PrestationOverlay = ({ title, content, onClose }) => {
  return (
    <BaseOverlay 
      title={title} 
      onClose={onClose}
      showCloseButton={false}
      animationDelay={200}
    >
      <div className="prestation-content">
        {content}
      </div>
    </BaseOverlay>
  );
};

PrestationOverlay.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired
};

export default memo(PrestationOverlay);