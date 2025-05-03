/**
 * Hook personnalisé pour les contrôles de caméra
 * Gère les mouvements, rotations et limites de la caméra
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import cameraUtils from '../../utils/cameraUtils';
import debugUtils from '../../utils/debugUtils';
import animationUtils from '../../utils/animation';
import splineHelpers from '../../utils/splineHelpers';
import { BUTTON_IDS, OBJECT_IDS } from '../../constants/ids';

const { logger } = debugUtils;

/**
 * Hook pour les contrôles de caméra dans l'environnement Spline
 * @param {React.RefObject} cameraRef - Référence à l'objet caméra
 * @param {React.RefObject} splineRef - Référence à l'instance Spline
 * @returns {Object} - Fonctions et états pour la gestion de la caméra
 */
export default function useCameraControls(cameraRef, splineRef) {
  // État pour activer/désactiver les contButton_rôles
  const [controlsEnabled, setControlsEnabled] = useState(true);
  
  // Références pour les positions et rotations
  const targetPosition = useRef({ x: 0, y: 0, z: 0 });
  const initialPosition = useRef({ x: 0, y: 0, z: 0 });
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const initialRotation = useRef({ x: 0, y: 0, z: 0 });

  // Référence pour les états de contrôle tactile
  const touchSwipeActiveRef = useRef(false);
  const touchSwipeTimerRef = useRef(null);
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isDragging: false,
    initialRotationY: 0,
    timestamp: 0,
    velocityX: 0,
    velocityY: 0
  });
  
  // Référence pour la boucle d'animation
  const animationFrameRef = useRef(null);

  const hasPerformedFirstTurn = useRef(false);
  
  // Direction du mouvement (1 = avant, -1 = arrière)
  const movementDirection = useRef(1);
  
  // État de la caméra avant un clic sur un bouton
  const previousCameraState = useRef(null);
  
  // Flag pour le mode "après clic sur bouton"
  const isAfterButtonClick = useRef(false);
  
  // Flag pour la zone terrasse (sans rotation)
  const isOnTerrace = useRef(true);
  const doorOpenedRecently = useRef(false);

  window.__isSwiping = false;
  
  // Configuration du mouvement de la caméra
  const config = {
    mouseSensitivity: 0.8,     // Sensibilité aux mouvements de souris
    maxPositionOffset: 5,      // Décalage maximum de la position en unités 3D
    smoothFactor: 0.05,        // Facteur de lissage pour les mouvements
    scrollSpeed: 3800,         // Vitesse de défilement
    centerWidthZone: 0.5,      // Zone centrale horizontale où le mouvement vertical est permis
    maxSideRotation: 1.2,      // Rotation horizontale maximale (environ 69 degrés)
    maxVerticalAngle: 0.3 ,     // Rotation verticale maximale (environ 17 degrés)
    terraceSpeedMultiplier: 3.0
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
        
// Définir un seuil avancé pour l'ouverture de la porte
const doorOpeningThreshold = limits.doorTrigger + 500; // Ajustez cette valeur (-50) selon vos besoins

// Vérification pour l'ouverture anticipée de la porte
if (isOnTerrace.current && 
  currentPos.z <= doorOpeningThreshold && 
  currentPos.z > limits.doorThreshold &&
  !doorOpenedRecently.current &&
   !window.__doorIsOpen && 
  !window.__doorThresholdTriggered) {

  // Ouvrir la porte en avance
  if (splineRef.current) {
    // Marquer l'ouverture comme automatique (si ce n'est pas déjà fait)
    if (!window.__automaticDoorOpening) {
      window.__automaticDoorOpening = true;
      window.__doorThresholdTriggered = true;
      doorOpenedRecently.current = true;
      window.__doorIsOpen = true;
      
      // Émettre l'événement mouseUp sur l'objet PORTE_OUVERT (pas le bouton)
      try {
        splineHelpers.emitEvent(splineRef.current, 'mouseUp', OBJECT_IDS.PORTE_OUVERT);
        logger.log("Ouverture anticipée de la porte avant le passage du seuil");
      } catch (error) {
        logger.error("Erreur lors de l'ouverture anticipée:", error);
      }
      
      // Réinitialiser les flags après un délai
      setTimeout(() => {
        window.__automaticDoorOpening = false;
        window.__doorThresholdTriggered = false;
      
      // Ajouter un délai supplémentaire avant de permettre une nouvelle ouverture
      setTimeout(() => {
        doorOpenedRecently.current = false;
      }, 3000);
    }, 1000);
    }
  }
}

// Détecter si c'est un appareil tactile
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

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
          
          // Ajouter un log ici pour voir l'état quand on retourne sur la terrasse
           logger.log("Retour sur la terrasse - hasPerformedFirstTurn:", hasPerformedFirstTurn.current, "isTouchDevice:", isTouchDevice);

           // Sur desktop, définir la rotation neutre comme cible si aucun demi-tour n'a été fait
  if (!isTouchDevice && !hasPerformedFirstTurn.current) {
    const baseAngle = movementDirection.current > 0 ? 0 : Math.PI;
    targetRotation.current.y = baseAngle;
    targetRotation.current.x = 0;
    targetPosition.current.x = initialPosition.current.x;
    targetPosition.current.y = initialPosition.current.y;
    logger.log("Sortie sur la terrasse - rotation désactivée pour desktop (avant premier demi-tour)");
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

         // Mise à jour de la rotation des boutons spécifiques seulement
if (splineRef.current) {
  const splineApp = splineRef.current;
  
  // Liste des boutons spécifiques qui doivent tourner
  const rotatingButtonIds = [
    BUTTON_IDS.DATAVIZ,
    BUTTON_IDS.ABOUT, 
    BUTTON_IDS.SITE, 
    BUTTON_IDS.MODEL3D, // Supposé être votre "3D"
    BUTTON_IDS.PRESTATIONS
  ];
  
  // Pour chaque bouton dans la liste spécifique
  rotatingButtonIds.forEach(buttonId => {
    const buttonObject = splineApp.findObjectById(buttonId);
    if (!buttonObject) return;
    
    // Calculer l'angle entre la caméra et le bouton sur le plan XZ
    const angleY = Math.atan2(
      currentPos.x - buttonObject.position.x,
      currentPos.z - buttonObject.position.z
    );
    
    // Appliquer une rotation fluide
    const currentButtonRotY = buttonObject.rotation.y;
    buttonObject.rotation.y = currentButtonRotY + 
      (angleY - currentButtonRotY) * config.smoothFactor;
  });
}
        
        // Maintenir toujours la rotation Z à 0
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
    // Vérifier si on est sur la terrasse et si on n'a pas encore fait de demi-tour
  if (isOnTerrace.current && !hasPerformedFirstTurn.current) {
    logger.log("Demi-tour sur la terrasse bloqué - effectuez d'abord un demi-tour au fond du chalet");
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
    const limits = cameraUtils.getCameraLimits();
    if (!isOnTerrace.current && cameraRef.current.position.z <= limits.minZ + 500) {
      hasPerformedFirstTurn.current = true;
      logger.log("Premier demi-tour effectué au fond du chalet - demi-tour sur terrasse débloqué");
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
  }, [controlsEnabled]);
  
  /**
   * Gère le défilement de la souris pour avancer/reculer
   * @param {WheelEvent} e - Événement de défilement
   */
  const handleWheel = useCallback((e) => {
    if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
    
    // Position actuelle
    const currentZ = cameraRef.current.position.z;
    
    // Limites de la pièce
    const limits = cameraUtils.getCameraLimits();
    
    // Déterminer si on est sur la terrasse
    const onTerrace = currentZ > limits.doorThreshold;
    
    // Sensibilité du défilement adaptée selon la position
    // Augmenter la sensibilité sur la terrasse
    let sensitivityMultiplier = onTerrace ? 1.8 : 1.0;
    
    // Calcul du delta avec sensibilité adaptée
    let delta = e.deltaY * 0.05 * config.scrollSpeed * sensitivityMultiplier;
    
    // Limiter la vitesse maximale (augmentée sur la terrasse)
    const maxSpeed = onTerrace ? 500 : 500;
    delta = cameraUtils.clamp(delta, -maxSpeed, maxSpeed);
    
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
        // Si on est sur la terrasse, ne rien faire si on n'a pas encore fait le premier demi-tour
        if (!isOnTerrace.current || hasPerformedFirstTurn.current) {
          invertMovementDirection();
        } else {
          logger.log("Limite arrière atteinte sur la terrasse - effectuez d'abord un demi-tour au fond du chalet");
        }
      }
    } else {
      // Déplacement normal dans les limites
      targetPosition.current.z = newZ;
    }
  }, [controlsEnabled, invertMovementDirection]);
  /**
 * Gère uniquement les mouvements de souris - ne doit jamais traiter d'événements tactiles
 * @param {MouseEvent} e - Événement souris standard
 */
