// scenes/RecifCorallienPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDeviceDetection from '../hooks/useDeviceDetection';

export default function RecifCorallienPage() {
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
      background: 'linear-gradient(180deg, #ffffff, #f0f9ff)',
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
          backgroundColor: 'rgba(240, 249, 255, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1500
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            position: 'relative',
            marginBottom: '20px'
          }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: '4px solid transparent',
              borderTopColor: '#0077B6',
              borderRadius: '50%',
              animation: 'spin 1.2s linear infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              top: '10%',
              left: '10%',
              border: '4px solid transparent',
              borderRightColor: '#2A9D8F',
              borderRadius: '50%',
              animation: 'spin 2s linear infinite reverse'
            }}></div>
          </div>
          <h2 style={{ color: '#0077B6', marginBottom: '10px', fontWeight: 400 }}>
            Plongée en cours...
          </h2>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes wave {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
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
          background: 'rgba(255, 255, 255, 0.8)',
          color: '#0077B6',
          border: '1px solid #0077B6',
          borderRadius: '30px',
          padding: '8px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(5px)'
        }}
      >
        <span style={{ fontSize: '18px' }}>←</span> Retour au studio
      </button>
      
      {/* En-tête avec effet aquatique */}
      <div style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '40px',
        marginBottom: '30px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: isMobile ? '280px' : '340px',
          height: isMobile ? '140px' : '170px',
          background: 'linear-gradient(180deg, rgba(0, 119, 182, 0.2), rgba(0, 180, 216, 0.4))',
          borderBottomLeftRadius: '170px',
          borderBottomRightRadius: '170px',
          boxShadow: '0 4px 20px rgba(0, 119, 182, 0.15)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: '15px',
          border: '1px solid rgba(0, 119, 182, 0.1)',
          borderTop: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Bulles animées */}
          <div style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            bottom: '10px',
            left: '30%',
            animation: 'bubbleRise 8s infinite linear',
            animationDelay: '0s'
          }}></div>
          <div style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            bottom: '10px',
            left: '60%',
            animation: 'bubbleRise 7s infinite linear',
            animationDelay: '1s'
          }}></div>
          <div style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            bottom: '10px',
            left: '45%',
            animation: 'bubbleRise 6s infinite linear',
            animationDelay: '3s'
          }}></div>
          
          <h1 style={{
            color: '#0077B6',
            fontSize: isMobile ? '1.8rem' : '2.2rem',
            fontWeight: '500',
            margin: 0,
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0, 119, 182, 0.2)'
          }}>
            RÉCIF CORALLIEN
          </h1>
          
          <style>{`
            @keyframes bubbleRise {
              0% { transform: translateY(0) translateX(0); opacity: 0; }
              10% { opacity: 0.8; }
              100% { transform: translateY(-120px) translateX(15px); opacity: 0; }
            }
          `}</style>
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
          color: '#00B4D8',
          fontSize: '1.8rem',
          marginBottom: '30px',
          fontWeight: '400',
          textAlign: 'center'
        }}>
          EXPÉRIENCE IMMERSIVE
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
            Notre expérience immersive vous invite à plonger virtuellement dans les récifs coralliens des Caraïbes. 
            Explorez cet écosystème marin fascinant, interagissez avec sa biodiversité et découvrez les enjeux de 
            sa préservation à travers une navigation interactive et pédagogique.
          </p>
          
          <div style={{
            marginTop: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#0077B6'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#0077B6',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontSize: '1rem', fontWeight: '500' }}>En développement - Bientôt disponible</span>
          </div>
        </div>
        
        {/* Titre de section */}
        <h2 style={{
          color: '#00B4D8',
          fontSize: '1.8rem',
          marginBottom: '20px',
          fontWeight: '400',
          alignSelf: 'flex-start'
        }}>
          CONCEPT
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
            Cette exploration virtuelle vous permet de naviguer librement dans un récif corallien recréé avec précision. 
            Chaque élément est interactif - cliquez sur les coraux, poissons et autres créatures marines pour révéler 
            des informations fascinantes sur leur biologie, leur rôle dans l'écosystème et les menaces qu'ils 
            affrontent. L'expérience combine rigueur scientifique et immersion sensorielle pour sensibiliser 
            à la fragilité et à l'importance de ces écosystèmes.
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
            color: '#0077B6',
            fontWeight: '400',
            textAlign: 'left'
          }}>
            FONCTIONNALITÉS
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
                Navigation libre à 360°
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Interactions avec plus de 50 espèces
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Cycles jour/nuit avec faune changeante
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Fiches descriptives scientifiques
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
                Animations comportementales réalistes
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Sons et ambiances sous-marines
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Simulation d'écosystème dynamique
              </li>
              <li style={{ 
                marginBottom: '15px', 
                color: '#333',
                fontSize: '1.05rem'
              }}>
                Scénarios de changement climatique
              </li>
            </ul>
          </div>
        </div>
        
        {/* Modes d'exploration */}
        <div style={{
          marginBottom: '40px',
          width: '100%'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            marginBottom: '20px',
            color: '#0077B6',
            fontWeight: '400',
            textAlign: 'left'
          }}>
            MODES D'EXPLORATION
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{
              background: 'rgba(0, 119, 182, 0.05)',
              padding: '15px 20px',
              borderRadius: '10px',
              borderLeft: '3px solid #0077B6'
            }}>
              <p style={{ 
                margin: 0,
                color: '#333',
                fontSize: '1.05rem',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#0077B6' }}>Mode Découverte</strong> — 
                Exploration libre du récif sans contraintes, avec possibilité de s'approcher 
                et d'interagir avec toutes les espèces. Idéal pour une première visite.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(0, 119, 182, 0.05)',
              padding: '15px 20px',
              borderRadius: '10px',
              borderLeft: '3px solid #0077B6'
            }}>
              <p style={{ 
                margin: 0,
                color: '#333',
                fontSize: '1.05rem',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#0077B6' }}>Mode Pédagogique</strong> — 
                Parcours guidé avec des points d'intérêt préétablis et des explications 
                détaillées sur la biologie marine et l'écologie des récifs.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(0, 119, 182, 0.05)',
              padding: '15px 20px',
              borderRadius: '10px',
              borderLeft: '3px solid #0077B6'
            }}>
              <p style={{ 
                margin: 0,
                color: '#333',
                fontSize: '1.05rem',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#0077B6' }}>Mode Conservation</strong> — 
                Simulation interactive des menaces pesant sur les récifs et des solutions 
                de préservation, avec scénarios d'évolution selon différentes interventions humaines.
              </p>
            </div>
          </div>
        </div>
        
        {/* Section technologie */}
        <div style={{
          marginBottom: '40px',
          width: '100%',
          background: 'rgba(0, 180, 216, 0.05)',
          padding: '20px 25px',
          borderRadius: '15px',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            marginBottom: '15px',
            color: '#00B4D8',
            fontWeight: '400'
          }}>
            TECHNOLOGIES
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
              Modélisation 3D haute-fidélité avec Spline et Blender
            </li>
            <li style={{ 
              marginBottom: '12px', 
              color: '#333',
              fontSize: '1.05rem',
              lineHeight: '1.5'
            }}>
              Intelligence artificielle pour les comportements des espèces
            </li>
            <li style={{ 
              marginBottom: '12px', 
              color: '#333',
              fontSize: '1.05rem',
              lineHeight: '1.5'
            }}>
              Simulation physique des courants et de la lumière sous-marine
            </li>
            <li style={{ 
              color: '#333',
              fontSize: '1.05rem',
              lineHeight: '1.5'
            }}>
              Base de données scientifique validée par des biologistes marins
            </li>
          </ul>
        </div>
        
        {/* Zone de démo vidéo ou aperçu */}
        <div style={{
          width: '100%',
          marginBottom: '50px',
          background: 'linear-gradient(180deg, rgba(0, 119, 182, 0.1), rgba(0, 180, 216, 0.2))',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          aspectRatio: '16/9',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0077B6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          <p style={{
            color: '#0077B6',
            fontSize: '1.2rem',
            marginTop: '15px',
            fontWeight: '500'
          }}>
            Aperçu vidéo bientôt disponible
          </p>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            background: 'linear-gradient(0deg, rgba(0, 119, 182, 0.2), transparent)',
            zIndex: 1
          }}></div>
        </div>
        
        {/* Footer signature */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          <p>© 2025 Studio Ti Morne - Tous droits réservés</p>
          <p style={{ marginTop: '5px' }}>Un voyage virtuel dans les fonds marins caribéens</p>
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