import { useRef, useCallback, useEffect } from 'react';
import debugUtils from '../utils/debugUtils';
const { logger } = debugUtils;

/**
 * Hook pour gérer uniquement les interactions tactiles (swipe + inertie)
 * Remplace touch events par pointer events pour éviter le mix with mouse
 */
export default function TouchControls({ onMouseMove = null, sensitivity = 1.5, threshold = 3 }) {
  const isTouchingRef = useRef(false);
  const touchStateRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, lastTime: 0, totalX: 0, velocityX: 0, touchStartTime: 0 });
  const inertiaRef = useRef({ active: false, id: null });

  const stopInertia = useCallback(() => {
    if (inertiaRef.current.id) cancelAnimationFrame(inertiaRef.current.id);
    inertiaRef.current.active = false;
    inertiaRef.current.id = null;
    logger.log('Inertie stoppée');
  }, []);

  const initSwipe = useCallback(e => {
    if (e.pointerType !== 'touch') return;
    e.preventDefault();
    isTouchingRef.current = true;
    stopInertia();
    const { clientX, clientY } = e;
    const now = Date.now();
    touchStateRef.current = { startX: clientX, startY: clientY, lastX: clientX, lastY: clientY, lastTime: now, totalX: 0, velocityX: 0, touchStartTime: now };
    logger.log('Swipe start', clientX, clientY);
  }, [stopInertia]);

  const trackSwipe = useCallback(e => {
    if (!isTouchingRef.current || e.pointerType !== 'touch') return;
    const { clientX, clientY } = e;
    const state = touchStateRef.current;
    const now = Date.now();
    const dt = now - state.lastTime;
    const dx = clientX - state.lastX;
    state.totalX += dx;
    state.velocityX = dx / (dt || 1);
    state.lastX = clientX;
    state.lastY = clientY;
    state.lastTime = now;
    if (onMouseMove && Math.abs(state.totalX) > threshold) {
      // Normaliser sur [-1,1]
      let normX = ((clientX / window.innerWidth) * 2 - 1) * sensitivity;
      onMouseMove({ type: 'touchmove', normalizedX: normX, normalizedY: 0, isTouchEvent: true });
      e.preventDefault(); e.stopPropagation();
    }
  }, [onMouseMove, threshold, sensitivity]);

  const finishSwipe = useCallback(e => {
    if (e.pointerType !== 'touch' || !isTouchingRef.current) return;
    isTouchingRef.current = false;
    const state = touchStateRef.current;
    const duration = Date.now() - state.touchStartTime;
    let velocity = state.velocityX;
    let distance = state.totalX;
    // Appliquer inertie simple
    const decay = () => {
      if (!inertiaRef.current.active) return;
      velocity *= 0.95;
      distance += velocity * 16;
      const norm = (distance / (window.innerWidth/2)) * sensitivity;
      if (onMouseMove) onMouseMove({ type: 'touchmove', normalizedX: norm, normalizedY:0, isTouchEvent:true });
      if (Math.abs(velocity) > 0.01) {
        inertiaRef.current.id = requestAnimationFrame(decay);
      } else stopInertia();
    };
    inertiaRef.current.active = true;
    decay();
    logger.log('Swipe end, inertie démarrée');
  }, [onMouseMove, sensitivity, stopInertia]);

  useEffect(() => {
    const elm = document.querySelector('canvas') || document.getElementById('canvas');
    if (!elm) return;
    elm.style.touchAction = 'none';
    elm.addEventListener('pointerdown', initSwipe, { passive: false });
    elm.addEventListener('pointermove', trackSwipe, { passive: false });
    elm.addEventListener('pointerup', finishSwipe);
    return () => {
      elm.removeEventListener('pointerdown', initSwipe);
      elm.removeEventListener('pointermove', trackSwipe);
      elm.removeEventListener('pointerup', finishSwipe);
    };
  }, [initSwipe, trackSwipe, finishSwipe]);

  return { stopInertia };
}
