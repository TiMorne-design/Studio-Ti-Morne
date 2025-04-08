/**
 * Hook personnalisé pour les contrôles de caméra
 * Gère les mouvements, rotations et limites de la caméra
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import cameraUtils from '../../utils/cameraUtils';
import debugUtils from '../../utils/debugUtils';

const { logger } = debugUtils;

/**
 * Hook pour les contrôles de caméra dans l'environnement Spline
 * @param {React.RefObject} cameraRef - Référence à l'objet caméra
 * @param {React.RefObject} splineRef - Référence à l'instance Spline
 * @returns {Object} - Fonctions et états pour la gestion de la caméra
 */
export default function useCameraControls(cameraRef, splineRef) {
  // État pour activer/désactiver les contrôles
  const [controlsEnabled, setControlsEnabled] = useState(true);
  
  // Références pour les positions et rotations
  const targetPosition = useRef({ x: 0, y: 0, z: 0 });
  const initialPosition = useRef({ x: 0, y: 0, z: 0 });
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const initialRotation = useRef({ x: 0, y: 0, z: 0 });
  
  // Référence pour la boucle d'animation
  const animationFrameRef = useRef(null);
  
  // Direction du mouvement (1 = avant, -1 = arrière)
  const movementDirection = useRef(1);
  
  // État de la caméra avant un clic sur un bouton
  const previousCameraState = useRef(null);
  
  // Flag pour le mode "après clic sur bouton"
  const isAfterButtonClick = useRef(false);
  
  // Flag pour la zone terrasse (sans rotation)
  const isOnTerrace = useRef(true);
  
  // Configuration du mouvement de la caméra
  const config = {
    mouseSensitivity: 0.8,     // Sensibilité aux mouvements de souris
    maxPositionOffset: 5,      // Décalage maximum de la position en unités 3D
    smoothFactor: 0.05,        // Facteur de lissage pour les mouvements
    scrollSpeed: 2500,         // Vitesse de défilement
    centerWidthZone: 0.5,      // Zone centrale horizontale où le mouvement vertical est permis
    maxSideRotation: 1.2,      // Rotation horizontale maximale (environ 69 degrés)
    maxVerticalAngle: 0.3      // Rotation verticale maximale (environ 17 degrés)
  };

  const handlePortfolioButtonClick = useCallback(() => {
    // Ne pas sauvegarder l'état complet, juste marquer que les contrôles sont désactivés
    setControlsEnabled(false);
    isAfterButtonClick.current = true;
    logger.log("Contrôles de caméra désactivés pour le bouton portfolio sans sauvegarde d'état");
  }, []);
  
  /**
   * Initialise les contrôles de caméra
   * @param {Object} camera - Objet caméra à contrôler
   */
  const initializeCamera = useCallback((camera) => {
    if (!camera) {
      logger.warn('Impossible d\'initialiser la caméra: objet camera manquant');
      return;
    }
    
    cameraRef.current = camera;
    
    // Stocker la position et rotation initiales
    initialPosition.current = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    
    // Positionner la caméra plus en arrière initialement
    const limits = cameraUtils.getCameraLimits();
    camera.position.z = limits.maxZ - 200; // Position initiale reculée
    
    targetPosition.current = {
      x: initialPosition.current.x,
      y: initialPosition.current.y,
      z: camera.position.z
    };
    
    initialRotation.current = {
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: 0 // Toujours maintenir z à 0
    };
    
    // Initialiser les valeurs cibles
    targetRotation.current = { ...initialRotation.current };
    
    // Commencer sur la terrasse par défaut
    isOnTerrace.current = true;
    
    logger.log("Caméra initialisée sur la terrasse:", {
      position: camera.position,
      isOnTerrace: isOnTerrace.current
    });
    
    // Démarrer la boucle d'animation
    startAnimationLoop();
  }, []);
  
  /**
   * Démarre la boucle d'animation pour les mouvements fluides
   */
  const startAnimationLoop = useCallback(() => {
    if (!cameraRef.current) return;
    
    const animate = () => {
      if (cameraRef.current && controlsEnabled && !isAfterButtonClick.current) {
        // Position actuelle de la caméra
        const currentPos = cameraRef.current.position;
        const currentRot = cameraRef.current.rotation;
        
        // Limites de la pièce
        const limits = cameraUtils.getCameraLimits();
        
        // Vérification de la position Z pour détecter le passage de la porte
        if (isOnTerrace.current) {
          // Passage de la terrasse à l'intérieur
          if (currentPos.z <= limits.doorThreshold) {
            isOnTerrace.current = false;
            logger.log("Entrée dans le chalet - rotation activée");
          }
        } else if (!isOnTerrace.current && currentPos.z > limits.doorThreshold) {
          // Passage de l'intérieur à la terrasse
          isOnTerrace.current = true;
          
          // Remettre la caméra droite lorsqu'on sort
          if (!window.matchMedia('(pointer: coarse)').matches) {
          const baseAngle = movementDirection.current > 0 ? 0 : Math.PI;
          targetRotation.current.y = baseAngle;
          targetRotation.current.x = 0;
          
          // Réinitialiser les décalages X et Y
          targetPosition.current.x = initialPosition.current.x;
          targetPosition.current.y = initialPosition.current.y;
          
          logger.log("Sortie sur la terrasse - rotation désactivée");
        }
      }
        
        // Appliquer un mouvement fluide à la position Z (avancer/reculer)
const dz = targetPosition.current.z - currentPos.z;
currentPos.z += dz * config.smoothFactor;

// Détecter si c'est un appareil tactile
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

// Sur la terrasse avec ordinateur, désactiver la rotation
if (isOnTerrace.current && !isTouchDevice) {
  // Ne pas appliquer de rotation, mais recentrer progressivement
  const returnFactor = config.smoothFactor;
  
  // Recentrage de la position horizontale
  currentPos.x += (initialPosition.current.x - currentPos.x) * returnFactor;
  currentPos.y += (initialPosition.current.y - currentPos.y) * returnFactor;
  
  // Rétablir la rotation neutre
  const baseAngle = movementDirection.current > 0 ? 0 : Math.PI;
  currentRot.x += (0 - currentRot.x) * returnFactor;
  currentRot.y += (baseAngle - currentRot.y) * returnFactor;
} else {
  // Dans tous les autres cas (intérieur OU tactile), permettre la rotation normale
  // Léger décalage de position X et Y
  const dx = targetPosition.current.x - currentPos.x;
  const dy = targetPosition.current.y - currentPos.y;
  
  currentPos.x += dx * config.smoothFactor;
  currentPos.y += dy * config.smoothFactor;
  
  // Appliquer les rotations de manière fluide
  const drx = targetRotation.current.x - currentRot.x;
  const dry = targetRotation.current.y - currentRot.y;
  
  currentRot.x += drx * config.smoothFactor;
  currentRot.y += dry * config.smoothFactor;
}

// Maintenir toujours la rotation Z à 0 pour éviter l'inclinaison
currentRot.z = 0;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [controlsEnabled]);
  
  /**
   * Inverse la direction de déplacement
   */
  const invertMovementDirection = useCallback(() => {
    movementDirection.current = -movementDirection.current;
    
    // Pivoter la caméra à 180° lorsqu'on change de direction
    if (movementDirection.current < 0) {
      // Vers l'arrière (rotation à 180° autour de Y)
      targetRotation.current.y = Math.PI;
    } else {
      // Vers l'avant (rotation à 0° autour de Y)
      targetRotation.current.y = 0;
    }
  }, []);
  
  /**
   * Gère le défilement de la souris pour avancer/reculer
   * @param {WheelEvent} e - Événement de défilement
   */
  const handleWheel = useCallback((e) => {
    if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
    
    // Sensibilité du défilement augmentée
    let delta = e.deltaY * 0.05 * config.scrollSpeed;
    
    // Limiter la vitesse maximale
    delta = cameraUtils.clamp(delta, -200, 200);
    
    // Appliquer la direction de mouvement actuelle
    delta *= movementDirection.current;
    
    // Position actuelle
    const currentZ = cameraRef.current.position.z;
    
    // Nouvelle position potentielle
    const newZ = currentZ + delta;
    
    // Limites de la pièce
    const limits = cameraUtils.getCameraLimits();
    
    // Vérifier les limites et inverser la direction si nécessaire
    if (newZ <= limits.minZ) {
      targetPosition.current.z = limits.minZ;
      
      // Inverser la direction à la limite avant
      if (delta < 0) {
        invertMovementDirection();
      }
    } else if (newZ >= limits.maxZ) {
      targetPosition.current.z = limits.maxZ;
      
      // Inverser la direction à la limite arrière
      if (delta > 0) {
        invertMovementDirection();
      }
    } else {
      // Déplacement normal dans les limites
      targetPosition.current.z = newZ;
    }
  }, [controlsEnabled, invertMovementDirection]);
  
  /**
   * Gère le mouvement de la souris pour orienter la caméra
   * @param {MouseEvent} e - Événement de mouvement de souris
   */
  const handleMouseMove = useCallback((e) => {
    if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
    
  // Détecter si l'événement vient d'un appareil tactile
  const isTouchEvent = e.isTouchEvent === true;
  
  // Ignorer le mouvement de souris sur la terrasse SAUF pour les événements tactiles
  if (isOnTerrace.current && !isTouchEvent) {
    return;
  }
    
    // Normaliser la position de la souris entre -1 et 1
    const x = e.normalizedX || (e.clientX / window.innerWidth) * 2 - 1;
    const y = e.normalizedY || (e.clientY / window.innerHeight) * 2 - 1;
    
    // Calcul de la distance du curseur par rapport au centre HORIZONTAL uniquement
    const distanceFromCenterX = Math.abs(x);
    
    // Augmenter légèrement l'offset de position pour un effet plus prononcé
    const posOffsetX = x * config.maxPositionOffset * 1.5;
    
    // Réduire le mouvement vertical quand on s'éloigne du centre horizontal
    const verticalFactor = Math.max(0, 1 - (distanceFromCenterX / config.centerWidthZone));
    const posOffsetY = -y * config.maxPositionOffset * 0.5 * verticalFactor;
    
    // Appliquer ces offsets à la position cible
    targetPosition.current.x = initialPosition.current.x + posOffsetX;
    targetPosition.current.y = initialPosition.current.y + posOffsetY;
    
    // Base de rotation selon la direction du mouvement
    const baseAngle = movementDirection.current > 0 ? 0 : Math.PI;
    
    // Calcul des rotations
    // Rotation horizontale avec amplitude augmentée
    targetRotation.current.y = baseAngle + (-x * config.maxSideRotation);
    
    // Rotation verticale (X) - uniquement dans la zone centrale horizontale
    if (movementDirection.current > 0) {
      // Direction normale (avant)
      targetRotation.current.x = -y * config.maxVerticalAngle * verticalFactor;
    } else {
      // Direction inversée (arrière)
      targetRotation.current.x = y * config.maxVerticalAngle * verticalFactor;
    }
    
    // Assurer que la rotation Z reste à 0
    targetRotation.current.z = 0;
  }, [controlsEnabled]);
  
  /**
   * Sauvegarde l'état actuel de la caméra
   */
  const saveCurrentCameraState = useCallback(() => {
    if (!cameraRef.current) return;
    
    const camera = cameraRef.current;
    
    previousCameraState.current = {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      },
      initialPosition: { ...initialPosition.current },
      initialRotation: { ...initialRotation.current },
      targetPosition: { ...targetPosition.current },
      targetRotation: { ...targetRotation.current },
      movementDirection: movementDirection.current,
      isOnTerrace: isOnTerrace.current
    };
    
    logger.log("État de la caméra sauvegardé avant le clic sur bouton", previousCameraState.current);
  }, []);
  
  /**
   * Désactive les contrôles lors d'un clic sur un bouton
   */
  const handleButtonClick = useCallback(() => {
    // Sauvegarder l'état actuel avant de désactiver les contrôles
    saveCurrentCameraState();
    
    // Désactiver les contrôles et marquer que nous sommes après un clic sur bouton
    setControlsEnabled(false);
    isAfterButtonClick.current = true;
    
    logger.log("Contrôles de caméra complètement désactivés après clic sur bouton");
  }, [saveCurrentCameraState]);
  
  /**
   * Restaure l'état précédent de la caméra
   * @param {Number} animationDuration - Durée de l'animation en ms
   */
  const restorePreviousCameraState = useCallback((animationDuration = 2000) => {
    // Vérifier explicitement si nous sommes en mode portfolio
  if (window.__portfolioMode === true) {
    logger.log("Restauration en mode portfolio - réactivation simple des contrôles");
          // Réactiver les contrôles mais sans restaurer l'état
    setControlsEnabled(true);
    isAfterButtonClick.current = false;

    window.__portfolioMode = false;
    return;
    }
  
      // Cas standard - il nous faut un état précédent et une référence à la caméra
  if (!cameraRef.current || !previousCameraState.current) {
    logger.log("Pas d'état précédent à restaurer, réactivation simple des contrôles");
    setControlsEnabled(true);
    isAfterButtonClick.current = false;
    return;
  }
    
    const camera = cameraRef.current;
    const prevState = previousCameraState.current;
    
    logger.log("Restauration de l'état précédent de la caméra", prevState);
    
    // Utiliser une animation pour revenir en douceur à la position précédente
    const startPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    
    const startRotation = {
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: camera.rotation.z
    };
    
    const startTime = Date.now();
    
    const animateReturn = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);
      
      // Fonction d'easing pour un mouvement plus naturel
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      // Interpoler la position
      camera.position.x = startPosition.x + (prevState.position.x - startPosition.x) * easedProgress;
      camera.position.y = startPosition.y + (prevState.position.y - startPosition.y) * easedProgress;
      camera.position.z = startPosition.z + (prevState.position.z - startPosition.z) * easedProgress;
      
      // Interpoler la rotation
      camera.rotation.x = startRotation.x + (prevState.rotation.x - startRotation.x) * easedProgress;
      camera.rotation.y = startRotation.y + (prevState.rotation.y - startRotation.y) * easedProgress;
      camera.rotation.z = 0; // Toujours garder Z à 0
      
      // Vérifier si l'animation continue
      if (progress < 1) {
        requestAnimationFrame(animateReturn);
      } else {
        // Animation terminée, restaurer complètement l'état précédent
        initialPosition.current = { ...prevState.initialPosition };
        initialRotation.current = { ...prevState.initialRotation };
        targetPosition.current = { ...prevState.targetPosition };
        targetRotation.current = { ...prevState.targetRotation };
        movementDirection.current = prevState.movementDirection;
        isOnTerrace.current = prevState.isOnTerrace;
        
        // Réactiver les contrôles
        setControlsEnabled(true);
        isAfterButtonClick.current = false;
        
        logger.log("État précédent restauré, contrôles réactivés, sur terrasse:", isOnTerrace.current);
      }
    };
    
    // Démarrer l'animation
    animateReturn();
  }, []);
  
  // Nettoyer la boucle d'animation quand le composant est démonté
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Ajoutez cette fonction à peu près à la ligne 413, avant le bloc "return"
const moveCamera = useCallback((distance) => {
  if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
  
  // Appliquer la direction de mouvement actuelle
  const adjustedDistance = distance * movementDirection.current;
  
  // Position actuelle
  const currentZ = cameraRef.current.position.z;
  
  // Nouvelle position potentielle
  const newZ = currentZ + adjustedDistance;
  
  // Limites de la pièce
  const limits = cameraUtils.getCameraLimits();
  
  // Vérifier les limites et inverser la direction si nécessaire
  if (newZ <= limits.minZ) {
    targetPosition.current.z = limits.minZ;
    
    // Inverser la direction à la limite avant
    if (adjustedDistance < 0) {
      invertMovementDirection();
    }
  } else if (newZ >= limits.maxZ) {
    targetPosition.current.z = limits.maxZ;
    
    // Inverser la direction à la limite arrière
    if (adjustedDistance > 0) {
      invertMovementDirection();
    }
  } else {
    // Déplacement normal dans les limites
    targetPosition.current.z = newZ;
  }
}, [controlsEnabled, invertMovementDirection]);
  
  return {
    initializeCamera,
    handleWheel,
    handleMouseMove,
    handleButtonClick,
    restorePreviousCameraState,
    moveCamera,
    isControlsEnabled: controlsEnabled,
    hasPreviousState: () => !!previousCameraState.current,
    isOnTerrace: () => isOnTerrace.current
  };
}