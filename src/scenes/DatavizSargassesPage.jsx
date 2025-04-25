// scenes/DatavizSargassesPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DatavizSargassesPage() {
  const navigate = useNavigate();
  
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: '"Reem Kufi", sans-serif',
      padding: '20px'
    }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
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
      
      <img 
        src="/images/sargassum-preview.png" 
        alt="Sargasses - Aperçu" 
        style={{
          width: '300px',
          height: '300px',
          objectFit: 'cover',
          borderRadius: '10px',
          marginBottom: '30px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
        onError={(e) => {
          // Fallback en cas d'image manquante
          e.target.src = 'https://via.placeholder.com/300?text=Sargasses';
        }}
      />
      
      <h1 style={{
        fontSize: '2.5rem',
        marginBottom: '15px',
        textAlign: 'center',
        background: 'linear-gradient(90deg, #2A9D8F, #64dfcb)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Visualisation Sargasses
      </h1>
      
      <div style={{
        fontSize: '1.2rem',
        maxWidth: '600px',
        textAlign: 'center',
        lineHeight: '1.6',
        marginBottom: '30px'
      }}>
        <p>Notre visualisation interactive des sargasses est en cours de développement.</p>
        <p style={{ marginTop: '15px' }}>
          Bientôt, vous pourrez explorer en 3D la propagation des sargasses dans les Caraïbes
          et comprendre leur impact sur l'écosystème marin.
        </p>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '20px',
        marginTop: '20px'
      }}>
        <div style={{
          background: 'rgba(42, 157, 143, 0.1)',
          padding: '20px',
          borderRadius: '10px',
          borderLeft: '3px solid #2A9D8F',
          maxWidth: '260px'
        }}>
          <h3 style={{ marginBottom: '10px', color: '#2A9D8F' }}>Ce que vous découvrirez</h3>
          <ul style={{ paddingLeft: '20px', color: 'rgba(255, 255, 255, 0.8)' }}>
            <li>Modélisation 3D des courants marins</li>
            <li>Données satellitaires en temps réel</li>
            <li>Prévisions de propagation</li>
            <li>Impact environnemental</li>
          </ul>
        </div>
        
        <div style={{
          background: 'rgba(42, 157, 143, 0.1)',
          padding: '20px',
          borderRadius: '10px',
          borderLeft: '3px solid #2A9D8F',
          maxWidth: '260px'
        }}>
          <h3 style={{ marginBottom: '10px', color: '#2A9D8F' }}>Technologies utilisées</h3>
          <ul style={{ paddingLeft: '20px', color: 'rgba(255, 255, 255, 0.8)' }}>
            <li>Modélisation 3D avec Spline</li>
            <li>Intégration de données réelles</li>
            <li>Animation fluide des particules</li>
            <li>Interface interactive React</li>
          </ul>
        </div>
      </div>
      
      <div style={{
        marginTop: '40px',
        padding: '15px 25px',
        background: 'rgba(42, 157, 143, 0.2)',
        borderRadius: '50px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#2A9D8F',
          animation: 'pulse 2s infinite'
        }}></div>
        <span>En développement - Disponible prochainement</span>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}