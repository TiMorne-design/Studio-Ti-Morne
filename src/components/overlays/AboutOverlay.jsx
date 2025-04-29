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
      Graphiste digitale et ingénieure paysagiste, je conjugue expertise en aménagement du territoire et conception visuelle pour créer des expériences numériques immersives. Cette double compétence me permet d'apporter une perspective unique où rigueur scientifique et sensibilité artistique se rencontrent pour valoriser le territoire martiniquais.
      </p>
      <p style={prestationStyles.paragraph}>
        Ma spécialité est la création de solutions qui traduisent des données complexes en expériences visuelles accessibles, engageantes et porteuses de sens. À travers la modélisation 3D, la data visualisation et les interfaces interactives, je développe des outils innovants pour explorer, comprendre et co-imaginer les territoires de demain.
      </p>
    </div>
    
    <div style={{ marginBottom: '40px' }}>
      <h2 style={prestationStyles.sectionTitle}>
        VISION DE L'ENTREPRISE
      </h2>
      <p style={prestationStyles.paragraph}>
        Studio Ti Morne réinvente la manière de valoriser le territoire martiniquais en conjuguant innovation technologique, sensibilité environnementale et puissance créative. Notre mission est de rendre visibles les dynamiques de transition durable, en les transformant en récits immersifs qui transcendent les attentes traditionnelles.
      </p>
      <p style={prestationStyles.paragraph}>
        Nous croyons que le futur de la visualisation territoriale est spatial et interactif. En mobilisant l'intelligence artificielle, la modélisation 3D et la réalité mixte, nous développons des expériences qui favorisent non seulement la compréhension des enjeux environnementaux, mais aussi l'engagement actif dans la construction d'avenirs durables.
      </p>
    </div>
    
    <div>
      <h2 style={prestationStyles.sectionTitle}>
        COMPÉTENCES
      </h2>
      <div style={prestationStyles.cardsContainer}>
        <SkillCard 
          title="Design 3D & Data Viz" 
          description="Spline, Blender, D3.js, Visualisations interactives"
        />
        <SkillCard 
          title="Aménagement Territorial" 
          description="Cartographie, Modélisation environnementale, Projections spatiales"
        />
        <SkillCard 
          title="Développement Web" 
          description="React, Three.js, Interfaces immersives"
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