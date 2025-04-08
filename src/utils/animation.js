/**
 * Utilitaires d'animation
 * Fournit des fonctions pour animer différentes propriétés de manière fluide
 */

// Collection de fonctions d'easing
const easingFunctions = {
    // Linéaire
    linear: t => t,
    
    // Fonctions cubiques
    easeInCubic: t => t * t * t,
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    
    // Fonctions quadratiques
    easeInQuad: t => t * t,
    easeOutQuad: t => 1 - (1 - t) * (1 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    
    // Fonctions exponentielles
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => 
      t === 0 ? 0 : 
      t === 1 ? 1 : 
      t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : 
      (2 - Math.pow(2, -20 * t + 10)) / 2
  };
  
  // Interpolation linéaire entre deux valeurs
  const lerp = (start, end, progress) => start + (end - start) * progress;
  
  /**
   * Applique une valeur à une propriété d'un objet, avec support pour les propriétés imbriquées
   * @param {Object} obj - L'objet à modifier
   * @param {String} prop - La propriété à modifier (ex: "position.x")
   * @param {*} value - La valeur à appliquer
   */
  const applyValue = (obj, prop, value) => {
    if (!obj) return;
    
    const props = prop.split('.');
    const lastProp = props.pop();
    const target = props.reduce((o, p) => o && o[p], obj);
    
    if (target) {
      target[lastProp] = value;
    }
  };
  
  /**
   * Anime une propriété d'un objet avec une fonction d'easing
   * @param {Object} options - Options d'animation
   * @param {Object} options.object - L'objet à animer
   * @param {String} options.property - La propriété à animer (peut être imbriquée comme "position.x")
   * @param {*} options.from - Valeur de départ
   * @param {*} options.to - Valeur d'arrivée
   * @param {Number} options.duration - Durée de l'animation en ms
   * @param {String|Function} options.easingFn - Fonction d'easing à utiliser
   * @param {Function} options.onProgress - Callback appelé à chaque étape de l'animation
   * @param {Function} options.onComplete - Callback appelé à la fin de l'animation
   * @returns {Number} - ID d'animation qui peut être utilisé pour l'annuler
   */
  const animate = ({ 
    object, 
    property, 
    from, 
    to, 
    duration = 1000, 
    easingFn = 'easeOutCubic',
    onProgress = null,
    onComplete = null 
  }) => {
    if (!object || to === undefined) return null;
    
    const startTime = Date.now();
    const easing = typeof easingFn === 'function' ? easingFn : easingFunctions[easingFn];
    
    if (!easing) {
      console.warn(`La fonction d'easing "${easingFn}" n'existe pas, utilisation de "easeOutCubic"`);
      easingFn = easingFunctions.easeOutCubic;
    }
    
    // ID d'animation pour pouvoir l'annuler
    const animationId = requestAnimationFrame(function step() {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easing(progress);
      
      // Valeur à appliquer
      let value;
      
      // Gestion différente selon le type de from/to
      if (typeof from === 'object' && from !== null && typeof to === 'object' && to !== null) {
        // Objet (ex: {x: 0, y: 0, z: 0})
        Object.entries(from).forEach(([key, startVal]) => {
          if (to[key] !== undefined) {
            value = lerp(startVal, to[key], easedProgress);
            applyValue(object, `${property}.${key}`, value);
          }
        });
      } else {
        // Valeur simple
        value = lerp(from, to, easedProgress);
        applyValue(object, property, value);
      }
      
      // Appeler le callback de progression si fourni
      if (onProgress) {
        onProgress(easedProgress, value);
      }
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    });
    
    return animationId;
  };
  
  /**
   * Annule une animation en cours
   * @param {Number} animationId - ID de l'animation à annuler
   */
  const cancelAnimation = (animationId) => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
  
  /**
   * Anime plusieurs propriétés d'un ou plusieurs objets en même temps
   * @param {Array} animations - Tableau d'objets d'options pour la fonction animate
   * @param {Function} onAllComplete - Callback appelé quand toutes les animations sont terminées
   */
  const animateMultiple = (animations, onAllComplete) => {
    if (!animations || animations.length === 0) {
      if (onAllComplete) onAllComplete();
      return;
    }
    
    let completed = 0;
    const animationIds = [];
    
    animations.forEach((animOptions) => {
      const onOriginalComplete = animOptions.onComplete;
      
      animOptions.onComplete = () => {
        // Appeler le callback original s'il existe
        if (onOriginalComplete) onOriginalComplete();
        
        // Vérifier si toutes les animations sont terminées
        completed++;
        if (completed === animations.length && onAllComplete) {
          onAllComplete();
        }
      };
      
      // Lancer l'animation et stocker son ID
      const animId = animate(animOptions);
      animationIds.push(animId);
    });
    
    // Retourner une fonction pour annuler toutes les animations
    return () => {
      animationIds.forEach(id => cancelAnimation(id));
    };
  };
  
  export default {
    easingFunctions,
    lerp,
    animate,
    cancelAnimation,
    animateMultiple
  };