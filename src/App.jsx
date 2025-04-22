/**
 * Composant principal de l'application
 * Configure les routes et le layout global
 */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CabinInterior from './scenes/CabinInterior';
import Contact from './scenes/Contact';
import './App.css';
import './styles/mobile.css';

/**
 * Composant principal de l'application
 */
function App() {
  // État de chargement
  const [isLoading, setIsLoading] = useState(true);
  
  // Simuler un temps de chargement pour assurer que tous les assets sont prêts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Afficher une page de chargement pendant le chargement des assets
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1>Chargement...</h1>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<CabinInterior />} />
          <Route path="/terrasse" element={<div>Page Terrasse (à implémenter)</div>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<div>404 - Page non trouvée</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;