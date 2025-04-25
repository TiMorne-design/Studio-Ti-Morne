import React, { memo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

const MobileControls = ({ onMoveForward, onMoveBackward }) => {
  const buttonStateRef = useRef({
    isPressed: false,
    direction: null,
    startX: 0,
    startY: 0
  });

  const styles = {
    container: {
      position: 'fixed',
      bottom: '20px',
      left: '0',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '30px',
      zIndex: 1000,
      pointerEvents: 'none'
    },
    button: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px',
      color: '#2A9D8F',
      border: 'none',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'none'
    }
  };

  const handleTouchStart = useCallback((e, direction) => {
    // Pas besoin de stopPropagation ici, ces boutons ont leurs propres zones distinctes
    const touch = e.touches[0];
    buttonStateRef.current = {
      isPressed: true,
      direction,
      startX: touch.clientX,
      startY: touch.clientY
    };

    // Visual feedback
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    e.currentTarget.style.transform = 'scale(1.1)';

    // Initial movement
    if (direction === 'forward') {
      onMoveForward();
    } else {
      onMoveBackward();
    }
  }, [onMoveForward, onMoveBackward]);

  const handleTouchEnd = useCallback((e) => {
    // Reset visual state
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    e.currentTarget.style.transform = 'scale(1)';
    
    // Reset button state
    buttonStateRef.current = {
      isPressed: false,
      direction: null,
      startX: 0,
      startY: 0
    };
  }, []);

  return (
    <div style={styles.container}>
      <button
        style={styles.button}
        onTouchStart={(e) => handleTouchStart(e, 'forward')}
        onTouchEnd={handleTouchEnd}
        aria-label="Avancer"
      >
        ▲
      </button>
      <button
        style={styles.button}
        onTouchStart={(e) => handleTouchStart(e, 'backward')}
        onTouchEnd={handleTouchEnd}
        aria-label="Reculer"
      >
        ▼
      </button>
    </div>
  );
};

MobileControls.propTypes = {
  onMoveForward: PropTypes.func.isRequired,
  onMoveBackward: PropTypes.func.isRequired
};

export default memo(MobileControls);