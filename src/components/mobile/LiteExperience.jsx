/**
 * Version allégée de l'expérience pour appareils à faible performance
 * Alternative légère à la scène 3D complète
 */
import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/**
 * Expérience simplifiée pour les appareils à faible performance
 */
const LiteExperience = ({ onNavigate, onEnterFullExperience }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  
  // Styles pour l'expérience allégée
  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      overflowY: 'auto',
      overflowX: 'hidden'
    },
    header: {
      width: '100%',
      padding: '20px',
      textAlign: 'center',
      background: 'linear-gradient(180deg, #2A9D8F 0%, #45b4a6 100%)',
      color: 'white',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    },
    title: {
      fontSize: '24px',
      fontWeight: '400',
      marginBottom: '10px',
      fontFamily: '"Reem Kufi", sans-serif'
    },
    subtitle: {
      fontSize: '14px',
      fontWeight: '300',
      opacity: 0.9
    },
    content: {
      width: '100%',
      maxWidth: '800px',
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    mainMenu: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '20px'
    },
    menuButton: {
      padding: '15px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: 'none',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '16px',
      fontWeight: '500',
      color: '#2A9D8F',
      cursor: 'pointer'
    },
    menuIcon: {
      fontSize: '20px'
    },
    sectionContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      animation: 'fadeIn 0.3s ease-out'
    },
    sectionTitle: {
      fontSize: '18px',
      color: '#2A9D8F',
      marginBottom: '15px',
      borderBottom: '1px solid #eee',
      paddingBottom: '10px'
    },
    sectionText: {
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#333',
      marginBottom: '15px'
    },
    navButtons: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '20px'
    },
    navButtonsItem: {
      flex: 1,
      textAlign: 'center',
      padding: '10px 0',
      borderTop: '1px solid #eee',
      fontSize: '14px',
      cursor: 'pointer',
      color: '#666',
      transition: 'color 0.2s ease'
    },
    footer: {
      width: '100%',
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderTop: '1px solid #ddd',
      textAlign: 'center'
    },
    fullExperienceButton: {
      backgroundColor: '#C49A6C',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      marginTop: '20px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      marginBottom: '15px'
    },
    cardTitle: {
      fontSize: '16px',
      color: '#2A9D8F',
      marginBottom: '8px',
      fontWeight: '500'
    },
    cardText: {
      fontSize: '14px',
      color: '#333',
      lineHeight: '1.4'
    },
    contactButton: {
      backgroundColor: '#2A9D8F',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '12px',
      width: '100%',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      marginTop: '15px'
    }
  };
  
  // Sections de contenu pour la version allégée
  const sections = {
    about: {
      title: "À Propos",
      content: (
        <>
          <p style={styles.sectionText}>
            Passionné(e) de design et développement interactif, je crée des expériences numériques immersives qui allient esthétique et fonctionnalité. Avec plusieurs années d'expérience dans la conception 3D et le développement web, j'apporte une approche créative et technique à chaque projet.
          </p>
          <p style={styles.sectionText}>
            Ma spécialité est l'intégration de modèles 3D interactifs dans des interfaces web modernes, offrant ainsi des expériences utilisateur uniques et mémorables.
          </p>
          <h3 style={{...styles.cardTitle, marginTop: '20px'}}>Compétences</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Design 3D</h4>
              <p style={styles.cardText}>Spline, Blender, Cinema 4D</p>
            </div>
            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Développement Web</h4>
              <p style={styles.cardText}>React, Three.js, WebGL</p>
            </div>
            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Design UX/UI</h4>
              <p style={styles.cardText}>Figma, Adobe XD, Prototypage</p>
            </div>
          </div>
        </>
      )
    },
    prestations: {
      title: "Prestations",
      content: (
        <>
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Data Visualization</h4>
            <p style={styles.cardText}>
              Transformation de données complexes en visualisations interactives et intelligibles.
            </p>
          </div>
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Optimisation SEO</h4>
            <p style={styles.cardText}>
              Amélioration de la visibilité de votre site dans les moteurs de recherche.
            </p>
          </div>
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Modélisation 3D</h4>
            <p style={styles.cardText}>
              Création de modèles 3D détaillés et réalistes pour divers usages.
            </p>
          </div>
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Développement d'Applications</h4>
            <p style={styles.cardText}>
              Conception et développement d'applications web et mobiles sur mesure.
            </p>
          </div>
          <button 
            style={styles.contactButton}
            onClick={() => navigate('/contact')}
          >
            Demander un devis
          </button>
        </>
      )
    },
    portfolio: {
      title: "Portfolio",
      content: (
        <>
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Data Visualization</h4>
            <p style={styles.cardText}>
              Tableaux de bord interactifs, graphiques dynamiques et visualisations personnalisées.
            </p>
          </div>
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>3D</h4>
            <p style={styles.cardText}>
              Modèles 3D, environnements immersifs et animations pour divers secteurs.
            </p>
          </div>
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Sites Web</h4>
            <p style={styles.cardText}>
              Sites web modernes, responsives et optimisés pour les moteurs de recherche.
            </p>
          </div>
        </>
      )
    }
  };
  
  // Gestion de la navigation entre les sections
  const handleSectionChange = useCallback((section) => {
    setActiveSection(section === activeSection ? null : section);
  }, [activeSection]);
  
  // Exécuter la fonction de navigation si fournie
  const handleNavigate = useCallback((section) => {
    if (onNavigate) {
      onNavigate(section);
    }
  }, [onNavigate]);
  
  return (
    <div style={styles.container}>
      {/* En-tête */}
      <header style={styles.header}>
        <h1 style={styles.title}>Cabinet Virtuel</h1>
        <p style={styles.subtitle}>Version simplifiée pour appareils mobiles</p>
      </header>
      
      {/* Contenu principal */}
      <main style={styles.content}>
        {/* Menu principal */}
        <div style={styles.mainMenu}>
          {Object.entries(sections).map(([key, section]) => (
            <button 
              key={key}
              style={styles.menuButton}
              onClick={() => handleSectionChange(key)}
            >
              {section.title}
              <span style={styles.menuIcon}>
                {activeSection === key ? '▲' : '▼'}
              </span>
            </button>
          ))}
          <button 
            style={styles.menuButton}
            onClick={() => navigate('/contact')}
          >
            Contact
            <span style={styles.menuIcon}>→</span>
          </button>
        </div>
        
        {/* Affichage du contenu de la section active */}
        {activeSection && (
          <div style={styles.sectionContent}>
            <h2 style={styles.sectionTitle}>{sections[activeSection].title}</h2>
            {sections[activeSection].content}
            <div style={styles.navButtons}>
              <span 
                style={styles.navButtonsItem}
                onClick={() => handleNavigate(activeSection)}
              >
                Voir en 3D
              </span>
            </div>
          </div>
        )}
        
        {/* Bouton pour accéder à l'expérience complète */}
        <button 
  style={styles.fullExperienceButton}
  onClick={onEnterFullExperience}
  onTouchStart={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onEnterFullExperience();
  }}
>
  Accéder à l'expérience 3D complète
</button>
      </main>
      
      {/* Pied de page */}
      <footer style={styles.footer}>
        <p style={{ fontSize: '12px', color: '#888' }}>
          © 2025 Studio Ti Morne - Tous droits réservés
        </p>
      </footer>
    </div>
  );
};

LiteExperience.propTypes = {
  onNavigate: PropTypes.func,
  onEnterFullExperience: PropTypes.func.isRequired
};

export default memo(LiteExperience);