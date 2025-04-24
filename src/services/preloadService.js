/**
 * Service de préchargement des ressources
 * Gère le préchargement des images, vidéos et scripts pour optimiser l'expérience
 */

// Stockage pour les ressources déjà préchargées
const cachedResources = new Set();

/**
 * Précharge une image et retourne une promesse
 * @param {String} src - URL de l'image à précharger
 * @returns {Promise} - Promesse résolue lorsque l'image est chargée
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Impossible de charger l'image: ${src}`));
  });
};

/**
 * Précharge une vidéo et retourne une promesse
 * @param {String} src - URL de la vidéo à précharger
 * @param {Boolean} preloadMetadata - Si true, précharge uniquement les métadonnées
 * @returns {Promise} - Promesse résolue lorsque la vidéo est chargée
 */
export const preloadVideo = (src, preloadMetadata = false) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = preloadMetadata ? 'metadata' : 'auto';
    video.src = src;
    video.muted = true;
    
    const eventName = preloadMetadata ? 'loadedmetadata' : 'loadeddata';
    
    video.addEventListener(eventName, () => {
      resolve(src);
    });
    
    video.addEventListener('error', () => {
      reject(new Error(`Impossible de charger la vidéo: ${src}`));
    });
  });
};

/**
 * Précharge un script et retourne une promesse
 * @param {String} src - URL du script à précharger
 * @returns {Promise} - Promesse résolue lorsque le script est chargé
 */
export const preloadScript = (src) => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    
    if (existingScript) {
      resolve(src);
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      cachedResources.add(src);
      resolve(src);
    };
    script.onerror = () => reject(new Error(`Impossible de charger le script: ${src}`));
    
    document.body.appendChild(script);
  });
};

/**
 * Précharge un groupe de ressources et suit la progression
 * @param {Object} resources - Objet contenant les ressources à précharger par type
 * @param {Function} onProgress - Callback de progression (0-100)
 * @param {Function} onComplete - Callback appelé lorsque tout est chargé
 * @param {Function} onError - Callback d'erreur
 */
export const preloadResourceGroup = ({ images = [], videos = [], scripts = [] }, onProgress, onComplete, onError) => {
  // Filtrer les ressources déjà chargées
  const filteredImages = images.filter(src => !cachedResources.has(src));
  const filteredVideos = videos.filter(src => !cachedResources.has(src));
  const filteredScripts = scripts.filter(src => !cachedResources.has(src));
  
  const resources = [
    ...filteredImages.map(src => ({ type: 'image', src })),
    ...filteredVideos.map(src => ({ type: 'video', src })),
    ...filteredScripts.map(src => ({ type: 'script', src }))
  ];
  
  const totalResources = resources.length;
  
  if (totalResources === 0) {
    if (onComplete) onComplete();
    return;
  }
  
  let loadedCount = 0;
  let hasError = false;
  
  const updateProgress = () => {
    loadedCount++;
    const percentage = Math.floor((loadedCount / totalResources) * 100);
    
    if (onProgress) onProgress(percentage);
    
    if (loadedCount === totalResources && !hasError) {
      if (onComplete) onComplete();
    }
  };
  
  const handleError = (error) => {
    hasError = true;
    if (onError) onError(error);
  };
  
  resources.forEach(resource => {
    let loadPromise;
    
    switch (resource.type) {
      case 'image':
        loadPromise = preloadImage(resource.src);
        break;
      case 'video':
        loadPromise = preloadVideo(resource.src);
        break;
      case 'script':
        loadPromise = preloadScript(resource.src);
        break;
      default:
        console.warn(`Type de ressource inconnu: ${resource.type}`);
        updateProgress();
        return;
    }
    
    loadPromise
      .then(src => {
        cachedResources.add(src);
        updateProgress();
      })
      .catch(error => {
        console.error(`Erreur lors du préchargement de ${resource.src}:`, error);
        updateProgress();
        handleError(error);
      });
  });
};

/**
 * Précharge les ressources essentielles pour l'application
 * @param {Function} onProgress - Callback de progression (0-100)
 * @returns {Promise} - Promesse résolue lorsque toutes les ressources sont chargées
 */
export const preloadEssentialResources = (onProgress) => {
  return new Promise((resolve, reject) => {
    const essentialResources = {
      images: [
        '/images/home-background.png',
        // Utilisez un fallback si nécessaire
        // '/images/fallback-background.jpg',
      ],
      videos: [
        '/videos/ENTRANCE_TM.mp4'
      ],
      scripts: [
        // Essayez la dernière version si la version spécifique échoue
        'https://unpkg.com/@splinetool/runtime@latest/build/spline.js'
      ]
    };
    
    preloadResourceGroup(essentialResources, onProgress, resolve, (error) => {
      console.warn("Erreur de préchargement, mais on continue:", error);
      // Résoudre au lieu de rejeter pour éviter de bloquer l'expérience
      resolve();
    });
  });
};