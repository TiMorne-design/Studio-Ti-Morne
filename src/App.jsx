// App.jsx - Version modifiée
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/ui/LoadingScreen';
import HomePage from './scenes/HomePage';
import CabinInterior from './scenes/CabinInterior';
import DatavizEoliennesPage from "./scenes/DatavizEoliennesPage";
import DatavizSargassesPage from "./scenes/DatavizSargassesPage";
import TimorneConceptionPage from "./scenes/TimorneConceptionPage";
import './App.css';
import './styles/mobile.css';

// Chargement paresseux des composants lourds
const Contact = lazy(() => import('./scenes/Contact'));

function App() {
  // État de chargement initial
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  
  // Simuler un temps de chargement minimal pour l'interface utilisateur initiale
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
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
              element={<HomePage />} 
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

           {/* Route pour la visualisation des éoliennes */}
           <Route 
              path="/dataviz/eoliennes" 
              element={
                <Suspense fallback={<LoadingScreen message="Chargement de l'expérience..." />}>
                  <DatavizEoliennesPage />
                </Suspense>
              } 
            />

<Route 
  path="/dataviz/sargasses" 
  element={
    <Suspense fallback={<LoadingScreen message="Chargement..." />}>
      <DatavizSargassesPage />
    </Suspense>
  } 
/>

<Route 
  path="/conceptionstudio" 
  element={
    <Suspense fallback={<LoadingScreen message="Chargement..." />}>
      <TimorneConceptionPage />
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