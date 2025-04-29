/**
 * Contenu des différentes prestations
 * Composants optimisés pour afficher les différentes offres de services
 */
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { prestationStyles } from '../../constants/styles';

/**
 * Composant de carte réutilisable avec effet de survol
 */
const ServiceCard = memo(({ title, description }) => {
  return (
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
  );
});

ServiceCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};

/**
 * Composant de section réutilisable
 */
const ServiceSection = memo(({ title, description, services }) => {
  return (
    <div style={prestationStyles.section}>
      <h2 style={prestationStyles.sectionTitle}>
        {title}
      </h2>
      {Array.isArray(description) ? (
        description.map((paragraph, index) => (
          <p key={index} style={prestationStyles.paragraph}>
            {paragraph}
          </p>
        ))
      ) : (
        <p style={prestationStyles.paragraph}>
          {description}
        </p>
      )}
      
      {services && (
        <div style={prestationStyles.cardsContainer}>
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              title={service.title} 
              description={service.description}
            />
          ))}
        </div>
      )}
    </div>
  );
});

ServiceSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  services: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired
    })
  )
};

/**
 * Contenu pour Data Visualisation
 */
export const DataVizContent = memo(() => (
  <>
    <ServiceSection
      title="Data Visualisation Immersive"
      description={[
        "Transformez vos données territoriales et environnementales en insights visuels percutants et accessibles. Notre expertise en data visualisation immersive permet de rendre les dynamiques de transition durable visibles et compréhensibles pour tous les publics.",
        "En conjuguant sensibilité artistique et rigueur scientifique, nous créons des infographies 3D interactives et des représentations visuelles dynamiques qui racontent l'histoire cachée dans vos données, facilitant ainsi la prise de décision et l'engagement citoyen."
      ]}
    />
    
    <ServiceSection
      title="Nos services de visualisation"
      services={[
        {
          title: "Tableaux de bord interactifs",
          description: "Outils de monitoring environnemental en temps réel pour suivre les indicateurs clés de durabilité territoriale"
        },
        {
          title: "Cartographie dynamique",
          description: "Visualisation géospatiale des données pour une compréhension intuitive des dynamiques territoriales"
        },
        {
          title: "Narration de données",
          description: "Transformation des données brutes en récits visuels engageants pour sensibiliser le public aux enjeux locaux"
        }
      ]}
    />
  </>
));

/**
 * Contenu pour Search Engine Optimization
 */
export const SearchEngineContent = memo(() => (
  <>
    <ServiceSection
     description={[
      "Concrétisez vos projets territoriaux avec nos services de développement d'expériences immersives sur mesure. Nous concevons des sites expérientiels et applications qui favorisent l'exploration active, la compréhension sensible et la co-construction des espaces.",
      "Notre équipe utilise les technologies les plus récentes pour créer des parcours virtuels interactifs qui transforment la façon dont les citoyens, décideurs et parties prenantes interagissent avec le territoire et ses enjeux de développement durable."
    ]}
  />
  
  <ServiceSection
    title="Nos solutions immersives"
    services={[
      {
        title: "Stratégie de contenu territorial",
        description: "Développement de récits numériques autour de vos projets d'aménagement et initiatives durables"
      },
      {
        title: "Applications de sensibilisation",
        description: "Expériences mobiles immersives pour découvrir les enjeux environnementaux locaux"
      },
      {
        title: "Scénario digitaux",
        description: "Répliques virtuelles interactives de territoires permettant simulation et planification durable"
      }
      ]}
    />
  </>
));

/**
 * Contenu pour 3D Modeling
 */
export const Model3DContent = memo(() => (
  <>
    <ServiceSection
      title="Modélisation et projection 3D"
      description={[
        "Donnez vie aux territoires de demain grâce à notre expertise en modélisation 3D. Nous créons des visualisations détaillées et réalistes pour concevoir, imaginer ou réhabiliter des espaces et projets d'aménagement innovants.",
        "Notre équipe combine connaissances en aménagement territorial et maîtrise des outils 3D les plus avancés pour produire des projections spatiales qui facilitent la compréhension des enjeux, la participation citoyenne et la prise de décision éclairée."
      ]}
    />
    
    <ServiceSection
      title="Nos services 3D"
      services={[
        {
          title: "Visualisation d'aménagements",
          description: "Modélisation 3D réaliste pour prévisualiser l'impact de projets d'aménagement durable"
        },
        {
          title: "Simulations environnementales",
          description: "Modélisation des dynamiques naturelles et projection de scénarios d'évolution territoriale"
        },
        {
          title: "Maquettes interactives",
          description: "Création d'environnements 3D manipulables pour faciliter la concertation et co-construction"
        }
      ]}
    />
  </>
));

/**
 * Contenu pour Application Development
 */
export const AppDevContent = memo(() => (
  <>
    <ServiceSection
      title="Sites expérientiels et applications"
      description={[
        "Concrétisez vos projets territoriaux avec nos services de développement d'expériences immersives sur mesure. Nous concevons des sites expérientiels et applications qui favorisent l'exploration active, la compréhension sensible et la co-construction des espaces.",
        "Notre équipe utilise les technologies les plus récentes pour créer des parcours virtuels interactifs qui transforment la façon dont les citoyens, décideurs et parties prenantes interagissent avec le territoire et ses enjeux de développement durable."
      ]}
    />
    
    <ServiceSection
      title="Nos solutions immersives"
      services={[
        {
          title: "Stratégie de contenu territorial",
          description: "Développement de récits numériques autour de vos projets d'aménagement et initiatives durables"
        },
        {
          title: "Applications de sensibilisation",
          description: "Expériences mobiles immersives pour découvrir les enjeux environnementaux locaux"
        },
        {
          title: "Scénario digitaux",
          description: "Répliques virtuelles interactives de territoires permettant simulation et planification durable"
        }
      ]}
    />
  </>
));

// Map des contenus pour accès dynamique
export const PRESTATION_CONTENTS = {
  DataVizContent,
  SearchEngineContent,
  Model3DContent,
  AppDevContent
};

// Fonction utilitaire pour obtenir le contenu par type
export const getPrestationContent = (contentType) => {
  return PRESTATION_CONTENTS[contentType] || null;
};