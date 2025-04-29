// DatavizEoliennesPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DatavizEoliennesPage() {
  const navigate = useNavigate();
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <iframe
        src="https://my.spline.design/untitled-kh2tSyd7aYNr8iEemOS4sS7m/"
        frameBorder="0"
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        title="Visualisation des éoliennes"
        allowFullScreen
      />
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
          cursor: 'pointer'
        }}
      >
        Retour
      </button>
    </div>
  );
}