const handleMouseMove = useCallback((e) => {
  // Ignorer complètement les événements tactiles
  if (e.isTouchEvent === true || e.type === 'touchmove' || e.touches) {
    return;
  }
  
  if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
  
  // Vérifier si on est sur la terrasse et si on doit ignorer l'événement
  if (isOnTerrace.current && !hasPerformedFirstTurn.current) {
    return;
  }
  // Normaliser la position de la souris entre -1 et 1
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = (e.clientY / window.innerHeight) * 2 - 1;
  
  // Appliquer la courbe de réponse pour un mouvement plus précis
  const xModified = Math.sign(x) * Math.pow(Math.abs(x), 1.2);
  const yModified = Math.sign(y) * Math.pow(Math.abs(y), 1.3);
  
  // Calcul de la distance du curseur par rapport au centre
  const distanceFromCenterX = Math.abs(xModified);
  
  // Calculer les offsets de position
  const posOffsetX = xModified * config.maxPositionOffset * 1.2;
  const verticalFactor = Math.max(0, 1 - (distanceFromCenterX / config.centerWidthZone));
  const posOffsetY = -yModified * config.maxPositionOffset * 0.4 * verticalFactor;
  
  // Appliquer ces offsets à la position cible
  targetPosition.current.x = initialPosition.current.x + posOffsetX;
  targetPosition.current.y = initialPosition.current.y + posOffsetY;
  
  // Base de rotation selon la direction du mouvement
  const baseAngle = movementDirection.current > 0 ? 0 : Math.PI;
  
  // Pour la souris, standard: inversion du mouvement
  targetRotation.current.y = baseAngle + (-xModified * config.maxSideRotation);
  
  // Rotation verticale (X) adaptée à la direction
  if (movementDirection.current > 0) {
    targetRotation.current.x = -yModified * config.maxVerticalAngle * verticalFactor;
  } else {
    targetRotation.current.x = yModified * config.maxVerticalAngle * verticalFactor;
  }
  
  // Assurer que la rotation Z reste à 0
  targetRotation.current.z = 0;
}, [controlsEnabled, config.maxPositionOffset, config.centerWidthZone, config.maxSideRotation, config.maxVerticalAngle]);


