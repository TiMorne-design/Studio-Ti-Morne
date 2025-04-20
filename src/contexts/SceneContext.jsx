import React, { createContext, useContext, useState, useCallback } from 'react';

// Définir le contexte
const SceneContext = createContext();

// Fournisseur de contexte
export function SceneProvider({ children }) {
  // États fondamentaux simplifiés
  const [doorState, setDoorState] = useState({
    isOpen: false,
    openSource: null // 'proximity', 'manual', 'button' ou null
  });
  
  const [viewMode, setViewMode] = useState('normal'); // 'normal', 'portfolio', etc.
  
  // Actions simplifiées
  const openDoor = useCallback((source = 'manual') => {
    setDoorState({
      isOpen: true,
      openSource: source
    });
  }, []);
  
  const closeDoor = useCallback(() => {
    setDoorState({
      isOpen: false,
      openSource: null
    });
  }, []);
  
  const changeViewMode = useCallback((mode) => {
    setViewMode(mode);
  }, []);
  
  // Valeur exposée par le contexte
  const value = {
    // États
    doorState,
    viewMode,
    
    // Actions
    openDoor,
    closeDoor,
    changeViewMode
  };
  
  return (
    <SceneContext.Provider value={value}>
      {children}
    </SceneContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useSceneState() {
  const context = useContext(SceneContext);
  if (context === undefined) {
    throw new Error('useSceneState must be used within a SceneProvider');
  }
  return context;
}