import { useState, useCallback } from 'react';

/**
 * Hook to manage toast notifications
 * @param {Object} defaultOptions - Default options for toast
 * @returns {Object} Toast state and functions
 */
export function useToast(defaultOptions = {}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [duration, setDuration] = useState(4000);

  const show = useCallback((msg, toastType = 'info', toastDuration = 4000) => {
    setMessage(msg);
    setType(toastType);
    setDuration(toastDuration);
    setOpen(true);
  }, []);

  const success = useCallback((msg, toastDuration = 4000) => {
    show(msg, 'success', toastDuration);
  }, [show]);

  const error = useCallback((msg, toastDuration = 4000) => {
    show(msg, 'error', toastDuration);
  }, [show]);

  const warning = useCallback((msg, toastDuration = 4000) => {
    show(msg, 'warning', toastDuration);
  }, [show]);

  const info = useCallback((msg, toastDuration = 4000) => {
    show(msg, 'info', toastDuration);
  }, [show]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return {
    open,
    message,
    type,
    duration,
    show,
    success,
    error,
    warning,
    info,
    close,
  };
}
