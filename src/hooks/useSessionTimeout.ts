import { useEffect, useRef, useCallback } from 'react';

const TIMEOUT_MS  = 60 * 60 * 1000; // 1 hour — auto logout
const WARNING_MS  = 55 * 60 * 1000; // 55 min — show warning modal

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;

export function useSessionTimeout(
  isLoggedIn: boolean,
  onTimeout: () => void,
  onShowWarning: () => void,
  onHideWarning: () => void,
) {
  const logoutTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (logoutTimer.current)  clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    onHideWarning();
    warningTimer.current = setTimeout(onShowWarning, WARNING_MS);
    logoutTimer.current  = setTimeout(onTimeout,     TIMEOUT_MS);
  }, [clearTimers, onHideWarning, onShowWarning, onTimeout]);

  useEffect(() => {
    if (!isLoggedIn) {
      clearTimers();
      onHideWarning();
      return;
    }

    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetTimers));
      clearTimers();
    };
  }, [isLoggedIn, resetTimers, clearTimers, onHideWarning]);

  return { resetTimers };
}