/**
   * Gère les événements tactiles pour tous les appareils
   * Version améliorée avec inertie et transitions plus fluides
   * @param {TouchEvent} e - Événement tactile natif
   */
/**
 * Gère les événements tactiles avec inertie réduite
 * @param {TouchEvent} e - Événement tactile natif
 */
const handleTouchMove = useCallback((e) => {
  if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
  
  // Traiter uniquement les événements tactiles à un doigt
  if (!e.touches || e.touches.length !== 1) return;
  
  const touch = e.touches[0];
  const state = touchStateRef.current;
  const now = Date.now();
  
   // Si l'état du toucher n'est pas initialisé, ne rien faire
  // (cela devrait être géré par handleTouchStart)
  if (!state.isDragging) return;
  
  // Calcul du delta depuis le dernier mouvement et mise à jour de la vélocité
  const deltaTime = Math.max(10, now - state.timestamp); // Éviter les divisions par zéro
  const deltaXFromLast = touch.clientX - state.lastX;
  const deltaYFromLast = touch.clientY - state.lastY;
  
  // MODIFICATION: Réduire le coefficient d'inertie de 0.7 à 0.4
  // Cela réduit l'influence de la vélocité précédente
  state.velocityX = 0.4 * state.velocityX + 0.6 * (deltaXFromLast / deltaTime);
  state.velocityY = 0.4 * state.velocityY + 0.6 * (deltaYFromLast / deltaTime);
   
  // Calcul du delta depuis le DÉBUT du toucher
  const deltaXFromStart = touch.clientX - state.startX;
  
  // Base de rotation selon la direction de mouvement
  const baseAngle = movementDirection.current > 0 ? 0 : Math.PI;
  
  // MODIFICATION: Réduire la sensibilité par défaut
  const sensitivity = (window.__touchSensitivity || 1.0) * 0.7;
  
  // Calculer la rotation cible ABSOLUE depuis le début du toucher
  // MODIFICATION: Réduire le facteur de rotation
  const rotationOffset = deltaXFromStart * 0.003 * sensitivity;
  
  // Appliquer un easing pour une rotation plus naturelle
  const easedRotationOffset = animationUtils.easingFunctions.easeOutCubic(Math.abs(rotationOffset)) * Math.sign(rotationOffset);
  
  targetRotation.current.y = state.initialRotationY + easedRotationOffset;
  
  // Normaliser les positions tactiles
  const normalizedX = (touch.clientX / window.innerWidth) * 2 - 1;
  const normalizedY = (touch.clientY / window.innerHeight) * 2 - 1;
  
  // MODIFICATION: Réduire la puissance des courbes de réponse
  const xModified = Math.sign(normalizedX) * Math.pow(Math.abs(normalizedX), 1.0) * sensitivity;
  const yModified = Math.sign(normalizedY) * Math.pow(Math.abs(normalizedY), 1.0) * sensitivity;
  
  // Distance du centre pour la zone morte
  const distanceFromCenterX = Math.abs(xModified);
  
  // Position avec offset proportionnel au mouvement
  // MODIFICATION: Réduire les offsets
  const posOffsetX = xModified * config.maxPositionOffset * 0.8;
  const verticalFactor = Math.max(0, 1 - (distanceFromCenterX / config.centerWidthZone));
  
  // MODIFICATION: Réduire l'easing vertical
  const easedVerticalFactor = animationUtils.easingFunctions.easeOutQuad(verticalFactor) * 0.8;
  const posOffsetY = -yModified * config.maxPositionOffset * 0.3 * easedVerticalFactor;
  
  // Appliquer à la position cible
  targetPosition.current.x = initialPosition.current.x + posOffsetX;
  targetPosition.current.y = initialPosition.current.y + posOffsetY;
  
  // Rotation verticale adaptée à la direction avec easing réduit
  if (movementDirection.current > 0) {
    targetRotation.current.x = -yModified * config.maxVerticalAngle * easedVerticalFactor * 0.8;
  } else {
    targetRotation.current.x = yModified * config.maxVerticalAngle * easedVerticalFactor * 0.8;
  }
  
  // Assurer que Z reste à 0
  targetRotation.current.z = 0;
  
  // MODIFICATION: Désactiver complètement l'inertie si elle est source de problèmes
  // ou bien réduire fortement son influence
  if (config.inertiaEnabled) {
    // Stocker les vélocités pour l'inertie avec valeurs réduites
    if (inertiaSystem && inertiaSystem.current) {
      inertiaSystem.current.velocityRotY = state.velocityX * 0.0005 * sensitivity;
      inertiaSystem.current.velocityRotX = -state.velocityY * 0.0005 * sensitivity * 
                                         (movementDirection.current > 0 ? 1 : -1);
      inertiaSystem.current.applyInertia = true;
    }
  }
  
  // Mettre à jour la position pour le prochain événement
  state.lastX = touch.clientX;
  state.lastY = touch.clientY;
  state.timestamp = now;
  
  // Marquer le swipe comme actif pour bloquer les clics accidentels
  window.__isSwipingActive = true;
  touchSwipeActiveRef.current = true;
  
  // Nettoyer le timer existant s'il y en a un
  if (touchSwipeTimerRef.current) {
    clearTimeout(touchSwipeTimerRef.current);
  }
  
  // Définir un nouveau timer pour réinitialiser l'état de swipe
  touchSwipeTimerRef.current = setTimeout(() => {
    window.__isSwipingActive = false;
    touchSwipeActiveRef.current = false;
  }, 300);
}, [controlsEnabled, isAfterButtonClick, isOnTerrace, hasPerformedFirstTurn]);

