/**
 * Hook pour la détection précise des types d'appareils
 * Fournit des informations détaillées sur le type d'appareil, son orientation et ses capacités
 */
import { useState, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';

const { logger } = debugUtils;

// Liste des expressions régulières pour la détection d'appareils
const DEVICE_PATTERNS = {
  // Patterns pour les mobiles
  MOBILE: {
    IPHONE: /iPhone/i,
    IPOD: /iPod/i,
    ANDROID_MOBILE: /Android.*Mobile/i,
    BLACKBERRY: /BlackBerry/i,
    WINDOWS_PHONE: /Windows Phone/i,
    IE_MOBILE: /IEMobile/i,
    OPERA_MINI: /Opera Mini/i
  },
  // Patterns pour les tablettes
  TABLET: {
    IPAD: /iPad/i,
    ANDROID_TABLET: /Android(?!.*Mobile)/i,
    WINDOWS_TABLET: /Windows.*Tablet/i,
    SURFACE: /Surface/i,
    XIAOMI_PAD: /XiaoMi|MIUI.*Pad|MIUI.*Tablet/i
  },
  // Patterns pour les bureaux
  DESKTOP: {
    WINDOWS: /Windows NT/i,
    MAC: /Macintosh/i,
    LINUX: /Linux(?!.*Android)/i
  }
};

// Dimensions généralement utilisées pour différents types d'appareils
const DEVICE_DIMENSIONS = {
  MOBILE_MAX_WIDTH: 767,
  TABLET_MIN_WIDTH: 768,
  TABLET_MAX_WIDTH: 1024,
  DESKTOP_MIN_WIDTH: 1025
};

/**
 * Hook personnalisé pour détecter le type d'appareil, son orientation et ses performances
 * @returns {Object} Informations détaillées sur l'appareil
 */
export default function useDeviceDetection() {
  // État initial pour les informations de l'appareil
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true, // Par défaut, on considère qu'on est sur desktop
    isLandscape: false,
    isLowPerformance: false,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    userAgent: navigator.userAgent,
    detectionMethod: 'initial'
  });

  /**
   * Vérifie si l'appareil correspond à un ensemble de patterns
   * @param {Object} patterns - Object contenant des RegExp à tester
   * @param {String} userAgent - User-Agent à tester
   * @returns {Boolean} - true si l'appareil correspond à l'un des patterns
   */
  const matchesPatterns = (patterns, userAgent) => {
    return Object.values(patterns).some(pattern => pattern.test(userAgent));
  };

  /**
   * Détecte si l'appareil est de faible performance
   * @returns {Boolean} - true si l'appareil est considéré comme peu performant
   */
  const checkPerformance = () => {
    const userAgent = navigator.userAgent;
    
    // 1. Détection basée sur l'agent utilisateur (appareils connus pour être moins performants)
    const isOldOrLowEndDevice = 
      /iPhone\s(5|6|7|8|SE)/i.test(userAgent) || // iPhones anciens
      /iPad\sMini/i.test(userAgent) ||           // iPad Mini
      /Android\s[4-6]/i.test(userAgent) ||       // Android 4-6
      /(MSIE|Trident)/i.test(userAgent);         // Internet Explorer
    
    // 2. Détection basée sur les capacités matérielles (si disponible)
    const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    const hasLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    const hasHighPixelRatio = window.devicePixelRatio > 2.5;
    
    // 3. Test des performances d'animation (peut être enrichi avec des benchmarks plus complexes)
    let animationPerformance = 1;
    try {
      const startTime = performance.now();
      for(let i = 0; i < 1000; i++) {
        Math.sqrt(i);
      }
      const endTime = performance.now();
      animationPerformance = endTime - startTime > 5 ? 0.5 : 1; // Pénalité si le test dépasse 5ms
    } catch (e) {
      // Ignorer si performance API n'est pas disponible
    }
    
    // Combinaison des facteurs pour décider si l'appareil est peu performant
    return isOldOrLowEndDevice || 
           (hasHighPixelRatio && hasLowMemory) || 
           (hasLowCores && hasLowMemory) ||
           (hasLowMemory && animationPerformance < 0.8);
  };

  /**
   * Détermine si l'appareil est réellement un appareil mobile/tablette et non un navigateur redimensionné
   * @returns {Boolean} - true si c'est un véritable appareil mobile/tablette
   */
  const isRealMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Vérifier si l'user agent correspond à un appareil mobile ou tablette
    const isMobileByUA = matchesPatterns(DEVICE_PATTERNS.MOBILE, userAgent);
    const isTabletByUA = matchesPatterns(DEVICE_PATTERNS.TABLET, userAgent);
    
    // Vérifier si le navigateur a des capacités tactiles
    const hasTouchCapability = 'ontouchstart' in window || 
                              navigator.maxTouchPoints > 0 || 
                              navigator.msMaxTouchPoints > 0;
    
    // Vérifier également si c'est un navigateur mobile spécifique
    const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
                              
    // Si c'est un appareil mobile/tablette ET a des capacités tactiles, c'est un vrai appareil mobile
    return (isMobileByUA || isTabletByUA || isMobileBrowser) && hasTouchCapability;
  };

  /**
   * Détection complète du type d'appareil avec plusieurs méthodes croisées
   */
  const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isLandscapeOrientation = screenWidth > screenHeight;
    
    // Vérifier d'abord si c'est un véritable appareil mobile/tablette
    const realMobileDevice = isRealMobileDevice();
    
    // Si ce n'est PAS un véritable appareil mobile, on considère que c'est un desktop
    if (!realMobileDevice) {
      setDeviceInfo({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLandscape: isLandscapeOrientation,
        isLowPerformance: false,
        screenWidth,
        screenHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        userAgent,
        detectionMethod: 'desktop-browser'
      });
      return;
    }
    
    // À partir d'ici, on sait que c'est un véritable appareil mobile/tablette,
    // donc on procède à la détection précise
    
    // Méthode 1: Détection basée sur l'User-Agent
    const isMobileByUA = matchesPatterns(DEVICE_PATTERNS.MOBILE, userAgent);
    const isTabletByUA = matchesPatterns(DEVICE_PATTERNS.TABLET, userAgent);
    
    // Méthode 2: Détection basée sur les dimensions d'écran pour les cas limites
    const minDimension = Math.min(screenWidth, screenHeight);
    const maxDimension = Math.max(screenWidth, screenHeight);
    
    // Tablettes sans User-Agent spécifique (comme certains Samsung)
    const isPossiblyTablet = minDimension >= 600 && maxDimension <= 1366;
    
    // Xiaomi Pad spécifique (ajout spécial)
    const isXiaomiPad = /XiaoMi/i.test(userAgent) || /MIUI/i.test(userAgent) || /Redmi/i.test(userAgent);
    
    // Prise de décision finale
    let isTablet = isTabletByUA || isXiaomiPad || (isPossiblyTablet && !isMobileByUA);
    let isMobile = isMobileByUA && !isTablet;
    
    // Vérifier si c'est un iPad qui se fait passer pour un Mac
    if (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) {
      isTablet = true;
      isMobile = false;
    }
    
    // Déterminer la méthode de détection principale
    let detectionMethod = 'mobile-detection';
    if (isTabletByUA || isXiaomiPad) detectionMethod = 'user-agent-tablet';
    else if (isMobileByUA) detectionMethod = 'user-agent-mobile';
    
    // Vérifier les performances
    const isLowPerformance = checkPerformance();
    
    // Log détaillé pour le débogage
    logger.log("Détection d'appareil mobile :", {
      realMobileDevice,
      userAgent,
      screenDimensions: `${screenWidth}x${screenHeight}`,
      byUserAgent: { isMobile: isMobileByUA, isTablet: isTabletByUA },
      finalDecision: { isMobile, isTablet },
      detectionMethod,
      isLowPerformance
    });
    
    // Mettre à jour l'état avec toutes les informations
    setDeviceInfo({
      isMobile,
      isTablet,
      isDesktop: !(isMobile || isTablet),
      isLandscape: isLandscapeOrientation,
      isLowPerformance,
      screenWidth,
      screenHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      userAgent,
      detectionMethod
    });
  };
  
  // Effectuer la détection au montage et lors des changements de taille/orientation
  useEffect(() => {
    // Détection initiale
    detectDevice();
    
    // Fonction pour mettre à jour lors des changements
    const handleResize = () => {
      detectDevice();
    };
    
    // Ajouter les listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Nettoyage des listeners
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  return deviceInfo;
}