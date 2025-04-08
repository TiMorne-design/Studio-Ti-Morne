/**
 * Overlay d'information "À Propos"
 * Affiche des informations sur l'entreprise et ses compétences
 */
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import BaseOverlay from '../common/BaseOverlay';
import { prestationStyles } from '../../constants/styles';

// Composant de carte pour les compétences
const SkillCard = memo(({ title, description }) => (
  <div 
    style={prestationStyles.card}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <h3 style={prestationStyles.cardTitle}>{title}</h3>
    <p style={prestationStyles.cardText}>{description}</p>
  </div>
));

SkillCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};

// Contenu de l'overlay
const AboutContent = memo(() => (
  <>
    <div style={{ marginBottom: '40px' }}>
      <h2 style={prestationStyles.sectionTitle}>
        QUI SUIS-JE ?
      </h2>
      <p style={prestationStyles.paragraph}>
        Passionné(e) de design et développement interactif, je crée des expériences numériques immersives qui allient esthétique et fonctionnalité. Avec plusieurs années d'expérience dans la conception 3D et le développement web, j'apporte une approche créative et technique à chaque projet.
      </p>
      <p style={prestationStyles.paragraph}>
        Ma spécialité est l'intégration de modèles 3D interactifs dans des interfaces web modernes, offrant ainsi des expériences utilisateur uniques et mémorables.
      </p>
    </div>
    
    <div style={{ marginBottom: '40px' }}>
      <h2 style={prestationStyles.sectionTitle}>
        VISION DE L'ENTREPRISE
      </h2>
      <p style={prestationStyles.paragraph}>
        Notre mission est de repousser les limites de l'interaction numérique en créant des expériences web qui transcendent les attentes traditionnelles. Nous croyons que le futur du web est spatial et interactif.
      </p>
      <p style={prestationStyles.paragraph}>
        Nous visons à fusionner l'art du design 3D avec l'ingénierie web pour offrir des solutions créatives qui captent l'attention et engagent les utilisateurs d'une manière nouvelle et significative.
      </p>
    </div>
    
    <div>
      <h2 style={prestationStyles.sectionTitle}>
        COMPÉTENCES
      </h2>
      <div style={prestationStyles.cardsContainer}>
        <SkillCard 
          title="Design 3D" 
          description="Spline, Blender, Cinema 4D"
        />
        <SkillCard 
          title="Développement Web" 
          description="React, Three.js, WebGL"
        />
        <SkillCard 
          title="Design UX/UI" 
          description="Figma, Adobe XD, Prototypage"
        />
      </div>
    </div>
  </>
));

/**
 * Overlay À Propos
 */
const AboutOverlay = ({ onClose }) => {
  return (
    <BaseOverlay 
      title="À PROPOS" 
      onClose={onClose} 
      showCloseButton={false}
      animationDelay={200}
    >
      <AboutContent />
    </BaseOverlay>
  );
};

AboutOverlay.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default memo(AboutOverlay);