/**
 * Gère le début d'un événement tactile et bloque les clics
 * @param {TouchEvent} e - Événement tactile natif
 */
const handleTouchStart = useCallback((e) => {
  if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
  
  // Vérifier qu'il s'agit bien d'un toucher à un doigt
  if (!e.touches || e.touches.length !== 1) return;
  
  const touch = e.touches[0];
  const state = touchStateRef.current;
  
  // Marquer immédiatement le swipe comme actif pour bloquer les clics
  window.__isSwipingActive = true;
  window.__isSwiping = true; // Pour compatibilité avec onSplineMouseUp
  touchSwipeActiveRef.current = true;
  
  // Initialiser l'état du toucher
  state.startX = touch.clientX;
  state.startY = touch.clientY;
  state.lastX = touch.clientX;
  state.lastY = touch.clientY;
  state.isDragging = true;
  state.timestamp = Date.now();
  state.velocityX = 0;
  state.velocityY = 0;
  
  // Stocker la rotation initiale
  if (cameraRef.current) {
    state.initialRotationY = cameraRef.current.rotation.y;
  }
  
  // Nettoyer le timer existant si présent
  if (touchSwipeTimerRef.current) {
    clearTimeout(touchSwipeTimerRef.current);
  }
  
  // Définir un nouveau timer pour réinitialiser l'état de swipe après un délai
  touchSwipeTimerRef.current = setTimeout(() => {
    window.__isSwipingActive = false;
    window.__isSwiping = false;
    touchSwipeActiveRef.current = false;
  }, 300);
  
  // Ne pas appeler e.preventDefault() ici - utiliser touch-action: none en CSS à la place
}, [controlsEnabled, isAfterButtonClick]);



