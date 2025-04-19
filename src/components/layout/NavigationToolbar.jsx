/**
 * Barre de navigation principale
 * Affiche les options de navigation et gère les sous-menus
 */
import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { navbarStyles } from '../../constants/styles';

// Composant pour un élément de menu avec gestion du survol
const MenuItem = memo(({ item, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={() => onClick(item)}
      style={{
        ...navbarStyles.menuButton,
        ...(isActive ? navbarStyles.activeMenuButton : {}),
        background: isHovered && !isActive ? 'rgba(42, 157, 143, 0.05)' : isActive ? 'rgba(42, 157, 143, 0.15)' : 'transparent',
        ...(item.style || {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-expanded={isActive && item.hasSubmenu}
    >
      {item.label}
      {item.hasSubmenu && (
        <span style={{ fontSize: '10px', marginLeft: '3px' }}>
          {isActive ? '▲' : '▼'}
        </span>
      )}
    </button>
  );
});

MenuItem.propTypes = {
  item: PropTypes.object.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

// Composant pour un élément de sous-menu
const SubmenuItem = memo(({ item, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      key={item.id}
      onClick={() => onClick(item.view)}
      style={{
        ...navbarStyles.submenuButton,
        background: isHovered ? 'rgba(42, 157, 143, 0.1)' : 'transparent'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {item.label}
    </button>
  );
});

SubmenuItem.propTypes = {
  item: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
};

/**
 * Barre de navigation avec menus et sous-menus
 */
const NavigationToolbar = ({ onNavigate, isCameraControlsDisabled = false }) => {
  // État pour suivre le menu actif
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Configuration des menus et sous-menus
  const navItems = [
    {
      id: 'about',
      label: 'À PROPOS',
      style: { whiteSpace: 'nowrap' },
      view: 'about',
      hasSubmenu: false,
      position: 'left'
    },
    {
      id: 'prestations',
      label: 'PRESTATIONS',
      view: 'prestations',
      hasSubmenu: false,
      position: 'left'
    },
    {
      id: 'portfolio',
      label: 'PORTFOLIO',
      view: 'portfolio',
      hasSubmenu: true,
      position: 'right',
      submenu: [
        { id: 'dataviz', label: 'DATA VIZ', view: 'dataviz' },
        { id: '3d', label: '3D', view: 'model3d' },
        { id: 'site', label: 'SITES WEB', view: 'site' }
      ]
    },
    {
      id: 'contact',
      label: 'CONTACT',
      view: 'contact',
      hasSubmenu: false,
      position: 'right'
    }
  ];

  // Filtrer les éléments par position
  const leftItems = navItems.filter(item => item.position === 'left');
  const rightItems = navItems.filter(item => item.position === 'right');

  // Gestionnaire de clic sur un élément de menu
  const handleMenuClick = useCallback((item) => {
    // Si l'élément a un sous-menu, afficher ou masquer ce sous-menu
    if (item.hasSubmenu) {
      setActiveMenu(activeMenu === item.id ? null : item.id);
    } else {
      // Sinon, naviguer directement vers la vue correspondante
      onNavigate(item.view);
      // Et fermer tous les sous-menus
      setActiveMenu(null);
    }
  }, [activeMenu, onNavigate]);

  // Gestionnaire de clic sur un élément de sous-menu
  const handleSubmenuClick = useCallback((view) => {
    onNavigate(view);
    // Fermer le sous-menu après la navigation
    setActiveMenu(null);
  }, [onNavigate]);

  // Rendu d'un groupe d'éléments de menu
  const renderMenuGroup = useCallback((items) => (
    items.map(item => (
      <div key={item.id} style={{ position: 'relative' }}>
        <MenuItem 
          item={item} 
          isActive={activeMenu === item.id}
          onClick={handleMenuClick}
        />
        
        {/* Sous-menu */}
        {item.hasSubmenu && activeMenu === item.id && (
          <div style={navbarStyles.submenu}>
            {item.submenu.map(subItem => (
              <SubmenuItem 
                key={subItem.id}
                item={subItem} 
                onClick={handleSubmenuClick}
              />
            ))}
          </div>
        )}
      </div>
    ))
  ), [activeMenu, handleMenuClick, handleSubmenuClick]);
  
  // Styles pour l'animation de rotation du cercle et de l'icône de souris
  const rotationKeyframes = `
    @keyframes rotateCircle {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  
  return (
    <div style={navbarStyles.container}>
      <style>{rotationKeyframes}</style>
      <div style={{
        ...navbarStyles.toolbar,
        width: 'auto', 
        minWidth: '400px',
        maxWidth: '800px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        {/* Section gauche */}
        <div style={navbarStyles.leftSection}>
          {renderMenuGroup(leftItems)}
        </div>
        
        {/* Indicateur de défilement au centre */}
        {!isCameraControlsDisabled && (
          <div style={{
            ...navbarStyles.scrollIndicator,
            position: 'absolute',
            left: '50%',
            top: '-50px', 
            transform: 'translateX(-50%)',
            zIndex: 900, // Légèrement en-dessous pour que les boutons passent au dessus
            width: '100px',
            height: '100px'
          }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <svg 
                viewBox="0 0 100 100" 
                width="100" 
                height="100"
                style={{ animation: 'rotateCircle 10s linear infinite' }}
              >
                <path id="circle-text-path" 
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" 
                  fill="transparent" />
                <text style={{ fill: '#2A9D8F', fontFamily: '"Reem Kufi", sans-serif', fontSize: '11px', letterSpacing: '1px' }}>
                  <textPath xlinkHref="#circle-text-path" startOffset="5%">
                    SCROLLER POUR AVANCER
                  </textPath>
                </text>
              </svg>
              
              {/* Icône de souris au centre */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2A9D8F'
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="4" width="10" height="16" rx="5" stroke="#2A9D8F" strokeWidth="2" />
                  <rect x="11" y="8" width="2" height="4" rx="1" fill="#2A9D8F" />
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {/* Section droite */}
        <div style={navbarStyles.rightSection}>
          {renderMenuGroup(rightItems)}
        </div>
      </div>
    </div>
  );
};

NavigationToolbar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  isCameraControlsDisabled: PropTypes.bool
};

export default memo(NavigationToolbar);