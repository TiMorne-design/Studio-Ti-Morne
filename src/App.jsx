// App.jsx - Version simplifiée
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/ui/LoadingScreen';
import EntryExperience from './components/EntryExperience';
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
            {/* Route principale avec expérience d'entrée ou redirection */}
            <Route 
              path="/" 
              element={
                experienceStarted ? (
                  <Navigate to="/experience" replace />
                ) : (
                  <EntryExperience
                    homeBackgroundImage="./images/home-background.jpg"
                    transitionVideo="./videos/transition.mp4"
                    onExperienceComplete={handleExperienceComplete}
                  />
                )
              } 
            />
            
            {/* Route de l'expérience principale */}
            <Route 
              path="/experience" 
              element={
                <Suspense fallback={<LoadingScreen message="Chargement de l'expérience..." />}>
                  <EntryExperience currentStage="experience" />
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