/**
 * Gère la fin d'un toucher avec inertie
 * @param {TouchEvent} e - Événement tactile natif
 */
const handleTouchEnd = useCallback((e) => {
  // Réinitialiser l'état du toucher
  const state = touchStateRef.current;
  if (state.isDragging) {
    state.isDragging = false;

  }
    
   // Désactiver le flag de swipe après un court délai
  // pour éviter que les clics juste après le swipe ne se déclenchent
  setTimeout(() => {
    window.__isSwiping = false;
  }, 200); // 200ms est généralement suffisant
}, []);

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
  
  logger.log("État de la caméra sauvegardé");
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
  
  /**
   * Déplace la caméra d'une certaine distance
   * @param {Number} distance - Distance de déplacement
   */
  const moveCamera = useCallback((distance) => {
    if (!cameraRef.current || !controlsEnabled || isAfterButtonClick.current) return;
    
    // Position actuelle
    const currentZ = cameraRef.current.position.z;
    
    // Limites de la pièce
    const limits = cameraUtils.getCameraLimits();
    
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
  }, [controlsEnabled, invertMovementDirection]);
  
  /**
   * Déplace la caméra vers une position sans sauvegarder l'état actuel
   * Spécialement utile pour les vues comme le portfolio où on ne veut pas revenir
   * @param {Object} position - Position cible {x, y, z}
   * @param {Object} rotation - Rotation cible {x, y, z}
   * @returns {Boolean} - true si l'animation a commencé
   */
  const directCameraMovement = useCallback((position, rotation) => {
    if (!cameraRef.current) {
      logger.warn("Impossible de déplacer la caméra: référence caméra manquante");
      return false;
    }
    
    logger.log("Déplacement direct de la caméra sans sauvegarde d'état", {
      position,
      rotation
    });
    
    // Position actuelle comme point de départ de l'animation
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
    
    // Animation fluide vers la position cible
    const startTime = Date.now();
    const duration = 2000; // 2 secondes
    
    const animateDirect = () => {
      if (!cameraRef.current) return;
      
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Fonction d'easing
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      // Interpoler la position
      cameraRef.current.position.x = startPosition.x + (position.x - startPosition.x) * easedProgress;
      cameraRef.current.position.y = startPosition.y + (position.y - startPosition.y) * easedProgress;
      cameraRef.current.position.z = startPosition.z + (position.z - startPosition.z) * easedProgress;
      
      // Interpoler la rotation
      cameraRef.current.rotation.x = startRotation.x + (rotation.x - startRotation.x) * easedProgress;
      cameraRef.current.rotation.y = startRotation.y + (rotation.y - startRotation.y) * easedProgress;
      cameraRef.current.rotation.z = 0; // Toujours garder Z à 0
      
      // Mettre à jour également les positions/rotations cibles
      targetPosition.current = {
        x: cameraRef.current.position.x,
        y: cameraRef.current.position.y,
        z: cameraRef.current.position.z
      };
      
      targetRotation.current = {
        x: cameraRef.current.rotation.x,
        y: cameraRef.current.rotation.y,
        z: 0
      };
      
      // Continuer l'animation si nécessaire
      if (progress < 1) {
        requestAnimationFrame(animateDirect);
      } else {
        // Animation terminée
        logger.log("Déplacement direct terminé");
        
        // Ne pas modifier les drapeaux isAfterButtonClick ou controlsEnabled
        // pour que l'utilisateur puisse toujours interagir
      }
    };
    
    // Démarrer l'animation
    requestAnimationFrame(animateDirect);
    return true;
  }, []);
  
  const toggleControls = useCallback((enabled) => {
    // Activer ou désactiver les contrôles
    setControlsEnabled(enabled);
    isAfterButtonClick.current = !enabled;
    
    // Si on active les contrôles, réinitialiser également l'état précédent
    if (enabled) {
      previousCameraState.current = null;
    }
    
    logger.log(`Contrôles de caméra ${enabled ? 'activés' : 'désactivés'} sans restauration d'état`);
  }, []);

  const restoreControlsOnly = useCallback(() => {
    // Réactiver les contrôles simplement
    logger.log("Réactivation simple des contrôles sans restauration de position");
    setControlsEnabled(true);
    isAfterButtonClick.current = false;
    
    // Effacer l'état précédent pour éviter qu'il soit restauré plus tard
    previousCameraState.current = null;
    
    return true;
  }, []);

  // Nettoyer la boucle d'animation quand le composant est démonté
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    
  }, []);
  
  return {
    initializeCamera,
    handleWheel,
    handleMouseMove,
    handleTouchMove,
    handleTouchEnd,
    handleTouchStart,
    handleButtonClick,
    restorePreviousCameraState,
    moveCamera,
    directCameraMovement,
    toggleControls,
    restoreControlsOnly,
    isControlsEnabled: controlsEnabled,
    hasPreviousState: () => !!previousCameraState.current,
    isOnTerrace: () => isOnTerrace.current
  };
}