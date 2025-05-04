// scenes/DatavizSargassesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDeviceDetection from '../hooks/useDeviceDetection';

export default function DatavizSargassesPage() {
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
            SARGASSES
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
          VISUALISATION
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
            Notre visualisation interactive des sargasses permet d'explorer en 3D la propagation de ces algues 
            dans les Caraïbes et de comprendre leur impact sur l'écosystème marin martiniquais.
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
            Cette visualisation réinvente la manière de valoriser le territoire martiniquais 
            en conjuguant innovation technologique, sensibilité environnementale et 
            puissance créative. Notre mission est de rendre visibles les dynamiques écologiques, 
            en les transformant en récits immersifs qui transcendent les attentes traditionnelles.
          </p>
          
          <div style={{
            marginTop: '30px',
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
            <span style={{ fontSize: '1rem', fontWeight: '500' }}>En développement - Bientôt disponible</span>
          </div>
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
            CARACTÉRISTIQUES
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
                Modélisation 3D des courants marins
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Données satellitaires en temps réel
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Prévisions de propagation
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Impact environnemental
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
                Modélisation avec Spline
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Animation fluide des particules
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Interface interactive React
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Comparaison interannuelle
              </li>
            </ul>
          </div>
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