/**
 * MouseControls.js
 * Gestion complète des contrôles souris pour l'expérience 3D
 * Contrôle la rotation, le déplacement et les limites de la caméra
 */
import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé pour la gestion des contrôles souris
 * @param {Object} options - Options de configuration
 * @param {Object} options.cameraRef - Référence à l'objet caméra
 * @param {Object} options.splineRef - Référence à l'instance Spline
 * @param {Function} options.onCameraChange - Callback pour les changements de caméra
 * @returns {Object} - API des contrôles souris
 */
export default function MouseControls({
  cameraRef = { current: null },
  splineRef = { current: null },
  onCameraChange = null
}) {
  // État pour les contrôles
  const [controlsEnabled, setControlsEnabled] = useState(true);
  
  // Références pour les positions et rotations
  const targetPosition = useRef({ x: 0, y: 0, z: 0 });
  const initialPosition = useRef({ x: 0, y: 0, z: 0 });
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const initialRotation = useRef({ x: 0, y: 0, z: 0 });
  
  // Référence pour l'animation
  const animationFrameRef = useRef(null);
  
  // État de la caméra avant action utilisateur
  const previousCameraState = useRef(null);
  
  // Direction du mouvement (1=avant, -1=arrière)
  const movementDirection = useRef(1);
  
  // Flags pour les zones et actions
  const isAfterButtonClick = useRef(false);
  const isOnTerrace = useRef(true);
  const hasPerformedFirstTurn = useRef(false);
  
  // Configuration des contrôles
  const config = {
    // Sensibilité des mouvements
    mouseSensitivity: 0.8,        // Sensibilité générale
    wheelSensitivity: 1.0,        // Sensibilité de la molette
    
    // Limites et facteurs
    maxPositionOffset: 5,         // Décalage maximum de position
    maxSideRotation: 1.2,         // Rotation horizontale maximale
    maxVerticalAngle: 0.3,        // Rotation verticale maximale
    smoothFactor: 0.05,           // Lissage des mouvements
    
    // Déplacement
    scrollSpeed: 2500,            // Vitesse de défilement
    maxStandardSpeed: 200,        // Vitesse max standard
    maxTerraceSpeed: 360,         // Vitesse max sur terrasse
    
    // Zones d'interaction
    centerWidthZone: 0.5,         // Zone centrale pour rotation verticale
    
    // Durées d'animation
    standardAnimationDuration: 2000, // Durée standard d'animation
    buttonClickAnimationDuration: 2000 // Durée d'animation après clic
  };
  
  // Obtenir les limites de la caméra
  const getCameraLimits = useCallback(() => {
    return {
      minZ: -3200,          // Limite avant (fond du chalet)
      maxZ: 1200,           // Limite arrière (extérieur de la terrasse)
      doorThreshold: -800,  // Seuil de la porte
      doorTrigger: -400     // Position de déclenchement de la porte
    };
  }, []);
  
  /**
   * Convertit des radians en degrés
   * @param {Number} radians - Valeur en radians
   * @returns {Number} - Valeur en degrés
   */
  const radiansToDegrees = useCallback((radians) => {
    return radians * (180 / Math.PI);
  }, []);
  
  /**
   * Convertit des degrés en radians
   * @param {Number} degrees - Valeur en degrés
   * @returns {Number} - Valeur en radians
   */
  const degreesToRadians = useCallback((degrees) => {
    return degrees * (Math.PI / 180);
  }, []);
  
  /**
   * Limite une valeur entre min et max
   * @param {Number} value - Valeur à limiter
   * @param {Number} min - Valeur minimale
   * @param {Number} max - Valeur maximale
   * @returns {Number} - Valeur limitée
   */
  const clamp = useCallback((value, min, max) => {
    return Math.max(min, Math.min(max, value));
  }, []);
  
  /**
   * Initialise les contrôles avec une caméra
   * @param {Object} camera - Objet caméra à contrôler
   */
  const initializeCamera = useCallback((camera) => {
    if (!camera) {
      console.warn('Impossible d\'initialiser les contrôles: objet camera manquant');
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
    const limits = getCameraLimits();
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
    
    console.log("Caméra initialisée sur la terrasse:", {
      position: camera.position,
      isOnTerrace: isOnTerrace.current
    });
    
    // Démarrer la boucle d'animation
    startAnimationLoop();
  }, [getCameraLimits]);
  
  /**
   * Démarre la boucle d'animation pour les mouvements fluides
   */
  const startAnimationLoop = useCallback(() => {
    if (!cameraRef.current) return;
    
    const animate = () => {
      // Vérification que la caméra existe et que ses propriétés sont accessibles
      if (!cameraRef.current || !cameraRef.current.position || !cameraRef.current.rotation) {
        console.warn("Animation annulée: référence caméra incomplète");
        return; // Sortir de la fonction si la caméra n'est pas disponible correctement
      }
      
      if (controlsEnabled && !isAfterButtonClick.current) {
        // Position actuelle de la caméra
        const currentPos = cameraRef.current.position;
        const currentRot = cameraRef.current.rotation;
        
        // Limites de la pièce
        const limits = getCameraLimits();
        
        // Détecter si c'est un appareil tactile
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        
        // Vérification de la position Z pour détecter le passage de la porte
        if (isOnTerrace.current) {
          // Passage de la terrasse à l'intérieur
          if (currentPos.z <= limits.doorThreshold) {
            isOnTerrace.current = false;
            console.log("Entrée dans le chalet - rotation activée");
          }
        } else if (!isOnTerrace.current && currentPos.z > limits.doorThreshold) {
          // Passage de l'intérieur à la terrasse
          isOnTerrace.current = true;
          
          // Sur desktop, définir la rotation neutre comme cible si aucun demi-tour n'a été fait
          if (!isTouchDevice && !hasPerformedFirstTurn.current) {
            const baseAngle = movementDirection.current > 0 ? 0 : Math.PI;
            targetRotation.current.y = baseAngle;
            targetRotation.current.x = 0;
            targetPosition.current.x = initialPosition.current.x;
            targetPosition.current.y = initialPosition.current.y;
            console.log("Sortie sur la terrasse - rotation désactivée pour desktop (avant premier demi-tour)");
          }
        }
        
        // Appliquer un mouvement fluide à la position Z (avancer/reculer)
        const dz = targetPosition.current.z - currentPos.z;
        currentPos.z += dz * config.smoothFactor;

        // Mouvements horizontaux et verticaux (X/Y)
        const dx = targetPosition.current.x - currentPos.x;
        const dy = targetPosition.current.y - currentPos.y;
        
        currentPos.x += dx * config.smoothFactor;
        currentPos.y += dy * config.smoothFactor;
        
        // Appliquer les rotations de manière fluide
        const drx = targetRotation.current.x - currentRot.x;
        const dry = targetRotation.current.y - currentRot.y;
        
        currentRot.x += drx * config.smoothFactor;
        currentRot.y += dry * config.smoothFactor;
        
        // Maintenir toujours la rotation Z à 0
        currentRot.z = 0;
        
        // Callback pour informer des changements
        if (onCameraChange) {
          onCameraChange({
            position: {...currentPos},
            rotation: {...currentRot},
            isOnTerrace: isOnTerrace.current
          });
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [controlsEnabled, config.smoothFactor, getCameraLimits, onCameraChange]);
  
  /**
   * Inverse la direction de déplacement
   */
  const invertMovementDirection = useCallback(() => {
    // Vérifier si on est sur la terrasse et si on n'a pas encore fait de demi-tour
    if (isOnTerrace.current && !hasPerformedFirstTurn.current) {
      console.log("Demi-tour sur la terrasse bloqué - effectuez d'abord un demi-tour au fond du chalet");
      return; // Bloquer l'inversion si on est sur la terrasse sans avoir fait le premier demi-tour
    }
    
    // Inverser la direction
    movementDirection.current = -movementDirection.current;
    
    // Position actuelle de la caméra
    if (cameraRef.current) {
      // Stopper momentanément le mouvement en Z en synchronisant la cible avec la position actuelle
      targetPosition.current.z = cameraRef.current.position.z;
      
      // Pivoter la caméra à 180° lorsqu'on change de direction
      if (movementDirection.current < 0) {
        // Vers l'arrière (rotation à 180° autour de Y)
        targetRotation.current.y = Math.PI;
      } else {
        // Vers l'avant (rotation à 0° autour de Y)
        targetRotation.current.y = 0;
      }
      
      // Si ce demi-tour est effectué au fond du chalet, marquer qu'on a réalisé le premier demi-tour
      const limits = getCameraLimits();
      if (!isOnTerrace.current && cameraRef.current.position.z <= limits.minZ + 500) {
        hasPerformedFirstTurn.current = true;
        console.log("Premier demi-tour effectué au fond du chalet - demi-tour sur terrasse débloqué");
      }
      
      // Ajouter une brève "pause" dans le mouvement pour accentuer le demi-tour
      const currentPosition = { ...targetPosition.current };
      
      // Définir un petit délai pour permettre à la rotation de s'effectuer avant de reprendre le mouvement
      setTimeout(() => {
        // Après la rotation, reprendre le mouvement dans la nouvelle direction
        // mais uniquement si les contrôles sont toujours activés
        if (controlsEnabled && !isAfterButtonClick.current) {
          targetPosition.current = currentPosition;
        }
      }, 300); // Délai de 300ms pour la rotation
    }
  }, [controlsEnabled, getCameraLimits]);
  
  /**
   * Gère le défilement de la souris pour avancer/reculer
   * @param {WheelEvent} e - Événement de défilement
   */
  const handleWheel = useCallback((e) => {
    if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
    
    // Position actuelle
    const currentZ = cameraRef.current.position.z;
    
    // Limites de la pièce
    const limits = getCameraLimits();
    
    // Déterminer si on est sur la terrasse
    const onTerrace = currentZ > limits.doorThreshold;
    
    // Sensibilité du défilement adaptée selon la position
    // Augmenter la sensibilité sur la terrasse
    let sensitivityMultiplier = onTerrace ? 1.8 : 1.0;
    
    // Calcul du delta avec sensibilité adaptée
    let delta = e.deltaY * 0.05 * config.scrollSpeed * config.wheelSensitivity * sensitivityMultiplier;
    
    // Limiter la vitesse maximale (augmentée sur la terrasse)
    const maxSpeed = onTerrace ? config.maxTerraceSpeed : config.maxStandardSpeed;
    delta = clamp(delta, -maxSpeed, maxSpeed);
    
    // Appliquer la direction de mouvement actuelle
    delta *= movementDirection.current;
    
    // Nouvelle position potentielle
    const newZ = currentZ + delta;
    
    // Vérifier les limites et inverser la direction si nécessaire
    if (newZ <= limits.minZ) {
      targetPosition.current.z = limits.minZ;
      
      // Inverser la direction à la limite avant
      if (delta < 0) {
        invertMovementDirection();
      }
    } else if (newZ >= limits.maxZ) {
      targetPosition.current.z = limits.maxZ;
      
      // Inverser la direction à la limite arrière seulement si on a déjà fait le premier demi-tour
      // ou si on est sur la terrasse
      if (delta > 0) {
        if (!isOnTerrace.current || hasPerformedFirstTurn.current) {
          invertMovementDirection();
        } else {
          console.log("Limite arrière atteinte sur la terrasse - effectuez d'abord un demi-tour au fond du chalet");
        }
      }
    } else {
      // Déplacement normal dans les limites
      targetPosition.current.z = newZ;
    }
  }, [controlsEnabled, getCameraLimits, clamp, config.scrollSpeed, config.wheelSensitivity, config.maxStandardSpeed, config.maxTerraceSpeed, invertMovementDirection]);
  
  /**
   * Gère le mouvement de la souris pour orienter la caméra
   * @param {MouseEvent} e - Événement de mouvement de souris
   */
  const handleMouseMove = useCallback((e) => {
    if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
    
    // Détecter si l'événement vient d'un appareil tactile
    const isTouchEvent = e.isTouchEvent === true || e.type === 'touchmove';
    
    // Permission spéciale pour les événements tactiles sur la terrasse
    const allowTouchOnTerrace = isTouchEvent;
    
    // Vérifier si on est sur la terrasse et si on doit ignorer l'événement
    if (isOnTerrace.current && !allowTouchOnTerrace && !hasPerformedFirstTurn.current) {
      return;
    }
    
    // Normaliser la position de la souris entre -1 et 1
    const x = e.normalizedX || (e.clientX / window.innerWidth) * 2 - 1;
    const y = e.normalizedY || (e.clientY / window.innerHeight) * 2 - 1;
    
    // Appliquer une courbe de réponse plus douce pour les petits mouvements
    const xModified = Math.sign(x) * Math.pow(Math.abs(x), 1.2);
    const yModified = Math.sign(y) * Math.pow(Math.abs(y), 1.3);
    
    // Calcul de la distance du curseur par rapport au centre HORIZONTAL uniquement
    const distanceFromCenterX = Math.abs(xModified);
    
    // Réduire l'offset de position pour un effet moins prononcé
    const posOffsetX = xModified * config.maxPositionOffset * 1.2;
    
    // Réduire le mouvement vertical quand on s'éloigne du centre horizontal
    const verticalFactor = Math.max(0, 1 - (distanceFromCenterX / config.centerWidthZone));
    const posOffsetY = -yModified * config.maxPositionOffset * 0.4 * verticalFactor;
    
    // Appliquer ces offsets à la position cible
    targetPosition.current.x = initialPosition.current.x + posOffsetX;
    targetPosition.current.y = initialPosition.current.y + posOffsetY;
    
    // Base de rotation selon la direction du mouvement
    const baseAngle = movementDirection.current > 0 ? 0 : Math.PI;
    
    // Calcul des rotations
    // Pour les événements tactiles, ne pas inverser la direction
    if (isTouchEvent) {
      targetRotation.current.y = baseAngle + (xModified * config.maxSideRotation);
    } else {
      // Pour la souris, garder l'inversion
      targetRotation.current.y = baseAngle + (-xModified * config.maxSideRotation);
    }
    
    // Rotation verticale (X) - uniquement dans la zone centrale horizontale
    if (movementDirection.current > 0) {
      // Direction normale (avant)
      targetRotation.current.x = -yModified * config.maxVerticalAngle * verticalFactor;
    } else {
      // Direction inversée (arrière)
      targetRotation.current.x = yModified * config.maxVerticalAngle * verticalFactor;
    }
    
    // Assurer que la rotation Z reste à 0
    targetRotation.current.z = 0;
  }, [controlsEnabled, config.maxPositionOffset, config.centerWidthZone, config.maxSideRotation, config.maxVerticalAngle]);
  
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
    
    console.log("État de la caméra sauvegardé");
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
    
    console.log("Contrôles de caméra désactivés après clic sur bouton");
  }, [saveCurrentCameraState]);
  
  /**
   * Restaure l'état précédent de la caméra
   * @param {Number} animationDuration - Durée de l'animation en ms
   */
  const restorePreviousCameraState = useCallback((animationDuration = config.standardAnimationDuration) => {
    // Cas standard - il nous faut un état précédent et une référence à la caméra
    if (!cameraRef.current || !previousCameraState.current) {
      console.log("Pas d'état précédent à restaurer, réactivation simple des contrôles");
      setControlsEnabled(true);
      isAfterButtonClick.current = false;
      return;
    }
    
    const camera = cameraRef.current;
    const prevState = previousCameraState.current;
    
    console.log("Restauration de l'état précédent de la caméra");
    
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
        
        console.log("État précédent restauré, contrôles réactivés");
      }
    };
    
    // Démarrer l'animation
    animateReturn();
  }, [config.standardAnimationDuration]);
  
  /**
   * Déplace la caméra d'une certaine distance
   * @param {Number} distance - Distance de déplacement
   */
  const moveCamera = useCallback((distance) => {
    if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
    
    // Position actuelle
    const currentZ = cameraRef.current.position.z;
    
    // Limites de la pièce
    const limits = getCameraLimits();
    
    // Déterminer si on est sur la terrasse
    const onTerrace = currentZ > limits.doorThreshold;
    
    // Ajuster la distance selon la position (terrasse ou intérieur)
    const terraceMultiplier = 1.8;
    const adjustedDistance = onTerrace ? distance * terraceMultiplier : distance;
    
    // Appliquer la direction de mouvement actuelle
    const finalDistance = adjustedDistance * movementDirection.current;
    
    // Nouvelle position potentielle
    const newZ = currentZ + finalDistance;
    
    // Vérifier les limites et inverser la direction si nécessaire
    if (newZ <= limits.minZ) {
      targetPosition.current.z = limits.minZ;
      
      // Inverser la direction à la limite avant
      if (finalDistance < 0) {
        invertMovementDirection();
      }
    } else if (newZ >= limits.maxZ) {
      targetPosition.current.z = limits.maxZ;
      
      // Inverser la direction à la limite arrière
      if (finalDistance > 0) {
        invertMovementDirection();
      }
    } else {
      // Déplacement normal dans les limites
      targetPosition.current.z = newZ;
    }
  }, [controlsEnabled, getCameraLimits, invertMovementDirection]);
  
  /**
   * Anime la caméra vers une position et rotation cibles
   * @param {Object} options - Options d'animation
   * @param {Object} options.position - Position cible {x, y, z}
   * @param {Object} options.rotation - Rotation cible en degrés {x, y, z}
   * @param {Number} options.duration - Durée de l'animation en ms
   * @param {Function} options.onComplete - Callback à la fin de l'animation
   */
  const animateCamera = useCallback(({ 
    position, 
    rotation, 
    duration = config.standardAnimationDuration,
    onComplete = null
  }) => {
    if (!cameraRef.current) {
      console.warn("Impossible d'animer la caméra: référence camera manquante");
      return;
    }
    
    // Position et rotation actuelles
    const startPosition = {
      x: cameraRef.current.position.x,
      y: cameraRef.current.position.y,
      z: cameraRef.current.position.z
    };
    
    const startRotation = {
      x: cameraRef.current.rotation.x,
      y: cameraRef.current.rotation.y,
      z: cameraRef.current.rotation.z
    };
    
    // Convertir les rotations de degrés (paramètre d'entrée) en radians (format Three.js/React)
    const targetRotation = {
      x: rotation ? degreesToRadians(rotation.x || 0) : startRotation.x,
      y: rotation ? degreesToRadians(rotation.y || 0) : startRotation.y,
      z: 0 // Toujours garder Z à 0
    };
    
    // Temps de début pour l'animation
    const startTime = Date.now();
    
    // Fonction d'animation
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Fonction d'easing pour un mouvement plus naturel
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      // Interpoler la position si fournie
      if (position) {
        cameraRef.current.position.x = startPosition.x + (position.x - startPosition.x) * easedProgress;
        cameraRef.current.position.y = startPosition.y + (position.y - startPosition.y) * easedProgress;
        cameraRef.current.position.z = startPosition.z + (position.z - startPosition.z) * easedProgress;
        
        // Mettre également à jour les positions cibles
        targetPosition.current.x = cameraRef.current.position.x;
        targetPosition.current.y = cameraRef.current.position.y;
        targetPosition.current.z = cameraRef.current.position.z;
      }
      
      // Interpoler la rotation si fournie
      if (rotation) {
        cameraRef.current.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easedProgress;
        cameraRef.current.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easedProgress;
        cameraRef.current.rotation.z = 0; // Toujours garder Z à 0
        
        // Mettre également à jour les rotations cibles
        targetRotation.current.x = cameraRef.current.rotation.x;
        targetRotation.current.y = cameraRef.current.rotation.y;
        targetRotation.current.z = 0;
      }
      
      // Continuer l'animation ou terminer
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    
    // Démarrer l'animation
    requestAnimationFrame(animate);
  }, [config.standardAnimationDuration, degreesToRadians]);
  
  /**
   * Réactive les contrôles sans restaurer la position
   */
  const restoreControlsOnly = useCallback(() => {
    setControlsEnabled(true);
    isAfterButtonClick.current = false;
    previousCameraState.current = null;
    
    return true;
  }, []);
  
  /**
   * Obtenir l'état actuel de la caméra
   * @returns {Object} - État de la caméra {position, rotation}
   */
  const getCameraState = useCallback(() => {
    if (!cameraRef.current) return null;
    
    return {
      position: {
        x: cameraRef.current.position.x,
        y: cameraRef.current.position.y,
        z: cameraRef.current.position.z
      },
      rotation: {
        x: radiansToDegrees(cameraRef.current.rotation.x),
        y: radiansToDegrees(cameraRef.current.rotation.y),
        z: radiansToDegrees(cameraRef.current.rotation.z)
      },
      isOnTerrace: isOnTerrace.current,
      movementDirection: movementDirection.current
    };
  }, [radiansToDegrees]);
  
  // Nettoyer la boucle d'animation lors du démontage
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Retourner l'API du hook
  return {
    // Initialisation
    initializeCamera,
    
    // Contrôles de base
    handleWheel,
    handleMouseMove,
    moveCamera,
    
    // Gestion des états
    handleButtonClick,
    restorePreviousCameraState,
    restoreControlsOnly,
    saveCurrentCameraState,
    getCameraState,
    
    // Animation
    animateCamera,
    
    // État des contrôles
    isControlsEnabled: controlsEnabled,
    hasPreviousState: () => !!previousCameraState.current,
    isOnTerrace: () => isOnTerrace.current,
    setControlsEnabled,
    
    // Utilitaires
    invertMovementDirection,
    
    // Accès direct aux références (usage avancé)
    targetPosition,
    targetRotation,
    movementDirection,
    cameraRef
  };
}