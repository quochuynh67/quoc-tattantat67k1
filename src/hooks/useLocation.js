import { useContext, useEffect } from 'react';
import { LocationContext } from '../contexts/LocationContext';
import { useGlobalToast } from '../contexts/ToastContext';

export function useLocation() {
  const context = useContext(LocationContext);
  const toast = useGlobalToast();

  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }

  useEffect(() => {
    if (context.error) {
      if (context.error.includes('permission') || context.error.includes('Permission')) {
        toast.error('Không có quyền truy cập vị trí. Vui lòng cấp quyền.', 5000);
      } else {
        toast.error(`Lỗi: ${context.error}`, 5000);
      }
    }
  }, [context.error, toast]);

  return context;
}
