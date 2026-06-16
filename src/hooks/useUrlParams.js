import { useMemo } from 'react';

export function useUrlParams() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      locationToken: params.get('locationToken'),
      accessToken: params.get('accessToken'),
      allParams: Object.fromEntries(params),
    };
  }, []);
}
