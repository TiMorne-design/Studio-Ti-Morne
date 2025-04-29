/**
 * Barre de navigation mobile
 * Version compacte et adaptée au tactile de la barre de navigation
 */
import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Barre de navigation optimisée pour mobile
 */
const MobileNavigationToolbar = ({ onNavigate, activeButtonId }) => {
  // État pour gérer l'ouverture/fermeture du menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // État pour le sous-menu portfolio
  const [showPortfolioSubmenu, setShowPortfolioSubmenu] = useState(false);

  // Styles pour le menu mobile
  const styles = {
    container: {
      position: 'fixed',
      bottom: '0',
      left: '0',
      width: '100%',
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none'
    },
    menuButton: {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      color: '#2A9D8F',
      border: 'none',
      fontSize: '24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      zIndex: 1520,
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent'
    },
    menu: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      padding: '20px 0 30px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transform: isMenuOpen ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s ease-out',
      pointerEvents: 'auto'
    },
    navItem: {
      width: '80%',
      padding: '12px 0',
      margin: '5px 0',
      backgroundColor: 'transparent',
      color: '#2A9D8F',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '400',
      textAlign: 'center',
      cursor: 'pointer',
      fontFamily: '"Reem Kufi", sans-serif',
      textTransform: 'uppercase',
      WebkitTapHighlightColor: 'transparent'
    },
    activeNavItem: {
      backgroundColor: 'rgba(42, 157, 143, 0.1)',
      fontWeight: '500'
    },
    submenu: {
      width: '80%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '8px',
      marginTop: '5px',
      overflow: 'hidden',
      maxHeight: showPortfolioSubmenu ? '500px' : '0',
      transition: 'max-height 0.3s ease-out',
      opacity: showPortfolioSubmenu ? 1 : 0
    },
    submenuItem: {
      width: '100%',
      padding: '10px 0',
      backgroundColor: 'transparent',
      color: '#2A9D8F',
      border: 'none',
      fontSize: '14px',
      textAlign: 'center',
      cursor: 'pointer',
      fontFamily: '"Reem Kufi", sans-serif',
      textTransform: 'uppercase',
      WebkitTapHighlightColor: 'transparent'
    }
  };

  // Toggle du menu
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
    // Reset du sous-menu quand on ferme le menu principal
    if (isMenuOpen) {
      setShowPortfolioSubmenu(false);
    }
  }, [isMenuOpen]);

  // Toggle du sous-menu portfolio
  const togglePortfolioSubmenu = useCallback((e) => {
    e.stopPropagation();
    setShowPortfolioSubmenu(prev => !prev);
  }, []);

  // Gestion de la navigation
  const handleNavigation = useCallback((view) => {
    onNavigate(view);
    setIsMenuOpen(false);
    setShowPortfolioSubmenu(false);
  }, [onNavigate]);

  return (
    <div style={styles.container}>
      {/* Bouton pour ouvrir/fermer le menu */}
      <button
        style={styles.menuButton}
        onTouchStart={(e) => {
          // Empêcher la propagation et le comportement par défaut
          e.stopPropagation();
          e.preventDefault();
          toggleMenu();
        }}
        // Garder onClick uniquement pour desktop
        onClick={(e) => {
          // Ne déclencher que s'il ne s'agit pas d'un appareil tactile
          if (window.matchMedia('(pointer: fine)').matches) {
            toggleMenu();
          }
        }}
        aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      {/* Menu principal */}
      <div style={styles.menu}>
        <button
          style={{
            ...styles.navItem,
            ...(activeButtonId === 'about' ? styles.activeNavItem : {})
          }}
          onClick={() => handleNavigation('about')}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleNavigation('about');
          }}
        >
          À Propos
        </button>

        <button
          style={{
            ...styles.navItem,
            ...(activeButtonId === 'prestations' ? styles.activeNavItem : {})
          }}
          onClick={() => handleNavigation('prestations')}
        >
          Prestations
        </button>

        <button
          style={{
            ...styles.navItem,
            ...(activeButtonId === 'portfolio' ? styles.activeNavItem : {})
          }}
          onClick={togglePortfolioSubmenu}
        >
          Portfolio {showPortfolioSubmenu ? '▲' : '▼'}
        </button>

        {/* Sous-menu portfolio */}
        <div style={styles.submenu}>
          <button
            style={styles.submenuItem}
            onClick={() => handleNavigation('dataviz')}
          >
            Data Viz
          </button>
          <button
            style={styles.submenuItem}
            onClick={() => handleNavigation('model3d')}
          >
            3D
          </button>
          <button
            style={styles.submenuItem}
            onClick={() => handleNavigation('site')}
          >
            Sites Experientiels
          </button>
        </div>
        
        {/* Bouton de contact */}
        <button
          style={{
            ...styles.navItem,
            ...(activeButtonId === 'contact' ? styles.activeNavItem : {})
          }}
          onClick={() => handleNavigation('contact')}
        >
          Contact
        </button>
      </div>
    </div>
  );
};

MobileNavigationToolbar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  activeButtonId: PropTypes.string
};

export default memo(MobileNavigationToolbar);