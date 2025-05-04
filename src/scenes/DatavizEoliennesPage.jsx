// DatavizEoliennesPage.jsx - Version simplifiée avec overlay d'orientation
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Spline from '@splinetool/react-spline';
import useDeviceDetection from '../hooks/useDeviceDetection';

/**
 * Composant pour l'overlay de présentation du projet
 */
const ProjectOverlay = ({ onClose, isMobile }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: isMobile ? '100%' : '650px',
          maxHeight: isMobile ? '80vh' : '70vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#555'
          }}
        >
          ×
        </button>
        
        <h1 style={{ color: '#2A9D8F', marginTop: 0 }}>Visualisation des données éoliennes</h1>
        
        <p>
          Cette visualisation interactive présente les données relatives aux parcs éoliens, 
          permettant d'explorer leur distribution, leur production d'énergie et leur impact environnemental.
        </p>
        
        <h2 style={{ color: '#2A9D8F' }}>Comment interagir</h2>
        
        {isMobile ? (
          <div>
            <p><strong>Sur mobile et tablette :</strong></p>
            <ul>
              <li>Pour une meilleure expérience, utilisez votre appareil en mode paysage</li>
              <li>Glissez horizontalement pour déplacer la vue de côté</li>
            </ul>
          </div>
        ) : (
          <div>
            <p><strong>Sur ordinateur :</strong></p>
            <ul>
              <li>Cliquez et faites glisser horizontalement pour déplacer la vue</li>
              <li>Utilisez les flèches directionnelles du clavier pour naviguer</li>
            </ul>
          </div>
        )}
        
        <h2 style={{ color: '#2A9D8F' }}>À propos du projet</h2>
        <p>
          Ce projet utilise des données réelles sur les parcs éoliens pour illustrer 
          leur répartition géographique, leur capacité de production et leur contribution 
          à la réduction des émissions de CO₂. La visualisation 3D permet une compréhension 
          intuitive des données complexes liées à l'énergie éolienne.
        </p>
        
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: '#2A9D8F',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '12px 25px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            Découvrir la visualisation
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant pour l'overlay d'orientation
 */
const OrientationOverlay = ({ onClose }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '90%',
          maxHeight: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div 
          style={{
            fontSize: '40px',
            marginBottom: '20px',
            animation: 'rotate 1.5s ease-in-out infinite'
          }}
        >
          📱↔️
        </div>
        
        <h2 style={{ color: '#2A9D8F', textAlign: 'center', margin: '10px 0' }}>
          Pour une meilleure expérience
        </h2>
        
        <p style={{ textAlign: 'center', margin: '10px 0 20px', fontSize: '16px' }}>
          Tournez votre appareil en mode paysage
        </p>
        
        <button
          onClick={onClose}
          style={{
            background: '#2A9D8F',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Continuer quand même
        </button>
        
        <style>{`
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            15% { transform: rotate(-90deg); }
            85% { transform: rotate(-90deg); }
            100% { transform: rotate(0deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

/**
 * Composant principal pour la page de visualisation des éoliennes
 */
export default function DatavizEoliennesPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useDeviceDetection();
  const [showOverlay, setShowOverlay] = useState(true);
  const [showOrientationOverlay, setShowOrientationOverlay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPortrait, setIsPortrait] = useState(false);
  
  // Référence à l'instance Spline
  const splineRef = useRef(null);
  
  // Vérifier l'orientation de l'écran
  useEffect(() => {
    const checkOrientation = () => {
      if (isMobile || isTablet) {
        const isPortraitMode = window.innerHeight > window.innerWidth;
        setIsPortrait(isPortraitMode);
        
        // Afficher l'overlay d'orientation seulement si:
        // 1. On est en mode portrait
        // 2. L'overlay du projet n'est pas affiché
        // 3. On n'est pas en train de charger
        setShowOrientationOverlay(isPortraitMode && !showOverlay && !isLoading);
      } else {
        setIsPortrait(false);
        setShowOrientationOverlay(false);
      }
    };
    
    // Vérifier l'orientation initiale
    checkOrientation();
    
    // Ajouter un écouteur pour les changements d'orientation
    window.addEventListener('resize', checkOrientation);
    
    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, [isMobile, isTablet, showOverlay, isLoading]);
  
  // Simuler un chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Vérifier si on doit afficher l'overlay d'orientation
      if ((isMobile || isTablet) && isPortrait && !showOverlay) {
        setShowOrientationOverlay(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isMobile, isTablet, isPortrait, showOverlay]);

  /**
   * Fonction appelée lorsque Spline est chargé
   */
  const onSplineLoad = (spline) => {
    console.log('Spline chargé');
    splineRef.current = spline;
    
    // Exposer l'instance pour le debugging
    window.splineInstance = spline;
    
    // Terminer le chargement
    setIsLoading(false);
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Écran de chargement */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#f5f5f5',
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
              borderTopColor: '#2A9D8F',
              borderRadius: '50%',
              animation: 'spin 1.5s linear infinite'
            }}></div>
          </div>
          <h2 style={{ color: '#2A9D8F', marginBottom: '10px' }}>
            Chargement de la visualisation
          </h2>
          <p style={{ color: '#555' }}>
            Préparation des données éoliennes...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Composant Spline */}
      <div style={{ 
        width: '100%', 
        height: '100%'
      }}>
        <Spline
          scene="https://prod.spline.design/ooNVOtiTDHs2dVTp/scene.splinecode"
          onLoad={onSplineLoad}
          style={{ 
            width: '100%', 
            height: '100%',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out'
          }}
        />
      </div>
      
      {/* Bouton de retour */}
      <button 
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: 'white',
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
        <span style={{ fontSize: '16px' }}>←</span> Retour
      </button>
      
      {/* Bouton d'aide */}
      <button 
        onClick={() => setShowOverlay(true)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'white',
          border: 'none',
          borderRadius: '5px',
          padding: '8px 15px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          cursor: 'pointer'
        }}
      >
        Aide
      </button>
      
      {/* Bouton de rotation (apparaît uniquement en mode portrait sur mobile) */}
      {(isMobile || isTablet) && isPortrait && !showOverlay && !showOrientationOverlay && !isLoading && (
        <button 
          onClick={() => setShowOrientationOverlay(true)}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'rgba(42, 157, 143, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}
        >
          📱↔️
        </button>
      )}
      
      {/* Overlay de présentation du projet */}
      {showOverlay && (
        <ProjectOverlay 
          onClose={() => {
            setShowOverlay(false);
            // Vérifier si on doit afficher l'overlay d'orientation après
            if ((isMobile || isTablet) && isPortrait) {
              setShowOrientationOverlay(true);
            }
          }} 
          isMobile={isMobile || isTablet}
        />
      )}
      
      {/* Overlay d'orientation */}
      {showOrientationOverlay && (
        <OrientationOverlay onClose={() => setShowOrientationOverlay(false)} />
      )}
    </div>
  );
}