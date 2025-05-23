// scenes/TimorneConceptionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDeviceDetection from '../hooks/useDeviceDetection';

export default function TimorneConceptionPage() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [isLoading, setIsLoading] = useState(true);
  
  // Simuler un chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'white',
      color: '#333',
      fontFamily: '"Reem Kufi", "Open Sans", sans-serif',
      overflow: 'auto',
      position: 'relative'
    }}>
      {/* Écran de chargement */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1500
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            position: 'relative',
            marginBottom: '20px'
          }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: '4px solid transparent',
              borderTopColor: '#2A9D8F',
              borderRadius: '50%',
              animation: 'spin 1.2s linear infinite'
            }}></div>
          </div>
          <h2 style={{ color: '#2A9D8F', marginBottom: '10px', fontWeight: 400 }}>
            Chargement
          </h2>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    
      {/* Bouton de retour */}
      <button 
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: 'transparent',
          color: '#2A9D8F',
          border: '1px solid #2A9D8F',
          borderRadius: '30px',
          padding: '8px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: '18px' }}>←</span> Retour au studio
      </button>
      
      {/* Demi-cercle avec titre en haut de page */}
      <div style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '40px',
        marginBottom: '30px'
      }}>
        <div style={{
          width: isMobile ? '220px' : '260px',
          height: isMobile ? '110px' : '130px',
          background: 'white',
          borderBottomLeftRadius: '260px',
          borderBottomRightRadius: '260px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: '10px',
          border: '1px solid rgba(42, 157, 143, 0.1)',
          borderTop: 'none'
        }}>
          <h1 style={{
            color: '#2A9D8F',
            fontSize: isMobile ? '1.8rem' : '2.2rem',
            fontWeight: '500',
            margin: 0,
            textTransform: 'uppercase'
          }}>
            TI MORNE
          </h1>
        </div>
      </div>
      
      {/* Contenu principal en une colonne */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        padding: isMobile ? '0 20px 60px' : '0 60px 80px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Sous-titre */}
        <h2 style={{
          color: '#C8963E',
          fontSize: '1.8rem',
          marginBottom: '30px',
          fontWeight: '400',
          textAlign: 'center'
        }}>
          CONCEPTION
        </h2>
               
        {/* Premier paragraphe */}
        <div style={{
          marginBottom: '40px',
          width: '100%'
        }}>
          <p style={{
            fontSize: '1.1rem',
            lineHeight: '1.7',
            color: '#333',
            marginBottom: '20px',
            textAlign: 'justify'
          }}>
            Studio Ti Morne est né de la vision de créer un espace numérique immersif qui fusionne technologie de pointe 
            et esthétique caribéenne. Inspiré par les paysages naturels et la culture des Antilles, 
            ce projet vise à repousser les limites de l'interaction web traditionnelle.
          </p>
        </div>
        
        {/* Titre de section */}
        <h2 style={{
          color: '#C8963E',
          fontSize: '1.8rem',
          marginBottom: '20px',
          fontWeight: '400',
          alignSelf: 'flex-start'
        }}>
          VISION DU PROJET
        </h2>
        
        {/* Description du projet */}
        <div style={{
          marginBottom: '40px',
          width: '100%'
        }}>
          <p style={{
            fontSize: '1.1rem',
            lineHeight: '1.7',
            color: '#333',
            marginBottom: '20px',
            textAlign: 'justify'
          }}>
            Notre ambition est de démontrer que les interfaces web peuvent transcender le simple affichage 
            d'informations pour devenir des expériences sensorielles complètes, engageant l'utilisateur 
            dans une exploration active plutôt qu'une consommation passive. Le Studio Ti Morne combine 
            l'innovation technologique et l'identité culturelle antillaise dans une expérience immersive unique.
          </p>
        </div>
        
        {/* Caractéristiques sous forme de liste */}
        <div style={{
          marginBottom: '40px',
          alignSelf: 'flex-start',
          width: '100%'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            marginBottom: '20px',
            color: '#2A9D8F',
            fontWeight: '400',
            textAlign: 'left'
          }}>
            TECHNOLOGIES
          </h3>
          
          <div style={{
            columnCount: isMobile ? '1' : '2',
            columnGap: '30px',
            textAlign: 'left'
          }}>
            <ul style={{
              paddingLeft: '20px',
              margin: 0
            }}>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Modélisation 3D avec Spline
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Architecture React performante
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Navigation spatiale intuitive
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Optimisation multi-appareils
              </li>
            </ul>
            <ul style={{
              paddingLeft: '20px',
              margin: 0
            }}>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Design UX/UI immersif
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Préchargement des ressources
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Controls tactiles avancés
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Adaptation qualité dynamique
              </li>
            </ul>
          </div>
        </div>
        
        {/* Défis et solutions */}
        <div style={{
          marginBottom: '40px',
          width: '100%'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            marginBottom: '20px',
            color: '#2A9D8F',
            fontWeight: '400',
            textAlign: 'left'
          }}>
            DÉFIS RELEVÉS
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{
              background: 'rgba(42, 157, 143, 0.05)',
              padding: '15px 20px',
              borderRadius: '10px',
              borderLeft: '3px solid #2A9D8F'
            }}>
              <p style={{ 
                margin: 0,
                color: '#333',
                fontSize: '1.05rem',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#2A9D8F' }}>Performance mobile</strong> — 
                Système d'adaptation automatique de la qualité visuelle et optimisation 
                des contrôles tactiles pour une navigation fluide sur tous appareils.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(42, 157, 143, 0.05)',
              padding: '15px 20px',
              borderRadius: '10px',
              borderLeft: '3px solid #2A9D8F'
            }}>
              <p style={{ 
                margin: 0,
                color: '#333',
                fontSize: '1.05rem',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#2A9D8F' }}>Navigation intuitive</strong> — 
                Création d'un système hybride avec des contrôles de mouvement fluides 
                et des points d'intérêt interactifs pour une expérience intuitive.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(42, 157, 143, 0.05)',
              padding: '15px 20px',
              borderRadius: '10px',
              borderLeft: '3px solid #2A9D8F'
            }}>
              <p style={{ 
                margin: 0,
                color: '#333',
                fontSize: '1.05rem',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#2A9D8F' }}>Intégration de contenu</strong> — 
                Architecture permettant de charger et d'afficher des visualisations de données 
                complexes sans compromettre l'expérience immersive.
              </p>
            </div>
          </div>
        </div>
        
        {/* Évolutions futures */}
        <div style={{
          marginBottom: '40px',
          width: '100%',
          background: 'rgba(200, 150, 62, 0.05)',
          padding: '20px 25px',
          borderRadius: '15px',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            marginBottom: '15px',
            color: '#C8963E',
            fontWeight: '400'
          }}>
            ÉVOLUTIONS FUTURES
          </h3>
          
          <ul style={{
            paddingLeft: '20px',
            margin: 0
          }}>
            <li style={{ 
              marginBottom: '12px', 
              color: '#333',
              fontSize: '1.05rem',
              lineHeight: '1.5'
            }}>
              Nouvelles visualisations interactives (sargasses, biodiversité marine)
            </li>
            <li style={{ 
              marginBottom: '12px', 
              color: '#333',
              fontSize: '1.05rem',
              lineHeight: '1.5'
            }}>
              Collaboration multi-utilisateurs dans l'espace virtuel
            </li>
            <li style={{ 
              marginBottom: '12px', 
              color: '#333',
              fontSize: '1.05rem',
              lineHeight: '1.5'
            }}>
              Intégration d'éléments de réalité augmentée
            </li>
            <li style={{ 
              color: '#333',
              fontSize: '1.05rem',
              lineHeight: '1.5'
            }}>
              Adaptation pour casques VR et autres dispositifs immersifs
            </li>
          </ul>
          
          <div style={{
            marginTop: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#2A9D8F'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#2A9D8F',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontSize: '1rem', fontWeight: '500' }}>En développement continu</span>
          </div>
        </div>
        
        {/* Footer signature */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          <p>© 2025 Studio Ti Morne - Tous droits réservés</p>
          <p style={{ marginTop: '5px' }}>Conçu avec ♥ en Martinique</p>
        </div>
        
        {/* Style pour les animations */}
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; transform: scale(0.95); }
            50% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0.6; transform: scale(0.95); }
          }
        `}</style>
      </div>
    </div>
  );
}