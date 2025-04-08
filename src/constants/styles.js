/**
 * Styles constants pour l'application
 * Centralise les styles pour éviter leur recréation à chaque rendu
 */

// Styles pour les overlays
export const overlayStyles = {
    container: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '50%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      color: '#333',
      padding: '40px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      borderTopLeftRadius: '20px',
      borderBottomLeftRadius: '20px',
      transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: '2.5rem',
      margin: 0,
      fontWeight: 400,
      color: '#2A9D8F',
      fontFamily: '"Reem Kufi", sans-serif',
      textTransform: 'uppercase'
    },
    closeButton: {
      background: 'rgba(42, 157, 143, 0.2)',
      color: '#333',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      cursor: 'pointer',
      transition: 'background 0.2s ease'
    }
  };
  
  // Styles pour les boutons et contrôles
  export const controlStyles = {
    returnButton: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      pointerEvents: 'auto'
    },
    button: {
      background: 'rgba(255, 255, 255, 0.8)',
      color: '#2A9D8F',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 15px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      fontFamily: '"Reem Kufi", sans-serif',
      fontWeight: 400,
      textTransform: 'uppercase',
      fontSize: '14px',
      transition: 'background 0.2s ease'
    }
  };
  
  // Styles pour la barre de navigation
  export const navbarStyles = {
    container: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'auto'
    },
    toolbar: {
      display: 'flex',
      width: '90%',
      padding: '12px 0',
      background: 'rgba(255, 255, 255, 0.8)',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      borderRadius: '20px 20px 0 0',
      margin: '0 auto'
    },
    leftSection: {
      display: 'flex', 
      flex: 1, 
      justifyContent: 'flex-end',
      marginRight: '80px',
      paddingLeft: '40px'
    },
    rightSection: {
      display: 'flex', 
      flex: 1, 
      justifyContent: 'flex-start',
      marginLeft: '80px',
      paddingRight: '40px'
    },
    menuButton: {
      background: 'transparent',
      color: '#2A9D8F',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '16px',
      fontWeight: 400,
      letterSpacing: '1px',
      fontFamily: '"Reem Kufi", sans-serif',
      textTransform: 'uppercase',
      transition: 'background 0.2s ease'
    },
    activeMenuButton: {
      background: 'rgba(42, 157, 143, 0.15)'
    },
    submenu: {
      position: 'absolute',
      bottom: '100%',
      left: '0',
      marginBottom: '5px',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '4px',
      width: '140px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      zIndex: 1001
    },
    submenuButton: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '8px 12px',
      border: 'none',
      background: 'transparent',
      color: '#2A9D8F',
      cursor: 'pointer',
      fontSize: '13px',
      fontFamily: '"Reem Kufi", sans-serif',
      textTransform: 'uppercase',
      borderBottom: '1px solid rgba(42, 157, 143, 0.1)',
      transition: 'background 0.2s ease'
    },
    scrollIndicator: {
      position: 'absolute', 
      left: '50%', 
      top: '-50px', 
      transform: 'translateX(-50%)',
      zIndex: 1002,
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    }
  };
  
  // Styles pour les sections de contenu des prestations
  export const prestationStyles = {
    section: {
      marginBottom: '40px'
    },
    sectionTitle: {
      fontSize: '1.8rem', 
      marginBottom: '15px', 
      color: '#C49A6C',
      fontFamily: '"Reem Kufi", sans-serif',
      fontWeight: 400,
      textTransform: 'uppercase'
    },
    paragraph: {
      fontSize: '1.1rem', 
      lineHeight: '1.6', 
      marginBottom: '20px',
      color: '#333'
    },
    cardsContainer: {
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px'
    },
    card: {
      background: 'rgba(240, 240, 240, 0.7)', 
      padding: '20px', 
      borderRadius: '12px',
      border: '1px solid rgba(42, 157, 143, 0.3)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    },
    cardTitle: { 
      margin: '0 0 10px 0', 
      fontSize: '1.2rem',
      fontFamily: '"Reem Kufi", sans-serif',
      color: '#2A9D8F'
    },
    cardText: { 
      margin: 0, 
      fontSize: '0.9rem', 
      color: '#555'
    }
  };