import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that tracks user inactivity.
 * Returns true if there have been no visual/interactivity events for `timeoutMs` milliseconds.
 */
export function useIdleTime(timeoutMs: number = 30000) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleActivity = () => {
      setIsIdle(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsIdle(true);
      }, timeoutMs);
    };

    // Interaction events to listen to
    const events = [
      'mousemove',
      'mousedown',
      'click',
      'scroll',
      'keydown',
      'touchstart',
      'touchmove',
      'pointermove',
      'pointerdown'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    handleActivity();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMs]);

  return isIdle;
}
