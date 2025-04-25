// scenes/TimorneConceptionPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TimorneConceptionPage() {
  const navigate = useNavigate();
  
  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: '"Reem Kufi", sans-serif',
      padding: '40px 20px',
      overflowY: 'auto'
    }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: 'rgba(42, 157, 143, 0.8)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          padding: '8px 15px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        ← Retour
      </button>
      
      <div style={{
        maxWidth: '800px',
        margin: '50px auto',
        padding: '20px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '30px',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #2A9D8F, #64dfcb)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          La Conception de Studio Ti Morne
        </h1>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#2A9D8F', marginBottom: '15px', fontSize: '1.8rem' }}>
            Vision & Inspiration
          </h2>
          <p style={{ lineHeight: '1.7', marginBottom: '15px', fontSize: '1.1rem' }}>
            Studio Ti Morne est né de la vision de créer un espace numérique immersif qui fusionne technologie de pointe et esthétique caribéenne. Inspiré par les paysages naturels et la culture des Antilles, ce projet visait à repousser les limites de l'interaction web traditionnelle.
          </p>
          <p style={{ lineHeight: '1.7', fontSize: '1.1rem' }}>
            Notre ambition était de démontrer que les interfaces web peuvent transcender le simple affichage d'informations pour devenir des expériences sensorielles complètes, engageant l'utilisateur dans une exploration active plutôt qu'une consommation passive.
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(42, 157, 143, 0.1)',
            padding: '20px',
            borderRadius: '10px',
            borderLeft: '3px solid #2A9D8F'
          }}>
            <h3 style={{ marginBottom: '10px', color: '#2A9D8F' }}>Technologie 3D</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
              La conception du studio virtuel utilise Spline pour la modélisation 3D et React pour une interface réactive et fluide. Cette combinaison permet une expérience immersive tout en conservant des performances optimales.
            </p>
          </div>
          
          <div style={{
            background: 'rgba(42, 157, 143, 0.1)',
            padding: '20px',
            borderRadius: '10px',
            borderLeft: '3px solid #2A9D8F'
          }}>
            <h3 style={{ marginBottom: '10px', color: '#2A9D8F' }}>Design UX/UI</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
              L'interface utilisateur a été conçue pour être intuitive et non intrusive, permettant une découverte progressive des fonctionnalités. Les animations fluides et les transitions guidées améliorent l'expérience utilisateur.
            </p>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#2A9D8F', marginBottom: '15px', fontSize: '1.8rem' }}>
            Architecture Technique
          </h2>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.7' }}>
            <li style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#64dfcb' }}>Frontend:</strong> Application React avec React Router pour la navigation entre les différentes scènes
            </li>
            <li style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#64dfcb' }}>Modélisation 3D:</strong> Environnements créés avec Spline et intégrés via le composant SplineScene personnalisé
            </li>
            <li style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#64dfcb' }}>Interactions:</strong> Système avancé de détection d'objets et de gestion des événements avec optimisations pour mobile et desktop
            </li>
            <li>
              <strong style={{ color: '#64dfcb' }}>Optimisation:</strong> Chargement progressif, préchargement des ressources et adaptation dynamique de la qualité selon les capacités de l'appareil
            </li>
          </ul>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#2A9D8F', marginBottom: '15px', fontSize: '1.8rem' }}>
            Défis et Solutions
          </h2>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#64dfcb', marginBottom: '10px' }}>Performance sur Mobile</h3>
            <p style={{ lineHeight: '1.7' }}>
              L'un des plus grands défis était d'offrir une expérience 3D fluide sur des appareils mobiles. Nous avons implémenté un système d'adaptation automatique de la qualité visuelle et optimisé les contrôles tactiles pour une navigation intuitive.
            </p>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#64dfcb', marginBottom: '10px' }}>Navigation Intuitive</h3>
            <p style={{ lineHeight: '1.7' }}>
              Créer un système de navigation spatial qui reste intuitif tout en étant innovant nécessitait un équilibre délicat. Nous avons développé un système hybride avec des contrôles de mouvement fluides et des points d'intérêt interactifs.
            </p>
          </div>
          <div>
            <h3 style={{ color: '#64dfcb', marginBottom: '10px' }}>Intégration de Contenu Dynamique</h3>
            <p style={{ lineHeight: '1.7' }}>
              L'intégration de visualisations de données dans l'environnement 3D a nécessité une architecture permettant de charger et d'afficher des données complexes sans compromettre l'expérience immersive.
            </p>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '40px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#2A9D8F', marginBottom: '15px', fontSize: '1.8rem' }}>
            Évolutions Futures
          </h2>
          <p style={{ lineHeight: '1.7', marginBottom: '20px' }}>
            Le Studio Ti Morne est en constante évolution. Parmi les développements futurs prévus:
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.7' }}>
            <li style={{ marginBottom: '10px' }}>
              Nouvelles visualisations interactives (sargasses, biodiversité marine)
            </li>
            <li style={{ marginBottom: '10px' }}>
              Collaboration multi-utilisateurs dans l'espace virtuel
            </li>
            <li style={{ marginBottom: '10px' }}>
              Intégration d'éléments de réalité augmentée pour une expérience hybride
            </li>
            <li>
              Adaptation pour casques VR et autres dispositifs immersifs
            </li>
          </ul>
        </div>
        
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '15px',
          borderTop: '1px solid rgba(42, 157, 143, 0.3)',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.9rem'
        }}>
          <p>© 2025 Studio Ti Morne - Tous droits réservés</p>
          <p style={{ marginTop: '5px' }}>Conçu avec ♥ en Martinique</p>
        </div>
      </div>
    </div>
  );
}