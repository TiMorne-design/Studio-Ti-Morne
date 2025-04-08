// constants/mediaQueries.js
export const mediaQueries = {
    mobile: '@media (max-width: 768px)',
    tablet: '@media (min-width: 769px) and (max-width: 1024px)',
    desktop: '@media (min-width: 1025px)'
  };
  
  // Styles mobiles pour les overlays
  export const mobileOverlayStyles = {
    container: {
      width: '100%',
      right: 0,
      borderRadius: 0
    },
    title: {
      fontSize: '1.8rem'
    },
    content: {
      padding: '15px'
    }
  };
  
  // Styles mobiles pour la barre de navigation
  export const mobileNavbarStyles = {
    toolbar: {
      flexDirection: 'column',
      padding: '8px 0'
    },
    menuButton: {
      fontSize: '14px',
      padding: '6px 12px'
    }
  };