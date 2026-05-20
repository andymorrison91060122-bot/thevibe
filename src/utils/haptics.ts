/**
 * High-fidelity vibration utility using Web Haptics API
 * Gracefully silent on unsupported environments (such as iOS Safari)
 */
export function triggerVibration(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('[Haptics] Failed to trigger vibration:', error);
    }
  }
}
