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
 * Contenu pour Data Visualization
 */
export const DataVizContent = memo(() => (
  <>
    <ServiceSection
      title="Data Visualization"
      description={[
        "Transformez vos données en insights visuels percutants. Notre expertise en data visualization permet de rendre complexes ensembles de données accessibles et compréhensibles.",
        "Nous utilisons des technologies de pointe pour créer des tableaux de bord interactifs, des graphiques dynamiques et des visualisations personnalisées qui racontent l'histoire cachée dans vos données."
      ]}
    />
    
    <ServiceSection
      title="Nos services de visualisation"
      services={[
        {
          title: "Tableaux de bord",
          description: "Création de tableaux de bord interactifs pour surveiller vos KPIs en temps réel"
        },
        {
          title: "Rapports analytiques",
          description: "Transformation de données brutes en rapports visuels explicites"
        },
        {
          title: "Cartographie",
          description: "Visualisation géospatiale des données pour des insights territoriaux"
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
      title="Optimisation pour les moteurs de recherche"
      description={[
        "Améliorez votre visibilité en ligne grâce à nos services d'optimisation SEO de pointe. Nous utilisons les meilleures pratiques pour propulser votre site dans les premiers résultats des moteurs de recherche.",
        "Notre approche combine des techniques on-page, off-page et techniques pour une stratégie SEO complète et performante qui s'adapte aux évolutions des algorithmes."
      ]}
    />
    
    <ServiceSection
      title="Nos services SEO"
      services={[
        {
          title: "Audit SEO",
          description: "Analyse complète de votre site et identification des opportunités d'amélioration"
        },
        {
          title: "Optimisation on-page",
          description: "Amélioration du contenu, de la structure et des métadonnées du site"
        },
        {
          title: "SEO technique",
          description: "Optimisation des aspects techniques pour améliorer l'indexation et le crawl"
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
      title="Modélisation 3D"
      description={[
        "Donnez vie à vos idées grâce à notre expertise en modélisation 3D. Nous créons des modèles 3D détaillés et réalistes pour divers usages : visualisation produit, prototypage, expériences web interactives, et bien plus.",
        "Notre équipe maîtrise les outils et techniques les plus avancés pour produire des modèles 3D optimisés et de haute qualité adaptés à vos besoins spécifiques."
      ]}
    />
    
    <ServiceSection
      title="Nos services 3D"
      services={[
        {
          title: "Modélisation produit",
          description: "Création de modèles 3D réalistes pour la présentation de produits"
        },
        {
          title: "Environnements 3D",
          description: "Conception d'espaces et environnements 3D immersifs"
        },
        {
          title: "Animation 3D",
          description: "Animation de modèles pour vidéos promotionnelles et expériences interactives"
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
      title="Développement d'applications"
      description={[
        "Concrétisez vos idées avec nos services de développement d'applications sur mesure. Nous concevons et développons des applications web et mobiles innovantes qui répondent précisément à vos besoins.",
        "Notre équipe de développeurs expérimentés utilise les technologies les plus récentes pour créer des applications performantes, évolutives et conviviales qui se démarquent sur le marché."
      ]}
    />
    
    <ServiceSection
      title="Nos services de développement"
      services={[
        {
          title: "Applications web",
          description: "Développement d'applications web progressives et réactives"
        },
        {
          title: "Applications mobiles",
          description: "Création d'apps natives et hybrides pour iOS et Android"
        },
        {
          title: "Interfaces 3D",
          description: "Intégration d'éléments 3D interactifs dans vos applications"
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