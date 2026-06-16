import { useEffect } from 'react';
import { logUrlParams } from '../utils/debugLog';

/**
 * Hook to automatically log URL parameters on component mount
 * @param {boolean} enabled - Enable/disable logging (default: true)
 */
export function useDebugLog(enabled = true) {
  useEffect(() => {
    if (enabled) {
      logUrlParams();
    }
  }, [enabled]);
}
