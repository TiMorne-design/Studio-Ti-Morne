// App.jsx - Version simplifiée
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/ui/LoadingScreen';
import EntryExperience from './components/EntryExperience';
import CabinInterior from './scenes/CabinInterior';
import './App.css';
import './styles/mobile.css';

// Chargement paresseux des composants lourds
const Contact = lazy(() => import('./scenes/Contact'));

function App() {
  // État de chargement initial
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // État pour suivre si l'utilisateur a complété l'expérience d'entrée
  const [experienceStarted, setExperienceStarted] = useState(false);
  
  // Simuler un temps de chargement minimal pour l'interface utilisateur initiale
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleStartExperience = () => {
    navigate('/experience');
    // Vous pouvez aussi mettre à jour localStorage si nécessaire
    try {
      localStorage.setItem('experienceStarted', 'true');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'état:', err);
    }
  };

  // Gestionnaire pour marquer l'expérience comme démarrée
  const handleExperienceComplete = () => {
    setExperienceStarted(true);
    // Stocker dans localStorage pour que l'utilisateur n'ait pas à répéter l'expérience à chaque visite
    try {
      localStorage.setItem('experienceStarted', 'true');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'état:', err);
    }
  };
  
  // Vérifier si l'utilisateur a déjà vu l'expérience d'entrée
  useEffect(() => {
    try {
      const hasStartedExperience = localStorage.getItem('experienceStarted') === 'true';
      if (hasStartedExperience) {
        setExperienceStarted(true);
      }
    } catch (err) {
      console.error('Erreur lors de la lecture de l\'état:', err);
    }
  }, []);
  
  // Pendant le chargement initial, afficher l'écran de chargement
  if (isInitialLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <Router>
      <div className="app-container">
        <Suspense fallback={<LoadingScreen message="Chargement..." />}>
        <Routes>
  {/* Route principale pour la page d'accueil */}
  <Route 
    path="/" 
    element={
      <EntryExperience 
        onEnterClick={handleStartExperience}
        backgroundImage="/images/home-background.jpg"
      />
    } 
  />
  
  {/* Route pour l'expérience 3D */}
  <Route 
    path="/experience" 
    element={
      <Suspense fallback={<LoadingScreen message="Chargement de l'expérience..." />}>
        <CabinInterior />
      </Suspense>
    } 
  />
            
            {/* Autres routes */}
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<div>404 - Page non trouvée</div>} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;